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
  let chatQueue = [];

  io.on("connection", (socket) => {
    console.log('Connection Success...');

    socket.emit('getUser', onlineUser);

    socket.on('addnewUser', (clerkUser) => {
      if (clerkUser && !onlineUser.some(user => user?.userId === clerkUser.id)) {
        onlineUser.push({
          userId: clerkUser.id,
          socketId: socket.id,
          profile: clerkUser
        });
        io.emit('getUser', onlineUser);
      }
    });

    // Handle match video call
    socket.on('matchVideo', (data) => {
      console.log('Matching video for user:', data.userId);

      const requestingUser = onlineUser.find(user => user.userId === data.userId);
      if (!requestingUser) {
        console.log('User not found for matching');
        return;
      }

      if (videoQueue.length > 0) {
        const matchedUser = videoQueue.shift();
        const roomId = uuidv4();

        io.to(requestingUser.socketId).emit('videoMatched', { peerUser: matchedUser.profile, roomId });
        io.to(matchedUser.socketId).emit('videoMatched', { peerUser: requestingUser.profile, roomId });

        console.log(`User ${requestingUser.userId} matched with ${matchedUser.userId} for video call in room ${roomId}`);
        console.log(`User ${requestingUser.userId} is joining room: ${roomId}`);
        console.log(`User ${matchedUser.userId} is joining room: ${roomId}`);
      } else {
        videoQueue.push(requestingUser);
        console.log(`User ${requestingUser.userId} added to video queue`);
      }
    });

    // Handle match chat
    socket.on('matchChat', (data) => {
      console.log('Matching chat for user:', data.userId);

      const requestingUser = onlineUser.find(user => user.userId === data.userId);
      if (!requestingUser) {
        console.log('User not found for matching');
        return;
      }

      if (chatQueue.length > 0) {
        const matchedUser = chatQueue.shift();
        const roomId = uuidv4();

        io.to(requestingUser.socketId).emit('chatMatched', { peerUser: matchedUser.profile, roomId });
        io.to(matchedUser.socketId).emit('chatMatched', { peerUser: requestingUser.profile, roomId });

        console.log(`User ${requestingUser.userId} matched with ${matchedUser.userId} for chat in room ${roomId}`);
      } else {
        chatQueue.push(requestingUser);
        console.log(`User ${requestingUser.userId} added to chat queue`);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      onlineUser = onlineUser.filter(user => user.socketId !== socket.id);
      videoQueue = videoQueue.filter(user => user.socketId !== socket.id);
      chatQueue = chatQueue.filter(user => user.socketId !== socket.id);

      io.emit('getUser', onlineUser);
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
