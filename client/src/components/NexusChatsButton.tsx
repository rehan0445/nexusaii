import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useNexusChats } from '../contexts/NexusChatsContext';

interface NexusChatsButtonProps {
  className?: string;
  variant?: 'default' | 'compact';
}

/**
 * NC (Nexus Chats) Button
 * Opens Nexus Chats - unified view of all conversations
 */
export const NexusChatsButton: React.FC<NexusChatsButtonProps> = ({ 
  className = '', 
  variant = 'default' 
}) => {
  const { openChats, totalUnread } = useNexusChats();

  if (variant === 'compact') {
    return (
      <button
        onClick={openChats}
        className={`relative p-2 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 transition-all border border-green-500/20 hover:border-green-500/40 ${className}`}
        title="Nexus Chats"
      >
        <MessageSquare className="w-5 h-5 text-green-400" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-black rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-green-500/50">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={openChats}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500/10 to-green-600/10 hover:from-green-500/20 hover:to-green-600/20 active:from-green-500/30 active:to-green-600/30 transition-all border border-green-500/30 hover:border-green-500/50 backdrop-blur-sm ${className}`}
      title="Nexus Chats"
    >
      <MessageSquare className="w-5 h-5 text-green-400" />
      <span className="font-semibold text-sm text-white hidden sm:inline">
        NC
      </span>
      {totalUnread > 0 && (
        <span className="px-2 py-0.5 bg-green-500 text-black rounded-full text-xs font-bold shadow-lg shadow-green-500/50">
          {totalUnread > 99 ? '99+' : totalUnread}
        </span>
      )}
    </button>
  );
};

export default NexusChatsButton;

