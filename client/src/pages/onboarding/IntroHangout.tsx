import React from 'react';
import OnboardingSlide from '../../components/OnboardingSlide';
import hangoutImage from '../../assets/intro/hangout.png';

const IntroHangout: React.FC = () => {
  const handleGetStarted = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    window.location.href = '/register';
  };

  return (
    <OnboardingSlide
      imageUrl={hangoutImage}
      title="Hangouts"
      subtitle="From conversations to companionship."
      index={5}
      total={5}
      nextPath="/register"
      prevPath="/onboarding/darkroom"
      onNext={handleGetStarted}
      titleStyle={{ fontFamily: 'EB Garamond, serif' }}
      subtitleStyle={{ fontFamily: 'Neue Haas Grotesk Text, Inter, system-ui, sans-serif' }}
      routes={["/onboarding/intro", "/onboarding/companion", "/onboarding/campus", "/onboarding/darkroom", "/onboarding/hangout"]}
    />
  );
};

export default IntroHangout;


