import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL
      : ["http://localhost:5173"],
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// {userId: socketId}
const userSocketMap = {};

// ── Self-Destruct: notify clients when messages expire (every 5s) ─────────
const startMessageExpiryWatcher = () => {
  setInterval(async () => {
    try {
      const Message = (await import("../models/messageModel.js")).default;
      const now = new Date();

      const expiredMessages = await Message.find({
        expiresAt: { $lte: now },
        isExpired: { $ne: true },
      }).select("_id senderId receiverId groupId");

      for (const msg of expiredMessages) {
        await Message.findByIdAndUpdate(msg._id, { isExpired: true });

        const payload = { messageId: msg._id.toString() };

        if (msg.groupId) {
          io.to(`group:${msg.groupId}`).emit("messageExpired", payload);
        } else {
          const senderSocketId = userSocketMap[msg.senderId?.toString()];
          const receiverSocketId = userSocketMap[msg.receiverId?.toString()];
          if (senderSocketId) io.to(senderSocketId).emit("messageExpired", payload);
          if (receiverSocketId) io.to(receiverSocketId).emit("messageExpired", payload);
        }
      }
    } catch {
      // Silently skip if DB not ready
    }
  }, 5000);
};

// ── Socket Connection ─────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ── Screenshot Detection ───────────────────────────────────────────────
  // Only notifies the targetUser — no trust score, no deductions, no sender feedback.
  socket.on("screenshotDetected", ({ targetUserId }) => {
    if (!targetUserId) return;

    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("screenshotAlert", {
        message: "Someone may have taken a screenshot of this chat.",
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

startMessageExpiryWatcher();

export { io, app, server };