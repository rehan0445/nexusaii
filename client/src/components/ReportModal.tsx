import React, { useState } from 'react';
import { X, Flag, Send } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  confessionId: string;
}

export function ReportModal({ isOpen, onClose, onSubmit, confessionId }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      onSubmit(reason.trim());
      setShowConfirmation(true);
      setReason('');
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        setShowConfirmation(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 p-6 max-w-md w-full mx-4 shadow-2xl">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#A855F7]/20 flex items-center justify-center mx-auto mb-4">
              <Flag className="w-8 h-8 text-[#A855F7]" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Thank you for reporting</h2>
            <p className="text-sm text-[#A1A1AA]">
              We will resolve this issue ASAP.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 p-6 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Report Confession</h2>
          <button
            onClick={onClose}
            className="text-[#A1A1AA] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="report-reason" className="block text-sm font-medium text-white mb-2">
              Why does this confession make you uncomfortable?
            </label>
            <textarea
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe the issue..."
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-4 text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#A855F7]/50 focus:ring-1 focus:ring-[#A855F7]/50 resize-none min-h-[120px]"
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-[#A1A1AA]">{reason.length}/500</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!reason.trim() || isSubmitting}
            className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              reason.trim() && !isSubmitting
                ? 'bg-gradient-to-r from-[#A855F7] to-[#9333EA] text-white hover:from-[#9333EA] hover:to-[#A855F7]'
                : 'bg-[#0A0A0A] text-[#A1A1AA] cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
