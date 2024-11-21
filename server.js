import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import mysql from "mysql2";
import bodyParser from "body-parser";
import express from "express";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// ตั้งค่า MySQL
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "finver",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// เชื่อมต่อฐานข้อมูล
db.getConnection((err) => {
  if (err) {
    console.error("ไม่สามารถเชื่อมต่อกับฐานข้อมูล:", err);
  } else {
    console.log("เชื่อมต่อกับฐานข้อมูล MySQL สำเร็จ!");
  }
});

const expressApp = express();
expressApp.use(bodyParser.json());

// Webhook สำหรับอัปเดตข้อมูลผู้ใช้
expressApp.post("/webhook", (req, res) => {
  const event = req.body;
  console.log("Received Webhook:", event);

  if (event.type === "user.updated") {
    const updatedUsername = event.data.username;
    const clerkUserId = event.data.id;

    console.log(`Updating username to: ${updatedUsername}, Clerk User ID: ${clerkUserId}`);

    const updateQuery = "UPDATE users SET username = ? WHERE clerk_user_id = ?";
    db.query(updateQuery, [updatedUsername, clerkUserId], (err) => {
      if (err) {
        console.error("Error updating username in database:", err);
        res.status(500).send("Internal Server Error");
      } else {
        console.log(`Username for user ${clerkUserId} updated successfully.`);
        res.status(200).send("Webhook processed");
      }
    });
  } else {
    console.log("Invalid event type:", event.type);
    res.status(400).send("Invalid event");
  }
});

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    if (req.url?.startsWith("/webhook")) {
      expressApp(req, res);
    } else {
      handler(req, res);
    }
  });

  const io = new Server(httpServer);
  let onlineUser = [];
  let videoQueue = [];

  // ฟังก์ชันสำหรับบันทึกประวัติการจับคู่
  const saveMatchHistory = (userId1, userId2) => {
    const insertQuery = "INSERT INTO match_history (user1_id, user2_id) VALUES (?, ?)";
    db.query(insertQuery, [userId1, userId2], (err) => {
      if (err) {
        console.error("Error saving match history:", err);
      } else {
        console.log(`Match history saved: ${userId1} <-> ${userId2}`);
      }
    });
  };

  // ฟังก์ชันสำหรับตรวจสอบว่าผู้ใช้สองคนเคยจับคู่กันหรือยัง
  const hasMatchedBefore = (userId1, userId2, callback) => {
    const checkQuery =
      "SELECT * FROM match_history WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)";
    db.query(checkQuery, [userId1, userId2, userId2, userId1], (err, results) => {
      if (err) {
        console.error("Error checking match history:", err);
        callback(false);
      } else {
        callback(results.length > 0);
      }
    });
  };

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("addnewUser", (clerkUser) => {
      if (clerkUser && !onlineUser.some((user) => user?.userId === clerkUser.id)) {
        console.log(`User connected: ${clerkUser.username}, ${clerkUser.email || "Email not provided"}`);

        const checkQuery = "SELECT * FROM users WHERE clerk_user_id = ?";
        db.query(checkQuery, [clerkUser.id], (err, results) => {
          if (err) {
            console.error("Error checking user in database:", err);
            return;
          }

          if (results.length === 0) {
            const insertQuery = `INSERT INTO users (clerk_user_id, username, email, role) VALUES (?, ?, ?, ?)`;
            db.query(insertQuery, [clerkUser.id, clerkUser.username, clerkUser.email || null, clerkUser.role], (err) => {
              if (err) {
                console.error("Error inserting user into database:", err);
              } else {
                console.log(`User added to database: ${clerkUser.username}`);
                socket.emit("redirectTo", "/select_interest");
              }
            });
          } else {
            console.log(`User already exists in database: ${clerkUser.username}`);
          }
        });

        onlineUser.push({
          userId: clerkUser.id,
          socketId: socket.id,
          profile: clerkUser,
        });

        io.emit("getUser", onlineUser);
      }
    });

    const getUserInterest = (userId, callback) => {
      const interestQuery = "SELECT interests FROM users WHERE clerk_user_id = ?";
      db.query(interestQuery, [userId], (err, results) => {
        if (err) {
          console.error("Error retrieving user interest from database:", err);
          callback(null);
        } else {
          if (results.length > 0 && typeof results[0].interests === "string") {
            const interestsString = results[0].interests;
            callback(interestsString);
          } else {
            console.log("No valid interests found for user:", userId);
            callback("");
          }
        }
      });
    };

    socket.on("matchVideo", (data) => {
      videoQueue = videoQueue.filter((user) => user.socketId !== socket.id);
    
      setTimeout(() => {
        const requestingUser = onlineUser.find((user) => user.userId === data.userId);
    
        if (!requestingUser) {
          console.log("Requesting user not found.");
          return;
        }
    
        // ดึงข้อมูล gender และ sex_interest
        const getUserDetails = (userId, callback) => {
          const userQuery = "SELECT gender, sex_interest, interests FROM users WHERE clerk_user_id = ?";
          db.query(userQuery, [userId], (err, results) => {
            if (err) {
              console.error("Error retrieving user details:", err);
              callback(null);
            } else if (results.length > 0) {
              callback(results[0]);
            } else {
              console.log("User details not found for:", userId);
              callback(null);
            }
          });
        };
    
        getUserDetails(requestingUser.userId, (requestingUserDetails) => {
          if (!requestingUserDetails) {
            console.log("Requesting user details could not be fetched.");
            return;
          }
    
          const { gender, sex_interest, interests } = requestingUserDetails;
          const requestingUserInterests = interests.split(",").map((interest) => interest.trim());
    
          const checkMatches = async () => {
            for (const user of videoQueue) {
              const matchedUserDetails = await new Promise((resolve) =>
                getUserDetails(user.userId, resolve)
              );
    
              if (!matchedUserDetails) continue;
    
              const {
                gender: matchedUserGender,
                sex_interest: matchedUserSexInterest,
                interests: matchedUserInterests,
              } = matchedUserDetails;
    
              const interestsArray = matchedUserInterests.split(",").map((interest) => interest.trim());
    
              // เช็คเพศและความสนใจในเพศ
              const isGenderMatch =
                (sex_interest === "any" || sex_interest === matchedUserGender) &&
                (matchedUserSexInterest === "any" || matchedUserSexInterest === gender);
    
              if (!isGenderMatch) {
                console.log(`Gender or sex interest mismatch: ${requestingUser.userId} with ${user.userId}`);
                continue;
              }
    
              // เช็คความสนใจที่ตรงกัน
              const matchingInterests = interestsArray.filter((interest) =>
                requestingUserInterests.includes(interest)
              );
    
              // ตรวจสอบว่าเคยจับคู่กันแล้วหรือไม่
              const hasMatched = await new Promise((resolve) =>
                hasMatchedBefore(requestingUser.userId, user.userId, resolve)
              );
    
              if (matchingInterests.length >= 3 && !hasMatched) {
                const matchedUser = user;
    
                videoQueue = videoQueue.filter((u) => u.userId !== matchedUser.userId);
    
                const roomId = uuidv4();
                socket.join(roomId);
                io.sockets.sockets.get(matchedUser.socketId)?.join(roomId);
    
                io.to(requestingUser.socketId).emit("videoMatched", {
                  peerUser: matchedUser.profile,
                  roomId,
                  initiator: true,
                });
                io.to(matchedUser.socketId).emit("videoMatched", {
                  peerUser: requestingUser.profile,
                  roomId,
                  initiator: false,
                });
    
                console.log(`Matched users: ${requestingUser.userId} with ${matchedUser.userId} in room ${roomId}`);
    
                //saveMatchHistory(requestingUser.userId, matchedUser.userId);
    
                return;
              }
            }
    
            requestingUser.interests = requestingUserInterests;
            requestingUser.gender = gender;
            requestingUser.sex_interest = sex_interest;
    
            videoQueue.push(requestingUser);
            console.log(`User added to videoQueue: ${requestingUser.userId}`);
          };
    
          checkMatches();
        });
      }, 500);
    });

    socket.on("leaveRoom", ({ roomId }) => {
      console.log(`User ${socket.id} leaving room ${roomId}`);
      videoQueue = videoQueue.filter((user) => user.socketId !== socket.id);
    });

    socket.on("disconnect", () => {
      onlineUser = onlineUser.filter((user) => user.socketId !== socket.id);
      videoQueue = videoQueue.filter((user) => user.socketId !== socket.id);
      io.emit("getUser", onlineUser);
      console.log(`User ${socket.id} disconnected`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});