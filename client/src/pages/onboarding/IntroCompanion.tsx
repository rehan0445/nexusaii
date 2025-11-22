import React from 'react';
import OnboardingSlide from '../../components/OnboardingSlide';
import companionImage from '../../assets/intro/companion.png';

const IntroCompanion: React.FC = () => (
  <OnboardingSlide
    imageUrl={companionImage}
    title="Companions"
    subtitle="From conversations to companionship."
    index={2}
    total={5}
    nextPath="/onboarding/campus"
    prevPath="/onboarding/intro"
    titleStyle={{ fontFamily: 'EB Garamond, serif' }}
    subtitleStyle={{ fontFamily: 'Neue Haas Grotesk Text, Inter, system-ui, sans-serif' }}
    routes={["/onboarding/intro", "/onboarding/companion", "/onboarding/campus", "/onboarding/darkroom", "/onboarding/hangout"]}
  />
);

export default IntroCompanion;


