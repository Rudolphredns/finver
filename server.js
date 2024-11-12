import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import mysql from "mysql2";
import bodyParser from "body-parser";
import express from 'express';



const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// ตั้งค่า MySQL
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'finver',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// เชื่อมต่อฐานข้อมูล
db.getConnection((err, connection) => {
  if (err) {
    console.error('ไม่สามารถเชื่อมต่อกับฐานข้อมูล:', err);
  } else {
    console.log('เชื่อมต่อกับฐานข้อมูล MySQL สำเร็จ!');
    connection.release();
  }
});


const expressApp = express();
expressApp.use(bodyParser.json());


expressApp.post('/webhook', (req, res) => {
  const event = req.body;
  console.log('Received Webhook:'); 

  
  if (event.type === 'user.updated') {
    const updatedUsername = event.data.username;
    const clerkUserId = event.data.id;
    console.log(`Username updated to: ${updatedUsername}, Clerk User ID: ${clerkUserId}`);

    
    const updateQuery = 'UPDATE users SET username = ? WHERE clerk_user_id = ?';
    db.query(updateQuery, [updatedUsername, clerkUserId], (err, results) => {
      if (err) {
        console.error("Error updating username in database:", err);
        res.status(500).send('Internal Server Error');
      } else {
        console.log(`Username for user ${clerkUserId} updated successfully.`);
        res.status(200).send('Webhook processed');
      }
    });
  } else {
    console.log("Invalid event type:", event.type);
    res.status(400).send('Invalid event');
  }
});


