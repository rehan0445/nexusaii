import { supabase } from '../config/supabase.js';

/**
 * HangoutRoomsService - Handles all database operations for Hangouts
 * Updated to use new schema: hangouts, hangout_messages, hangout_members
 */
export class HangoutRoomsService {
  // ============================================
  // HANGOUT MANAGEMENT
  // ============================================
  
  /**
   * Create a new hangout
   */
  static async createRoom(hangoutData) {
    try {
      console.log('🏗️ Creating hangout:', hangoutData);

      // Map old structure to new schema
      const hangoutToCreate = {
        name: hangoutData.name || 'New Hangout',
        bio: hangoutData.bio || hangoutData.description || '',
        theme: hangoutData.theme || hangoutData.roomType || 'default',
        skin_bubble: hangoutData.skin_bubble || 'liquid',
        creator_id: hangoutData.created_by || hangoutData.creator_id,
        creator_username: hangoutData.creator_username || 'Anonymous',
        creator_email: hangoutData.creator_email || null,
        members: hangoutData.members || [],
        is_active: true
      };

      const { data, error } = await supabase
        .from('hangouts')
        .insert([hangoutToCreate])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error creating hangout:', error);
        throw error;
      }

      // Add creator as first member with admin role
      await this.addMember(data.id, hangoutToCreate.creator_id, 'admin');

      console.log('✅ Hangout created successfully:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error creating hangout:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all active hangouts
   */
  static async getRooms(campusId = null) {
    try {
      let query = supabase
        .from('hangouts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      
      // Add member count to each hangout
      const hangoutsWithCounts = await Promise.all(
        (data || []).map(async (hangout) => {
          const memberCount = await this.getMemberCount(hangout.id);
          return {
            ...hangout,
            member_count: memberCount
          };
        })
      );

      return { success: true, data: hangoutsWithCounts };
    } catch (error) {
      console.error('❌ Error fetching hangouts:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a specific hangout by ID
   */
  static async getRoomById(hangoutId) {
    try {
      const { data, error } = await supabase
        .from('hangouts')
        .select('*')
        .eq('id', hangoutId)
        .single();

      if (error) throw error;

      // Add member count
      const memberCount = await this.getMemberCount(hangoutId);
      
      return { 
        success: true, 
        data: {
          ...data,
          member_count: memberCount
        }
      };
    } catch (error) {
      console.error('❌ Error fetching hangout:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get member count for a hangout
   */
  static async getMemberCount(hangoutId) {
    try {
      const { data, error } = await supabase
        .from('hangout_members')
        .select('id', { count: 'exact', head: true })
        .eq('hangout_id', hangoutId)
        .is('left_at', null);

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('❌ Error getting member count:', error);
      return 0;
    }
  }

  /**
   * Update hangout details
   */
  static async updateRoom(hangoutId, updates) {
    try {
      const { data, error } = await supabase
        .from('hangouts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', hangoutId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error updating hangout:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a hangout (soft delete)
   */
  static async deleteRoom(hangoutId) {
    try {
      const { error } = await supabase
        .from('hangouts')
        .update({ is_active: false })
        .eq('id', hangoutId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting hangout:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // MESSAGE MANAGEMENT
  // ============================================

  /**
   * Save a message to the database
   */
  static async saveMessage(messageData) {
    try {
      console.log('💾 Inserting message into database:', messageData.id || 'new');

      // Map old structure to new schema
      const messageToSave = {
        hangout_id: messageData.room_id || messageData.hangout_id,
        sender_id: messageData.user_id || messageData.sender_id,
        sender_username: messageData.user_name || messageData.sender_username || 'Anonymous',
        message: messageData.content || messageData.message
      };

      // Validate required fields
      if (!messageToSave.hangout_id || !messageToSave.sender_id || !messageToSave.message) {
        throw new Error('Missing required fields: hangout_id, sender_id, or message');
      }

      const { data, error } = await supabase
        .from('hangout_messages')
        .insert([messageToSave])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw error;
      }

      console.log('✅ Message inserted successfully:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error saving hangout message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get messages for a specific hangout (with pagination)
   */
  static async getRoomMessages(hangoutId, limit = 100, offset = 0) {
    try {
      console.log(`📨 Fetching messages for hangout ${hangoutId}, limit: ${limit}, offset: ${offset}`);

      const { data, error } = await supabase
        .from('hangout_messages')
        .select('*')
        .eq('hangout_id', hangoutId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Supabase error fetching messages:', error);
        throw error;
      }

      const messages = data || [];
      console.log(`📨 Retrieved ${messages.length} messages from hangout ${hangoutId}`);

      // Reverse to get chronological order (oldest first)
      return { success: true, data: messages.reverse() };
    } catch (error) {
      console.error('❌ Error fetching hangout messages:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId) {
    try {
      const { error } = await supabase
        .from('hangout_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean up old messages (keep only last 500 per hangout for performance)
   */
  static async cleanupOldMessages(hangoutId) {
    try {
      // Get messages older than the last 500
      const { data: messagesToDelete, error: selectError } = await supabase
        .from('hangout_messages')
        .select('id')
        .eq('hangout_id', hangoutId)
        .order('created_at', { ascending: false })
        .range(500, 999999); // Skip first 500, get the rest

      if (selectError) throw selectError;

      if (messagesToDelete && messagesToDelete.length > 0) {
        const idsToDelete = messagesToDelete.map(msg => msg.id);
        
        const { error: deleteError } = await supabase
          .from('hangout_messages')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) throw deleteError;
        console.log(`🧹 Cleaned up ${messagesToDelete.length} old messages from hangout ${hangoutId}`);
      }

      return { success: true, cleaned: messagesToDelete?.length || 0 };
    } catch (error) {
      console.error('❌ Error cleaning up old messages:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // MEMBER MANAGEMENT
  // ============================================

  /**
   * Add a member to a hangout
   */
  static async addMember(hangoutId, userId, role = 'member') {
    try {
      // Check if member already exists
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
          role: role
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error adding member:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add a participant (alias for addMember for backward compatibility)
   */
  static async addParticipant(hangoutId, userId, socketId) {
    return await this.addMember(hangoutId, userId, 'member');
  }

  /**
   * Remove a member from a hangout (set left_at)
   */
  static async removeMember(hangoutId, userId) {
    try {
      const { error } = await supabase
        .from('hangout_members')
        .update({ left_at: new Date().toISOString() })
        .eq('hangout_id', hangoutId)
        .eq('user_id', userId)
        .is('left_at', null);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error removing member:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove participant (alias for removeMember for backward compatibility)
   */
  static async removeParticipant(hangoutId, userId) {
    return await this.removeMember(hangoutId, userId);
  }

  /**
   * Get all active members in a hangout
   */
  static async getRoomParticipants(hangoutId) {
    try {
      const { data, error } = await supabase
        .from('hangout_members')
        .select('*')
        .eq('hangout_id', hangoutId)
        .is('left_at', null)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Error fetching members:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update member's last read timestamp
   */
  static async updateLastRead(hangoutId, userId, messageId) {
    try {
      // Note: In new schema, we don't track last_read per member
      // This is kept for backward compatibility but doesn't do anything
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating last read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Increment unread count for all members except sender
   */
  static async incrementUnreadCount(hangoutId, senderUserId) {
    try {
      // Note: In new schema, unread count is handled differently
      // This is kept for backward compatibility but doesn't do anything
      return { success: true };
    } catch (error) {
      console.error('❌ Error incrementing unread count:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update room member count (for backward compatibility)
   */
  static async updateRoomMemberCount(hangoutId) {
    try {
      const memberCount = await this.getMemberCount(hangoutId);
      return { success: true, memberCount };
    } catch (error) {
      console.error('❌ Error updating member count:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ensure database tables exist and are properly structured
   */
  static async ensureTablesExist() {
    try {
      console.log('🔍 Checking if hangout tables exist...');

      const tables = ['hangouts', 'hangout_messages', 'hangout_members'];

      for (const table of tables) {
        try {
          const { error } = await supabase
            .from(table)
            .select('id')
            .limit(1);

          if (error && error.code === 'PGRST116') {
            console.error(`❌ Table '${table}' does not exist`);
            return { success: false, error: `Table '${table}' does not exist. Please run the database migrations.` };
          } else if (error) {
            console.error(`❌ Error checking table '${table}':`, error.message);
            return { success: false, error: `Error checking table '${table}': ${error.message}` };
          } else {
            console.log(`✅ Table '${table}' exists`);
          }
        } catch (tableError) {
          console.error(`❌ Exception checking table '${table}':`, tableError);
          return { success: false, error: `Exception checking table '${table}': ${tableError.message}` };
        }
      }

      console.log('✅ All hangout tables exist and are accessible');
      return { success: true };
    } catch (error) {
      console.error('❌ Error ensuring tables exist:', error);
      return { success: false, error: error.message };
    }
  }
}
