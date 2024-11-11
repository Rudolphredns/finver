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
    console.log('User connected:', socket.id);

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

    // Helper function to emit event with retries
    const emitWithRetry = (socketId, event, data, retries = 3) => {
      const targetSocket = io.sockets.sockets.get(socketId);
      if (retries === 0 || !targetSocket) return;
      
      targetSocket.emit(event, data, (ack) => {
        if (!ack) {
          console.log(`Retrying ${event} to ${socketId} (${3 - retries + 1}/3)`);
          setTimeout(() => emitWithRetry(socketId, event, data, retries - 1), 500);
        }
      });
    };

    // Handle match video call with a short delay to ensure readiness
    socket.on('matchVideo', (data) => {
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

          // Send videoMatched event with retry for both users
          emitWithRetry(requestingUser.socketId, 'videoMatched', { peerUser: matchedUser.profile, roomId, initiator: true });
          emitWithRetry(matchedUser.socketId, 'videoMatched', { peerUser: requestingUser.profile, roomId, initiator: false });

          // Log and join both users to the same room
          socket.join(roomId);  // Add requesting user to the room
          io.sockets.sockets.get(matchedUser.socketId)?.join(roomId);  // Add matched user to the room

          console.log(`User ${requestingUser.userId} matched with ${matchedUser.userId} for video call in room ${roomId}`);
        } else {
          videoQueue.push(requestingUser);  // Add requesting user to queue if no match found
          console.log(`User ${requestingUser.userId} added to video queue`);
        }
      }, 500);  // Short delay to ensure socket readiness
    });

    socket.on('disconnect', () => {
      onlineUser = onlineUser.filter(user => user.socketId !== socket.id);
      videoQueue = videoQueue.filter(user => user.socketId !== socket.id);

      io.emit('getUser', onlineUser);
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
