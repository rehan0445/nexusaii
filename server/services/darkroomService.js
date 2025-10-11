import { supabase } from '../config/supabase.js';

export class DarkroomService {
  // Room Management
  static async createRoom(roomData) {
    try {
      // Use upsert to avoid duplicate key errors (handles server restarts gracefully)
      const { data, error } = await supabase
        .from('darkroom_rooms')
        .upsert([roomData], { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      console.log(`✅ [DarkRoom] Room created/updated: ${data.id}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error creating room:', error);
      return { success: false, error: error.message };
    }
  }

  static async getRooms() {
    try {
      const { data, error } = await supabase
        .from('darkroom_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return { success: false, error: error.message };
    }
  }

  static async getRoomById(roomId) {
    try {
      const { data, error } = await supabase
        .from('darkroom_rooms')
        .select('*')
        .eq('id', roomId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching room:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateRoomUserCount(roomId) {
    try {
      const { data, error } = await supabase
        .from('darkroom_room_users')
        .select('id')
        .eq('room_id', roomId);

      if (error) throw error;

      const userCount = data ? data.length : 0;

      const { error: updateError } = await supabase
        .from('darkroom_rooms')
        .update({ user_count: userCount })
        .eq('id', roomId);

      if (updateError) throw updateError;
      return { success: true, userCount };
    } catch (error) {
      console.error('Error updating room user count:', error);
      return { success: false, error: error.message };
    }
  }

  // Message Management
  static async saveMessage(messageData) {
    try {
      const { data, error } = await supabase
        .from('darkroom_messages')
        .insert([messageData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error saving message:', error);
      return { success: false, error: error.message };
    }
  }

  static async getRoomMessages(roomId, limit = 100) {
    try {
      const { data, error } = await supabase
        .from('darkroom_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data: data.reverse() }; // Reverse to get chronological order
    } catch (error) {
      console.error('Error fetching room messages:', error);
      return { success: false, error: error.message };
    }
  }

  static async cleanupOldMessages(roomId) {
    try {
      // Keep only the last 100 messages per room
      const { data: messagesToDelete, error: selectError } = await supabase
        .from('darkroom_messages')
        .select('id')
        .eq('room_id', roomId)
        .order('timestamp', { ascending: false })
        .range(100, 999999); // Skip first 100, get the rest

      if (selectError) throw selectError;

      if (messagesToDelete && messagesToDelete.length > 0) {
        const idsToDelete = messagesToDelete.map(msg => msg.id);
        
        const { error: deleteError } = await supabase
          .from('darkroom_messages')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) throw deleteError;
      }

      return { success: true };
    } catch (error) {
      console.error('Error cleaning up old messages:', error);
      return { success: false, error: error.message };
    }
  }

  // User Management
  static async addUserToRoom(roomId, socketId, alias, userInfo = {}) {
    try {
      const { data, error } = await supabase
        .from('darkroom_room_users')
        .insert([{
          room_id: roomId,
          socket_id: socketId,
          alias: alias,
          user_name: userInfo.user_name || null,
          user_email: userInfo.user_email || null,
          user_id: userInfo.user_id || null
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error adding user to room:', error);
      return { success: false, error: error.message };
    }
  }

  static async removeUserFromRoom(socketId) {
    try {
      const { data, error } = await supabase
        .from('darkroom_room_users')
        .delete()
        .eq('socket_id', socketId)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error removing user from room:', error);
      return { success: false, error: error.message };
    }
  }

  static async getRoomUsers(roomId) {
    try {
      const { data, error } = await supabase
        .from('darkroom_room_users')
        .select('*')
        .eq('room_id', roomId);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching room users:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateUserActivity(socketId) {
    try {
      const { error } = await supabase
        .from('darkroom_room_users')
        .update({ last_activity: new Date().toISOString() })
        .eq('socket_id', socketId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating user activity:', error);
      return { success: false, error: error.message };
    }
  }

  // Cleanup inactive users (older than 5 minutes)
  static async cleanupInactiveUsers() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('darkroom_room_users')
        .delete()
        .lt('last_activity', fiveMinutesAgo)
        .select();

      if (error) throw error;
      return { success: true, cleaned: data?.length || 0 };
    } catch (error) {
      console.error('Error cleaning up inactive users:', error);
      return { success: false, error: error.message };
    }
  }
}
