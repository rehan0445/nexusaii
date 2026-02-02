import React, { useState } from 'react';
import { 
  Shield, 
  Ban, 
  VolumeX, 
  AlertTriangle, 
  UserX, 
  XCircle
} from 'lucide-react';

interface ModerationAction {
  id: string;
  type: 'warn' | 'mute' | 'ban' | 'kick' | 'delete';
  targetUserId: string;
  targetUsername: string;
  reason: string;
  moderatorId: string;
  moderatorName: string;
  timestamp: Date;
  duration?: number; // in minutes
}

interface ModerationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  currentUserId: string;
  isModerator: boolean;
}

const ModerationPanel: React.FC<ModerationPanelProps> = ({
  isOpen,
  onClose,
  roomId,
  currentUserId,
  isModerator
}) => {
  const getActionBgColor = (type: string) => {
    switch (type) {
      case 'warn': return 'bg-yellow-500/20';
      case 'mute': return 'bg-orange-500/20';
      case 'ban': return 'bg-red-500/20';
      default: return 'bg-purple-500/20';
    }
  };
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [actionType, setActionType] = useState<'warn' | 'mute' | 'ban' | 'kick' | 'delete'>('warn');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(60); // minutes
  const [showConfirm, setShowConfirm] = useState(false);

  // Mock recent actions - replace with actual API calls
  const [recentActions] = useState<ModerationAction[]>([
    {
      id: '1',
      type: 'warn',
      targetUserId: 'user1',
      targetUsername: 'JohnDoe',
      reason: 'Spam messages',
      moderatorId: 'mod1',
      moderatorName: 'Moderator1',
      timestamp: new Date(Date.now() - 300000)
    },
    {
      id: '2',
      type: 'mute',
      targetUserId: 'user2',
      targetUsername: 'JaneSmith',
      reason: 'Inappropriate language',
      moderatorId: 'mod1',
      moderatorName: 'Moderator1',
      timestamp: new Date(Date.now() - 600000),
      duration: 30
    }
  ]);

  const handleAction = () => {
    if (!selectedUser || !reason.trim()) return;
    
    setShowConfirm(true);
  };

  const confirmAction = () => {
    // Handle moderation action
    console.log('Moderation action:', {
      type: actionType,
      targetUser: selectedUser,
      reason,
      duration: actionType === 'mute' ? duration : undefined
    });
    
    setShowConfirm(false);
    setSelectedUser('');
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="w-6 h-6 text-softgold-400" />
            Moderation Panel
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {!isModerator ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-zinc-400">You don't have permission to access moderation tools.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Action Form */}
            <div className="bg-zinc-700/50 rounded-lg p-4">
              <h4 className="font-medium mb-4">Take Action</h4>
              <div className="space-y-4">
                <div>
                  <label htmlFor="selectUser" className="block text-sm font-medium mb-2">Select User</label>
                  <select
                    id="selectUser"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-600 border border-zinc-500 rounded-lg text-white focus:outline-none focus:border-softgold-500"
                  >
                    <option value="">Choose a user...</option>
                    <option value="user1">JohnDoe</option>
                    <option value="user2">JaneSmith</option>
                    <option value="user3">AlexJohnson</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="actionType" className="block text-sm font-medium mb-2">Action Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: 'warn', label: 'Warn', icon: AlertTriangle, color: 'text-yellow-400' },
                      { type: 'mute', label: 'Mute', icon: VolumeX, color: 'text-orange-400' },
                      { type: 'ban', label: 'Ban', icon: Ban, color: 'text-red-400' },
                      { type: 'kick', label: 'Kick', icon: UserX, color: 'text-purple-400' }
                    ].map(({ type, label, icon: Icon, color }) => (
                      <button
                        key={type}
                        onClick={() => setActionType(type as any)}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                          actionType === type
                            ? 'border-softgold-500 bg-softgold-500/20'
                            : 'border-zinc-600 hover:border-zinc-500'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className="text-sm">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {actionType === 'mute' && (
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium mb-2">Duration (minutes)</label>
                    <input
                      id="duration"
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      min="1"
                      max="1440"
                      className="w-full px-3 py-2 bg-zinc-600 border border-zinc-500 rounded-lg text-white focus:outline-none focus:border-softgold-500"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium mb-2">Reason</label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for this action..."
                    rows={3}
                    className="w-full px-3 py-2 bg-zinc-600 border border-zinc-500 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-softgold-500"
                  />
                </div>

                <button
                  onClick={handleAction}
                  disabled={!selectedUser || !reason.trim()}
                  className="w-full px-4 py-2 bg-softgold-600 hover:bg-softgold-700 disabled:bg-zinc-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Take Action
                </button>
              </div>
            </div>

            {/* Recent Actions */}
            <div>
              <h4 className="font-medium mb-4">Recent Actions</h4>
              <div className="space-y-2">
                {recentActions.map(action => (
                  <div key={action.id} className="bg-zinc-700/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getActionBgColor(action.type)}`}>
                          {action.type === 'warn' && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                          {action.type === 'mute' && <VolumeX className="w-4 h-4 text-orange-400" />}
                          {action.type === 'ban' && <Ban className="w-4 h-4 text-red-400" />}
                          {action.type === 'kick' && <UserX className="w-4 h-4 text-purple-400" />}
                        </div>
                        <div>
                          <p className="font-medium">{action.targetUsername}</p>
                          <p className="text-sm text-zinc-400">{action.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-zinc-400">{action.moderatorName}</p>
                        <p className="text-xs text-zinc-500">{action.timestamp.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60 p-4">
            <div className="bg-zinc-800 rounded-xl p-6 w-full max-w-md">
              <h4 className="text-lg font-semibold mb-4">Confirm Action</h4>
              <p className="text-zinc-300 mb-6">
                Are you sure you want to {actionType} <strong>{selectedUser}</strong>? 
                {actionType === 'mute' && ` This will mute them for ${duration} minutes.`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModerationPanel;
