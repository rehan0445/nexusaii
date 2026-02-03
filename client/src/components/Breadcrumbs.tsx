import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

/**
 * Breadcrumbs component for SEO and navigation
 * Automatically generates breadcrumbs from URL path
 */
export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Don't show breadcrumbs on home page or auth pages
  if (
    pathnames.length === 0 ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/terms' ||
    location.pathname === '/privacy'
  ) {
    return null;
  }

  // Custom labels for better SEO
  const labelMap: Record<string, string> = {
    companion: 'AI Companions',
    'create-buddy': 'Create AI Character',
    campus: 'Campus',
    general: 'General',
    confessions: 'Confessions',
    'write-confession': 'Write Confession',
    arena: 'Arena',
    darkroom: 'Dark Room',
    hangout: 'Hangout Rooms',
    vibe: 'Interest Groups',
    blog: 'Blog & Guides',
    reels: 'Character Reels',
    profile: 'My Profile',
    settings: 'Settings',
    'about-us': 'About Us',
    chat: 'Character Chat',
    character: 'Character Profile',
  };

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [{ label: 'Home', path: '/' }];

    let currentPath = '';
    pathnames.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathnames.length - 1;
      
      items.push({
        label: labelMap[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        path: isLast ? undefined : currentPath,
      });
    });

    return items;
  };

  const breadcrumbs = getBreadcrumbs();

  // Generate JSON-LD structured data for breadcrumbs
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: crumb.path ? `https://www.nexuschat.in${crumb.path}` : undefined,
    })),
  };

  React.useEffect(() => {
    // Add breadcrumb schema to page
    let schemaScript = document.querySelector('script[data-schema="breadcrumb"]');
    
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.setAttribute('type', 'application/ld+json');
      schemaScript.setAttribute('data-schema', 'breadcrumb');
      document.head.appendChild(schemaScript);
    }
    
    schemaScript.textContent = JSON.stringify(breadcrumbSchema);
  }, [breadcrumbSchema]);

  return (
    <nav
      className="sr-only"
      aria-label="Breadcrumb"
      style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
    >
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
          {crumb.path ? (
            <Link
              to={crumb.path}
              className="hover:text-purple-600 transition-colors whitespace-nowrap flex items-center gap-1"
            >
              {index === 0 && <Home size={16} />}
              {crumb.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium whitespace-nowrap flex items-center gap-1">
              {index === 0 && <Home size={16} />}
              {crumb.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
