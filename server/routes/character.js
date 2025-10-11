import { Router } from "express";
import multer from "multer";
import {
  createCharacter,
  getUserCharacters,
  getCharacterById,
  getCharacterLikes,
  toggleCharacterLike,
  getLikeCount,
  getBulkCharacterReactions,
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

// Like system routes
characterRouter.get("/:id/likes", requireAuth, getCharacterLikes);
characterRouter.post("/:id/like", requireAuth, toggleCharacterLike);
characterRouter.get("/:id/like-count", requireAuth, getLikeCount);

// Bulk reactions route (for performance)
characterRouter.post("/bulk-reactions", requireAuth, getBulkCharacterReactions);

export default characterRouter;
