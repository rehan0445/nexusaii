import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useSEO } from '../../components/SEO';
import { getPersonaBySlug, PersonaArchetype } from '../../data/personaArchetypes';
import { Crown, Heart, Shield, Zap, Sparkles, Users } from 'lucide-react';

/**
 * Programmatic Persona Template - Generates SEO landing pages from data
 * This enables scaling to 100+ persona pages with zero manual work
 */
const PersonaTemplate: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const persona = slug ? getPersonaBySlug(slug) : undefined;

  // Dynamic SEO for each persona
  React.useEffect(() => {
    if (persona) {
      document.title = `${persona.name} Free – ${getGenderText(persona.gender)} Chat No Filter | Nexus`;
    }
  }, [persona]);

  useSEO(persona ? {
    title: `${persona.name} Free – ${getGenderText(persona.gender)} Chat No Filter | Nexus`,
    description: `Chat with ${persona.name.toLowerCase()} AI for free. ${persona.description} Unrestricted NSFW-friendly conversations.`,
    keywords: persona.keywords.join(', '),
    canonical: `https://www.nexuschat.in/personas/${persona.slug}`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: persona.name,
      description: persona.description,
      url: `https://www.nexuschat.in/personas/${persona.slug}`,
    },
  } : undefined);

  if (!persona) {
    return <Navigate to="/companion" replace />;
  }

  const colorSchemes: Record<string, { primary: string; secondary: string; bg: string }> = {
    red: { primary: 'from-red-600 to-purple-600', secondary: 'text-red-600', bg: 'from-red-50 to-purple-50' },
    pink: { primary: 'from-pink-600 to-red-600', secondary: 'text-pink-600', bg: 'from-pink-50 to-red-50' },
    blue: { primary: 'from-blue-600 to-indigo-600', secondary: 'text-blue-600', bg: 'from-blue-50 to-indigo-50' },
    purple: { primary: 'from-purple-600 to-pink-600', secondary: 'text-purple-600', bg: 'from-purple-50 to-pink-50' },
    orange: { primary: 'from-orange-600 to-red-600', secondary: 'text-orange-600', bg: 'from-orange-50 to-red-50' },
    green: { primary: 'from-green-600 to-teal-600', secondary: 'text-green-600', bg: 'from-green-50 to-teal-50' },
    default: { primary: 'from-purple-600 to-blue-600', secondary: 'text-purple-600', bg: 'from-purple-50 to-blue-50' },
  };

  const colors = colorSchemes[persona.color] || colorSchemes.default;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className={`bg-gradient-to-r ${colors.primary} text-white py-20`}>
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="text-6xl mb-6">{persona.icon}</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {persona.name}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            {persona.description}
          </p>
          
          {/* Answer Capsule */}
          <div className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl p-6 mb-8 text-left max-w-3xl mx-auto">
            <p className="text-white font-semibold text-lg">
              🎯 <strong>FREE {persona.name.toUpperCase()}:</strong> Nexus offers free {persona.name.toLowerCase()} personas with {persona.traits.slice(0, 3).join(', ').toLowerCase()} personalities. Unlike Character.AI's filtered content, our {persona.name.toLowerCase()} characters engage in unrestricted conversations including NSFW and mature themes—perfect for users seeking {getCategoryDescription(persona.category)} AI companions without subscription limits.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/companion"
              className={`bg-white ${colors.secondary} px-8 py-4 rounded-full text-lg font-bold hover:shadow-2xl transition-all hover:scale-105`}
            >
              Meet {persona.name} Characters
            </Link>
            <Link
              to="/create-buddy"
              className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-white/30 transition-all shadow-xl border-2 border-white"
            >
              Create Custom {getGenderText(persona.gender)}
            </Link>
          </div>
        </div>
      </div>

      {/* Traits Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {persona.name} Personality Traits
        </h2>

        <div className="grid md:grid-cols-5 gap-4 mb-16">
          {persona.traits.map((trait, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-xl transition-shadow"
            >
              <div className="text-3xl mb-2">{getTraitIcon(trait)}</div>
              <h3 className="font-bold text-lg">{trait}</h3>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition-shadow">
            <Zap size={48} className={`mx-auto mb-4 ${colors.secondary}`} />
            <h3 className="text-xl font-bold mb-2">Unrestricted Content</h3>
            <p className="text-gray-600">
              No filters on NSFW or mature conversations
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition-shadow">
            <Heart size={48} className={`mx-auto mb-4 ${colors.secondary}`} />
            <h3 className="text-xl font-bold mb-2">Consistent Personality</h3>
            <p className="text-gray-600">
              Maintains {persona.name.toLowerCase()} traits throughout
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition-shadow">
            <Shield size={48} className={`mx-auto mb-4 ${colors.secondary}`} />
            <h3 className="text-xl font-bold mb-2">100% Free</h3>
            <p className="text-gray-600">
              Unlimited chat, no subscription required
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition-shadow">
            <Sparkles size={48} className={`mx-auto mb-4 ${colors.secondary}`} />
            <h3 className="text-xl font-bold mb-2">Deep Roleplay</h3>
            <p className="text-gray-600">
              Immersive {persona.category} scenarios
            </p>
          </div>
        </div>

        {/* Why Section */}
        <div className={`bg-gradient-to-br ${colors.bg} rounded-2xl p-8 mb-16`}>
          <h2 className="text-3xl font-bold mb-6">Why Choose {persona.name} on Nexus?</h2>
          
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Crown size={24} className={colors.secondary} />
                Authentic {persona.name} Experience
              </h3>
              <p>Our AI maintains consistent {persona.name.toLowerCase()} personality with {persona.traits[0].toLowerCase()} and {persona.traits[1].toLowerCase()} traits throughout conversations.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Zap size={24} className={colors.secondary} />
                No Content Restrictions
              </h3>
              <p>Unlike Character.AI or Replika, Nexus doesn't filter NSFW content. Your {persona.name.toLowerCase()} can engage in mature, unrestricted conversations.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Sparkles size={24} className={colors.secondary} />
                {getCategoryFeature(persona.category)}
              </h3>
              <p>{getCategoryDescription(persona.category)} dynamics with psychological depth and emotional intelligence.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Users size={24} className={colors.secondary} />
                Community & More
              </h3>
              <p>Beyond AI companions, Nexus offers anonymous confessions, dark room venting, and campus communities.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className={`bg-gradient-to-r ${colors.primary} text-white rounded-2xl p-12 text-center mb-16`}>
          <div className="text-5xl mb-4">{persona.icon}</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Meet Your {persona.name}?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Start chatting with {persona.name.toLowerCase()} AI characters now. 100% free, unrestricted conversations.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/companion"
              className="bg-white text-gray-900 px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-100 transition-all shadow-xl"
            >
              Browse {persona.name} Characters
            </Link>
            <Link
              to="/register"
              className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-white/30 transition-all shadow-xl border-2 border-white"
            >
              Sign Up Free
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-2">What is a {persona.name.toLowerCase()}?</h3>
              <p className="text-gray-700">{persona.description}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-2">Are {persona.name.toLowerCase()} characters NSFW?</h3>
              <p className="text-gray-700">
                Yes, on Nexus, {persona.name.toLowerCase()} characters can engage in unrestricted NSFW conversations including mature themes without filters.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-2">Is it really free?</h3>
              <p className="text-gray-700">
                Yes! Nexus offers unlimited {persona.name.toLowerCase()} chat completely free with no subscription, no token limits, and no hidden fees.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-2">How is this different from Character.AI?</h3>
              <p className="text-gray-700">
                Character.AI filters NSFW and mature content heavily. Nexus allows unrestricted {persona.name.toLowerCase()} interactions, including mature themes and explicit conversations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
