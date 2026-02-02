import { useState, useEffect, useCallback } from 'react';
import { hangoutService } from '../services/hangoutService';

interface RoomData {
  id: string;
  name: string;
  description: string;
  rules: string[];
  banner?: string;
  icon?: string;
  isPrivate: boolean;
  memberCount: number;
  lastUpdated: Date;
}

interface UseRealtimeRoomUpdatesProps {
  roomId: string;
  refreshInterval?: number; // in milliseconds, default 10000 (10 seconds)
}

export const useRealtimeRoomUpdates = ({ 
  roomId, 
  refreshInterval = 10000 
}: UseRealtimeRoomUpdatesProps) => {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [hasUpdates, setHasUpdates] = useState(false);

  const fetchRoomData = useCallback(async () => {
    try {
      const data = await hangoutService.getRoomDetails(roomId);
      if (data) {
        const newLastUpdate = new Date(data.lastUpdated || Date.now());
        
        // Check if there are updates
        if (lastUpdate && newLastUpdate > lastUpdate) {
          setHasUpdates(true);
          // Show notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Room Updated', {
              body: `Room "${data.name}" has been updated`,
              icon: '/favicon.ico'
            });
          }
        }
        
        setRoomData(data);
        setLastUpdate(newLastUpdate);
      }
    } catch (error) {
      console.error('Error fetching room data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, lastUpdate]);

  // Initial load
  useEffect(() => {
    fetchRoomData();
  }, [roomId]);

  // Set up auto-refresh
  useEffect(() => {
    const interval = setInterval(fetchRoomData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchRoomData, refreshInterval]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const markAsRead = useCallback(() => {
    setHasUpdates(false);
  }, []);

  const forceRefresh = useCallback(() => {
    setIsLoading(true);
    fetchRoomData();
  }, [fetchRoomData]);

  return {
    roomData,
    isLoading,
    hasUpdates,
    lastUpdate,
    markAsRead,
    forceRefresh,
    refreshInterval
  };
};

export default useRealtimeRoomUpdates;
