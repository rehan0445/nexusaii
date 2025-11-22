// src/components/NotificationsAndSound.tsx
import React, { useState } from "react";
import { ArrowLeft, Bell, Volume2, Mail, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NotificationsAndSoundProps {
  isSidebarOpen: boolean;
}

const NotificationsAndSound: React.FC<NotificationsAndSoundProps> = ({
  isSidebarOpen,
}) => {
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);

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
                  Notifications & Sound
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Content */}
      <div className="px-6 py-8 space-y-8">
        {/* Enable Notifications */}
        <div className="bg-zinc-800 rounded-2xl p-6 border border-zinc-700 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                <Bell className="w-5 h-5 text-gold" />
                Enable Notifications
              </h2>
              <p className="text-zinc-400 text-sm">
                Get real-time alerts for new messages, requests, and updates.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={() => setNotificationsEnabled((prev) => !prev)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:bg-gold transition-all"></div>
              <span className="ml-3 text-sm font-medium text-white">
                {notificationsEnabled ? "On" : "Off"}
              </span>
            </label>
          </div>
        </div>

        {/* Sound Alerts */}
        <div className="bg-zinc-800 rounded-2xl p-6 border border-zinc-700 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-gold" />
                Sound Alerts
              </h2>
              <p className="text-zinc-400 text-sm">
                Play a sound when a new notification arrives.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={() => setSoundEnabled((prev) => !prev)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:bg-gold transition-all"></div>
              <span className="ml-3 text-sm font-medium text-white">
                {soundEnabled ? "On" : "Off"}
              </span>
            </label>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="bg-zinc-800 rounded-2xl p-6 border border-zinc-700 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                <Mail className="w-5 h-5 text-gold" />
                Email Updates
              </h2>
              <p className="text-zinc-400 text-sm">
                Receive updates and alerts in your registered email inbox.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailUpdates}
                onChange={() => setEmailUpdates((prev) => !prev)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:bg-gold transition-all"></div>
              <span className="ml-3 text-sm font-medium text-white">
                {emailUpdates ? "On" : "Off"}
              </span>
            </label>
          </div>
        </div>
      </div>
    </main>
  );
};

export default NotificationsAndSound;