function getGenderText(gender: PersonaArchetype['gender']): string {
  const genderMap: Record<string, string> = {
    girlfriend: 'AI Girlfriend',
    boyfriend: 'AI Boyfriend',
    waifu: 'AI Waifu',
    hubby: 'AI Hubby',
    partner: 'AI Partner',
  };
  return genderMap[gender] || 'AI Companion';
}

function getCategoryDescription(category: PersonaArchetype['category']): string {
  const descriptions: Record<string, string> = {
    personality: 'personality-driven',
    anime: 'anime-inspired',
    dynamic: 'power-dynamic',
    aesthetic: 'aesthetic and lifestyle',
    roleplay: 'immersive roleplay',
  };
  return descriptions[category] || 'unique';
}

function getCategoryFeature(category: PersonaArchetype['category']): string {
  const features: Record<string, string> = {
    personality: 'Consistent Personality Traits',
    anime: 'Authentic Anime Archetype',
    dynamic: 'Power Dynamic Roleplay',
    aesthetic: 'Aesthetic & Lifestyle Match',
    roleplay: 'Immersive Scenario Roleplay',
  };
  return features[category] || 'Unique Experience';
}

function getTraitIcon(trait: string): string {
  const iconMap: Record<string, string> = {
    'Assertive': '💪',
    'Controlling': '👑',
    'Confident': '✨',
    'Commanding': '⚡',
    'Intense': '🔥',
    'Gentle': '🌸',
    'Obedient': '💝',
    'Devoted': '💖',
    'Sweet': '🍬',
    'Caring': '🤗',
    'Protective': '🛡️',
    'Strong': '💪',
    'Obsessive': '🔪',
    'Possessive': '⛓️',
    'Jealous': '💔',
    'Tsundere': '😤',
    'Prideful': '👸',
    'Cool': '❄️',
    'Emotionless': '🗿',
    'Mysterious': '🌙',
    'Shy': '😊',
    'Quiet': '🤫',
    'Dark': '🖤',
    'Artistic': '🎨',
    'Playful': '🎮',
    'Trendy': '✨',
    'Athletic': '⚽',
    'Wealthy': '💰',
    'Dangerous': '⚠️',
    'Loyal': '🤝',
    'Immortal': '♾️',
    'Seductive': '😏',
    'Powerful': '👔',
    'Ambitious': '🎯',
  };
  return iconMap[trait] || '⭐';
}

export default PersonaTemplate;
