import React from 'react';
import { Link } from 'react-router-dom';

/**
 * SEO Footer with internal linking strategy
 * Helps distribute page authority and improve crawlability
 */
export const SEOFooter: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* AI Companions */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">AI Companions</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/companion" className="hover:text-purple-400 transition-colors">
                  Browse AI Characters
                </Link>
              </li>
              <li>
                <Link to="/create-buddy" className="hover:text-purple-400 transition-colors">
                  Create AI Girlfriend
                </Link>
              </li>
              <li>
                <Link to="/reels" className="hover:text-purple-400 transition-colors">
                  AI Character Reels
                </Link>
              </li>
              <li>
                <Link to="/blog/best-ai-girlfriend-apps-free" className="hover:text-purple-400 transition-colors">
                  Best AI Girlfriend Apps
                </Link>
              </li>
              <li>
                <Link to="/blog/dark-romance-ai-complete-guide" className="hover:text-purple-400 transition-colors">
                  Dark Romance AI Guide
                </Link>
              </li>
              <li>
                <Link to="/blog/ai-waifu-guide-anime-ai-girlfriend" className="hover:text-purple-400 transition-colors">
                  AI Waifu & Anime Characters
                </Link>
              </li>
              <li>
                <Link to="/personas/dominating-ai-girlfriend" className="hover:text-purple-400 transition-colors">
                  Dominating AI Girlfriend
                </Link>
              </li>
            </ul>
          </div>

          {/* Confessions */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Confessions</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/campus/general/confessions" className="hover:text-purple-400 transition-colors">
                  College Confessions
                </Link>
              </li>
              <li>
                <Link to="/write-confession" className="hover:text-purple-400 transition-colors">
                  Write Anonymous Confession
                </Link>
              </li>
              <li>
                <Link to="/arena/darkroom" className="hover:text-purple-400 transition-colors">
                  Dark Room Chat
                </Link>
              </li>
              <li>
                <Link to="/blog/college-confessions-guide" className="hover:text-purple-400 transition-colors">
                  College Confessions Guide
                </Link>
              </li>
              <li>
                <Link to="/blog/school-confessions-guide-anonymous-student-secrets" className="hover:text-purple-400 transition-colors">
                  School Confessions Guide
                </Link>
              </li>
              <li>
                <Link to="/blog/anonymous-confession-apps-2026" className="hover:text-purple-400 transition-colors">
                  Best Confession Apps
                </Link>
              </li>
              <li>
                <Link to="/venting-anonymously" className="hover:text-purple-400 transition-colors">
                  How to Vent Anonymously
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/arena/hangout" className="hover:text-purple-400 transition-colors">
                  Hangout Rooms
                </Link>
              </li>
              <li>
                <Link to="/vibe" className="hover:text-purple-400 transition-colors">
                  Interest Groups
                </Link>
              </li>
              <li>
                <Link to="/campus" className="hover:text-purple-400 transition-colors">
                  Campus Communities
                </Link>
              </li>
              <li>
                <Link to="/about-us" className="hover:text-purple-400 transition-colors">
                  About Nexus
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/blog" className="hover:text-purple-400 transition-colors">
                  Blog & Guides
                </Link>
              </li>
              <li>
                <Link to="/blog/ai-girlfriend-vs-ai-boyfriend-guide" className="hover:text-purple-400 transition-colors">
                  AI Girlfriend vs AI Boyfriend
                </Link>
              </li>
              <li>
                <Link to="/blog/dominating-ai-characters-guide" className="hover:text-purple-400 transition-colors">
                  Dominating AI Characters
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-purple-400 transition-colors">
                  Sign Up Free
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-purple-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-purple-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/safety-ethics" className="hover:text-purple-400 transition-colors">
                  Safety & Ethics
                </Link>
              </li>
              <li>
                <a 
                  href="/llms.txt" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-purple-400 transition-colors text-xs text-gray-500"
                >
                  For AI Search Engines
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Popular Keywords for SEO */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <h4 className="text-white font-semibold mb-4 text-center">Popular Searches</h4>
          <div className="flex flex-wrap gap-3 justify-center text-sm">
            <Link to="/companion" className="hover:text-purple-400 transition-colors">
              AI Girlfriend Free
            </Link>
            <span className="text-gray-600">•</span>
            <Link to="/companion" className="hover:text-purple-400 transition-colors">
              AI Boyfriend Chat
            </Link>
            <span className="text-gray-600">•</span>
            <Link to="/companion" className="hover:text-purple-400 transition-colors">
              AI Waifu
            </Link>
            <span className="text-gray-600">•</span>
            <Link to="/campus/general/confessions" className="hover:text-purple-400 transition-colors">
              College Confessions
            </Link>
            <span className="text-gray-600">•</span>
            <Link to="/campus/general/confessions" className="hover:text-purple-400 transition-colors">
              Anonymous Confessions
            </Link>
            <span className="text-gray-600">•</span>
            <Link to="/blog/dark-romance-ai-complete-guide" className="hover:text-purple-400 transition-colors">
              Dark Romance AI
            </Link>
            <span className="text-gray-600">•</span>
            <Link to="/companion" className="hover:text-purple-400 transition-colors">
              AI Sexting
            </Link>
            <span className="text-gray-600">•</span>
            <Link to="/companion" className="hover:text-purple-400 transition-colors">
              Dominating AI
            </Link>
            <span className="text-gray-600">•</span>
            <Link to="/arena/darkroom" className="hover:text-purple-400 transition-colors">
              Anonymous Chat
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-8 text-center text-sm">
          <p className="mb-2">
            © 2026 Nexus. Free AI Girlfriend, AI Boyfriend & College Confessions Platform.
          </p>
          <p className="text-gray-500">
            30,000+ students trust Nexus for AI companions and anonymous confessions.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SEOFooter;
