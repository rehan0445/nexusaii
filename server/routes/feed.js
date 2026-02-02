import { Router } from "express";
import { getRecommendations, getUpdates } from "../controllers/feedController.js";

const router = Router();

// GET /api/feed/recommendations?cursor&limit
router.get("/recommendations", getRecommendations);

// GET /api/feed/updates?cursor&limit
router.get("/updates", getUpdates);

export default router;


