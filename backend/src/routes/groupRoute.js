import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
  createGroup,
  getMyGroups,
  getGroupById,
  updateGroup,
  addMembers,
  removeMember,
  leaveGroup,
  getGroupMessages,
  sendGroupMessage,
  muteMember,
  unmuteMember,
} from "../controllers/groupController.js";

const router = express.Router();

// Group CRUD
router.post("/", protectRoute, createGroup);
router.get("/", protectRoute, getMyGroups);
router.get("/:id", protectRoute, getGroupById);
router.put("/:id", protectRoute, updateGroup);

// Member management
router.put("/:id/members", protectRoute, addMembers);
router.delete("/:id/members/:userId", protectRoute, removeMember);
router.post("/:id/leave", protectRoute, leaveGroup);
router.put("/:id/mute/:userId", protectRoute, muteMember);
router.put("/:id/unmute/:userId", protectRoute, unmuteMember);

// Group messages
router.get("/:id/messages", protectRoute, getGroupMessages);
router.post("/:id/messages", protectRoute, sendGroupMessage);

export default router;
