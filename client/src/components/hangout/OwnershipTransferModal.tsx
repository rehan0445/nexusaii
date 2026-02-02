import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  User,
  Activity
} from 'lucide-react';
import { hangoutService } from '../../services/hangoutService';

interface CoAdmin {
  id: string;
  name: string;
  avatar: string;
  lastActive: Date;
  activityScore: number;
}

interface OwnershipTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  currentAdminId: string;
  onTransferComplete: (newAdminId: string) => void;
}

const OwnershipTransferModal: React.FC<OwnershipTransferModalProps> = ({
  isOpen,
  onClose,
  roomId,
  currentAdminId,
  onTransferComplete
}) => {
  const [coAdmins, setCoAdmins] = useState<CoAdmin[]>([]);
  const [selectedCoAdmin, setSelectedCoAdmin] = useState<string | null>(null);
  const [transferType, setTransferType] = useState<'immediate' | 'notification'>('immediate');
  const [isTransferring, setIsTransferring] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCoAdmins();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (transferType === 'notification' && timeRemaining && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev ? prev - 1 : 0);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [transferType, timeRemaining]);

  const loadCoAdmins = async () => {
    try {
      const members = await hangoutService.getRoomMembers(roomId);
      const coAdmins = members
        .filter(member => member.role === 'co-admin')
        .map(member => ({
          ...member,
          activityScore: calculateActivityScore(member.lastActive)
        }))
        .sort((a, b) => b.activityScore - a.activityScore);
      
      setCoAdmins(coAdmins);
    } catch (error) {
      console.error('Error loading co-admins:', error);
    }
  };

  const calculateActivityScore = (lastActive: Date) => {
    const now = new Date();
    const hoursSinceActive = (now.getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60);
    
    // Higher score = more active
    if (hoursSinceActive < 1) return 100;
    if (hoursSinceActive < 24) return 80;
    if (hoursSinceActive < 72) return 60;
    if (hoursSinceActive < 168) return 40;
    return 20;
  };

  const handleTransfer = async () => {
    if (!selectedCoAdmin) return;

    setIsTransferring(true);
    try {
      if (transferType === 'immediate') {
        const success = await hangoutService.transferOwnership(roomId, selectedCoAdmin);
        if (success) {
          onTransferComplete(selectedCoAdmin);
          onClose();
        }
      } else {
        // Start notification process
        const success = await hangoutService.initiateOwnershipTransfer(roomId, selectedCoAdmin);
        if (success) {
          setTimeRemaining(48 * 60 * 60); // 48 hours in seconds
          // Start countdown
        }
      }
    } catch (error) {
      console.error('Error transferring ownership:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const getActivityColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getActivityLabel = (score: number) => {
    if (score >= 80) return 'Very Active';
    if (score >= 60) return 'Active';
    if (score >= 40) return 'Moderately Active';
    return 'Inactive';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            Transfer Room Ownership
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {timeRemaining && timeRemaining > 0 ? (
          /* Countdown Display */
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-xl font-semibold text-white mb-2">Transfer Notification Sent</h4>
            <p className="text-white/70 mb-4">
              Co-admins have been notified. If no one accepts within 48 hours, 
              the most active co-admin will automatically become the new admin.
            </p>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <p className="text-white/60 text-sm mb-2">Time Remaining:</p>
              <p className="text-2xl font-bold text-white">
                {formatTimeRemaining(timeRemaining)}
              </p>
            </div>
          </div>
        ) : (
          /* Transfer Options */
          <div className="space-y-6">
            {/* Transfer Type Selection */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-4">Transfer Method</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="transferType"
                    checked={transferType === 'immediate'}
                    onChange={() => setTransferType('immediate')}
                    className="w-4 h-4 accent-softgold-500"
                  />
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <div>
                      <span className="text-white font-medium">Immediate Transfer</span>
                      <p className="text-white/60 text-sm">Transfer ownership right now</p>
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="transferType"
                    checked={transferType === 'notification'}
                    onChange={() => setTransferType('notification')}
                    className="w-4 h-4 accent-softgold-500"
                  />
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <div>
                      <span className="text-white font-medium">Notify Co-Admins</span>
                      <p className="text-white/60 text-sm">Give co-admins 48 hours to accept, then auto-select most active</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Co-Admin Selection */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Select New Admin
              </h4>
              
              {coAdmins.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-white/50 mx-auto mb-4" />
                  <p className="text-white/70">No co-admins available for transfer</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {coAdmins.map((coAdmin) => (
                    <div
                      key={coAdmin.id}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedCoAdmin === coAdmin.id
                          ? 'border-softgold-400 bg-softgold-500/10'
                          : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                      }`}
                      onClick={() => setSelectedCoAdmin(coAdmin.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold">
                            {coAdmin.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium">{coAdmin.name}</p>
                              <Shield className="w-4 h-4 text-blue-500" />
                            </div>
                            <p className="text-white/60 text-sm">
                              Last active: {formatLastActive(coAdmin.lastActive)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`flex items-center gap-1 ${getActivityColor(coAdmin.activityScore)}`}>
                            <Activity className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {getActivityLabel(coAdmin.activityScore)}
                            </span>
                          </div>
                          <p className="text-xs text-white/50">
                            Score: {coAdmin.activityScore}/100
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Warning Message */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-medium mb-1">Important Notice</p>
                  <p className="text-white/70 text-sm">
                    {transferType === 'immediate' 
                      ? 'This action cannot be undone. You will become a co-admin and lose admin privileges.'
                      : 'Co-admins will be notified and have 48 hours to accept. If no one accepts, the most active co-admin will automatically become the new admin.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={!selectedCoAdmin || isTransferring}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 font-medium flex items-center justify-center gap-2"
              >
                {isTransferring ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    {transferType === 'immediate' ? 'Transfer Now' : 'Send Notification'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const formatLastActive = (lastActive: Date) => {
  const now = new Date();
  const diff = now.getTime() - new Date(lastActive).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

export default OwnershipTransferModal;
