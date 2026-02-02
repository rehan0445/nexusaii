import React from 'react';
import { Rocket } from 'lucide-react';

interface CommunityMilestoneProps {
  /** Optional: compact variant for carousel (e.g. same height as character cards) */
  variant?: 'default' | 'compact';
}

export function CommunityMilestone({ variant = 'default' }: CommunityMilestoneProps) {
  const isCompact = variant === 'compact';

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-white/10"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 40%, #0d0d1a 100%)',
        boxShadow: 'inset 0 0 80px rgba(168, 85, 247, 0.08), 0 0 40px rgba(168, 85, 247, 0.1)',
      }}
    >
      {/* Subtle purple glow / nebula effect */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(168, 85, 247, 0.25) 0%, transparent 50%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(ellipse 60% 80% at 80% 80%, rgba(147, 51, 234, 0.2) 0%, transparent 50%)',
        }}
      />

      <div className={`relative z-10 p-6 md:p-8 ${isCompact ? 'py-6' : 'py-8 md:py-10'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Rocket className="w-4 h-4 text-red-500 flex-shrink-0" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
            Community Milestone
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#A855F7] drop-shadow-lg mb-1">
          40,000+ voices
        </h2>
        <p className="text-white/90 text-sm md:text-base mb-3">in just 3 months</p>
        <p className="text-white/80 text-sm md:text-base mb-6 max-w-xl">
          Thank you for trusting Nexus with your thoughts. This space exists because of you.
        </p>
        <span className="inline-block px-5 py-2.5 rounded-lg border-2 border-white/80 text-white font-medium text-sm">
          Be part of the next milestone
        </span>
      </div>
    </div>
  );
}
