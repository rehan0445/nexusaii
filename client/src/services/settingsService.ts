import axios from 'axios';
import { getAuth } from '../utils/auth';

export interface UserSettings {
  // General Settings
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  primaryLanguage: string;
  autoTranslate: boolean;
  incognitoMode: boolean;

  // Privacy Settings
  privacy: {
    publicProfile: boolean;
    hideChatHistory: boolean;
    videoCallPrivacy: 'friends' | 'verified' | 'everyone';
    showOnlineStatus: boolean;
    allowFriendRequests: boolean;
  };

  // Notification Settings
  notifications: {
    aiMessages: boolean;
    groupMentions: boolean;
    videoInvites: boolean;
    emailUpdates: boolean;
    pushNotifications: boolean;
  };

  // Time Management
  timeManagement: {
    dailyLimit: number;
    focusMode: boolean;
    focusStartTime: string;
    focusEndTime: string;
    weeklyReport: boolean;
  };

  // Security Settings
  security: {
    twoFactorEnabled: boolean;
    trustedDevices: Array<{
      id: string;
      name: string;
      lastUsed: string;
      location: string;
    }>;
    passwordLastChanged: string;
    loginHistory: Array<{
      timestamp: string;
      device: string;
      location: string;
      ip: string;
    }>;
  };

  // Activity Settings
  activity: {
    saveHistory: boolean;
    autoArchive: boolean;
    retentionPeriod: number; // days
  };
}

export interface Subscription {
  id: string;
  name: string;
  price: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  renewalDate: string;
  features: string[];
  planType: 'free' | 'premium' | 'pro';
}

export interface NotificationPreferences {
  category: string;
  enabled: boolean;
  channels: {
    push: boolean;
    email: boolean;
    inApp: boolean;
  };
}

class SettingsService {
  private cache = new Map<string, any>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private getBaseURL(): string {
    // Use centralized API configuration
    const { API_CONFIG } = require('../lib/config');
    return `${API_CONFIG.getServerUrl()}/api/v1/settings`;
  }

  private async getAuthHeaders() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private getCachedData(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  // Get all user settings
  async getUserSettings(): Promise<UserSettings> {
    const cached = this.getCachedData('userSettings');
    if (cached) return cached;

    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.getBaseURL()}/user`, { headers });
      this.setCachedData('userSettings', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user settings:', error);
      throw error;
    }
  }

  // Update specific setting
  async updateSetting(key: string, value: any): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.patch(`${this.getBaseURL()}/user/${key}`, { value }, { headers });
      
      // Invalidate cache
      this.cache.delete('userSettings');
      
      // Emit real-time update
      this.emitSettingUpdate(key, value);
    } catch (error) {
      console.error(`Failed to update setting ${key}:`, error);
      throw error;
    }
  }

  // Update privacy settings
  async updatePrivacySettings(privacy: UserSettings['privacy']): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.patch(`${this.getBaseURL()}/privacy`, privacy, { headers });
      
      // Invalidate cache
      this.cache.delete('userSettings');
      
      // Emit real-time update
      this.emitSettingUpdate('privacy', privacy);
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      throw error;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(notifications: UserSettings['notifications']): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.patch(`${this.getBaseURL()}/notifications`, notifications, { headers });
      
      // Invalidate cache
      this.cache.delete('userSettings');
      
      // Emit real-time update
      this.emitSettingUpdate('notifications', notifications);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  // Get user subscriptions
  async getSubscriptions(): Promise<Subscription[]> {
    const cached = this.getCachedData('subscriptions');
    if (cached) return cached;

    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.getBaseURL()}/subscriptions`, { headers });
      this.setCachedData('subscriptions', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.post(`${this.getBaseURL()}/subscriptions/${subscriptionId}/cancel`, {}, { headers });
      
      // Invalidate cache
      this.cache.delete('subscriptions');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  // Upgrade subscription
  async upgradeSubscription(subscriptionId: string, newPlan: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.post(`${this.getBaseURL()}/subscriptions/${subscriptionId}/upgrade`, 
        { newPlan }, { headers });
      
      // Invalidate cache
      this.cache.delete('subscriptions');
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
      throw error;
    }
  }

