import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  'https://zmuhcwryfdmuadfrzcfq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdWhjd3J5ZmRtdWFkZnJ6Y2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTk1OTgsImV4cCI6MjA2NTAzNTU5OH0.FOntHG3mvvsPBJCq023vFnYgecwGoRn27rDOwf9ZU_k'
);

// Existing announcements data (from the original file)
const existingAnnouncements = [
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
    hasThreads: false,
    poll: null,
    rsvp: null,
    eventDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
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
    likes: 28,
    reactions: {
      '👍': 12,
      '📚': 8,
      '👀': 5,
      '❤️': 3
    },
    author: {
      id: 'admin_2',
      name: 'Library Admin',
      role: 'admin'
    },
    hasThreads: false,
    poll: null,
    rsvp: null,
    eventDate: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
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
    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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

async function migrateAnnouncements() {
  try {
    console.log('🚀 Migrating existing announcements to database...');
    
    for (const announcement of existingAnnouncements) {
      console.log(`📝 Migrating announcement: ${announcement.title}`);
      
      const { error } = await supabase
        .from('announcements')
        .insert({
          id: announcement.id,
          title: announcement.title,
          content: announcement.content,
          category: announcement.category,
          priority: announcement.priority,
          target_audience: announcement.targetAudience,
          campus: announcement.campus,
          department: announcement.department,
          scheduled_for: announcement.scheduledFor,
          expires_at: announcement.expiresAt,
          attachments: announcement.attachments,
          is_active: announcement.isActive,
          requires_acknowledgment: announcement.requiresAcknowledgment,
          tags: announcement.tags,
          is_pinned: announcement.isPinned,
          likes: announcement.likes,
          reactions: announcement.reactions,
          author_id: announcement.author.id,
          author_name: announcement.author.name,
          author_role: announcement.author.role,
          has_threads: announcement.hasThreads,
          poll: announcement.poll,
          rsvp: announcement.rsvp,
          event_date: announcement.eventDate,
          created_at: announcement.createdAt,
          updated_at: announcement.updatedAt
        });
      
      if (error) {
        console.log(`⚠️  Failed to migrate ${announcement.title}: ${error.message}`);
      } else {
        console.log(`✅ Successfully migrated: ${announcement.title}`);
      }
    }
    
    console.log('\n🎉 Announcement migration completed!');
    
  } catch (error) {
    console.error('❌ Error migrating announcements:', error);
    process.exit(1);
  }
}

// Run the migration
migrateAnnouncements();
