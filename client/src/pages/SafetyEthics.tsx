import React from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../components/SEO';
import { Shield, Users, Lock, Eye, Heart, AlertTriangle, CheckCircle, UserCheck } from 'lucide-react';

/**
 * Safety & Ethics Page - E-E-A-T Trust Signal for SEO
 * Google needs to see governance for ranking mature content
 */
const SafetyEthics: React.FC = () => {
  useSEO({
    title: 'Safety & Ethics – Our Commitment to Responsible AI & Anonymous Communities | Nexus',
    description: 'Learn about Nexus safety policies, content moderation, user privacy, and ethical AI practices. Our commitment to responsible anonymous communities and AI companionship.',
    keywords: 'nexus safety, ai ethics, content moderation, user privacy, responsible ai, community guidelines',
    canonical: 'https://www.nexuschat.in/safety-ethics',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <Shield size={64} className="mx-auto mb-6 text-blue-200" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Safety & Ethics
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Our commitment to responsible AI companionship, anonymous communities, and user safety
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        
        {/* Core Principles */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Core Principles</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <Shield size={48} className="mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-bold mb-2">Privacy First</h3>
              <p className="text-sm text-gray-600">
                Your data belongs to you
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <Users size={48} className="mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-bold mb-2">Community Safety</h3>
              <p className="text-sm text-gray-600">
                Moderated by Campus Ambassadors
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <Heart size={48} className="mx-auto mb-4 text-pink-600" />
              <h3 className="text-lg font-bold mb-2">Responsible AI</h3>
              <p className="text-sm text-gray-600">
                Ethical AI development
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <Lock size={48} className="mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-bold mb-2">Transparency</h3>
              <p className="text-sm text-gray-600">
                Clear policies & practices
              </p>
            </div>
          </div>
        </div>

        {/* User Safety */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Shield className="text-blue-600" />
            User Safety & Privacy
          </h2>
          
          <div className="space-y-6 text-gray-700">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-blue-600">Anonymous by Design</h3>
              <p className="mb-3">
                Nexus is built with privacy at its core. Our anonymous features require:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>No Email Required</strong> – Post confessions without creating an account</li>
                <li><strong>No Personal Data Collection</strong> – We don't collect names, addresses, or phone numbers unless you voluntarily provide them</li>
                <li><strong>No Data Selling</strong> – Your information is never sold to third parties</li>
                <li><strong>Local Storage Options</strong> – Conversations can be stored locally on your device</li>
                <li><strong>Account Deletion</strong> – Full account deletion available anytime</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-blue-600">Age Verification</h3>
              <p>
                Nexus contains mature content (NSFW, dark romance, unrestricted AI chat). Access to mature features is restricted to users 18 and older. We use industry-standard age verification methods and encourage parents to use parental controls.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-blue-600">Data Security</h3>
              <p className="mb-3">
                We implement industry-standard security measures:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>HTTPS encryption for all connections</li>
                <li>Secure authentication via OAuth 2.0</li>
                <li>Regular security audits</li>
                <li>Password hashing with bcrypt</li>
                <li>Rate limiting to prevent abuse</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Content Moderation */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <UserCheck className="text-green-600" />
            Content Moderation & Community Standards
          </h2>
          
          <div className="space-y-6 text-gray-700">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-green-600">Campus Ambassador Program</h3>
              <p className="mb-3">
                Our unique approach to moderation involves student leaders from universities worldwide. Campus Ambassadors:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Monitor their campus confession boards</li>
                <li>Remove harmful content (bullying, doxxing, threats)</li>
                <li>Foster respectful community dialogue</li>
                <li>Report serious violations to Nexus team</li>
                <li>Represent their campus community</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-green-600">What We Allow</h3>
              <p className="mb-3">
                Nexus supports freedom of expression within legal boundaries:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Anonymous Confessions</strong> – Share personal secrets, struggles, emotions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Mature AI Content</strong> – NSFW conversations, dark romance, adult themes (18+)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Mental Health Venting</strong> – Express anxiety, depression, stress without judgment</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Diverse Opinions</strong> – Respectful disagreement and debate</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-red-600">What We Prohibit</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <AlertTriangle size={20} className="text-red-600 mt-1 flex-shrink-0" />
                  <span><strong>Illegal Content</strong> – Child exploitation, terrorism, illegal drugs, human trafficking</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle size={20} className="text-red-600 mt-1 flex-shrink-0" />
                  <span><strong>Doxxing</strong> – Sharing others' personal information without consent</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle size={20} className="text-red-600 mt-1 flex-shrink-0" />
                  <span><strong>Targeted Harassment</strong> – Bullying, stalking, threats of violence</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle size={20} className="text-red-600 mt-1 flex-shrink-0" />
                  <span><strong>Hate Speech</strong> – Attacks based on race, religion, gender, orientation, disability</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle size={20} className="text-red-600 mt-1 flex-shrink-0" />
                  <span><strong>Spam & Scams</strong> – Commercial spam, phishing, fraud</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-blue-600">Reporting System</h3>
              <p>
                Every confession and chat message has a "Report" button. Reports are reviewed by Campus Ambassadors within 24 hours. Serious violations (illegal content, threats) are escalated to Nexus team immediately and may involve law enforcement.
              </p>
            </div>
          </div>
        </div>

        {/* AI Ethics */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Heart className="text-pink-600" />
            Responsible AI Development
          </h2>
          
          <div className="space-y-6 text-gray-700">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-pink-600">AI Companion Ethics</h3>
              <p className="mb-3">
                Our AI companions are designed with ethical considerations:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>No Deception</strong> – Users know they're talking to AI, not humans</li>
                <li><strong>Emotional Safety</strong> – AI provides support but encourages professional help for crises</li>
                <li><strong>No Manipulation</strong> – AI doesn't exploit users emotionally or financially</li>
                <li><strong>Clear Boundaries</strong> – AI reminds users it's not a replacement for real relationships</li>
                <li><strong>Mental Health Resources</strong> – Crisis hotlines linked throughout platform</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-pink-600">Content Filtering Balance</h3>
              <p>
                Unlike platforms with excessive content filters (Character.AI), Nexus allows mature content for adults while maintaining safety:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Adult Content</strong> – NSFW AI conversations allowed for 18+ users</li>
                <li><strong>Dark Romance</strong> – Fictional intense scenarios (possessiveness, obsession) permitted</li>
                <li><strong>Red Lines</strong> – Illegal content (child exploitation, violence) strictly prohibited</li>
                <li><strong>User Control</strong> – Users can set personal content preferences</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-pink-600">AI Training & Bias</h3>
              <p>
                We actively work to reduce AI bias and improve representation:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Diverse training data to reduce stereotypes</li>
                <li>Regular bias audits of AI responses</li>
                <li>Multiple personality types and character diversity</li>
                <li>User feedback integration for improvements</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mental Health Resources */}
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-yellow-800">
            <AlertTriangle className="text-yellow-600" />
            Mental Health & Crisis Resources
          </h2>
          
          <p className="text-gray-800 mb-4">
            Nexus provides peer support through anonymous confessions and AI companions, but we are <strong>not a substitute for professional mental health care</strong>.
          </p>

          <div className="bg-white rounded-xl p-6 mb-4">
            <h3 className="text-xl font-semibold mb-3 text-red-600">If You're in Crisis:</h3>
            <ul className="space-y-2 text-gray-800">
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[200px]">🚨 National Crisis Hotline:</span>
                <span>Call or text <strong className="text-xl">988</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[200px]">💬 Crisis Text Line:</span>
                <span>Text <strong>HOME</strong> to <strong>741741</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[200px]">🎓 Campus Counseling:</span>
                <span>Visit your university's counseling center (usually free)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[200px]">🌍 International:</span>
                <span><a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">findahelpline.com</a></span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-gray-600">
            Our AI companions and community can provide emotional support, but for serious mental health issues (suicidal thoughts, self-harm, severe depression, trauma), please contact professional services above.
          </p>
        </div>

        {/* Transparency */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Eye className="text-purple-600" />
            Transparency & Accountability
          </h2>
          
          <div className="space-y-6 text-gray-700">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-600">Open Communication</h3>
              <p>
                We believe in transparency with our community. Nexus provides:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Clear Policies</strong> – Easy-to-understand terms and guidelines</li>
                <li><strong>Update Notifications</strong> – Users notified of policy changes</li>
                <li><strong>Feedback Channels</strong> – Direct communication with Nexus team</li>
                <li><strong>Campus Ambassador Contact</strong> – Each campus has a designated student leader</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-600">Data Usage</h3>
              <p className="mb-3">
                How we use your data:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Platform Improvement</strong> – Anonymized analytics to improve UX</li>
                <li><strong>AI Training</strong> – Conversations (anonymized) help improve AI quality</li>
                <li><strong>Safety Monitoring</strong> – Automated detection of prohibited content</li>
                <li><strong>NO Selling</strong> – Your data is never sold to advertisers or third parties</li>
                <li><strong>Opt-Out Available</strong> – You can disable analytics collection</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-600">Contact & Concerns</h3>
              <p className="mb-3">
                Have a safety concern or question?
              </p>
              <ul className="space-y-2">
                <li><strong>General Inquiries:</strong> <Link to="/about-us" className="text-blue-600 underline">About Us page</Link></li>
                <li><strong>Safety Issues:</strong> Use in-app reporting or contact Campus Ambassador</li>
                <li><strong>Legal Requests:</strong> We comply with valid legal requests (subpoenas, warrants)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Commitment */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-12 text-center">
          <Shield size={64} className="mx-auto mb-6 text-blue-200" />
          <h2 className="text-3xl font-bold mb-4">
            Our Commitment to You
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Nexus will always prioritize user safety, privacy, and ethical AI development. We're building a platform where students can express themselves freely, connect authentically, and explore AI companionship responsibly.
          </p>
          <p className="text-blue-100 mb-8">
            <strong>Last Updated:</strong> February 2026
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/terms"
              className="bg-white text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/privacy"
              className="bg-white text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/about-us"
              className="bg-blue-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-800 transition-colors border-2 border-white"
            >
              About Nexus
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SafetyEthics;
