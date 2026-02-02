import React from 'react';
import { EnhancedAnnouncementsPage } from './EnhancedAnnouncementsPage';

interface AnnouncementsDemoPageProps {
  onBack?: () => void;
}

export function AnnouncementsDemoPage({ onBack = () => console.log('Back clicked') }: Readonly<AnnouncementsDemoPageProps>) {
  const mockUser = {
    id: 'user_1',
    name: 'John Doe',
    isAdmin: true // Set to true to see admin features
  };

  return (
    <EnhancedAnnouncementsPage
      onBack={onBack}
      universityId="mit_adt"
      currentUser={mockUser}
      collegeName="MIT Arts, Design & Technology"
      collegeFullName="MIT Arts, Design & Technology University"
    />
  );
}
