import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { v4 as uuidv4 } from 'uuid';

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

    socket.on("addnewUser", (clerkUser) => {
      if (clerkUser && !onlineUser.some((user) => user?.userId === clerkUser.id)) {
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
        io.to(clientSocketId).emit("peerLeftRoom"); // แจ้งให้ผู้ใช้ในห้องทราบว่ามีการออกจากห้อง
      });
      clientsInRoom.forEach((clientSocketId) => {
        io.sockets.sockets.get(clientSocketId)?.leave(roomId); // นำทุกคนออกจากห้อง
      });
      console.log(`Room ${roomId} has been closed.`);
    };

    socket.on("matchVideo", (data) => {
      setTimeout(() => {
        console.log('Attempting to match video for user:', data.userId);

        const requestingUser = onlineUser.find(user => user.userId === data.userId);
        if (!requestingUser) {
          console.log('User not found for matching');
          return;
        }

        if (videoQueue.length > 0) {
          const matchedUser = videoQueue.shift();
          const roomId = uuidv4();

          socket.join(roomId);  
          io.sockets.sockets.get(matchedUser.socketId)?.join(roomId); 

          io.to(requestingUser.socketId).emit('videoMatched', { peerUser: matchedUser.profile, roomId, initiator: true });
          io.to(matchedUser.socketId).emit('videoMatched', { peerUser: requestingUser.profile, roomId, initiator: false });

          console.log(`User ${requestingUser.userId} matched with ${matchedUser.userId} for video call in room ${roomId}`);

          // เมื่อผู้ใช้ disconnect หรือ leaveRoom ให้ออกจากห้อง
          socket.on("disconnect", () => handleLeaveRoom(roomId));
          io.sockets.sockets.get(matchedUser.socketId)?.on("disconnect", () => handleLeaveRoom(roomId));
        } else {
          videoQueue.push(requestingUser);
          console.log(`User ${requestingUser.userId} added to video queue`);
        }
      }, 500);  // Short delay to ensure socket readiness
    });

    // รับ event leaveRoom จาก client
    socket.on("leaveRoom", ({ roomId }) => {
      console.log(`User ${socket.id} leaving room ${roomId}`);
      handleLeaveRoom(roomId); // เรียกใช้ฟังก์ชัน handleLeaveRoom
    });

    // ทำความสะอาดเมื่อผู้ใช้ disconnect
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
