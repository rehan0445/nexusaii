/**
 * Message Locking Service
 * Handles message locking, unlocking, and deletion restrictions
 */

import { supabase } from '../config/supabase.js';

export class MessageLockingService {
  /**
   * Lock a message to prevent editing/deletion
   * @param {string} messageId - The message ID to lock
   * @param {string} lockedBy - User ID who is locking the message
   * @param {string} reason - Reason for locking
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  static async lockMessage(messageId, lockedBy, reason = 'Message locked by moderator') {
    try {
      console.log(`🔒 Locking message ${messageId} by user ${lockedBy}`);

      // First, check if message exists and get its details
      const { data: message, error: fetchError } = await supabase
        .from('room_messages')
        .select('id, author_id, room_id, is_locked')
        .eq('id', messageId)
        .single();

      if (fetchError || !message) {
        console.error('❌ Message not found:', fetchError);
        return { success: false, error: 'Message not found' };
      }

      if (message.is_locked) {
        console.warn('⚠️ Message is already locked');
        return { success: false, error: 'Message is already locked' };
      }

      // Lock the message
      const { data, error } = await supabase
        .from('room_messages')
        .update({
          is_locked: true,
          locked_by: lockedBy,
          locked_at: new Date().toISOString(),
          lock_reason: reason
        })
        .eq('id', messageId)
        .select();

      if (error) {
        console.error('❌ Failed to lock message:', error);
        return { success: false, error: 'Failed to lock message' };
      }

      console.log('✅ Message locked successfully:', data[0]);
      return { success: true, message: 'Message locked successfully', data: data[0] };
    } catch (error) {
      console.error('❌ Error locking message:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Unlock a message to allow editing/deletion
   * @param {string} messageId - The message ID to unlock
   * @param {string} unlockedBy - User ID who is unlocking the message
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  static async unlockMessage(messageId, unlockedBy) {
    try {
      console.log(`🔓 Unlocking message ${messageId} by user ${unlockedBy}`);

      const { data, error } = await supabase
        .from('room_messages')
        .update({
          is_locked: false,
          locked_by: null,
          locked_at: null,
          lock_reason: null
        })
        .eq('id', messageId)
        .select();

      if (error) {
        console.error('❌ Failed to unlock message:', error);
        return { success: false, error: 'Failed to unlock message' };
      }

      console.log('✅ Message unlocked successfully:', data[0]);
      return { success: true, message: 'Message unlocked successfully', data: data[0] };
    } catch (error) {
      console.error('❌ Error unlocking message:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Restrict deletion of a message
   * @param {string} messageId - The message ID to restrict
   * @param {string} restrictedBy - User ID who is restricting deletion
   * @param {string} reason - Reason for restriction
   * @param {boolean} allowAuthorDelete - Whether author can still delete
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  static async restrictMessageDeletion(messageId, restrictedBy, reason = 'Message deletion restricted', allowAuthorDelete = false) {
    try {
      console.log(`🚫 Restricting deletion of message ${messageId} by user ${restrictedBy}`);

      const { data, error } = await supabase
        .from('room_messages')
        .update({
          deletion_restricted: true,
          restricted_by: restrictedBy,
          restriction_reason: reason,
          can_be_deleted_by_author: allowAuthorDelete
        })
        .eq('id', messageId)
        .select();

      if (error) {
        console.error('❌ Failed to restrict message deletion:', error);
        return { success: false, error: 'Failed to restrict message deletion' };
      }

      console.log('✅ Message deletion restricted successfully:', data[0]);
      return { success: true, message: 'Message deletion restricted successfully', data: data[0] };
    } catch (error) {
      console.error('❌ Error restricting message deletion:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Remove deletion restriction from a message
   * @param {string} messageId - The message ID to unrestrict
   * @param {string} unrestrictedBy - User ID who is removing restriction
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  static async unrestrictMessageDeletion(messageId, unrestrictedBy) {
    try {
      console.log(`✅ Removing deletion restriction from message ${messageId} by user ${unrestrictedBy}`);

      const { data, error } = await supabase
        .from('room_messages')
        .update({
          deletion_restricted: false,
          restricted_by: null,
          restriction_reason: null,
          can_be_deleted_by_author: true
        })
        .eq('id', messageId)
        .select();

      if (error) {
        console.error('❌ Failed to unrestrict message deletion:', error);
        return { success: false, error: 'Failed to unrestrict message deletion' };
      }

      console.log('✅ Message deletion restriction removed successfully:', data[0]);
      return { success: true, message: 'Message deletion restriction removed successfully', data: data[0] };
    } catch (error) {
      console.error('❌ Error unrestricting message deletion:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Check if a user can delete a message
   * @param {string} messageId - The message ID to check
   * @param {string} userId - The user ID requesting deletion
   * @param {boolean} isModerator - Whether the user is a moderator
   * @returns {Promise<{success: boolean, canDelete: boolean, reason?: string}>}
   */
  static async canUserDeleteMessage(messageId, userId, isModerator = false) {
    try {
      console.log(`🔍 Checking deletion permissions for message ${messageId} by user ${userId}`);

      const { data: message, error } = await supabase
        .from('room_messages')
        .select('id, author_id, is_locked, deletion_restricted, can_be_deleted_by_author, locked_by, restriction_reason, lock_reason')
        .eq('id', messageId)
        .single();

      if (error || !message) {
        console.error('❌ Message not found:', error);
        return { success: false, canDelete: false, reason: 'Message not found' };
      }

      // Moderators can always delete unless message is locked by another moderator
      if (isModerator) {
        if (message.is_locked && message.locked_by !== userId) {
          return { 
            success: true, 
            canDelete: false, 
            reason: `Message is locked by another moderator. Lock reason: ${message.lock_reason}` 
          };
        }
        return { success: true, canDelete: true, reason: 'Moderator permission' };
      }

      // Regular users can only delete their own messages
      if (message.author_id !== userId) {
        return { success: true, canDelete: false, reason: 'You can only delete your own messages' };
      }

      // Check if message is locked
      if (message.is_locked) {
        return { 
          success: true, 
          canDelete: false, 
          reason: `Message is locked. Reason: ${message.lock_reason}` 
        };
      }

      // Check if deletion is restricted
      if (message.deletion_restricted && !message.can_be_deleted_by_author) {
        return { 
          success: true, 
          canDelete: false, 
          reason: `Message deletion is restricted. Reason: ${message.restriction_reason}` 
        };
      }

      return { success: true, canDelete: true, reason: 'Author permission' };
    } catch (error) {
      console.error('❌ Error checking deletion permissions:', error);
      return { success: false, canDelete: false, reason: 'Internal server error' };
    }
  }

  /**
   * Get message locking status and permissions
   * @param {string} messageId - The message ID to check
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  static async getMessageStatus(messageId) {
    try {
      const { data, error } = await supabase
        .from('room_messages')
        .select(`
          id,
          author_id,
          is_locked,
          locked_by,
          locked_at,
          lock_reason,
          deletion_restricted,
          restricted_by,
          restriction_reason,
          can_be_deleted_by_author
        `)
        .eq('id', messageId)
        .single();

      if (error || !data) {
        console.error('❌ Message not found:', error);
        return { success: false, error: 'Message not found' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Error getting message status:', error);
      return { success: false, error: 'Internal server error' };
    }
  }
}
