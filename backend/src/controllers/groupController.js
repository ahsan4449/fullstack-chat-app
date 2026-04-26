import Group from "../models/groupModel.js";
import Message from "../models/messageModel.js";
import cloudinary from "../lib/cloudinary.js";
import { io, getReceiverSocketId } from "../lib/socket.js";
import { translateText } from "../lib/translate.js";

// POST /api/groups — Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description, members, groupPic } = req.body;
    const adminId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Group name is required" });
    }

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: "At least one member is required besides you" });
    }

    // Ensure admin is included in members
    const memberSet = new Set(members.map((id) => id.toString()));
    memberSet.add(adminId.toString());
    const uniqueMembers = Array.from(memberSet);

    let groupPicUrl = "";
    if (groupPic) {
      const uploadResponse = await cloudinary.uploader.upload(groupPic);
      groupPicUrl = uploadResponse.secure_url;
    }

    const newGroup = new Group({
      name: name.trim(),
      description: description || "",
      groupPic: groupPicUrl,
      admin: adminId,
      members: uniqueMembers,
    });

    await newGroup.save();

    // Populate members for the response
    const populatedGroup = await Group.findById(newGroup._id)
      .populate("members", "-password")
      .populate("admin", "-password");

    // Notify all members via socket to join the new group room
    uniqueMembers.forEach((memberId) => {
      if (memberId.toString() !== adminId.toString()) {
        const socketId = getReceiverSocketId(memberId);
        if (socketId) {
          io.to(socketId).emit("newGroup", populatedGroup);
          // Make the member's socket join the group room
          const memberSocket = io.sockets.sockets.get(socketId);
          if (memberSocket) {
            memberSocket.join(`group:${newGroup._id}`);
          }
        }
      }
    });

    // Make admin's socket join the room too
    const adminSocketId = getReceiverSocketId(adminId);
    if (adminSocketId) {
      const adminSocket = io.sockets.sockets.get(adminSocketId);
      if (adminSocket) {
        adminSocket.join(`group:${newGroup._id}`);
      }
    }

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("Error in createGroup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/groups — Get all groups user belongs to
export const getMyGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({ members: userId })
      .populate("members", "-password")
      .populate("admin", "-password")
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getMyGroups:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/groups/:id — Get a single group
export const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("members", "-password")
      .populate("admin", "-password");

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Verify user is a member
    const isMember = group.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in getGroupById:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PUT /api/groups/:id — Update group (admin only)
export const updateGroup = async (req, res) => {
  try {
    const { name, description, groupPic } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the admin can update the group" });
    }

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description;

    if (groupPic) {
      const uploadResponse = await cloudinary.uploader.upload(groupPic);
      group.groupPic = uploadResponse.secure_url;
    }

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate("members", "-password")
      .populate("admin", "-password");

    // Notify all members about the update
    io.to(`group:${group._id}`).emit("groupUpdated", updatedGroup);

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in updateGroup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PUT /api/groups/:id/members — Add members (admin only)
export const addMembers = async (req, res) => {
  try {
    const { memberIds } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the admin can add members" });
    }

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ error: "Member IDs are required" });
    }

    // Add new members (avoid duplicates)
    const existingMembers = new Set(group.members.map((m) => m.toString()));
    const newMembers = memberIds.filter((id) => !existingMembers.has(id.toString()));

    if (newMembers.length === 0) {
      return res.status(400).json({ error: "All users are already members" });
    }

    group.members.push(...newMembers);
    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate("members", "-password")
      .populate("admin", "-password");

    // Make new members' sockets join the room and notify them
    newMembers.forEach((memberId) => {
      const socketId = getReceiverSocketId(memberId);
      if (socketId) {
        io.to(socketId).emit("newGroup", updatedGroup);
        const memberSocket = io.sockets.sockets.get(socketId);
        if (memberSocket) {
          memberSocket.join(`group:${group._id}`);
        }
      }
    });

    // Notify existing members about the update
    io.to(`group:${group._id}`).emit("groupUpdated", updatedGroup);

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in addMembers:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /api/groups/:id/members/:userId — Remove a member (admin only)
export const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the admin can remove members" });
    }

    if (userId === group.admin.toString()) {
      return res.status(400).json({ error: "Admin cannot remove themselves. Use leave instead." });
    }

    const memberIndex = group.members.findIndex(
      (m) => m.toString() === userId.toString()
    );
    if (memberIndex === -1) {
      return res.status(404).json({ error: "User is not a member of this group" });
    }

    group.members.splice(memberIndex, 1);
    // Also remove from mutedMembers if present
    group.mutedMembers = group.mutedMembers.filter(
      (m) => m.toString() !== userId.toString()
    );
    await group.save();

    // Make removed member's socket leave the room
    const removedSocketId = getReceiverSocketId(userId);
    if (removedSocketId) {
      const removedSocket = io.sockets.sockets.get(removedSocketId);
      if (removedSocket) {
        removedSocket.leave(`group:${group._id}`);
      }
      io.to(removedSocketId).emit("removedFromGroup", group._id.toString());
    }

    const updatedGroup = await Group.findById(group._id)
      .populate("members", "-password")
      .populate("admin", "-password");

    // Notify remaining members
    io.to(`group:${group._id}`).emit("groupUpdated", updatedGroup);

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in removeMember:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/groups/:id/leave — Leave a group
export const leaveGroup = async (req, res) => {
  try {
    const userId = req.user._id;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const memberIndex = group.members.findIndex(
      (m) => m.toString() === userId.toString()
    );
    if (memberIndex === -1) {
      return res.status(400).json({ error: "You are not a member of this group" });
    }

    group.members.splice(memberIndex, 1);

    // If admin is leaving, transfer to the next member or delete group
    if (group.admin.toString() === userId.toString()) {
      if (group.members.length > 0) {
        group.admin = group.members[0];
      } else {
        // No members left, delete the group and its messages
        await Message.deleteMany({ groupId: group._id });
        await Group.findByIdAndDelete(group._id);

        // Leave the socket room
        const userSocketId = getReceiverSocketId(userId);
        if (userSocketId) {
          const userSocket = io.sockets.sockets.get(userSocketId);
          if (userSocket) {
            userSocket.leave(`group:${group._id}`);
          }
        }

        return res.status(200).json({ message: "Group deleted as no members remain" });
      }
    }

    await group.save();

    // Leave the socket room
    const userSocketId = getReceiverSocketId(userId);
    if (userSocketId) {
      const userSocket = io.sockets.sockets.get(userSocketId);
      if (userSocket) {
        userSocket.leave(`group:${group._id}`);
      }
    }

    const updatedGroup = await Group.findById(group._id)
      .populate("members", "-password")
      .populate("admin", "-password");

    // Notify remaining members
    io.to(`group:${group._id}`).emit("groupUpdated", updatedGroup);

    res.status(200).json({ message: "You have left the group" });
  } catch (error) {
    console.error("Error in leaveGroup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/groups/:id/messages — Get group messages
export const getGroupMessages = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Verify user is a member
    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const messages = await Message.find({ groupId: req.params.id })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGroupMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/groups/:id/messages — Send a message to the group
export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image, messageType, language } = req.body;
    const groupId = req.params.id;
    const senderId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Verify user is a member
    const isMember = group.members.some(
      (m) => m.toString() === senderId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // Check if user is muted
    const isMuted = group.mutedMembers?.some(
      (m) => m.toString() === senderId.toString()
    );
    if (isMuted) {
      return res.status(403).json({ error: "You are muted in this group" });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    let translatedText = "";
    if (text) {
      translatedText = await translateText(text, "en");
    }

    const newMessage = new Message({
      senderId,
      groupId,
      text,
      translatedText,
      image: imageUrl,
      messageType: messageType || "text",
      language: language || "javascript",
    });

    await newMessage.save();

    // Populate sender info for the response
    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "fullName profilePic");

    // Emit to all group members (Socket.io room), excluding the sender
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(`group:${groupId}`).except(senderSocketId).emit("newGroupMessage", populatedMessage);
    } else {
      io.to(`group:${groupId}`).emit("newGroupMessage", populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PUT /api/groups/:id/mute/:userId — Mute a member (admin only)
export const muteMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the admin can mute members" });
    }

    if (userId === group.admin.toString()) {
      return res.status(400).json({ error: "Admin cannot mute themselves" });
    }

    // Verify user is a member
    const isMember = group.members.some(
      (m) => m.toString() === userId.toString()
    );
    if (!isMember) {
      return res.status(404).json({ error: "User is not a member of this group" });
    }

    // Check if already muted
    const isAlreadyMuted = group.mutedMembers?.some(
      (m) => m.toString() === userId.toString()
    );
    if (isAlreadyMuted) {
      return res.status(400).json({ error: "User is already muted" });
    }

    group.mutedMembers.push(userId);
    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate("members", "-password")
      .populate("admin", "-password");

    // Notify all members about the update (so UI reflects muted state)
    io.to(`group:${group._id}`).emit("groupUpdated", updatedGroup);

    // Notify the muted user specifically
    const mutedSocketId = getReceiverSocketId(userId);
    if (mutedSocketId) {
      io.to(mutedSocketId).emit("mutedInGroup", group._id.toString());
    }

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in muteMember:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PUT /api/groups/:id/unmute/:userId — Unmute a member (admin only)
export const unmuteMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the admin can unmute members" });
    }

    const mutedIndex = group.mutedMembers?.findIndex(
      (m) => m.toString() === userId.toString()
    );
    if (mutedIndex === -1 || mutedIndex === undefined) {
      return res.status(400).json({ error: "User is not muted" });
    }

    group.mutedMembers.splice(mutedIndex, 1);
    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate("members", "-password")
      .populate("admin", "-password");

    // Notify all members about the update
    io.to(`group:${group._id}`).emit("groupUpdated", updatedGroup);

    // Notify the unmuted user
    const unmutedSocketId = getReceiverSocketId(userId);
    if (unmutedSocketId) {
      io.to(unmutedSocketId).emit("unmutedInGroup", group._id.toString());
    }

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in unmuteMember:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
