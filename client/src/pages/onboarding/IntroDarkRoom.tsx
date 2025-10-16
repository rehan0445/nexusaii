import React from 'react';
import OnboardingSlide from '../../components/OnboardingSlide';
import darkroomImage from '../../assets/intro/darkroom.png';

const IntroDarkRoom: React.FC = () => (
  <OnboardingSlide
    imageUrl={darkroomImage}
    title="Dark Room"
    subtitle="End‑to‑end encrypted, identity-safe conversations."
    index={4}
    total={5}
    nextPath="/onboarding/hangout"
    prevPath="/onboarding/campus"
    titleStyle={{ fontFamily: 'EB Garamond, serif' }}
    subtitleStyle={{ fontFamily: 'Neue Haas Grotesk Text, Inter, system-ui, sans-serif' }}
    routes={["/onboarding/intro", "/onboarding/companion", "/onboarding/campus", "/onboarding/darkroom", "/onboarding/hangout"]}
  />
);

export default IntroDarkRoom;


