/**
 * Frontend Message Locking Service
 * Handles message locking, unlocking, and deletion restrictions on the frontend
 */

import { apiClient } from '../lib/apiConfig';

export interface MessageLockingStatus {
  id: string;
  author_id: string;
  is_locked: boolean;
  locked_by?: string;
  locked_at?: string;
  lock_reason?: string;
  deletion_restricted: boolean;
  restricted_by?: string;
  restriction_reason?: string;
  can_be_deleted_by_author: boolean;
}

export interface DeletionPermission {
  canDelete: boolean;
  reason: string;
}

export class MessageLockingService {
  /**
   * Lock a message
   * @param messageId - The message ID to lock
   * @param reason - Reason for locking
   * @returns Promise with success status
   */
  static async lockMessage(messageId: string, reason: string = 'Message locked by moderator'): Promise<{success: boolean, message?: string, error?: string}> {
    try {
      console.log(`🔒 Locking message ${messageId} with reason: ${reason}`);

      const response = await apiClient.post(`/api/hangout/messages/${messageId}/lock`, {
        reason
      });

      if (response.status === 200 && response.data.success) {
        console.log('✅ Message locked successfully:', response.data);
        return { success: true, message: response.data.message };
      } else {
        console.error('❌ Failed to lock message:', response.data);
        return { success: false, error: response.data.message || 'Failed to lock message' };
      }
    } catch (error: any) {
      console.error('❌ Error locking message:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to lock message' 
      };
    }
  }

  /**
   * Unlock a message
   * @param messageId - The message ID to unlock
   * @returns Promise with success status
   */
  static async unlockMessage(messageId: string): Promise<{success: boolean, message?: string, error?: string}> {
    try {
      console.log(`🔓 Unlocking message ${messageId}`);

      const response = await apiClient.post(`/api/hangout/messages/${messageId}/unlock`);

      if (response.status === 200 && response.data.success) {
        console.log('✅ Message unlocked successfully:', response.data);
        return { success: true, message: response.data.message };
      } else {
        console.error('❌ Failed to unlock message:', response.data);
        return { success: false, error: response.data.message || 'Failed to unlock message' };
      }
    } catch (error: any) {
      console.error('❌ Error unlocking message:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to unlock message' 
      };
    }
  }

  /**
   * Restrict message deletion
   * @param messageId - The message ID to restrict
   * @param reason - Reason for restriction
   * @param allowAuthorDelete - Whether author can still delete
   * @returns Promise with success status
   */
  static async restrictMessageDeletion(
    messageId: string, 
    reason: string = 'Message deletion restricted', 
    allowAuthorDelete: boolean = false
  ): Promise<{success: boolean, message?: string, error?: string}> {
    try {
      console.log(`🚫 Restricting deletion of message ${messageId} with reason: ${reason}`);

      const response = await apiClient.post(`/api/hangout/messages/${messageId}/restrict-deletion`, {
        reason,
        allowAuthorDelete
      });

      if (response.status === 200 && response.data.success) {
        console.log('✅ Message deletion restricted successfully:', response.data);
        return { success: true, message: response.data.message };
      } else {
        console.error('❌ Failed to restrict message deletion:', response.data);
        return { success: false, error: response.data.message || 'Failed to restrict message deletion' };
      }
    } catch (error: any) {
      console.error('❌ Error restricting message deletion:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to restrict message deletion' 
      };
    }
  }

  /**
   * Remove deletion restriction
   * @param messageId - The message ID to unrestrict
   * @returns Promise with success status
   */
  static async unrestrictMessageDeletion(messageId: string): Promise<{success: boolean, message?: string, error?: string}> {
    try {
      console.log(`✅ Removing deletion restriction from message ${messageId}`);

      const response = await apiClient.post(`/api/hangout/messages/${messageId}/unrestrict-deletion`);

      if (response.status === 200 && response.data.success) {
        console.log('✅ Message deletion restriction removed successfully:', response.data);
        return { success: true, message: response.data.message };
      } else {
        console.error('❌ Failed to unrestrict message deletion:', response.data);
        return { success: false, error: response.data.message || 'Failed to unrestrict message deletion' };
      }
    } catch (error: any) {
      console.error('❌ Error unrestricting message deletion:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to unrestrict message deletion' 
      };
    }
  }

  /**
   * Check if user can delete a message
   * @param messageId - The message ID to check
   * @returns Promise with deletion permission info
   */
  static async canDeleteMessage(messageId: string): Promise<{success: boolean, canDelete?: boolean, reason?: string, error?: string}> {
    try {
      console.log(`🔍 Checking deletion permissions for message ${messageId}`);

      const response = await apiClient.get(`/api/hangout/messages/${messageId}/can-delete`);

      if (response.status === 200 && response.data.success) {
        console.log('✅ Deletion permission checked:', response.data);
        return { 
          success: true, 
          canDelete: response.data.canDelete, 
          reason: response.data.reason 
        };
      } else {
        console.error('❌ Failed to check deletion permissions:', response.data);
        return { success: false, error: response.data.message || 'Failed to check deletion permissions' };
      }
    } catch (error: any) {
      console.error('❌ Error checking deletion permissions:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to check deletion permissions' 
      };
    }
  }

  /**
   * Get message locking status
   * @param messageId - The message ID to check
   * @returns Promise with message status
   */
  static async getMessageStatus(messageId: string): Promise<{success: boolean, data?: MessageLockingStatus, error?: string}> {
    try {
      console.log(`📊 Getting status for message ${messageId}`);

      // Debug: Check auth token before making request
      const authData = localStorage.getItem('nexus-auth');
      console.log('🔍 Auth data exists:', !!authData);
      if (authData) {
        const parsed = JSON.parse(authData);
        const token = parsed?.access_token;
        console.log('🔍 Token exists:', !!token);
        console.log('🔍 Token preview:', token?.substring(0, 30) + '...');
      }

      const response = await apiClient.get(`/api/hangout/messages/${messageId}/status`);

      if (response.status === 200 && response.data.success) {
        console.log('✅ Message status retrieved:', response.data);
        return { success: true, data: response.data.data };
      } else {
        console.error('❌ Failed to get message status:', response.data);
        return { success: false, error: response.data.message || 'Failed to get message status' };
      }
    } catch (error: any) {
      console.error('❌ Error getting message status:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to get message status' 
      };
    }
  }

  /**
   * Delete a message (with permission checking)
   * @param messageId - The message ID to delete
   * @returns Promise with deletion result
   */
  static async deleteMessage(messageId: string): Promise<{success: boolean, message?: string, error?: string}> {
    try {
      console.log(`🗑️ Attempting to delete message ${messageId}`);

      const response = await apiClient.delete(`/api/hangout/messages/${messageId}`);

      if (response.status === 200 && response.data.success) {
        console.log('✅ Message deleted successfully:', response.data);
        return { success: true, message: response.data.message };
      } else {
        console.error('❌ Failed to delete message:', response.data);
        return { success: false, error: response.data.message || 'Failed to delete message' };
      }
    } catch (error: any) {
      console.error('❌ Error deleting message:', error);
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        return { success: false, error: error.response.data.message || 'Permission denied' };
      } else if (error.response?.status === 404) {
        return { success: false, error: 'Message not found' };
      } else {
        return { 
          success: false, 
          error: error.response?.data?.message || error.message || 'Failed to delete message' 
        };
      }
    }
  }
}
