import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import nexusLogo from "../assets/nexus-logo.png";

const TermsAndConditions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <img src={nexusLogo} alt="Nexus" className="h-8 w-auto" />
          <h1 className="text-xl font-bold text-softgold-500">Terms & Conditions</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-zinc-800/50 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-zinc-700 shadow-2xl">
          <div className="prose prose-invert max-w-none">
            <h1 className="text-3xl font-bold text-softgold-500 mb-4">Terms and Conditions of Use</h1>
            <p className="text-zinc-400 mb-6">
              <strong>Effective Date:</strong> October 11, 2025
            </p>

            <p className="text-zinc-300 mb-6">
              Welcome to <strong>Nexus</strong> ("the Platform", "we", "our", or "us").
              These Terms and Conditions ("Terms") govern your access to and use of the Nexus mobile application, website, and associated services (collectively, "the Services").
              By registering, accessing, or using Nexus, you agree to be bound by these Terms and all applicable laws. If you do not agree, you must immediately discontinue using the Platform.
            </p>

            <hr className="border-zinc-700 my-6" />

            <h2 className="text-2xl font-bold text-white mb-3">1. Eligibility</h2>
            <p className="text-zinc-300 mb-2">1.1 You must be <strong>18 years of age or older</strong> to use Nexus. By creating an account, you represent and warrant that you are at least 18 years of age and have the legal capacity to enter into this agreement.</p>
            <p className="text-zinc-300 mb-6">1.2 The Platform is not intended for minors. We do not knowingly collect or process personal data from users under 18.</p>

            <h2 className="text-2xl font-bold text-white mb-3">2. Acceptance of Terms</h2>
            <p className="text-zinc-300 mb-2">2.1 These Terms constitute a binding agreement between you and Nexus regarding the use of the Platform and its features, including but not limited to <strong>Confessions</strong>, <strong>Dark Room</strong>, <strong>Companion</strong>, and <strong>Group Chats</strong>.</p>
            <p className="text-zinc-300 mb-6">2.2 We may modify or update these Terms periodically. Any updates will be posted on the Platform, and continued use after such posting shall constitute acceptance of the revised Terms.</p>

            <h2 className="text-2xl font-bold text-white mb-3">3. User Account and Security</h2>
            <p className="text-zinc-300 mb-2">3.1 You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.</p>
            <p className="text-zinc-300 mb-2">3.2 You agree to immediately notify Nexus of any unauthorized access or breach of security.</p>
            <p className="text-zinc-300 mb-6">3.3 Nexus shall not be liable for any loss or damage arising from unauthorized account use.</p>

            <h2 className="text-2xl font-bold text-white mb-3">4. Description of Services</h2>
            <p className="text-zinc-300 mb-2">4.1 <strong>Confessions:</strong> Allows users to post and read anonymous confessions. Posts may be visible to the community but are subject to moderation.</p>
            <p className="text-zinc-300 mb-2">4.2 <strong>Dark Room:</strong> Enables <strong>anonymous group texting</strong>. Messages within a Dark Room are <strong>temporary and deleted upon exit</strong> or after a session ends.</p>
            <p className="text-zinc-300 mb-2">4.3 <strong>Companion:</strong> Provides AI-based chat interaction for entertainment and emotional support purposes. AI conversations are <strong>not monitored by humans</strong> and do not constitute professional advice.</p>
            <p className="text-zinc-300 mb-6">4.4 <strong>Group Chats:</strong> Allows communication among verified users. Nexus reserves the right to moderate, restrict, or remove any group or user violating community standards.</p>

            <h2 className="text-2xl font-bold text-white mb-3">5. User Conduct</h2>
            <p className="text-zinc-300 mb-2">5.1 You agree to use the Platform only for lawful purposes.</p>
            <p className="text-zinc-300 mb-2">5.2 You shall not:</p>
            <ul className="list-disc list-inside text-zinc-300 mb-6 space-y-1 ml-4">
              <li>Post or transmit any unlawful, harmful, defamatory, obscene, or discriminatory content.</li>
              <li>Engage in harassment, bullying, impersonation, or intimidation of other users.</li>
              <li>Attempt to hack, decompile, or reverse-engineer any part of Nexus.</li>
              <li>Spread malware, spam, or unauthorized advertisements.</li>
              <li>Share personal information of others without consent.</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mb-3">6. Anonymous Features and Content Deletion</h2>
            <p className="text-zinc-300 mb-2">6.1 <strong>Confessions and Dark Room chats</strong> operate on anonymity. Nexus does not require identity disclosure for participation in these sections.</p>
            <p className="text-zinc-300 mb-2">6.2 <strong>Dark Room messages</strong> are automatically deleted when users leave or the session ends. Nexus does not store these messages permanently.</p>
            <p className="text-zinc-300 mb-2">6.3 Despite these measures, users acknowledge that screenshots, photographs, or external recordings cannot be completely prevented.</p>
            <p className="text-zinc-300 mb-6">6.4 Nexus disclaims all responsibility for third-party misuse of such captured content.</p>

            <h2 className="text-2xl font-bold text-white mb-3">7. AI Companion Disclaimer</h2>
            <p className="text-zinc-300 mb-2">7.1 The <strong>Companion</strong> feature uses AI-based natural language generation to simulate conversations for entertainment and emotional support.</p>
            <p className="text-zinc-300 mb-2">7.2 AI responses are <strong>automated</strong> and may not always be accurate, factual, or contextually appropriate.</p>
            <p className="text-zinc-300 mb-2">7.3 The AI Companion is <strong>not a substitute for professional mental health, medical, or legal advice.</strong></p>
            <p className="text-zinc-300 mb-6">7.4 Nexus disclaims all liability for any decisions, emotional distress, or actions taken based on AI responses.</p>

            <h2 className="text-2xl font-bold text-white mb-3">8. Content Ownership and License</h2>
            <p className="text-zinc-300 mb-2">8.1 You retain ownership of the content you create or share on Nexus.</p>
            <p className="text-zinc-300 mb-2">8.2 By posting or sharing any content, you grant Nexus a <strong>worldwide, royalty-free, perpetual, irrevocable license</strong> to use, modify, distribute, and display such content for the purpose of operating and improving the Platform.</p>
            <p className="text-zinc-300 mb-6">8.3 You represent that you have the necessary rights to any content you post.</p>

            <h2 className="text-2xl font-bold text-white mb-3">9. Moderation and Reporting</h2>
            <p className="text-zinc-300 mb-2">9.1 Nexus reserves the right, but not the obligation, to <strong>review, monitor, or remove</strong> content at its discretion.</p>
            <p className="text-zinc-300 mb-2">9.2 Users can report inappropriate behavior or content through in-app reporting tools or via email at nexusschats@gmail.com</p>
            <p className="text-zinc-300 mb-6">9.3 Decisions made by Nexus moderation team are final and binding.</p>

            <h2 className="text-2xl font-bold text-white mb-3">10. Privacy and Data Handling</h2>
            <p className="text-zinc-300 mb-2">10.1 We collect limited personal data such as email, device identifiers, and usage analytics to enhance your experience.</p>
            <p className="text-zinc-300 mb-2">10.2 Data collection complies with the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong> and applicable <strong>GDPR/CCPA</strong> principles.</p>
            <p className="text-zinc-300 mb-2">10.3 We do not sell user data to third parties.</p>
            <p className="text-zinc-300 mb-6">10.4 Detailed data use and cookie practices are outlined in our <strong>Privacy Policy</strong>.</p>

            <h2 className="text-2xl font-bold text-white mb-3">11. Limitation of Liability</h2>
            <p className="text-zinc-300 mb-2">11.1 Nexus shall not be liable for:</p>
            <ul className="list-disc list-inside text-zinc-300 mb-2 space-y-1 ml-4">
              <li>Any loss of data or content due to system errors or network failures.</li>
              <li>Emotional distress caused by user interactions or AI-generated responses.</li>
              <li>Any indirect, incidental, consequential, or punitive damages.</li>
            </ul>
            <p className="text-zinc-300 mb-6">11.2 Your use of Nexus is <strong>at your sole risk</strong>.</p>

            <h2 className="text-2xl font-bold text-white mb-3">12. Indemnification</h2>
            <p className="text-zinc-300 mb-6">12.1 You agree to indemnify and hold harmless Nexus, its developers, partners, and affiliates from any claims, losses, liabilities, and expenses arising out of your use of the Platform, your content, or your breach of these Terms.</p>

            <h2 className="text-2xl font-bold text-white mb-3">13. Termination</h2>
            <p className="text-zinc-300 mb-2">13.1 Nexus may suspend or permanently terminate your account without prior notice for:</p>
            <ul className="list-disc list-inside text-zinc-300 mb-2 space-y-1 ml-4">
              <li>Breaching these Terms</li>
              <li>Misuse of anonymous or AI features</li>
              <li>Posting illegal or harmful content</li>
            </ul>
            <p className="text-zinc-300 mb-6">13.2 Upon termination, all licenses and access rights granted to you shall immediately cease.</p>

            <h2 className="text-2xl font-bold text-white mb-3">14. Intellectual Property</h2>
            <p className="text-zinc-300 mb-2">14.1 All Platform elements including trademarks, logos, AI models, design, and code are the exclusive property of Nexus.</p>
            <p className="text-zinc-300 mb-6">14.2 Users may not copy, distribute, or modify any part of the Platform without written consent.</p>

            <h2 className="text-2xl font-bold text-white mb-3">15. Third-Party Links and Integrations</h2>
            <p className="text-zinc-300 mb-2">15.1 The Platform may include links to third-party sites or services. Nexus is not responsible for their content or data practices.</p>
            <p className="text-zinc-300 mb-6">15.2 Users interact with third-party features at their own discretion and risk.</p>

            <h2 className="text-2xl font-bold text-white mb-3">16. Service Availability</h2>
            <p className="text-zinc-300 mb-2">16.1 Nexus strives to maintain uptime but does not guarantee uninterrupted access.</p>
            <p className="text-zinc-300 mb-6">16.2 Temporary interruptions may occur for maintenance, updates, or unforeseen technical reasons.</p>

            <h2 className="text-2xl font-bold text-white mb-3">17. Governing Law and Jurisdiction</h2>
            <p className="text-zinc-300 mb-2">17.1 These Terms shall be governed by and construed in accordance with the <strong>laws of India</strong>.</p>
            <p className="text-zinc-300 mb-6">17.2 Any dispute arising under or in connection with these Terms shall be subject to the <strong>exclusive jurisdiction of the courts of Pune, Maharashtra, India.</strong></p>

            <h2 className="text-2xl font-bold text-white mb-3">18. International Data Transfers</h2>
            <p className="text-zinc-300 mb-2">18.1 For international users, your information may be processed in India or other jurisdictions with different data protection laws.</p>
            <p className="text-zinc-300 mb-6">18.2 By using Nexus, you consent to such transfers in accordance with applicable legal safeguards.</p>

            <h2 className="text-2xl font-bold text-white mb-3">19. Disclaimer of Warranties</h2>
            <p className="text-zinc-300 mb-2">19.1 Nexus is provided "as is" and "as available" without any warranties of any kind, express or implied.</p>
            <p className="text-zinc-300 mb-6">19.2 We make no guarantees regarding the accuracy, reliability, or suitability of the content or services.</p>

            <h2 className="text-2xl font-bold text-white mb-3">20. Character Creation and Responsibility</h2>
            <p className="text-zinc-300 mb-2">20.1 Users may create, customize, or interact with fictional <strong>characters</strong> within Nexus (including AI companions or custom personas).</p>
            <p className="text-zinc-300 mb-2">20.2 Any characters created, named, or shared by users are entirely <strong>their own responsibility</strong>. Nexus holds <strong>no liability</strong> for the actions, dialogues, or behavior of such user-created characters.</p>
            <p className="text-zinc-300 mb-6">20.3 Users must ensure that created characters do not violate intellectual property rights, contain hate speech, or promote harm.</p>

            <h2 className="text-2xl font-bold text-white mb-3">21. User Responsibility and Conduct Consequences</h2>
            <p className="text-zinc-300 mb-2">21.1 Nexus promotes freedom of expression but strictly prohibits harassment, bullying, or targeting of others.</p>
            <p className="text-zinc-300 mb-2">21.2 Whatever a user does within the app — including <strong>bullying, making fun, dark humor, or causing harm</strong> — is entirely <strong>their own responsibility</strong>.</p>
            <p className="text-zinc-300 mb-2">21.3 Nexus disclaims all liability arising from user behavior, jokes, dark humor, or offensive content shared by any individual.</p>
            <p className="text-zinc-300 mb-6">21.4 Users engaging in such acts may face <strong>account suspension, termination, or legal action</strong> under applicable Indian laws.</p>

            <h2 className="text-2xl font-bold text-white mb-3">22. Contact Information</h2>
            <p className="text-zinc-300 mb-6">
              For questions, concerns, or legal notices, contact us at:<br />
              <a href="mailto:nexusschats@gmail.com" className="text-softgold-500 hover:text-softgold-300 underline">
                nexusschats@gmail.com
              </a>
            </p>

            <hr className="border-zinc-700 my-6" />

            <p className="text-zinc-400 text-sm text-center">
              By continuing to use Nexus, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;

