import { Router } from "express";
import { getUnread } from "../controllers/unreadController.js";

const router = Router();

// GET /api/unread
router.get("/", getUnread);

export default router;


