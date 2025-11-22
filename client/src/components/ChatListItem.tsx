import React from 'react';
import { MessageCircle, Crown, Users } from 'lucide-react';
import { NexusChat } from '../contexts/NexusChatsContext';
import { formatDistanceToNow } from 'date-fns';

interface ChatListItemProps {
  chat: NexusChat;
  onClick: () => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({ chat, onClick }) => {
  const getTypeIcon = () => {
    switch (chat.type) {
      case 'hangout_palace':
        return <Crown className="w-4 h-4 text-softgold-400" />;
      case 'hangout_room':
        return <Users className="w-4 h-4 text-softgold-400" />;
      case 'companion':
        return <MessageCircle className="w-4 h-4 text-softgold-400" />;
      default:
        return <MessageCircle className="w-4 h-4 text-softgold-400" />;
    }
  };

  const getTypeLabel = () => {
    switch (chat.type) {
      case 'hangout_palace':
        return 'Palace';
      case 'hangout_room':
        return 'Room';
      case 'companion':
        return 'Companion';
      default:
        return '';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const renderAvatar = () => {
    // If avatar is an emoji or single character
    if (chat.avatar.length <= 2) {
      return (
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-softgold-500/20 to-softgold-600/20 flex items-center justify-center text-2xl backdrop-blur-sm border border-softgold-500/20">
          {chat.avatar}
        </div>
      );
    }
    
    // If avatar is an image URL
    return (
      <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-softgold-500/30 bg-zinc-800">
        <img 
          src={chat.avatar} 
          alt={chat.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to emoji on error
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.classList.add('flex', 'items-center', 'justify-center', 'text-2xl');
              parent.textContent = '💬';
            }
          }}
        />
      </div>
    );
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-4 flex items-start gap-4 hover:bg-white/5 active:bg-white/10 transition-all rounded-xl group relative overflow-hidden"
    >
      {/* Glassmorphism background on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-softgold-500/0 via-softgold-500/5 to-softgold-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {renderAvatar()}
        {chat.unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-softgold-500 text-black rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-softgold-500/50">
            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-base truncate group-hover:text-softgold-400 transition-colors">
              {chat.name}
            </h3>
          </div>
          <span className="text-xs text-zinc-400 whitespace-nowrap flex-shrink-0">
            {formatTimestamp(chat.timestamp)}
          </span>
        </div>

        {/* Type badge */}
        <div className="flex items-center gap-1 mb-2">
          {getTypeIcon()}
          <span className="text-xs text-softgold-400/80 font-medium">
            {getTypeLabel()}
          </span>
        </div>

        {/* Last message */}
        <p className="text-sm text-zinc-300 line-clamp-2 group-hover:text-zinc-200 transition-colors">
          {chat.lastMessage}
        </p>
      </div>

      {/* Unread indicator line */}
      {chat.unreadCount > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-softgold-400 to-softgold-600 rounded-r-full" />
      )}
    </button>
  );
};

export default ChatListItem;

