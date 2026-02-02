import React from 'react';
import OnboardingSlide from '../../components/OnboardingSlide';
import nexusImage from '../../assets/intro/nexus.jpg';

const IntroNexus: React.FC = () => {
  return (
    <OnboardingSlide
      imageUrl={nexusImage}
      title="Nexus"
      subtitle=""
      index={1}
      total={5}
      nextPath="/onboarding/companion"
      titleStyle={{ 
        fontFamily: 'EB Garamond, serif',
        fontSize: '3rem',
        lineHeight: '1'
      }}
      subtitleStyle={{ fontFamily: 'Neue Haas Grotesk Text, Inter, system-ui, sans-serif' }}
      routes={["/onboarding/intro", "/onboarding/companion", "/onboarding/campus", "/onboarding/darkroom", "/onboarding/hangout"]}
    />
  );
};

export default IntroNexus;


