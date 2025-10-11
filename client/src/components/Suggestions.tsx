import React from 'react';

interface SuggestionsProps {
  allGroups: any[];
  joinedGroupIds: string[];
  onJoinGroup: (group: any) => void;
  joiningGroup: string | null;
  onCreatePost: () => void;
}

export default function Suggestions({ onCreatePost }: SuggestionsProps) {
  return (
    <div className="space-y-6">
      {/* Empty - All content removed */}
    </div>
  );
} 