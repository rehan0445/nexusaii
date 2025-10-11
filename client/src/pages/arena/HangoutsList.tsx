import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import NexusChatsButton from '../../components/NexusChatsButton';
import { useHangout } from '../../contexts/HangoutContext';
import { useAuth } from '../../contexts/AuthContext';
import { JoinByIdModal } from '../../components/hangout/JoinByIdModal';
import { HangoutLifecycle } from '../../services/hangoutLifecycle';

type Hangout = {
  id: string;
  name: string;
  description?: string | null;
  created_by?: string | null;
  updated_at?: string | null;
  settings?: Record<string, any> | null;
  avatar_url?: string | null;
};

type HangoutWithMeta = Hangout & {
  recentCount: number;
};

function formatRecent(count: number): string {
  if (!Number.isFinite(count)) return '0 recent messages';
  return `${count} recent message${count === 1 ? '' : 's'}`;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const HangoutsList: React.FC = () => {
  const navigate = useNavigate();
  const { rooms, isLoading: roomsLoading } = useHangout();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<HangoutWithMeta[]>([]);
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formAvatar, setFormAvatar] = useState<string>('');

  const sinceIso = useMemo(() => {
    const days = 7; // recent window
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  }, []);

  // Map HangoutContext rooms to local items for display
  useEffect(() => {
    let isMounted = true;
    const mapRooms = async () => {
      try {
        setLoading(true);
        setError(null);

        const base: HangoutWithMeta[] = (rooms || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          created_by: r.createdBy,
          updated_at: r.lastActivity,
          settings: null,
          avatar_url: r.profilePicture || r.icon || null,
          recentCount: 0,
        }));

        // Fetch recent message counts from persistent hangout messages
        const withCounts: HangoutWithMeta[] = [];
        for (const chat of base) {
          try {
            const { count, error: countError } = await supabase
              .from('room_messages')
              .select('id', { count: 'exact', head: true })
              .eq('room_id', chat.id)
              .gte('created_at', sinceIso);
            withCounts.push({ ...chat, recentCount: countError ? 0 : (count || 0) });
          } catch {
            withCounts.push({ ...chat, recentCount: 0 });
          }
        }

        if (!isMounted) return;
        setItems(withCounts);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load hangouts');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    mapRooms();
    return () => {
      isMounted = false;
    };
  }, [rooms, sinceIso]);

  // Realtime subscription for new hangouts (Problem 1 fix)
  useEffect(() => {
    console.log('📡 Setting up realtime subscription for new hangouts');
    
    const channel = supabase
      .channel('hangout-list-updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'rooms' },
        (payload) => {
          console.log('🆕 New hangout detected via realtime:', payload.new);
          
          // Add to list instantly
          const newHangout: HangoutWithMeta = {
            id: (payload.new as any).id,
            name: (payload.new as any).name || 'New Hangout',
            description: (payload.new as any).description,
            created_by: (payload.new as any).created_by,
            updated_at: (payload.new as any).updated_at,
            settings: null,
            avatar_url: (payload.new as any).profile_picture || (payload.new as any).icon || null,
            recentCount: 0
          };
          
          setItems(prev => {
            // Prevent duplicates
            if (prev.some(item => item.id === newHangout.id)) {
              console.log('⚠️ Hangout already in list, skipping duplicate');
              return prev;
            }
            console.log('✅ Adding new hangout to list:', newHangout.name);
            return [newHangout, ...prev];
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Hangout list subscription status:', status);
      });

    return () => {
      console.log('🧹 Cleaning up hangout list subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreate = async () => {
    if (!formName.trim()) {
      alert('Please enter a name for your hangout');
      return;
    }

    // Check authentication from AuthContext
    if (!currentUser || !currentUser.uid) {
      console.error('❌ No authenticated user found in AuthContext');
      alert('Please sign in to create a hangout');
      return;
    }

    console.log('✅ Authenticated user:', currentUser.uid);

    try {
      setCreating(true);

      // Use HangoutLifecycle to create hangout in rooms table
      const result = await HangoutLifecycle.createHangout({
        name: formName.trim(),
        description: formDesc.trim() || 'A new hangout room',
        userId: currentUser.uid,
        profilePicture: formAvatar.trim() || undefined
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create hangout');
      }

      console.log('✅ Hangout created successfully:', result.room);

      // Clear form and close modal
      setShowCreate(false);
      setFormName('');
      setFormDesc('');
      setFormAvatar('');

      // Navigate to the new hangout
      console.log('✅ Navigating to hangout:', result.room.id);
      navigate(`/arena/hangout/chat/${result.room.id}`);
    } catch (e: any) {
      console.error('❌ Create hangout failed:', e);
      alert(e?.message || 'Failed to create hangout');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-softgold-500/30">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Hangouts</h1>
          </div>
          <div className="flex items-center gap-3">
            <NexusChatsButton variant="compact" />
            <button
              onClick={() => setShowJoinModal(true)}
              className="p-2.5 rounded-xl bg-black/70 border border-softgold-500/40 hover:bg-black/80 transition-colors"
              title="Join by ID"
            >
              <LogIn className="w-5 h-5 text-softgold-500" />
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="p-2.5 rounded-xl bg-black/70 border border-softgold-500/40 hover:bg-black/80 transition-colors"
              title="Create hangout"
            >
              <Plus className="w-5 h-5 text-softgold-500" />
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-3 py-2">
        {(loading || roomsLoading) && (
          <div className="text-white/70 p-4">Loading hangouts…</div>
        )}
        {error && (
          <div className="text-red-400 p-4">{error}</div>
        )}
        {!loading && !error && items.map((h) => {
          const avatar = h.avatar_url || (h.settings as any)?.avatar_url || '';
          return (
          <button
            key={h.id}
            onClick={() => navigate(`/arena/hangout/chat/${h.id}`)}
            className="w-full text-left mb-3 rounded-2xl border border-softgold-500/30 bg-black/30 active:bg-black/40 transition-colors"
          >
            <div className="flex items-center gap-3 p-4">
              {/* Avatar */}
              {avatar ? (
                <img src={avatar} alt={h.name} className="w-12 h-12 rounded-full object-cover border border-softgold-500/40" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-softgold-400 to-softgold-600 flex items-center justify-center text-zinc-950 font-bold">
                  <span>r/</span>
                </div>
              )}
              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold truncate">{h.name}</p>
                  <ChevronRight className="w-5 h-5 text-white/50" />
                </div>
                <p className="text-xs text-white/60 mt-0.5 truncate">r/{toSlug(h.name)}</p>
                <p className="text-xs text-white/60 mt-1">{formatRecent(h.recentCount)}</p>
                {h.description && (
                  <p className="text-sm text-white/80 mt-1 line-clamp-2">{h.description}</p>
                )}
              </div>
            </div>
          </button>
          );
        })}
        {!loading && !error && items.length === 0 && (
          <div className="p-6 text-center text-white/70">No hangouts yet. Be the first to create one!</div>
        )}
      </div>
      {/* Create Hangout Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Create Hangout</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="create-name" className="block text-sm text-white/70 mb-1">Name</label>
                <input
                  id="create-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. General-chat"
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 focus:border-softgold-500/60 outline-none"
                />
              </div>
              <div>
                <label htmlFor="create-desc" className="block text-sm text-white/70 mb-1">Description</label>
                <textarea
                  id="create-desc"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="What is this hangout about?"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 focus:border-softgold-500/60 outline-none resize-none"
                />
              </div>
              <div>
                <label htmlFor="create-avatar" className="block text-sm text-white/70 mb-1">Avatar URL (optional)</label>
                <input
                  id="create-avatar"
                  value={formAvatar}
                  onChange={(e) => setFormAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 focus:border-softgold-500/60 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-softgold-500 to-softgold-600 hover:from-softgold-600 hover:to-softgold-700 text-black/90"
                disabled={creating}
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join by ID Modal */}
      <JoinByIdModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoinSuccess={(room) => {
          console.log('Joined room:', room);
          // Navigate to the room
          navigate(`/hangouts/${room.id}`);
        }}
      />
    </div>
  );
};

export default HangoutsList;


