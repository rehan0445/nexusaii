import React, { useState } from 'react';
import { 
  X, 
  Users, 
  UserPlus, 
  Copy, 
  Check, 
  Crown, 
  Shield, 
  Link,
  Calendar,
  Hash,
  Lock,
  Globe
} from 'lucide-react';

interface RoomMember {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  isOnline: boolean;
}

interface RoomData {
  id: string;
  name: string;
  bio: string;
  pfp: string;
  about: string;
  rules: string[];
  members: RoomMember[];
  uniqueId: string;
  joiningLink: string;
  isPrivate: boolean;
  createdAt: Date;
  memberCount: number;
  maxMembers?: number;
  category: string;
  tags: string[];
}

interface RoomAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomData;
  currentUserId: string;
  onAddMember: (uniqueId: string) => void;
  onCopyLink: (link: string) => void;
}

export const RoomAboutModal: React.FC<RoomAboutModalProps> = ({
  isOpen,
  onClose,
  room,
  currentUserId,
  onAddMember,
  onCopyLink
}) => {
  const [showAddMember, setShowAddMember] = useState(false);
  const [uniqueIdInput, setUniqueIdInput] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  if (!isOpen) return null;

  const isAdmin = room.members.find(m => m.id === currentUserId)?.role === 'admin';
  const isModerator = room.members.find(m => m.id === currentUserId)?.role === 'moderator';
  const canAddMembers = isAdmin || isModerator;

  const handleCopyLink = () => {
    onCopyLink(room.joiningLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleAddMember = () => {
    if (uniqueIdInput.trim()) {
      onAddMember(uniqueIdInput.trim());
      setUniqueIdInput('');
      setShowAddMember(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'moderator': return <Shield className="w-4 h-4 text-blue-400" />;
      default: return <Users className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-yellow-400';
      case 'moderator': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-softgold-400 to-softgold-600 flex items-center justify-center">
              {room.pfp ? (
                <img src={room.pfp} alt={room.name} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <Hash className="w-6 h-6 text-zinc-900" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{room.name}</h2>
              <p className="text-zinc-400 text-sm">Room ID: {room.uniqueId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Bio Section */}
          {room.bio && (
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Bio</h3>
              <p className="text-zinc-300 leading-relaxed">{room.bio}</p>
            </div>
          )}

          {/* About Section */}
          {room.about && (
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">About</h3>
              <p className="text-zinc-300 leading-relaxed">{room.about}</p>
            </div>
          )}

          {/* Rules Section */}
          {room.rules.length > 0 && (
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Rules</h3>
              <div className="space-y-2">
                {room.rules.map((rule, index) => (
                  <div key={`rule-${index}-${rule.slice(0, 10)}`} className="flex items-start gap-3">
                    <span className="text-softgold-400 font-bold text-sm mt-1">{index + 1}.</span>
                    <p className="text-zinc-300 text-sm">{rule}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Section */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Members ({room.memberCount})</h3>
              {canAddMembers && (
                <button
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="flex items-center gap-2 px-4 py-2 bg-softgold-500 hover:bg-softgold-600 text-zinc-900 rounded-xl font-medium transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Member
                </button>
              )}
            </div>

            {/* Add Member Form */}
            {showAddMember && (
              <div className="mb-4 p-4 bg-zinc-800/50 rounded-xl border border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={uniqueIdInput}
                    onChange={(e) => setUniqueIdInput(e.target.value)}
                    placeholder="Enter unique ID"
                    className="flex-1 px-4 py-2 bg-zinc-700 border border-white/10 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-softgold-400"
                  />
                  <button
                    onClick={handleAddMember}
                    className="px-4 py-2 bg-softgold-500 hover:bg-softgold-600 text-zinc-900 rounded-lg font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {room.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl">
                  <div className="relative">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {member.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-zinc-900"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{member.name}</span>
                      {getRoleIcon(member.role)}
                    </div>
                    <p className={`text-xs ${getRoleColor(member.role)}`}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </p>
                  </div>
                  <div className="text-xs text-zinc-400">
                    Joined {member.joinedAt.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Room Info Section */}
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Room Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-zinc-400" />
                <div>
                  <p className="text-zinc-400 text-sm">Created</p>
                  <p className="text-white text-sm">{room.createdAt.toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {room.isPrivate ? (
                  <Lock className="w-5 h-5 text-red-400" />
                ) : (
                  <Globe className="w-5 h-5 text-green-400" />
                )}
                <div>
                  <p className="text-zinc-400 text-sm">Privacy</p>
                  <p className="text-white text-sm">{room.isPrivate ? 'Private' : 'Public'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 text-zinc-400" />
                <div>
                  <p className="text-zinc-400 text-sm">Category</p>
                  <p className="text-white text-sm">{room.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-zinc-400" />
                <div>
                  <p className="text-zinc-400 text-sm">Members</p>
                  <p className="text-white text-sm">
                    {room.memberCount}{room.maxMembers ? `/${room.maxMembers}` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Joining Link Section */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Joining Link</h3>
            <div className="flex items-center gap-3 p-4 bg-zinc-800/30 rounded-xl border border-white/10">
              <Link className="w-5 h-5 text-zinc-400" />
              <div className="flex-1">
                <p className="text-zinc-400 text-sm">Share this link to invite others</p>
                <p className="text-white text-sm font-mono break-all">{room.joiningLink}</p>
              </div>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 bg-softgold-500 hover:bg-softgold-600 text-zinc-900 rounded-lg font-medium transition-colors"
              >
                {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {linkCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
