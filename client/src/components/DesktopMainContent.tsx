import React from 'react';
import { useDesktopLayout } from '../contexts/DesktopLayoutContext';

interface DesktopMainContentProps {
  children: React.ReactNode;
}

export function DesktopMainContent({ children }: DesktopMainContentProps) {
  const layout = useDesktopLayout();
  if (!layout) {
    return <main className="min-h-screen overflow-auto">{children}</main>;
  }
  const { leftCollapsed, rightHidden, leftHidden } = layout;
  const mlClass = leftHidden ? 'lg:ml-0' : (leftCollapsed ? 'lg:ml-[60px]' : 'lg:ml-[20%]');
  const mrClass = rightHidden ? 'lg:mr-0' : 'lg:mr-[20%]';
  return (
    <main
      className={`min-h-screen overflow-auto transition-[margin] duration-300 ease-in-out ${mlClass} ${mrClass}`}
    >
      {children}
    </main>
  );
}
