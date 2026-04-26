import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { processChatContext } from "../controllers/aiController.js";

const router = express.Router();

router.post("/process", protectRoute, processChatContext);

export default router;
