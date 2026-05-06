import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { translateText } from "../lib/translate.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, ttl } = req.body;  // ttl = seconds, null = permanent
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    let translatedText = "";
    if (text) {
      translatedText = await translateText(text, "en");
    }

    // Self-destruct: compute expiresAt from ttl (seconds)
    const expiresAt = ttl && ttl > 0 ? new Date(Date.now() + ttl * 1000) : null;

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      translatedText,
      image: imageUrl,
      ttl: expiresAt ? ttl : null,
      expiresAt,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Only the sender can delete their own message
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    await Message.findByIdAndDelete(messageId);

    // Real-time: notify the other party so they remove it from their UI
    const payload = { messageId: messageId.toString() };
    if (message.receiverId) {
      const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
      if (receiverSocketId) io.to(receiverSocketId).emit("messageDeleted", payload);
    }
    if (message.groupId) {
      io.to(`group:${message.groupId}`).emit("messageDeleted", payload);
    }

    res.status(200).json({ success: true, messageId: messageId.toString() });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};