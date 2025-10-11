import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Grid,
  List,
  Settings
} from 'lucide-react';
import { useGroupChat } from '../contexts/GroupChatContext';
import GroupChatCard from '../components/GroupChatCard';

const GroupChats: React.FC = () => {
  const navigate = useNavigate();
  const { groupChats, requestToJoin, joinGroupChat } = useGroupChat();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredGroupChats = groupChats.filter(gc => {
    const matchesSearch = gc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         gc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         gc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || 
                           gc.tags.includes(filterCategory.toLowerCase());
    
    return matchesSearch && matchesCategory;
  });

  const handleJoin = async (groupId: string) => {
    try {
      await joinGroupChat(groupId);
      // Navigate to the group chat
      navigate(`/group-chat/${groupId}`);
    } catch (error) {
      console.error('Failed to join group chat:', error);
    }
  };

  const handleRequestJoin = async (groupId: string) => {
    try {
      await requestToJoin(groupId);
      // Show success message or notification
      console.log('Join request sent successfully');
    } catch (error) {
      console.error('Failed to send join request:', error);
    }
  };

  const handleViewChat = (groupId: string) => {
    navigate(`/group-chat/${groupId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-softgold-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/arena')}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">Back</span>
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-softgold-400 via-softgold-500 to-softgold-600 bg-clip-text text-transparent">
                Group Chats
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSearchBar(!showSearchBar)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm"
              title="Search group chats"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm"
              title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-3 bg-gradient-to-r from-softgold-500 to-softgold-600 hover:from-softgold-600 hover:to-softgold-700 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-softgold-500/25"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button 
              onClick={() => console.log('Settings')}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar - Conditional */}
        {showSearchBar && (
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
              <input
                type="text"
                placeholder="Search group chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-softgold-400 focus:bg-white/15 transition-all duration-300"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Filter Categories */}
        <div className="px-4 pb-4">
          <div className="flex gap-3 flex-wrap">
            {[
              { name: 'All', value: 'all', emoji: '🌟' },
              { name: 'Technology', value: 'technology', emoji: '💻' },
              { name: 'Gaming', value: 'gaming', emoji: '🎮' },
              { name: 'Business', value: 'business', emoji: '💼' },
              { name: 'Education', value: 'education', emoji: '📚' },
              { name: 'Entertainment', value: 'entertainment', emoji: '🎬' }
            ].map(category => (
              <button
                key={category.value}
                onClick={() => setFilterCategory(category.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  filterCategory === category.value
                    ? 'bg-gradient-to-r from-softgold-500 to-softgold-600 text-white shadow-lg'
                    : 'bg-white/10 hover:bg-white/20 text-white/70'
                }`}
              >
                <span>{category.emoji}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative z-10 p-6">
        {filteredGroupChats.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-softgold-400 to-softgold-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl">
              💬
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No Group Chats Found</h3>
            <p className="text-white/60 text-lg mb-6">
              {searchQuery ? 'Try adjusting your search terms' : 'Be the first to create a group chat!'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-softgold-500 to-softgold-600 hover:from-softgold-600 hover:to-softgold-700 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-softgold-500/25"
            >
              Create Group Chat
            </button>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredGroupChats.map((groupChat) => (
              <GroupChatCard
                key={groupChat.id}
                groupChat={groupChat}
                currentUserId="current-user"
                onJoin={handleJoin}
                onRequestJoin={handleRequestJoin}
                onViewChat={handleViewChat}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Group Chat Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-softgold-500 to-softgold-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg">
                💬
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Create Group Chat</h3>
              <p className="text-white/60">Start a new community</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="group-name" className="block text-sm font-medium text-white mb-3">Group Name</label>
                <input
                  id="group-name"
                  type="text"
                  placeholder="Enter group name..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-softgold-400 focus:bg-white/15 transition-all duration-300"
                />
              </div>
              
              <div>
                <label htmlFor="group-description" className="block text-sm font-medium text-white mb-3">Description</label>
                <textarea
                  id="group-description"
                  placeholder="Describe your group..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-softgold-400 focus:bg-white/15 transition-all duration-300 resize-none"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl">
                <input 
                  id="require-approval"
                  type="checkbox" 
                  className="w-5 h-5 rounded-lg accent-softgold-500" 
                />
                <label htmlFor="require-approval" className="text-white font-medium">Require approval to join</label>
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all duration-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-softgold-500 to-softgold-600 hover:from-softgold-600 hover:to-softgold-700 text-white rounded-2xl transition-all duration-300 font-medium shadow-lg hover:shadow-softgold-500/25"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChats;
