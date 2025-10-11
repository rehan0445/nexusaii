import React from 'react';
import OnboardingSlide from '../../components/OnboardingSlide';

const IntroCompanion: React.FC = () => (
  <OnboardingSlide
    imageUrl={"/assets/intro/companion.png"}
    title="Companions"
    subtitle="From conversations to companionship."
    index={2}
    total={5}
    nextPath="/onboarding/campus"
    titleStyle={{ fontFamily: 'EB Garamond, serif' }}
    subtitleStyle={{ fontFamily: 'Neue Haas Grotesk Text, Inter, system-ui, sans-serif' }}
    routes={["/onboarding", "/onboarding/companion", "/onboarding/campus", "/onboarding/darkroom", "/onboarding/hangout"]}
  />
);

export default IntroCompanion;


