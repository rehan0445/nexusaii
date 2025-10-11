import React, { useEffect } from 'react';
import { X, MessageSquare, RefreshCw, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useNexusChats } from '../contexts/NexusChatsContext';
import ChatListItem from './ChatListItem';

export const NexusChats: React.FC = () => {
  const navigate = useNavigate();
  const { 
    chats, 
    isLoading, 
    totalUnread, 
    refreshChats, 
    markAsRead, 
    isOpen, 
    closeChats 
  } = useNexusChats();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshChats();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleChatClick = async (chat: typeof chats[0]) => {
    // Mark as read
    await markAsRead(chat.id, chat.type);
    
    // Close the chats view
    closeChats();
    
    // Navigate to the chat
    navigate(chat.route);
  };

  const handleClose = () => {
    closeChats();
    setSearchQuery(''); // Reset search on close
  };

  // Filter chats based on search query
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Determine status message text
  const getStatusMessage = () => {
    if (totalUnread === 0) return 'All caught up!';
    const messageText = totalUnread === 1 ? 'message' : 'messages';
    return `${totalUnread} unread ${messageText}`;
  };

  // Determine empty state text
  const getEmptyStateTitle = () => searchQuery ? 'No chats found' : 'No chats yet';
  const getEmptyStateDescription = () => {
    if (searchQuery) return 'Try a different search term';
    return 'Start chatting with companions or join hangout rooms to see them here';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
            onClick={handleClose}
          />

          {/* Main Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 300 
            }}
            className="fixed inset-0 z-[9999] flex"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full h-full bg-black relative overflow-hidden">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900">
                <div className="absolute top-0 left-0 w-96 h-96 bg-softgold-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-softgold-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col">
                {/* Header */}
                <div className="flex-shrink-0 px-6 pt-8 pb-4 border-b border-softgold-500/20 bg-black/40 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-softgold-500/20 to-softgold-600/20 flex items-center justify-center backdrop-blur-sm border border-softgold-500/30">
                        <MessageSquare className="w-5 h-5 text-softgold-400" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-white">Nexus Chats</h1>
                        <p className="text-sm text-zinc-400">
                          {getStatusMessage()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Refresh button */}
                      <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 transition-all border border-softgold-500/20 hover:border-softgold-500/40"
                      >
                        <RefreshCw className={`w-5 h-5 text-softgold-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </button>

                      {/* Close button */}
                      <button
                        onClick={handleClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 active:bg-red-500/30 transition-all border border-softgold-500/20 hover:border-red-500/40"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Search bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search chats..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-softgold-500/20 text-white placeholder-zinc-500 focus:outline-none focus:border-softgold-500/50 focus:bg-white/10 transition-all"
                    />
                  </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {isLoading && chats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="w-16 h-16 border-4 border-softgold-500 border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-zinc-400">Loading your chats...</p>
                    </div>
                  ) : filteredChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-softgold-500/20 to-softgold-600/20 flex items-center justify-center mb-4 border border-softgold-500/30">
                        <MessageSquare className="w-10 h-10 text-softgold-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {getEmptyStateTitle()}
                      </h3>
                      <p className="text-zinc-400 text-center max-w-xs">
                        {getEmptyStateDescription()}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredChats.map((chat) => (
                        <ChatListItem
                          key={`${chat.type}-${chat.id}`}
                          chat={chat}
                          onClick={() => handleChatClick(chat)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer hint */}
                <div className="flex-shrink-0 px-6 py-4 border-t border-softgold-500/20 bg-black/40 backdrop-blur-xl">
                  <p className="text-xs text-center text-zinc-500">
                    Swipe right or tap close to exit
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NexusChats;

