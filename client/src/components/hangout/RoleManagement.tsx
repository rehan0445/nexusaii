import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Shield, 
  User, 
  UserPlus, 
  UserMinus, 
  Ban, 
  Unlock, 
  Settings, 
  Transfer,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { hangoutService } from '../../services/hangoutService';

interface Member {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'co-admin' | 'member';
  joinedAt: Date;
  lastActive: Date;
  isBanned?: boolean;
  banExpiry?: Date;
  bannedBy?: string;
  bannedAt?: Date;
}

interface JoinRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  requestedAt: Date;
  message?: string;
}

interface RoleManagementProps {
  roomId: string;
  currentUserRole: 'admin' | 'co-admin' | 'member';
  onRoleChange?: () => void;
}

const RoleManagement: React.FC<RoleManagementProps> = ({ 
  roomId, 
  currentUserRole, 
  onRoleChange 
}) => {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [banDuration, setBanDuration] = useState<number>(24); // hours
  const [banReason, setBanReason] = useState('');
  const [selectedBanDuration, setSelectedBanDuration] = useState<'1hour' | '1day' | '1week' | 'custom'>('1day');
  const [isLoading, setIsLoading] = useState(false);

  // Load members and requests
  useEffect(() => {
    loadRoomData();
  }, [roomId]);

  const loadRoomData = async () => {
    setIsLoading(true);
    try {
      const [membersData, requestsData] = await Promise.all([
        hangoutService.getRoomMembers(roomId),
        hangoutService.getPendingRequests(roomId)
      ]);
      setMembers(membersData);
      setPendingRequests(requestsData);
    } catch (error) {
      console.error('Error loading room data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Role management functions
  const assignCoAdmin = async (userId: string) => {
    if (currentUserRole !== 'admin') return;
    
    const success = await hangoutService.assignCoAdmin(roomId, userId);
    if (success) {
      loadRoomData();
      onRoleChange?.();
    }
  };

  const removeCoAdmin = async (userId: string) => {
    if (currentUserRole !== 'admin') return;
    
    const success = await hangoutService.removeCoAdmin(roomId, userId);
    if (success) {
      loadRoomData();
      onRoleChange?.();
    }
  };

  const transferOwnership = async (newAdminId: string) => {
    if (currentUserRole !== 'admin') return;
    
    const success = await hangoutService.transferOwnership(roomId, newAdminId);
    if (success) {
      onRoleChange?.();
    }
  };

  const banUser = async (userId: string) => {
    if (currentUserRole !== 'admin') return;
    
    const success = await hangoutService.banUser(roomId, userId, banDuration, banReason);
    if (success) {
      setShowBanModal(false);
      setBanReason('');
      loadRoomData();
    }
  };

  const unbanUser = async (userId: string) => {
    if (currentUserRole !== 'admin') return;
    
    const success = await hangoutService.unbanUser(roomId, userId);
    if (success) {
      loadRoomData();
    }
  };

  const removeMember = async (userId: string) => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'co-admin') return;
    
    const success = await hangoutService.removeMember(roomId, userId);
    if (success) {
      loadRoomData();
    }
  };

  const handleJoinRequest = async (requestId: string, action: 'accept' | 'reject') => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'co-admin') return;
    
    const success = await hangoutService.handleJoinRequest(roomId, requestId, action);
    if (success) {
      loadRoomData();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'co-admin': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-yellow-500';
      case 'co-admin': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const canManageRole = (memberRole: string) => {
    if (currentUserRole === 'admin') return true;
    if (currentUserRole === 'co-admin' && memberRole === 'member') return true;
    return false;
  };

  const formatLastActive = (lastActive: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(lastActive).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-softgold-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Join Requests */}
      {pendingRequests.length > 0 && (currentUserRole === 'admin' || currentUserRole === 'co-admin') && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
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
                    <p className="text-white font-medium">{request.userName}</p>
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

      {/* Members List */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Members ({members.length})
        </h3>
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-softgold-500 to-softgold-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{member.name}</p>
                    {getRoleIcon(member.role)}
                    {member.isBanned && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                        Banned
                      </span>
                    )}
                  </div>
                  <p className="text-white/60 text-sm">
                    Last active: {formatLastActive(member.lastActive)}
                  </p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                {member.role === 'member' && canManageRole(member.role) && (
                  <button
                    onClick={() => assignCoAdmin(member.id)}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                    title="Make Co-Admin"
                  >
                    <Shield className="w-4 h-4 text-blue-400" />
                  </button>
                )}
                
                {member.role === 'co-admin' && currentUserRole === 'admin' && (
                  <button
                    onClick={() => removeCoAdmin(member.id)}
                    className="p-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-colors"
                    title="Remove Co-Admin"
                  >
                    <UserMinus className="w-4 h-4 text-orange-400" />
                  </button>
                )}
                
                {member.role !== 'admin' && canManageRole(member.role) && (
                  <>
                    {!member.isBanned ? (
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setShowBanModal(true);
                        }}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                        title="Ban user"
                      >
                        <Ban className="w-4 h-4 text-red-400" />
                      </button>
                    ) : (
                      <button
                        onClick={() => unbanUser(member.id)}
                        className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                        title="Unban user"
                      >
                        <Unlock className="w-4 h-4 text-green-400" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => removeMember(member.id)}
                      className="p-2 bg-gray-500/20 hover:bg-gray-500/30 rounded-lg transition-colors"
                      title="Remove member"
                    >
                      <UserMinus className="w-4 h-4 text-gray-400" />
                    </button>
                  </>
                )}
                
                {member.role === 'co-admin' && currentUserRole === 'admin' && (
                  <button
                    onClick={() => {
                      setSelectedMember(member);
                      setShowTransferModal(true);
                    }}
                    className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg transition-colors"
                    title="Transfer ownership"
                  >
                    <Transfer className="w-4 h-4 text-yellow-400" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ban Modal */}
      {showBanModal && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Ban User</h3>
            <p className="text-white/70 mb-4">
              Ban <strong>{selectedMember.name}</strong> from this room?
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-3">Ban Duration</label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => {
                      setSelectedBanDuration('1hour');
                      setBanDuration(1);
                    }}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedBanDuration === '1hour'
                        ? 'border-softgold-400 bg-softgold-500/10'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-white font-medium">1 Hour</p>
                      <p className="text-white/60 text-xs">Quick timeout</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedBanDuration('1day');
                      setBanDuration(24);
                    }}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedBanDuration === '1day'
                        ? 'border-softgold-400 bg-softgold-500/10'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-white font-medium">1 Day</p>
                      <p className="text-white/60 text-xs">Standard ban</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedBanDuration('1week');
                      setBanDuration(168);
                    }}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedBanDuration === '1week'
                        ? 'border-softgold-400 bg-softgold-500/10'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-white font-medium">1 Week</p>
                      <p className="text-white/60 text-xs">Extended ban</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedBanDuration('custom')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedBanDuration === 'custom'
                        ? 'border-softgold-400 bg-softgold-500/10'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-white font-medium">Custom</p>
                      <p className="text-white/60 text-xs">Set duration</p>
                    </div>
                  </button>
                </div>
                
                {selectedBanDuration === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Custom Duration (hours)</label>
                    <input
                      type="number"
                      value={banDuration}
                      onChange={(e) => setBanDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white"
                      min="1"
                      max="168"
                      placeholder="Enter hours (1-168)"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Reason (optional)</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white"
                  rows={3}
                  placeholder="Why is this user being banned?"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setSelectedMember(null);
                }}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => banUser(selectedMember.id)}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Transfer Ownership</h3>
            <p className="text-white/70 mb-4">
              Transfer room ownership to <strong>{selectedMember.name}</strong>?
              <br />
              <span className="text-yellow-400 text-sm">
                ⚠️ This action cannot be undone. You will become a co-admin.
              </span>
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedMember(null);
                }}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => transferOwnership(selectedMember.id)}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition-colors"
              >
                Transfer Ownership
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
