/**
 * SEO Configuration for all routes
 * Optimized for global keywords: college confessions, school confessions, 
 * ai companion, ai girlfriend, ai boyfriend, ai anime character, ai waifu,
 * dark romance, ai sexting, dominating/submissive ai characters
 */

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  schema?: any;
}

const BASE_URL = 'https://www.nexuschat.in';
const DEFAULT_IMAGE = `${BASE_URL}/assets/nexus-logo.png`;

/** Single title for all pages (browser tab + shares) */
export const SITE_TITLE = 'Nexus : Anonymous - venting & roleplay';

// Helper function to generate structured data
const generateWebPageSchema = (title: string, description: string, url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: title,
  description: description,
  url: url,
  publisher: {
    '@type': 'Organization',
    name: 'Nexus',
    url: BASE_URL,
  },
});

export const SEO_CONFIG: Record<string, SEOMetadata> = {
  // HOME PAGE - Primary landing page (title matches index.html / brand)
  '/': {
    title: 'Nexus : Anonymous - venting & roleplay',
    description: 'Anonymous venting, confessions & AI roleplay companions. Safe space for college students to share feelings and connect without judgment. Free platform.',
    keywords: 'ai girlfriend, ai boyfriend, ai companion, college confessions, school confessions, anonymous confessions, anonymous venting, ai roleplay, dark romance ai, ai waifu, ai hubby, dominating ai, submissive ai, unrestricted ai chat',
    ogTitle: 'Nexus : Anonymous - venting & roleplay',
    ogDescription: 'Chat with AI girlfriends, AI boyfriends & anime characters. Share college confessions anonymously. Dark romance AI with dominating & submissive personas.',
    ogImage: DEFAULT_IMAGE,
    canonical: BASE_URL,
  },

  // COMPANION PAGE - AI Character Hub (CRITICAL for AI keywords)
  '/companion': {
    title: 'AI Girlfriend & AI Boyfriend Chat – Free AI Companion, Waifu & Anime Characters',
    description: 'Chat with AI girlfriends, AI boyfriends, AI waifu, hubby & anime characters for free. Dominating & submissive AI personas. Dark romance, spicy AI sexting with unrestricted character roleplay. No filters, no judgment.',
    keywords: 'ai girlfriend free, ai boyfriend chat, ai companion, ai waifu, ai hubby, ai anime character, ai girlfriend simulator, ai boyfriend app, dominating ai girlfriend, submissive ai boyfriend, ai sexting, sexy ai chat, horny ai, spicy ai, dark romance ai, ai girlfriend nsfw, ai boyfriend nsfw, unrestricted ai',
    ogTitle: 'Free AI Girlfriend & AI Boyfriend – Anime Waifu & Companion Chat',
    ogDescription: 'Unlimited chat with AI girlfriends, boyfriends, waifu & anime characters. Dominating & submissive personas for dark romance & AI sexting.',
    ogImage: DEFAULT_IMAGE,
    canonical: `${BASE_URL}/companion`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Nexus AI Companion',
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description: 'AI girlfriend and boyfriend chat with anime characters, waifu, and unrestricted roleplay',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '15420',
      },
    },
  },

  // CONFESSIONS - Primary confession keywords
  '/campus/general/confessions': {
    title: 'College Confessions & School Confessions – Anonymous Student Secrets',
    description: 'Share your college confessions, school confessions & university secrets anonymously. Read campus stories, student confessions, crush confessions & dark secrets. Safe space, no judgment.',
    keywords: 'college confessions, school confessions, anonymous confessions, university confessions, campus confessions, student confessions, crush confessions, secret confessions, confession site, confession app, college secrets, school secrets',
    ogTitle: 'Anonymous College & School Confessions – Campus Secrets',
    ogDescription: 'Share college & school confessions anonymously. Campus stories, crush confessions & student secrets.',
    ogImage: DEFAULT_IMAGE,
    canonical: `${BASE_URL}/campus/general/confessions`,
  },

  '/confessions': {
    title: 'Anonymous Confessions – Share Your Secrets, College & School Stories',
    description: 'Anonymous confession platform for college, school & personal secrets. Share confessions, crush stories, dark thoughts without judgment. Safe community for students.',
    keywords: 'anonymous confessions, confession site, college confessions, school confessions, secret sharing, anonymous secrets, confession app, student confessions',
    canonical: `${BASE_URL}/confessions`,
  },

  // CHARACTER CHAT - Deep linking for AI companion SEO
  '/chat/:characterId': {
    title: 'AI Character Chat – AI Girlfriend, Boyfriend & Anime Roleplay',
    description: 'Chat with AI characters – girlfriends, boyfriends, anime waifus, dominating & submissive personas. Free unrestricted AI roleplay & dark romance chat.',
    keywords: 'ai character chat, ai girlfriend chat, ai boyfriend chat, anime character chat, ai waifu chat, ai roleplay, character ai alternative, ai chat bot girlfriend',
    canonical: `${BASE_URL}/chat`,
  },

  // CHARACTER PROFILE
  '/character/:characterId': {
    title: 'AI Character Profile – Girlfriend, Boyfriend, Waifu & Anime Personas',
    description: 'Explore AI character profiles – girlfriends, boyfriends, anime waifus, dominating & submissive personas for dark romance & roleplay.',
    keywords: 'ai character, ai girlfriend profile, ai boyfriend profile, ai waifu, ai anime character, character ai nsfw',
    canonical: `${BASE_URL}/character`,
  },

  // DARK ROOM - Anonymous venting
  '/arena/darkroom': {
    title: 'Dark Room Chat – Anonymous Venting, Late Night Confessions & Deep Talks',
    description: 'Anonymous dark room for late-night confessions, venting & deep conversations. Share dark thoughts, secrets & connect with strangers. Unfiltered, no judgment.',
    keywords: 'dark room chat, anonymous chat, venting room, late night chat, anonymous venting, dark thoughts, deep conversations, stranger chat',
    canonical: `${BASE_URL}/arena/darkroom`,
  },

  // HANGOUT - Group chat
  '/arena/hangout': {
    title: 'Hangout Rooms – College Group Chat, Anonymous Friends & Community',
    description: 'Join college hangout rooms, make anonymous friends, group chat with students. Campus communities, interest-based rooms.',
    keywords: 'hangout chat, college group chat, student chat rooms, anonymous friends, campus community',
    canonical: `${BASE_URL}/arena/hangout`,
  },

  // AI SETTINGS - Character creation
  '/create-buddy': {
    title: 'Create AI Girlfriend, AI Boyfriend or Custom AI Character – Free',
    description: 'Create your own AI girlfriend, AI boyfriend, waifu or custom character. Design personality, appearance & roleplay style. Free AI character creator.',
    keywords: 'create ai girlfriend, create ai boyfriend, ai character creator, custom ai girlfriend, make ai waifu, ai companion maker',
    canonical: `${BASE_URL}/create-buddy`,
  },

  // PROFILE
  '/profile': {
    title: 'My Profile – Nexus AI Companion & Confessions',
    description: 'Manage your Nexus profile, AI companions, confessions & settings.',
    keywords: 'nexus profile, my ai companions, my confessions',
    canonical: `${BASE_URL}/profile`,
  },

  // MY CHATS / INBOX
  '/my-chats': {
    title: 'My Chats – AI Girlfriend, AI Boyfriend & Character Conversations',
    description: 'View all your AI girlfriend, AI boyfriend & character conversations. Manage your AI companion chats.',
    keywords: 'ai girlfriend chats, ai boyfriend messages, ai companion conversations',
    canonical: `${BASE_URL}/my-chats`,
  },

  // WRITE CONFESSION
  '/write-confession': {
    title: 'Write Anonymous Confession – Share College, School or Personal Secrets',
    description: 'Write and share your anonymous confession. College secrets, school stories, crush confessions or personal thoughts. Safe & judgment-free.',
    keywords: 'write confession, anonymous confession, share secret, college confession, school confession',
    canonical: `${BASE_URL}/write-confession`,
  },

  // CHARACTER REELS
  '/reels': {
    title: 'AI Character Reels – Discover AI Girlfriends, Boyfriends & Anime Characters',
    description: 'Discover AI girlfriends, boyfriends, waifus & anime characters through short reels. Swipe to find your perfect AI companion.',
    keywords: 'ai character reels, ai girlfriend discovery, ai boyfriend finder, anime character reels',
    canonical: `${BASE_URL}/reels`,
  },

  // VIBE (Groups)
  '/vibe': {
    title: 'Vibe – College Interest Groups & Community Chat',
    description: 'Join college interest groups, hobby communities & topic-based chats. Connect with like-minded students.',
    keywords: 'college groups, interest groups, community chat, student communities',
    canonical: `${BASE_URL}/vibe`,
  },

  // ABOUT US
  '/about-us': {
    title: 'About Nexus – AI Companion & Anonymous Confession Platform',
    description: 'Learn about Nexus, the platform for AI companions, college confessions & anonymous community. Our mission & values.',
    keywords: 'about nexus, nexus platform, ai companion platform, confession platform',
    canonical: `${BASE_URL}/about-us`,
  },

  // AUTH PAGES
  '/login': {
    title: 'Login – Nexus AI Companion & Confessions',
    description: 'Login to Nexus to chat with AI girlfriends, AI boyfriends & share anonymous confessions.',
    keywords: 'nexus login, ai girlfriend login, confession login',
    canonical: `${BASE_URL}/login`,
  },

  '/register': {
    title: 'Sign Up Free – AI Girlfriend, AI Boyfriend & College Confessions',
    description: 'Create free account to chat with AI girlfriends, AI boyfriends, anime characters & share college confessions anonymously.',
    keywords: 'nexus signup, ai girlfriend free, ai boyfriend free, create account',
    canonical: `${BASE_URL}/register`,
  },

  // BLOG PAGES
  '/blog': {
    title: 'Nexus Blog – AI Companion Guides, Confession Tips & Community Insights',
    description: 'Expert guides on AI girlfriends, AI boyfriends, anonymous confessions, dark romance & college communities. Tips, tutorials & insights.',
    keywords: 'ai girlfriend guide, confession tips, ai companion blog, dark romance guide, college confession advice',
    canonical: `${BASE_URL}/blog`,
  },

  // PERSONA LANDING PAGES (Long-tail SEO)
  '/personas/dominating-ai-girlfriend': {
    title: 'Dominating AI Girlfriend Free – Dominant AI Chat No Filter | Nexus',
    description: 'Chat with dominating AI girlfriends for free. Assertive, controlling, and intense dominant AI personas with no content filters. NSFW-friendly power dynamic roleplay.',
    keywords: 'dominating ai girlfriend, dominant ai girlfriend, dominating ai, free dominating ai girlfriend no filter, assertive ai, controlling ai girlfriend, power dynamic ai',
    canonical: `${BASE_URL}/personas/dominating-ai-girlfriend`,
  },

  // VENTING LANDING PAGE (White-hat SEO bridge)
  '/venting-anonymously': {
    title: 'How to Vent Anonymously – Free Anonymous Venting Room for Students | Nexus',
    description: 'Safe space to vent anonymously about college stress, work drama, relationships, and mental health. Free anonymous venting room with no judgment.',
    keywords: 'how to vent anonymously, anonymous venting, venting room, anonymous venting site, safe space to vent, emotional release, mental health venting',
    canonical: `${BASE_URL}/venting-anonymously`,
  },

  '/how-to-vent-anonymously': {
    title: 'How to Vent Anonymously Online – Best Anonymous Venting Sites 2026',
    description: 'Learn how to vent anonymously online safely. Best anonymous venting sites, apps, and rooms for students to release emotions without judgment.',
    keywords: 'how to vent anonymously, how to vent online, anonymous venting sites, best venting apps, anonymous emotional support',
    canonical: `${BASE_URL}/how-to-vent-anonymously`,
  },
};

