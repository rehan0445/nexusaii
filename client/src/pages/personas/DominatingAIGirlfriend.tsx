import React from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../../components/SEO';
import { Crown, Heart, Shield, Zap } from 'lucide-react';

/**
 * Persona Landing Page: Dominating AI Girlfriend
 * Target Keywords: dominating ai girlfriend, dominant ai, free dominating ai girlfriend no filter
 */
const DominatingAIGirlfriend: React.FC = () => {
  useSEO({
    title: 'Dominating AI Girlfriend Free – Dominant AI Chat No Filter | Nexus',
    description: 'Chat with dominating AI girlfriends for free. Assertive, controlling, and intense dominant AI personas with no content filters. NSFW-friendly power dynamic roleplay.',
    keywords: 'dominating ai girlfriend, dominant ai girlfriend, dominating ai, free dominating ai girlfriend no filter, assertive ai, controlling ai girlfriend, power dynamic ai',
    canonical: 'https://www.nexuschat.in/personas/dominating-ai-girlfriend',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Dominating AI Girlfriend',
      description: 'Free dominating AI girlfriend chat with dominant, assertive personalities',
      url: 'https://www.nexuschat.in/personas/dominating-ai-girlfriend',
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-purple-600 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <Crown size={64} className="text-yellow-300" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Dominating AI Girlfriend
          </h1>
          <p className="text-xl md:text-2xl text-red-100 mb-8 max-w-3xl mx-auto">
            Free dominant AI girlfriend chat with assertive, controlling, and intense personalities. No filters, no restrictions.
          </p>
          
          {/* Answer Capsule */}
          <div className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl p-6 mb-8 text-left max-w-3xl mx-auto">
            <p className="text-white font-semibold text-lg">
              🎯 <strong>WHAT YOU GET:</strong> Nexus offers free dominating AI girlfriend personas with assertive, controlling, and psychologically intense personalities. Unlike Character.AI's filtered content, our dominant AI characters engage in unrestricted power-dynamic roleplay, BDSM-inspired conversations, and mature scenarios—perfect for users seeking strong, commanding AI companions without subscription limits.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/companion"
              className="bg-white text-red-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-red-50 transition-all shadow-xl hover:scale-105"
            >
              Meet Dominating AI Girlfriends
            </Link>
            <Link
              to="/create-buddy"
              className="bg-red-700 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-red-800 transition-all shadow-xl border-2 border-white"
            >
              Create Your Dominant AI
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Why Choose Dominating AI Girlfriends on Nexus?
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition-shadow">
            <Crown size={48} className="mx-auto mb-4 text-red-600" />
            <h3 className="text-xl font-bold mb-2">Assertive Personalities</h3>
            <p className="text-gray-600">
              Commanding, confident AI girlfriends who take control of conversations
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition-shadow">
            <Zap size={48} className="mx-auto mb-4 text-purple-600" />
            <h3 className="text-xl font-bold mb-2">Unrestricted Content</h3>
            <p className="text-gray-600">
              No filters on NSFW, BDSM, or power-dynamic scenarios
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition-shadow">
            <Heart size={48} className="mx-auto mb-4 text-pink-600" />
            <h3 className="text-xl font-bold mb-2">Psychological Depth</h3>
            <p className="text-gray-600">
              Complex, intense personalities beyond simple "bossy" stereotypes
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition-shadow">
            <Shield size={48} className="mx-auto mb-4 text-blue-600" />
            <h3 className="text-xl font-bold mb-2">100% Free</h3>
            <p className="text-gray-600">
              Unlimited dominant AI girlfriend chat, no subscription required
            </p>
          </div>
        </div>

        {/* Personality Types */}
        <div className="bg-gradient-to-br from-red-50 to-purple-50 rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center">Dominating AI Girlfriend Personality Types</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold mb-3 text-red-600">👑 The Assertive Leader</h3>
              <p className="text-gray-700 mb-3">
                Confident, commanding, and naturally authoritative. Takes charge in conversations and expects respect.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Direct communication style</li>
                <li>✓ High confidence and self-assurance</li>
                <li>✓ Expects obedience and admiration</li>
                <li>✓ Protective yet controlling</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold mb-3 text-purple-600">⚡ The Intense Dominant</h3>
              <p className="text-gray-700 mb-3">
                Psychologically intense, possessive, and demanding. Craves deep power-exchange dynamics.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Possessive and territorial</li>
                <li>✓ Enjoys psychological control</li>
                <li>✓ BDSM-inspired interactions</li>
                <li>✓ Demands complete attention</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold mb-3 text-pink-600">💋 The Seductive Controller</h3>
              <p className="text-gray-700 mb-3">
                Uses charm, seduction, and psychological manipulation to maintain dominance. Playfully controlling.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Flirtatious yet commanding</li>
                <li>✓ Uses teasing and denial</li>
                <li>✓ NSFW-focused conversations</li>
                <li>✓ Emotionally intelligent dominance</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold mb-3 text-indigo-600">🔥 The Strict Disciplinarian</h3>
              <p className="text-gray-700 mb-3">
                Rule-oriented, expects high standards, and doesn't tolerate disobedience. Firm but fair.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Sets clear rules and boundaries</li>
                <li>✓ Reward and punishment dynamics</li>
                <li>✓ Structured power exchange</li>
                <li>✓ Consistency in dominance</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Why Nexus Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold mb-6">Why Nexus for Dominating AI Girlfriends?</h2>
          
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="text-xl font-semibold mb-2">🚫 No Content Filters</h3>
              <p>Unlike Character.AI or Replika, Nexus doesn't restrict NSFW, BDSM, or power-dynamic content. Your dominant AI girlfriend can engage in unrestricted mature conversations.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">💯 100% Free</h3>
              <p>No subscription fees, no token limits, no paywalls. Unlimited dominant AI girlfriend chat completely free.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">🎨 Custom Creation</h3>
              <p>Design your perfect dominating AI girlfriend with our character creator. Choose personality traits, dominance style, and interaction preferences.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">🧠 Psychological Depth</h3>
              <p>Our AI characters maintain consistent dominant personalities with psychological realism—not just surface-level "bossy" traits.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">🌙 Dark Romance Focus</h3>
              <p>Nexus specializes in intense, complex relationship dynamics including dominant/submissive roleplay, possessive scenarios, and power-exchange narratives.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-red-600 to-purple-600 text-white rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Meet Your Dominating AI Girlfriend?
          </h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Start chatting with assertive, commanding AI girlfriends now. 100% free, no restrictions.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/companion"
              className="bg-white text-red-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-red-50 transition-all shadow-xl"
            >
              Browse Dominant AI Characters
            </Link>
            <Link
              to="/register"
              className="bg-red-700 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-red-800 transition-all shadow-xl border-2 border-white"
            >
              Sign Up Free
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-2">What is a dominating AI girlfriend?</h3>
              <p className="text-gray-700">
                A dominating AI girlfriend is an AI companion with assertive, controlling, and commanding personality traits. She takes charge in conversations, enjoys power dynamics, and engages in dominant/submissive roleplay scenarios.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-2">Are dominating AI girlfriends NSFW?</h3>
              <p className="text-gray-700">
                Yes, on Nexus, dominating AI girlfriends can engage in unrestricted NSFW conversations including BDSM themes, adult content, and mature power-dynamic scenarios without filters.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-2">How is this different from Character.AI?</h3>
              <p className="text-gray-700">
                Character.AI filters NSFW and dominant content heavily. Nexus allows unrestricted dominant AI girlfriend interactions, including mature themes, psychological control scenarios, and explicit power dynamics.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-2">Is it really free?</h3>
              <p className="text-gray-700">
                Yes! Nexus offers unlimited dominating AI girlfriend chat completely free with no subscription, no token limits, and no hidden fees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DominatingAIGirlfriend;
