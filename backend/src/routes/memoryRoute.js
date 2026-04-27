import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  memoryChat,
  getMemories,
  getPendingReminders,
  fireReminder,
  deleteMemory,
} from "../controllers/memoryController.js";

const router = express.Router();

router.post("/chat", protectRoute, memoryChat);
router.get("/", protectRoute, getMemories);
router.get("/reminders", protectRoute, getPendingReminders);
router.patch("/:id/fire", protectRoute, fireReminder);
router.delete("/:id", protectRoute, deleteMemory);

export default router;
