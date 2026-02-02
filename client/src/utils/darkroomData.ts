// src/utils/darkroomData.ts

export interface Group {
  id: string;
  name: string;
  description: string;
  members: number;
  messages: { id?: string; alias: string; message: string; time: string }[];
  createdBy: string;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt?: string;
}

export const generateAnonymousGroups = (count = 15): Group[] => {
  const names = [
    'Confessions', 'Mental Health', 'Career Advice', 'Relationship Talk',
    'Unpopular Opinions', 'Student Struggles', 'Workplace Woes',
    'Family Drama', 'Crush Confessions', 'Dark Humor', 'Life is Hard',
    'Late Night Thoughts', 'Pet Peeves', 'First Times', 'Deep Secrets'
  ];

  const descriptions = [
    'Share your secrets and confessions anonymously',
    'A safe space to discuss mental health challenges',
    'Get honest feedback about career decisions',
    'Discuss relationship issues without judgment',
    'Share opinions that might be controversial',
    'Vent about school, exams, and academic pressure',
    'Talk freely about workplace frustrations and politics',
    'Anonymous support for family issues and conflicts',
    'Confess your feelings and romantic dilemmas',
    'A place for edgy jokes (within reason)',
    'Talk about existential thoughts and life struggles',
    'Share random deep thoughts or rants',
    'Rant about the little things that annoy you',
    'Share your "first time" stories anonymously',
    'Reveal something you\'ve never told anyone'
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `ren-${i + 1}`,
    name: names[i % names.length],
    description: descriptions[i % descriptions.length],
    members: Math.floor(Math.random() * 150) + 50,
    messages: [],
    createdBy: `user-${Math.floor(Math.random() * 100) + 1}`
  }));
}; 