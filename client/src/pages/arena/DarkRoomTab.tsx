import React, { useState, useEffect } from "react";
import { Shield, X, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RedesignedDarkRoom from "../../components/RedesignedDarkRoom";
import { Group } from "../../utils/darkroomData";
import { Socket } from 'socket.io-client';
import { apiFetch, getSupabaseAccessToken } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";

const DarkRoomTab: React.FC = () => {
  // Get current user for tracking (while maintaining anonymous display)
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showAliasInput, setShowAliasInput] = useState(false);
  const [darkRoomAlias, setDarkRoomAlias] = useState("");
  const [inDarkRoom, setInDarkRoom] = useState(false);
  const [darkroomGroups, setDarkroomGroups] = useState<Group[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createGroupName, setCreateGroupName] = useState('');
  const [createGroupDescription, setCreateGroupDescription] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isOpeningModal, setIsOpeningModal] = useState(false);

  // Fetch groups from database API
  const fetchGroupsFromAPI = async () => {
    try {
      console.log('🔄 Fetching groups from API...');
      const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
      const response = await apiFetch(`${serverUrl}/api/v1/darkroom/rooms`);
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Fetched groups from API:', data);
        
        // Convert API data to Group format
        let groups: Group[] = data.map((room: any) => ({
          id: room.id,
          name: room.name || `Group ${room.id}`,
          description: room.description || 'Anonymous group',
          members: room.user_count || room.members || 0, // Support both formats
          messages: [],
          createdBy: room.created_by || room.createdBy || 'system',
          createdAt: room.created_at || room.createdAt,
          isDeleted: false
        }));
        // Sort by member count descending (most active first)
        groups = groups.sort((a, b) => b.members - a.members);
        setDarkroomGroups(groups);
        console.log('✅ Groups updated from API:', groups.map(g => ({ id: g.id, name: g.name, members: g.members })));
      } else {
        console.error('❌ Failed to fetch groups from API:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching groups from API:', error);
    }
  };

  // Get next sequential ID for dark room

  // Debug modal state changes
  useEffect(() => {
    console.log('showCreateModal changed to:', showCreateModal);
    
    // Fallback: if modal should be open but isn't visible, force it
    if (showCreateModal) {
      const checkModalVisible = () => {
        const modal = document.querySelector('[data-modal="create-dark-chat"]');
        if (!modal) {
          console.log('Modal not found in DOM, forcing re-render...');
          setShowCreateModal(false);
          setTimeout(() => {
            setShowCreateModal(true);
          }, 50);
        }
      };
      
      setTimeout(checkModalVisible, 1000);
    }
  }, [showCreateModal]);

  const handleEnterDarkRoom = () => {
    setShowDisclaimer(true);
  };

  const handleAcceptDisclaimer = () => {
    setShowDisclaimer(false);
    setShowAliasInput(true);
  };

  const handleSetAlias = async () => {
    if (darkRoomAlias.trim()) {
      // Store alias in localStorage for returning from chat
      localStorage.setItem('darkroom_alias', darkRoomAlias.trim());
      
      setShowAliasInput(false);
      setInDarkRoom(true);
      
      // Initialize socket connection using centralized config
      const { createSocket } = await import('../../lib/socketConfig');
      const token = getSupabaseAccessToken();
      const newSocket = await createSocket({
        token,
        options: {
          timeout: 8000,
          transports: ['websocket', 'polling']
        }
      });
      setSocket(newSocket);
    }
  };

  // Check for existing alias on mount (user returning from chat)
  useEffect(() => {
    const storedAlias = localStorage.getItem('darkroom_alias');
    if (storedAlias) {
      console.log('🔄 [DarkRoomTab] Found stored alias, showing list view:', storedAlias);
      setDarkRoomAlias(storedAlias);
      setInDarkRoom(true);
      
      // Initialize socket connection for returning user
      const initSocket = async () => {
        try {
          const { createSocket } = await import('../../lib/socketConfig');
          const token = getSupabaseAccessToken();
          const newSocket = await createSocket({
            token,
            options: {
              timeout: 8000,
              transports: ['websocket', 'polling']
            }
          });
          setSocket(newSocket);
        } catch (error) {
          console.error('❌ Failed to initialize socket:', error);
        }
      };
      initSocket();
    }
  }, []);

  // Fetch groups from API on component mount and after login
  useEffect(() => {
    console.log('🔄 [DarkRoomTab] Component mounted, fetching groups...');
    fetchGroupsFromAPI();
    
    // Set up periodic refresh every 30 seconds to keep user counts in sync
    const refreshInterval = setInterval(() => {
      if (inDarkRoom) {
        console.log('🔄 [DarkRoomTab] Periodic refresh of groups...');
        fetchGroupsFromAPI();
      }
    }, 30000); // 30 seconds
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [inDarkRoom]);


  // Socket event handlers
  useEffect(() => {
    if (socket) {
      // Listen to room created events
      socket.on('room-created', (room: any) => {
        console.log('🏠 Room created event received:', room);
        // Refresh groups from API to get the latest data
        fetchGroupsFromAPI();
      });

      // Listen to room list updates
      socket.on('room-list', (rooms: any[]) => {
        console.log('📋 Room list update received:', rooms);
        // Convert API data to Group format and sort by member count
        const groups: Group[] = rooms.map((room: any) => ({
          id: room.id,
          name: room.name || `Group ${room.id}`,
          description: room.description || 'Anonymous group',
          members: room.user_count || 0,
          messages: [],
          createdBy: room.created_by || 'system',
          createdAt: room.created_at,
          isDeleted: false
        }))
        .sort((a, b) => b.members - a.members); // Sort by most active first
        
        setDarkroomGroups(groups);
      });

      // Listen to user count updates
      socket.on('user-count-update', (data: any) => {
        console.log('👥 User count update received:', data);
        setDarkroomGroups(prev => {
          // Update the member count and re-sort by most active
          const updated = prev.map(group => 
            group.id === data.roomId 
              ? { ...group, members: data.count }
              : group
          );
          // Re-sort to maintain most active first order
          return updated.sort((a, b) => b.members - a.members);
        });
      });
    }
  }, [socket]);

  // Socket cleanup
  useEffect(() => {
    return () => {
      if (socket) {
        socket.off('room-created');
        socket.off('room-list');
        socket.off('user-count-update');
        socket.disconnect();
      }
    };
  }, [socket]);

  // Navigate to individual dark room chat
  const joinRoomWithMessages = async (group: Group) => {
    console.log('🔗 [DarkRoomTab] Navigating to room:', group.id);
    
    // Store alias in localStorage for the chat page
    localStorage.setItem('darkroom_alias', darkRoomAlias || 'Anonymous');
    
    // Navigate to the individual chat page
    navigate(`/arena/darkroom/${group.id}`);
  };

  const handleCreateGroup = async () => {
    if (createGroupName.trim() && !isCreatingGroup) {
      setIsCreatingGroup(true);
      
      try {
        // Create group via API
        const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
        const response = await apiFetch(`${serverUrl}/api/v1/darkroom/create-group`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: createGroupName.trim(),
            description: createGroupDescription.trim() || "User created group",
            createdBy: darkRoomAlias,
            tags: [],
            // Include user info for tracking (not displayed publicly)
            user_name: currentUser?.displayName || null,
            user_email: currentUser?.email || null,
            user_id: currentUser?.uid || null
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Group created via API:', result);
          
          // Refresh groups from API to get the latest data
          await fetchGroupsFromAPI();
          
          // Emit to server for real-time updates
          socket?.emit('create-room', {
            roomId: result.room.id,
            roomName: result.room.name,
            createdBy: result.room.createdBy,
            // Include user info for tracking
            user_name: currentUser?.displayName || null,
            user_email: currentUser?.email || null,
            user_id: currentUser?.uid || null
          });
          
          // Reset form
          setCreateGroupName('');
          setCreateGroupDescription('');
          setShowCreateModal(false);
        } else {
          console.error('❌ Failed to create group via API:', response.status);
        }
        
      } catch (error) {
        console.error('❌ Error creating group:', error);
      } finally {
        setIsCreatingGroup(false);
      }
    }
  };

  // If user is in dark room, show the group selection interface
  if (inDarkRoom) {
    return (
      <>
        <RedesignedDarkRoom
          groups={darkroomGroups}
          selectedGroup={null}
          setSelectedGroup={() => {}}
          alias={darkRoomAlias}
          onBack={() => {
            // Go back to intro page, not directly to companion
            // Clear the stored alias so intro shows on next visit
            localStorage.removeItem('darkroom_alias');
            setInDarkRoom(false);
          }}
          onJoinGroup={joinRoomWithMessages}
          onCreateGroup={() => {
            console.log('onCreateGroup called, current showCreateModal:', showCreateModal);
            console.log('isOpeningModal:', isOpeningModal);
            
            // Prevent multiple rapid clicks
            if (isOpeningModal || showCreateModal) {
              console.log('Modal already opening or open, ignoring click');
              return;
            }
            
            setIsOpeningModal(true);
            
            // Direct state update - no delays
            setShowCreateModal(true);
            console.log('showCreateModal set to true');
            
            // Reset opening flag after a short delay
            setTimeout(() => {
              setIsOpeningModal(false);
            }, 500);
          }}
          onJoinById={async (id: string) => {
            const group = darkroomGroups.find(g => g.id === id);
            if (group) {
              // Navigate to the room
              await joinRoomWithMessages(group);
              return true;
            }
            return false;
          }}
        />

        {/* Create Group Modal - rendered on top of the list view */}
        {showCreateModal && (
          <div 
            data-modal="create-dark-chat"
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <div className="w-full max-w-md bg-zinc-900 border border-green-500/30 rounded-lg p-6 mx-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-green-400 font-mono text-lg">Create Dark Chat</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateGroupName('');
                    setCreateGroupDescription('');
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-800 text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="darkroom-create-name" className="block text-xs text-green-500/80 font-mono mb-1">Group Name *</label>
                  <input
                    id="darkroom-create-name"
                    autoFocus
                    value={createGroupName}
                    onChange={(e) => setCreateGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && createGroupName.trim() && !isCreatingGroup) {
                        handleCreateGroup();
                      }
                    }}
                    placeholder="Enter group name"
                    className="w-full px-3 py-2 bg-[#0c0c0c] border border-green-500/30 rounded text-green-200 placeholder-green-500/40 focus:outline-none focus:ring-1 focus:ring-green-500 font-mono"
                    maxLength={50}
                  />
                </div>
                
                <div>
                  <label htmlFor="darkroom-create-desc" className="block text-xs text-green-500/80 font-mono mb-1">Description (Optional)</label>
                  <textarea
                    id="darkroom-create-desc"
                    value={createGroupDescription}
                    onChange={(e) => setCreateGroupDescription(e.target.value)}
                    placeholder="Brief description of your group"
                    className="w-full px-3 py-2 bg-[#0c0c0c] border border-green-500/30 rounded text-green-200 placeholder-green-500/40 focus:outline-none focus:ring-1 focus:ring-green-500 font-mono resize-none"
                    rows={3}
                    maxLength={200}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateGroupName('');
                    setCreateGroupDescription('');
                  }}
                  className="px-4 py-2 text-zinc-400 hover:text-zinc-300 font-mono"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!createGroupName.trim() || isCreatingGroup}
                  className={`px-4 py-2 rounded font-mono transition-colors ${
                    createGroupName.trim() && !isCreatingGroup
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {isCreatingGroup ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white darkroom-scope" style={{fontFamily: 'Roboto Mono, monospace'}}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-green-500/30">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/companion')}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white mr-4"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-3xl font-bold text-green-400" style={{
              fontFamily: 'UnifrakturCook, cursive',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 10px rgba(34, 197, 94, 0.5)',
              filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}>Dark Room</h1>
          </div>
        </div>
      </div>
      
      {/* Main dark room interface */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="w-full max-w-4xl">
          {/* Terminal-like container */}
          <div className="border border-green-500/30 rounded-md p-1 bg-black">
            {/* Terminal header */}
            <div className="flex items-center bg-zinc-900 px-3 py-2 border-b border-green-500/30">
              <div className="flex space-x-1.5 mr-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="mx-auto text-green-500 text-sm" style={{fontFamily: 'Roboto Mono, monospace'}}>
                DARKNET_ACCESS_v2.3.7
              </div>
            </div>

            {/* Terminal content */}
            <div className="text-sm text-green-500 p-4 h-[60vh] overflow-y-auto bg-[#0c0c0c]" style={{fontFamily: 'Roboto Mono, monospace'}}>
              <div className="terminal-text mb-4">
                <div className="flex">
                  <span className="text-green-600 mr-2">root@nexus:~$</span>
                  <span className="typing-effect">
                    ssh -p 1337 darkroom@nexus.arena
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

                <div className="nexus-intro text-center my-6 relative overflow-hidden">
                  {/* Matrix-style background effect */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="matrix-rain">
                      {Array.from({length: 20}).map((_, i) => (
                        <div key={i} className="absolute text-green-500 text-xs font-mono animate-pulse" 
                             style={{
                               left: `${Math.random() * 100}%`,
                               animationDelay: `${Math.random() * 2}s`,
                               animationDuration: `${2 + Math.random() * 3}s`
                             }}>
                          {String.fromCharCode(0x30A0 + Math.random() * 96)}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="relative z-10">
                    {/* Glitch effect container */}
                    <div className="relative glitch-container">
                      <div className="nexus-title text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 animate-pulse">
                        N E X U S
                      </div>
                      
                      {/* Glitch layers */}
                      <div className="absolute inset-0 nexus-title text-4xl md:text-6xl font-bold text-red-500 opacity-60 blur-sm animate-ping" 
                           style={{transform: 'translateX(-2px)'}}>
                        N E X U S
                      </div>
                      <div className="absolute inset-0 nexus-title text-4xl md:text-6xl font-bold text-blue-500 opacity-40 blur-sm animate-ping" 
                           style={{transform: 'translateX(2px)', animationDelay: '0.1s'}}>
                        N E X U S
                      </div>
                      
                      {/* Electric crackle effect */}
                      <div className="absolute inset-0 nexus-title text-4xl md:text-6xl font-bold text-yellow-400 opacity-30 blur-md animate-pulse">
                        N E X U S
                      </div>
                    </div>
                    
                    {/* Electric sparks */}
                    <div className="mt-4 flex justify-center space-x-1">
                      {Array.from({length: 8}).map((_, i) => (
                        <div key={i} className="w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-80" 
                             style={{
                               animationDelay: `${i * 0.1}s`,
                               animationDuration: `${0.5 + Math.random() * 0.5}s`
                             }}>
                        </div>
                      ))}
                    </div>
                    
                    {/* Scanning line effect */}
                    <div className="mt-4 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse opacity-60"></div>
                    
                    {/* System status with typewriter effect */}
                    <div className="mt-4 text-green-400 text-sm" style={{fontFamily: 'Roboto Mono, monospace'}}>
                      <span className="animate-pulse">[</span>
                      <span className="typing-animation"> ACCESSING NEXUS PROTOCOL </span>
                      <span className="animate-pulse">]</span>
                    </div>
                    
                  </div>
                  
                  {/* Corner glitch effects */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-green-400 animate-ping opacity-60"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-green-400 animate-ping opacity-60" style={{animationDelay: '0.5s'}}></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-green-400 animate-ping opacity-60" style={{animationDelay: '1s'}}></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-green-400 animate-ping opacity-60" style={{animationDelay: '1.5s'}}></div>
                </div>
              </div>

              <div className="mb-6">
                <div className="typing-effect" style={{fontFamily: 'Roboto Mono, monospace'}}>
                  Initializing anonymous protocol...
                </div>
                <div className="typing-effect mt-1" style={{fontFamily: 'Roboto Mono, monospace'}}>
                  Masking user identity...
                </div>
                <div className="typing-effect mt-1" style={{fontFamily: 'Roboto Mono, monospace'}}>
                  Configuring end-to-end encryption...
                </div>
                <div className="text-white mt-2" style={{fontFamily: 'Roboto Mono, monospace'}}>
                  Ready for secure connection.
                </div>
              </div>

              <div className="flex items-center space-x-2 animate-blink">
                <span className="text-green-600">darkroom@nexus:~$</span>
                <span className="h-4 w-2 bg-green-500 inline-block animate-blink"></span>
              </div>
            </div>

            {/* Access button */}
            <div className="bg-zinc-900 p-4 border-t border-green-500/30 flex justify-center">
              <button
                onClick={handleEnterDarkRoom}
                className="group relative overflow-hidden px-8 py-3 bg-black border border-green-500/50 text-green-500 hover:bg-green-950/30 transition-colors"
                style={{fontFamily: 'Roboto Mono, monospace'}}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent glitch-effect"></div>
                <span className="relative z-10 inline-flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>ESTABLISH CONNECTION</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alias Input Modal */}
      {showAliasInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="w-full max-w-2xl p-6 rounded-lg overflow-hidden relative border border-green-500/30 bg-black">
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-[#0c0c0c] rounded-full flex items-center justify-center border border-green-500/30">
                  <span className="text-2xl font-mono text-green-500">
                    👤
                  </span>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-green-400 mb-4 text-center font-mono">
                ALIAS REQUIRED
              </h2>

              <div className="space-y-4 text-sm text-zinc-300 font-mono mb-6">
                <p>Choose an anonymous alias for your dark room session:</p>
              </div>

              <div className="mb-6">
                <input
                  type="text"
                  value={darkRoomAlias}
                  onChange={(e) => setDarkRoomAlias(e.target.value)}
                  placeholder="Enter your alias..."
                  className="w-full bg-zinc-900 border border-green-500/30 rounded px-4 py-3 text-green-400 font-mono focus:border-green-500 focus:outline-none"
                  maxLength={20}
                />
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowAliasInput(false)}
                  className="px-6 py-2 border border-zinc-600 text-zinc-400 hover:text-white hover:border-zinc-400 transition-colors font-mono"
                >
                  ABORT
                </button>
                <button
                  onClick={handleSetAlias}
                  disabled={!darkRoomAlias.trim()}
                  className={`px-6 py-2 font-mono transition-colors ${
                    darkRoomAlias.trim()
                      ? 'bg-green-600 text-black hover:bg-green-500'
                      : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  INITIALIZE_SESSION
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="w-full max-w-2xl p-6 rounded-lg overflow-hidden relative border border-green-500/30 bg-black">
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-[#0c0c0c] rounded-full flex items-center justify-center border border-green-500/30">
                  <Shield className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-green-400 mb-4 text-center" style={{fontFamily: 'UnifrakturCook, cursive'}}>
                Dark Room Disclaimer
              </h2>

              <div className="space-y-4 text-sm text-zinc-300" style={{fontFamily: 'Roboto Mono, monospace'}}>
                <p>✅ End-to-End Encrypted – All your chats are fully encrypted, so no one outside the conversation can access them.</p>
                <p>🛡️ Privacy First – Your identity remains hidden; only you control what you reveal.</p>
                <p>🚫 No Backdoors – We cannot access, read, or recover your messages, even if asked.</p>
                <p>💬 Safe Conversations – Use Dark Room without worries; your interactions remain private, secure, and anonymous.</p>
              </div>

              <div className="flex justify-center space-x-4 mt-8">
                <button
                  onClick={() => setShowDisclaimer(false)}
                  className="px-6 py-2 border border-zinc-600 text-zinc-400 hover:text-white hover:border-zinc-400 transition-colors font-mono"
                >
                  DECLINE
                </button>
                <button
                  onClick={handleAcceptDisclaimer}
                  className="px-6 py-2 bg-green-600 text-black hover:bg-green-500 transition-colors font-mono"
                >
                  ACCEPT & ENTER
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Group Modal */}
      {showCreateModal && (
      <div 
        data-modal="create-dark-chat"
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div className="w-full max-w-md bg-zinc-900 border border-green-500/30 rounded-lg p-6 mx-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-green-400 font-mono text-lg">Create Dark Chat</h3>
            <button
              onClick={() => {
                setShowCreateModal(false);
                setCreateGroupName('');
                setCreateGroupDescription('');
              }}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-800 text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="darkroom-create-name" className="block text-xs text-green-500/80 font-mono mb-1">Group Name *</label>
              <input
                id="darkroom-create-name"
                autoFocus
                value={createGroupName}
                onChange={(e) => setCreateGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && createGroupName.trim() && !isCreatingGroup) {
                    handleCreateGroup();
                  }
                }}
                placeholder="Enter group name"
                className="w-full px-3 py-2 bg-[#0c0c0c] border border-green-500/30 rounded text-green-200 placeholder-green-500/40 focus:outline-none focus:ring-1 focus:ring-green-500 font-mono"
                maxLength={50}
              />
            </div>
            
            <div>
              <label htmlFor="darkroom-create-desc" className="block text-xs text-green-500/80 font-mono mb-1">Description (Optional)</label>
              <textarea
                id="darkroom-create-desc"
                value={createGroupDescription}
                onChange={(e) => setCreateGroupDescription(e.target.value)}
                placeholder="Brief description of your group"
                className="w-full px-3 py-2 bg-[#0c0c0c] border border-green-500/30 rounded text-green-200 placeholder-green-500/40 focus:outline-none focus:ring-1 focus:ring-green-500 font-mono resize-none"
                rows={3}
                maxLength={200}
              />
            </div>
          </div>
          
          <div className="mt-6 flex gap-2 justify-end">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setCreateGroupName('');
                setCreateGroupDescription('');
              }}
              className="px-4 py-2 text-zinc-400 hover:text-zinc-300 font-mono"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={!createGroupName.trim() || isCreatingGroup}
              className={`px-4 py-2 rounded font-mono transition-colors ${
                createGroupName.trim() && !isCreatingGroup
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {isCreatingGroup ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create'
              )}
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default DarkRoomTab;


