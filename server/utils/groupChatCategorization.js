const GROUP_CHAT_CATEGORIES = [
  {
    id: 'anime-centric',
    name: 'Anime-centric',
    icon: '🌸',
    keywords: ['anime', 'manga', 'weeb', 'otaku', 'naruto', 'one piece', 'bleach', 'dragon ball', 'attack on titan', 'jujutsu kaisen', 'demon slayer', 'my hero academia', 'tokyo ghoul', 'death note', 'fullmetal alchemist', 'cowboy bebop', 'evangelion', 'studio ghibli', 'crunchyroll', 'funimation'],
    description: 'Anime and manga enthusiasts unite!',
    color: 'linear-gradient(135deg,#ff9a9e 0%,#fecfef 100%)'
  },
  {
    id: 'startup-hub',
    name: 'Startup hub',
    icon: '🚀',
    keywords: ['startup', 'founder', 'saas', 'pitch', 'vc', 'product', 'entrepreneur', 'business', 'funding', 'accelerator', 'incubator', 'tech', 'innovation', 'scale', 'growth', 'revenue', 'customer', 'market', 'strategy', 'execution'],
    description: 'For entrepreneurs and startup enthusiasts',
    color: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)'
  },
  {
    id: 'marvels-of-india',
    name: 'Marvels of India',
    icon: '🪷',
    keywords: ['india', 'bharat', 'desi', 'hind', 'bollywood', 'pune', 'mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'kolkata', 'ahmedabad', 'indore', 'nagpur', 'surat', 'vadodara', 'lucknow', 'kanpur', 'patna', 'bhopal', 'chandigarh', 'amritsar', 'jodhpur', 'udaipur', 'varanasi', 'allahabad', 'ranchi', 'guwahati', 'shillong', 'imphal', 'agartala', 'aizawl', 'kohima', 'itanagar', 'shillong', 'gangtok', 'leh', 'srinagar', 'jammu', 'dehradun', 'shimla', 'manali', 'ooty', 'coorg', 'kerala', 'goa', 'pondicherry', 'andaman', 'lakshadweep', 'sikkim', 'arunachal', 'nagaland', 'manipur', 'mizoram', 'tripura', 'meghalaya', 'assam', 'bihar', 'jharkhand', 'odisha', 'west bengal', 'chhattisgarh', 'madhya pradesh', 'rajasthan', 'gujarat', 'maharashtra', 'karnataka', 'tamil nadu', 'andhra pradesh', 'telangana', 'kerala', 'goa', 'himachal pradesh', 'uttarakhand', 'punjab', 'haryana', 'uttar pradesh', 'bihar', 'jharkhand', 'odisha', 'west bengal', 'sikkim', 'arunachal pradesh', 'nagaland', 'manipur', 'mizoram', 'tripura', 'meghalaya', 'assam'],
    description: 'Celebrating the diversity and culture of India',
    color: 'linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)'
  },
  {
    id: 'gaming',
    name: 'Gaming Zone',
    icon: '🎮',
    keywords: ['gaming', 'game', 'gamer', 'valorant', 'csgo', 'pubg', 'pokemon', 'minecraft', 'fortnite', 'apex', 'overwatch', 'league of legends', 'dota', 'fifa', 'pes', 'cod', 'battlefield', 'assassin', 'gta', 'red dead', 'cyberpunk', 'witcher', 'skyrim', 'fallout', 'mass effect', 'dragon age', 'final fantasy', 'persona', 'zelda', 'mario', 'sonic', 'metroid', 'castlevania', 'resident evil', 'silent hill', 'metal gear', 'devil may cry', 'bayonetta', 'god of war', 'uncharted', 'last of us', 'spider-man', 'batman', 'superman', 'marvel', 'dc', 'star wars', 'star trek', 'lord of the rings', 'game of thrones', 'harry potter', 'naruto', 'dragon ball', 'one piece', 'bleach', 'attack on titan', 'jujutsu kaisen', 'demon slayer', 'my hero academia', 'tokyo ghoul', 'death note', 'fullmetal alchemist', 'cowboy bebop', 'evangelion', 'studio ghibli'],
    description: 'For gamers and gaming enthusiasts',
    color: 'linear-gradient(135deg,#a8edea 0%,#fed6e3 100%)'
  },
  {
    id: 'tech',
    name: 'Tech Talk',
    icon: '💻',
    keywords: ['tech', 'technology', 'programming', 'coding', 'software', 'developer', 'engineer', 'ai', 'machine learning', 'data science', 'python', 'javascript', 'react', 'node', 'angular', 'vue', 'flutter', 'swift', 'kotlin', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'scala', 'haskell', 'clojure', 'elixir', 'erlang', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'cloud', 'devops', 'ci/cd', 'git', 'github', 'gitlab', 'bitbucket', 'database', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'kafka', 'rabbitmq', 'microservices', 'api', 'rest', 'graphql', 'websocket', 'blockchain', 'cryptocurrency', 'bitcoin', 'ethereum', 'web3', 'defi', 'nft', 'metaverse', 'vr', 'ar', 'iot', '5g', 'cybersecurity', 'hacking', 'penetration testing', 'ethical hacking', 'bug bounty', 'ctf', 'malware', 'virus', 'trojan', 'ransomware', 'phishing', 'social engineering'],
    description: 'Technology discussions and programming',
    color: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)'
  },
  {
    id: 'music',
    name: 'Music Vibes',
    icon: '🎵',
    keywords: ['music', 'song', 'artist', 'band', 'concert', 'festival', 'spotify', 'apple music', 'youtube music', 'soundcloud', 'bandcamp', 'vinyl', 'cd', 'cassette', 'radio', 'dj', 'producer', 'composer', 'lyricist', 'singer', 'rapper', 'guitarist', 'drummer', 'bassist', 'pianist', 'violinist', 'cellist', 'flutist', 'saxophonist', 'trumpeter', 'trombonist', 'clarinetist', 'oboeist', 'bassoonist', 'harpist', 'percussionist', 'conductor', 'orchestra', 'choir', 'acapella', 'jazz', 'blues', 'rock', 'pop', 'hip hop', 'rap', 'r&b', 'soul', 'funk', 'disco', 'reggae', 'ska', 'punk', 'metal', 'heavy metal', 'death metal', 'black metal', 'thrash metal', 'power metal', 'progressive metal', 'folk', 'country', 'bluegrass', 'classical', 'baroque', 'romantic', 'modern', 'contemporary', 'electronic', 'edm', 'house', 'techno', 'trance', 'dubstep', 'drum and bass', 'ambient', 'chillout', 'lounge', 'world music', 'indian classical', 'carnatic', 'hindustani', 'ghazal', 'qawwali', 'bhajan', 'kirtan', 'filmi', 'bollywood', 'tollywood', 'kollywood', 'mollywood', 'bhojpuri', 'punjabi', 'gujarati', 'marathi', 'bengali', 'tamil', 'telugu', 'kannada', 'malayalam', 'odia', 'assamese', 'manipuri', 'naga', 'mizo', 'khasi', 'garo', 'bodo', 'karbi', 'dimasa', 'tiwa', 'rabha', 'sonowal', 'deori', 'mising', 'bodo', 'karbi', 'dimasa', 'tiwa', 'rabha', 'sonowal', 'deori', 'mising'],
    description: 'Music lovers and artists',
    color: 'linear-gradient(135deg,#ff9a9e 0%,#fecfef 100%)'
  },
  {
    id: 'sports',
    name: 'Sports Arena',
    icon: '⚽',
    keywords: ['sports', 'football', 'soccer', 'basketball', 'cricket', 'tennis', 'badminton', 'table tennis', 'volleyball', 'hockey', 'baseball', 'rugby', 'golf', 'swimming', 'athletics', 'marathon', 'triathlon', 'cycling', 'boxing', 'mma', 'ufc', 'wrestling', 'judo', 'karate', 'taekwondo', 'kung fu', 'wushu', 'kalaripayattu', 'silambam', 'gatka', 'thang-ta', 'cheibi', 'thoda', 'mallakhamb', 'yoga', 'pilates', 'gym', 'fitness', 'workout', 'bodybuilding', 'powerlifting', 'weightlifting', 'crossfit', 'calisthenics', 'parkour', 'free running', 'rock climbing', 'mountaineering', 'trekking', 'hiking', 'camping', 'rafting', 'kayaking', 'canoeing', 'sailing', 'surfing', 'skateboarding', 'roller skating', 'ice skating', 'skiing', 'snowboarding', 'ice hockey', 'curling', 'bobsled', 'luge', 'skeleton', 'biathlon', 'cross country skiing', 'alpine skiing', 'freestyle skiing', 'ski jumping', 'nordic combined', 'speed skating', 'figure skating', 'short track speed skating', 'ice dancing', 'synchronized skating', 'ice hockey', 'bandy', 'ringette', 'ice stock sport', 'broomball', 'curling', 'bobsled', 'luge', 'skeleton', 'biathlon', 'cross country skiing', 'alpine skiing', 'freestyle skiing', 'ski jumping', 'nordic combined', 'speed skating', 'figure skating', 'short track speed skating', 'ice dancing', 'synchronized skating'],
    description: 'Sports and fitness enthusiasts',
    color: 'linear-gradient(135deg,#a8edea 0%,#fed6e3 100%)'
  },
  {
    id: 'education',
    name: 'Learning Hub',
    icon: '📚',
    keywords: ['education', 'learn', 'study', 'course', 'academic', 'university', 'college', 'school', 'student', 'teacher', 'professor', 'lecturer', 'tutor', 'mentor', 'coach', 'trainer', 'instructor', 'facilitator', 'moderator', 'curator', 'librarian', 'researcher', 'scientist', 'philosopher', 'historian', 'geographer', 'economist', 'psychologist', 'sociologist', 'anthropologist', 'archaeologist', 'linguist', 'literary critic', 'art historian', 'musicologist', 'ethnomusicologist', 'dance historian', 'theatre historian', 'film historian', 'media historian', 'communication scholar', 'journalism', 'mass communication', 'public relations', 'advertising', 'marketing', 'branding', 'digital marketing', 'social media marketing', 'content marketing', 'email marketing', 'seo', 'sem', 'ppc', 'affiliate marketing', 'influencer marketing', 'viral marketing', 'guerrilla marketing', 'ambush marketing', 'stealth marketing', 'buzz marketing', 'word of mouth marketing', 'referral marketing', 'loyalty marketing', 'relationship marketing', 'database marketing', 'direct marketing', 'telemarketing', 'door to door marketing', 'catalog marketing', 'mail order marketing', 'e-commerce', 'online retail', 'digital commerce', 'mobile commerce', 'social commerce', 'voice commerce', 'visual commerce', 'augmented reality commerce', 'virtual reality commerce', 'mixed reality commerce', 'extended reality commerce', 'metaverse commerce', 'web3 commerce', 'blockchain commerce', 'cryptocurrency commerce', 'nft commerce', 'defi commerce', 'dao commerce', 'decentralized commerce', 'peer to peer commerce', 'marketplace', 'platform', 'aggregator', 'curator', 'discovery', 'recommendation', 'personalization', 'customization', 'tailoring', 'adaptation', 'modification', 'alteration', 'adjustment', 'fine tuning', 'optimization', 'improvement', 'enhancement', 'upgrade', 'update', 'refresh', 'renewal', 'revival', 'resurrection', 'rebirth', 'renaissance', 'reformation', 'revolution', 'evolution', 'transformation', 'metamorphosis', 'transmutation', 'transfiguration', 'transcendence', 'elevation', 'ascension', 'ascent', 'rise', 'climb', 'scaling', 'growth', 'expansion', 'extension', 'proliferation', 'multiplication', 'amplification', 'magnification', 'intensification', 'escalation', 'acceleration', 'speedup', 'hastening', 'quicken', 'expedite', 'facilitate', 'enable', 'empower', 'strengthen', 'fortify', 'reinforce', 'support', 'sustain', 'maintain', 'preserve', 'conserve', 'protect', 'guard', 'defend', 'shield', 'shelter', 'harbor', 'harbour', 'refuge', 'sanctuary', 'asylum', 'haven', 'retreat', 'resort', 'hideaway', 'hideout', 'lair', 'den', 'nest', 'burrow', 'hole', 'cave', 'grotto', 'cavern', 'tunnel', 'passage', 'corridor', 'hallway', 'aisle', 'path', 'way', 'road', 'street', 'avenue', 'boulevard', 'highway', 'freeway', 'expressway', 'motorway', 'autobahn', 'autostrada', 'autoroute', 'autopista', 'autocesta', 'autoput', 'autopista', 'autostrada', 'autoroute', 'autopista', 'autocesta', 'autoput'],
    description: 'Educational content and learning',
    color: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)'
  }
];

