import React from 'react';
import OnboardingSlide from '../../components/OnboardingSlide';

const IntroCampus: React.FC = () => (
  <OnboardingSlide
    imageUrl={"/assets/intro/campus.png"}
    title="Campus"
    subtitle="Announcements, confessions, and campus life in one place."
    index={3}
    total={5}
    nextPath="/onboarding/darkroom"
    titleStyle={{ fontFamily: 'EB Garamond, serif' }}
    subtitleStyle={{ fontFamily: 'Neue Haas Grotesk Text, Inter, system-ui, sans-serif' }}
    routes={["/onboarding/intro", "/onboarding/companion", "/onboarding/campus", "/onboarding/darkroom", "/onboarding/hangout"]}
  />
);

export default IntroCampus;


