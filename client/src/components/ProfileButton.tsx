import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle } from 'lucide-react';

export function ProfileButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/profile')}
      className="w-10 h-10 rounded-lg bg-softgold-800/20 hover:bg-softgold-700/30 transition-colors flex items-center justify-center border border-softgold-600/30"
    >
      <UserCircle className="w-6 h-6 text-softgold-400" />
    </button>
  );
}