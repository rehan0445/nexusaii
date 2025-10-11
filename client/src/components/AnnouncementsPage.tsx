import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Search,
  Filter,
  Bookmark,
  ThumbsUp,
  CheckCircle,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  FileText,
  Briefcase,
  Users2,
  Megaphone,
  Shield,
  Timer,
  Star,
  BellRing,
  CheckCircle2,
  Sparkles,
  Target,
  Zap,
  Siren,
  Gift,
  Eye,
  MapPin,
  User
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'events' | 'exams' | 'clubs' | 'placements';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isSticky: boolean;
  isUrgent: boolean;
  likes: number;
  attending: number;
  isLiked?: boolean;
  isAttending?: boolean;
  isSaved?: boolean;
  isVerified: boolean;
  isReminderSet?: boolean;
  eventDate?: Date;
  author: {
    id: string;
    name: string;
    role: string;
    isVerified: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface CampusDigest {
  id: string;
  weekStart: Date;
  weekEnd: Date;
  summary: string;
  highlights: {
    category: string;
    count: number;
    topAnnouncement: string;
  }[];
  totalAnnouncements: number;
  isRead: boolean;
}

interface UrgentBroadcast {
  id: string;
  title: string;
  content: string;
  broadcastType: 'exam_postponed' | 'safety_alert' | 'holiday_declared' | 'emergency';
  priority: 'critical' | 'urgent';
  isActive: boolean;
  expiresAt?: Date;
  author: {
    id: string;
    name: string;
    role: string;
    isVerified: boolean;
  };
  createdAt: Date;
  actions?: {
    label: string;
    url?: string;
    action?: () => void;
  }[];
}

interface LostFoundItem {
  id: string;
  title: string;
  description: string;
  type: 'lost' | 'found';
  category: 'electronics' | 'clothing' | 'books' | 'accessories' | 'other';
  location: string;
  date: Date;
  contactInfo: string;
  imageUrl?: string;
  isVerified: boolean;
  isResolved: boolean;
  author: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: Date;
}

interface AnnouncementsPageProps {
  onBack: () => void;
  universityId: string;
  currentUser: {
    id: string;
    name: string;
    isAdmin: boolean;
  };
  collegeName?: string;
  collegeFullName?: string;
}

const CATEGORY_CONFIG = {
  events: { 
    label: 'Events', 
    icon: Calendar, 
    color: 'bg-softgold-500', 
    emoji: '🟡',
    description: 'Campus events and activities'
  },
  exams: { 
    label: 'Exams', 
    icon: FileText, 
    color: 'bg-softgold-600', 
    emoji: '🟡',
    description: 'Examination schedules and updates'
  },
  clubs: { 
    label: 'Clubs', 
    icon: Users2, 
    color: 'bg-softgold-700', 
    emoji: '🟡',
    description: 'Club activities and announcements'
  },
  placements: { 
    label: 'Placements', 
    icon: Briefcase, 
    color: 'bg-softgold-800', 
    emoji: '🟡',
    description: 'Job opportunities and placement updates'
  }
};

const BROADCAST_CONFIG = {
  exam_postponed: { 
    label: 'Exam Postponed', 
    icon: FileText, 
    color: 'bg-red-600',
    emoji: '📚'
  },
  safety_alert: { 
    label: 'Safety Alert', 
    icon: Shield, 
    color: 'bg-orange-600',
    emoji: '⚠️'
  },
  holiday_declared: { 
    label: 'Holiday Declared', 
    icon: Gift, 
    color: 'bg-green-600',
    emoji: '🎉'
  },
  emergency: { 
    label: 'Emergency', 
    icon: Siren, 
    color: 'bg-red-800',
    emoji: '🚨'
  }
};

export function AnnouncementsPage({ onBack, universityId, currentUser, collegeName, collegeFullName }: Readonly<AnnouncementsPageProps>) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [urgentBroadcasts, setUrgentBroadcasts] = useState<UrgentBroadcast[]>([]);
  const [lostFoundItems, setLostFoundItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [savedAnnouncements, setSavedAnnouncements] = useState<string[]>([]);
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null);
  const [subscribedCategories, setSubscribedCategories] = useState<string[]>(['events', 'placements']);
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [reminderSetAnnouncements, setReminderSetAnnouncements] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'announcements' | 'lost-found'>('announcements');
  const [showLostFoundForm, setShowLostFoundForm] = useState(false);
  const [notificationShown, setNotificationShown] = useState<string[]>([]);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Generate mock announcement data
  useEffect(() => {
    const mockAnnouncements: Announcement[] = [
      {
        id: '1',
        title: 'Mid-Semester Examination Schedule Released',
        content: 'The mid-semester examination schedule for all departments has been released. Please check the detailed timetable and examination guidelines.',
        category: 'exams',
        priority: 'urgent',
        isSticky: true,
        isUrgent: true,
        likes: 45,
        attending: 0,
        isVerified: true,
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        author: { 
          id: 'admin', 
          name: 'Academic Office', 
          role: 'admin',
          isVerified: true
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: '2',
        title: 'Tech Fest 2024 - Registration Open',
        content: 'Join us for the biggest technology festival of the year! Register now for exciting competitions, workshops, and networking opportunities.',
        category: 'events',
        priority: 'high',
        isSticky: false,
        isUrgent: false,
        likes: 128,
        attending: 234,
        isLiked: true,
        isAttending: false,
        isVerified: true,
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        author: { 
          id: 'tech-club', 
          name: 'Tech Club', 
          role: 'club',
          isVerified: false
        },
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
      },
      {
        id: '3',
        title: 'Google Summer of Code Applications',
        content: 'Applications for Google Summer of Code 2024 are now open. Students interested in open source development should apply early.',
        category: 'placements',
        priority: 'high',
        isSticky: false,
        isUrgent: false,
        likes: 89,
        attending: 0,
        isVerified: true,
        eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        author: { 
          id: 'placement-cell', 
          name: 'Placement Cell', 
          role: 'admin',
          isVerified: true
        },
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
      },
      {
        id: '4',
        title: 'Drama Club Auditions - This Weekend',
        content: 'Drama club is holding auditions for the upcoming play. All students are welcome to participate. No prior experience required.',
        category: 'clubs',
        priority: 'medium',
        isSticky: false,
        isUrgent: false,
        likes: 67,
        attending: 45,
        isVerified: false,
        eventDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        author: { 
          id: 'drama-club', 
          name: 'Drama Club', 
          role: 'club',
          isVerified: false
        },
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      }
    ];


    // Mock Urgent Broadcasts
    const mockBroadcasts: UrgentBroadcast[] = [
      {
        id: 'broadcast-1',
        title: 'Mid-Semester Exams Postponed Due to Weather',
        content: 'Due to severe weather conditions, all mid-semester examinations scheduled for tomorrow have been postponed. New dates will be announced shortly. Please stay tuned for updates.',
        broadcastType: 'exam_postponed',
        priority: 'critical',
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        author: {
          id: 'admin',
          name: 'Academic Office',
          role: 'admin',
          isVerified: true
        },
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        actions: [
          {
            label: 'View New Schedule',
            action: () => console.log('Navigate to schedule')
          },
          {
            label: 'Contact Academic Office',
            action: () => console.log('Contact support')
          }
        ]
      },
      {
        id: 'broadcast-2',
        title: 'Campus Safety Alert - Suspicious Activity',
        content: 'Security has reported suspicious activity near the library. All students are advised to avoid the area and report any unusual behavior to campus security immediately.',
        broadcastType: 'safety_alert',
        priority: 'urgent',
        isActive: true,
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
        author: {
          id: 'security',
          name: 'Campus Security',
          role: 'admin',
          isVerified: true
        },
        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        actions: [
          {
            label: 'Contact Security',
            action: () => console.log('Contact security')
          }
        ]
      }
    ];

    // Mock Lost & Found Items
    const mockLostFound: LostFoundItem[] = [
      {
        id: 'lf-1',
        title: 'Lost: MacBook Pro 13"',
        description: 'Silver MacBook Pro with stickers on the back. Lost near the computer lab yesterday afternoon.',
        type: 'lost',
        category: 'electronics',
        location: 'Computer Lab Building',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        contactInfo: 'contact@student.edu',
        isVerified: true,
        isResolved: false,
        author: {
          id: 'student1',
          name: 'Alex Johnson',
          role: 'student'
        },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        id: 'lf-2',
        title: 'Found: Black Backpack',
        description: 'Black Nike backpack found in the cafeteria. Contains books and a water bottle.',
        type: 'found',
        category: 'accessories',
        location: 'Cafeteria',
        date: new Date(Date.now() - 12 * 60 * 60 * 1000),
        contactInfo: 'found@student.edu',
        isVerified: true,
        isResolved: false,
        author: {
          id: 'student2',
          name: 'Sarah Wilson',
          role: 'student'
        },
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      },
      {
        id: 'lf-3',
        title: 'Lost: Calculus Textbook',
        description: 'Calculus 2 textbook by Stewart. Lost in the library study area.',
        type: 'lost',
        category: 'books',
        location: 'Library Study Area',
        date: new Date(Date.now() - 48 * 60 * 60 * 1000),
        contactInfo: 'mathstudent@student.edu',
        isVerified: false,
        isResolved: false,
        author: {
          id: 'student3',
          name: 'Mike Chen',
          role: 'student'
        },
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
      }
    ];

    setAnnouncements(mockAnnouncements);
    setUrgentBroadcasts(mockBroadcasts);
    setLostFoundItems(mockLostFound);
    setLoading(false);
  }, []);

  // Filter announcements based on search, category, and personalization
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || announcement.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    // Auto-prioritize based on personalization
    const aSubscribed = subscribedCategories.includes(a.category);
    const bSubscribed = subscribedCategories.includes(b.category);
    const aVerified = a.isVerified;
    const bVerified = b.isVerified;
    
    // Priority order: subscribed + verified > subscribed > verified > others
    if (aSubscribed && aVerified && !(bSubscribed && bVerified)) return -1;
    if (bSubscribed && bVerified && !(aSubscribed && aVerified)) return 1;
    if (aSubscribed && !bSubscribed) return -1;
    if (bSubscribed && !aSubscribed) return 1;
    if (aVerified && !bVerified) return -1;
    if (bVerified && !aVerified) return 1;
    
    // Then by priority
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  // Separate urgent/sticky announcements for carousel
  const urgentAnnouncements = announcements.filter(a => a.isUrgent || a.isSticky);
  const regularAnnouncements = filteredAnnouncements.filter(a => !a.isUrgent && !a.isSticky);

  // Auto-rotate carousel
  useEffect(() => {
    if (urgentAnnouncements.length > 1) {
      const interval = setInterval(() => {
        setCurrentCarouselIndex((prev) => (prev + 1) % urgentAnnouncements.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [urgentAnnouncements.length]);

  // Update countdown timers every minute
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update countdown timers
      setAnnouncements(prev => [...prev]);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Push notification simulation for urgent broadcasts
  useEffect(() => {
    if (urgentBroadcasts.length > 0) {
      urgentBroadcasts.forEach(broadcast => {
        if (broadcast.isActive && !notificationShown.includes(broadcast.id)) {
          // Simulate push notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(broadcast.title, {
              body: broadcast.content,
              icon: '/favicon.ico',
              badge: '/favicon.ico'
            });
          } else {
            // Fallback: console log for demo
            console.log(`🚨 URGENT BROADCAST: ${broadcast.title}`);
          }
          setNotificationShown(prev => [...prev, broadcast.id]);
        }
      });
    }
  }, [urgentBroadcasts, notificationShown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLike = (announcementId: string) => {
    setAnnouncements(prev => prev.map(announcement => 
      announcement.id === announcementId 
        ? { 
            ...announcement, 
            isLiked: !announcement.isLiked,
            likes: announcement.isLiked ? announcement.likes - 1 : announcement.likes + 1
          }
        : announcement
    ));
  };

  const handleAttending = (announcementId: string) => {
    setAnnouncements(prev => prev.map(announcement => 
      announcement.id === announcementId 
        ? { 
            ...announcement, 
            isAttending: !announcement.isAttending,
            attending: announcement.isAttending ? announcement.attending - 1 : announcement.attending + 1
          }
        : announcement
    ));
  };

  const handleSave = (announcementId: string) => {
    setSavedAnnouncements(prev => 
      prev.includes(announcementId) 
        ? prev.filter(id => id !== announcementId)
        : [...prev, announcementId]
    );
  };

  const handleSetReminder = (announcementId: string) => {
    setReminderSetAnnouncements(prev => 
      prev.includes(announcementId) 
        ? prev.filter(id => id !== announcementId)
        : [...prev, announcementId]
    );
    
    // In a real app, this would integrate with calendar APIs
    console.log(`Reminder set for announcement ${announcementId}`);
  };

  const handleToggleSubscription = (category: string) => {
    setSubscribedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };


  const getTimeRemaining = (eventDate: Date) => {
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Event has started';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getCountdownColor = (eventDate: Date) => {
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 24) return 'text-red-400';
    if (hours < 72) return 'text-orange-400';
    return 'text-green-400';
  };


  const handleMarkLostFoundResolved = (itemId: string) => {
    setLostFoundItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, isResolved: !item.isResolved }
        : item
    ));
  };



  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getCategoryConfig = (category: string) => {
    return CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.events;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-[#F4E3B5] to-[#F4E3B5] rounded-full mb-4 mx-auto"></div>
          <p className="text-[#a1a1aa] font-medium">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">

      {/* Header Section */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-2xl border-b border-[#F4E3B5]/10">
        <div className="px-4 py-4">
          {/* Navigation */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[#F4E3B5] hover:text-[#F4E3B5]/80 transition-colors p-2 rounded-xl hover:bg-[#F4E3B5]/10"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white font-montserrat">Announcements</h1>
              <p className="text-sm text-[#a1a1aa]">{collegeName}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mb-6">
            <button
              onClick={() => setActiveTab('announcements')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                activeTab === 'announcements'
                  ? 'bg-[#F4E3B5]/20 text-[#F4E3B5] border border-[#F4E3B5]/30'
                  : 'text-[#a1a1aa] hover:text-[#F4E3B5] hover:bg-[#F4E3B5]/10'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span className="font-medium">Announcements</span>
            </button>
            <button
              onClick={() => setActiveTab('lost-found')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                activeTab === 'lost-found'
                  ? 'bg-[#F4E3B5]/20 text-[#F4E3B5] border border-[#F4E3B5]/30'
                  : 'text-[#a1a1aa] hover:text-[#F4E3B5] hover:bg-[#F4E3B5]/10'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span className="font-medium">Lost & Found</span>
              {lostFoundItems.filter(item => !item.isResolved).length > 0 && (
                <span className="bg-[#F4E3B5]/20 text-[#F4E3B5] text-xs px-2 py-0.5 rounded-full">
                  {lostFoundItems.filter(item => !item.isResolved).length}
                </span>
              )}
            </button>
          </div>


          {/* Filter Dropdown and Search */}
          <div className="flex gap-3">
            {/* Filter Dropdown */}
            <div className="relative" ref={filterDropdownRef}>
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-4 py-3 bg-[#27272a] hover:bg-[#27272a]/80 text-white rounded-xl border border-[#F4E3B5]/20 transition-all duration-200"
              >
                <Filter className="w-4 h-4" />
                <span className="font-medium">
                  {selectedCategory === 'all' ? 'All Categories' : getCategoryConfig(selectedCategory).label}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showFilterDropdown && (
                <div className="absolute top-full left-0 mt-2 bg-[#27272a]/95 backdrop-blur-xl border border-[#F4E3B5]/30 rounded-2xl p-3 shadow-2xl shadow-[#F4E3B5]/10 z-50 min-w-[200px]">
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                        selectedCategory === 'all'
                          ? 'bg-[#F4E3B5]/20 text-[#F4E3B5] border border-[#F4E3B5]/30'
                          : 'text-white hover:bg-[#F4E3B5]/10 hover:text-[#F4E3B5]'
                      }`}
                    >
                      <Megaphone className="w-4 h-4" />
                      <span>All Categories</span>
                    </button>
                    
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setSelectedCategory(key);
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                            selectedCategory === key
                              ? 'bg-[#F4E3B5]/20 text-[#F4E3B5] border border-[#F4E3B5]/30'
                              : 'text-white hover:bg-[#F4E3B5]/10 hover:text-[#F4E3B5]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{config.label}</span>
                          <span className="ml-auto">{config.emoji}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#a1a1aa]" />
              <input
                type="text"
                placeholder="Search announcements…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#27272a] hover:bg-[#27272a]/80 text-white rounded-xl border border-[#F4E3B5]/20 transition-all duration-200 placeholder-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#F4E3B5]/50"
              />
            </div>

            {/* Personalization Button */}
            <button
              onClick={() => setShowPersonalization(!showPersonalization)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 ${
                showPersonalization
                  ? 'bg-[#F4E3B5]/20 text-[#F4E3B5] border-[#F4E3B5]/40'
                  : 'bg-[#27272a] hover:bg-[#27272a]/80 text-white border-[#F4E3B5]/20'
              }`}
              title="Personalize Feed"
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Personalize</span>
            </button>
          </div>
        </div>
      </header>

      {/* Personalization Panel */}
      {showPersonalization && (
        <div className="px-4 py-4 bg-[#27272a]/50 backdrop-blur-xl border-b border-[#F4E3B5]/10">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#F4E3B5]" />
              Smart Personalization
            </h3>
            <p className="text-sm text-[#a1a1aa] mb-4">Choose categories to prioritize in your feed. Verified announcements will be highlighted.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                const isSubscribed = subscribedCategories.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => handleToggleSubscription(key)}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                      isSubscribed
                        ? 'bg-[#F4E3B5]/20 text-[#F4E3B5] border-[#F4E3B5]/40'
                        : 'bg-[#18181b]/50 text-[#a1a1aa] border-[#F4E3B5]/10 hover:border-[#F4E3B5]/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{config.label}</span>
                    {isSubscribed && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-4 p-3 bg-[#18181b]/30 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-[#a1a1aa]">
                <Zap className="w-4 h-4 text-[#F4E3B5]" />
                <span>Feed auto-prioritizes: <span className="text-[#F4E3B5] font-medium">Subscribed + Verified</span> → <span className="text-[#F4E3B5] font-medium">Subscribed</span> → <span className="text-[#F4E3B5] font-medium">Verified</span> → Others</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="px-4 py-6">

        {/* Lost & Found Content */}
        {activeTab === 'lost-found' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#F4E3B5]" />
                Lost & Found Board
              </h2>
              <button
                onClick={() => setShowLostFoundForm(!showLostFoundForm)}
                className="flex items-center gap-2 px-4 py-2 bg-[#F4E3B5]/20 text-[#F4E3B5] rounded-xl border border-[#F4E3B5]/30 hover:bg-[#F4E3B5]/30 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">Post Item</span>
              </button>
            </div>

            {/* Lost & Found Items */}
            <div className="space-y-4">
              {lostFoundItems.filter(item => !item.isResolved).length === 0 ? (
                <div className="text-center py-12">
                  <Eye className="w-12 h-12 text-[#a1a1aa] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No active items</h3>
                  <p className="text-[#a1a1aa]">All lost and found items have been resolved!</p>
                </div>
              ) : (
                lostFoundItems.filter(item => !item.isResolved).map(item => (
                  <div key={item.id} className="bg-[#27272a]/50 backdrop-blur-xl rounded-2xl p-6 border border-[#F4E3B5]/10 hover:border-[#F4E3B5]/20 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          item.type === 'lost' ? 'bg-orange-500' : 'bg-green-500'
                        }`}>
                          {item.type === 'lost' ? (
                            <Eye className="w-5 h-5 text-white" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                              item.type === 'lost' ? 'bg-orange-500' : 'bg-green-500'
                            }`}>
                              {item.type === 'lost' ? '🔍 Lost' : '✅ Found'}
                            </span>
                            <span className="px-2 py-1 bg-blue-500 rounded-full text-xs font-medium text-white">
                              {item.category}
                            </span>
                            {item.isVerified && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full text-xs font-medium text-green-400 border border-green-500/30">
                                <Shield className="w-3 h-3" />
                                <span>Verified</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#a1a1aa]">
                            <MapPin className="w-3 h-3" />
                            {item.location}
                            <span>•</span>
                            <Clock className="w-3 h-3" />
                            {formatDate(item.createdAt)}
                            <span>•</span>
                            <User className="w-3 h-3" />
                            {item.author.name}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleMarkLostFoundResolved(item.id)}
                        className="text-[#a1a1aa] hover:text-green-400 transition-colors p-2"
                        title="Mark as resolved"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 font-montserrat">
                      {item.title}
                    </h3>
                    <p className="text-[#a1a1aa] mb-4 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-[#a1a1aa]">
                        <span>Contact:</span>
                        <span className="text-[#F4E3B5]">{item.contactInfo}</span>
                      </div>
                      {item.imageUrl && (
                        <button className="flex items-center gap-2 px-3 py-2 bg-[#18181b]/50 rounded-lg border border-[#F4E3B5]/10 hover:border-[#F4E3B5]/20 transition-all duration-200">
                          <ImageIcon className="w-4 h-4 text-[#F4E3B5]" />
                          <span className="text-sm text-[#F4E3B5]">View Image</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Announcement Feed */}
        <div className="space-y-4">
          {regularAnnouncements.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-12 h-12 text-[#a1a1aa] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No announcements found</h3>
              <p className="text-[#a1a1aa]">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            regularAnnouncements.map((announcement) => {
              const categoryConfig = getCategoryConfig(announcement.category);
              const CategoryIcon = categoryConfig.icon;
              
              return (
                <div
                  key={announcement.id}
                  className="bg-[#27272a]/50 backdrop-blur-xl rounded-2xl p-6 border border-[#F4E3B5]/10 hover:border-[#F4E3B5]/20 transition-all duration-300 hover:shadow-lg hover:shadow-[#F4E3B5]/5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${categoryConfig.color} rounded-xl flex items-center justify-center`}>
                        <CategoryIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryConfig.color} text-white`}>
                            {categoryConfig.emoji} {categoryConfig.label}
                          </span>
                          {announcement.isVerified && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full text-xs font-medium text-green-400 border border-green-500/30">
                              <Shield className="w-3 h-3" />
                              <span>Verified</span>
                            </div>
                          )}
                          {announcement.priority === 'urgent' && (
                            <span className="px-2 py-1 bg-red-500 rounded-full text-xs font-medium text-white">
                              URGENT
                            </span>
                          )}
                          {subscribedCategories.includes(announcement.category) && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-[#F4E3B5]/20 rounded-full text-xs font-medium text-[#F4E3B5] border border-[#F4E3B5]/30">
                              <Star className="w-3 h-3" />
                              <span>Subscribed</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#a1a1aa]">
                          <Clock className="w-3 h-3" />
                          {formatDate(announcement.createdAt)}
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <span>{announcement.author.name}</span>
                            {announcement.author.isVerified && (
                              <Shield className="w-3 h-3 text-green-400" />
                            )}
                          </div>
                        </div>
                        
                        {/* Event Countdown Timer */}
                        {announcement.eventDate && announcement.category === 'events' && (
                          <div className="flex items-center gap-2 mt-2">
                            <Timer className="w-4 h-4 text-[#F4E3B5]" />
                            <span className={`text-sm font-medium ${getCountdownColor(announcement.eventDate)}`}>
                              {getTimeRemaining(announcement.eventDate)}
                            </span>
                            <button
                              onClick={() => handleSetReminder(announcement.id)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                                reminderSetAnnouncements.includes(announcement.id)
                                  ? 'bg-[#F4E3B5]/20 text-[#F4E3B5]'
                                  : 'bg-[#27272a] text-[#a1a1aa] hover:text-[#F4E3B5] hover:bg-[#F4E3B5]/10'
                              }`}
                            >
                              <BellRing className="w-3 h-3" />
                              <span>{reminderSetAnnouncements.includes(announcement.id) ? 'Reminder Set' : 'Remind Me'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleSave(announcement.id)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        savedAnnouncements.includes(announcement.id)
                          ? 'text-[#F4E3B5] bg-[#F4E3B5]/20'
                          : 'text-[#a1a1aa] hover:text-[#F4E3B5] hover:bg-[#F4E3B5]/10'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 font-montserrat">
                    {announcement.title}
                  </h3>
                  
                  <div className="mb-4">
                    {expandedAnnouncement === announcement.id ? (
                      <p className="text-[#a1a1aa] leading-relaxed">{announcement.content}</p>
                    ) : (
                      <p className="text-[#a1a1aa] leading-relaxed line-clamp-2">
                        {announcement.content}
                      </p>
                    )}
                  </div>


                  {/* Interaction Layer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(announcement.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                          announcement.isLiked
                            ? 'text-[#F4E3B5] bg-[#F4E3B5]/20'
                            : 'text-[#a1a1aa] hover:text-[#F4E3B5] hover:bg-[#F4E3B5]/10'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm font-medium">{announcement.likes}</span>
                      </button>

                      {announcement.category === 'events' && (
                        <button
                          onClick={() => handleAttending(announcement.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                            announcement.isAttending
                              ? 'text-green-400 bg-green-400/20'
                              : 'text-[#a1a1aa] hover:text-green-400 hover:bg-green-400/10'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {announcement.isAttending ? 'Attending' : 'Attend'} ({announcement.attending})
                          </span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setExpandedAnnouncement(
                        expandedAnnouncement === announcement.id ? null : announcement.id
                      )}
                      className="flex items-center gap-1 text-[#a1a1aa] hover:text-[#F4E3B5] transition-colors text-sm font-medium"
                    >
                      <span>{expandedAnnouncement === announcement.id ? 'Show less' : 'Read more'}</span>
                      {expandedAnnouncement === announcement.id ? (
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

    </div>
  );
}
