import { supabase } from '../config/supabase.js';

/**
 * HangoutMessagesService - Handles message operations for hangouts
 * Updated to use new schema: hangout_messages, hangout_members
 */
export class HangoutMessagesService {
  /**
   * Save a message to the database
   */
  static async saveMessage(messageData) {
    try {
      const { hangoutId, userId, content, messageId, replyTo, senderUsername } = messageData;

      const { data, error } = await supabase
        .from('hangout_messages')
        .insert([{
          id: messageId,
          hangout_id: hangoutId,
          sender_id: userId,
          sender_username: senderUsername || 'Anonymous',
          message: content,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        return { success: false, error };
      }

      // Update hangout's updated_at timestamp
      await supabase
        .from('hangouts')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', hangoutId);

      return { success: true, data };
    } catch (error) {
      console.error('Error in saveMessage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add or update hangout member
   */
  static async addParticipant(hangoutId, userId) {
    try {
      // Check if member already exists and is active
      const { data: existing } = await supabase
        .from('hangout_members')
        .select('*')
        .eq('hangout_id', hangoutId)
        .eq('user_id', userId)
        .is('left_at', null)
        .maybeSingle();

      if (existing) {
        return { success: true, data: existing };
      }

      // Add new member
      const { data, error } = await supabase
        .from('hangout_members')
        .insert([{
          hangout_id: hangoutId,
          user_id: userId,
          role: 'member',
          joined_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding participant:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in addParticipant:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get messages for a hangout
   */
  static async getMessages(hangoutId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('hangout_messages')
        .select('*')
        .eq('hangout_id', hangoutId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching messages:', error);
        return { success: false, error };
      }

      return { success: true, data: data.reverse() }; // Reverse to show oldest first
    } catch (error) {
      console.error('Error in getMessages:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark messages as read for a user in a hangout (no-op for new schema)
   */
  static async markAsRead(hangoutId, userId) {
    try {
      // New schema doesn't track per-user read status
      // Kept for backward compatibility
      return { success: true };
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Increment unread counts (no-op for new schema)
   */
  static async incrementUnreadCounts(hangoutId, senderId) {
    try {
      // New schema doesn't track unread counts
      // Kept for backward compatibility
      return { success: true };
    } catch (error) {
      console.error('Error incrementing unread counts:', error);
      return { success: false, error: error.message };
    }
  }
}

export default HangoutMessagesService;
