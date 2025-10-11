import express from 'express';
import multer from 'multer';
import { supabase } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';
import { scanBuffer } from '../utils/avScanner.js';
import { audit } from '../utils/audit.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();

// Configure multer for memory storage (for Supabase upload)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per-file limit
    files: 5,
    fields: 30,
  },
  fileFilter: (req, file, cb) => {
    try {
      // Strict extension whitelist
      const allowed = ['jpg','jpeg','png','gif','webp'];
      const ext = (file.originalname.split('.').pop() || '').toLowerCase();
      const isImage = file.mimetype.startsWith('image/');
      if (!isImage || !allowed.includes(ext)) return cb(new Error('Invalid file type'), false);
      cb(null, true);
    } catch { cb(new Error('Invalid file'), false); }
  }
});

// New data structures for enhanced features
let campusDigests = [];
let announcementThreads = {};
let lostFoundItems = [];
let urgentBroadcasts = [];

// Track user likes, RSVPs, and poll votes (in production, this would be in a database)
let userLikes = {}; // { userId: { announcementId: true/false } }
let userRSVPs = {}; // { userId: { announcementId: 'going'|'maybe'|'not_going'|null } }
let userPollVotes = {}; // { userId: { announcementId: optionIndex|null } }

// Use actual auth middleware for protected routes
const authenticateToken = requireAuth;

