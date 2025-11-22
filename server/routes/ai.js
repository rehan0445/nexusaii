import { Router } from "express";
import { requireAuth, rateLimitSimple, sanitizeInput } from "../middleware/authMiddleware.js";

const router = Router();

// In-memory store
const conversations = [];
const messages = [];

// POST /api/ai/conversations
router.post("/conversations", requireAuth, rateLimitSimple(30, 60_000), (req, res) => {
  const convo = { id: String(Date.now()), userId: req.user?.id || "anon", createdAt: new Date().toISOString(), lastMessageAt: null };
  conversations.unshift(convo);
  res.json({ success: true, data: convo });
});

// GET /api/ai/conversations
router.get("/conversations", requireAuth, (req, res) => {
  res.json({ success: true, data: conversations });
});

// POST /api/ai/messages
router.post("/messages", requireAuth, rateLimitSimple(120, 60_000), sanitizeInput(['message']), (req, res) => {
  const { conversation_id, message } = req.body || {};
  if (!conversation_id || !message) return res.status(400).json({ success: false, message: "conversation_id and message required" });
  const msg = { id: String(Date.now()), conversation_id, role: "user", content: message, createdAt: new Date().toISOString() };
  messages.push(msg);
  res.json({ success: true, data: msg });
});

export default router;


