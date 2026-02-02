import React, { useState, useEffect } from "react";
import { useSearchParams } from 'react-router-dom';
import VibeNavigation, { VibeSectionKey } from "../components/vibe/VibeNavigation";
import ChatsExplore from "../components/vibe/chats/ChatsExplore";
import { io, Socket } from 'socket.io-client';
import AnonymousChat from '../components/AnonymousChat';
import RedesignedDarkRoom from '../components/RedesignedDarkRoom';
import { generateAnonymousGroups, Group } from '../utils/darkroomData';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { useAuth } from "../contexts/AuthContext";

export default function Vibe() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [active, setActive] = useState<VibeSectionKey>("chats");
  const { currentUser } = useAuth();
  // Chats-specific header state
  const [chatSearchQuery, setChatSearchQuery] = useState<string>("");
  const [chatSelectedFilters, setChatSelectedFilters] = useState<string[]>([]);

  // Dark Room states
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showDarkRoomDisclaimer, setShowDarkRoomDisclaimer] = useState(false);
  const [showAliasInput, setShowAliasInput] = useState(false);
  const [darkRoomAlias, setDarkRoomAlias] = useState("");
  const [inDarkRoom, setInDarkRoom] = useState(false);

  // Darkroom states
  const [darkroomGroups, setDarkroomGroups] = useState<Group[]>([]);
  const [selectedDarkroomGroup, setSelectedDarkroomGroup] = useState<Group | null>(null);
  const [darkroomMessage, setDarkroomMessage] = useState('');
  // Create dark chat modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch groups from database API
  const fetchGroupsFromAPI = async () => {
    try {
      console.log('🔄 Fetching groups from API...');
      const response = await fetch('/api/v1/darkroom/rooms');
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Fetched groups from API:', data);
        
        // Convert API data to Group format
        const groups: Group[] = data.map((room: any) => ({
          id: room.id,
          name: room.name || `Group ${room.id}`,
          description: room.description || 'Anonymous group',
          members: room.user_count || 0,
          messages: [],
          createdBy: room.created_by || 'system',
          createdAt: room.created_at,
          isDeleted: false
        }));
        
        setDarkroomGroups(groups);
        console.log('✅ Groups updated from API:', groups);
      } else {
        console.error('❌ Failed to fetch groups from API:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching groups from API:', error);
    }
  };

  // Get next sequential ID for dark room
  const getNextDarkRoomId = (): string => {
    const existingIds = darkroomGroups
      .map(group => group.id)
      .filter(id => id.startsWith('ren-'))
      .map(id => {
        const num = parseInt(id.split('ren-')[1]);
        return isNaN(num) ? 0 : num;
      })
      .sort((a, b) => a - b);

    // Find the next available number
    let nextId = 1;
    for (const id of existingIds) {
      if (id === nextId) {
        nextId++;
      } else {
        break;
      }
    }

    return `ren-${nextId}`;
  };
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [generatedCreateId, setGeneratedCreateId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [disbandingGroups, setDisbandingGroups] = useState<Set<string>>(new Set());

  // Socket.IO connection for Dark Room
  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔌 Connected to Dark Room server');
    });

    newSocket.on('receive-message', (data) => {
      console.log('📨 Received message:', data);
      // Update darkroom groups with the new message
      setDarkroomGroups(prev =>
        prev.map(group => {
          if (group.id === data.groupId) {
            return {
              ...group,
              messages: [...group.messages, {
                alias: data.alias,
                message: data.message,
                time: data.time
              }]
            };
          }
          return group;
        })
      );
    });

    newSocket.on('user-count', (data) => {
      console.log('👥 User count update:', data);
      if (selectedDarkroomGroup && selectedDarkroomGroup.id === data.roomId) {
        setSelectedDarkroomGroup(prev => prev ? {
          ...prev,
          members: data.count
        } : null);
      }
    });

    newSocket.on('room-list', (rooms) => {
      console.log('📋 Room list update:', rooms);
      setDarkroomGroups(prev => {
        const updatedGroups = prev.map(group => {
          const room = rooms.find((r: any) => r.id === group.id);
          if (room) {
            return { ...group, members: room.userCount };
          }
          return group;
        });
        return updatedGroups;
      });
    });

    // Listen to room created events
    newSocket.on('room-created', (room: any) => {
      console.log('🏠 Room created event received:', room);
      // Refresh groups from API to get the latest data
      fetchGroupsFromAPI();
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Fetch groups from API on component mount
  useEffect(() => {
    fetchGroupsFromAPI();
  }, []);

  // Listen for custom section change events from StartupVerse navigation
  useEffect(() => {
    const handleSectionChange = (event: CustomEvent) => {
      const section = event.detail as VibeSectionKey;
      if (section && ['chats', 'darkroom'].includes(section)) {
        setActive(section);
      }
    };

    window.addEventListener('vibe:changeSection', handleSectionChange as EventListener);
    
    return () => {
      window.removeEventListener('vibe:changeSection', handleSectionChange as EventListener);
    };
  }, []);

  // Join room when selected group changes
  useEffect(() => {
    if (selectedDarkroomGroup) {
      socket?.emit('join-room', { groupId: selectedDarkroomGroup.id, alias: darkRoomAlias });
    }
  }, [selectedDarkroomGroup, socket, darkRoomAlias]);

  // Save darkroom groups to localStorage
  useEffect(() => {
    localStorage.setItem('darkroom-groups', JSON.stringify(darkroomGroups));
  }, [darkroomGroups]);



  const handleDarkroomSend = () => {
    if (!darkroomMessage.trim() || !selectedDarkroomGroup) return;
    
    const time = new Date().toISOString();
    const msg = { groupId: selectedDarkroomGroup.id, alias: darkRoomAlias, message: darkroomMessage, time };
    
    socket?.emit('send-message', msg);
    setDarkroomMessage('');
  };

  // Start create flow (open modal)
  const handleCreateDarkroomGroup = () => {
    console.log('handleCreateDarkroomGroup called! Current modal state:', showCreateModal);
    setCreateName('');
    setCreateDescription('');
    // Pre-generate the next sequential ID
    const nextId = getNextDarkRoomId();
    setGeneratedCreateId(nextId);
    console.log(`Generated next dark room ID: ${nextId}`);
    
    // Direct state update - no delays or async operations
    setShowCreateModal(true);
    console.log('showCreateModal set to true');
  };

  // Finalize creation after showing ID
  const finalizeCreateDarkroomGroup = () => {
    const newId = generatedCreateId || getNextDarkRoomId();
    const fallbackName = `Dark Chat ${darkroomGroups.length + 1}`;
    const newGroup: Group = {
      id: newId,
      name: createName.trim() || fallbackName,
      description: createDescription.trim() || 'A new anonymous group',
      members: 1,
      messages: [],
      createdBy: darkRoomAlias
    };

    const updatedGroups = [...darkroomGroups, newGroup];
    setDarkroomGroups(updatedGroups);
    localStorage.setItem('darkroom-groups', JSON.stringify(updatedGroups));

    // Create on server and join
    socket?.emit('create-room', { roomId: newGroup.id, roomName: newGroup.name, createdBy: darkRoomAlias });
    socket?.emit('join-room', newGroup.id);
    setSelectedDarkroomGroup(newGroup);

    // Update URL for routing
    const next = new URLSearchParams(searchParams);
    next.set('dark_id', newGroup.id);
    setSearchParams(next, { replace: false });

    // Close modal
    setShowCreateModal(false);
    setGeneratedCreateId(null);
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = darkroomGroups.find(g => g.id === groupId);
    if (!group || group.createdBy !== darkRoomAlias) {
      console.log('Cannot delete group: not creator or group not found');
      return;
    }

    // Mark group as deleted
    const updatedGroups = darkroomGroups.map(g => 
      g.id === groupId 
        ? { ...g, isDeleted: true, deletedAt: new Date(), deletedBy: darkRoomAlias }
        : g
    );
    
    setDarkroomGroups(updatedGroups);
    localStorage.setItem('darkroom-groups', JSON.stringify(updatedGroups));
    
    // If currently in this group, exit
    if (selectedDarkroomGroup?.id === groupId) {
      setSelectedDarkroomGroup(null);
    }
    
    // Emit delete event to server
    socket?.emit('delete-room', { roomId: groupId, deletedBy: darkRoomAlias });
    
    // Start 2-minute countdown to disband
    setDisbandingGroups(prev => new Set([...prev, groupId]));
    
    setTimeout(() => {
      disbandGroup(groupId);
    }, 2 * 60 * 1000); // 2 minutes
    
    setShowDeleteConfirm(null);
    console.log(`Group ${groupId} marked for deletion and will disband in 2 minutes`);
  };

  const disbandGroup = (groupId: string) => {
    // Completely remove the group
    const updatedGroups = darkroomGroups.filter(g => g.id !== groupId);
    setDarkroomGroups(updatedGroups);
    localStorage.setItem('darkroom-groups', JSON.stringify(updatedGroups));
    
    // Remove from disbanding set
    setDisbandingGroups(prev => {
      const newSet = new Set(prev);
      newSet.delete(groupId);
      return newSet;
    });
    
    // Emit disband event to server
    socket?.emit('disband-room', { roomId: groupId });
    
    console.log(`Group ${groupId} has been disbanded and removed`);
  };

  const canDeleteGroup = (group: Group): boolean => {
    return group.createdBy === darkRoomAlias && !group.isDeleted;
  };

  // Handle joining existing group
  const handleJoinDarkroomGroup = (groupId: string) => {
    const existingGroup = darkroomGroups.find(g => g.id === groupId);
    if (existingGroup) {
      setSelectedDarkroomGroup(existingGroup);
    } else {
      // Create new group if it doesn't exist
      const newGroup: Group = {
        id: groupId,
        name: `Group ${groupId}`,
        description: 'Anonymous group',
        members: 1,
        messages: [],
        createdBy: darkRoomAlias
      };
      const updatedGroups = [...darkroomGroups, newGroup];
      setDarkroomGroups(updatedGroups);
      localStorage.setItem('darkroom-groups', JSON.stringify(updatedGroups));
      setSelectedDarkroomGroup(newGroup);
    }
  };

  // Validate and join by ID (used by header Join button)
  const handleJoinById = async (groupId: string): Promise<boolean> => {
    const id = groupId.trim();
    // Basic format validation
    const isValidFormat = /^ren-\d+$/.test(id);
    if (!isValidFormat) return false;

    // If exists locally, join immediately
    const local = darkroomGroups.find(g => g.id === id);
    if (local) {
      setSelectedDarkroomGroup(local);
      socket?.emit('join-room', { groupId: id, alias: darkRoomAlias });
      const next = new URLSearchParams(searchParams);
      next.set('dark_id', id);
      setSearchParams(next, { replace: false });
      return true;
    }

    // Check with server for authenticity
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
      const res = await fetch(`${serverUrl}/api/v1/darkroom/rooms/${encodeURIComponent(id)}`);
      if (!res.ok) return false;
      const room = await res.json();
      const newGroup: Group = {
        id: room.id || id,
        name: room.name || `Group ${id}`,
        description: 'Anonymous group',
        members: room.userCount || 1,
        messages: room.messages?.map((m: any) => ({ alias: m.alias, message: m.message, time: m.time })) || [],
        createdBy: room.createdBy || 'system'
      };
      const updated = [...darkroomGroups, newGroup];
      setDarkroomGroups(updated);
      localStorage.setItem('darkroom-groups', JSON.stringify(updated));
      setSelectedDarkroomGroup(newGroup);
      socket?.emit('join-room', { groupId: id, alias: darkRoomAlias });
      const next = new URLSearchParams(searchParams);
      next.set('dark_id', id);
      setSearchParams(next, { replace: false });
      return true;
    } catch {
      return false;
    }
  };

  // Sync selection with URL
  useEffect(() => {
    const id = searchParams.get('dark_id');
    if (!id) return;
    if (!inDarkRoom) return; // only after entering DR
    if (selectedDarkroomGroup?.id === id) return;
    handleJoinById(id);
  }, [searchParams, inDarkRoom]);

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="md:flex">
          <VibeNavigation
            activeSection={active}
            onChangeSection={(next) => {
              setActive(next);
            }}
            onSearch={active === "chats" ? setChatSearchQuery : undefined}
            onFilterChange={active === "chats" ? setChatSelectedFilters : undefined}
            selectedFilters={active === "chats" ? chatSelectedFilters : []}
          />

          <main className="flex-1 min-h-[100dvh] p-4 md:p-6 md:ml-72 pt-16 md:pt-6">
            {active === "chats" && (
              <ChatsExplore
                headerSearchQuery={chatSearchQuery}
                headerSelectedFilters={chatSelectedFilters}
              />
            )}
            {active === "darkroom" && (
              <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center h-full w-full">
                {/* Fixed header with solid background */}
                <header className="fixed top-0 left-0 p-4 pt-8 z-50 bg-black shadow-md">
                </header>

                {/* Terminal-like container */}
                <div className="w-full max-w-4xl max-h-[90vh] border border-green-500/30 rounded-md p-1 bg-black overflow-hidden">
                  {/* Terminal header */}
                  <div className="flex items-center bg-zinc-900 px-3 py-1.5 border-b border-green-500/30">
                    <div className="flex items-center">
                      <div className="flex space-x-1.5 mr-3">
                        <button
                          className="w-3 h-3 rounded-full bg-red-500 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setActive("darkroom")}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setActive("darkroom");
                            }
                          }}
                          aria-label="Close terminal window"
                          tabIndex={0}
                          role="button"></button>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                    <div className="mx-auto text-green-500 text-sm font-mono">
                      DARKNET_ACCESS_v2.3.7
                    </div>
                    <button
                      onClick={() => setActive("darkroom")}
                      className="text-green-500 hover:text-green-400 transition-colors p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Terminal content */}
                  <div className="font-mono text-sm text-green-500 p-4 h-[60vh] overflow-y-auto bg-[#0c0c0c]">
                    <div className="terminal-text mb-4">
                      <div className="flex">
                        <span className="text-green-600 mr-2">root@nexus:~$</span>
                        <span className="typing-effect">
                          ssh -p 1337 darkroom@nexus.vibe
                        </span>
                      </div>
                      <div className="mt-1 text-zinc-500">
                        Establishing secure connection...
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="text-red-500 mb-1">
                        ! WARNING: SECURE ACCESS ONLY !
                      </div>
                      <div className="text-xs glitchy-text">
                        Connection established through encrypted proxy.
                        <br />
                        All activity in the Dark Room is anonymized.
                        <br />
                        Your digital fingerprint has been masked.
                      </div>
                    </div>

                    <div className="block mb-4 overflow-hidden">
                      <div className="text-center mb-2 glitchy-text">
                        <span className="text-red-500">
                          [ UNAUTHORIZED ACCESS WILL BE TRACED ]
                        </span>
                      </div>

                      <div className="ascii-art text-center my-4">
                        <pre className="inline-block text-[8px] leading-[8px] text-green-500 font-mono">
                          {`
   ▓█████▄  ▄▄▄       ██▀███   ██ ▄█▀    ██▀███   ▒█████   ▒█████   ███▄ ▄███▓
   ▒██▀ ██▌▒████▄    ▓██ ▒ ██▒ ██▄█▒    ▓██ ▒ ██▒▒██▒  ██▒▒██▒  ██▒▓██▒▀█▀ ██▒
   ░██   █▌▒██  ▀█▄  ▓██ ░▄█ ▒▓███▄░    ▓██ ░▄█ ▒▒██░  ██▒▒██░  ██▒▓██    ▓██░
   ░▓█▄   ▌░██▄▄▄▄██ ▒██▀▀█▄  ▓██ █▄    ▒██▀▀█▄  ▒██   ██░▒██   ██░▒██    ▒██ 
   ░▒████▓  ▓█   ▓██▒░██▓ ▒██▒▒██▒ █▄   ░██▓ ▒██▒░ ████▓▒░░ ████▓▒░▒██▒   ░██▒
    ▒▒▓  ▒  ▒▒   ▓▒█░░ ▒▓ ░▒▓░▒ ▒▒ ▓▒   ░ ▒▓ ░▒▓░░ ▒░▒░▒░ ░ ▒░▒░▒░ ░ ▒░   ░  ░
    ░ ▒  ▒   ▒   ▒▒ ░  ░▒ ░ ▒░░ ░▒ ▒░     ░▒ ░ ▒░  ░ ▒ ▒░   ░ ▒ ▒░ ░  ░      ░
    ░ ░  ░   ░   ▒     ░░   ░ ░ ░░ ░      ░░   ░ ░ ░ ░ ▒  ░ ░ ░ ▒  ░      ░   
      ░          ░  ░   ░     ░  ░         ░         ░ ░      ░ ░         ░   
    ░                                                                          
`}
                        </pre>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="typing-effect">
                        Initializing anonymous protocol...
                      </div>
                      <div className="typing-effect mt-1">
                        Masking user identity...
                      </div>
                      <div className="typing-effect mt-1">
                        Configuring end-to-end encryption...
                      </div>
                      <div className="text-white mt-2">
                        Ready for secure connection.
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 animated-blink">
                      <span className="text-green-600">darkroom@nexus:~$</span>
                      <span className="h-4 w-2 bg-green-500 inline-block animate-blink"></span>
                    </div>
                  </div>

                  {/* Access button */}
                  <div className="bg-zinc-900 p-4 border-t border-green-500/30 flex justify-center">
                    <button
                      onClick={() => setShowDarkRoomDisclaimer(true)}
                      className="group relative overflow-hidden px-8 py-3 bg-black border border-green-500/50 text-green-500 font-mono hover:bg-green-950/30 transition-colors">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent glitch-effect"></div>
                      <span className="relative z-10 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                        ESTABLISH CONNECTION
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Dark Room Disclaimer Modal */}
      {showDarkRoomDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="w-full max-w-2xl p-6 rounded-lg overflow-hidden relative">
            <div className="absolute inset-0 bg-black"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-[#0c0c0c] rounded-full flex items-center justify-center border border-green-500/30">
                  <span className="text-2xl font-mono text-green-500">
                    ⚠️
                  </span>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-green-400 mb-4 text-center font-mono">
                SYSTEM GUIDELINES
              </h2>

              <div className="mb-6 bg-[#0c0c0c] p-5 rounded-lg border border-green-500/30">
                <div className="text-green-500 font-mono text-xs mb-2">
                  ! WARNING: READ CAREFULLY !
                </div>
                <ul className="space-y-3 text-zinc-300 font-mono text-sm">
                  <li className="flex items-start">
                    <span className="mr-2 pt-0.5 text-green-500">{">"}</span>
                    <span>
                      Your identity will remain{" "}
                      <span className="text-green-400 font-semibold">
                        completely anonymous
                      </span>{" "}
                      in the Dark Room.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 pt-0.5 text-green-500">{">"}</span>
                    <span>
                      Be respectful and considerate to all participants.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 pt-0.5 text-green-500">{">"}</span>
                    <span>
                      No harassment, hate speech, or illegal activities.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 pt-0.5 text-green-500">{">"}</span>
                    <span>
                      Messages in the Dark Room are{" "}
                      <span className="text-green-400 font-semibold">
                        not stored permanently
                      </span>
                      .
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 pt-0.5 text-green-500">{">"}</span>
                    <span>
                      Violation of these guidelines may result in account
                      restrictions.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    setShowDarkRoomDisclaimer(false);
                    setShowAliasInput(true);
                  }}
                  className="px-6 py-3 bg-green-900/30 hover:bg-green-900/50 text-green-400 font-mono rounded-lg transition-colors border border-green-500/30 group">
                  <span className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    ACCEPT_TERMS
                  </span>
                </button>
                <button
                  onClick={() => setShowDarkRoomDisclaimer(false)}
                  className="px-6 py-3 bg-[#0c0c0c] hover:bg-zinc-800 text-zinc-400 hover:text-green-400 font-mono rounded-lg transition-colors border border-green-500/20">
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dark Room Alias Input */}
      {showAliasInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="w-full max-w-md p-6 rounded-lg overflow-hidden relative">
            <div className="absolute inset-0 bg-black"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-[#0c0c0c] rounded-full flex items-center justify-center border border-green-500/30">
                  <span className="text-2xl font-mono text-green-500">
                    &gt;_
                  </span>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-green-400 mb-4 text-center font-mono">
                IDENTITY_PROTOCOL
              </h2>

              <p className="text-zinc-400 mb-6 text-center font-mono text-sm">
                Establish temporary encrypted identity token for this session.
              </p>

              <div className="bg-[#0c0c0c] p-4 rounded-lg border border-green-500/30 mb-6">
                <div className="text-green-500 font-mono text-xs mb-3 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  <span>ENTER_ALIAS</span>
                </div>
                <input
                  type="text"
                  value={darkRoomAlias}
                  onChange={(e) => setDarkRoomAlias(e.target.value)}
                  placeholder="user@anonymous:~$"
                  maxLength={20}
                  className="w-full px-4 py-3 bg-black border border-green-500/30 rounded-lg text-green-400 placeholder-green-500/40 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 font-mono"
                />
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    if (darkRoomAlias.trim()) {
                      setShowAliasInput(false);
                      setInDarkRoom(true);
                    }
                  }}
                  disabled={!darkRoomAlias.trim()}
                  className={`px-6 py-3 font-mono rounded-lg transition-colors border ${
                    darkRoomAlias.trim()
                      ? "bg-green-900/30 hover:bg-green-900/50 text-green-400 border-green-500/30"
                      : "bg-[#0c0c0c] text-green-500/40 cursor-not-allowed border-green-500/20"
                  }`}>
                  <div className="flex items-center justify-center">
                    {darkRoomAlias.trim() && (
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    )}
                    INITIALIZE_SESSION
                  </div>
                </button>
                <button
                  onClick={() => setShowAliasInput(false)}
                  className="px-6 py-3 bg-[#0c0c0c] hover:bg-zinc-800 text-zinc-400 hover:text-green-400 font-mono rounded-lg transition-colors border border-green-500/20">
                  ABORT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Dark Chat Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="w-full max-w-md p-6 rounded-lg overflow-hidden relative">
            <div className="absolute inset-0 bg-black"></div>

            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-green-400 mb-4 text-center font-mono">
                CREATE_DARK_CHAT
              </h2>

              {!generatedCreateId && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-mono text-green-500/80 mb-1">Name of dark chat</label>
                    <input
                      type="text"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="e.g., Night Owls"
                      className="w-full px-4 py-3 bg-[#0c0c0c] border border-green-500/30 rounded-lg text-green-400 placeholder-green-500/40 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 font-mono"
                      maxLength={60}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-mono text-green-500/80 mb-1">Description</label>
                    <textarea
                      value={createDescription}
                      onChange={(e) => setCreateDescription(e.target.value)}
                      placeholder="What is this chat about?"
                      className="w-full px-4 py-3 bg-[#0c0c0c] border border-green-500/30 rounded-lg text-green-400 placeholder-green-500/40 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 font-mono min-h-[96px]"
                      maxLength={200}
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 bg-[#0c0c0c] hover:bg-zinc-800 text-zinc-400 hover:text-green-400 font-mono rounded-lg transition-colors border border-green-500/20"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const id = `ren-${Date.now()}`;
                        setGeneratedCreateId(id);
                      }}
                      className="px-4 py-2 bg-green-900/30 hover:bg-green-900/50 text-green-400 font-mono rounded-lg transition-colors border border-green-500/30"
                    >
                      Generate ID
                    </button>
                  </div>
                </div>
              )}

              {generatedCreateId && (
                <div className="space-y-4">
                  <div className="bg-[#0c0c0c] p-4 rounded-lg border border-green-500/30">
                    <div className="text-sm font-mono text-green-500/80 mb-2">Your dark chat ID</div>
                    <div className="flex items-center justify-between">
                      <code className="text-green-400 font-mono text-sm break-all">{generatedCreateId}</code>
                      <button
                        onClick={() => navigator.clipboard?.writeText(generatedCreateId)}
                        className="ml-3 px-3 py-1.5 text-xs font-mono rounded bg-zinc-800 hover:bg-zinc-700 text-green-400 border border-green-500/30"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      onClick={() => setGeneratedCreateId(null)}
                      className="px-4 py-2 bg-[#0c0c0c] hover:bg-zinc-800 text-zinc-400 hover:text-green-400 font-mono rounded-lg transition-colors border border-green-500/20"
                    >
                      Back
                    </button>
                    <button
                      onClick={finalizeCreateDarkroomGroup}
                      className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white font-mono rounded-lg transition-colors border border-green-500/40"
                    >
                      Enter Dark Chat
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dark Room Interface */}
      {inDarkRoom && (
        <RedesignedDarkRoom
          groups={darkroomGroups}
          selectedGroup={selectedDarkroomGroup}
          setSelectedGroup={setSelectedDarkroomGroup}
          alias={darkRoomAlias}
          onBack={() => {
            setInDarkRoom(false);
            const next = new URLSearchParams(searchParams);
            next.delete('dark_id');
            setSearchParams(next, { replace: true });
          }}
          onJoinGroup={(group) => {
            setSelectedDarkroomGroup(group);
            const next = new URLSearchParams(searchParams);
            next.set('dark_id', group.id);
            setSearchParams(next, { replace: false });
          }}
          onCreateGroup={handleCreateDarkroomGroup}
          onDeleteGroup={(groupId: string) => {
            setShowDeleteConfirm(groupId);
          }}
          canDeleteGroup={canDeleteGroup}
          currentUserAlias={darkRoomAlias}
          disbandingGroups={disbandingGroups}
          onJoinById={handleJoinById}
        >
          {selectedDarkroomGroup && (
            <AnonymousChat
              group={selectedDarkroomGroup}
              message={darkroomMessage}
              setMessage={setDarkroomMessage}
              alias={darkRoomAlias}
              onBack={() => setSelectedDarkroomGroup(null)}
              socket={socket!}
              onSend={handleDarkroomSend}
              setGroups={setDarkroomGroups}
              onDeleteGroup={(groupId: string) => setShowDeleteConfirm(groupId)}
              canDeleteGroup={canDeleteGroup(selectedDarkroomGroup)}
            />
          )}
        </RedesignedDarkRoom>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-red-500/30 rounded-lg p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-red-400 font-mono text-lg">Delete Dark Chat</h3>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-800 text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-900/30 rounded-full flex items-center justify-center border border-red-500/30">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Permanently Delete Group</h4>
                  <p className="text-zinc-400 text-sm">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
                <p className="text-red-300 text-sm mb-2">⚠️ Warning:</p>
                <ul className="text-zinc-300 text-sm space-y-1">
                  <li>• All messages will be permanently deleted</li>
                  <li>• All members will be removed from the group</li>
                  <li>• Group will disband automatically in 2 minutes</li>
                  <li>• Other users will be notified to leave or create new groups</li>
                </ul>
              </div>
              
              <p className="text-zinc-400 text-sm">
                Are you sure you want to delete this dark chat group?
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-zinc-400 hover:text-zinc-300 font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteGroup(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-mono transition-colors"
              >
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
