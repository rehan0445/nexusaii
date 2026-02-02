import React, { useState } from "react";
import { Users, ArrowRight, Clock } from "lucide-react";

export type GroupRoomCard = {
  id: string;
  name: string;
  userCount?: number;
  createdAt?: string;
  description?: string;
  iconEmoji?: string;
  banner?: string;
};

const categoryFromName = (name: string) => {
  const lower = name.toLowerCase();
  if (/anime|manga|weeb|otaku|naruto|one piece|bleach/.test(lower)) return "Anime";
  if (/startup|founder|saas|pitch|vc|product/.test(lower)) return "Startup";
  if (/india|bharat|desi|hind|bollywood|pune|mumbai|delhi|bangalore|hyderabad|chennai|kolkata/.test(lower)) return "India";
  if (/game|gaming|valorant|csgo|pubg|pokemon/.test(lower)) return "Gaming";
  return "Community";
};

const iconForCategory = (category: string) => {
  switch (category) {
    case "Anime": return "🌸";
    case "Startup": return "🚀";
    case "India": return "🪷";
    case "Gaming": return "🎮";
    default: return "💬";
  }
};

const bannerForCategory = (category: string) => {
  switch (category) {
    case "Anime": return "linear-gradient(135deg,#ff9a9e 0%,#fecfef 100%)";
    case "Startup": return "linear-gradient(135deg,#667eea 0%,#764ba2 100%)";
    case "India": return "linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)";
    case "Gaming": return "linear-gradient(135deg,#a8edea 0%,#fed6e3 100%)";
    default: return "linear-gradient(135deg,#1f2937 0%,#0b0f19 100%)";
  }
};

const rulesForCategory = (category: string) => {
  switch (category) {
    case "Anime": return [
      "No spoilers without warning",
      "Respect different anime tastes",
      "Keep it friendly and fun",
      "Share recs kindly"
    ];
    case "Startup": return [
      "No unsolicited pitching",
      "Be constructive with feedback",
      "Share value, not spam",
      "Respect NDAs/IP"
    ];
    case "Gaming": return [
      "No toxicity",
      "Help new players",
      "Keep it fair",
      "GGs only"
    ];
    default: return [
      "Be respectful",
      "No hate speech",
      "Stay on topic",
      "Keep it safe for all"
    ];
  }
};

interface Props {
  room: GroupRoomCard;
  onJoin: (room: GroupRoomCard) => void;
}

const GroupFlipCard: React.FC<Props> = ({ room, onJoin }) => {
  const [flipped, setFlipped] = useState(false);
  const category = categoryFromName(room.name);
  const icon = room.iconEmoji || iconForCategory(category);
  const banner = room.banner || bannerForCategory(category);
  const rules = rulesForCategory(category);

  return (
    <div className="relative w-full h-80 perspective-1000">
      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${flipped ? "rotate-y-180" : ""}`}
      >
                 {/* Front - Netflix Style Banner */}
         <button
           className="absolute w-full h-full backface-hidden"
           onClick={() => setFlipped(true)}
         >
           <div className="relative w-full h-full bg-zinc-800 rounded-2xl overflow-hidden border border-white/10">
             {/* Banner Image - 80% of card height */}
             <div className="h-4/5 w-full relative" style={{ background: banner }}>
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
             </div>
             
             {/* Bottom Info Section */}
             <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-900/95 to-transparent">
               <div className="flex items-center justify-between">
                 {/* Left Side - Icon and Name */}
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-zinc-800/80 border-2 border-white/20 flex items-center justify-center text-lg backdrop-blur-sm">
                     {icon}
                   </div>
                   <div className="font-bold text-white text-lg truncate">{room.name}</div>
                 </div>
                 
                 {/* Right Side - Active Members */}
                 <div className="flex items-center gap-2 text-sm text-zinc-300">
                   <Users className="w-4 h-4" />
                   <span>{room.userCount ?? 0}</span>
                 </div>
               </div>
             </div>

            {/* Flip Indicator */}
            <div className="absolute top-3 right-3 opacity-70">
              <div className="bg-black/50 rounded-full p-2 backdrop-blur-sm">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </button>

                 {/* Back - Detailed Info */}
         <div className="absolute w-full h-full backface-hidden rotate-y-180">
           <div className="w-full h-full bg-zinc-800 rounded-2xl overflow-hidden border border-white/10 p-4 flex flex-col">
             {/* Scrollable Content */}
             <div className="flex-1 overflow-y-auto">
               {/* Header with Icon and Name */}
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-lg">
                   {icon}
                 </div>
                 <div>
                   <div className="font-bold text-white text-lg">{room.name}</div>
                   <div className="text-sm text-zinc-400">{category}</div>
                 </div>
               </div>

               {/* Active Members */}
               <div className="flex items-center gap-2 mb-4 text-sm text-zinc-300">
                 <Users className="w-4 h-4" />
                 <span>{room.userCount ?? 0} active members</span>
               </div>

               {/* Description */}
               <div className="text-sm text-zinc-300 mb-4 leading-relaxed">
                 {room.description || `Welcome to ${room.name}. Connect, share, and vibe with the community.`}
               </div>

               {/* Rules */}
               <div className="mb-4">
                 <div className="text-sm font-medium text-zinc-200 mb-2">Community Rules:</div>
                 <div className="space-y-1">
                   {rules.map((rule, index) => (
                     <div key={index} className="text-xs text-zinc-400 flex items-start gap-2">
                       <span className="text-[#6A0DAD] mt-0.5">•</span>
                       <span>{rule}</span>
                     </div>
                   ))}
                 </div>
               </div>
             </div>

             {/* Action Buttons - Fixed at bottom */}
             <div className="pt-4 border-t border-zinc-700">
               <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => setFlipped(false)} 
                   className="py-3 rounded-lg border border-white/15 text-sm text-zinc-200 hover:bg-white/5 transition-colors"
                 >
                   Back
                 </button>
                 <button 
                   onClick={() => onJoin(room)} 
                   className="py-3 rounded-lg bg-[#6A0DAD] hover:bg-[#7851A9] text-white font-semibold text-sm transition-colors"
                 >
                   Join Chat
                 </button>
               </div>
             </div>
           </div>
         </div>
      </div>
    </div>
  );
};

export default GroupFlipCard;



