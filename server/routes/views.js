import express from "express";
import {
  trackCharacterView,
  getCharacterLeaderboard,
  getCharacterViewStats,
  getBulkViewCounts,
  syncViewsFromFrontend,
} from "../controllers/viewsController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Track a character view
router.post("/track", requireAuth, trackCharacterView);

// Get character leaderboard ranked by views
router.get("/leaderboard", getCharacterLeaderboard);

// Get view counts for multiple character ids (ids=slug1,slug2,...) - returns { counts: { slug1: number, ... } } with 0 for missing
router.get("/counts", getBulkViewCounts);

// Get view statistics for a specific character
router.get("/character/:character_id", getCharacterViewStats);

// Sync views from frontend localStorage (migration helper)
router.post("/sync", requireAuth, syncViewsFromFrontend);

export default router;
