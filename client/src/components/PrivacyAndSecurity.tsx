// src/components/PrivacyAndSecurity.tsx
import React, { useState } from "react";
import {
  ArrowLeft,
  Lock,
  ShieldCheck,
  EyeOff,
  UserCircle,
  Key,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
interface PrivacyAndSecurityProps {
  isSidebarOpen: boolean;
}

const PrivacyAndSecurity: React.FC<PrivacyAndSecurityProps> = ({
  isSidebarOpen,
}) => {
  const navigate = useNavigate();
  const [isPrivate, setIsPrivate] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  return (
    <main
      className={`transition-all duration-300 ${
        isSidebarOpen ? "ml-64" : "ml-16"
      } bg-zinc-900 min-h-screen text-white`}>
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gold hover:text-gold/80 transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-2">
                <UserCircle className="w-8 h-8 text-gold" />
                <span className="text-2xl font-bold text-gold">
                  Privacy & Security
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 py-8 space-y-8">
        {/* Account Privacy */}
        <div className="bg-zinc-800 rounded-2xl p-6 border border-zinc-700 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-gold" />
                Private Account
              </h2>
              <p className="text-zinc-400 text-sm">
                When your account is set to private, only users you approve can
                see your posts and followers. If set to public, anyone can view
                your content.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={() => setIsPrivate((prev) => !prev)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:bg-gold transition-all"></div>
              <span className="ml-3 text-sm font-medium text-white">
                {isPrivate ? "Private" : "Public"}
              </span>
            </label>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-zinc-800 rounded-2xl p-6 border border-zinc-700 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gold" />
                Two-Factor Authentication (2FA)
              </h2>
              <p className="text-zinc-400 text-sm">
                Add an extra layer of protection to your account by enabling
                2FA.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={twoFactorAuth}
                onChange={() => setTwoFactorAuth((prev) => !prev)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:bg-gold transition-all"></div>
              <span className="ml-3 text-sm font-medium text-white">
                {twoFactorAuth ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>
        </div>

        {/* Login Alerts */}
        <div className="bg-zinc-800 rounded-2xl p-6 border border-zinc-700 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                <Lock className="w-5 h-5 text-gold" />
                Login Alerts
              </h2>
              <p className="text-zinc-400 text-sm">
                Get notified when your account is accessed from an unrecognized
                device or location.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={loginAlerts}
                onChange={() => setLoginAlerts((prev) => !prev)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:bg-gold transition-all"></div>
              <span className="ml-3 text-sm font-medium text-white">
                {loginAlerts ? "On" : "Off"}
              </span>
            </label>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-zinc-800 rounded-2xl p-6 border border-zinc-700 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                <Key className="w-5 h-5 text-gold" />
                Change Password
              </h2>
              <p className="text-zinc-400 text-sm">
                Update your account password regularly to keep your account
                secure.
              </p>
            </div>
            <button className="bg-gold text-zinc-900 px-4 py-2 rounded-xl font-medium hover:bg-gold/90 transition-all">
              Change
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PrivacyAndSecurity;
