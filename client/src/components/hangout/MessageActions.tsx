/**
 * Message Actions Component
 * Provides locking, unlocking, and deletion restriction actions for messages
 */

import React, { useState } from 'react';
import { MessageLockingService, MessageLockingStatus } from '../../services/messageLockingService';
import { useAuth } from '../../contexts/AuthContext';

interface MessageActionsProps {
  messageId: string;
  authorId: string;
  currentMessageStatus?: MessageLockingStatus;
  isModerator?: boolean;
  onStatusChange?: (status: MessageLockingStatus) => void;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  messageId,
  authorId,
  currentMessageStatus,
  isModerator = false,
  onStatusChange,
  onError,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [showRestrictDialog, setShowRestrictDialog] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [restrictReason, setRestrictReason] = useState('');
  const [allowAuthorDelete, setAllowAuthorDelete] = useState(false);

  const currentUserId = currentUser?.uid;
  const isMessageAuthor = currentUserId === authorId;
  const isLocked = currentMessageStatus?.is_locked || false;
  const isDeletionRestricted = currentMessageStatus?.deletion_restricted || false;

  const handleLockMessage = async () => {
    if (!lockReason.trim()) {
      onError?.('Please provide a reason for locking the message');
      return;
    }

    setIsLoading(true);
    try {
      const result = await MessageLockingService.lockMessage(messageId, lockReason);
      
      if (result.success) {
        onSuccess?.('Message locked successfully');
        setShowLockDialog(false);
        setLockReason('');
        // Refresh message status
        const statusResult = await MessageLockingService.getMessageStatus(messageId);
        if (statusResult.success) {
          onStatusChange?.(statusResult.data!);
        }
      } else {
        onError?.(result.error || 'Failed to lock message');
      }
    } catch (error) {
      onError?.('Failed to lock message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockMessage = async () => {
    setIsLoading(true);
    try {
      const result = await MessageLockingService.unlockMessage(messageId);
      
      if (result.success) {
        onSuccess?.('Message unlocked successfully');
        // Refresh message status
        const statusResult = await MessageLockingService.getMessageStatus(messageId);
        if (statusResult.success) {
          onStatusChange?.(statusResult.data!);
        }
      } else {
        onError?.(result.error || 'Failed to unlock message');
      }
    } catch (error) {
      onError?.('Failed to unlock message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestrictDeletion = async () => {
    if (!restrictReason.trim()) {
      onError?.('Please provide a reason for restricting deletion');
      return;
    }

    setIsLoading(true);
    try {
      const result = await MessageLockingService.restrictMessageDeletion(
        messageId, 
        restrictReason, 
        allowAuthorDelete
      );
      
      if (result.success) {
        onSuccess?.('Message deletion restricted successfully');
        setShowRestrictDialog(false);
        setRestrictReason('');
        setAllowAuthorDelete(false);
        // Refresh message status
        const statusResult = await MessageLockingService.getMessageStatus(messageId);
        if (statusResult.success) {
          onStatusChange?.(statusResult.data!);
        }
      } else {
        onError?.(result.error || 'Failed to restrict message deletion');
      }
    } catch (error) {
      onError?.('Failed to restrict message deletion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnrestrictDeletion = async () => {
    setIsLoading(true);
    try {
      const result = await MessageLockingService.unrestrictMessageDeletion(messageId);
      
      if (result.success) {
        onSuccess?.('Message deletion restriction removed successfully');
        // Refresh message status
        const statusResult = await MessageLockingService.getMessageStatus(messageId);
        if (statusResult.success) {
          onStatusChange?.(statusResult.data!);
        }
      } else {
        onError?.(result.error || 'Failed to unrestrict message deletion');
      }
    } catch (error) {
      onError?.('Failed to unrestrict message deletion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMessage = async () => {
    setIsLoading(true);
    try {
      // First check if user can delete
      const permissionCheck = await MessageLockingService.canDeleteMessage(messageId);
      
      if (!permissionCheck.success) {
        onError?.(permissionCheck.error || 'Failed to check deletion permissions');
        return;
      }

      if (!permissionCheck.canDelete) {
        onError?.(permissionCheck.reason || 'You cannot delete this message');
        return;
      }

      const result = await MessageLockingService.deleteMessage(messageId);
      
      if (result.success) {
        onSuccess?.('Message deleted successfully');
      } else {
        onError?.(result.error || 'Failed to delete message');
      }
    } catch (error) {
      onError?.('Failed to delete message');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show actions for non-moderators unless it's their own message
  if (!isModerator && !isMessageAuthor) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      {/* Lock/Unlock Actions */}
      {isModerator && (
        <div className="flex flex-col gap-1">
          {!isLocked ? (
            <button
              onClick={() => setShowLockDialog(true)}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg transition-colors disabled:opacity-50"
            >
              <span>🔒</span>
              <span>Lock Message</span>
            </button>
          ) : (
            <button
              onClick={handleUnlockMessage}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors disabled:opacity-50"
            >
              <span>🔓</span>
              <span>Unlock Message</span>
            </button>
          )}
        </div>
      )}

      {/* Deletion Restriction Actions */}
      {isModerator && (
        <div className="flex flex-col gap-1">
          {!isDeletionRestricted ? (
            <button
              onClick={() => setShowRestrictDialog(true)}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors disabled:opacity-50"
            >
              <span>🚫</span>
              <span>Restrict Deletion</span>
            </button>
          ) : (
            <button
              onClick={handleUnrestrictDeletion}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors disabled:opacity-50"
            >
              <span>✅</span>
              <span>Allow Deletion</span>
            </button>
          )}
        </div>
      )}

      {/* Delete Message Action */}
      {(isMessageAuthor || isModerator) && (
        <button
          onClick={handleDeleteMessage}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
        >
          <span>🗑️</span>
          <span>Delete Message</span>
        </button>
      )}

      {/* Lock Dialog */}
      {showLockDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Lock Message</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="lock-reason" className="block text-sm text-gray-300 mb-2">Reason for locking:</label>
                <textarea
                  id="lock-reason"
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="Enter reason for locking this message..."
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowLockDialog(false);
                    setLockReason('');
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLockMessage}
                  disabled={isLoading || !lockReason.trim()}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Locking...' : 'Lock Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restrict Deletion Dialog */}
      {showRestrictDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Restrict Message Deletion</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="restrict-reason" className="block text-sm text-gray-300 mb-2">Reason for restriction:</label>
                <textarea
                  id="restrict-reason"
                  value={restrictReason}
                  onChange={(e) => setRestrictReason(e.target.value)}
                  placeholder="Enter reason for restricting deletion..."
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allowAuthorDelete"
                  checked={allowAuthorDelete}
                  onChange={(e) => setAllowAuthorDelete(e.target.checked)}
                  className="w-4 h-4 text-red-500 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                />
                <label htmlFor="allowAuthorDelete" className="text-sm text-gray-300">
                  Allow author to delete their own message
                </label>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowRestrictDialog(false);
                    setRestrictReason('');
                    setAllowAuthorDelete(false);
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestrictDeletion}
                  disabled={isLoading || !restrictReason.trim()}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Restricting...' : 'Restrict Deletion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
