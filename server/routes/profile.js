import { Router } from "express";
import {
  createUserProfile,
  getProfileInfo,
  updateUserProfileJson,
  updateUserProfile,
} from "../controllers/profileController.js";
import multer from "multer";
import { requireAuth } from "../middleware/authMiddleware.js";

const profileRouter = Router();

// Set up multer to parse multipart/form-data with strict limits
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 2, fields: 20 }
});

// Route for getting profile data (auth required)
profileRouter.post("/get-profile-data", requireAuth, getProfileInfo);

// Use multer middleware for parsing form-data on this route
profileRouter.post(
  "/create-profile",
  requireAuth,
  upload.fields([
    { name: "profileImg", maxCount: 1 },
    { name: "bannerImg", maxCount: 1 },
  ]),
  createUserProfile
);

// Update profile via JSON payload
profileRouter.put("/update-profile", requireAuth, updateUserProfileJson);

// Update profile with multipart (supports image uploads) + username uniqueness
profileRouter.put(
  "/update-profile-multipart",
  requireAuth,
  upload.fields([
    { name: "profileImg", maxCount: 1 },
    { name: "bannerImg", maxCount: 1 },
  ]),
  updateUserProfile
);

export default profileRouter;