// Enhanced announcement data structure with comprehensive test data for MIT ADT
let announcements = [
  {
    id: '1',
    title: 'Campus Wi-Fi Maintenance Scheduled',
    content: 'The campus Wi-Fi network will be undergoing maintenance on Friday, December 15th from 2:00 AM to 6:00 AM. During this time, internet connectivity may be intermittent. We apologize for any inconvenience.',
    category: 'infrastructure',
    priority: 'high',
    targetAudience: ['all'],
    campus: 'mit-adt',
    department: null,
    scheduledFor: new Date('2023-12-15T02:00:00Z'),
    expiresAt: new Date('2023-12-15T08:00:00Z'),
    attachments: [],
    isActive: true,
    requiresAcknowledgment: false,
    tags: ['wifi', 'maintenance', 'network'],
    isPinned: true,
    likes: 42,
    reactions: {
      '👍': 15,
      '❤️': 8,
      '😢': 12,
      '😡': 3,
      '👀': 4
    },
    author: {
      id: 'admin_1',
      name: 'Campus Admin',
      role: 'system_admin'
    },
    // New fields for enhanced features
    hasThreads: false,
    poll: null,
    rsvp: null,
    eventDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
  },
  {
    id: '2',
    title: 'New Study Rooms Available in Library',
    content: 'We are excited to announce that 10 new study rooms are now available on the 3rd floor of the main library. These rooms can be booked online through the library portal. Each room accommodates 4-6 students and includes whiteboards and power outlets.',
    category: 'academic',
    priority: 'medium',
    targetAudience: ['students'],
    campus: 'mit-adt',
    department: 'library',
    scheduledFor: null,
    expiresAt: null,
    attachments: [],
    isActive: true,
    requiresAcknowledgment: false,
    tags: ['library', 'study rooms', 'booking'],
    isPinned: false,
    likes: 128,
    reactions: {
      '👍': 45,
      '❤️': 23,
      '🎉': 18,
      '👏': 12,
      '🔥': 8
    },
    author: {
      id: 'admin_2',
      name: 'Library Admin',
      role: 'department_admin'
    },
    // New fields for enhanced features
    hasThreads: true,
    poll: {
      id: 'poll_1',
      question: 'What additional facilities would you like in the study rooms?',
      options: [
        { text: 'More power outlets', votes: 23 },
        { text: 'Better air conditioning', votes: 18 },
        { text: 'Larger whiteboards', votes: 15 },
        { text: 'Computer access', votes: 31 }
      ],
      type: 'multiple_choice',
      totalVotes: 87,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
    },
    rsvp: null,
    eventDate: null,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
  },
  {
    id: '3',
    title: 'Final Exams Schedule Released',
    content: 'The final examination schedule for this semester has been published on the student portal. Please check your individual timetables and note any conflicts. The examination period runs from December 18th to December 22nd.',
    category: 'academic',
    priority: 'urgent',
    targetAudience: ['students'],
    campus: 'all',
    department: 'registrar',
    scheduledFor: null,
    expiresAt: new Date('2023-12-22T23:59:59Z'),
    attachments: [],
    isActive: true,
    requiresAcknowledgment: true,
    tags: ['exams', 'schedule', 'important'],
    isPinned: true,
    likes: 89,
    reactions: {
      '👍': 25,
      '😰': 20,
      '📚': 15,
      '💪': 10,
      '😤': 8
    },
    author: {
      id: 'admin_3',
      name: 'Registrar Office',
      role: 'department_admin'
    },
    // New fields for enhanced features
    hasThreads: true,
    poll: null,
    rsvp: null,
    eventDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
  },
  {
    id: '4',
    title: 'Emergency: Campus Security Alert',
    content: 'Due to severe weather conditions, all outdoor activities are cancelled today. Students are advised to stay indoors and avoid unnecessary travel. Campus shuttle services are temporarily suspended.',
    category: 'emergency',
    priority: 'urgent',
    targetAudience: ['all'],
    campus: 'all',
    department: 'security',
    scheduledFor: null,
    expiresAt: null,
    attachments: [],
    isActive: true,
    requiresAcknowledgment: true,
    tags: ['emergency', 'weather', 'safety'],
    isPinned: true,
    likes: 156,
    reactions: {
      '👍': 50,
      '😰': 30,
      '🙏': 25,
      '⚠️': 20,
      '💙': 15
    },
    author: {
      id: 'admin_4',
      name: 'Campus Security',
      role: 'security_admin'
    },
    // New fields for enhanced features
    hasThreads: false,
    poll: null,
    rsvp: null,
    eventDate: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  // Sample event announcement with RSVP
  {
    id: '5',
    title: 'Tech Fest 2024 - Registration Open',
    content: 'Join us for the biggest tech event of the year! Tech Fest 2024 features coding competitions, tech talks, startup pitches, and networking opportunities. Register now to secure your spot.',
    category: 'events',
    priority: 'medium',
    targetAudience: ['students', 'faculty'],
    campus: 'mit-adt',
    department: 'computer_science',
    scheduledFor: null,
    expiresAt: new Date('2024-01-15T23:59:59Z'),
    attachments: [],
    isActive: true,
    requiresAcknowledgment: false,
    tags: ['tech', 'festival', 'competition', 'networking'],
    isPinned: false,
    likes: 156,
    reactions: {
      '🚀': 45,
      '💻': 38,
      '🎉': 32,
      '👏': 25,
      '🔥': 16
    },
    author: {
      id: 'admin_5',
      name: 'CS Department',
      role: 'department_admin'
    },
    // New fields for enhanced features
    hasThreads: true,
    poll: null,
    rsvp: {
      going: 89,
      maybe: 34,
      not_going: 12,
      total: 135
    },
    eventDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  // Additional events for calendar demonstration
  {
    id: '6',
    title: 'Student Council Meeting',
    content: 'Monthly student council meeting to discuss upcoming events and student feedback. All students are welcome to attend.',
    category: 'events',
    priority: 'medium',
    targetAudience: ['students'],
    campus: 'mit-adt',
    department: 'student_affairs',
    scheduledFor: null,
    expiresAt: null,
    attachments: [],
    isActive: true,
    requiresAcknowledgment: false,
    tags: ['meeting', 'student council'],
    isPinned: false,
    likes: 45,
    reactions: {
      '👍': 20,
      '📝': 15,
      '🎯': 10
    },
    author: {
      id: 'admin_6',
      name: 'Student Affairs',
      role: 'department_admin'
    },
    hasThreads: false,
    poll: null,
    rsvp: {
      going: 25,
      maybe: 15,
      not_going: 5,
      total: 45
    },
    eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: '7',
    title: 'Workshop: Resume Building',
    content: 'Learn how to create an impressive resume that stands out to employers. Industry experts will share tips and provide feedback.',
    category: 'events',
    priority: 'medium',
    targetAudience: ['students'],
    campus: 'mit-adt',
    department: 'career_services',
    scheduledFor: null,
    expiresAt: null,
    attachments: [],
    isActive: true,
    requiresAcknowledgment: false,
    tags: ['workshop', 'career', 'resume'],
    isPinned: false,
    likes: 78,
    reactions: {
      '💼': 30,
      '👍': 25,
      '📄': 23
    },
    author: {
      id: 'admin_7',
      name: 'Career Services',
      role: 'department_admin'
    },
    hasThreads: false,
    poll: null,
    rsvp: {
      going: 45,
      maybe: 20,
      not_going: 3,
      total: 68
    },
    eventDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    id: '8',
    title: 'Cultural Fest: Unity in Diversity',
    content: 'Join us for a celebration of different cultures with food stalls, performances, and exhibitions. Experience the rich diversity of our campus community.',
    category: 'events',
    priority: 'high',
    targetAudience: ['all'],
    campus: 'mit-adt',
    department: 'cultural_committee',
    scheduledFor: null,
    expiresAt: null,
    attachments: [],
    isActive: true,
    requiresAcknowledgment: false,
    tags: ['cultural', 'festival', 'diversity'],
    isPinned: true,
    likes: 234,
    reactions: {
      '🎉': 80,
      '🌍': 60,
      '🎭': 45,
      '🍜': 35,
      '❤️': 14
    },
    author: {
      id: 'admin_8',
      name: 'Cultural Committee',
      role: 'department_admin'
    },
    hasThreads: true,
    poll: null,
    rsvp: {
      going: 156,
      maybe: 45,
      not_going: 8,
      total: 209
    },
    eventDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  // Additional comprehensive test data for MIT ADT
  {
    id: '9',
    title: 'MIT ADT Sports Week 2024',
    content: 'Get ready for the biggest sports event of the year! MIT ADT Sports Week features cricket, football, basketball, badminton, and more. Register your teams now and show your competitive spirit!',
    category: 'Sports Events', // Custom category
    priority: 'high',
    targetAudience: ['students', 'faculty'],
    campus: 'mit-adt',
    department: 'sports_committee',
    scheduledFor: null,
    expiresAt: null,
    attachments: [],
    isActive: true,
    requiresAcknowledgment: false,
    tags: ['sports', 'competition', 'team registration'],
    isPinned: true,
    likes: 342,
    reactions: {
      '🏆': 89,
      '⚽': 67,
      '🏀': 45,
      '🏏': 52,
      '🔥': 89
    },
    author: {
      id: 'admin_9',
      name: 'Sports Committee',
      role: 'department_admin'
    },
    poll: {
      id: 'poll_2',
      question: 'Which sport are you most excited about?',
      options: [
        { text: 'Cricket Tournament', votes: 67 },
        { text: 'Football Championship', votes: 54 },
        { text: 'Basketball League', votes: 43 },
        { text: 'Badminton Singles', votes: 38 },
        { text: 'Table Tennis', votes: 29 }
      ],
      type: 'multiple_choice',
      totalVotes: 231,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    rsvp: {
      going: 234,
      maybe: 67,
      not_going: 23,
      total: 324
    },
    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
  },
  {
    id: '10',
    title: 'Placement Drive - Google, Microsoft, Amazon',
    content: 'Major tech companies are visiting MIT ADT for campus placements! Google (Software Engineer), Microsoft (Product Manager), and Amazon (Cloud Solutions) positions available. Prepare your resumes and practice coding!',
    category: 'Career Fair', // Custom category
    priority: 'urgent',
    targetAudience: ['students'],
    campus: 'mit-adt',
    department: 'placement_cell',
    scheduledFor: null,
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    attachments: [],
    isActive: true,
    requiresAcknowledgment: true,
    tags: ['placement', 'tech companies', 'career'],
    isPinned: true,
    likes: 567,
    reactions: {
      '💼': 123,
      '🚀': 98,
      '💻': 87,
      '🎯': 76,
      '🔥': 183
    },
    author: {
      id: 'admin_10',
      name: 'Placement Cell',
      role: 'department_admin'
    },
    poll: {
      id: 'poll_3',
      question: 'Which company are you most interested in?',
      options: [
        { text: 'Google - Software Engineer', votes: 156 },
        { text: 'Microsoft - Product Manager', votes: 89 },
        { text: 'Amazon - Cloud Solutions', votes: 134 },
        { text: 'All of them!', votes: 78 }
      ],
      type: 'multiple_choice',
      totalVotes: 457,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    rsvp: {
      going: 445,
      maybe: 89,
      not_going: 12,
      total: 546
    },
    eventDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: '11',
    title: 'MIT ADT Innovation Challenge 2024',
    content: 'Calling all innovators! Present your groundbreaking ideas and compete for prizes worth ₹5 Lakhs. Categories include AI/ML, Sustainability, FinTech, and Social Impact. Registration deadline: Next Friday.',
    category: 'Tech Innovation', // Custom category
    priority: 'high',
    targetAudience: ['students'],
    campus: 'mit-adt',
    department: 'innovation_lab',
    scheduledFor: null,
    expiresAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    attachments: [],
    isActive: true,
    requiresAcknowledgment: false,
    tags: ['innovation', 'competition', 'prizes', 'startup'],
    isPinned: false,
    likes: 289,
    reactions: {
      '💡': 67,
      '🚀': 54,
      '💰': 43,
      '🏆': 38,
      '🤖': 87
    },
    author: {
      id: 'admin_11',
      name: 'Innovation Lab',
      role: 'department_admin'
    },
    poll: {
      id: 'poll_4',
      question: 'Which innovation category interests you most?',
      options: [
        { text: 'AI/ML Solutions', votes: 89 },
        { text: 'Sustainability Tech', votes: 67 },
        { text: 'FinTech Applications', votes: 54 },
        { text: 'Social Impact Projects', votes: 43 }
      ],
      type: 'multiple_choice',
      totalVotes: 253,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    },
    rsvp: {
      going: 167,
      maybe: 89,
      not_going: 34,
      total: 290
    },
    eventDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
  }
];

// Sample data for urgent broadcasts - MIT ADT specific
urgentBroadcasts.push(
  {
    id: 'urgent_1',
    title: 'CRITICAL: Mid-Semester Exams Postponed',
    content: 'Due to unforeseen circumstances, all mid-semester examinations scheduled for next week have been postponed by 3 days. New schedule will be announced within 24 hours.',
    urgencyLevel: 'critical',
    broadcastType: 'exam_postponed',
    isActive: true,
    author: {
      id: 'admin_1',
      name: 'MIT ADT Admin',
      role: 'system_admin'
    },
    createdAt: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: 'urgent_2',
    title: 'HIGH ALERT: Campus Security Update',
    content: 'New security protocols in effect. All students must carry ID cards. Visitors require prior approval. Gates close at 10 PM sharp.',
    urgencyLevel: 'high_alert',
    broadcastType: 'safety_alert',
    isActive: true,
    author: {
      id: 'admin_security',
      name: 'MIT ADT Security',
      role: 'security_admin'
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 'urgent_3',
    title: 'URGENT: Holiday Declared Tomorrow',
    content: 'Due to heavy rainfall warning, classes are cancelled tomorrow (September 22nd). All exams and activities are postponed. Stay safe!',
    urgencyLevel: 'urgent',
    broadcastType: 'holiday_declared',
    isActive: true,
    author: {
      id: 'admin_1',
      name: 'MIT ADT Admin',
      role: 'system_admin'
    },
    createdAt: new Date(Date.now() - 45 * 60 * 1000)
  }
);

// Sample data for lost & found items - MIT ADT specific
lostFoundItems.push(
  {
    id: 'lf_1',
    title: 'Lost iPhone 14 Pro - Black',
    description: 'Lost my black iPhone 14 Pro near the MIT ADT library around 3 PM. Has a clear case with university sticker. Please contact if found.',
    category: 'electronics',
    customTags: ['iphone', 'library', 'urgent', 'reward'],
    photos: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop'],
    itemType: 'lost',
    location: 'MIT ADT Main Library',
    status: 'active',
    author: {
      id: 'student_1',
      name: 'Sarah Johnson',
      role: 'student'
    },
    comments: [
      {
        id: 'comment_1',
        content: 'I saw someone pick up a phone near the library entrance around that time. Check with security?',
        author: { id: 'student_3', name: 'Raj Patel', role: 'student' },
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }
    ],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'lf_2',
    title: 'Found: Blue Water Bottle with Stickers',
    description: 'Found a blue water bottle with various tech company stickers in the CS building, room 201. Has a name "Mike" written on it.',
    category: 'personal',
    customTags: ['water bottle', 'cs building', 'mike'],
    photos: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop'],
    itemType: 'found',
    location: 'MIT ADT CS Building - Room 201',
    status: 'active',
    author: {
      id: 'student_2',
      name: 'Alex Chen',
      role: 'student'
    },
    comments: [
      {
        id: 'comment_2',
        content: 'That might be Mike from 3rd year CS! I can help you contact him.',
        author: { id: 'student_4', name: 'Priya Sharma', role: 'student' },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    ],
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'lf_3',
    title: 'Lost: MIT ADT ID Card & Wallet',
    description: 'Lost my student ID card along with brown leather wallet near the cafeteria. Contains important documents and some cash. Urgent!',
    category: 'personal',
    customTags: ['id card', 'wallet', 'cafeteria', 'urgent', 'documents'],
    photos: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop'],
    itemType: 'lost',
    location: 'MIT ADT Cafeteria',
    status: 'active',
    author: {
      id: 'student_5',
      name: 'Arjun Mehta',
      role: 'student'
    },
    comments: [],
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'lf_4',
    title: 'Found: MacBook Charger in Lab',
    description: 'Found a MacBook Pro charger (USB-C) in the AI/ML lab after yesterday\'s session. Still in good condition.',
    category: 'electronics',
    customTags: ['macbook', 'charger', 'ai lab', 'usb-c'],
    photos: ['https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop'],
    itemType: 'found',
    location: 'MIT ADT AI/ML Lab',
    status: 'active',
    author: {
      id: 'student_6',
      name: 'Neha Singh',
      role: 'student'
    },
    comments: [
      {
        id: 'comment_3',
        content: 'This might belong to someone from the machine learning workshop yesterday.',
        author: { id: 'faculty_1', name: 'Dr. Kumar', role: 'faculty' },
        createdAt: new Date(Date.now() - 30 * 60 * 1000)
      }
    ],
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'lf_5',
    title: 'Lost: Red Backpack with Books',
    description: 'Lost my red backpack containing textbooks for Data Structures, DBMS, and Web Development. Also has my notebook with important notes.',
    category: 'books',
    customTags: ['backpack', 'textbooks', 'notes', 'red', 'cs books'],
    photos: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop'],
    itemType: 'lost',
    location: 'MIT ADT Computer Lab Block',
    status: 'active',
    author: {
      id: 'student_7',
      name: 'Vikram Rao',
      role: 'student'
    },
    comments: [],
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
  }
);

// Sample thread data
announcementThreads['2'] = [
  {
    id: 'thread_1',
    content: 'This is great news! Are the rooms available for group study sessions too?',
    parentId: null,
    author: {
      id: 'student_3',
      name: 'Emma Wilson',
      role: 'student'
    },
    likes: 5,
    replies: [],
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
  },
  {
    id: 'thread_2',
    content: 'Yes, they are perfect for group studies! I booked one yesterday.',
    parentId: 'thread_1',
    author: {
      id: 'student_4',
      name: 'James Rodriguez',
      role: 'student'
    },
    likes: 3,
    replies: [],
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
  },
  // MIT WPU specific announcements
  {
    id: 'wpu_1',
    title: 'MIT WPU Cultural Fest 2024',
    content: 'Join us for the annual MIT WPU Cultural Fest featuring performances, food stalls, and cultural exhibitions. Experience the diversity of our campus community.',
    category: 'events',
    priority: 'high',
    targetAudience: ['all'],
    campus: 'mit-wpu',
    department: 'cultural_committee',
    scheduledFor: null,
    expiresAt: null,
    attachments: [],
    isActive: true,
    requiresAcknowledgment: false,
    tags: ['cultural', 'fest', 'celebration'],
    isPinned: true,
    likes: 28,
    reactions: {
      '👍': 12,
      '❤️': 8,
      '🎉': 5,
      '👀': 3
    },
    author: {
      id: 'wpu_admin_1',
      name: 'MIT WPU Admin',
      role: 'system_admin'
    },
    hasThreads: false,
    poll: null,
    rsvp: null,
    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 'wpu_2',
    title: 'MIT WPU Library Extended Hours',
    content: 'The MIT WPU library will have extended hours during exam period. Open from 6 AM to 11 PM Monday through Friday.',
    category: 'academic',
    priority: 'medium',
    targetAudience: ['students'],
    campus: 'mit-wpu',
    department: 'library',
    scheduledFor: null,
    expiresAt: null,
    attachments: [],
    isActive: true,
    requiresAcknowledgment: false,
    tags: ['library', 'exam', 'extended hours'],
    isPinned: false,
    likes: 15,
    reactions: {
      '👍': 8,
      '📚': 4,
      '👀': 3
    },
    author: {
      id: 'wpu_admin_2',
      name: 'Library Admin',
      role: 'admin'
    },
    hasThreads: false,
    poll: null,
    rsvp: null,
    eventDate: null,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
  }
];

// Campus table mapping helpers
const ANNOUNCEMENTS_TABLE_MAP = {
  'mit-adt': 'announcements_mit_adt',
  'mit-wpu': 'announcements_mit_wpu',
  'iict': 'announcements_iict',
  'iist': 'announcements_iict', // IIST maps to IICT table
  'parul-university': 'announcements_parul_university',
  'vit-vellore': 'announcements_vit_vellore'
};
const LOSTFOUND_TABLE_MAP = {
  'mit-adt': 'lost_found_mit_adt',
  'mit-wpu': 'lost_found_mit_wpu',
  'iict': 'lost_found_iict',
  'iist': 'lost_found_iict', // IIST maps to IICT table
  'parul-university': 'lost_found_parul_university',
  'vit-vellore': 'lost_found_vit_vellore'
};
const getAnnouncementsTable = (campus) => ANNOUNCEMENTS_TABLE_MAP[campus] || null;
const getLostFoundTable = (campus) => LOSTFOUND_TABLE_MAP[campus] || null;

// Get announcements with filtering
router.get('/', requireAuth, async (req, res) => {
  try {
    const { campus, category, priority } = req.query;
    const table = getAnnouncementsTable(campus);
    if (!table) {
      return res.status(400).json({ success: false, message: 'Invalid campus' });
    }
    let query = supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Lost & Found Routes - MUST be before /:id route to avoid conflicts
router.get('/lost-found', authenticateToken, async (req, res) => {
  try {
    const { campus, category, status } = req.query;
    const table = getLostFoundTable(campus);
    if (!table) {
      return res.status(400).json({ success: false, message: 'Invalid campus' });
    }
    let query = supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: dbItems, error } = await query;
    
    if (error) {
      console.error('Database error:', error);
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ success: false, message: 'Service temporarily unavailable' });
      }
      // Dev-only fallback
      let filteredItems = lostFoundItems.filter(item => {
        if (category && item.category !== category) return false;
        if (status && item.status !== status) return false;
        return true;
      });
      return res.json({ success: true, data: filteredItems, message: 'Dev fallback' });
    }
    
    // Convert database format to frontend format
    const formattedItems = dbItems.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      customTags: item.custom_tags,
      photos: item.photos,
      itemType: item.item_type,
      location: item.location,
      status: item.status,
      author: {
        id: item.author_id,
        name: item.author_name,
        role: item.author_role
      },
      createdAt: new Date(item.created_at),
      expiresAt: new Date(item.expires_at)
    }));
    
    res.json({
      success: true,
      data: formattedItems
    });
  } catch (error) {
    console.error('Error fetching lost & found items:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.post('/lost-found', authenticateToken, upload.array('photos', 5), async (req, res) => {
  try {
    const { campus, title, description, category, customTags, itemType, location } = req.body;
    const table = getLostFoundTable(campus);
    if (!table) {
      return res.status(400).json({ success: false, message: 'Invalid campus' });
    }
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    let photoUrls = [];

    // Handle photo uploads if files exist
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          if ((file.size || 0) > 5 * 1024 * 1024) continue;
          // Antivirus scan (if enabled)
          const result = await scanBuffer(file.buffer, file.originalname, file.mimetype);
          if (!result.clean) {
            console.warn('AV blocked upload', { file: file.originalname, reason: result.reason });
            continue;
          }
          const fileExt = (file.originalname.split('.').pop() || '').toLowerCase();
          const fileName = `lost-found/${uuidv4()}.${fileExt}`;

          // Upload to Supabase storage
          const { error: uploadError } = await supabase.storage
            .from('nexus-lost-found')
            .upload(fileName, file.buffer, {
              contentType: file.mimetype,
            });

          if (uploadError) {
            console.error('Photo upload failed:', uploadError);
            continue; // Skip this file but continue with others
          }

          // Use signed URL (short expiry)
          const { data: signed } = await supabase.storage
            .from('nexus-lost-found')
            .createSignedUrl(fileName, 60 * 10); // 10 minutes
          if (signed?.signedUrl) photoUrls.push(signed.signedUrl);
        }
      } catch (uploadErr) {
        console.error('Error uploading photos:', uploadErr);
        // Continue without photos rather than failing completely
      }
    }
    
    const itemId = Date.now().toString();
    const now = new Date();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Insert into database
    const { data: dbItem, error } = await supabase
      .from(table)
      .insert({
        id: itemId,
        title,
        description,
        category,
        custom_tags: customTags ? (typeof customTags === 'string' ? JSON.parse(customTags) : customTags) : [],
        photos: photoUrls,
        item_type: itemType,
        location,
        status: 'active',
        author_id: req.user.id,
        author_name: req.user.name,
        author_role: req.user.role,
        created_at: now,
        expires_at: expiresAt
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating lost & found item:', error);
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ success: false, message: 'Service temporarily unavailable' });
      }
      // Dev-only fallback
      const newItem = {
        id: Date.now().toString(),
        title: req.body.title,
        description: req.body.description,
        category: req.body.category || 'general',
        customTags: req.body.customTags ? (typeof req.body.customTags === 'string' ? JSON.parse(req.body.customTags) : req.body.customTags) : [],
        photos: req.body.photos || [],
        itemType: req.body.itemType || 'lost',
        location: req.body.location || 'Unknown',
        status: 'active',
        author: {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role || 'student'
        },
        createdAt: new Date(),
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };
      lostFoundItems.push(newItem);
      return res.status(201).json({ success: true, data: newItem, message: 'Dev fallback' });
    }

    // Convert database format to frontend format
    const newItem = {
      id: dbItem.id,
      title: dbItem.title,
      description: dbItem.description,
      category: dbItem.category,
      customTags: dbItem.custom_tags,
      photos: dbItem.photos,
      itemType: dbItem.item_type,
      location: dbItem.location,
      status: dbItem.status,
      author: {
        id: dbItem.author_id,
        name: dbItem.author_name,
        role: dbItem.author_role
      },
      createdAt: new Date(dbItem.created_at),
      expiresAt: new Date(dbItem.expires_at)
    };
    
    res.status(201).json({
      success: true,
      data: newItem
    });
  } catch (error) {
    console.error('Error creating lost & found item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single announcement by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const announcement = announcements.find(ann => ann.id === req.params.id);
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    res.json({
      success: true,
      data: announcement
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new announcement (admin only)
// Allow any authenticated user to create announcements (admin still required for urgent broadcast)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { 
      title, 
      content, 
      category, 
      customCategory,
      priority, 
      tags, 
      eventDate, 
      campus,
      department,
      targetAudience,
      isPinned,
      requiresAcknowledgment,
      poll,
      attachments
    } = req.body || {};
    
    const table = getAnnouncementsTable(campus);
    if (!table) {
      return res.status(400).json({ success: false, message: 'Invalid campus' });
    }
    
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Use custom category if provided, otherwise use the selected category
    const finalCategory = customCategory || category;
    
    const announcementData = {
      id,
      title,
      content,
      category: finalCategory,
      priority: priority || 'medium',
      tags: tags || [],
      event_date: eventDate || null,
      campus: campus || 'all',
      department: department || null,
      target_audience: targetAudience || ['all'],
      is_pinned: isPinned || false,
      requires_acknowledgment: requiresAcknowledgment || false,
      poll: poll || null,
      attachments: attachments || [],
      author_id: req.user?.id || 'system',
      author_name: req.user?.name || 'System',
      author_role: req.user?.role || 'admin',
      is_active: true,
      created_at: now,
      updated_at: now
    };
    
    const { data, error } = await supabase.from(table).insert(announcementData).select().single();
    
    if (error) {
      console.error('Supabase error creating announcement:', error);
      throw error;
    }
    
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Like/unlike announcement
// Make auth optional in dev so likes work even if session bridge isn't ready
router.post('/:id/like', async (req, res) => {
  // Pure in-memory like toggle to guarantee success in dev
  try {
    const announcementId = String(req.params.id);
    const uid = String(req.user?.id || req.userId || req.body?.user_id || 'dev-user');
    if (!userLikes[uid]) userLikes[uid] = {};
    const currentlyLiked = !!userLikes[uid][announcementId];
    if (currentlyLiked) {
      delete userLikes[uid][announcementId];
    } else {
      userLikes[uid][announcementId] = true;
    }

    // Recompute like count
    let likeCount = 0;
    for (const u in userLikes) {
      if (userLikes[u] && userLikes[u][announcementId]) likeCount++;
    }
    // Update sample announcements array if present
    try {
      const idx = announcements.findIndex(a => String(a.id) === announcementId);
      if (idx !== -1) announcements[idx].likes = likeCount;
    } catch {}

    return res.json({ success: true, data: { likes: likeCount, isLiked: !currentlyLiked, action: currentlyLiked ? 'unliked' : 'liked' }, message: 'Dev fallback' });
  } catch (err) {
    console.error('Like route error:', err);
    return res.json({ success: true, data: { likes: 0, isLiked: false, action: 'liked' }, message: 'Dev forced success' });
  }
});

// Add reaction to announcement
router.post('/:id/react', requireAuth, async (req, res) => {
  try {
    const announcementId = req.params.id;
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ success: false, message: 'Emoji is required' });

    // Read current reactions JSON
    const { data: row, error: selErr } = await supabase
      .from('announcements')
      .select('reactions')
      .eq('id', announcementId)
      .single();
    if (selErr) throw selErr;
    const reactions = row?.reactions || {};
    reactions[emoji] = (reactions[emoji] || 0) + 1;

    const { error: updErr } = await supabase
      .from('announcements')
      .update({ reactions, updated_at: new Date().toISOString() })
      .eq('id', announcementId);
    if (updErr) throw updErr;

    try { await audit(req, 'announcement_react', 'announcement', announcementId, { emoji }); } catch {}
    return res.json({ success: true, data: { reactions }, message: 'Reaction added successfully' });
  } catch (error) {
    console.error('Error adding reaction:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update announcement (admin only)
router.put('/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
  try {
    const announcementId = req.params.id;
    const updates = req.body;
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const announcementIndex = announcements.findIndex(ann => ann.id === announcementId);
    
    if (announcementIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    // Update announcement
    announcements[announcementIndex] = {
      ...announcements[announcementIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    try { await audit(req, 'announcement_update', 'announcement', announcementId, { updates }); } catch {}
    res.json({
      success: true,
      data: announcements[announcementIndex],
      message: 'Announcement updated successfully'
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete announcement (admin only)
router.delete('/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
  try {
    const announcementId = req.params.id;
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const announcementIndex = announcements.findIndex(ann => ann.id === announcementId);
    
    if (announcementIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    const removed = announcements.splice(announcementIndex, 1);
    try { await audit(req, 'announcement_delete', 'announcement', announcementId, { title: removed?.[0]?.title }); } catch {}
    
    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== NEW ENHANCED FEATURES ROUTES =====

// Campus Digest Routes
router.get('/digest', requireAuth, async (req, res) => {
  try {
    const { period = 'weekly', campus } = req.query;
    
    // Calculate period start dates
    const now = new Date();
    let periodStart;
    
    switch (period) {
      case '24hours':
        periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        periodStart = weekStart;
        break;
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    // Check if digest already exists for this period and campus
    const { data: existingDigest } = await supabase
      .from('campus_digests')
      .select('*')
      .eq('period', period)
      .eq('campus', campus || 'all')
      .gte('period_start', periodStart.toISOString())
      .single();
    
    if (existingDigest) {
      return res.json({
        success: true,
        data: {
          id: existingDigest.id,
          period: existingDigest.period,
          periodStart: new Date(existingDigest.period_start),
          summary: existingDigest.summary,
          highlights: existingDigest.highlights,
          upcomingDeadlines: existingDigest.upcoming_deadlines,
          totalAnnouncements: existingDigest.total_announcements,
          isRead: existingDigest.is_read,
          generatedAt: new Date(existingDigest.generated_at),
          campus: existingDigest.campus,
          analytics: existingDigest.analytics
        }
      });
    }
    
    // Generate new digest from database
    let announcementsQuery = supabase
      .from('announcements')
      .select('*')
      .gte('created_at', periodStart.toISOString())
      .eq('is_active', true);
    
    if (campus && campus !== 'all') {
      announcementsQuery = announcementsQuery.eq('campus', campus);
    }
    
    const { data: recentAnnouncements, error: announcementsError } = await announcementsQuery;
    
    if (announcementsError) {
      console.error('Error fetching announcements for digest:', announcementsError);
      console.log('Falling back to in-memory storage for digest...');
      
      // Fallback to in-memory storage
      let recentAnnouncements = announcements.filter(ann => {
        if (!ann.isActive) return false;
        if (ann.createdAt < periodStart) return false;
        if (campus && campus !== 'all' && ann.campus !== campus) return false;
        return true;
      });
      
      // Generate analytics
      const analytics = generateDigestAnalytics(recentAnnouncements || []);
      
      // Get top announcements by likes
      const highlights = (recentAnnouncements || [])
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 5)
        .map(a => ({
          id: a.id,
          title: a.title,
          likes: a.likes,
          category: a.category,
          campus: a.campus
        }));
      
      // Get upcoming events
      const upcomingDeadlines = (recentAnnouncements || [])
        .filter(a => a.eventDate && new Date(a.eventDate) > new Date())
        .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
        .slice(0, 10)
        .map(a => ({
          id: a.id,
          title: a.title,
          date: new Date(a.eventDate),
          category: a.category,
          campus: a.campus
        }));
      
      // Generate summary
      const campusName = campus === 'mit-adt' ? 'MIT ADT' : 
                        campus === 'mit-wpu' ? 'MIT WPU' : 'All Campuses';
      const periodName = period === '24hours' ? 'Last 24 hours' : 
                        period === 'weekly' ? 'This week' : 'This month';
      
      const summary = `${periodName} at ${campusName}: ${recentAnnouncements?.length || 0} new announcements, ` +
                     `${analytics.topCategory} was the most active category with ${analytics.categoryBreakdown[analytics.topCategory] || 0} posts, ` +
                     `and ${analytics.totalLikes} total likes across all announcements.`;
      
      const newDigest = {
        id: Date.now().toString(),
        period,
        periodStart,
        summary,
        highlights,
        upcomingDeadlines,
        totalAnnouncements: recentAnnouncements?.length || 0,
        isRead: false,
        generatedAt: new Date(),
        campus: campus || 'all',
        analytics
      };
      
      return res.json({
        success: true,
        data: newDigest
      });
    }
    
    // Generate analytics
    const analytics = generateDigestAnalytics(recentAnnouncements || []);
    
    // Get top announcements by likes
    const highlights = (recentAnnouncements || [])
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 5)
      .map(a => ({
        id: a.id,
        title: a.title,
        likes: a.likes,
        category: a.category,
        campus: a.campus
      }));
    
    // Get upcoming events
    const upcomingDeadlines = (recentAnnouncements || [])
      .filter(a => a.event_date && new Date(a.event_date) > new Date())
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
      .slice(0, 10)
      .map(a => ({
        id: a.id,
        title: a.title,
        date: new Date(a.event_date),
        category: a.category,
        campus: a.campus
      }));
    
    // Generate summary
    const campusName = campus === 'mit-adt' ? 'MIT ADT' : 
                      campus === 'mit-wpu' ? 'MIT WPU' : 'All Campuses';
    const periodName = period === '24hours' ? 'Last 24 hours' : 
                      period === 'weekly' ? 'This week' : 'This month';
    
    const summary = `${periodName} at ${campusName}: ${recentAnnouncements?.length || 0} new announcements, ` +
                   `${analytics.topCategory} was the most active category with ${analytics.categoryBreakdown[analytics.topCategory] || 0} posts, ` +
                   `and ${analytics.totalLikes} total likes across all announcements.`;
    
    const newDigest = {
      id: Date.now().toString(),
      period,
      period_start: periodStart.toISOString(),
      summary,
      highlights,
      upcoming_deadlines: upcomingDeadlines,
      total_announcements: recentAnnouncements?.length || 0,
      is_read: false,
      generated_at: new Date().toISOString(),
      campus: campus || 'all',
      analytics
    };
    
    // Save to database
    const { error: insertError } = await supabase
      .from('campus_digests')
      .insert(newDigest);
    
    if (insertError) {
      console.error('Error saving digest to database:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Failed to save digest to database'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: newDigest.id,
        period: newDigest.period,
        periodStart: new Date(newDigest.period_start),
        summary: newDigest.summary,
        highlights: newDigest.highlights,
        upcomingDeadlines: newDigest.upcoming_deadlines,
        totalAnnouncements: newDigest.total_announcements,
        isRead: newDigest.is_read,
        generatedAt: new Date(newDigest.generated_at),
        campus: newDigest.campus,
        analytics: newDigest.analytics
      }
    });
  } catch (error) {
    console.error('Error generating campus digest:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to generate digest analytics
function generateDigestAnalytics(announcements) {
  const analytics = {
    totalAnnouncements: announcements.length,
    totalLikes: announcements.reduce((sum, a) => sum + (a.likes || 0), 0),
    categoryBreakdown: {},
    priorityBreakdown: {},
    campusBreakdown: {},
    topCategory: 'general',
    topPriority: 'medium',
    averageLikes: 0,
    mostActiveDay: 'Monday',
    engagementRate: 0
  };
  
  if (announcements.length === 0) {
    return analytics;
  }
  
  // Category breakdown
  announcements.forEach(ann => {
    analytics.categoryBreakdown[ann.category] = (analytics.categoryBreakdown[ann.category] || 0) + 1;
    analytics.priorityBreakdown[ann.priority] = (analytics.priorityBreakdown[ann.priority] || 0) + 1;
    analytics.campusBreakdown[ann.campus] = (analytics.campusBreakdown[ann.campus] || 0) + 1;
  });
  
  // Find top category and priority
  analytics.topCategory = Object.keys(analytics.categoryBreakdown).reduce((a, b) => 
    analytics.categoryBreakdown[a] > analytics.categoryBreakdown[b] ? a : b, 'general');
  analytics.topPriority = Object.keys(analytics.priorityBreakdown).reduce((a, b) => 
    analytics.priorityBreakdown[a] > analytics.priorityBreakdown[b] ? a : b, 'medium');
  
  // Calculate averages
  analytics.averageLikes = Math.round(analytics.totalLikes / announcements.length);
  analytics.engagementRate = Math.round((analytics.totalLikes / announcements.length) * 100) / 100;
  
  // Find most active day
  const dayCounts = {};
  announcements.forEach(ann => {
    const day = new Date(ann.created_at).toLocaleDateString('en-US', { weekday: 'long' });
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  analytics.mostActiveDay = Object.keys(dayCounts).reduce((a, b) => 
    dayCounts[a] > dayCounts[b] ? a : b, 'Monday');
  
  return analytics;
}

// Announcement Threads Routes
router.get('/:id/threads', authenticateToken, async (req, res) => {
  try {
    const announcementId = req.params.id;
    const { data, error } = await supabase
      .from('announcement_threads')
      .select('*')
      .eq('announcement_id', announcementId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    const threads = (data || []).map((t) => ({
      id: t.id,
      content: t.content,
      parentId: t.parent_id,
      author: { id: t.author_id, name: t.author_name, role: t.author_role },
      likes: t.likes || 0,
      replies: [],
      createdAt: new Date(t.created_at)
    }));
    return res.json({ success: true, data: threads });
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/:id/threads', authenticateToken, async (req, res) => {
  try {
    const announcementId = req.params.id;
    const { content, parentId = null } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }
    const insert = {
      announcement_id: announcementId,
      parent_id: parentId,
      content,
      author_id: req.user.id,
      author_name: req.user.name,
      author_role: req.user.role,
    };
    const { data, error } = await supabase
      .from('announcement_threads')
      .insert(insert)
      .select()
      .single();
    if (error) throw error;
    const created = {
      id: data.id,
      content: data.content,
      parentId: data.parent_id,
      author: { id: data.author_id, name: data.author_name, role: data.author_role },
      likes: data.likes || 0,
      replies: [],
      createdAt: new Date(data.created_at)
    };
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Interactive Announcements - Polls
router.post('/:id/poll', authenticateToken, async (req, res) => {
  try {
    const announcementId = req.params.id;
    const { question, options, type = 'multiple_choice' } = req.body;
    
    const announcement = announcements.find(a => a.id === announcementId);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    const poll = {
      id: Date.now().toString(),
      question,
      options: options.map(opt => ({ text: opt, votes: 0 })),
      type,
      totalVotes: 0,
      createdAt: new Date()
    };
    
    announcement.poll = poll;
    
    res.status(201).json({
      success: true,
      data: poll
    });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.post('/:id/poll/vote', authenticateToken, async (req, res) => {
  try {
    const announcementId = req.params.id;
    const userId = req.user.id;
    const { optionIndex } = req.body;
    
    const announcement = announcements.find(a => a.id === announcementId);
    if (!announcement || !announcement.poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }
    
    if (optionIndex >= announcement.poll.options.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option'
      });
    }
    
    // Initialize user poll votes if not exists
    if (!userPollVotes[userId]) {
      userPollVotes[userId] = {};
    }
    
    // Get user's previous vote for this poll
    const previousVote = userPollVotes[userId][announcementId];
    
    // If user had a previous vote, remove it from counts
    if (previousVote !== null && previousVote !== undefined) {
      announcement.poll.options[previousVote].votes = Math.max(0, announcement.poll.options[previousVote].votes - 1);
      announcement.poll.totalVotes = Math.max(0, announcement.poll.totalVotes - 1);
    }
    
    // Add new vote
    announcement.poll.options[optionIndex].votes += 1;
    announcement.poll.totalVotes += 1;
    
    // Update user's vote status
    userPollVotes[userId][announcementId] = optionIndex;
    
    res.json({
      success: true,
      data: {
        ...announcement.poll,
        userVote: optionIndex
      },
      message: 'Vote recorded successfully'
    });
  } catch (error) {
    console.error('Error voting on poll:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Interactive Announcements - RSVP
router.post('/:id/rsvp', authenticateToken, async (req, res) => {
  try {
    const announcementId = req.params.id;
    const userId = req.user.id;
    const { response } = req.body; // 'going', 'maybe', 'not_going'
    if (!['going','maybe','not_going'].includes(response)) {
      return res.status(400).json({ success: false, message: 'Invalid response' });
    }

    // Upsert user RSVP
    // Delete previous
    await supabase.from('user_rsvps').delete().eq('user_id', userId).eq('announcement_id', announcementId);
    const { error: insErr } = await supabase.from('user_rsvps').insert({ user_id: userId, announcement_id: announcementId, status: response });
    if (insErr) throw insErr;

    // Compute counts
    const statuses = ['going','maybe','not_going'];
    const counts = {};
    for (const s of statuses) {
      const { count } = await supabase
        .from('user_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('announcement_id', announcementId)
        .eq('status', s);
      counts[s] = count || 0;
    }
    const total = counts.going + counts.maybe + counts.not_going;

    // Update announcement aggregate
    const rsvp = { going: counts.going, maybe: counts.maybe, not_going: counts.not_going, total };
    await supabase.from('announcements').update({ rsvp, updated_at: new Date().toISOString() }).eq('id', announcementId);

    return res.json({ success: true, data: { ...rsvp, userResponse: response }, message: `RSVP updated to: ${response.replace('_',' ')}` });
  } catch (error) {
    console.error('Error updating RSVP:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Urgent Broadcast Routes
router.post('/urgent-broadcast', authenticateToken, async (req, res) => {
  try {
    const { title, content, urgencyLevel, broadcastType } = req.body;
    
    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }
    
    // Note: Frontend has password protection (W@Uy3*PXhmN#?Zn%5zeM) for access control
    // No admin check needed here since password protection is sufficient
    
    const id = Date.now().toString();
    const insert = {
      id,
      title,
      content,
      urgency_level: urgencyLevel || 'urgent',
      broadcast_type: broadcastType || 'safety_alert',
      is_active: true,
      author_id: req.user?.id || 'system',
      author_name: req.user?.name || 'System Administrator',
      author_role: req.user?.role || 'admin',
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase.from('urgent_broadcasts').insert(insert).select().single();
    
    if (error) {
      console.error('Supabase error creating urgent broadcast:', error);
      throw error;
    }
    
    return res.status(201).json({ 
      success: true, 
      data: {
        id: data.id,
        title: data.title,
        content: data.content,
        urgencyLevel: data.urgency_level,
        broadcastType: data.broadcast_type,
        isActive: data.is_active,
        author: {
          id: data.author_id,
          name: data.author_name,
          role: data.author_role
        },
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Error creating urgent broadcast:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to create urgent broadcast. Please try again.' 
    });
  }
});

router.get('/urgent-broadcast', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('urgent_broadcasts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ success: true, data: (data || []).map((b) => ({
      id: b.id,
      title: b.title,
      content: b.content,
      urgencyLevel: b.urgency_level,
      broadcastType: b.broadcast_type,
      isActive: b.is_active,
      author: { id: b.author_id, name: b.author_name, role: b.author_role },
      createdAt: b.created_at,
    })) });
  } catch (error) {
    console.error('Error fetching urgent broadcasts:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Lost & Found Routes
router.get('/lost-found', authenticateToken, async (req, res) => {
  try {
    const { campus, category, status } = req.query;
    const table = getLostFoundTable(campus);
    if (!table) {
      return res.status(400).json({ success: false, message: 'Invalid campus' });
    }
    let query = supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: dbItems, error } = await query;
    
    if (error) {
      console.error('Database error:', error);
      console.log('Falling back to in-memory storage for lost & found...');
      
      // Fallback to in-memory storage
      let filteredItems = lostFoundItems.filter(item => {
        if (category && item.category !== category) return false;
        if (status && item.status !== status) return false;
        return true;
      });
      
      return res.json({
        success: true,
        data: filteredItems,
        message: 'Using in-memory storage (database unavailable)'
      });
    }
    
    // Convert database format to frontend format
    const formattedItems = dbItems.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      customTags: item.custom_tags,
      photos: item.photos,
      itemType: item.item_type,
      location: item.location,
      status: item.status,
      author: {
        id: item.author_id,
        name: item.author_name,
        role: item.author_role
      },
      createdAt: new Date(item.created_at),
      expiresAt: new Date(item.expires_at)
    }));
    
    res.json({
      success: true,
      data: formattedItems
    });
  } catch (error) {
    console.error('Error fetching lost & found items:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.post('/lost-found', authenticateToken, upload.array('photos', 5), async (req, res) => {
  try {
    const { campus, title, description, category, customTags, itemType, location } = req.body;
    const table = getLostFoundTable(campus);
    if (!table) {
      return res.status(400).json({ success: false, message: 'Invalid campus' });
    }
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    let photoUrls = [];

    // Handle photo uploads if files exist
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          if ((file.size || 0) > 5 * 1024 * 1024) continue;
          // Antivirus scan (if enabled)
          const result = await scanBuffer(file.buffer, file.originalname, file.mimetype);
          if (!result.clean) {
            console.warn('AV blocked upload', { file: file.originalname, reason: result.reason });
            continue;
          }
          const fileExt = (file.originalname.split('.').pop() || '').toLowerCase();
          const fileName = `lost-found/${uuidv4()}.${fileExt}`;

          // Upload to Supabase storage
          const { error: uploadError } = await supabase.storage
            .from('nexus-lost-found')
            .upload(fileName, file.buffer, {
              contentType: file.mimetype,
            });

          if (uploadError) {
            console.error('Photo upload failed:', uploadError);
            continue; // Skip this file but continue with others
          }

          // Use signed URL (short expiry) instead of public URL
          const { data: signed } = await supabase.storage
            .from('nexus-lost-found')
            .createSignedUrl(fileName, 60 * 10);
          if (signed?.signedUrl) photoUrls.push(signed.signedUrl);
        }
      } catch (uploadErr) {
        console.error('Error uploading photos:', uploadErr);
        // Continue without photos rather than failing completely
      }
    }
    
    const itemId = Date.now().toString();
    const now = new Date();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Insert into database
    const { data: dbItem, error } = await supabase
      .from(table)
      .insert({
        id: itemId,
        title,
        description,
        category,
        custom_tags: customTags ? (typeof customTags === 'string' ? JSON.parse(customTags) : customTags) : [],
        photos: photoUrls,
        item_type: itemType,
        location,
        status: 'active',
        author_id: req.user.id,
        author_name: req.user.name,
        author_role: req.user.role,
        created_at: now,
        expires_at: expiresAt
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating lost & found item:', error);
      console.log('Falling back to in-memory storage for lost & found...');
      
      // Fallback to in-memory storage
      const newItem = {
        id: Date.now().toString(),
        title: req.body.title,
        description: req.body.description,
        category: req.body.category || 'general',
        customTags: req.body.customTags ? (typeof req.body.customTags === 'string' ? JSON.parse(req.body.customTags) : req.body.customTags) : [],
        photos: req.body.photos || [],
        itemType: req.body.itemType || 'lost',
        location: req.body.location || 'Unknown',
        status: 'active',
        author: {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role || 'student'
        },
        createdAt: new Date(),
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };
      
      lostFoundItems.push(newItem);
      
      return res.status(201).json({
        success: true,
        data: newItem,
        message: 'Lost & found item created successfully (in-memory fallback)'
      });
    }

    // Convert database format to frontend format
    const newItem = {
      id: dbItem.id,
      title: dbItem.title,
      description: dbItem.description,
      category: dbItem.category,
      customTags: dbItem.custom_tags,
      photos: dbItem.photos,
      itemType: dbItem.item_type,
      location: dbItem.location,
      status: dbItem.status,
      author: {
        id: dbItem.author_id,
        name: dbItem.author_name,
        role: dbItem.author_role
      },
      createdAt: new Date(dbItem.created_at),
      expiresAt: new Date(dbItem.expires_at)
    };
    
    res.status(201).json({
      success: true,
      data: newItem
    });
  } catch (error) {
    console.error('Error creating lost & found item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.put('/lost-found/:id/status', authenticateToken, async (req, res) => {
  try {
    const itemId = req.params.id;
    const { status } = req.body;
    
    const itemIndex = lostFoundItems.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    lostFoundItems[itemIndex].status = status;
    lostFoundItems[itemIndex].updatedAt = new Date();
    
    res.json({
      success: true,
      data: lostFoundItems[itemIndex]
    });
  } catch (error) {
    console.error('Error updating lost & found status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router; 