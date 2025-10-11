import { Router } from "express";
import { saveProgress } from "../controllers/progressController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const progressRouter = Router();

progressRouter.post("/save", requireAuth, saveProgress);

export default progressRouter; 