import React from "react";
import { Crown } from "lucide-react";

export interface HangoutRoomCard {
  id: string;
  name: string;
  description: string;
  category: string;
  isPrivate: boolean;
  isOfficial?: boolean;
  memberCount?: number;
  icon?: string;
  profilePicture?: string;
  tags?: string[];
  roomType?: 'palace' | 'room';
}

interface Props {
  room: HangoutRoomCard;
  onClick?: () => void;
  onJoin?: (room: HangoutRoomCard) => void;
}

const HangoutCard: React.FC<Props> = ({ room, onClick, onJoin }) => {
  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden hangout-card rounded-2xl p-6 hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] w-full cursor-pointer"
    >
      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg overflow-hidden"
              style={{ background: '#D4AF37', color: '#0A0A0A' }}
            >
              {room.profilePicture ? (
                <img src={room.profilePicture} alt={room.name} className="w-full h-full object-cover" />
              ) : (
                room.icon || room.name.charAt(0)
              )}
            </div>
            {room.isOfficial && (
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#D4AF37' }}>
                <Crown className="w-3 h-3 text-white hangout-icon" />
              </div>
            )}
            {/* Room type symbol removed per request */}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="hangout-serif-title text-[18px] font-semibold text-white truncate mb-1">{room.name}</h3>
            <p className="text-white/70 text-sm line-clamp-2">{room.description}</p>
            <div className="hangout-divider mt-4" />
            <div className="mt-3 flex items-center justify-between">
              {typeof room.memberCount === 'number' && (
                <div className="text-xs text-white/50">{room.memberCount.toLocaleString()} members</div>
              )}
              {onJoin && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onJoin(room); }}
                  className="px-3 py-1.5 text-xs rounded-lg bg-softgold-500 text-zinc-900 hover:bg-softgold-600 transition-colors font-medium"
                >
                  Join
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HangoutCard;