// Dynamic SEO for campus-specific pages
export const generateCampusSEO = (collegeId: string, collegeName?: string): SEOMetadata => {
  const name = collegeName || collegeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    title: `${name} Confessions – Anonymous College Confessions & Student Secrets`,
    description: `Read and share ${name} confessions anonymously. Campus stories, student secrets, crush confessions from ${name}. Join your college community.`,
    keywords: `${name} confessions, ${name} secrets, ${name} anonymous, ${collegeId} confessions, college confessions, campus confessions`,
    ogTitle: `${name} Anonymous Confessions`,
    ogDescription: `Anonymous confessions from ${name} students. Share your campus stories & secrets.`,
    canonical: `${BASE_URL}/campus/${collegeId}/confessions`,
  };
};

// Dynamic SEO for confession detail pages
export const generateConfessionDetailSEO = (confessionText?: string, collegeId?: string): SEOMetadata => {
  const truncatedText = confessionText ? confessionText.substring(0, 150) + '...' : 'Read anonymous confession';
  const collegePart = collegeId ? ` – ${collegeId.replace(/-/g, ' ')}` : '';
  
  return {
    title: `Anonymous Confession${collegePart} – College & School Secrets`,
    description: truncatedText,
    keywords: 'anonymous confession, college confession, school confession, student secret, campus story',
    ogTitle: `Anonymous Confession${collegePart}`,
    ogDescription: truncatedText,
    canonical: `${BASE_URL}/campus/${collegeId || 'general'}/confessions`,
  };
};

