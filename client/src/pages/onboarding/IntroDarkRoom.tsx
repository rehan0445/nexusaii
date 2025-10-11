import React from 'react';
import OnboardingSlide from '../../components/OnboardingSlide';

const IntroDarkRoom: React.FC = () => (
  <OnboardingSlide
    imageUrl={"/assets/intro/darkroom.png"}
    title="Dark Room"
    subtitle="End‑to‑end encrypted, identity-safe conversations."
    index={4}
    total={5}
    nextPath="/onboarding/hangout"
    titleStyle={{ fontFamily: 'EB Garamond, serif' }}
    subtitleStyle={{ fontFamily: 'Neue Haas Grotesk Text, Inter, system-ui, sans-serif' }}
    routes={["/onboarding", "/onboarding/companion", "/onboarding/campus", "/onboarding/darkroom", "/onboarding/hangout"]}
  />
);

export default IntroDarkRoom;


