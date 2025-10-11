import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Use shared auth middleware (supports header/cookie/JWT in dev+prod)
const authenticateToken = requireAuth;

/**
 * GET /api/nexus-chats
 * Get all chats for a user (Hangout Palace, Hangout Rooms, Companions)
 * Returns unified list sorted by most recent activity
 */
router.get('/', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  const userId = req.userId || req.user?.id;
  console.log(`📨 Fetching nexus chats for user: ${userId}`);

  try {
    // userId already resolved above
    const allChats = [];

    // 1. Fetch Hangout chats
    console.log('🔍 Fetching hangout members for user:', userId);
    const { data: hangoutMembers, error: hangoutError } = await supabase
      .from('hangout_members')
      .select(`
        hangout_id,
        joined_at,
        hangouts (
          id,
          name,
          bio,
          theme,
          creator_username
        )
      `)
      .eq('user_id', userId)
      .is('left_at', null);

    if (hangoutError) {
      console.error('Error fetching hangout members:', hangoutError);
    } else if (hangoutMembers) {
      // For each hangout, get the last message
      for (const member of hangoutMembers) {
        if (!member.hangouts) continue;

        const { data: lastMessage } = await supabase
          .from('hangout_messages')
          .select('message, created_at, sender_id')
          .eq('hangout_id', member.hangout_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const hangout = member.hangouts;
        allChats.push({
          id: hangout.id,
          type: 'hangout',
          name: hangout.name,
          avatar: '💬',
          lastMessage: lastMessage?.message || 'No messages yet',
          timestamp: lastMessage?.created_at || member.joined_at,
          unreadCount: 0, // New schema doesn't track per-user unread
          route: `/arena/hangout/chat/${hangout.id}`
        });
      }
    }

    // 2. Fetch Companion/Character chats
    const { data: companionChats, error: companionError } = await supabase
      .from('ai_chat_metadata')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false });

    if (companionError) {
      console.error('Error fetching companion chats:', companionError);
    } else if (companionChats) {
      for (const chat of companionChats) {
        allChats.push({
          id: chat.character_id,
          type: 'companion',
          name: chat.character_name,
          avatar: chat.character_avatar || '🤖',
          lastMessage: chat.last_message || 'Start chatting!',
          timestamp: chat.last_message_at,
          unreadCount: chat.unread_count || 0,
          route: `/chat/${chat.character_id}`
        });
      }
    }

    // Sort all chats by most recent timestamp
    allChats.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const response = {
      success: true,
      chats: allChats,
      totalUnread: allChats.reduce((sum, chat) => sum + chat.unreadCount, 0)
    };

    const duration = Date.now() - startTime;
    console.log(`✅ Fetched ${allChats.length} chats for user ${userId} in ${duration}ms`);

    res.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error fetching nexus chats for user ${req.userId} after ${duration}ms:`, error);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error',
      duration
    });
  }
});

/**
 * POST /api/nexus-chats/mark-read
 * Mark a chat as read (reset unread count)
 */
router.post('/mark-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId, chatType } = req.body;

    if (!chatId || !chatType) {
      return res.status(400).json({ success: false, message: 'Chat ID and type required' });
    }

    if (chatType === 'companion') {
      // Update companion chat metadata
      const { error } = await supabase
        .from('ai_chat_metadata')
        .update({ unread_count: 0 })
        .eq('user_id', userId)
        .eq('character_id', chatId);

      if (error) throw error;
    } else {
      // New schema doesn't track per-user unread count
      // Kept for backward compatibility
      console.log(`Marking hangout ${chatId} as read for user ${userId} (no-op in new schema)`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking chat as read:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/nexus-chats/update-companion-chat
 * Update companion chat metadata (called when user sends/receives messages)
 */
router.post('/update-companion-chat', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { characterId, characterName, characterAvatar, lastMessage } = req.body;

    console.log(`📝 Updating companion chat metadata: user=${userId}, character=${characterId}`);

    if (!characterId || !characterName) {
      return res.status(400).json({ success: false, message: 'Character info required' });
    }

    const { data, error } = await supabase
      .from('ai_chat_metadata')
      .upsert({
        id: `${userId}_${characterId}`,
        user_id: userId,
        character_id: characterId,
        character_name: characterName,
        character_avatar: characterAvatar || null,
        last_message: lastMessage || 'Chat started',
        last_message_at: new Date().toISOString(),
        unread_count: 0
      }, {
        onConflict: 'user_id,character_id'
      });

    if (error) {
      console.error('❌ Error updating companion chat metadata:', error);
      throw error;
    }

    console.log(`✅ Companion chat metadata updated successfully`);
    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error in update-companion-chat:', error);
    res.status(500).json({ success: false, message: 'Internal server error', details: error.message });
  }
});

export default router;

