import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import nexusLogo from "../assets/nexus-logo.png";

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-[#A1A1AA] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <img src={nexusLogo} alt="Nexus" className="h-8 w-auto" />
          <h1 className="text-xl font-bold text-[#A855F7]">Privacy Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-[#1A1A1A] backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl">
          <div className="prose prose-invert max-w-none">
            <h1 className="text-3xl font-bold text-[#A855F7] mb-4">Privacy Policy</h1>
            <p className="text-[#A1A1AA] mb-6">
              <strong>Effective Date:</strong> October 11, 2025
            </p>

            <p className="text-[#A1A1AA] mb-6">
              Welcome to <strong>Nexus</strong>. Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services.
            </p>

            <hr className="border-white/10 my-6" />

            <h2 className="text-2xl font-bold text-white mb-3">1. Information We Collect</h2>
            <h3 className="text-xl font-semibold text-white mb-2">1.1 Personal Information</h3>
            <p className="text-[#A1A1AA] mb-2">When you register for Nexus, we may collect:</p>
            <ul className="list-disc list-inside text-[#A1A1AA] mb-4 space-y-1 ml-4">
              <li>Email address</li>
              <li>Name (display name)</li>
              <li>Profile information (optional)</li>
              <li>Account credentials</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-2">1.2 Usage Data</h3>
            <p className="text-[#A1A1AA] mb-2">We automatically collect certain information when you use Nexus:</p>
            <ul className="list-disc list-inside text-[#A1A1AA] mb-4 space-y-1 ml-4">
              <li>Device information (device type, operating system)</li>
              <li>IP address and location data</li>
              <li>App usage analytics and interactions</li>
              <li>Feature usage patterns</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-2">1.3 Content Data</h3>
            <ul className="list-disc list-inside text-[#A1A1AA] mb-6 space-y-1 ml-4">
              <li>Messages in group chats</li>
              <li>Confessions posted (anonymous)</li>
              <li>AI Companion conversations</li>
              <li>User-generated content</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mb-3">2. How We Use Your Information</h2>
            <p className="text-[#A1A1AA] mb-2">We use the collected information to:</p>
            <ul className="list-disc list-inside text-[#A1A1AA] mb-6 space-y-1 ml-4">
              <li>Provide, operate, and maintain the Platform</li>
              <li>Improve user experience and personalize content</li>
              <li>Process registrations and manage accounts</li>
              <li>Send notifications and updates</li>
              <li>Monitor for security threats and violations</li>
              <li>Analyze usage patterns and app performance</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mb-3">3. Data Sharing and Disclosure</h2>
            <h3 className="text-xl font-semibold text-white mb-2">3.1 We Do Not Sell Your Data</h3>
            <p className="text-[#A1A1AA] mb-4">Nexus does not sell, rent, or trade your personal information to third parties for marketing purposes.</p>

            <h3 className="text-xl font-semibold text-white mb-2">3.2 Service Providers</h3>
            <p className="text-[#A1A1AA] mb-4">We may share data with trusted third-party service providers who assist in operating our Platform (e.g., hosting, analytics, AI processing). These providers are bound by confidentiality agreements.</p>

            <h3 className="text-xl font-semibold text-white mb-2">3.3 Legal Requirements</h3>
            <p className="text-[#A1A1AA] mb-6">We may disclose information if required by law, court order, or to protect the rights, property, or safety of Nexus, our users, or others.</p>

            <h2 className="text-2xl font-bold text-white mb-3">4. Anonymous Features</h2>
            <p className="text-[#A1A1AA] mb-2">4.1 <strong>Confessions:</strong> Posted anonymously. We do not link confessions to identifiable users unless required for safety or legal reasons.</p>
            <p className="text-[#A1A1AA] mb-2">4.2 <strong>Dark Room:</strong> Messages are temporary and deleted when users leave. We do not store these messages permanently.</p>
            <p className="text-[#A1A1AA] mb-6">4.3 However, screenshots and external recordings are beyond our control.</p>

            <h2 className="text-2xl font-bold text-white mb-3">5. AI Companion Data</h2>
            <p className="text-[#A1A1AA] mb-2">5.1 Conversations with AI Companion are processed to generate responses.</p>
            <p className="text-[#A1A1AA] mb-2">5.2 We do not manually review AI conversations unless flagged for policy violations.</p>
            <p className="text-[#A1A1AA] mb-6">5.3 AI data may be used to improve model performance in an anonymized and aggregated manner.</p>

            <h2 className="text-2xl font-bold text-white mb-3">6. Data Security</h2>
            <p className="text-[#A1A1AA] mb-2">We implement industry-standard security measures including:</p>
            <ul className="list-disc list-inside text-[#A1A1AA] mb-2 space-y-1 ml-4">
              <li>Encrypted data transmission (SSL/TLS)</li>
              <li>Secure authentication mechanisms</li>
              <li>Regular security audits</li>
              <li>Access controls and monitoring</li>
            </ul>
            <p className="text-[#A1A1AA] mb-6">However, no system is 100% secure. Use Nexus at your own risk.</p>

            <h2 className="text-2xl font-bold text-white mb-3">7. Data Retention</h2>
            <p className="text-[#A1A1AA] mb-2">7.1 We retain personal data as long as your account is active or as needed to provide services.</p>
            <p className="text-[#A1A1AA] mb-2">7.2 Deleted accounts and content may be retained for legal compliance or backup purposes for a limited period.</p>
            <p className="text-[#A1A1AA] mb-6">7.3 Dark Room messages are deleted immediately upon session exit.</p>

            <h2 className="text-2xl font-bold text-white mb-3">8. Your Rights</h2>
            <p className="text-[#A1A1AA] mb-2">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc list-inside text-[#A1A1AA] mb-6 space-y-1 ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for data processing</li>
              <li>Object to certain data uses</li>
              <li>Export your data (data portability)</li>
            </ul>
            <p className="text-[#A1A1AA] mb-6">
              To exercise these rights, contact us at{" "}
              <a href="mailto:nexusschats@gmail.com" className="text-[#A855F7] hover:text-[#A855F7]/80 underline">
                nexusschats@gmail.com
              </a>
            </p>

            <h2 className="text-2xl font-bold text-white mb-3">9. Cookies and Tracking</h2>
            <p className="text-[#A1A1AA] mb-2">We may use cookies, web beacons, and similar technologies to:</p>
            <ul className="list-disc list-inside text-[#A1A1AA] mb-6 space-y-1 ml-4">
              <li>Maintain session state</li>
              <li>Remember user preferences</li>
              <li>Analyze app usage and performance</li>
              <li>Deliver personalized content</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mb-3">10. Third-Party Links</h2>
            <p className="text-[#A1A1AA] mb-6">Nexus may contain links to third-party websites or services. We are not responsible for their privacy practices. Please review their policies before sharing information.</p>

            <h2 className="text-2xl font-bold text-white mb-3">11. Children's Privacy</h2>
            <p className="text-[#A1A1AA] mb-6">Nexus is not intended for users under 18 years of age. We do not knowingly collect data from minors. If we learn that we have collected personal information from a child, we will promptly delete it.</p>

            <h2 className="text-2xl font-bold text-white mb-3">12. International Users</h2>
            <p className="text-[#A1A1AA] mb-6">Your data may be transferred to and processed in India or other jurisdictions. By using Nexus, you consent to such transfers in compliance with applicable data protection laws.</p>

            <h2 className="text-2xl font-bold text-white mb-3">13. Changes to This Privacy Policy</h2>
            <p className="text-[#A1A1AA] mb-6">We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last Updated" date. Continued use of Nexus after changes constitutes acceptance of the revised policy.</p>

            <h2 className="text-2xl font-bold text-white mb-3">14. Contact Us</h2>
            <p className="text-[#A1A1AA] mb-6">
              For questions, concerns, or requests regarding this Privacy Policy, please contact us at:<br />
              <a href="mailto:nexusschats@gmail.com" className="text-[#A855F7] hover:text-[#A855F7]/80 underline">
                nexusschats@gmail.com
              </a>
            </p>

            <hr className="border-white/10 my-6" />

            <p className="text-[#A1A1AA] text-sm text-center">
              By using Nexus, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

