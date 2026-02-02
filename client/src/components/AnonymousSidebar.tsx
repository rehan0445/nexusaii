import React, { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Group } from '../utils/darkroomData';

interface Props {
    groups: Group[];
    selectedId: string | null;
    setSelectedId: (id: string) => void;
    alias: string;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    refreshGroups: () => void;
}

const AnonymousSidebar: React.FC<Props> = ({ 
    groups, 
    selectedId, 
    setSelectedId, 
    alias, 
    searchTerm, 
    setSearchTerm,
    refreshGroups 
}) => {
    const [showForm, setShowForm] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateGroup = () => {
        if (!newGroupName.trim() || !newGroupDesc.trim()) return;

        const newGroup: Group = {
            id: `ren-${Date.now()}`,
            name: newGroupName,
            description: newGroupDesc,
            members: 1,
            messages: [],
            createdBy: alias
        };

        const updatedGroups = [...groups, newGroup];
        localStorage.setItem('darkroom-groups', JSON.stringify(updatedGroups));
        refreshGroups();
        
        setNewGroupName('');
        setNewGroupDesc('');
        setShowForm(false);
    };

    return (
        <div className="w-64 bg-zinc-900/80 border-r border-green-500/30 flex flex-col">
            <div className="p-4 border-b border-green-500/30">
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

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <div className="text-xs font-medium text-green-500/80 px-2 py-1 font-mono">
                    ANONYMOUS GROUPS
                </div>

                {filteredGroups.map((group) => (
                    <button
                        key={group.id}
                        onClick={() => setSelectedId(group.id)}
                        className={`w-full flex items-center text-left px-3 py-2 rounded-lg text-sm transition-colors font-mono min-h-[44px] gap-2 ${
                            selectedId === group.id
                                ? "bg-green-900/30 text-green-300"
                                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-green-300"
                        }`}>
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="truncate flex-1">{group.name}</span>
                        <span className="ml-auto text-xs bg-[#0c0c0c] text-green-500 rounded-full px-2 min-w-[1.75rem] h-6 inline-flex items-center justify-center border border-green-500/30">
                            {group.members + 10}
                        </span>
                    </button>
                ))}

                {showForm && (
                    <div className="bg-[#0c0c0c] border border-green-500/30 rounded-lg p-3 mt-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-green-500 font-mono text-xs">CREATE GROUP</span>
                            <button
                                onClick={() => setShowForm(false)}
                                className="text-zinc-500 hover:text-green-500 min-h-[44px] min-w-[44px] flex items-center justify-center">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Group name"
                            className="w-full px-2 py-2 bg-black border border-green-500/20 rounded text-green-400 text-xs font-mono mb-2 min-h-[44px]"
                        />
                        <textarea
                            value={newGroupDesc}
                            onChange={(e) => setNewGroupDesc(e.target.value)}
                            placeholder="Description"
                            className="w-full px-2 py-2 bg-black border border-green-500/20 rounded text-green-400 text-xs font-mono mb-2 resize-none min-h-[88px]"
                            rows={2}
                        />
                        <button
                            onClick={handleCreateGroup}
                            disabled={!newGroupName.trim() || !newGroupDesc.trim()}
                            className={`w-full px-2 py-2 text-sm font-mono rounded transition-colors min-h-[44px] ${
                                newGroupName.trim() && newGroupDesc.trim()
                                    ? "bg-green-900/30 hover:bg-green-900/50 text-green-400"
                                    : "bg-zinc-900/50 text-zinc-600 cursor-not-allowed"
                            }`}
                        >
                            Create
                        </button>
                    </div>
                )}

                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-green-400 bg-green-900/20 hover:bg-green-900/40 border border-green-500/30 transition-colors font-mono min-h-[44px]">
                        <Plus className="w-4 h-4" /> New Group
                    </button>
                )}
            </div>

            <div className="p-3 border-t border-green-500/30">
                <div className="bg-[#0c0c0c] rounded-lg p-3 text-sm border border-green-500/30">
                    <div className="flex items-center mb-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        <span className="text-green-500 font-mono">Your Alias</span>
                    </div>
                    <div className="px-2 py-2 bg-black rounded-md text-green-400 font-mono border border-green-500/20">
                        {alias}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnonymousSidebar; 