// Get SEO config for current route (always same title on all pages)
export const getSEOForRoute = (pathname: string): SEOMetadata => {
  let seo: SEOMetadata;
  // Exact match
  if (SEO_CONFIG[pathname]) {
    seo = SEO_CONFIG[pathname];
  } else if (pathname.startsWith('/campus/')) {
    const parts = pathname.split('/');
    if (parts.length >= 4 && parts[3] === 'confessions') {
      seo = generateCampusSEO(parts[2]);
    } else if (parts.length >= 5 && parts[3] === 'confessions') {
      seo = generateConfessionDetailSEO(undefined, parts[2]);
    } else {
      seo = SEO_CONFIG['/'];
    }
  } else if (pathname.startsWith('/chat/')) {
    seo = SEO_CONFIG['/chat/:characterId'];
  } else if (pathname.startsWith('/character/')) {
    seo = SEO_CONFIG['/character/:characterId'];
  } else if (pathname.startsWith('/reels/')) {
    seo = SEO_CONFIG['/reels'];
  } else if (pathname.startsWith('/blog/') && pathname !== '/blog') {
    seo = SEO_CONFIG['/blog'];
  } else {
    seo = SEO_CONFIG['/'];
  }
  // Use same title on every page (browser tab + og:title)
  return { ...seo, title: SITE_TITLE, ogTitle: SITE_TITLE };
};