app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    if (req.url?.startsWith('/webhook')) {
      expressApp(req, res);
    } else {
      handler(req, res);
    }
  });

  const io = new Server(httpServer);

  let onlineUser = [];
  let videoQueue = [];

  //user เชื่อมต่อ >>
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id); // log check ดู socket

    socket.on("addnewUser", (clerkUser) => {
      if (clerkUser && !onlineUser.some((user) => user?.userId === clerkUser.id)) {
        console.log(`User is Connected: ${clerkUser.username}, ${clerkUser.email}`); //ปัญหาตอนนี้ยังหา email ของ user ไม่เจอ

        
        const checkQuery = 'SELECT * FROM users WHERE clerk_user_id = ?'; //เรียกดูว่า clerkId นี้มีแล้วยัง

        db.query(checkQuery, [clerkUser.id], (err, results) => {
          if (err) {
            console.error("Error checking user in database:", err); //ถ้าเกิด error เรียนดูว่า error จากอะไร
            connection.release();  //ปิดการเชื่อมต่อ ข้อมูล
            return;
          }

          // ถ้า เป็น user ใหม่ ให้ insert เข้า database (Email null)
          if (results.length === 0) {
            const insertQuery = `INSERT INTO users (clerk_user_id, username, email, role) VALUES (?, ?, ?, ?)`;
            db.query(insertQuery, [clerkUser.id, clerkUser.username, clerkUser.email, clerkUser.role], (err, results) => {
              if (err) {
                console.error("Error inserting user into database:", err);
                connection.release(); 
              } else {
                console.log(`User ถูกเพิ่มเข้าฐานข้อมูลด้วย clerkID: ${clerkUser.id}, Clerk username: ${clerkUser.username}`);
                connection.release(); 

                socket.emit('redirectTo', '/select_interest');

              }
            });
          } else {
            console.log(`User  clerkID: ${clerkUser.id},${clerkUser.username} มีอยู่ในฐานข้อมูลอยู่แล้ว`);
            
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

   
    const handleLeaveRoom = (roomId) => {
      const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
      clientsInRoom.forEach((clientSocketId) => {
        io.to(clientSocketId).emit("peerLeftRoom");
      });
      clientsInRoom.forEach((clientSocketId) => {
        io.sockets.sockets.get(clientSocketId)?.leave(roomId);
      });
      console.log(`Room ${roomId} has been closed.`);
    };


    // {With Out Interest}

    socket.on("matchVideo", (data) => {
      // ลบผู้ใช้ที่อาจอยู่ในคิวก่อนหน้านี้
      videoQueue = videoQueue.filter((user) => user.socketId !== socket.id);

      setTimeout(() => {
        console.log("Attempting to match video for user:", data.userId);

        const requestingUser = onlineUser.find((user) => user.userId === data.userId);
        if (!requestingUser) {
          console.log("User not found for matching");
          return;
        }

        if (videoQueue.length > 0) {
          const matchedUser = videoQueue.shift();
          const roomId = uuidv4();

          socket.join(roomId);
          io.sockets.sockets.get(matchedUser.socketId)?.join(roomId);

          io.to(requestingUser.socketId).emit("videoMatched", { peerUser: matchedUser.profile, roomId, initiator: true });
          io.to(matchedUser.socketId).emit("videoMatched", { peerUser: requestingUser.profile, roomId, initiator: false });

          console.log(`User ${requestingUser.userId} matched with ${matchedUser.userId} for video call in room ${roomId}`);

          // เมื่อผู้ใช้ disconnect หรือ leaveRoom ให้ออกจากห้อง
          socket.on("disconnect", () => handleLeaveRoom(roomId));
          io.sockets.sockets.get(matchedUser.socketId)?.on("disconnect", () => handleLeaveRoom(roomId));
        } else {
          videoQueue.push(requestingUser);
          console.log(`User ${requestingUser.userId} added to video queue`);
        }
      }, 500); // Short delay to ensure socket readiness
    });



    

    // { With Interest }
    // const getUserInterest = (userId, callback) => {
    //   const interestQuery = 'SELECT interests FROM users WHERE clerk_user_id = ?';
    //   db.query(interestQuery, [userId], (err, results) => {
    //     if (err) {
    //       console.error("Error retrieving user interest from database:", err);
    //       callback(null);
    //     } else {
    //       if (results.length > 0 && results[0].interests) {  // แก้เป็น results[0].interests
    //         const interestsArray = results[0].interests.split(","); // แยกค่า interest ด้วยจุลภาค
    //         console.log("Retrieved interests:", interestsArray); // Debug ดูค่า interests ที่แยกออกมา
    //         callback(interestsArray);
    //       } else {
    //         console.log("No interest found or interest is undefined for user:", userId);
    //         callback(null);
    //       }
    //     }
    //   });
    // };
    
    // socket.on("matchVideo", (data) => {
    //   // กำจัดผู้ใช้ที่ตัดการเชื่อมต่อจาก videoQueue
    //   videoQueue = videoQueue.filter((user) => user.socketId !== socket.id);
    
    //   setTimeout(() => {
    //     const requestingUser = onlineUser.find((user) => user.userId === data.userId);
    
    //     if (!requestingUser) {
    //       console.log("ไม่พบผู้ใช้ที่ต้องการจับคู่");
    //       return;
    //     }
    
    //     // ดึงข้อมูล interest ของผู้ใช้ที่ต้องการจับคู่จากฐานข้อมูล
    //     getUserInterest(requestingUser.userId, (requestingUserInterests) => {
    //       if (!requestingUserInterests) {
    //         console.log("User has no interest defined, cannot proceed with matching.");
    //         return;
    //       }
    
    //       console.log("Requesting User Interests:", requestingUserInterests); // Debug interests ของผู้ใช้ที่ต้องการจับคู่
    //       console.log("Current Video Queue:", videoQueue); // Debug ดู videoQueue ปัจจุบัน
    
    //       // ค้นหาผู้ใช้ใน videoQueue ที่มี interest ตรงกัน
    //       const matchedUserIndex = videoQueue.findIndex((user) =>
    //         Array.isArray(user.interests) && user.interests.some((interest) => requestingUserInterests.includes(interest))
    //       );
    
    //       if (matchedUserIndex > -1) {
    //         const matchedUser = videoQueue[matchedUserIndex];
    //         videoQueue.splice(matchedUserIndex, 1); // นำ matchedUser ออกจาก queue
    //         const roomId = uuidv4();
    
    //         // เพิ่มผู้ใช้ทั้งคู่เข้าห้อง video call
    //         socket.join(roomId);
    //         io.sockets.sockets.get(matchedUser.socketId)?.join(roomId);
    
    //         io.to(requestingUser.socketId).emit("videoMatched", { peerUser: matchedUser.profile, roomId, initiator: true });
    //         io.to(matchedUser.socketId).emit("videoMatched", { peerUser: requestingUser.profile, roomId, initiator: false });
    
    //         console.log(`จับคู่สำเร็จ: User ${requestingUser.userId} matched with ${matchedUser.userId} in room ${roomId}`);
    
    //         socket.on("disconnect", () => handleLeaveRoom(roomId));
    //         io.sockets.sockets.get(matchedUser.socketId)?.on("disconnect", () => handleLeaveRoom(roomId));
    //       } else {
    //         // กรณีไม่มีผู้ใช้ที่ interests ตรงกันใน queue
    //         requestingUser.interests = requestingUserInterests; // เก็บ interests ของผู้ใช้
    //         videoQueue.push(requestingUser); // เพิ่มผู้ใช้เข้า queue
    //       }
    //     });
    //   }, 500);
    // });
    

    // Handle leave room and other events...
    socket.on("leaveRoom", ({ roomId }) => {
      console.log(`User ${socket.id} leaving room ${roomId}`);
      videoQueue = videoQueue.filter((user) => user.socketId !== socket.id); // ลบผู้ใช้จากคิว
      handleLeaveRoom(roomId);
    });




    socket.on("disconnect", () => {
      onlineUser = onlineUser.filter((user) => user.socketId !== socket.id);
      videoQueue = videoQueue.filter((user) => user.socketId !== socket.id);
      io.emit("getUser", onlineUser);
      console.log(`User ${socket.id} disconnected`);
    });
  });

  console.log("Server is starting...");

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
