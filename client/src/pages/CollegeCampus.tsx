import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';

const VALID_CONFESSION_COLLEGE = 'general';

const CollegeCampus: React.FC = () => {
  const navigate = useNavigate();
  const { collegeId } = useParams<{ collegeId: string }>();
  const { isDesktop } = useResponsive();

  const collegeData = {
    'general': {
      name: 'General Confessions',
      fullName: 'General Confessions - All Campuses',
      color: 'from-[#F4E3B5] to-[#D4C4A8]',
      image: 'https://i.pinimg.com/736x/8b/5a/46/8b5a46c4c4c4c4c4c4c4c4c4c4c4c4c4.jpg'
    },
    'mit-adt': {
      name: 'MIT Arts , Design & Technology',
      fullName: 'MIT Arts , Design & Technology',
      color: 'from-blue-600 to-purple-600',
      image: 'https://i.pinimg.com/736x/bb/49/7e/bb497ee41c472c9d831a7cde9876e6c9.jpg'
    },
    'mit-wpu': {
      name: 'MIT WPU',
      fullName: 'MIT World Peace University',
      color: 'from-emerald-600 to-blue-600',
      image: 'https://i.pinimg.com/736x/bb/49/7e/bb497ee41c472c9d831a7cde9876e6c9.jpg'
    },
    'vit-vellore': {
      name: 'VIT Vellore',
      fullName: 'Vellore Institute of Technology',
      color: 'from-orange-600 to-red-600',
      image: 'https://i.pinimg.com/1200x/de/ba/db/debadbd74493e0a61839a12d7dee48d9.jpg'
    },
    'parul-university': {
      name: 'Parul University',
      fullName: 'Parul University',
      color: 'from-green-600 to-teal-600',
      image: 'https://i.pinimg.com/736x/40/b7/bd/40b7bddc3c79546f2d19da84f4ef6b42.jpg'
    },
    'iist': {
      name: 'IIST',
      fullName: 'Indore Institute of Technology',
      color: 'from-indigo-600 to-purple-600',
      image: 'https://i.pinimg.com/736x/f4/b6/fe/f4b6fe3e6d0af5f2b3930c4ed17e4dd8.jpg'
    }
  };

  const college = collegeId ? collegeData[collegeId as keyof typeof collegeData] : null;

  // Disable non-general campus - only general confessions route is valid
  React.useEffect(() => {
    if (collegeId && collegeId !== VALID_CONFESSION_COLLEGE) {
      navigate("/campus/general/confessions", { replace: true });
      return;
    }
    if (!college) {
      navigate("/campus/general/confessions", { replace: true });
    }
  }, [college, collegeId, navigate]);

  // Redirect non-general or invalid college
  if (collegeId && collegeId !== VALID_CONFESSION_COLLEGE) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-[#F4E3B5] to-[#F4E3B5] rounded-full animate-pulse mb-4 mx-auto" />
          <p className="text-[#a1a1aa] font-medium">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (!college) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-[#F4E3B5] to-[#F4E3B5] rounded-full animate-pulse mb-4 mx-auto"></div>
          <p className="text-[#a1a1aa] font-medium">Redirecting to campus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="campus-theme h-screen relative overflow-hidden bg-zinc-900">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: `url(${college.image})`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />

      {/* Header */}
      <header className="relative z-50 border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-md">
        <div className="w-full px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/campus/general/confessions")}
              className="flex-shrink-0 text-softgold-500 hover:text-softgold-500 transition-colors mr-3">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center min-w-0">
              <h1 className={`serif-title ${isDesktop ? 'text-3xl' : 'text-xl sm:text-2xl'} font-semibold text-white tracking-tight truncate`}>{college.name}</h1>
              <p className={`text-softgold-500 ${isDesktop ? 'text-lg' : 'text-sm sm:text-base'} font-medium mt-1 truncate`}>{college.fullName}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col justify-center h-full py-8">
        {/* Welcome Text */}
        <div className={`text-center ${isDesktop ? 'mb-20' : 'mb-12 sm:mb-16'} px-4 sm:px-6`}>
          <h2 className={`${isDesktop ? 'text-4xl' : 'text-2xl sm:text-3xl'} font-medium text-white`}>
            Welcome to {college.name}
          </h2>
        </div>

        {/* Sophisticated Card-Based Design */}
        <div className="flex items-center justify-center px-4 sm:px-6">
          <div className={`grid grid-cols-2 ${isDesktop ? 'gap-12 max-w-4xl' : 'gap-6 sm:gap-10 max-w-5xl'} mx-auto w-full`}>

            {/* Announcements Card */}
            <button
              onClick={() => navigate(`/campus/${collegeId}/announcements`)}
              className={`group relative bg-gradient-to-br from-[#00C9A7]/90 to-[#92FE9D]/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 ${isDesktop ? 'md:p-12 min-h-[240px]' : 'min-h-[160px] sm:min-h-[180px]'} cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-[#00C9A7]/30 transition-all duration-500 border border-[#00C9A7]/30 hover:border-[#92FE9D]/50 focus:outline-none focus:ring-4 focus:ring-[#00C9A7]/50 overflow-hidden flex items-center justify-center`}
              aria-label="View campus announcements and updates"
            >
              <div className="text-center">
                <h3 className={`${isDesktop ? 'text-4xl' : 'text-xl sm:text-2xl lg:text-3xl'} font-bold text-white`}>
                  Announcements
                </h3>
              </div>
            </button>

            {/* Confessions Card */}
            <button
              onClick={() => navigate(`/campus/${collegeId}/confessions`)}
              className={`group relative bg-gradient-to-br from-[#C471ED]/90 to-[#F64F59]/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 ${isDesktop ? 'md:p-12 min-h-[240px]' : 'min-h-[160px] sm:min-h-[180px]'} cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-[#C471ED]/30 transition-all duration-500 border border-[#C471ED]/30 hover:border-[#F64F59]/50 focus:outline-none focus:ring-4 focus:ring-[#C471ED]/50 overflow-hidden flex items-center justify-center`}
              aria-label="View anonymous confessions and thoughts"
            >
              <div className="text-center">
                <h3 className={`${isDesktop ? 'text-4xl' : 'text-xl sm:text-2xl lg:text-3xl'} font-bold text-white`}>
                  Confessions
                </h3>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeCampus;
