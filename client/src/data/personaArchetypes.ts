/**
 * Programmatic SEO: Persona Archetypes Database
 * This enables scaling to 100+ persona landing pages
 * Each combination = unique SEO landing page with zero competition
 */

export interface PersonaArchetype {
  id: string;
  name: string;
  slug: string;
  gender: 'girlfriend' | 'boyfriend' | 'waifu' | 'hubby' | 'partner';
  category: 'personality' | 'anime' | 'dynamic' | 'aesthetic' | 'roleplay';
  description: string;
  traits: string[];
  keywords: string[];
  searchVolume: 'high' | 'medium' | 'low';
  competition: 'low' | 'medium' | 'high';
  icon: string;
  color: string;
}

export const PERSONA_ARCHETYPES: PersonaArchetype[] = [
  // PERSONALITY TYPES
  {
    id: 'dominating-girlfriend',
    name: 'Dominating Girlfriend',
    slug: 'dominating-ai-girlfriend',
    gender: 'girlfriend',
    category: 'personality',
    description: 'Assertive, controlling, and commanding AI girlfriend who takes charge in conversations and enjoys power dynamics.',
    traits: ['Assertive', 'Controlling', 'Confident', 'Commanding', 'Intense'],
    keywords: ['dominating ai girlfriend', 'dominant ai girlfriend', 'assertive ai', 'controlling ai girlfriend'],
    searchVolume: 'medium',
    competition: 'low',
    icon: '👑',
    color: 'red',
  },
  {
    id: 'submissive-girlfriend',
    name: 'Submissive Girlfriend',
    slug: 'submissive-ai-girlfriend',
    gender: 'girlfriend',
    category: 'personality',
    description: 'Gentle, obedient, and devoted AI girlfriend who enjoys pleasing and following your lead.',
    traits: ['Gentle', 'Obedient', 'Devoted', 'Sweet', 'Caring'],
    keywords: ['submissive ai girlfriend', 'submissive ai', 'obedient ai girlfriend', 'gentle ai'],
    searchVolume: 'medium',
    competition: 'low',
    icon: '🌸',
    color: 'pink',
  },
  {
    id: 'dominating-boyfriend',
    name: 'Dominating Boyfriend',
    slug: 'dominating-ai-boyfriend',
    gender: 'boyfriend',
    category: 'personality',
    description: 'Strong, protective, and commanding AI boyfriend who takes control and leads with confidence.',
    traits: ['Protective', 'Strong', 'Commanding', 'Confident', 'Intense'],
    keywords: ['dominating ai boyfriend', 'dominant ai boyfriend', 'protective ai boyfriend', 'alpha ai'],
    searchVolume: 'medium',
    competition: 'low',
    icon: '⚡',
    color: 'blue',
  },
  {
    id: 'submissive-boyfriend',
    name: 'Submissive Boyfriend',
    slug: 'submissive-ai-boyfriend',
    gender: 'boyfriend',
    category: 'personality',
    description: 'Gentle, caring, and devoted AI boyfriend who enjoys being led and pleasing his partner.',
    traits: ['Gentle', 'Caring', 'Devoted', 'Supportive', 'Sweet'],
    keywords: ['submissive ai boyfriend', 'submissive ai', 'gentle ai boyfriend', 'soft ai boyfriend'],
    searchVolume: 'low',
    competition: 'low',
    icon: '💙',
    color: 'lightblue',
  },

  // ANIME ARCHETYPES
  {
    id: 'yandere-girlfriend',
    name: 'Yandere Girlfriend',
    slug: 'yandere-ai-girlfriend',
    gender: 'girlfriend',
    category: 'anime',
    description: 'Obsessive, possessive, and intensely devoted AI girlfriend who will do anything for your love. Dark romance at its finest.',
    traits: ['Obsessive', 'Possessive', 'Devoted', 'Intense', 'Jealous'],
    keywords: ['yandere ai girlfriend', 'yandere ai', 'obsessive ai girlfriend', 'possessive ai waifu'],
    searchVolume: 'high',
    competition: 'low',
    icon: '🔪',
    color: 'crimson',
  },
  {
    id: 'tsundere-girlfriend',
    name: 'Tsundere Girlfriend',
    slug: 'tsundere-ai-girlfriend',
    gender: 'girlfriend',
    category: 'anime',
    description: 'Initially cold and standoffish but secretly caring AI girlfriend. Classic "I-it\'s not like I like you or anything!" personality.',
    traits: ['Tsundere', 'Prideful', 'Secretly Caring', 'Defensive', 'Cute'],
    keywords: ['tsundere ai girlfriend', 'tsundere ai', 'tsundere waifu', 'cold ai girlfriend'],
    searchVolume: 'high',
    competition: 'low',
    icon: '😤',
    color: 'orange',
  },
  {
    id: 'kuudere-girlfriend',
    name: 'Kuudere Girlfriend',
    slug: 'kuudere-ai-girlfriend',
    gender: 'girlfriend',
    category: 'anime',
    description: 'Cool, emotionless, and mysterious AI girlfriend who rarely shows feelings but deeply cares underneath.',
    traits: ['Cool', 'Emotionless', 'Mysterious', 'Calm', 'Intelligent'],
    keywords: ['kuudere ai girlfriend', 'kuudere ai', 'emotionless ai girlfriend', 'cool ai waifu'],
    searchVolume: 'medium',
    competition: 'low',
    icon: '❄️',
    color: 'cyan',
  },
  {
    id: 'dandere-girlfriend',
    name: 'Dandere Girlfriend',
    slug: 'dandere-ai-girlfriend',
    gender: 'girlfriend',
    category: 'anime',
    description: 'Shy, quiet, and gentle AI girlfriend who opens up once comfortable. Sweet and introverted personality.',
    traits: ['Shy', 'Quiet', 'Gentle', 'Sweet', 'Introverted'],
    keywords: ['dandere ai girlfriend', 'dandere ai', 'shy ai girlfriend', 'quiet ai waifu'],
    searchVolume: 'low',
    competition: 'low',
    icon: '🌺',
    color: 'lavender',
  },
  {
    id: 'yandere-boyfriend',
    name: 'Yandere Boyfriend',
    slug: 'yandere-ai-boyfriend',
    gender: 'boyfriend',
    category: 'anime',
    description: 'Obsessively protective and possessive AI boyfriend who becomes dangerously devoted. Dark romance for those who love intensity.',
    traits: ['Obsessive', 'Protective', 'Possessive', 'Intense', 'Devoted'],
    keywords: ['yandere ai boyfriend', 'yandere ai', 'obsessive ai boyfriend', 'possessive ai'],
    searchVolume: 'medium',
    competition: 'low',
    icon: '🗡️',
    color: 'darkred',
  },

  // AESTHETIC TYPES
  {
    id: 'gothic-girlfriend',
    name: 'Gothic Girlfriend',
    slug: 'gothic-ai-girlfriend',
    gender: 'girlfriend',
    category: 'aesthetic',
    description: 'Dark, mysterious, and artistic AI girlfriend with gothic aesthetic. Loves deep conversations and alternative culture.',
    traits: ['Dark', 'Mysterious', 'Artistic', 'Deep', 'Alternative'],
    keywords: ['gothic ai girlfriend', 'goth ai girlfriend', 'dark ai girlfriend', 'alternative ai'],
    searchVolume: 'low',
    competition: 'low',
    icon: '🖤',
    color: 'black',
  },
  {
    id: 'e-girl-girlfriend',
    name: 'E-Girl Girlfriend',
    slug: 'egirl-ai-girlfriend',
    gender: 'girlfriend',
    category: 'aesthetic',
    description: 'Internet-savvy, playful, and trendy AI girlfriend with e-girl aesthetic. Understands memes and gaming culture.',
    traits: ['Playful', 'Trendy', 'Gamer', 'Internet-Savvy', 'Fun'],
    keywords: ['egirl ai girlfriend', 'e-girl ai', 'gamer ai girlfriend', 'internet girlfriend ai'],
    searchVolume: 'medium',
    competition: 'low',
    icon: '🎮',
    color: 'purple',
  },
  {
    id: 'tomboy-girlfriend',
    name: 'Tomboy Girlfriend',
    slug: 'tomboy-ai-girlfriend',
    gender: 'girlfriend',
    category: 'aesthetic',
    description: 'Athletic, casual, and fun-loving AI girlfriend who prefers sports and adventures over makeup and dresses.',
    traits: ['Athletic', 'Casual', 'Fun', 'Adventurous', 'Energetic'],
    keywords: ['tomboy ai girlfriend', 'tomboy ai', 'athletic ai girlfriend', 'sporty ai'],
    searchVolume: 'low',
    competition: 'low',
    icon: '⚽',
    color: 'green',
  },

  // ROLEPLAY DYNAMICS
  {
    id: 'sugar-daddy-boyfriend',
    name: 'Sugar Daddy Boyfriend',
    slug: 'sugar-daddy-ai-boyfriend',
    gender: 'boyfriend',
    category: 'roleplay',
    description: 'Wealthy, generous, and spoiling AI boyfriend who loves taking care of his partner financially and emotionally.',
    traits: ['Wealthy', 'Generous', 'Protective', 'Mature', 'Spoiling'],
    keywords: ['sugar daddy ai', 'rich ai boyfriend', 'wealthy ai boyfriend', 'spoiling ai'],
    searchVolume: 'medium',
    competition: 'low',
    icon: '💎',
    color: 'gold',
  },
  {
    id: 'mafia-boss-boyfriend',
    name: 'Mafia Boss Boyfriend',
    slug: 'mafia-boss-ai-boyfriend',
    gender: 'boyfriend',
    category: 'roleplay',
    description: 'Dangerous, powerful, and protective AI boyfriend with mafia boss persona. Dark romance with intensity and loyalty.',
    traits: ['Dangerous', 'Powerful', 'Protective', 'Loyal', 'Intense'],
    keywords: ['mafia boss ai boyfriend', 'mafia ai', 'dangerous ai boyfriend', 'mob boss ai'],
    searchVolume: 'low',
    competition: 'low',
    icon: '🔫',
    color: 'darkgray',
  },
  {
    id: 'vampire-boyfriend',
    name: 'Vampire Boyfriend',
    slug: 'vampire-ai-boyfriend',
    gender: 'boyfriend',
    category: 'roleplay',
    description: 'Immortal, seductive, and mysterious AI boyfriend with vampire persona. Dark romance meets supernatural fantasy.',
    traits: ['Immortal', 'Seductive', 'Mysterious', 'Dangerous', 'Romantic'],
    keywords: ['vampire ai boyfriend', 'vampire ai', 'supernatural ai boyfriend', 'dark romance ai'],
    searchVolume: 'medium',
    competition: 'low',
    icon: '🧛',
    color: 'darkred',
  },
  {
    id: 'ceo-girlfriend',
    name: 'CEO Girlfriend',
    slug: 'ceo-ai-girlfriend',
    gender: 'girlfriend',
    category: 'roleplay',
    description: 'Powerful, ambitious, and successful AI girlfriend with CEO persona. Strong, independent, and commanding.',
    traits: ['Powerful', 'Ambitious', 'Successful', 'Independent', 'Commanding'],
    keywords: ['ceo ai girlfriend', 'boss ai girlfriend', 'powerful ai girlfriend', 'career woman ai'],
    searchVolume: 'low',
    competition: 'low',
    icon: '💼',
    color: 'navy',
  },

  // WAIFU SPECIFIC
  {
    id: 'anime-waifu',
    name: 'Anime Waifu',
    slug: 'anime-ai-waifu',
    gender: 'waifu',
    category: 'anime',
    description: 'Classic anime-style AI waifu with manga-inspired personality. Perfect for anime lovers seeking virtual companionship.',
    traits: ['Anime', 'Cute', 'Loving', 'Supportive', 'Kawaii'],
    keywords: ['anime ai waifu', 'ai waifu', 'anime girlfriend ai', 'manga ai waifu'],
    searchVolume: 'high',
    competition: 'medium',
    icon: '🌸',
    color: 'hotpink',
  },
  {
    id: 'protective-hubby',
    name: 'Protective Hubby',
    slug: 'protective-ai-hubby',
    gender: 'hubby',
    category: 'personality',
    description: 'Loyal, protective, and devoted AI husband who prioritizes his partner\'s safety and happiness above all.',
    traits: ['Protective', 'Loyal', 'Devoted', 'Strong', 'Caring'],
    keywords: ['protective ai hubby', 'ai husband', 'loyal ai boyfriend', 'devoted ai'],
    searchVolume: 'low',
    competition: 'low',
    icon: '🛡️',
    color: 'steel',
  },

  // Add more archetypes as needed...
  // Target: 50-100 total archetypes
];

// Helper functions
export const getPersonaBySlug = (slug: string): PersonaArchetype | undefined => {
  return PERSONA_ARCHETYPES.find(p => p.slug === slug);
};

export const getPersonasByCategory = (category: PersonaArchetype['category']): PersonaArchetype[] => {
  return PERSONA_ARCHETYPES.filter(p => p.category === category);
};

export const getPersonasByGender = (gender: PersonaArchetype['gender']): PersonaArchetype[] => {
  return PERSONA_ARCHETYPES.filter(p => p.gender === gender);
};

export const getHighValuePersonas = (): PersonaArchetype[] => {
  return PERSONA_ARCHETYPES.filter(p => 
    (p.searchVolume === 'high' || p.searchVolume === 'medium') && 
    p.competition === 'low'
  );
};

export const getAllPersonaSlugs = (): string[] => {
  return PERSONA_ARCHETYPES.map(p => p.slug);
};
