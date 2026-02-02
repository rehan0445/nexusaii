import React from 'react';
import { X, User, EyeOff } from 'lucide-react';

interface PostTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'username' | 'alias') => void;
}

export function PostTypeModal({ isOpen, onClose, onSelect }: PostTypeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 p-6 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">How do you want to post?</h2>
          <button
            onClick={onClose}
            className="text-[#A1A1AA] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Option 1: With username */}
          <button
            onClick={() => {
              onSelect('username');
              onClose();
            }}
            className="w-full bg-[#0A0A0A] hover:bg-[#222222] border border-white/10 hover:border-[#A855F7]/50 rounded-xl p-4 transition-all duration-200 flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#A855F7]/20 to-[#9333EA]/20 flex items-center justify-center border border-[#A855F7]/30 group-hover:border-[#A855F7]/50 transition-colors">
              <User className="w-6 h-6 text-[#A855F7]" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-medium mb-1">With username</h3>
              <p className="text-sm text-[#A1A1AA]">Post with your account name</p>
            </div>
          </button>

          {/* Option 2: Stay anonymous (alias) */}
          <button
            onClick={() => {
              onSelect('alias');
              onClose();
            }}
            className="w-full bg-[#0A0A0A] hover:bg-[#222222] border border-white/10 hover:border-[#A855F7]/50 rounded-xl p-4 transition-all duration-200 flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#A855F7]/20 to-[#9333EA]/20 flex items-center justify-center border border-[#A855F7]/30 group-hover:border-[#A855F7]/50 transition-colors">
              <EyeOff className="w-6 h-6 text-[#A855F7]" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-medium mb-1">Stay anonymous (alias)</h3>
              <p className="text-sm text-[#A1A1AA]">Post with an anonymous alias</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
