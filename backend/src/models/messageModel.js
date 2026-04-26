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
  },
  { timestamps: true }
);

// Index for fast group message queries
messageSchema.index({ groupId: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;