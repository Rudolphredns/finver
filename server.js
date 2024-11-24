import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import mysql from "mysql2";
import bodyParser from "body-parser";
import express from "express";
import rateLimit from "express-rate-limit";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// ตั้งค่า MySQL
const db = mysql.createPool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "finver",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ตรวจสอบการเชื่อมต่อฐานข้อมูล
db.getConnection((err) => {
  if (err) {
    console.error("ไม่สามารถเชื่อมต่อกับฐานข้อมูล:", err);
  } else {
    console.log("เชื่อมต่อกับฐานข้อมูล MySQL สำเร็จ!");
  }
});

const expressApp = express();
expressApp.use(bodyParser.json());

// เพิ่ม Rate Limiting
expressApp.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 นาที
    max: 100, // จำกัด 100 requests ต่อ IP
  })
);

// Health Check Endpoint
expressApp.get("/health", (req, res) => {
  res.status(200).send("Server is healthy!");
});

// Webhook สำหรับอัปเดตข้อมูลผู้ใช้
expressApp.post("/webhook", (req, res) => {
  const event = req.body;

  if (event.type === "user.updated") {
    const updatedUsername = event.data.username;
    const clerkUserId = event.data.id;

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

  const io = new Server(httpServer, {
    cors: {
      origin: dev ? "*" : ["184.82.64.128:3000"],
      methods: ["GET", "POST"],
    },
  });

  let onlineUser = [];
  let videoQueue = [];

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Event Handlers
    const handleAddNewUser = (clerkUser) => {
      if (!clerkUser || onlineUser.some((user) => user?.userId === clerkUser.id)) return;
      onlineUser.push({
        userId: clerkUser.id,
        socketId: socket.id,
        profile: clerkUser,
      });
      io.emit("getUser", onlineUser);
    };

    const handleDisconnect = () => {
      onlineUser = onlineUser.filter((user) => user.socketId !== socket.id);
      videoQueue = videoQueue.filter((user) => user.socketId !== socket.id);
      io.emit("getUser", onlineUser);
      console.log(`User ${socket.id} disconnected`);
    };

    socket.on("addnewUser", handleAddNewUser);
    socket.on("disconnect", handleDisconnect);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
