import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, UserPlus, Sparkles } from 'lucide-react';

interface RegistrationExpiredModalProps {
  isOpen: boolean;
  onClose?: () => void; // Optional for non-dismissible behavior
  timeRemaining?: string;
}

const RegistrationExpiredModal: React.FC<RegistrationExpiredModalProps> = ({ 
  isOpen, 
  onClose,
  timeRemaining 
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleRegister = () => {
    // Clear guest session data
    localStorage.removeItem('guest_session');
    localStorage.removeItem('guest_session_start');
    localStorage.removeItem('hasGuestSession');
    
    // Navigate to registration
    navigate('/', { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-700/50 rounded-2xl p-8 shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center border border-green-500/30">
              <Clock className="w-10 h-10 text-green-400" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-white mb-3">
            Your 30-Minute Session Has Ended
          </h2>

          {/* Description */}
          <p className="text-zinc-400 text-center mb-6 leading-relaxed">
            Thanks for exploring Nexus! To continue using the app and unlock all features, please complete your registration.
          </p>

          {/* Benefits List */}
          <div className="bg-zinc-800/50 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium text-sm">Unlimited Access</p>
                <p className="text-zinc-400 text-xs">Use all features without time limits</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <UserPlus className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium text-sm">Save Your Progress</p>
                <p className="text-zinc-400 text-xs">Your conversations and data will be saved</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium text-sm">Full Experience</p>
                <p className="text-zinc-400 text-xs">Access all premium features and content</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRegister}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/30"
            >
              Complete Registration Now
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="w-full py-2.5 text-zinc-400 hover:text-white transition-colors text-sm"
              >
                Maybe Later
              </button>
            )}
          </div>

          {/* Time Remaining (if provided) */}
          {timeRemaining && timeRemaining !== '00:00' && (
            <p className="text-center text-xs text-zinc-500 mt-4">
              Time remaining: {timeRemaining}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationExpiredModal;

