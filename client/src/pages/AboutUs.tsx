import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Users, Mail } from 'lucide-react';

const slideFromTopKeyframes = `
  @keyframes aboutUsSlideFromTop {
    from {
      transform: translateY(-100%);
      opacity: 0.98;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <>
      <style>{slideFromTopKeyframes}</style>
      <div
        className="fixed inset-0 z-[100] text-white overflow-y-auto overflow-x-hidden"
        style={{
          background: 'linear-gradient(180deg, #0a0a12 0%, #120a18 30%, #0d0a14 60%, #0a0a12 100%)',
          animation: 'aboutUsSlideFromTop 0.4s ease-out forwards',
          transformOrigin: 'top',
        }}
      >
      {/* Animated starfield/nebula background */}
      <div
        className="fixed inset-0 opacity-40 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
        }}
      />
      <div
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 80% 90%, rgba(139, 69, 219, 0.12) 0%, transparent 50%)',
        }}
      />
      {/* Subtle stars effect */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(1px 1px at 20px 30px, white, transparent),
                            radial-gradient(1px 1px at 40px 70px, white, transparent),
                            radial-gradient(1px 1px at 50px 160px, white, transparent),
                            radial-gradient(1px 1px at 90px 40px, white, transparent),
                            radial-gradient(1px 1px at 130px 80px, white, transparent),
                            radial-gradient(1px 1px at 160px 120px, white, transparent),
                            radial-gradient(1px 1px at 200px 50px, white, transparent),
                            radial-gradient(1px 1px at 250px 180px, white, transparent),
                            radial-gradient(1px 1px at 300px 90px, white, transparent),
                            radial-gradient(1px 1px at 350px 200px, white, transparent)`,
          backgroundSize: '400px 250px',
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-white">Nexus</span>
            <span className="text-[#A855F7]">chat.in</span>
          </h1>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 pb-32 space-y-16">
        {/* === HERO: About Nexus === */}
        <section className="text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            About Nexus
          </h2>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Nexus is an{' '}
            <span className="font-semibold text-[#A855F7]">anonymous emotional companionship</span>{' '}
            platform for people who just want someone to talk to.
          </p>
          <div className="bg-[#1a1a2e]/60 border border-white/10 rounded-2xl p-6 md:p-8 max-w-2xl mx-auto backdrop-blur-sm">
            <p className="text-white/80 leading-relaxed">
              In a world where being vulnerable often feels unsafe, Nexus exists to give you a quiet space—free from judgment, identity, or pressure—where your thoughts are heard, not measured.
            </p>
            <p className="text-white/80 leading-relaxed mt-4">
              Our aim is to build a{' '}
              <span className="font-semibold text-white">fully anonymous emotional ecosystem</span>, evolving our platform through{' '}
              <span className="text-[#A855F7]">Nexus Phase 2</span> and{' '}
              <span className="text-[#A855F7]">Phase 3</span> over the coming years.
            </p>
          </div>
        </section>

        {/* === Different Ways to Not Feel Alone === */}
        <section className="space-y-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-white">
            Different Ways to Not Feel Alone
          </h2>
          <p className="text-center text-white/70 max-w-xl mx-auto">
            Nexus offers 2 core experiences, allowing you to choose the level of connection that feels right for you:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Companion */}
            <div className="bg-[#1a1a2e]/60 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-[#A855F7]/30 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#A855F7]/30 to-[#9333EA]/30 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-[#A855F7]" />
                </div>
                <h3 className="text-xl font-bold text-white">Companion</h3>
              </div>
              <p className="text-white/70 leading-relaxed">
                Engage in supportive conversations with empathetic AI characters, designed for instant, judgment-free interaction whenever you need it. No pressure. No expectations. Just presence.
              </p>
            </div>
            {/* Feed */}
            <div className="bg-[#1a1a2e]/60 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-[#A855F7]/30 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#A855F7]/30 to-[#9333EA]/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#A855F7]" />
                </div>
                <h3 className="text-xl font-bold text-white">Feed</h3>
              </div>
              <p className="text-white/70 leading-relaxed">
                Connect with{' '}
                <span className="underline decoration-[#A855F7]/50">anonymous</span>, real people in real-time. Share thoughts and feelings without fear of identity or judgment, fostering genuine, fleeting connections.
              </p>
            </div>
          </div>
        </section>

        {/* === Our Growth === */}
        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Our Growth</h2>
            <p className="text-white/70 mt-2">What started as an idea quickly became a movement:</p>
          </div>
          {/* Bar chart: 3k (shortest), 17k (middle), 40k+ (tallest) — number just above each bar */}
          <div className="bg-[#1a1a2e]/60 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            <div className="flex items-end justify-center gap-6 md:gap-10">
              <div className="flex flex-col items-center flex-1 max-w-[120px]">
                <div className="w-full h-40 flex flex-col justify-end" style={{ minHeight: '160px' }}>
                  <span className="text-white font-bold text-sm md:text-base mb-0.5 text-center">3,000</span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#A855F7]/80 to-[#A855F7] min-h-[8px] transition-all duration-700"
                    style={{ height: '7.5%' }}
                    aria-hidden
                  />
                </div>
                <span className="text-[#A855F7] text-xs font-medium mt-2">1st Month</span>
              </div>
              <div className="flex flex-col items-center flex-1 max-w-[120px]">
                <div className="w-full h-40 flex flex-col justify-end" style={{ minHeight: '160px' }}>
                  <span className="text-white font-bold text-sm md:text-base mb-0.5 text-center">17,000</span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#A855F7]/80 to-[#A855F7] min-h-[8px] transition-all duration-700"
                    style={{ height: '42.5%' }}
                    aria-hidden
                  />
                </div>
                <span className="text-[#A855F7] text-xs font-medium mt-2">2nd Month</span>
              </div>
              <div className="flex flex-col items-center flex-1 max-w-[120px]">
                <div className="w-full h-40 flex flex-col justify-end" style={{ minHeight: '160px' }}>
                  <span className="text-white font-bold text-sm md:text-base mb-0.5 text-center">40,000+</span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#A855F7]/80 to-[#A855F7] min-h-[8px] transition-all duration-700"
                    style={{ height: '100%' }}
                    aria-hidden
                  />
                </div>
                <span className="text-[#A855F7] text-xs font-medium mt-2">3rd Month</span>
              </div>
            </div>
            <p className="text-center text-white/60 text-xs mt-4">Users over time</p>
          </div>
          <div className="bg-[#1a1a2e]/60 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-sm">
            <p className="text-white/80 leading-relaxed">
              Over{' '}
              <span className="text-[#A855F7] font-bold text-xl">50,000+</span>{' '}
              companion chats have already been initiated—each one representing a moment where someone chose not to stay silent.
            </p>
          </div>
        </section>

        {/* === Our Advisor & Mentor === */}
        <section className="space-y-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-white">
            Our Advisor & Mentor
          </h2>
          <div className="bg-[#1a1a2e]/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="md:flex">
              <div className="md:w-2/5 aspect-[4/3] md:aspect-auto">
                <img
                  src="/assets/shrikant-gunjar.png"
                  alt="Shrikant Gunjar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 md:p-8 md:w-3/5 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-white mb-1">Shrikant Gunjar</h3>
                <div className="space-y-1 mb-4">
                  <p className="text-[#A855F7] text-sm font-medium">Vice Principal – MIT ADT, Pune</p>
                  <p className="text-[#A855F7] text-sm font-medium">Chairperson – Indo-Japan Business Council</p>
                </div>
                <p className="text-white/70 leading-relaxed">
                  Shrikant Gunjar provides vital guidance with experience in business development and supports us as a trusted advisor. He offers insights that shape our strategic direction and help us deliver value to our community.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* === About Founder === */}
        <section className="space-y-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-white">
            About the Founder
          </h2>
          <div className="bg-[#1a1a2e]/60 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#A855F7] to-[#9333EA] flex items-center justify-center text-3xl font-bold text-white mb-4">
                R
              </div>
              <h3 className="text-2xl font-bold text-white">Rehan Surani</h3>
              <p className="text-[#A855F7] text-sm font-medium mb-4">Founder & Developer</p>
              <p className="text-white/70 leading-relaxed max-w-xl">
                A third-year engineering student from a tier-2 college who believes the best solutions come from truly understanding people's pain. After failing in 2 major startups taught him resilience, he built Nexus—a safe space where{' '}
                <span className="text-white font-medium">40,000+ students</span> can finally be honest without fear.
              </p>
              <p className="text-white/70 leading-relaxed mt-4 max-w-xl">
                Our aim is to create an emotional anonymous ecosystem with{' '}
                <span className="text-[#A855F7]">Nexus Phase 2</span> and{' '}
                <span className="text-[#A855F7]">Phase 3</span> in the following years.
              </p>
            </div>
          </div>
        </section>

        {/* === Contact Us === */}
        <section className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-white">
            Contact Us
          </h2>
          <div className="bg-[#1a1a2e]/60 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-sm">
            <p className="text-white/70 mb-4">Have questions, feedback, or just want to say hi?</p>
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=nexusschats@gmail.com&su=Hello%20from%20Nexus%20User"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#A855F7] hover:bg-[#9333EA] text-white font-medium transition-colors"
            >
              <Mail className="w-5 h-5" />
              nexusschats@gmail.com
            </a>
          </div>
        </section>

        {/* Footer tagline */}
        <div className="text-center pt-8">
          <p className="text-white/50 text-sm">
            This space exists because of you.
          </p>
        </div>
      </main>
    </div>
    </>
  );
}
