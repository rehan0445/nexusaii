import React from "react";
import { Lock, Shield } from "lucide-react";

// Global, universal target: Launch date - November 9, 2025 00:00:00 UTC
// Month is 0-indexed (10 => November). Adjust here when you change the schedule.
const GLOBAL_TARGET_EPOCH_MS = Date.UTC(2025, 10, 9, 0, 0, 0);
// Start tracking from October 10, 2025 (real start date, not calculated)
const GLOBAL_START_EPOCH_MS = Date.UTC(2025, 9, 10, 0, 0, 0);

function useCountdown(targetDate: number) {
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, targetDate - now);
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { remaining, days, hours, minutes, seconds };
}

const HangoutComingSoon: React.FC = () => {
  const { remaining, days, hours, minutes, seconds } = useCountdown(GLOBAL_TARGET_EPOCH_MS);
  const totalWindow = GLOBAL_TARGET_EPOCH_MS - GLOBAL_START_EPOCH_MS;
  const timeRemaining = Math.min(100, Math.max(0, Math.round((remaining / totalWindow) * 100)));

  return (
    <div className="hangout-theme min-h-screen relative overflow-hidden">
      <div className="absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(212,175,55,0.08),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(212,175,55,0.06),transparent_40%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/90" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-8 pb-24">
        {/* floating soft-gold orbs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-softgold-500/20 blur-3xl animate-pulse" />
          <div className="absolute top-1/3 -right-10 w-52 h-52 rounded-full bg-softgold-400/20 blur-3xl animate-pulse" />
          <div className="absolute bottom-10 left-1/3 w-36 h-36 rounded-full bg-softgold-300/10 blur-3xl animate-pulse" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-softgold-400 via-softgold-500 to-softgold-600 bg-clip-text text-transparent" style={{ fontFamily: 'Rouge Script, cursive' }}>Nexus</h1>
        <h2 className="hangout-serif-title text-2xl md:text-3xl text-white/70 mb-2">presents</h2>
        <h3 className="hangout-serif-title text-3xl md:text-4xl text-white/90">Hangouts</h3>

        <div className="mt-8 grid grid-cols-4 gap-3">
          {[
            { label: 'Days', value: days },
            { label: 'Hours', value: hours },
            { label: 'Minutes', value: minutes },
            { label: 'Seconds', value: seconds },
          ].map((item) => (
            <div key={item.label} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl px-4 py-3 md:px-6 md:py-4 min-w-[70px]">
              <div className="text-2xl md:text-3xl font-semibold text-softgold-400 tabular-nums">
                {String(item.value).padStart(2, '0')}
              </div>
              <div className="text-xs md:text-sm text-white/60 mt-1">{item.label}</div>
            </div>
          ))}
        </div>

         {/* countdown progress bar (right to left) */}
         <div className="mt-6 w-full max-w-md">
           <div className="flex items-center justify-between text-white/60 text-xs mb-2">
             <span>Time Remaining</span>
             <span className="text-white/70">{timeRemaining}%</span>
           </div>
           <div className="h-2 rounded-full bg-white/10 overflow-hidden flex justify-end">
             <div className="h-full bg-gradient-to-l from-softgold-500 via-softgold-400 to-softgold-300" style={{ width: `${timeRemaining}%` }} />
           </div>
         </div>

        <div className="mt-8 flex items-center gap-3">
          <div className="h-px w-12 bg-gradient-to-r from-transparent via-softgold-500/60 to-transparent" />
          <span className="text-white font-bold text-base">COMING SOON</span>
          <div className="h-px w-12 bg-gradient-to-r from-transparent via-softgold-500/60 to-transparent" />
        </div>

        {/* Why Choose Nexus Hangouts */}
        <div className="mt-12 w-full max-w-3xl">
          <h4 className="hangout-serif-title text-2xl md:text-3xl text-white/90 mb-6">Why Choose Nexus Hangouts?</h4>
          <div className="space-y-4">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-softgold-500/10 border border-softgold-500/30 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-softgold-400" />
              </div>
              <div className="text-left flex-1">
                <div className="text-white font-semibold text-base mb-1">End-to-End Encrypted</div>
                <div className="text-white/60 text-sm">Not fake encryption like WhatsApp — real, unbreakable privacy for your conversations.</div>
              </div>
            </div>

            {[
              { title: 'Movie Lounge', locked: true },
              { title: 'Nexus Games', locked: true },
              { title: 'Nexus Showdown', locked: true },
              { title: 'Nexus Arena', locked: true },
            ].map((feature) => (
              <div key={feature.title} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                <div className="flex-1 text-left">
                  <div className="text-white/80 font-medium text-base">{feature.title}</div>
                  <div className="text-white/50 text-xs mt-1">Coming Soon</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-softgold-400">
                  <Lock className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HangoutComingSoon;


