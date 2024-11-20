import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  let onlineUser = [];
  let videoQueue = [];

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // เพิ่มผู้ใช้ใหม่ในระบบ
    socket.on("addnewUser", (clerkUser) => {
      console.log("Received user profile:", clerkUser);
      if (clerkUser && !onlineUser.some((user) => user?.userId === clerkUser.id)) {
        onlineUser.push({
          userId: clerkUser.id,
          socketId: socket.id,
          profile: {
            name: clerkUser.fullName || clerkUser.username || `User_${socket.id.slice(0, 6)}`,
            email: clerkUser.emailAddresses?.[0]?.emailAddress || "Unknown Email",
            ...clerkUser,
          },
        });
        io.emit("getUser", onlineUser);
        console.log("Updated onlineUser list:", onlineUser);
      }
    });

    // ฟังก์ชันออกจากห้อง
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

    // การจับคู่วิดีโอ
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

          console.log(`Matched Room: ${roomId}`);
          console.log(`Requesting User: ${requestingUser.profile.name}`);
          console.log(`Matched User: ${matchedUser.profile.name}`);

          // เพิ่มดีเลย์ก่อนส่งข้อมูลชื่อคู่สนทนา
          setTimeout(() => {
            io.to(requestingUser.socketId).emit("peerUserInfo", { name: matchedUser.profile.name || "Anonymous User" });
            io.to(matchedUser.socketId).emit("peerUserInfo", { name: requestingUser.profile.name || "Anonymous User" });

            console.log(`Sent peerUserInfo to both users in Room: ${roomId}`);
          }, 5000); // ดีเลย์ 5 วินาที

          io.to(requestingUser.socketId).emit("videoMatched", { peerUser: matchedUser.profile, roomId, initiator: true });
          io.to(matchedUser.socketId).emit("videoMatched", { peerUser: requestingUser.profile, roomId, initiator: false });

          // ตรวจจับการออกจากระบบ
          socket.once("disconnect", () => handleLeaveRoom(roomId));
          io.sockets.sockets.get(matchedUser.socketId)?.once("disconnect", () => handleLeaveRoom(roomId));
        } else {
          videoQueue.push(requestingUser);
          console.log(`User ${requestingUser.userId} added to video queue`);
        }
      }, 500); // Short delay to ensure socket readiness
    });

    // รับ event leaveRoom จาก client และลบออกจากคิว
    socket.on("leaveRoom", ({ roomId }) => {
      console.log(`User ${socket.id} leaving room ${roomId}`);
      videoQueue = videoQueue.filter((user) => user.socketId !== socket.id); // ลบผู้ใช้จากคิว
      handleLeaveRoom(roomId);
    });

    // เมื่อผู้ใช้ disconnect ให้ลบออกจาก videoQueue และ onlineUser
    socket.on("disconnect", () => {
      onlineUser = onlineUser.filter((user) => user.socketId !== socket.id);
      videoQueue = videoQueue.filter((user) => user.socketId !== socket.id); // ลบผู้ใช้จากคิวเมื่อ disconnect
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
