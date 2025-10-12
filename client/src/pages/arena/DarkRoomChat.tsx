import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AnonymousChat from "../../components/AnonymousChat";
import { Group } from "../../utils/darkroomData";
import { Socket } from 'socket.io-client';
import { apiFetch, getSupabaseAccessToken } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";

const DarkRoomChat: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [darkRoomAlias, setDarkRoomAlias] = useState<string>("");
  const [currentRoom, setCurrentRoom] = useState<Group | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [darkroomMessage, setDarkroomMessage] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch room details and messages
  const fetchRoomDetails = async (id: string) => {
    try {
      console.log('🔄 [DarkRoomChat] Fetching room details for:', id);
      const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
      const response = await apiFetch(`${serverUrl}/api/v1/darkroom/rooms/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 [DarkRoomChat] Fetched room details:', data);
        
        const room: Group = {
          id: data.id,
          name: data.name || `Group ${data.id}`,
          description: data.description || 'Anonymous group',
          members: data.user_count || data.members || 0,
          messages: [],
          createdBy: data.created_by || data.createdBy || 'system',
          createdAt: data.created_at || data.createdAt,
          isDeleted: false
        };
        
        setCurrentRoom(room);
        
        // Fetch messages
        await fetchRoomMessages(id, room);
      } else {
        console.error('❌ [DarkRoomChat] Failed to fetch room:', response.status);
        // Room not found, go back
        navigate('/arena/darkroom', { replace: true });
      }
    } catch (error) {
      console.error('❌ [DarkRoomChat] Error fetching room:', error);
      navigate('/arena/darkroom', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages for the room
  const fetchRoomMessages = async (id: string, room: Group) => {
    try {
      console.log('📨 [DarkRoomChat] Fetching messages for room:', id);
      const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
      const response = await apiFetch(`${serverUrl}/api/v1/darkroom/rooms/${id}/messages`);

      if (response.ok) {
        const result = await response.json();
        console.log('📨 [DarkRoomChat] Received messages from API:', result);

        if (result.success && Array.isArray(result.messages)) {
          console.log(`✅ [DarkRoomChat] Loaded ${result.messages.length} messages for room ${id}`);
          
          const formattedMessages = result.messages.map((msg: any) => ({
            id: msg.id,
            alias: msg.alias || 'Anonymous',
            message: msg.message || '',
            time: msg.timestamp || msg.time || new Date().toISOString()
          }));
          
          setCurrentRoom({ ...room, messages: formattedMessages });
        }
      }
    } catch (error) {
      console.error('❌ [DarkRoomChat] Error fetching messages:', error);
    }
  };

  // Initialize on mount
  useEffect(() => {
    if (!roomId) {
      navigate('/arena/darkroom', { replace: true });
      return;
    }

    // Get alias from localStorage or set default
    const storedAlias = localStorage.getItem('darkroom_alias');
    if (storedAlias) {
      setDarkRoomAlias(storedAlias);
    } else {
      setDarkRoomAlias('Anonymous');
      localStorage.setItem('darkroom_alias', 'Anonymous');
    }

    // Fetch room details
    fetchRoomDetails(roomId);
  }, [roomId]);

  // Initialize socket connection
  useEffect(() => {
    const initSocket = async () => {
      if (!darkRoomAlias || !roomId) return;

      try {
        const { createSocket } = await import('../../lib/socketConfig');
        const token = getSupabaseAccessToken();
        const newSocket = await createSocket({
          token,
          options: {
            timeout: 8000,
            transports: ['websocket', 'polling']
          }
        });
        setSocket(newSocket);
      } catch (error) {
        console.error('❌ [DarkRoomChat] Failed to initialize socket:', error);
      }
    };

    initSocket();
  }, [darkRoomAlias, roomId]);

  // Socket event handlers
  useEffect(() => {
    if (socket && roomId && darkRoomAlias) {
      // Join the room
      console.log(`🔗 [DarkRoomChat] Joining socket room: ${roomId} with alias: ${darkRoomAlias}`);
      socket.emit('join-room', { 
        groupId: roomId, 
        alias: darkRoomAlias,
        user_name: currentUser?.displayName || null,
        user_email: currentUser?.email || null,
        user_id: currentUser?.uid || null
      });

      // Listen to room history
      socket.on('room-history', (messages: any[]) => {
        console.log('📚 [DarkRoomChat] Received room history:', messages?.length || 0, 'messages');
        
        if (messages && Array.isArray(messages)) {
          const formattedMessages = messages
            .filter(msg => msg.room_id === roomId)
            .map(msg => ({
              id: msg.id,
              alias: msg.alias || 'Anonymous',
              message: msg.message || '',
              time: msg.timestamp || msg.time || new Date().toISOString()
            }));

          setCurrentRoom(prev => prev ? { ...prev, messages: formattedMessages } : null);
        }
      });

      // Listen to incoming messages
      socket.on('receive-message', (data: any) => {
        console.log('📨 [DarkRoomChat] Received message:', data);
        
        if (data.groupId === roomId) {
          const newMessage = {
            id: data.id,
            alias: data.alias,
            message: data.message,
            time: data.time
          };
          
          setCurrentRoom(prev => {
            if (!prev) return null;
            
            const currentMessages = prev.messages || [];
            const messageExists = currentMessages.some(msg => 
              msg.id === data.id || 
              (msg.alias === data.alias && msg.message === data.message && 
               Math.abs(new Date(msg.time).getTime() - new Date(data.time).getTime()) < 1000)
            );
            
            if (messageExists) {
              console.log('⚠️ [DarkRoomChat] Duplicate message detected, skipping:', data.id);
              return prev;
            }
            
            return {
              ...prev,
              messages: [...currentMessages, newMessage]
            };
          });
        }
      });

      // Listen to user count updates
      socket.on('user-count-update', (data: any) => {
        console.log('👥 [DarkRoomChat] User count update:', data);
        if (data.roomId === roomId) {
          setCurrentRoom(prev => prev ? { ...prev, members: data.count } : null);
        }
      });

      // Cleanup on unmount
      return () => {
        if (socket) {
          socket.emit('leave-room', { groupId: roomId, alias: darkRoomAlias });
          socket.off('room-history');
          socket.off('receive-message');
          socket.off('user-count-update');
          socket.disconnect();
        }
      };
    }
  }, [socket, roomId, darkRoomAlias, currentUser]);

  // Handle send message
  const handleSend = () => {
    if (darkroomMessage.trim() && socket && currentRoom) {
      socket.emit('send-message', {
        groupId: currentRoom.id,
        message: darkroomMessage.trim(),
        alias: darkRoomAlias,
        time: new Date().toISOString(),
        user_name: currentUser?.displayName || null,
        user_email: currentUser?.email || null,
        user_id: currentUser?.uid || null
      });
      setDarkroomMessage('');
    }
  };

  // Handle back navigation
  const handleBack = () => {
    // Clean up socket connection before navigating
    if (socket) {
      console.log('🔌 [DarkRoomChat] Disconnecting socket before navigation');
      socket.emit('leave-room', { groupId: roomId, alias: darkRoomAlias });
      socket.off('room-history');
      socket.off('receive-message');
      socket.off('user-count-update');
      socket.disconnect();
    }
    // Use standard navigation for natural back behavior
    navigate('/arena/darkroom');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-green-500 font-mono">Loading room...</div>
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-red-500 font-mono">Room not found</div>
      </div>
    );
  }

  return (
    <AnonymousChat
      group={currentRoom}
      message={darkroomMessage}
      setMessage={setDarkroomMessage}
      alias={darkRoomAlias}
      onBack={handleBack}
      socket={socket!}
      onSend={handleSend}
      setGroups={setGroups}
    />
  );
};

export default DarkRoomChat;

