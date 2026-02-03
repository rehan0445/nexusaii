import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware.js";
import {
  chatAiGemini,
  chatAiBulkGemini,
  chatAiClaude,
} from "../controllers/chatAiController.js";
import {
  saveChat,
  getSavedChat,
  deleteSingleChat,
  deleteAllChatsForUser,
  getCharacterChat,
  updateChat,
} from "../controllers/characterChatController.js";

const chatAiRouter = Router();

// In development, skip strict auth for Venice AI chat endpoint (for testing)
// In production, allow guest via x-user-id: guest_xxx (optionalAuth) so guests can chat
const isDev = process.env.NODE_ENV === 'development';
const chatAuthMiddleware = isDev ? (req, res, next) => {
  const guestHeader = req.headers['x-user-id'];
  if (guestHeader && String(guestHeader).startsWith('guest_')) {
    req.userId = String(guestHeader);
    req.isGuest = true;
    req.user = { id: req.userId, provider: 'guest' };
  } else if (req.body?.userId) {
    req.userId = req.body.userId;
  }
  next();
} : optionalAuth;

chatAiRouter.post("/gemini", chatAuthMiddleware, chatAiGemini);
chatAiRouter.post("/claude", chatAuthMiddleware, chatAiClaude); // Venice AI
chatAiRouter.post("/bulk-gemini", chatAuthMiddleware, chatAiBulkGemini);
chatAiRouter.post("/save-chat", requireAuth, saveChat);
chatAiRouter.post("/get-saved-chat", requireAuth, getSavedChat);
// optionalAuth so guests can load chat (e.g. fallback when companion/history used)
chatAiRouter.post("/get-character-chat", optionalAuth, getCharacterChat);
chatAiRouter.post("/update-chat", requireAuth, updateChat);
chatAiRouter.post("/delete-chat", requireAuth, deleteSingleChat);
chatAiRouter.post("/delete-all-chats", requireAuth, deleteAllChatsForUser);

export default chatAiRouter;
