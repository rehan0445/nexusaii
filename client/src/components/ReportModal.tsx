import React, { useState } from 'react';
import { 
  Flag, 
  XCircle,
  CheckCircle
} from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'message' | 'user' | 'room';
  targetId: string;
  targetName?: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName
}) => {
  const getButtonClass = (categoryId: string) => {
    return selectedCategory === categoryId
      ? 'border-softgold-500 bg-softgold-500/20'
      : 'border-zinc-600 hover:border-zinc-500';
  };
  const [reportReason, setReportReason] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const reportCategories = [
    { id: 'spam', label: 'Spam', description: 'Repetitive or unwanted content' },
    { id: 'harassment', label: 'Harassment', description: 'Bullying or threatening behavior' },
    { id: 'inappropriate', label: 'Inappropriate Content', description: 'Offensive or inappropriate material' },
    { id: 'hate', label: 'Hate Speech', description: 'Discriminatory or hateful language' },
    { id: 'violence', label: 'Violence', description: 'Threats or promotion of violence' },
    { id: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone else' },
    { id: 'privacy', label: 'Privacy Violation', description: 'Sharing private information' },
    { id: 'other', label: 'Other', description: 'Something else not listed' }
  ];

  const handleSubmit = async () => {
    if (!selectedCategory || !reportReason.trim()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Report submitted:', {
      targetType,
      targetId,
      targetName,
      category: selectedCategory,
      reason: reportReason,
      details: additionalDetails
    });

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleClose = () => {
    setReportReason('');
    setSelectedCategory('');
    setAdditionalDetails('');
    setIsSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 rounded-xl p-6 w-full max-w-md">
        {!isSubmitted ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Flag className="w-6 h-6 text-red-400" />
                Report {targetType === 'message' ? 'Message' : targetType === 'user' ? 'User' : 'Room'}
              </h3>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {targetName && (
              <div className="mb-4 p-3 bg-zinc-700/50 rounded-lg">
                <p className="text-sm text-zinc-400">Reporting:</p>
                <p className="font-medium">{targetName}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">What's the issue?</label>
                <div className="space-y-2">
                  {reportCategories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${getButtonClass(category.id)}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedCategory === category.id
                            ? 'border-softgold-500 bg-softgold-500'
                            : 'border-zinc-500'
                        }`} />
                        <div>
                          <p className="font-medium">{category.label}</p>
                          <p className="text-sm text-zinc-400">{category.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="additionalDetails" className="block text-sm font-medium mb-2">Additional details (optional)</label>
                <textarea
                  id="additionalDetails"
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  placeholder="Provide any additional context..."
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-softgold-500"
                />
              </div>

              <div>
                <label htmlFor="reportReason" className="block text-sm font-medium mb-2">Why are you reporting this?</label>
                <textarea
                  id="reportReason"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Please explain why you're reporting this content..."
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-softgold-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedCategory || !reportReason.trim() || isSubmitting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Report Submitted</h3>
            <p className="text-zinc-400 mb-6">
              Thank you for your report. Our moderation team will review it and take appropriate action.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-softgold-600 hover:bg-softgold-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
