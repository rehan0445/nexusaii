import React, { useState } from 'react';
import { X, LogIn, AlertCircle } from 'lucide-react';

interface JoinByIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinSuccess: (room: any) => void;
}

export const JoinByIdModal: React.FC<JoinByIdModalProps> = ({
  isOpen,
  onClose,
  onJoinSuccess
}) => {
  const [joinId, setJoinId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!joinId.trim()) {
      setError('Please enter a join ID');
      return;
    }

    // Validate format (ginger-number)
    const joinIdPattern = /^ginger-\d+$/;
    if (!joinIdPattern.test(joinId.trim())) {
      setError('Invalid join ID format. Expected format: ginger-123');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/hangout/join-by-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ joinId: joinId.trim() })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Successfully joined room:', data.room);
        onJoinSuccess(data.room);
        setJoinId('');
        onClose();
      } else {
        setError(data.message || 'Failed to join room. Please check the join ID and try again.');
      }
    } catch (err) {
      console.error('❌ Error joining room:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleJoin();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-softgold-500/30 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LogIn className="w-5 h-5 text-softgold-500" />
            Join Hangout
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
            disabled={loading}
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="joinId" className="block text-sm font-medium text-white/70 mb-2">
              Enter Join ID
            </label>
            <input
              id="joinId"
              type="text"
              value={joinId}
              onChange={(e) => {
                setJoinId(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="ginger-123"
              className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-softgold-500/60 transition-all duration-300"
              disabled={loading}
              autoFocus
            />
            <p className="mt-2 text-xs text-white/50">
              Enter the join ID shared by the room creator (e.g., ginger-123)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/15 rounded-xl text-white font-medium transition-all duration-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-softgold-500 to-softgold-600 hover:from-softgold-600 hover:to-softgold-700 rounded-xl text-black font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !joinId.trim()}
            >
              {loading ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

