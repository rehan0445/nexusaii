import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  UserMinus, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock,
  Crown,
  Shield,
  Search,
  Send
} from 'lucide-react';
import { hangoutService } from '../../services/hangoutService';

interface PendingRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  requestedAt: Date;
  message?: string;
  type: 'request' | 'invite';
}

interface User {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastActive: Date;
}

interface MemberInviteSystemProps {
  roomId: string;
  currentUserRole: 'admin' | 'co-admin' | 'member';
  onMemberAdded?: () => void;
}

const MemberInviteSystem: React.FC<MemberInviteSystemProps> = ({
  roomId,
  currentUserRole,
  onMemberAdded
}) => {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canManageMembers = currentUserRole === 'admin' || currentUserRole === 'co-admin';

  useEffect(() => {
    if (canManageMembers) {
      loadPendingRequests();
    }
  }, [roomId, canManageMembers]);

  const loadPendingRequests = async () => {
    try {
      const requests = await hangoutService.getPendingRequests(roomId);
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const loadAvailableUsers = async (query: string) => {
    if (!query.trim()) {
      setAvailableUsers([]);
      return;
    }

    setIsLoading(true);
    try {
      // Mock user search - in real implementation, this would search users
      const mockUsers: User[] = [
        {
          id: 'user1',
          name: 'John Doe',
          avatar: '👤',
          isOnline: true,
          lastActive: new Date()
        },
        {
          id: 'user2',
          name: 'Jane Smith',
          avatar: '👩',
          isOnline: false,
          lastActive: new Date(Date.now() - 3600000)
        },
        {
          id: 'user3',
          name: 'Mike Johnson',
          avatar: '👨',
          isOnline: true,
          lastActive: new Date(Date.now() - 1800000)
        }
      ].filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase())
      );

      setAvailableUsers(mockUsers);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRequest = async (requestId: string, action: 'accept' | 'reject') => {
    const success = await hangoutService.handleJoinRequest(roomId, requestId, action);
    if (success) {
      loadPendingRequests();
      onMemberAdded?.();
    }
  };

  const handleInviteUser = async () => {
    if (!selectedUser) return;

    const success = await hangoutService.inviteUser(roomId, selectedUser.id, inviteMessage);
    if (success) {
      setShowInviteModal(false);
      setSelectedUser(null);
      setInviteMessage('');
      onMemberAdded?.();
    }
  };

  const handleRequestToJoin = async () => {
    const success = await hangoutService.requestToJoin(roomId, 'I would like to join this room');
    if (success) {
      alert('Join request submitted successfully!');
    }
  };

  const formatLastActive = (lastActive: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(lastActive).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (!canManageMembers && currentUserRole === 'member') {
    return (
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Join This Room
        </h3>
        <p className="text-white/70 mb-4">
          Request to join this room and wait for admin approval.
        </p>
        <button
          onClick={handleRequestToJoin}
          className="px-4 py-2 bg-gradient-to-r from-softgold-500 to-softgold-600 hover:from-softgold-600 hover:to-softgold-700 text-black rounded-xl transition-all duration-300 font-medium"
        >
          Request to Join
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-softgold-500 to-softgold-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {request.userName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{request.userName}</p>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                        {request.type === 'request' ? 'Request' : 'Invite'}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm">
                      {formatLastActive(request.requestedAt)}
                    </p>
                    {request.message && (
                      <p className="text-white/70 text-sm mt-1">"{request.message}"</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleJoinRequest(request.id, 'accept')}
                    className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                    title="Accept request"
                  >
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </button>
                  <button
                    onClick={() => handleJoinRequest(request.id, 'reject')}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                    title="Reject request"
                  >
                    <XCircle className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Users */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Invite Users
        </h3>
        
        <div className="space-y-4">
          {/* Search Users */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users to invite..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                loadAvailableUsers(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-softgold-400 focus:bg-white/15 transition-all duration-300"
            />
          </div>

          {/* Available Users */}
          {searchQuery && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-softgold-500"></div>
                </div>
              ) : availableUsers.length > 0 ? (
                availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowInviteModal(true);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-softgold-500 to-softgold-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{user.name}</p>
                          <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                        </div>
                        <p className="text-white/60 text-sm">
                          {user.isOnline ? 'Online' : `Last seen ${formatLastActive(user.lastActive)}`}
                        </p>
                      </div>
                    </div>
                    <UserPlus className="w-4 h-4 text-white/50" />
                  </div>
                ))
              ) : (
                <p className="text-white/60 text-center py-4">No users found</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Invite User</h3>
            <p className="text-white/70 mb-4">
              Send an invitation to <strong>{selectedUser.name}</strong> to join this room.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Invitation Message (optional)</label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-softgold-400"
                  rows={3}
                  placeholder="Add a personal message to your invitation..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedUser(null);
                  setInviteMessage('');
                }}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteUser}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-softgold-500 to-softgold-600 hover:from-softgold-600 hover:to-softgold-700 text-black rounded-xl transition-all duration-300 font-medium flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberInviteSystem;
