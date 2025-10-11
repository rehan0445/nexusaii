import React from 'react';
import { PageHeader } from './PageHeader';

interface AnnouncementsPageTestProps {
  onBack: () => void;
  universityId: string;
  currentUser: {
    id: string;
    name: string;
  };
}

export function AnnouncementsPageComplete({ onBack, universityId, currentUser }: AnnouncementsPageTestProps) {
  const collegeName = "MIT Arts, Design & Technology";
  
  const handleSearch = (query: string) => {
    console.log('Search:', query);
  };

  const handleFilter = (filters: { categories: string[]; tags: string[] }) => {
    console.log('Filter:', filters);
  };

  const recentSearches = [
    'Tech Fest 2024',
    'Mid-Semester Exams',
    'Placement Drive'
  ];

  const filterCategories = [
    { id: 'events', name: 'Events', count: 12 },
    { id: 'exams', name: 'Exams', count: 8 },
    { id: 'clubs', name: 'Clubs', count: 15 }
  ];

  return (
    <div className="min-h-screen bg-black">
      <PageHeader
        title="Announcements"
        subtitle={collegeName}
        onBack={onBack}
        onSearch={handleSearch}
        onFilter={handleFilter}
        recentSearches={recentSearches}
        filterCategories={filterCategories}
        searchPlaceholder="Search announcements..."
        filterTitle="Filter Announcements"
      />

      <div className="px-4 py-4">
        <main className="py-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-white mb-2">Test Page</h3>
            <p className="text-[#a1a1aa]">This is a test page to verify the header works correctly.</p>
          </div>
        </main>
      </div>

    </div>
  );
}
