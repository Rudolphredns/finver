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
  console.log('Received Webhook:', event);  // ดูข้อมูลทั้งหมด

  
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

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("addnewUser", (clerkUser) => {
      if (clerkUser && !onlineUser.some((user) => user?.userId === clerkUser.id)) {
        console.log(`User is Connected: ${clerkUser.username}, ${clerkUser.email}`);

        
        const checkQuery = 'SELECT * FROM users WHERE clerk_user_id = ?';
        db.query(checkQuery, [clerkUser.id], (err, results) => {
          if (err) {
            console.error("Error checking user in database:", err);
            return;
          }

          if (results.length === 0) {
           
            const insertQuery = `INSERT INTO users (clerk_user_id, username, email, role) VALUES (?, ?, ?, ?)`;
            db.query(insertQuery, [clerkUser.id, clerkUser.username, clerkUser.email, clerkUser.role], (err, results) => {
              if (err) {
                console.error("Error inserting user into database:", err);
              } else {
                console.log(`User ถูกเพิ่มเข้าฐานข้อมูลด้วย clerkID: ${clerkUser.id}, Clerk username: ${clerkUser.username}`);
              }
            });
          } else {
            console.log(`User  clerkID: ${clerkUser.id},${clerkUser.username} มีอยู่ในฐานข้อมูลอยู่แล้ว`);
          }
        });
      }
    });

    // Handle video matching and other socket events...
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

    socket.on("matchVideo", (data) => {
      videoQueue = videoQueue.filter((user) => user.socketId !== socket.id);

      setTimeout(() => {
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

          socket.on("disconnect", () => handleLeaveRoom(roomId));
          io.sockets.sockets.get(matchedUser.socketId)?.on("disconnect", () => handleLeaveRoom(roomId));
        } else {
          videoQueue.push(requestingUser);
        }
      }, 500);
    });

    // Handle leave room and other events...
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
