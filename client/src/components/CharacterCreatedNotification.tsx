import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface CharacterCreatedNotificationProps {
  characterName: string;
  onClose: () => void;
}

const CharacterCreatedNotification: React.FC<CharacterCreatedNotificationProps> = ({ 
  characterName, 
  onClose 
}) => {
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-28 right-6 bg-green-500/90 text-white px-6 py-4 rounded-xl shadow-xl animate-fade-slide-up z-50 max-w-md flex items-start">
      <div className="bg-white/20 rounded-full p-1 mr-3 mt-0.5">
        <Check className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-lg">Buddy Created</h3>
        <p className="text-white/90">
          <span className="font-medium">{characterName}</span> has been added to your Companion buddies. Go chat with them now!
        </p>
      </div>
      <button 
        onClick={onClose}
        className="text-white/80 hover:text-white p-1"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default CharacterCreatedNotification; 