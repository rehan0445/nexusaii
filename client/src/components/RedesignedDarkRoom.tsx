import React, { useState } from 'react';
import { Moon, X, Search, Plus, Users, LogIn } from 'lucide-react';
import { Group } from '../utils/darkroomData';

interface RedesignedDarkRoomProps {
  groups: Group[];
  selectedGroup: Group | null;
  setSelectedGroup: (group: Group | null) => void;
  alias: string;
  onBack: () => void;
  onJoinGroup: (group: Group) => void;
  onCreateGroup: () => void;
  onJoinById: (id: string) => Promise<boolean> | boolean;
  children?: React.ReactNode;
}

const RedesignedDarkRoom: React.FC<RedesignedDarkRoomProps> = ({
  groups,
  selectedGroup,
  setSelectedGroup,
  alias,
  onBack,
  onJoinGroup,
  onCreateGroup,
  onJoinById,
  children
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedGroup) {
    return (
      <div className="fixed inset-0 z-40 bg-black">
        {children}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col" style={{fontFamily: 'Roboto Mono, monospace'}}>
      {/* Header */}
      <div className="p-4 border-b border-green-500/30 bg-zinc-900/90 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white mr-4"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center">
            <Moon className="w-5 h-5 text-green-500 mr-2" />
            <h2 className="text-lg font-bold text-white" style={{fontFamily: 'UnifrakturCook, cursive'}}>Dark Room</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-green-500"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setJoinId(''); setJoinError(null); setShowJoinModal(true); }}
            className="inline-flex items-center gap-1 px-2 h-8 rounded-full bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-500/30 text-xs"
            style={{fontFamily: 'Roboto Mono, monospace'}}
          >
            <LogIn className="w-3.5 h-3.5" />
            Join
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="p-4 border-b border-green-500/30 bg-zinc-900/80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500/50" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search anonymous groups..."
              className="w-full pl-10 py-2 bg-[#0c0c0c] border border-green-500/30 rounded-lg text-zinc-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 placeholder-green-500/50 text-sm font-mono min-h-[44px]"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        {/* Groups Grid */}
        <div className="mb-6">
          <div className="text-xs font-medium text-green-500/80 px-2 py-1 font-mono mb-4">
            ANONYMOUS GROUPS
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="relative rounded-lg p-4 transition-colors cursor-pointer group bg-zinc-900/80 border border-green-500/30 hover:bg-zinc-800/80"
                onClick={() => onJoinGroup(group)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <h3 className="font-mono text-sm font-semibold truncate text-green-400">
                      {group.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs bg-[#0c0c0c] text-green-500 rounded-full px-2 py-1 border border-green-500/30">
                      <Users className="w-3 h-3" />
                      <span>{group.members + 10}</span>
                    </div>
                  </div>
                </div>
                <p className="text-zinc-400 text-xs font-mono mb-3 line-clamp-2">
                  {group.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-green-500/60 text-xs font-mono">
                    Created by {group.createdBy}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Create Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Create button clicked! Event:', e);
            console.log('onCreateGroup function:', onCreateGroup);
            
            // Immediate visual feedback
            const button = e.currentTarget;
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
              button.style.transform = '';
            }, 100);
            
            // Call the create function immediately
            if (onCreateGroup) {
              onCreateGroup();
            } else {
              console.error('onCreateGroup function is not defined!');
            }
          }}
          className="fixed right-5 bottom-28 z-[150] w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-lg flex items-center justify-center border border-green-500/40 transition-all duration-150 hover:scale-110 active:scale-95"
          style={{ bottom: 'calc(7rem + env(safe-area-inset-bottom))' }}
          aria-label="Create new dark chat"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Join by ID Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-md bg-zinc-900 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-green-400 font-mono">Join Dark Chat</h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-800 text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="block text-xs text-green-500/80 font-mono mb-1">Enter dark_id</label>
            <input
              autoFocus
              value={joinId}
              onChange={(e) => { setJoinId(e.target.value); setJoinError(null); }}
              placeholder="e.g., ren-1700000000000"
              className="w-full px-3 py-2 bg-[#0c0c0c] border border-green-500/30 rounded text-green-200 placeholder-green-500/40 focus:outline-none focus:ring-1 focus:ring-green-500 font-mono"
            />
            {joinError && (
              <div className="mt-2 text-xs text-red-400 font-mono">{joinError}</div>
            )}
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => setShowJoinModal(false)}
                className="px-4 py-2 text-xs font-mono rounded border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const id = joinId.trim();
                  if (!id) { setJoinError('Please enter a dark_id.'); return; }
                  try {
                    const ok = await onJoinById(id);
                    if (ok) {
                      setShowJoinModal(false);
                    } else {
                      setJoinError('Invalid or non-existent dark_id.');
                    }
                  } catch {
                    setJoinError('Unable to join. Please try again.');
                  }
                }}
                className="px-4 py-2 text-xs font-mono rounded bg-green-700 hover:bg-green-600 text-white border border-green-500/40"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RedesignedDarkRoom;