  // Get time management data
  async getTimeManagementData(): Promise<{
    dailyUsage: number;
    weeklyUsage: number;
    focusModeStats: {
      totalFocusTime: number;
      interruptions: number;
    };
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.getBaseURL()}/time-management`, { headers });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch time management data:', error);
      throw error;
    }
  }

  // Update time management settings
  async updateTimeManagement(timeManagement: UserSettings['timeManagement']): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.patch(`${this.getBaseURL()}/time-management`, timeManagement, { headers });
      
      // Invalidate cache
      this.cache.delete('userSettings');
      
      // Emit real-time update
      this.emitSettingUpdate('timeManagement', timeManagement);
    } catch (error) {
      console.error('Failed to update time management settings:', error);
      throw error;
    }
  }

  // Get activity data
  async getActivityData(): Promise<{
    savedPosts: any[];
    deletedGroups: any[];
    aiChatLogs: any[];
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.getBaseURL()}/activity`, { headers });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch activity data:', error);
      throw error;
    }
  }

  // Restore archived item
  async restoreArchivedItem(type: 'post' | 'group' | 'chat', itemId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.post(`${this.getBaseURL()}/activity/restore`, 
        { type, itemId }, { headers });
    } catch (error) {
      console.error('Failed to restore archived item:', error);
      throw error;
    }
  }

  // Block user
  async blockUser(userId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.post(`${this.getBaseURL()}/block`, { userId }, { headers });
      
      // Emit real-time update to chat/video modules
      this.emitUserBlocked(userId);
    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  }

  // Unblock user
  async unblockUser(userId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.delete(`${this.getBaseURL()}/block/${userId}`, { headers });
      
      // Emit real-time update to chat/video modules
      this.emitUserUnblocked(userId);
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw error;
    }
  }

  // Get blocked users
  async getBlockedUsers(): Promise<string[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.getBaseURL()}/block`, { headers });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch blocked users:', error);
      throw error;
    }
  }

  // Snooze notifications
  async snoozeNotifications(duration: '1h' | '8h' | '24h'): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.post(`${this.getBaseURL()}/notifications/snooze`, 
        { duration }, { headers });
    } catch (error) {
      console.error('Failed to snooze notifications:', error);
      throw error;
    }
  }

  // Report bug
  async reportBug(bugReport: {
    title: string;
    description: string;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    steps: string[];
  }): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.post(`${this.getBaseURL()}/report-bug`, bugReport, { headers });
    } catch (error) {
      console.error('Failed to report bug:', error);
      throw error;
    }
  }

  // Export user data
  async exportUserData(): Promise<Blob> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.getBaseURL()}/export`, { 
        headers,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw error;
    }
  }

  // Delete account
  async deleteAccount(confirmation: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.delete(`${this.getBaseURL()}/account`, 
        { 
          headers,
          data: { confirmation }
        });
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  }

  // Real-time update emitters
  private emitSettingUpdate(key: string, value: any) {
    // This would integrate with WebSocket or EventSource for real-time updates
    const event = new CustomEvent('settingUpdated', {
      detail: { key, value }
    });
    window.dispatchEvent(event);
  }

  private emitUserBlocked(userId: string) {
    const event = new CustomEvent('userBlocked', {
      detail: { userId }
    });
    window.dispatchEvent(event);
  }

  private emitUserUnblocked(userId: string) {
    const event = new CustomEvent('userUnblocked', {
      detail: { userId }
    });
    window.dispatchEvent(event);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Clear specific cache entry
  clearCacheEntry(key: string) {
    this.cache.delete(key);
  }
}

export const settingsService = new SettingsService();
export default settingsService; 