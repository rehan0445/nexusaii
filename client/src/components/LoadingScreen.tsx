import React from "react";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center text-gold relative overflow-hidden">
      {/* Glowing N logo */}
      <div className="w-20 h-20 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20 mb-6 relative overflow-hidden group animate-pulse">
        <span className="text-3xl font-extrabold text-gold group-hover:scale-110 transition-transform">
          N
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0 animate-shimmer" />
      </div>

      {/* Loading Text */}
      <h2 className="text-2xl font-semibold text-white mb-2 animate-fade-in-down">
        Companion
      </h2>
      <p className="text-zinc-400 animate-fade-in-up">
        Loading your experience...
      </p>

      {/* Spinner */}
      <div className="mt-8 w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default LoadingScreen;
