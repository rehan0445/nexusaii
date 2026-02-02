import React from 'react';
import EnhancedNavigation from './EnhancedNavigation';

interface NavigationWrapperProps {
  children: React.ReactNode;
  showMobileMenu?: boolean;
  onMobileMenuToggle?: () => void;
}

export default function NavigationWrapper({ 
  children, 
  showMobileMenu = true,
  onMobileMenuToggle 
}: NavigationWrapperProps) {
  return (
    <EnhancedNavigation 
      showMobileMenu={showMobileMenu}
      onMobileMenuToggle={onMobileMenuToggle}
    >
      {children}
    </EnhancedNavigation>
  );
}
