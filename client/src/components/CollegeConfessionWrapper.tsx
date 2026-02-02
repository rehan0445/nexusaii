import React from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { PhoenixConfessionFeed } from './PhoenixConfessionFeed';

const VALID_CONFESSION_COLLEGE = 'general';

const CollegeConfessionWrapper: React.FC = () => {
  const { collegeId } = useParams<{ collegeId: string }>();
  const navigate = useNavigate();

  // Disable non-general campus confessions - redirect to only valid route
  if (collegeId && collegeId !== VALID_CONFESSION_COLLEGE) {
    return <Navigate to="/campus/general/confessions" replace />;
  }

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
    navigate('/companion');
  };

  if (!college) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-[#18181b] to-[#27272a] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">College Not Found</h2>
          <button
            onClick={() => navigate("/campus/general/confessions")}
            className="px-6 py-2 bg-[#F4E3B5] text-[#18181b] rounded-lg hover:bg-[#F4E3B5]/90 transition-colors font-semibold"
          >
            Back to Confessions
          </button>
        </div>
      </div>
    );
  }

  // Save scroll position before navigation (if onConfessionClick is ever used)
  const handleConfessionClick = (confession: any) => {
    const confessionId = confession.id || confession.confession_id || confession._id;
    if (confessionId) {
      // Save scroll position before navigating
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      try {
        sessionStorage.setItem('phoenix_confession_feed_scroll', scrollY.toString());
        sessionStorage.setItem('phoenix_confession_feed_clicked_id', confessionId);
      } catch (e) {
        // Ignore storage errors
      }
      navigate(`/campus/general/confessions/${confessionId}`);
    }
  };

  return (
    <PhoenixConfessionFeed 
      onConfessionClick={handleConfessionClick}
    />
  );
};

export default CollegeConfessionWrapper;
