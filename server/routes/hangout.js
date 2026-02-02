import express from 'express';
// import multer from 'multer';
// import { supabase } from '../config/supabase.js';
// import { v4 as uuidv4 } from 'uuid';
// import fs from 'fs';
// import path from 'path';
// import { requireAuth } from '../middleware/authMiddleware.js';
// import { requireRoles } from '../middleware/rbac.js';
// import { scanBuffer } from '../utils/avScanner.js';
// import { HangoutRoomsService } from '../services/hangoutRoomsService.js';
// import { MessageLockingService } from '../services/messageLockingService.js';

const router = express.Router();

// ============================================
// HANGOUT ROUTES DISABLED - Coming Soon
// All routes are commented out for the launch
// ============================================

/*
// Helper functions for room persistence
const ROOMS_FILE = path.join(process.cwd(), 'data', 'rooms.json');

const readRooms = () => {
  try {
    if (fs.existsSync(ROOMS_FILE)) {
      const data = fs.readFileSync(ROOMS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading rooms file:', error);
    return [];
  }
};

const writeRooms = (rooms) => {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(ROOMS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing rooms file:', error);
    return false;
  }
};

// Configure multer for memory storage (for Supabase upload)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per-file
    files: 3,
    fields: 20,
  },
  fileFilter: (req, file, cb) => {
    try {
      const allowed = ['jpg','jpeg','png','gif','webp'];
      const ext = (file.originalname.split('.').pop() || '').toLowerCase();
      const isImage = file.mimetype.startsWith('image/');
      if (!isImage || !allowed.includes(ext)) return cb(new Error('Invalid file type'), false);
      cb(null, true);
    } catch { cb(new Error('Invalid file'), false); }
  }
});

// All routes commented out for Coming Soon launch
// router.post('/upload-profile-picture', requireAuth, upload.single('profilePicture'), async (req, res) => { ... });
// router.post('/rooms', requireAuth, async (req, res) => { ... });
// router.get('/rooms', requireAuth, async (req, res) => { ... });
// router.post('/join-by-id', requireAuth, async (req, res) => { ... });
// router.get('/session', requireAuth, async (req, res) => { ... });
// router.get('/rooms/:roomId/participants', requireAuth, async (req, res) => { ... });
// router.post('/rooms/:roomId/co-admin', requireAuth, requireRoles(['admin']), async (req, res) => { ... });
// router.delete('/rooms/:roomId/co-admin/:userId', requireAuth, requireRoles(['admin']), async (req, res) => { ... });
// router.post('/rooms/:roomId/transfer-ownership', requireAuth, requireRoles(['admin']), async (req, res) => { ... });
// router.post('/rooms/:roomId/ban', requireAuth, requireRoles(['admin']), async (req, res) => { ... });
// router.post('/rooms/:roomId/unban', requireAuth, requireRoles(['admin']), async (req, res) => { ... });
// router.delete('/rooms/:roomId/members/:userId', requireAuth, requireRoles(['admin']), async (req, res) => { ... });
// router.put('/rooms/:roomId/settings', requireAuth, requireRoles(['admin']), async (req, res) => { ... });
// router.get('/rooms/:roomId/members', requireAuth, async (req, res) => { ... });
// router.get('/rooms/:roomId/requests', requireAuth, requireRoles(['admin']), async (req, res) => { ... });
// router.post('/rooms/:roomId/requests/:requestId', requireAuth, requireRoles(['admin']), async (req, res) => { ... });
// router.post('/rooms/:roomId/request-join', requireAuth, async (req, res) => { ... });
// router.get('/rooms/:roomId/user-role/:userId', requireAuth, async (req, res) => { ... });
// router.get('/rooms/:roomId/permissions/:userId', requireAuth, async (req, res) => { ... });
// router.get('/rooms/:roomId/messages', requireAuth, async (req, res) => { ... });
// router.get('/check-setup', requireAuth, async (req, res) => { ... });
// router.get('/rooms/:roomId/moderation', requireAuth, async (req, res) => { ... });
// router.get('/rooms/:roomId', requireAuth, async (req, res) => { ... });
// router.post('/messages/:messageId/lock', requireAuth, async (req, res) => { ... });
// router.post('/messages/:messageId/unlock', requireAuth, async (req, res) => { ... });
// router.post('/messages/:messageId/restrict-deletion', requireAuth, async (req, res) => { ... });
// router.post('/messages/:messageId/unrestrict-deletion', requireAuth, async (req, res) => { ... });
// router.get('/messages/:messageId/can-delete', requireAuth, async (req, res) => { ... });
// router.get('/messages/:messageId/status', requireAuth, async (req, res) => { ... });
// router.delete('/messages/:messageId', requireAuth, async (req, res) => { ... });
*/

export default router;
