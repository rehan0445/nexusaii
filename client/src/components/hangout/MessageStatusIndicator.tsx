/**
 * Message Status Indicator Component
 * Shows visual indicators for locked messages, deletion restrictions, etc.
 */

import React from 'react';
import { MessageLockingStatus } from '../../services/messageLockingService';

interface MessageStatusIndicatorProps {
  messageStatus: MessageLockingStatus;
  showTooltip?: boolean;
}

export const MessageStatusIndicator: React.FC<MessageStatusIndicatorProps> = ({
  messageStatus,
  showTooltip = true
}) => {
  const { is_locked, deletion_restricted, lock_reason, restriction_reason } = messageStatus;

  // Don't render anything if no restrictions
  if (!is_locked && !deletion_restricted) {
    return null;
  }

  const getStatusIcon = () => {
    if (is_locked && deletion_restricted) {
      return '🔒🚫'; // Both locked and deletion restricted
    } else if (is_locked) {
      return '🔒'; // Only locked
    } else if (deletion_restricted) {
      return '🚫'; // Only deletion restricted
    }
    return null;
  };

  const getStatusText = () => {
    if (is_locked && deletion_restricted) {
      return 'Message is locked and deletion is restricted';
    } else if (is_locked) {
      return `Message is locked${lock_reason ? `: ${lock_reason}` : ''}`;
    } else if (deletion_restricted) {
      return `Deletion is restricted${restriction_reason ? `: ${restriction_reason}` : ''}`;
    }
    return '';
  };

  const getStatusColor = () => {
    if (is_locked && deletion_restricted) {
      return 'text-red-400'; // Red for both restrictions
    } else if (is_locked) {
      return 'text-orange-400'; // Orange for locked
    } else if (deletion_restricted) {
      return 'text-red-400'; // Red for deletion restricted
    }
    return 'text-gray-400';
  };

  const icon = getStatusIcon();
  const text = getStatusText();
  const color = getStatusColor();

  if (!icon) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <span className={`text-xs ${color}`}>
        {icon}
      </span>
      {showTooltip && (
        <div className="relative group">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            {text}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageStatusIndicator;
