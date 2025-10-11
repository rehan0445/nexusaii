import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  Smile,
  MoreVertical,
  Phone,
  Video,
  Search
} from 'lucide-react';
import { ChatRoom, ChatMessage } from '../types/chat';
import { useAuth } from '../contexts/AuthContext';

const DedicatedGroupChat: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [group, setGroup] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with actual API calls
  useEffect(() => {
    if (!groupId) return;

    // Simulate loading
    setTimeout(() => {
      const mockGroup: ChatRoom = {
        id: groupId,
        name: `Group ${groupId}`,
        description: 'A vibrant community for sharing ideas and discussions.',
        members: 156,
        category: 'Technology',
        messages: [],
        timeSpent: 180,
        trending: 12,
        activeNow: 23,
        lastActive: new Date()
      };

      const mockMessages: ChatMessage[] = [
        {
          id: '1',
          content: 'Hey everyone! Welcome to our group chat! 👋',
          sender: 'Alice',
          timestamp: new Date(Date.now() - 3600000),
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face'
        },
        {
          id: '2',
          content: 'Thanks for creating this group! Looking forward to great discussions.',
          sender: 'Bob',
          timestamp: new Date(Date.now() - 3000000),
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'
        },
        {
          id: '3',
          content: 'What topics are we planning to cover? I\'m particularly interested in AI and machine learning.',
          sender: 'Charlie',
          timestamp: new Date(Date.now() - 1800000),
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
        },
        {
          id: '4',
          content: 'Great question! We can discuss anything tech-related. AI, web dev, mobile apps, you name it!',
          sender: 'Alice',
          timestamp: new Date(Date.now() - 1200000),
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face'
        }
      ];

      setGroup(mockGroup);
      setMessages(mockMessages);
      setIsLoading(false);
    }, 1000);
  }, [groupId]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentUser) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      sender: currentUser.displayName || 'You',
      timestamp: new Date(),
      avatar: currentUser.photoURL || undefined
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-softgold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading group chat...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Group Not Found</h1>
          <p className="text-zinc-400 mb-6">The group you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/vibe')}
            className="px-6 py-2 bg-softgold-500 hover:bg-softgold-500 text-white rounded-lg transition-colors"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/vibe')}
              className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {group.name.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">{group.name}</h1>
                <p className="text-sm text-zinc-400">{group.members} members • {group.activeNow} online</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isOwn = message.sender === (currentUser?.displayName || 'You');
          const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender !== message.sender);
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                showAvatar ? 'mt-4' : 'mt-1'
              }`}
            >
              <div className={`flex items-end space-x-2 max-w-[70%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {!isOwn && showAvatar && (
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    {message.avatar ? (
                      <img src={message.avatar} alt={message.sender} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {message.sender.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className={`${!isOwn && showAvatar ? '' : 'ml-10'}`}>
                  {!isOwn && showAvatar && (
                    <div className="mb-1">
                      <span className="text-sm font-medium text-white">{message.sender}</span>
                    </div>
                  )}
                  
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-softgold-500 text-white rounded-br-sm'
                        : 'bg-zinc-800 text-white rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  
                  <div className={`mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                    <span className="text-xs text-zinc-500">{formatTime(message.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 p-4">
        <div className="flex items-center space-x-3">
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-softgold-500 focus:ring-1 focus:ring-softgold-500 resize-none"
              style={{ maxHeight: '120px' }}
            />
          </div>
          
          <button className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <Smile className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 rounded-full bg-softgold-500 hover:bg-softgold-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DedicatedGroupChat;
