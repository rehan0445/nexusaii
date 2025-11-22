import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, Info, AlertTriangle, CheckCircle2, XCircle, Timer, MessageSquare, Users } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'message' | 'session';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  autoHide?: boolean;
  duration?: number;
  chatId?: string;
  userId?: string;
}

interface NotificationSystemProps {
  className?: string;
}

export function NotificationSystem({ className }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);

  // Simulate receiving notifications
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'message',
        title: 'New message in CS Study Group',
        message: 'Sarah Kim: "Anyone know the answer to problem 15?"',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        isRead: false,
        chatId: 'cs-study-group',
        autoHide: false
      },
      {
        id: '2',
        type: 'session',
        title: 'Study session starting',
        message: 'Pomodoro session begins in 2 minutes',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        isRead: false,
        autoHide: true,
        duration: 10000
      },
      {
        id: '3',
        type: 'info',
        title: 'New member joined',
        message: 'Mike Johnson joined Advanced Data Structures chat',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        isRead: true,
        autoHide: true,
        duration: 5000
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-hide if specified
    if (notification.autoHide) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, notification.duration || 5000);
    }

    // Request notification permission and show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: newNotification.id
      });
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case 'session':
        return <Timer className="w-5 h-5 text-purple-400" />;
      default:
        return <Info className="w-5 h-5 text-zinc-400" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
      >
        <Bell className="w-5 h-5 text-zinc-400" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-zinc-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <button
                onClick={() => setShowPanel(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {notifications.length > 0 && (
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-400 hover:text-blue-300"
                  disabled={unreadCount === 0}
                >
                  Mark all read
                </button>
                <button
                  onClick={clearAll}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-zinc-700/30 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-zinc-700/20' : ''
                    }`}
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.actionUrl) {
                        // Handle navigation
                        console.log('Navigate to:', notification.actionUrl);
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium ${
                            notification.isRead ? 'text-zinc-300' : 'text-white'
                          }`}>
                            {notification.title}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="text-zinc-500 hover:text-zinc-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <p className={`text-sm mt-1 ${
                          notification.isRead ? 'text-zinc-400' : 'text-zinc-300'
                        }`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-zinc-500">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                          
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {notifications
          .filter(n => n.autoHide && !n.isRead)
          .slice(0, 3)
          .map((notification) => (
            <div
              key={notification.id}
              className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 shadow-lg pointer-events-auto animate-in slide-in-from-right duration-300"
              style={{ maxWidth: '400px' }}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-zinc-300 mt-1">
                    {notification.message}
                  </p>
                </div>
                
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  // Expose methods for external use
  (NotificationSystem as any).addNotification = addNotification;
}

// Export utility functions
export const notificationUtils = {
  showMessage: (title: string, message: string, chatId?: string) => {
    if ((NotificationSystem as any).addNotification) {
      (NotificationSystem as any).addNotification({
        type: 'message',
        title,
        message,
        isRead: false,
        chatId,
        autoHide: true,
        duration: 5000
      });
    }
  },
  
  showSuccess: (title: string, message: string) => {
    if ((NotificationSystem as any).addNotification) {
      (NotificationSystem as any).addNotification({
        type: 'success',
        title,
        message,
        isRead: false,
        autoHide: true,
        duration: 3000
      });
    }
  },
  
  showError: (title: string, message: string) => {
    if ((NotificationSystem as any).addNotification) {
      (NotificationSystem as any).addNotification({
        type: 'error',
        title,
        message,
        isRead: false,
        autoHide: true,
        duration: 5000
      });
    }
  },
  
  showSessionAlert: (title: string, message: string) => {
    if ((NotificationSystem as any).addNotification) {
      (NotificationSystem as any).addNotification({
        type: 'session',
        title,
        message,
        isRead: false,
        autoHide: true,
        duration: 10000
      });
    }
  }
}; 