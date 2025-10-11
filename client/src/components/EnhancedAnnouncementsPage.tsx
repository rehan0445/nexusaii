import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { apiFetch } from '../lib/utils';
import { 
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  Pin,
  BarChart3,
  CheckCircle,
  X,
  XCircle,
  MapPin,
  FileText,
  Siren,
  CalendarDays,
  List,
  Zap,
  AlertCircle
} from 'lucide-react';
import { PageHeader } from './PageHeader';
import { UrgentBroadcastModal } from './UrgentBroadcastModal';
import { CreateAnnouncementModal } from './CreateAnnouncementModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface EnhancedAnnouncementsPageProps {
  onBack: () => void;
  universityId: string;
  currentUser: {
    id: string;
    name: string;
    isAdmin?: boolean;
  };
  collegeName?: string;
  collegeFullName?: string;
}

interface Poll {
  id: string;
  question: string;
  options: { text: string; votes: number }[];
  type: 'multiple_choice' | 'yes_no';
  totalVotes: number;
  userVote?: number | null;
  createdAt: Date;
}

interface RSVP {
  going: number;
  maybe: number;
  not_going: number;
  total: number;
}

// Removed Thread interface - discussions only in Lost & Found now

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string; // Allow any string for custom categories
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: string[];
  campus: string;
  department: string | null;
  tags: string[];
  isPinned: boolean;
  isActive: boolean;
  requiresAcknowledgment: boolean;
  scheduledFor: Date | null;
  expiresAt: Date | null;
  likes: number;
  reactions: { [emoji: string]: number };
  author: {
    id: string;
    name: string;
    role: string;
  };
  // Enhanced features
  hasThreads?: boolean; // Keep for backend compatibility
  poll: Poll | null;
  rsvp: RSVP | null;
  eventDate: Date | null;
  isLiked?: boolean;
  userRSVP?: 'going' | 'maybe' | 'not_going' | null;
  userPollVote?: number | null;
  createdAt: Date;
  updatedAt: Date;
  // Local-only optimistic fields
  optimisticUntil?: number;
}

// CampusDigest interface removed - not currently used

interface UrgentBroadcast {
  id: string;
  title: string;
  content: string;
  urgencyLevel: 'critical' | 'high_alert' | 'urgent';
  broadcastType: 'exam_postponed' | 'safety_alert' | 'holiday_declared' | 'emergency';
  isActive: boolean;
  author: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: Date;
}

type ViewMode = 'list' | 'calendar' | 'digest';

