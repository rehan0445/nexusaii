import { hangoutService } from './hangoutService';
import { supabase } from '../lib/supabase';

/**
 * Centralized Hangout Lifecycle Management
 * 
 * Three core functions for clean hangout management:
 * - createHangout: Creates new hangout room
 * - joinHangout: Joins room, fetches history, sets up realtime
 * - leaveHangout: Leaves room, cleans up all subscriptions
 */
export class HangoutLifecycle {
  /**
   * Creates a new hangout room
   */
  static async createHangout(data: {
    name: string;
    description: string;
    userId: string;
    profilePicture?: string;
  }) {
    console.log('🏗️ [CREATE] Creating hangout:', data.name);
    
    try {
      const room = await hangoutService.createRoom({
        name: data.name,
        description: data.description,
        roomType: 'palace',
        category: 'general',
        isPrivate: false,
        createdBy: data.userId,
        profilePicture: data.profilePicture || null
      });
      
      if (!room) {
        throw new Error('Room creation returned null');
      }
      
      console.log('✅ [CREATE] Hangout created:', room.id);
      
      // Trigger realtime update (broadcast to all clients)
      // This is automatic via Supabase realtime on INSERT
      
      return { success: true, room };
    } catch (error: any) {
      console.error('❌ [CREATE] Failed to create hangout:', error);
      return { success: false, error: error.message || 'Failed to create hangout' };
    }
  }

  /**
   * Joins a hangout room (fetches history + subscribes to realtime)
   */
  static async joinHangout(roomId: string, userId: string) {
    console.log('🚪 [JOIN] Joining hangout:', roomId);
    
    try {
      // 1. Join via socket for presence
      const joinSuccess = await hangoutService.joinRoom(roomId);
      if (!joinSuccess) {
        throw new Error('Failed to join via socket');
      }
      console.log('✅ [JOIN] Socket joined');
      
      // 2. Fetch chat history
      console.log('📚 [JOIN] Fetching message history...');
      const messages = await hangoutService.getMessages(roomId);
      console.log(`✅ [JOIN] Loaded ${messages.length} messages`);
      
      // 3. Subscribe to realtime updates
      // Note: This is handled internally by joinRoom via setupRealtimeSubscription
      console.log('📡 [JOIN] Realtime subscription active');
      
      return { success: true, messages };
    } catch (error: any) {
      console.error('❌ [JOIN] Failed to join hangout:', error);
      return { success: false, error: error.message || 'Failed to join hangout' };
    }
  }

  /**
   * Leaves a hangout room (unsubscribes from all channels)
   */
  static async leaveHangout(roomId: string) {
    console.log('👋 [LEAVE] Leaving hangout:', roomId);
    
    try {
      // 1. Leave socket room
      hangoutService.leaveRoom(roomId);
      console.log('✅ [LEAVE] Socket disconnected');
      
      // 2. Unsubscribe from realtime
      const subscriptions = (hangoutService as any).realtimeSubscriptions;
      if (subscriptions && subscriptions.has(roomId)) {
        const channel = subscriptions.get(roomId);
        if (channel) {
          await supabase.removeChannel(channel);
          subscriptions.delete(roomId);
          console.log('✅ [LEAVE] Realtime unsubscribed');
        }
      }
      
      // 3. Clear active room tracking
      const activeRooms = (hangoutService as any).activeRooms;
      if (activeRooms) {
        activeRooms.delete(roomId);
        console.log('✅ [LEAVE] Room tracking cleared');
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ [LEAVE] Error during leave:', error);
      return { success: false, error: error.message || 'Failed to leave hangout' };
    }
  }
}

