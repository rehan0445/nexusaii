import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, MessageCircle, Star } from 'lucide-react';

interface CampusProps {
  readonly campusId: string;
  readonly name: string;
  readonly description: string;
  readonly location: string;
  readonly studentCount: number;
  readonly rating: number;
  readonly onJoin: (campusId: string) => void;
}

export function Campus({ 
  campusId, 
  name, 
  description, 
  location, 
  studentCount, 
  rating, 
  onJoin 
}: CampusProps) {
  const navigate = useNavigate();
  const [isJoined, setIsJoined] = useState(false);

  const handleJoin = () => {
    setIsJoined(true);
    onJoin(campusId);
  };

  const handleNavigate = () => {
    navigate(`/campus/${campusId}`);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{name}</h3>
            <p className="text-zinc-400 text-sm">{location}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="text-white text-sm">{rating.toFixed(1)}</span>
        </div>
      </div>

      <p className="text-zinc-300 mb-4 line-clamp-2">{description}</p>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 text-sm text-zinc-400">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{studentCount.toLocaleString()} students</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-4 h-4" />
            <span>Active community</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleNavigate}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNavigate();
            }
          }}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          Explore Campus
        </button>
        
        <button
          onClick={handleJoin}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleJoin();
            }
          }}
          disabled={isJoined}
          className={`px-4 py-2 rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
            isJoined
              ? 'bg-green-600 text-white cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isJoined ? 'Joined' : 'Join'}
        </button>
      </div>
    </div>
  );
} 