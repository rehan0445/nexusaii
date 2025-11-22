import React, { useState } from 'react';
import { 
  Users, 
  Crown, 
  UserPlus, 
  MessageSquare,
  Lock,
  Globe
} from 'lucide-react';

interface GroupChat {
  id: string;
  name: string;
  description: string;
  icon: string;
  banner: string;
  memberCount: number;
  maxMembers: number;
  rules: string[];
  admin: {
    id: string;
    name: string;
    avatar: string;
  };
  coAdmins: Array<{
    id: string;
    name: string;
    avatar: string;
  }>;
  isPrivate: boolean;
  joinRequestRequired: boolean;
  customRoles: Array<{
    id: string;
    name: string;
    permissions: string[];
  }>;
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    author: string;
    timestamp: Date;
    type: 'text' | 'image' | 'poll';
  }>;
  tags: string[];
  createdAt: Date;
  lastActivity: Date;
}

interface GroupChatCardProps {
  groupChat: GroupChat;
  currentUserId?: string;
  onJoin: (groupId: string) => void;
  onRequestJoin: (groupId: string) => void;
  onViewChat: (groupId: string) => void;
}

const GroupChatCard: React.FC<GroupChatCardProps> = ({
  groupChat,
  currentUserId,
  onJoin,
  onRequestJoin,
  onViewChat
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = () => {
    setIsJoining(true);
    try {
      if (groupChat.joinRequestRequired) {
        onRequestJoin(groupChat.id);
      } else {
        onJoin(groupChat.id);
      }
    } finally {
      setIsJoining(false);
    }
  };


  return (
    <div className="group relative w-full h-64 perspective-1000">
      {/* Card Container */}
      <button 
        className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d cursor-pointer ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
        type="button"
      >
        {/* Front Side */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <div className="relative w-full h-full bg-gradient-to-br from-softgold-500/10 to-amber-500/10 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden group-hover:border-white/20 transition-all duration-300">
            {/* Banner */}
            <div className="relative h-24 bg-gradient-to-r from-softgold-400 to-amber-500">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {groupChat.isPrivate ? (
                  <Lock className="w-4 h-4 text-white/80" />
                ) : (
                  <Globe className="w-4 h-4 text-white/80" />
                )}
                <span className="text-white/80 text-sm font-medium">
                  {groupChat.isPrivate ? 'Private' : 'Public'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 -mt-8 relative z-10">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-softgold-400 to-amber-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg mb-3">
                {groupChat.icon}
              </div>

              {/* Name */}
              <h3 className="text-xl font-bold text-white mb-2 truncate">
                {groupChat.name}
              </h3>

              {/* Member Count */}
              <div className="flex items-center gap-2 text-white/70 mb-3">
                <Users className="w-4 h-4" />
                <span className="text-sm">
                  {groupChat.memberCount.toLocaleString()} / {groupChat.maxMembers.toLocaleString()}
                </span>
              </div>

              {/* Tags */}
              <div className="flex gap-2 flex-wrap">
                {groupChat.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded-full">
                    #{tag}
                  </span>
                ))}
                {groupChat.tags.length > 3 && (
                  <span className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded-full">
                    +{groupChat.tags.length - 3}
                  </span>
                )}
              </div>

              {/* Flip Hint */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">↻</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <div className="relative w-full h-full bg-gradient-to-br from-softgold-500/10 to-amber-500/10 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden group-hover:border-white/20 transition-all duration-300">
            <div className="p-4 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-softgold-400 to-amber-500 rounded-xl flex items-center justify-center text-xl">
                  {groupChat.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white truncate">
                    {groupChat.name}
                  </h3>
                  <p className="text-white/60 text-sm">
                    {groupChat.memberCount.toLocaleString()} members
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <h4 className="text-white font-medium mb-2">Description</h4>
                <p className="text-white/70 text-sm leading-relaxed">
                  {groupChat.description}
                </p>
              </div>

              {/* Rules */}
              <div className="mb-4 flex-1">
                <h4 className="text-white font-medium mb-2">Rules</h4>
                <div className="space-y-1">
                  {groupChat.rules.slice(0, 3).map((rule) => (
                    <div key={rule} className="flex items-start gap-2">
                      <span className="text-softgold-400 text-sm">•</span>
                      <span className="text-white/70 text-sm">{rule}</span>
                    </div>
                  ))}
                  {groupChat.rules.length > 3 && (
                    <span className="text-white/50 text-sm">
                      +{groupChat.rules.length - 3} more rules
                    </span>
                  )}
                </div>
              </div>

              {/* Admin Info */}
              <div className="mb-4">
                <h4 className="text-white font-medium mb-2">Admin</h4>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                    <Crown className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-white/70 text-sm">{groupChat.admin.name}</span>
                </div>
              </div>

              {/* Join Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleJoin();
                }}
                disabled={isJoining}
                className="w-full py-3 bg-gradient-to-r from-softgold-500 to-amber-500 hover:from-softgold-600 hover:to-amber-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-softgold-500/25"
              >
                {(() => {
                  if (isJoining) {
                    return (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Joining...</span>
                      </div>
                    );
                  }
                  
                  if (groupChat.joinRequestRequired) {
                    return (
                      <div className="flex items-center justify-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        <span>Request to Join</span>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="flex items-center justify-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>Join Group</span>
                    </div>
                  );
                })()}
              </button>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};

export default GroupChatCard;
