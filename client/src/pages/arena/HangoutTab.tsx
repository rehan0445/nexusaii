import React from "react";
import HangoutComingSoon from "./HangoutComingSoon";

const HangoutTab: React.FC = () => {
  return (
    <div className="hangout-theme min-h-screen text-white relative overflow-hidden">
      {/* Coming Soon Experience (keep deep routes active elsewhere) */}
      <HangoutComingSoon />
    </div>
  );
};

export default HangoutTab;
