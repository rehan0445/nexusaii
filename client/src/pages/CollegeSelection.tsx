import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';

const CollegeSelection: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { isDesktop } = useResponsive();

  const colleges = [
    {
      id: 'mit-adt',
      name: 'MIT ADT',
      fullName: 'MIT - Arts, Design and Tech',
      image: 'https://i.pinimg.com/736x/bb/49/7e/bb497ee41c472c9d831a7cde9876e6c9.jpg',
      color: 'from-blue-600 to-purple-600'
    },
    {
      id: 'mit-wpu',
      name: 'MIT WPU',
      fullName: 'MIT - World Peace University',
      image: 'https://i.pinimg.com/736x/a0/17/18/a01718eae19faeba3ba3f225f371abdd.jpg',
      color: 'from-emerald-600 to-blue-600'
    },
    {
      id: 'vit-vellore',
      name: 'VIT Vellore',
      fullName: 'Vellore Institute of Technology',
      image: 'https://i.pinimg.com/1200x/de/ba/db/debadbd74493e0a61839a12d7dee48d9.jpg',
      color: 'from-orange-600 to-red-600'
    },
    {
      id: 'parul-university',
      name: 'Parul University',
      fullName: 'Parul University',
      image: 'https://i.pinimg.com/736x/7e/3f/1c/7e3f1c8b9a2d5e7f8c9b3a1d6e8f9c2a.jpg',
      color: 'from-green-600 to-teal-600'
    },
    {
      id: 'iict',
      name: 'IICT',
      fullName: 'International Institute of Computer Technology',
      image: 'https://i.pinimg.com/736x/9b/6d/4f/9b6d4f2e8c7a1b9d5e3f8c2a7b1e9f4c.jpg',
      color: 'from-indigo-600 to-purple-600'
    }
  ];

  const handleCollegeClick = (collegeId: string) => {
    setSelectedCollege(collegeId);
    setIsAnimating(true);
    
    setTimeout(() => {
      navigate(`/campus/${collegeId}`);
    }, 800);
  };

  return (
    <div className="campus-theme min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-softgold-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-softgold-500/3 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header with Glassmorphism */}
      <header className="relative z-50 border-b border-zinc-700/30 bg-zinc-900/20 backdrop-blur-xl">
        <div className="w-full px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-softgold-400 via-softgold-500 to-softgold-600 bg-clip-text text-transparent" style={{ fontFamily: 'Rouge Script, cursive' }}>Nexus</h1>
            </div>

            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative z-10 pt-8 pb-12 px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="serif-title text-4xl sm:text-5xl lg:text-6xl font-semibold text-white tracking-tight">
            Choose Campus
          </h2>
        </div>

        {/* College Cards */}
        <div className={`${isDesktop ? 'max-w-[1400px]' : 'max-w-6xl'} mx-auto`}>
          <div className={`grid ${isDesktop ? 'grid-cols-5' : 'grid-cols-1 sm:grid-cols-2'} ${isDesktop ? 'gap-4' : 'gap-8'}`}>
            {colleges.map((college, index) => (
              <button
                key={college.id}
                onClick={() => handleCollegeClick(college.id)}
                onKeyDown={(e) => e.key === 'Enter' && handleCollegeClick(college.id)}
                className={`group relative transition-all duration-700 text-left ${
                  selectedCollege === college.id ? 'scale-105 z-20' : ''
                } ${isAnimating ? 'scale-95 opacity-50' : 'hover:scale-105'}`}
              >
                {/* Main Card */}
                <div className="relative bg-zinc-800/40 backdrop-blur-xl rounded-3xl overflow-hidden border-2 border-[#F4E3B5]/40 group-hover:border-[#F4E3B5]/80 transition-all duration-500">
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-softgold-500/0 via-softgold-500/5 to-softgold-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Image Section */}
                  <div className={`relative ${isDesktop ? 'h-40' : 'h-64 sm:h-72'} overflow-hidden`}>
                    <img
                      src={college.image}
                      alt={college.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${college.color} opacity-40 group-hover:opacity-60 transition-opacity duration-500`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/40 to-transparent" />
                  </div>

                  {/* Content Section */}
                  <div className={`${isDesktop ? 'p-3' : 'p-8'}`}>
                    <div className={`text-center ${isDesktop ? 'mb-3' : 'mb-8'}`}>
                      <h3 className={`serif-title ${isDesktop ? 'text-xl' : 'text-4xl'} font-semibold text-white group-hover:text-softgold-500 transition-colors duration-300`}>
                        {college.name}
                      </h3>
                      <p className={`text-white/80 ${isDesktop ? 'text-[10px] leading-tight' : 'text-sm'} mt-1 font-medium ${isDesktop ? 'line-clamp-2' : ''}`}>
                        {college.fullName}
                      </p>
                    </div>
                    
                    {/* Action Button */}
                    <div className="relative">
                      <div 
                        className={`w-full bg-gradient-to-r from-softgold-500 to-softgold-500 hover:from-softgold-500 hover:to-softgold-300 text-zinc-900 ${isDesktop ? 'py-1.5 text-xs' : 'py-4 text-lg'} rounded-2xl font-bold transition-all duration-300 transform group-hover:translate-y-[-2px] border-2 border-[#F4E3B5] hover:border-[#F1DEAB] cursor-pointer`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCollegeClick(college.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            handleCollegeClick(college.id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        {selectedCollege === college.id ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className={`${isDesktop ? 'w-3 h-3' : 'w-5 h-5'} border-2 border-zinc-900 border-t-transparent rounded-full animate-spin`}></div>
                            <span>{isDesktop ? 'Entering...' : 'Entering Campus...'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <Sparkles className={`${isDesktop ? 'w-3 h-3' : 'w-5 h-5'}`} />
                            <span>{isDesktop ? 'Explore' : 'Explore Campus'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-softgold-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 animate-bounce delay-100"></div>
                <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 animate-bounce delay-300"></div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isAnimating && (
        <div className="fixed inset-0 bg-zinc-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 border-4 border-softgold-500/20 border-t-softgold-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-20 h-20 bg-softgold-500/10 rounded-full animate-pulse"></div>
            </div>
            <p className="text-white text-xl font-medium">Preparing your campus experience...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeSelection;
