import { Router } from "express";
import multer from "multer";
import {
  createCharacter,
  getUserCharacters,
  getCharacterById,
  // TEMPORARILY DISABLED - Like system imports
  // getCharacterLikes,
  // toggleCharacterLike,
  // getLikeCount,
  // getBulkCharacterReactions,
} from "../controllers/characterController.js";
import { validateCreateCharacter } from "../middleware/validateCharacter.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const characterRouter = Router();

// Configure multer with memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route for creating a new character with avatar image upload
characterRouter.post("/create", requireAuth, upload.single("avatar"), validateCreateCharacter, createCharacter);

// Route for getting all characters of a user
characterRouter.post("/user", requireAuth, getUserCharacters);

// Route for getting a specific character by ID
characterRouter.get("/:id", requireAuth, getCharacterById);

// Like system routes - TEMPORARILY DISABLED TO FIX SUPABASE TIMEOUT ISSUES
// These routes were causing 50+ concurrent database queries overwhelming Supabase
// TODO: Re-enable with proper batch endpoint after RLS policy fixes are deployed
// characterRouter.get("/:id/likes", requireAuth, getCharacterLikes);
// characterRouter.post("/:id/like", requireAuth, toggleCharacterLike);
// characterRouter.get("/:id/like-count", requireAuth, getLikeCount);

// Bulk reactions route (for performance) - ALSO DISABLED
// characterRouter.post("/bulk-reactions", requireAuth, getBulkCharacterReactions);

export default characterRouter;
