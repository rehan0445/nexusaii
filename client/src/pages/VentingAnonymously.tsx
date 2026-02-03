import React from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../components/SEO';
import { MessageCircle, Shield, Users, Heart, Moon, Lock } from 'lucide-react';

/**
 * Venting Landing Page - White-hat SEO Bridge
 * Target Keywords: how to vent anonymously, anonymous venting, venting room, emotional release
 */
const VentingAnonymously: React.FC = () => {
  useSEO({
    title: 'How to Vent Anonymously – Free Anonymous Venting Room for Students | Nexus',
    description: 'Safe space to vent anonymously about college stress, work drama, relationships, and mental health. Free anonymous venting room with no judgment. Share your feelings safely.',
    keywords: 'how to vent anonymously, anonymous venting, venting room, anonymous venting site, safe space to vent, emotional release, mental health venting, college stress venting, work stress anonymous',
    canonical: 'https://www.nexuschat.in/venting-anonymously',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'How to Vent Anonymously',
      description: 'Free anonymous venting room for students and young adults to share feelings without judgment',
      url: 'https://www.nexuschat.in/venting-anonymously',
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <MessageCircle size={64} className="text-blue-200" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Vent Anonymously, Safely
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            A judgment-free space to release emotions, share struggles, and connect with others who understand. Completely anonymous.
          </p>
          
          {/* Answer Capsule */}
          <div className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl p-6 mb-8 text-left max-w-3xl mx-auto">
            <p className="text-white font-semibold text-lg">
              🎯 <strong>SAFE ANONYMOUS VENTING:</strong> Nexus provides free anonymous venting rooms where students and young adults can safely share emotions about college stress, work drama, relationship struggles, and mental health without revealing identity. Unlike social media, there's no account history or personal data exposure—just instant, judgment-free emotional release with supportive peer responses.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/arena/darkroom"
              className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-blue-50 transition-all shadow-xl hover:scale-105"
            >
              Enter Dark Room (Anonymous Venting)
            </Link>
            <Link
              to="/write-confession"
              className="bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-blue-800 transition-all shadow-xl border-2 border-white"
            >
              Write Anonymous Confession
            </Link>
          </div>
        </div>
      </div>

      {/* Why Vent Anonymously Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Why Anonymous Venting Helps
        </h2>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-2xl transition-shadow">
            <Shield size={56} className="mx-auto mb-4 text-blue-600" />
            <h3 className="text-2xl font-bold mb-4">100% Anonymous</h3>
            <p className="text-gray-600 text-lg">
              No email, no phone number, no account required. Your identity is completely protected.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-2xl transition-shadow">
            <Heart size={56} className="mx-auto mb-4 text-pink-600" />
            <h3 className="text-2xl font-bold mb-4">No Judgment</h3>
            <p className="text-gray-600 text-lg">
              Share your darkest thoughts, biggest fears, or daily frustrations without fear of criticism.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-2xl transition-shadow">
            <Users size={56} className="mx-auto mb-4 text-purple-600" />
            <h3 className="text-2xl font-bold mb-4">Supportive Community</h3>
            <p className="text-gray-600 text-lg">
              Connect with others facing similar struggles. You're not alone.
            </p>
          </div>
        </div>

        {/* What to Vent About */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">What Can You Vent About?</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold mb-3 text-blue-600">🎓 College & School Stress</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Overwhelming academic pressure</li>
                <li>• Exam anxiety and test stress</li>
                <li>• Difficult professors or teachers</li>
                <li>• Feeling behind or inadequate</li>
                <li>• Career uncertainty and fear</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold mb-3 text-purple-600">💼 Work & Career Frustrations</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Toxic work environment</li>
                <li>• Difficult coworkers or bosses</li>
                <li>• Burnout and exhaustion</li>
                <li>• Feeling unappreciated</li>
                <li>• Job search struggles</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold mb-3 text-pink-600">💔 Relationships & Dating</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Breakup pain and heartache</li>
                <li>• Unrequited love or crushes</li>
                <li>• Toxic relationships</li>
                <li>• Loneliness and isolation</li>
                <li>• Dating app frustrations</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold mb-3 text-indigo-600">🧠 Mental Health & Emotions</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Anxiety and panic attacks</li>
                <li>• Depression and sadness</li>
                <li>• Feeling overwhelmed</li>
                <li>• Self-doubt and insecurity</li>
                <li>• Anger and frustration</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold mb-3 text-green-600">👨‍👩‍👧 Family Issues</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Overbearing or controlling parents</li>
                <li>• Sibling conflicts</li>
                <li>• Family expectations and pressure</li>
                <li>• Communication breakdowns</li>
                <li>• Feeling misunderstood at home</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold mb-3 text-red-600">😔 Social & Friendship Drama</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Friend betrayals and conflicts</li>
                <li>• Feeling left out or excluded</li>
                <li>• Social anxiety</li>
                <li>• Difficult roommates</li>
                <li>• Loneliness in crowds</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">How Anonymous Venting Works on Nexus</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Choose Your Venting Space</h3>
                <p className="text-gray-700">
                  <strong>Dark Room:</strong> Real-time anonymous chat for immediate venting and peer support.<br />
                  <strong>Confessions:</strong> Post written vents that stay forever for others to read and respond to.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Share Anonymously</h3>
                <p className="text-gray-700">
                  No login required. No email. No personal information. Just start venting. Your identity is 100% protected.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Connect & Heal</h3>
                <p className="text-gray-700">
                  Receive support from others who understand. Share advice. Realize you're not alone in your struggles.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Feel Better</h3>
                <p className="text-gray-700">
                  Studies show that writing about emotions and sharing struggles reduces stress, anxiety, and depression. Venting works.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">Benefits of Anonymous Venting</h3>
            <ul className="space-y-3 text-gray-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span><strong>Emotional Release:</strong> Get feelings out instead of bottling them up</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span><strong>Stress Reduction:</strong> Lower anxiety and mental burden</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span><strong>Perspective Gain:</strong> See your situation more clearly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span><strong>Community Support:</strong> Feel less alone in struggles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span><strong>No Consequences:</strong> Speak freely without real-world impact</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-pink-100 to-red-100 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">Why Nexus for Venting?</h3>
            <ul className="space-y-3 text-gray-800">
              <li className="flex items-start gap-2">
                <span className="text-pink-600">★</span>
                <span><strong>True Anonymity:</strong> Unlike Reddit, no account history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-600">★</span>
                <span><strong>Active Community:</strong> 30k+ students vent here monthly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-600">★</span>
                <span><strong>Safe Moderation:</strong> Campus Ambassadors ensure respectful space</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-600">★</span>
                <span><strong>Multiple Formats:</strong> Real-time chat or written confessions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-600">★</span>
                <span><strong>100% Free:</strong> No premium features or subscriptions</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-12 text-center mb-16">
          <Moon size={64} className="mx-auto mb-6 text-blue-200" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Release What's Weighing You Down?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students venting anonymously every day. It's free, safe, and judgment-free.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/arena/darkroom"
              className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-blue-50 transition-all shadow-xl"
            >
              Start Venting Now
            </Link>
            <Link
              to="/campus/general/confessions"
              className="bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-blue-800 transition-all shadow-xl border-2 border-white"
            >
              Read Others' Vents
            </Link>
          </div>
        </div>

        {/* Mental Health Resources */}
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <Lock size={32} className="text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold mb-3 text-yellow-800">If You're in Crisis</h3>
              <p className="text-gray-800 mb-4">
                While venting helps with everyday stress, if you're experiencing suicidal thoughts, self-harm urges, or severe mental health crisis, please reach out to professional help:
              </p>
              <ul className="space-y-2 text-gray-800">
                <li><strong>National Crisis Hotline:</strong> Call or text <strong>988</strong></li>
                <li><strong>Crisis Text Line:</strong> Text <strong>HOME</strong> to <strong>741741</strong></li>
                <li><strong>Campus Counseling:</strong> Visit your university's counseling center</li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">
                Nexus is peer support, not professional therapy. For serious mental health issues, always consult licensed professionals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VentingAnonymously;
