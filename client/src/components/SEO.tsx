import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSEOForRoute, SEOMetadata, SITE_TITLE } from '../utils/seoConfig';

interface SEOProps {
  override?: Partial<SEOMetadata>;
}

/**
 * SEO Component - Dynamically updates meta tags for each route
 * Zero dependencies, uses native DOM manipulation
 */
export const SEO: React.FC<SEOProps> = ({ override }) => {
  const location = useLocation();

  useEffect(() => {
    // Get SEO config for current route
    const seoData = getSEOForRoute(location.pathname);
    
    // Merge with override if provided (keep same title on all pages)
    const finalSEO: SEOMetadata = {
      ...seoData,
      ...override,
      title: SITE_TITLE,
      ogTitle: SITE_TITLE,
    };

    // Update document title
    document.title = finalSEO.title;

    // Helper function to update or create meta tag
    const updateMetaTag = (
      selector: string,
      attribute: string,
      value: string | undefined
    ) => {
      if (!value) return;
      
      let element = document.querySelector(selector);
      
      if (!element) {
        element = document.createElement('meta');
        const attrName = selector.includes('property') ? 'property' : 'name';
        const attrValue = selector.match(/["']([^"']+)["']/)?.[1];
        if (attrValue) {
          element.setAttribute(attrName, attrValue);
        }
        document.head.appendChild(element);
      }
      
      element.setAttribute(attribute, value);
    };

    // Update basic meta tags
    updateMetaTag('meta[name="description"]', 'content', finalSEO.description);
    updateMetaTag('meta[name="keywords"]', 'content', finalSEO.keywords);

    // Update Open Graph tags
    updateMetaTag('meta[property="og:title"]', 'content', finalSEO.ogTitle || finalSEO.title);
    updateMetaTag('meta[property="og:description"]', 'content', finalSEO.ogDescription || finalSEO.description);
    updateMetaTag('meta[property="og:image"]', 'content', finalSEO.ogImage);
    updateMetaTag('meta[property="og:url"]', 'content', finalSEO.canonical);
    updateMetaTag('meta[property="og:type"]', 'content', 'website');

    // Update Twitter Card tags
    updateMetaTag('meta[name="twitter:title"]', 'content', finalSEO.ogTitle || finalSEO.title);
    updateMetaTag('meta[name="twitter:description"]', 'content', finalSEO.ogDescription || finalSEO.description);
    updateMetaTag('meta[name="twitter:image"]', 'content', finalSEO.ogImage);
    updateMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && finalSEO.canonical) {
      canonical.setAttribute('href', finalSEO.canonical);
    } else if (!canonical && finalSEO.canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', finalSEO.canonical);
      document.head.appendChild(canonical);
    }

    // Update hreflang tags for international SEO
    const hreflangs = [
      { lang: 'en', href: finalSEO.canonical || '' },
      { lang: 'en-US', href: finalSEO.canonical || '' },
      { lang: 'en-GB', href: finalSEO.canonical || '' },
      { lang: 'en-IN', href: finalSEO.canonical || '' },
      { lang: 'ja', href: finalSEO.canonical || '' },
      { lang: 'ko', href: finalSEO.canonical || '' },
      { lang: 'de', href: finalSEO.canonical || '' },
      { lang: 'fr', href: finalSEO.canonical || '' },
      { lang: 'x-default', href: finalSEO.canonical || '' },
    ];

    hreflangs.forEach(({ lang, href }) => {
      if (href) {
        let hreflangLink = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`);
        if (!hreflangLink) {
          hreflangLink = document.createElement('link');
          hreflangLink.setAttribute('rel', 'alternate');
          hreflangLink.setAttribute('hreflang', lang);
          document.head.appendChild(hreflangLink);
        }
        hreflangLink.setAttribute('href', href);
      }
    });

    // Update or create structured data (JSON-LD)
    if (finalSEO.schema) {
      let schemaScript = document.querySelector('script[data-schema="page"]');
      
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.setAttribute('type', 'application/ld+json');
        schemaScript.setAttribute('data-schema', 'page');
        document.head.appendChild(schemaScript);
      }
      
      schemaScript.textContent = JSON.stringify(finalSEO.schema);
    }

    // Scroll to top on route change (good for UX and reduces bounce rate)
    window.scrollTo(0, 0);
  }, [location.pathname, override]);

  return null; // This component doesn't render anything
};

// Hook version for use in components
export const useSEO = (seoData?: Partial<SEOMetadata>) => {
  const location = useLocation();

  useEffect(() => {
    if (seoData) {
      const currentSEO = getSEOForRoute(location.pathname);
      const finalSEO = { ...currentSEO, ...seoData, title: SITE_TITLE, ogTitle: SITE_TITLE };

      document.title = finalSEO.title;
      
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && finalSEO.description) {
        metaDesc.setAttribute('content', finalSEO.description);
      }
    }
  }, [location.pathname, seoData]);
};

export default SEO;
