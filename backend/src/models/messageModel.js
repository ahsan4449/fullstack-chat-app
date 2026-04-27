import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Not required — null for group messages
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      // Not required — null for DM messages
    },
    text: {
      type: String,
    },
    messageType: {
      type: String,
      enum: ["text", "code"],
      default: "text",
    },
    language: {
      type: String,
    },
    translatedText: {
      type: String,
    },
    image: {
      type: String,
    },

    // ── High-Security Mode: Self-Destructing Messages ─────────────────────
    // ttl: seconds until deletion (null = never expires)
    // expiresAt: absolute timestamp when MongoDB TTL index will delete it
    ttl: {
      type: Number,
      default: null, // null = permanent message
    },
    expiresAt: {
      type: Date,
      default: null,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL index — auto-deletes at expiresAt
    },
    isExpired: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for fast group message queries
messageSchema.index({ groupId: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;