import express from "express";
import {
  trackCharacterView,
  getCharacterLeaderboard,
  getCharacterViewStats,
  syncViewsFromFrontend,
} from "../controllers/viewsController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Track a character view
router.post("/track", requireAuth, trackCharacterView);

// Get character leaderboard ranked by views
router.get("/leaderboard", getCharacterLeaderboard);

// Get view statistics for a specific character
router.get("/character/:character_id", getCharacterViewStats);

// Sync views from frontend localStorage (migration helper)
router.post("/sync", requireAuth, syncViewsFromFrontend);

export default router;
