import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConfessionPage } from './ConfessionPage';

const CollegeConfessionWrapper: React.FC = () => {
  const { collegeId } = useParams<{ collegeId: string }>();
  const navigate = useNavigate();

  const collegeData = {
    'general': {
      name: 'General Confessions',
      fullName: 'General Confessions - All Campuses',
      color: 'from-[#F4E3B5] to-[#D4C4A8]'
    },
    'mit-adt': {
      name: 'MIT ADT',
      fullName: 'MIT ADT',
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
    // For general confessions, go back to companion instead of campus selection
    if (collegeId === 'general') {
      navigate('/companion');
    } else {
      navigate(`/campus/${collegeId}`);
    }
  };

  if (!college) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-[#18181b] to-[#27272a] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">College Not Found</h2>
          <button
            onClick={() => navigate("/campus")}
            className="px-6 py-2 bg-[#F4E3B5] text-[#18181b] rounded-lg hover:bg-[#F4E3B5]/90 transition-colors font-semibold"
          >
            Choose Campus
          </button>
        </div>
      </div>
    );
  }

  return (
    <ConfessionPage 
      onBack={handleBack} 
      universityId={collegeId}
      collegeName={college.name}
      collegeFullName={college.fullName}
    />
  );
};

export default CollegeConfessionWrapper;
