import React from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingSlide from '../../components/OnboardingSlide';
import hangoutImage from '../../assets/intro/hangout.png';

const IntroHangout: React.FC = () => {
  const navigate = useNavigate();
  
  const handleGetStarted = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    
    // Preserve referral code if present
    const referralCode = localStorage.getItem('pending_referral_code');
    if (referralCode) {
      navigate(`/register?ref=${referralCode}`);
    } else {
      navigate('/register');
    }
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