const CATEGORY_CONFIG = {
  infrastructure: { 
    label: 'Infrastructure', 
    icon: AlertTriangle, 
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30'
  },
  academic: { 
    label: 'Academic', 
    icon: FileText, 
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  events: { 
    label: 'Events', 
    icon: Calendar, 
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  },
  emergency: { 
    label: 'Emergency', 
    icon: Siren, 
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30'
  }
};

// PRIORITY_CONFIG removed - priority styling now handled inline

const URGENCY_CONFIG = {
  critical: {
    label: 'CRITICAL',
    bgColor: 'bg-red-600',
    textColor: 'text-white',
    icon: AlertCircle,
    animation: 'animate-pulse'
  },
  high_alert: {
    label: 'HIGH ALERT',
    bgColor: 'bg-orange-600',
    textColor: 'text-white',
    icon: AlertTriangle,
    animation: 'animate-bounce'
  },
  urgent: {
    label: 'URGENT',
    bgColor: 'bg-yellow-600',
    textColor: 'text-black',
    icon: Zap,
    animation: ''
  }
};

// Helper: map display name to campus code
const CAMPUS_CODE_MAP: Record<string, string> = {
  'MIT ADT': 'mit-adt',
  'MIT WPU': 'mit-wpu',
  'VIT Vellore': 'vit-vellore',
  'Parul University': 'parul-university',
  'IIST': 'iist',
};

// Password for creating announcements
const CREATE_PASSWORD = 'W@Uy3*PXhmN#?Zn%5zeM';

export function EnhancedAnnouncementsPage({ 
  onBack, 
  universityId, 
  currentUser, 
  collegeName = "MIT Arts, Design & Technology"
}: Readonly<EnhancedAnnouncementsPageProps>) {
  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [urgentBroadcasts, setUrgentBroadcasts] = useState<UrgentBroadcast[]>([]);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<Set<string>>(new Set());
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showUrgentBroadcastModal, setShowUrgentBroadcastModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isAccessDeniedModalOpen, setIsAccessDeniedModalOpen] = useState(false);
  
  // Calendar states
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [calendarWeeksView, setCalendarWeeksView] = useState<'1week' | '4weeks'>('4weeks');

  // Use ref to track if initial fetch is complete
  const hasInitiallyLoaded = useRef(false);


  // Fetch announcements - using useCallback to prevent recreation on every render
  const fetchAnnouncements = useCallback(async (isInitialLoad = false) => {
    try {
      let campusCode = universityId;
      if (CAMPUS_CODE_MAP[universityId]) campusCode = CAMPUS_CODE_MAP[universityId];
      const validCampuses = Object.values(CAMPUS_CODE_MAP);
      if (!campusCode || !validCampuses.includes(campusCode)) {
        setAnnouncements([]);
        if (isInitialLoad) {
          setInitialLoading(false);
        }
        return;
      }
      const campusParam = `?campus=${campusCode}`;
      const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
      const response = await apiFetch(`${serverUrl}/api/v1/announcements${campusParam}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const incoming: any[] = data.data;
        // Allow empty array to clear state on background refresh
        setAnnouncements(prev => {
          const byId: Record<string, any> = {};
          for (const a of prev) byId[a.id] = a;
          for (const a of incoming) {
            const existing = byId[a.id];
            if (existing?.optimisticUntil && existing.optimisticUntil > Date.now()) {
              byId[a.id] = { ...a, likes: existing.likes, isLiked: existing.isLiked, optimisticUntil: existing.optimisticUntil };
            } else {
              byId[a.id] = { ...a, optimisticUntil: undefined };
            }
          }
          return Object.values(byId).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      if (isInitialLoad) {
        setInitialLoading(false);
        hasInitiallyLoaded.current = true;
    }
    }
  }, [universityId]);

  // Fetch urgent broadcasts - using useCallback to prevent recreation on every render
  const fetchUrgentBroadcasts = useCallback(async (isInitialLoad = false) => {
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
      // Note: Urgent broadcasts are global (not campus-specific)
      const response = await apiFetch(`${serverUrl}/api/v1/announcements/urgent-broadcast`);
      
      if (!response.ok) {
        console.error('Failed to fetch urgent broadcasts:', response.status);
        return;
      }
      
      const data = await response.json();
      console.log('📢 Fetched urgent broadcasts:', data.data?.length || 0, 'items');
      
      if (data.success && Array.isArray(data.data)) {
        setUrgentBroadcasts(data.data);
      } else {
        console.warn('No urgent broadcasts received or invalid format');
        setUrgentBroadcasts([]);
      }
    } catch (error) {
      console.error('Error fetching urgent broadcasts:', error);
      setUrgentBroadcasts([]);
    } finally {
      if (isInitialLoad) {
        setInitialLoading(false);
      }
    }
  }, []);

  // Fetch data on component mount and set 2s auto-refresh
  useEffect(() => {
    // Initial load with loading indicator
    const initialFetch = async () => {
      await Promise.all([
        fetchAnnouncements(true),
        fetchUrgentBroadcasts(true)
      ]);
    };

    initialFetch();

    // Background refresh every 2 seconds (without loading indicator)
    const interval = setInterval(() => {
      if (hasInitiallyLoaded.current) {
        fetchAnnouncements(false);
        fetchUrgentBroadcasts(false);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchAnnouncements, fetchUrgentBroadcasts]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleVotePoll = async (announcementId: string, optionIndex: number) => {
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
      const response = await apiFetch(`${serverUrl}/api/v1/announcements/${announcementId}/poll/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ optionIndex })
      });
      const data = await response.json();
      if (data.success) {
        setAnnouncements(prev => prev.map(ann => 
          ann.id === announcementId 
            ? { 
                ...ann, 
                poll: {
                  ...data.data,
                  userVote: data.data.userVote
                },
                userPollVote: data.data.userVote
              }
            : ann
        ));
      }
    } catch (error) {
      console.error('Error voting on poll:', error);
    }
  };

  const handleRSVP = async (announcementId: string, response: 'going' | 'maybe' | 'not_going') => {
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
      const apiResponse = await apiFetch(`${serverUrl}/api/v1/announcements/${announcementId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ response })
      });
      const data = await apiResponse.json();
      if (data.success) {
        setAnnouncements(prev => prev.map(ann => 
          ann.id === announcementId 
            ? { 
                ...ann, 
                rsvp: {
                  going: data.data.going,
                  maybe: data.data.maybe,
                  not_going: data.data.not_going,
                  total: data.data.total
                },
                userRSVP: data.data.userResponse
              }
            : ann
        ));
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
    }
  };

  const handleUrgentBroadcastSubmit = async (formData: any) => {
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
      
      // Ensure all required fields are present with defaults
      const payload = {
        title: formData.title,
        content: formData.content,
        urgencyLevel: formData.urgencyLevel || 'urgent',
        broadcastType: formData.broadcastType || 'safety_alert'
      };
      
      console.log('📤 Creating urgent broadcast:', payload);
      
      const response = await apiFetch(`${serverUrl}/api/v1/announcements/urgent-broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 403) {
          alert('Access denied. You do not have permission to create urgent broadcasts.');
        } else if (response.status === 400) {
          alert(`Invalid data: ${data.message || 'Please check your input'}`);
        } else if (response.status === 401) {
          alert('You must be logged in to create urgent broadcasts.');
        } else {
          alert(`Failed to create urgent broadcast: ${data.message || 'Server error'}`);
        }
        console.error('❌ Failed to create urgent broadcast:', {
          status: response.status,
          message: data.message,
          payload
        });
        return;
      }
      
      if (data.success) {
        setUrgentBroadcasts(prev => [data.data, ...prev]);
        setShowUrgentBroadcastModal(false);
        console.log('✅ Urgent broadcast created successfully:', data.data);
        alert('Urgent broadcast created successfully!');
      } else {
        console.error('❌ Failed to create urgent broadcast:', data.message);
        alert(`Failed to create urgent broadcast: ${data.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error creating urgent broadcast:', error);
      alert(`Network error: ${error.message || 'Please check your connection and try again.'}`);
    }
  };

  const handleUnifiedCreate = async (formData: any, type: string) => {
    try {
      if (type === 'announcement') {
        // Create regular announcement with default values for simplified form
        const announcementData = {
          title: formData.title,
          content: formData.content,
          // Provide defaults for all required/optional fields since form is simplified
          category: formData.category || 'events',
          customCategory: formData.customCategory || null,
          priority: formData.priority || 'medium',
          targetAudience: formData.targetAudience || ['all'],
          campus: formData.campus || universityId || 'all',
          department: formData.department || null,
          tags: formData.tags || [],
          isPinned: formData.isPinned || false,
          requiresAcknowledgment: formData.requiresAcknowledgment || false,
          eventDate: formData.eventDate || null,
          poll: formData.poll || null,
          attachments: formData.attachments || []
        };

        console.log('Creating announcement:', announcementData);

        const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
        const response = await apiFetch(`${serverUrl}/api/v1/announcements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(announcementData)
        });
        
        const data = await response.json();
        console.log('Create response:', data);
        
        if (!response.ok) {
          const errorMsg = data.message || `Server error: ${response.status}`;
          console.error('Failed to create announcement:', errorMsg);
          alert(`Failed to create announcement: ${errorMsg}`);
          return;
        }
        
        if (data.success) {
          setAnnouncements(prev => [data.data, ...prev]);
          setShowCreateModal(false);
          alert('Announcement created successfully!');
          console.log('✅ Announcement created successfully');
        } else {
          console.error('Failed to create announcement:', data.message);
          alert(`Failed to create announcement: ${data.message || 'Unknown error'}`);
        }
      }
    } catch (error: any) {
      console.error('Error creating content:', error);
      alert(`Error creating content: ${error.message || 'Network error'}`);
    }
  };

  const toggleExpanded = useCallback((announcementId: string) => {
    setExpandedAnnouncements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(announcementId)) {
        newSet.delete(announcementId);
      } else {
        newSet.add(announcementId);
      }
      return newSet;
    });
  }, []);

  // Removed toggleThreadExpanded - no more discussions in announcements

  // Filter announcements based on search - memoized to prevent unnecessary recalculations
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(announcement => {
    const matchesSearch = searchQuery === '' || 
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
      return matchesSearch;
  });
  }, [announcements, searchQuery]);

  const recentSearches = useMemo(() => [
    'Tech Fest 2024',
    'Mid-Semester Exams',
    'Library Study Rooms'
  ], []);

  const renderUrgentBroadcasts = () => {
    if (urgentBroadcasts.length === 0) return null;

    return (
      <div className="mb-6">
        {urgentBroadcasts.map((broadcast) => {
          const config = URGENCY_CONFIG[broadcast.urgencyLevel] || URGENCY_CONFIG.urgent;
          const IconComponent = config.icon;
          
          return (
            <div
              key={broadcast.id}
              className={`${config.bgColor} ${config.textColor} p-4 rounded-2xl border-2 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.3)] mb-3 ${config.animation}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-sm">{config.label}</span>
                    <span className="text-xs opacity-75">
                      {new Date(broadcast.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{broadcast.title}</h3>
                  <p className="text-sm opacity-90">{broadcast.content}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs opacity-75">
                      {broadcast.author.name} • {broadcast.author.role}
                    </span>
                    <span className="text-xs bg-black/20 px-2 py-1 rounded-full">
                      {broadcast.broadcastType.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };


  const renderPoll = (announcement: Announcement) => {
    if (!announcement.poll) return null;

    return (
      <div className="mt-4 p-4 bg-[#000000]/30 rounded-xl border border-[#F4E3B5]/10">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-[#F4E3B5]" />
          <h4 className="font-semibold text-white">{announcement.poll.question}</h4>
        </div>
        
        <div className="space-y-3">
          {announcement.poll.options.map((option, index) => {
            const percentage = announcement.poll!.totalVotes > 0 
              ? (option.votes / announcement.poll!.totalVotes) * 100 
              : 0;
            const isUserSelected = announcement.userPollVote === index;
            
            return (
              <button
                key={index}
                onClick={() => handleVotePoll(announcement.id, index)}
                className={`w-full p-3 rounded-lg border transition-all group ${
                  isUserSelected
                    ? 'bg-[#F4E3B5]/20 border-[#F4E3B5]/50 shadow-lg'
                    : 'bg-[#000000]/50 hover:bg-[#000000]/70 border-[#F4E3B5]/20 hover:border-[#F4E3B5]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-left">{option.text}</span>
                    {isUserSelected && (
                      <div className="w-2 h-2 bg-[#F4E3B5] rounded-full"></div>
                    )}
                  </div>
                  <span className="text-[#F4E3B5] font-bold">{option.votes}</span>
                </div>
                <div className="w-full bg-[#F4E3B5]/10 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isUserSelected ? 'bg-[#F4E3B5]' : 'bg-[#F4E3B5]/70'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-xs text-[#a1a1aa] mt-1 text-right">
                  {percentage.toFixed(1)}%
                  {isUserSelected && <span className="text-[#F4E3B5] ml-2">• Your vote</span>}
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="mt-3 text-sm text-[#a1a1aa] text-center">
          Total votes: {announcement.poll.totalVotes}
        </div>
      </div>
    );
  };

  const renderRSVP = (announcement: Announcement) => {
    if (!announcement.rsvp) return null;

    const responses = [
      { key: 'going' as const, label: 'Going', icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/20', hoverColor: 'hover:bg-green-500/30' },
      { key: 'maybe' as const, label: 'Maybe', icon: Clock, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', hoverColor: 'hover:bg-yellow-500/30' },
      { key: 'not_going' as const, label: 'Not Going', icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/20', hoverColor: 'hover:bg-red-500/30' }
    ];

    return (
      <div className="mt-4 p-4 bg-[#000000]/30 rounded-xl border border-[#F4E3B5]/10">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-[#F4E3B5]" />
          <h4 className="font-semibold text-white">Event RSVP</h4>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          {responses.map((response) => {
            const IconComponent = response.icon;
            const count = announcement.rsvp![response.key];
            const percentage = announcement.rsvp!.total > 0 
              ? (count / announcement.rsvp!.total) * 100 
              : 0;
            const isUserSelected = announcement.userRSVP === response.key;
            
            return (
              <button
                key={response.key}
                onClick={() => handleRSVP(announcement.id, response.key)}
                className={`p-3 rounded-lg border transition-all group ${
                  isUserSelected 
                    ? `${response.bgColor} ${response.color} border-current shadow-lg`
                    : `${response.bgColor} ${response.hoverColor} border-[#F4E3B5]/20 hover:border-[#F4E3B5]/40`
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <IconComponent className={`w-5 h-5 ${response.color} ${isUserSelected ? 'fill-current' : ''}`} />
                  <span className={`font-medium ${isUserSelected ? 'text-white' : 'text-white'}`}>
                    {response.label}
                  </span>
                  {isUserSelected && (
                    <div className="w-2 h-2 bg-current rounded-full"></div>
                  )}
                </div>
                <div className="text-2xl font-bold text-white mb-1">{count}</div>
                <div className="text-xs text-[#a1a1aa]">{percentage.toFixed(1)}%</div>
              </button>
            );
          })}
        </div>
        
        <div className="text-sm text-[#a1a1aa] text-center">
          Total responses: {announcement.rsvp.total}
        </div>
      </div>
    );
  };

  // Removed renderThreads - discussions only in Lost & Found now

  const renderAnnouncement = (announcement: Announcement) => {
    const isExpanded = expandedAnnouncements.has(announcement.id);

    return (
      <div
        key={announcement.id}
        className={`bg-[#000000]/50 backdrop-blur-sm border ${
          announcement.priority === 'urgent' 
            ? 'border-2 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.3)]' 
            : 'border-2 border-blue-500'
        } rounded-2xl p-4 sm:p-6 hover:bg-[#000000]/70 transition-all duration-300 ${
          announcement.isPinned ? 'ring-2 ring-[#F4E3B5]/30' : ''
        } overflow-hidden w-full`}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4 w-full overflow-hidden">
          <div className="flex-1 min-w-0 w-full overflow-hidden">
            {announcement.isPinned && (
              <div className="flex items-center gap-1 mb-2">
                <Pin className="w-4 h-4 text-[#F4E3B5] flex-shrink-0" />
                <span className="text-xs text-[#F4E3B5]">Pinned</span>
              </div>
            )}
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 break-words overflow-wrap-anywhere hyphens-auto">
              {announcement.title}
            </h3>
            <p className={`text-sm sm:text-base text-[#e4e4e7] break-words overflow-wrap-anywhere whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-3'}`}>
              {announcement.content}
            </p>
            {announcement.content.length > 200 && (
              <button
                onClick={() => toggleExpanded(announcement.id)}
                className="text-[#F4E3B5] hover:text-[#F4E3B5]/80 text-sm mt-2 transition-colors inline-block"
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
          
          {/* Date */}
          <div className="text-xs text-[#a1a1aa] sm:text-right flex-shrink-0 self-start">
            {announcement.createdAt 
              ? new Date(announcement.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })
              : 'Just now'}
          </div>
        </div>

        {/* Enhanced Features */}
        {renderPoll(announcement)}
        {renderRSVP(announcement)}

      </div>
    );
  };

  const renderCalendarView = () => {
    // Get all items (announcements, urgent broadcasts)
    const getAllCalendarItems = (): Array<any> => {
      const items: Array<any> = [];
      
      // Add announcements with event dates
      filteredAnnouncements.forEach(announcement => {
        if (announcement.eventDate) {
          items.push({
            ...announcement,
            itemType: 'announcement',
            date: new Date(announcement.eventDate)
          });
        }
      });
      
      // Add urgent broadcasts
      urgentBroadcasts.forEach(broadcast => {
        items.push({
          ...broadcast,
          itemType: 'urgent_broadcast',
          date: new Date(broadcast.createdAt),
          category: 'emergency'
        });
      });
      
      return items;
    };

    const allItems = getAllCalendarItems();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Generate dates based on view mode
    const generateDates = (): Date[] => {
      if (calendarWeeksView === '1week') {
        const weekStart = new Date(startOfToday);
        weekStart.setDate(startOfToday.getDate() - startOfToday.getDay());
        return Array.from({ length: 7 }, (_, i) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          return date;
        });
      } else {
        // 4 weeks view
        const monthStart = new Date(startOfToday);
        monthStart.setDate(startOfToday.getDate() - startOfToday.getDay());
        return Array.from({ length: 28 }, (_, i) => {
          const date = new Date(monthStart);
          date.setDate(monthStart.getDate() + i);
          return date;
        });
      }
    };

    const dates = generateDates();

    const getItemsForDate = (date: Date) => {
      return allItems.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.toDateString() === date.toDateString();
      });
    };

    const handleDateClick = (date: Date) => {
      setSelectedDate(date);
      const dayItems = getItemsForDate(date);
      if (dayItems.length > 0) {
        setShowEventDetails(true);
      }
    };

    const getWeekDates = (weekIndex: number) => {
      return dates.slice(weekIndex * 7, (weekIndex + 1) * 7);
    };

    return (
      <div className="bg-[#000000]/50 backdrop-blur-sm border border-[#F4E3B5]/20 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-[#F4E3B5]" />
            {calendarWeeksView === '1week' ? 'This Week in Campus' : 'Next 4 Weeks in Campus'}
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCalendarWeeksView('1week')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                calendarWeeksView === '1week' 
                  ? 'bg-[#F4E3B5] text-black' 
                  : 'text-[#a1a1aa] hover:text-[#F4E3B5]'
              }`}
            >
              1 Week
            </button>
            <button
              onClick={() => setCalendarWeeksView('4weeks')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                calendarWeeksView === '4weeks' 
                  ? 'bg-[#F4E3B5] text-black' 
                  : 'text-[#a1a1aa] hover:text-[#F4E3B5]'
              }`}
            >
              4 Weeks
            </button>
          </div>
        </div>

        {calendarWeeksView === '1week' ? (
          // Single week view
          <div className="grid grid-cols-7 gap-2">
            {dates.map((date) => {
              const dayItems = getItemsForDate(date);
              const isToday = date.toDateString() === startOfToday.toDateString();
              const hasItems = dayItems.length > 0;
              
              return (
                <button
                  key={date.toDateString()}
                  onClick={() => handleDateClick(date)}
                  className={`p-3 rounded-xl border transition-all hover:scale-105 ${
                    isToday 
                      ? 'bg-[#F4E3B5]/20 border-[#F4E3B5]/50 shadow-lg' 
                      : hasItems
                      ? 'bg-[#F4E3B5]/10 border-[#F4E3B5]/30 hover:bg-[#F4E3B5]/15'
                      : 'bg-[#000000]/30 border-[#F4E3B5]/10 hover:bg-[#000000]/50'
                  }`}
                >
                  <div className="text-center mb-2">
                    <div className="text-xs text-[#a1a1aa] uppercase font-medium">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-lg font-bold ${
                      isToday ? 'text-[#F4E3B5]' : 'text-white'
                    }`}>
                      {date.getDate()}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {hasItems ? (
                      <>
                        {dayItems.slice(0, 2).map((item, index) => {
                          const categoryConfig = CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG];
                          return (
                            <div
                              key={`${item.itemType}-${item.id || index}`}
                              className={`w-full h-2 rounded-full ${categoryConfig?.bgColor || 'bg-[#F4E3B5]/20'} opacity-80`}
                              title={item.title}
                            />
                          );
                        })}
                        {dayItems.length > 2 && (
                          <div className="text-xs text-[#F4E3B5] font-medium text-center">
                            +{dayItems.length - 2}
                          </div>
                        )}
                        <div className="text-xs text-[#F4E3B5] font-medium text-center mt-1">
                          {dayItems.length} item{dayItems.length !== 1 ? 's' : ''}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-[#a1a1aa] text-center py-1">
                        No events
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          // 4 weeks view
          <div className="space-y-4">
            {Array.from({ length: 4 }, (_, weekIndex) => {
              const weekDates = getWeekDates(weekIndex);
              const weekStart = weekDates[0];
              const weekEnd = weekDates[6];
              
              return (
                <div key={weekIndex} className="border border-[#F4E3B5]/10 rounded-xl p-3">
                  <div className="text-sm font-medium text-[#F4E3B5] mb-3 text-center">
                    Week {weekIndex + 1}: {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {weekDates.map((date) => {
                      const dayItems = getItemsForDate(date);
                      const isToday = date.toDateString() === startOfToday.toDateString();
                      const hasItems = dayItems.length > 0;
                      
                      return (
                        <button
                          key={date.toDateString()}
                          onClick={() => handleDateClick(date)}
                          className={`p-2 rounded-lg border transition-all hover:scale-105 ${
                            isToday 
                              ? 'bg-[#F4E3B5]/20 border-[#F4E3B5]/50 shadow-lg' 
                              : hasItems
                              ? 'bg-[#F4E3B5]/10 border-[#F4E3B5]/30 hover:bg-[#F4E3B5]/15'
                              : 'bg-[#000000]/30 border-[#F4E3B5]/10 hover:bg-[#000000]/50'
                          }`}
                        >
                          <div className="text-center mb-1">
                            <div className="text-xs text-[#a1a1aa] uppercase font-medium">
                              {date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                            </div>
                            <div className={`text-sm font-bold ${
                              isToday ? 'text-[#F4E3B5]' : 'text-white'
                            }`}>
                              {date.getDate()}
                            </div>
                          </div>
                          
                          {hasItems && (
                            <div className="flex justify-center">
                              <div className="w-2 h-2 bg-[#F4E3B5] rounded-full"></div>
                            </div>
                          )}
                          
                          {hasItems && (
                            <div className="text-xs text-[#F4E3B5] font-medium text-center mt-1">
                              {dayItems.length}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderEventDetailsModal = () => {
    if (!selectedDate || !showEventDetails) return null;
    
    // Get all items for the selected date
    const getAllItemsForDate = (date: Date): Array<any> => {
      const items: Array<any> = [];
      
      // Add announcements
      filteredAnnouncements.forEach(announcement => {
        if (announcement.eventDate) {
          const eventDate = new Date(announcement.eventDate);
          if (eventDate.toDateString() === date.toDateString()) {
            items.push({
              ...announcement,
              itemType: 'announcement',
              displayDate: eventDate
            });
          }
        }
      });
      
      // Add urgent broadcasts
      urgentBroadcasts.forEach(broadcast => {
        const broadcastDate = new Date(broadcast.createdAt);
        if (broadcastDate.toDateString() === date.toDateString()) {
          items.push({
            ...broadcast,
            itemType: 'urgent_broadcast',
            displayDate: broadcastDate,
            category: 'emergency'
          });
        }
      });
      
      return items;
    };

    const dayItems = getAllItemsForDate(selectedDate);

    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-[#000000] border border-[#F4E3B5]/20 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h2>
              <p className="text-[#a1a1aa]">{dayItems.length} item{dayItems.length !== 1 ? 's' : ''} scheduled</p>
            </div>
            <button
              onClick={() => setShowEventDetails(false)}
              className="text-[#a1a1aa] hover:text-[#F4E3B5] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {dayItems.map((item, index) => {
              const categoryConfig = CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG];
              const CategoryIcon = categoryConfig?.icon || Calendar;
              
              return (
                <div
                  key={`${item.itemType}-${item.id || index}`}
                  className={`p-4 rounded-xl border ${categoryConfig?.borderColor || 'border-[#F4E3B5]/20'} ${categoryConfig?.bgColor || 'bg-[#F4E3B5]/10'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${categoryConfig?.bgColor || 'bg-[#F4E3B5]/20'} rounded-xl flex items-center justify-center`}>
                      <CategoryIcon className={`w-6 h-6 ${categoryConfig?.color || 'text-[#F4E3B5]'}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-white">{item.title}</h3>
                        <span className={`px-2 py-1 ${categoryConfig?.bgColor || 'bg-[#F4E3B5]/20'} ${categoryConfig?.color || 'text-[#F4E3B5]'} rounded-lg text-xs font-medium`}>
                          {item.itemType === 'announcement' ? categoryConfig?.label || 'Event' : 
                           item.itemType === 'urgent_broadcast' ? 'Urgent' : 
                           item.itemType === 'lost_found' ? (item.itemType === 'lost' ? 'Lost Item' : 'Found Item') : 'Item'}
                        </span>
                      </div>
                      
                      <p className="text-[#e4e4e7] text-sm mb-3">
                        {item.content || item.description || 'No description available'}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-[#F4E3B5]">
                          <Clock className="w-4 h-4" />
                          {item.displayDate.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </div>
                        
                        {item.itemType === 'announcement' && item.rsvp && (
                          <div className="flex items-center gap-1 text-green-400">
                            <Users className="w-4 h-4" />
                            {item.rsvp.total} RSVPs
                          </div>
                        )}

                        {item.itemType === 'lost_found' && (
                          <div className="flex items-center gap-1 text-[#F4E3B5]">
                            <MapPin className="w-4 h-4" />
                            {item.location}
                          </div>
                        )}

                        {item.itemType === 'urgent_broadcast' && (
                          <div className="flex items-center gap-1 text-red-400">
                            <Siren className="w-4 h-4" />
                            {item.urgencyLevel?.toUpperCase()}
                          </div>
                        )}
                      </div>

                      {item.itemType === 'announcement' && item.rsvp && (
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => handleRSVP(item.id, 'going')}
                            className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-all"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Going ({item.rsvp.going})
                          </button>
                          <button
                            onClick={() => handleRSVP(item.id, 'maybe')}
                            className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30 transition-all"
                          >
                            <Clock className="w-4 h-4" />
                            Maybe ({item.rsvp.maybe})
                          </button>
                          <button
                            onClick={() => handleRSVP(item.id, 'not_going')}
                            className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-all"
                          >
                            <XCircle className="w-4 h-4" />
                            Not Going ({item.rsvp.not_going})
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Password protection for create button
  const handleCreateClick = useCallback(() => {
    setIsPasswordModalOpen(true);
    setPasswordInput('');
  }, []);

  const handlePasswordSubmit = useCallback(() => {
    if (passwordInput === CREATE_PASSWORD) {
      setIsPasswordModalOpen(false);
      setShowCreateModal(true);
      setPasswordInput('');
    } else {
      setIsPasswordModalOpen(false);
      setIsAccessDeniedModalOpen(true);
      setPasswordInput('');
    }
  }, [passwordInput]);

  // Only show loading screen on initial load, not on background refreshes
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#F4E3B5] text-lg">Loading announcements...</div>
      </div>
    );
  }

  return (
    <div className="campus-theme min-h-screen bg-black flex flex-col">
      <PageHeader
        title="Announcements"
        subtitle={collegeName}
        onBack={onBack}
        onSearch={handleSearch}
        onCreate={handleCreateClick}
        recentSearches={recentSearches}
        searchPlaceholder="Search announcements..."
      />

      {/* Urgent Broadcasts */}
      {renderUrgentBroadcasts()}

      {/* Main Content */}
      <div className="flex-1 px-2 sm:px-4 py-2 pb-4 overflow-y-auto overflow-x-hidden">
            {/* View Mode Toggle - Compact */}
            <div className="flex items-center gap-1 mb-4 bg-[#000000]/50 rounded-xl p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center ${
                  viewMode === 'list'
                    ? 'bg-[#F4E3B5] text-black'
                    : 'text-[#a1a1aa] hover:text-[#F4E3B5]'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center ${
                  viewMode === 'calendar'
                    ? 'bg-[#F4E3B5] text-black'
                    : 'text-[#a1a1aa] hover:text-[#F4E3B5]'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline">Calendar</span>
              </button>
            </div>

            {/* Content Based on View Mode */}
            {viewMode === 'calendar' && renderCalendarView()}
            
            {viewMode === 'list' && (
              <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
                {filteredAnnouncements.map(renderAnnouncement)}
              </div>
            )}
      </div>

      {/* Urgent Broadcast Modal */}
      <UrgentBroadcastModal
        isOpen={showUrgentBroadcastModal}
        onClose={() => setShowUrgentBroadcastModal(false)}
        onSubmit={handleUrgentBroadcastSubmit}
        currentUser={currentUser}
      />

      {/* Event Details Modal */}
      {renderEventDetailsModal()}

      {/* Unified Create Modal */}
      <CreateAnnouncementModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        currentUser={currentUser}
        onSubmit={handleUnifiedCreate}
        universityId={universityId}
      />

      {/* Password Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="bg-black border-[#F4E3B5]/20 text-white w-[90%] max-w-[340px] sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-[#F4E3B5] text-base sm:text-lg">
              Enter password
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 sm:py-4">
            <Input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              placeholder="Enter password"
              className="bg-black border-[#F4E3B5]/30 text-white placeholder:text-gray-500 focus:border-[#F4E3B5] text-sm"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setPasswordInput('');
              }}
              className="border-[#F4E3B5]/30 text-[#F4E3B5] hover:bg-[#F4E3B5]/10 flex-1 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordSubmit}
              className="bg-[#F4E3B5] text-black hover:bg-[#F4E3B5]/90 flex-1 text-sm"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Denied Modal */}
      <Dialog open={isAccessDeniedModalOpen} onOpenChange={setIsAccessDeniedModalOpen}>
        <DialogContent className="bg-black border-red-500/30 text-white w-[90%] max-w-[340px] sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2 text-base sm:text-lg">
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              Access Denied
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 sm:py-4">
            <p className="text-gray-300 text-sm sm:text-base">
              Incorrect password. You do not have permission to create announcements.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsAccessDeniedModalOpen(false)}
              className="bg-red-500 text-white hover:bg-red-600 w-full text-sm"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