function categorizeGroupChat(name, description = '', tags = []) {
  const text = `${name} ${description} ${tags.join(' ')}`.toLowerCase();
  const matchedCategories = [];

  GROUP_CHAT_CATEGORIES.forEach(category => {
    const hasMatch = category.keywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
    if (hasMatch) {
      matchedCategories.push(category);
    }
  });

  return matchedCategories;
}

function getCategoryIcon(categoryId) {
  const category = GROUP_CHAT_CATEGORIES.find(cat => cat.id === categoryId);
  return category?.icon || '💬';
}

function getCategoryColor(categoryId) {
  const category = GROUP_CHAT_CATEGORIES.find(cat => cat.id === categoryId);
  return category?.color || 'linear-gradient(135deg,#1f2937 0%,#0b0f19 100%)';
}

function getCategoryName(categoryId) {
  const category = GROUP_CHAT_CATEGORIES.find(cat => cat.id === categoryId);
  return category?.name || 'Community';
}

function getCategoryDescription(categoryId) {
  const category = GROUP_CHAT_CATEGORIES.find(cat => cat.id === categoryId);
  return category?.description || 'Connect with the community';
}

export {
  GROUP_CHAT_CATEGORIES,
  categorizeGroupChat,
  getCategoryIcon,
  getCategoryColor,
  getCategoryName,
  getCategoryDescription
};
