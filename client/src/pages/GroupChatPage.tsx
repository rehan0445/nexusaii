import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { ThemeSelector } from '../components/ThemeSelector';
import { 
  ArrowLeft, 
  Info,
  MoreVertical, 
  Users, 
  Crown,
  Shield,
  UserX,
  Settings,
  Trash2,
  UserCheck,
  UserPlus,
  Palette,
  Gamepad2,
  Heart,
  Smile,
  Send,
  X,
  LogOut,
  Upload
} from 'lucide-react';
import { useGroupChat } from '../contexts/GroupChatContext';

interface ChatMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  timestamp: Date;
  reactions: { [key: string]: string[] };
  isDeleted: boolean;
  messageType: 'text' | 'image' | 'poll' | 'document' | 'location' | 'game';
  bubbleSkin?: string;
}

const GroupChatPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { getGroupChat, getUserRole } = useGroupChat();
  
  const [groupChat] = useState(getGroupChat(groupId || ''));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNexusPanel, setShowNexusPanel] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showThreeDots, setShowThreeDots] = useState(false);
  const [selectedBubbleSkin, setSelectedBubbleSkin] = useState('default');
  const [showGames, setShowGames] = useState(false);
  const [showBubbleSkins, setShowBubbleSkins] = useState(false);
  const [showCustomSticker, setShowCustomSticker] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [activeMessageMenu, setActiveMessageMenu] = useState<string | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [members] = useState<any[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = 'current-user';
  const { selectedTheme, applyTheme, getThemeStyles, getOverlayStyles } = useTheme(groupId, currentUserId);
  const userRole = getUserRole(groupId || '', currentUserId);

  // Mock data
  useEffect(() => {
    if (groupChat) {
      setMessages([
        {
          id: '1',
          content: 'Welcome to the group! 🎉',
          authorId: 'admin1',
          authorName: 'Alex Chen',
          authorAvatar: '',
          timestamp: new Date(),
          reactions: { '👍': ['user1', 'user2'], '❤️': ['user3'] },
          isDeleted: false,
          messageType: 'text'
        },
        {
          id: '2',
          content: 'Hey everyone! How is everyone doing?',
          authorId: 'user1',
          authorName: 'Sarah Johnson',
          authorAvatar: '',
          timestamp: new Date(),
          reactions: {},
          isDeleted: false,
          messageType: 'text'
        },
        {
          id: '3',
          content: 'Great! Just finished my project 🎉',
          authorId: 'user2',
          authorName: 'Mike Wilson',
          authorAvatar: '',
          timestamp: new Date(),
          reactions: { '🎉': ['user1', 'user3'], '👏': ['admin1'] },
          isDeleted: false,
          messageType: 'text'
        },
        {
          id: '4',
          content: 'That\'s awesome! What kind of project was it?',
          authorId: 'user3',
          authorName: 'Emma Davis',
          authorAvatar: '',
          timestamp: new Date(),
          reactions: {},
          isDeleted: false,
          messageType: 'text'
        },
        {
          id: '5',
          content: 'It was a web application using React and Node.js. Really excited about the results!',
          authorId: 'user2',
          authorName: 'Mike Wilson',
          authorAvatar: '',
          timestamp: new Date(),
          reactions: { '🔥': ['user1', 'user3', 'admin1'] },
          isDeleted: false,
          messageType: 'text'
        },
        {
          id: '6',
          content: 'That sounds amazing! Would love to see it sometime.',
          authorId: 'user1',
          authorName: 'Sarah Johnson',
          authorAvatar: '',
          timestamp: new Date(),
          reactions: {},
          isDeleted: false,
          messageType: 'text'
        },
        {
          id: '7',
          content: 'Absolutely! I can share the GitHub link if anyone is interested.',
          authorId: 'user2',
          authorName: 'Mike Wilson',
          authorAvatar: '',
          timestamp: new Date(),
          reactions: { '👍': ['user1', 'user3'], '❤️': ['admin1'] },
          isDeleted: false,
          messageType: 'text'
        },
        {
          id: '8',
          content: 'Yes please! I\'d love to check it out.',
          authorId: 'user3',
          authorName: 'Emma Davis',
          authorAvatar: '',
          timestamp: new Date(),
          reactions: {},
          isDeleted: false,
          messageType: 'text'
        },
        {
          id: '9',
          content: 'Me too! Always great to see what others are building.',
          authorId: 'user1',
          authorName: 'Sarah Johnson',
          authorAvatar: '',
          timestamp: new Date(),
          reactions: {},
          isDeleted: false,
          messageType: 'text'
        },
        {
          id: '10',
          content: 'Perfect! I\'ll share it in a bit. Thanks for the interest everyone!',
          authorId: 'user2',
          authorName: 'Mike Wilson',
          authorAvatar: '',
          timestamp: new Date(),
          reactions: { '🎉': ['user1', 'user3', 'admin1'] },
          isDeleted: false,
          messageType: 'text'
        }
      ]);
      
      
      setMembers([
        { id: 'admin1', name: 'Alex Chen', role: 'admin', avatar: '' },
        { id: 'coadmin1', name: 'Sarah Johnson', role: 'co-admin', avatar: '' },
        { id: 'user1', name: 'Mike Wilson', role: 'member', avatar: '' }
      ]);
    }
  }, [groupChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        content: newMessage,
        authorId: currentUserId,
        authorName: 'You',
        authorAvatar: '',
        timestamp: new Date(),
        reactions: {},
        isDeleted: false,
        messageType: 'text',
        bubbleSkin: selectedBubbleSkin
      };
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(prev => 
      prev.map(msg => {
        if (msg.id === messageId) {
          const reactions = { ...msg.reactions };
          if (reactions[emoji]) {
            if (reactions[emoji].includes(currentUserId)) {
              reactions[emoji] = reactions[emoji].filter(id => id !== currentUserId);
              if (reactions[emoji].length === 0) {
                delete reactions[emoji];
              }
            } else {
              reactions[emoji] = [...reactions[emoji], currentUserId];
            }
          } else {
            reactions[emoji] = [currentUserId];
          }
          return { ...msg, reactions };
        }
        return msg;
      })
    );
  };

  const getBubbleSkinClass = (skin: string) => {
    switch (skin) {
      case 'love': return 'bg-gradient-to-br from-pink-400 to-red-500';
      case 'flame': return 'bg-gradient-to-br from-orange-400 to-red-600';
      case 'ice': return 'bg-gradient-to-br from-cyan-400 to-blue-500';
      case 'creepy': return 'bg-gradient-to-br from-purple-600 to-gray-800';
      default: return 'bg-gradient-to-br from-softgold-400 to-softgold-600';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'co-admin': return <Shield className="w-4 h-4 text-blue-400" />;
      default: return <Users className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!groupChat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-softgold-400 to-softgold-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
            💬
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Group Chat Not Found</h3>
          <p className="text-white/60">This group chat doesn't exist or you don't have access.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white flex flex-col relative overflow-hidden"
      style={getThemeStyles()}
    >
      {/* Theme Overlay */}
      {selectedTheme && (
        <div style={getOverlayStyles()} />
      )}
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative z-50 bg-black/20 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Back button, Icon, Name */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/group-chats')}
              className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-softgold-400 to-softgold-600 rounded-xl flex items-center justify-center text-lg">
                {groupChat.icon}
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">{groupChat.name}</h1>
                <p className="text-white/60 text-sm">{groupChat.memberCount} members</p>
              </div>
            </div>
          </div>

          {/* Right Side - Info, 3 Dots */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInfoModal(true)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300"
              title="Group Info"
            >
              <Info className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowThreeDots(!showThreeDots)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300"
              title="More Options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages - WhatsApp Style */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 relative z-10 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-softgold-400 to-softgold-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl">
              💬
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Start the Conversation</h3>
            <p className="text-white/60 text-lg">Send your first message to get started!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.authorId === currentUserId ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md ${message.authorId === currentUserId ? 'ml-12' : 'mr-12'}`}>
                {/* Author name for group messages */}
                {message.authorId !== currentUserId && (
                  <div className="text-white/70 text-xs mb-1 px-2">
                    {message.authorName}
                  </div>
                )}
                
                {/* Message bubble */}
                <div 
                  className={`p-3 rounded-2xl ${
                    message.authorId === currentUserId 
                      ? 'bg-gradient-to-r from-softgold-500 to-softgold-600 rounded-br-md' 
                      : 'bg-white/10 backdrop-blur-sm rounded-bl-md'
                  } ${getBubbleSkinClass(message.bubbleSkin || 'default')} shadow-lg`}
                  onDoubleClick={() => {
                    // Show context menu on double click for mobile
                    setActiveMessageMenu(message.id);
                  }}
                  onMouseDown={() => {
                    const timer = setTimeout(() => {
                      setActiveMessageMenu(message.id);
                    }, 800); // 800ms long press
                    setLongPressTimer(timer);
                  }}
                  onMouseUp={() => {
                    if (longPressTimer) {
                      clearTimeout(longPressTimer);
                      setLongPressTimer(null);
                    }
                  }}
                  onMouseLeave={() => {
                    if (longPressTimer) {
                      clearTimeout(longPressTimer);
                      setLongPressTimer(null);
                    }
                  }}
                  onTouchStart={() => {
                    const timer = setTimeout(() => {
                      setActiveMessageMenu(message.id);
                    }, 800); // 800ms long press
                    setLongPressTimer(timer);
                  }}
                  onTouchEnd={() => {
                    if (longPressTimer) {
                      clearTimeout(longPressTimer);
                      setLongPressTimer(null);
                    }
                  }}
                  onTouchCancel={() => {
                    if (longPressTimer) {
                      clearTimeout(longPressTimer);
                      setLongPressTimer(null);
                    }
                  }}
                >
                  {message.isDeleted ? (
                    <p className="text-white/50 text-sm leading-relaxed italic">{message.content}</p>
                  ) : (
                    <p className="text-white text-sm leading-relaxed">{message.content}</p>
                  )}
                </div>
                
                {/* Timestamp */}
                <div className={`text-white/50 text-xs mt-1 px-2 ${message.authorId === currentUserId ? 'text-right' : 'text-left'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                
                {/* Reactions */}
                {Object.keys(message.reactions).length > 0 && (
                  <div className={`flex gap-1 mt-1 ${message.authorId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                    {Object.entries(message.reactions).map(([emoji, users]) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(message.id, emoji)}
                        className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs transition-all duration-300"
                      >
                        <span>{emoji}</span>
                        <span className="text-white/70">{users.length}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Context Menu */}
      {activeMessageMenu && (() => {
        const message = messages.find(m => m.id === activeMessageMenu);
        const isOwnMessage = message?.authorId === currentUserId;
        
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900/95 border border-white/10 rounded-xl shadow-xl p-4 w-full max-w-sm">
              <div className="space-y-2">
                {/* Common options for all messages */}
                <button 
                  onClick={() => {
                    if (message) {
                      navigator.clipboard.writeText(message.content);
                      setActiveMessageMenu(null);
                    }
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 text-white flex items-center gap-3"
                >
                  <span className="text-lg">📋</span>
                  <span>Copy</span>
                </button>
                
                <button 
                  onClick={() => {
                    setActiveMessageMenu(null);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 text-white flex items-center gap-3"
                >
                  <span className="text-lg">↩️</span>
                  <span>Reply</span>
                </button>
                
                <button 
                  onClick={() => {
                    setActiveMessageMenu(null);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 text-white flex items-center gap-3"
                >
                  <span className="text-lg">📤</span>
                  <span>Forward</span>
                </button>
                
                {/* Edit and Delete only for own messages */}
                {isOwnMessage && (
                  <>
                    <button 
                      onClick={() => {
                        setActiveMessageMenu(null);
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 text-white flex items-center gap-3"
                    >
                      <span className="text-lg">✏️</span>
                      <span>Edit</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setActiveMessageMenu(null);
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-300 flex items-center gap-3"
                    >
                      <span className="text-lg">🗑️</span>
                      <span>Delete</span>
                    </button>
                  </>
                )}
                
                <div className="border-t border-white/10 my-2" />
                
                <button 
                  onClick={() => {
                    setActiveMessageMenu(null);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 text-white flex items-center gap-3"
                >
                  <span className="text-lg">👍</span>
                  <span>React</span>
                </button>
                
                <button 
                  onClick={() => setActiveMessageMenu(null)}
                  className="w-full text-center px-4 py-3 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white mt-4"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bottom Text Bar - Proper Proportions */}
      <div className="relative z-40 bg-black/20 backdrop-blur-xl border-t border-white/10 p-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Left Section - 25% (React, N, + buttons) */}
          <div className="flex items-center gap-2 w-1/4">
            {/* React Button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-105"
              title="Emojis & Stickers"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Glowing N Button */}
            <button
              onClick={() => setShowNexusPanel(!showNexusPanel)}
              className="p-3 bg-gradient-to-r from-softgold-500 to-softgold-600 hover:from-softgold-600 hover:to-softgold-700 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-softgold-500/25 relative"
              title="Nexus Features"
            >
              <span className="text-white font-bold text-lg">n</span>
              <div className="absolute inset-0 bg-gradient-to-r from-softgold-500 to-softgold-600 rounded-xl blur opacity-75 animate-pulse"></div>
            </button>

          </div>

          {/* Middle Section - 70% (Text Input) */}
          <div className="flex-1 w-3/5">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-softgold-400 focus:bg-white/15 transition-all duration-300"
            />
          </div>

          {/* Right Section - 5% (Send Button) */}
          <div className="w-1/20 flex justify-center">
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="p-3 bg-gradient-to-r from-softgold-500 to-softgold-600 hover:from-softgold-600 hover:to-softgold-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-softgold-500/25"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Group Info</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-softgold-400 to-softgold-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-2xl">
                {groupChat.icon}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{groupChat.name}</h2>
              <p className="text-white/60">{groupChat.memberCount} members</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">Description</h4>
                <p className="text-white/70 text-sm leading-relaxed">{groupChat.description}</p>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-2">Rules</h4>
                <div className="space-y-1">
                  {groupChat.rules.map((rule) => (
                    <div key={rule} className="flex items-start gap-2">
                      <span className="text-softgold-400 text-sm">•</span>
                      <span className="text-white/70 text-sm">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-2">Admin</h4>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{groupChat.admin.name}</p>
                    <p className="text-white/60 text-sm">Group Admin</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3 Dots Menu */}
      {showThreeDots && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">More Options</h3>
              <button
                onClick={() => setShowThreeDots(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowThreeDots(false);
                  setShowThemeSelector(true);
                }}
                className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 flex items-center gap-4"
              >
                <Palette className="w-6 h-6 text-softgold-400" />
                <div className="text-left">
                  <h4 className="text-white font-medium">Theme</h4>
                  <p className="text-white/60 text-sm">Change chat theme</p>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowThreeDots(false);
                  if (confirm('Are you sure you want to leave this group?')) {
                    navigate('/group-chats');
                  }
                }}
                className="w-full p-4 bg-red-500/20 hover:bg-red-500/30 rounded-2xl transition-all duration-300 flex items-center gap-4"
              >
                <LogOut className="w-6 h-6 text-red-400" />
                <div className="text-left">
                  <h4 className="text-white font-medium">Leave Group</h4>
                  <p className="text-white/60 text-sm">Exit this group chat</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Emojis & Stickers</h3>
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-8 gap-3 mb-4">
              {['😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉', '🚀', '💪'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    setNewMessage(prev => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110 text-2xl"
                >
                  {emoji}
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300">
                GIFs
              </button>
              <button className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300">
                Stickers
              </button>
              <button 
                onClick={() => {
                  setShowEmojiPicker(false);
                  setShowCustomSticker(true);
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-softgold-500 to-softgold-600 text-white rounded-xl transition-all duration-300"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nexus Panel Modal */}
      {showNexusPanel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Nexus Features</h3>
              <button
                onClick={() => setShowNexusPanel(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowGames(true);
                  setShowNexusPanel(false);
                }}
                className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 flex items-center gap-4"
              >
                <Gamepad2 className="w-6 h-6 text-softgold-400" />
                <div className="text-left">
                  <h4 className="text-white font-medium">Games</h4>
                  <p className="text-white/60 text-sm">Play with group members</p>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowBubbleSkins(true);
                  setShowNexusPanel(false);
                }}
                className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 flex items-center gap-4"
              >
                <Heart className="w-6 h-6 text-pink-400" />
                <div className="text-left">
                  <h4 className="text-white font-medium">Chat Bubble Skins</h4>
                  <p className="text-white/60 text-sm">Customize your messages</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Games Modal */}
      {showGames && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Games</h3>
              <button
                onClick={() => setShowGames(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Scribble', icon: '🎨', desc: 'Drawing game' },
                { name: 'Ludo', icon: '🎲', desc: 'Board game' },
                { name: 'Carrom', icon: '🎯', desc: 'Strike game' },
                { name: 'Chess', icon: '♟️', desc: 'Strategy game' }
              ].map(game => (
                <button
                  key={game.name}
                  className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 text-center"
                >
                  <div className="text-3xl mb-2">{game.icon}</div>
                  <h4 className="text-white font-medium">{game.name}</h4>
                  <p className="text-white/60 text-sm">{game.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bubble Skins Modal */}
      {showBubbleSkins && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Chat Bubble Skins</h3>
              <button
                onClick={() => setShowBubbleSkins(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Default', skin: 'default', icon: '💬' },
                { name: 'Love', skin: 'love', icon: '❤️' },
                { name: 'Flame', skin: 'flame', icon: '🔥' },
                { name: 'Ice', skin: 'ice', icon: '❄️' },
                { name: 'Creepy', skin: 'creepy', icon: '💀' }
              ].map(skin => (
                <button
                  key={skin.skin}
                  onClick={() => {
                    setSelectedBubbleSkin(skin.skin);
                    setShowBubbleSkins(false);
                  }}
                  className={`p-4 rounded-2xl transition-all duration-300 text-center ${
                    selectedBubbleSkin === skin.skin
                      ? 'bg-gradient-to-r from-softgold-500 to-softgold-600 shadow-lg'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <div className="text-3xl mb-2">{skin.icon}</div>
                  <h4 className="text-white font-medium">{skin.name}</h4>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Admin Panel</h3>
              <button
                onClick={() => setShowAdminPanel(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowAdminPanel(false);
                  // Show approval list
                }}
                className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 flex items-center gap-4"
              >
                <UserCheck className="w-6 h-6 text-green-400" />
                <div className="text-left">
                  <h4 className="text-white font-medium">Approval List</h4>
                  <p className="text-white/60 text-sm">Manage join requests</p>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowUserList(true);
                  setShowAdminPanel(false);
                }}
                className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 flex items-center gap-4"
              >
                <Users className="w-6 h-6 text-blue-400" />
                <div className="text-left">
                  <h4 className="text-white font-medium">User List</h4>
                  <p className="text-white/60 text-sm">Manage members</p>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowAdminPanel(false);
                  // Show co-admin management
                }}
                className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 flex items-center gap-4"
              >
                <Shield className="w-6 h-6 text-purple-400" />
                <div className="text-left">
                  <h4 className="text-white font-medium">Manage Co-Admins</h4>
                  <p className="text-white/60 text-sm">Add/remove co-admins</p>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowCustomRoles(true);
                  setShowAdminPanel(false);
                }}
                className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 flex items-center gap-4"
              >
                <Settings className="w-6 h-6 text-softgold-400" />
                <div className="text-left">
                  <h4 className="text-white font-medium">Custom Roles</h4>
                  <p className="text-white/60 text-sm">Create custom roles</p>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowAdminPanel(false);
                  // Show transfer ownership
                }}
                className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 flex items-center gap-4"
              >
                <Crown className="w-6 h-6 text-yellow-400" />
                <div className="text-left">
                  <h4 className="text-white font-medium">Transfer Ownership</h4>
                  <p className="text-white/60 text-sm">Transfer group ownership</p>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowAdminPanel(false);
                  // Show delete confirmation
                }}
                className="w-full p-4 bg-red-500/20 hover:bg-red-500/30 rounded-2xl transition-all duration-300 flex items-center gap-4"
              >
                <Trash2 className="w-6 h-6 text-red-400" />
                <div className="text-left">
                  <h4 className="text-white font-medium">Delete Group</h4>
                  <p className="text-white/60 text-sm">Permanently delete group</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User List Modal */}
      {showUserList && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Members ({members.length})</h3>
              <button
                onClick={() => setShowUserList(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-softgold-400 to-softgold-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{member.name}</span>
                        {getRoleIcon(member.role)}
                      </div>
                      <p className="text-white/60 text-sm">{member.role}</p>
                    </div>
                  </div>
                  
                  {userRole === 'admin' && member.role !== 'admin' && (
                    <button className="p-2 hover:bg-red-500/20 rounded-xl transition-all duration-300">
                      <UserX className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom Roles Modal */}
      {showCustomRoles && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Custom Roles</h3>
              <button
                onClick={() => setShowCustomRoles(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <button className="w-full p-4 bg-gradient-to-r from-softgold-500 to-softgold-600 text-white rounded-2xl transition-all duration-300">
                <UserPlus className="w-5 h-5 inline mr-2" />
                Create New Role
              </button>
              
              <div className="space-y-2">
                <div className="p-3 bg-white/5 rounded-xl flex items-center justify-between">
                  <span className="text-white">Mentor</span>
                  <button className="p-1 hover:bg-white/10 rounded-lg">
                    <Settings className="w-4 h-4 text-white/60" />
                  </button>
                </div>
                <div className="p-3 bg-white/5 rounded-xl flex items-center justify-between">
                  <span className="text-white">Recruiter</span>
                  <button className="p-1 hover:bg-white/10 rounded-lg">
                    <Settings className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Sticker Creation Modal */}
      {showCustomSticker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Create Custom Sticker</h3>
              <button
                onClick={() => setShowCustomSticker(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-white/60" />
                <h4 className="text-white font-medium mb-2">Upload Image</h4>
                <p className="text-white/60 text-sm mb-4">Drag and drop an image or click to browse</p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="sticker-upload"
                />
                <label
                  htmlFor="sticker-upload"
                  className="px-6 py-3 bg-gradient-to-r from-softgold-500 to-softgold-600 text-white rounded-xl transition-all duration-300 cursor-pointer hover:from-softgold-600 hover:to-softgold-700"
                >
                  Choose Image
                </label>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCustomSticker(false)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowCustomSticker(false);
                    // Handle sticker creation
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-softgold-500 to-softgold-600 text-white rounded-xl transition-all duration-300"
                >
                  Create Sticker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theme Selector */}
      <ThemeSelector
        isOpen={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
        onSelectTheme={async (themeId) => {
          try {
            const { imageThemes } = await import('../themes/image-themes');
            const theme = Object.values(imageThemes).find((t: any) => t.id === themeId);
            if (theme) {
              console.log('🎨 Applying theme in GroupChat:', theme.name, themeId);
              applyTheme(theme);
              setShowThemeSelector(false);
              console.log('✅ Theme applied successfully in GroupChat:', theme.name);
            } else {
              console.error('❌ Theme not found in GroupChat:', themeId);
            }
          } catch (error) {
            console.error('❌ Error applying theme in GroupChat:', error);
          }
        }}
        activeTheme={selectedTheme?.id || ''}
      />
    </div>
  );
};

export default GroupChatPage;
