import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EnhancedAnnouncementsPage as AnnouncementsPage } from './EnhancedAnnouncementsPage';

const CollegeAnnouncementsWrapper: React.FC = () => {
  const { collegeId } = useParams<{ collegeId: string }>();
  const navigate = useNavigate();

  const collegeData = {
    'mit-adt': {
      name: 'MIT Arts, Design & Technology',
      fullName: 'MIT Arts, Design & Technology University',
      color: 'from-blue-600 to-purple-600'
    },
    'mit-wpu': {
      name: 'MIT WPU',
      fullName: 'MIT World Peace University',
      color: 'from-emerald-600 to-blue-600'
    },
    'vit-vellore': {
      name: 'VIT Vellore',
      fullName: 'Vellore Institute of Technology',
      color: 'from-orange-600 to-red-600'
    },
    'parul-university': {
      name: 'Parul University',
      fullName: 'Parul University',
      color: 'from-green-600 to-teal-600'
    },
    'iist': {
      name: 'IIST',
      fullName: 'Indore Institute of Technology',
      color: 'from-indigo-600 to-purple-600'
    }
  };

  const college = collegeId ? collegeData[collegeId as keyof typeof collegeData] : null;

  const handleBack = () => {
    navigate("/campus/general/confessions");
  };

  const currentUser = {
    id: "me",
    name: "Student",
    isAdmin: true // Set to true to see all new admin features including urgent broadcasts
  };

  if (!college) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">College Not Found</h2>
          <button
            onClick={() => navigate("/campus/general/confessions")}
            className="px-6 py-2 bg-[#F4E3B5] text-[#18181b] rounded-lg hover:bg-[#F4E3B5]/90 transition-colors font-semibold"
          >
            Choose Campus
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnnouncementsPage 
      onBack={handleBack} 
      universityId={collegeId}
      currentUser={currentUser}
      collegeName={college.name}
      collegeFullName={college.fullName}
    />
  );
};

export default CollegeAnnouncementsWrapper;
