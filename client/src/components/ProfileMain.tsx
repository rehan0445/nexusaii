// src/components/ProfileMain.tsx
import React, { useState } from "react";
import {
  ArrowLeft,
  Camera,
  Crown,
  Flame,
  Info,
  SquarePen,
  UserCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import EditProfileModal from "./EditProfileModal"; // ✅ Import modal

interface ProfileMainProps {
  isSidebarOpen: boolean;
  activeTab: "videos" | "photos";
  setActiveTab: React.Dispatch<React.SetStateAction<"videos" | "photos">>;
  profileData: any;
  setProfileData: React.Dispatch<React.SetStateAction<any>>;
}

const ProfileMain: React.FC<ProfileMainProps> = ({
  isSidebarOpen,
  activeTab,
  setActiveTab,
  profileData,
  setProfileData,
}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showInfoBox, setShowInfoBox] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prev: any) => ({
          ...prev,
          image: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <main
        className={`transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-16"
        }`}>
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
                  <span className="text-2xl font-bold text-gold">Profile</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Profile Header */}
        <div className="mb-8">
          {/* Banner */}
          <div className="mx-6 mt-6">
            <div className="relative w-full h-40 sm:h-52 bg-zinc-800 rounded-xl overflow-hidden">
              <img
                src={
                  profileData.bannerImage ||
                  "https://source.unsplash.com/1200x400/?nature,abstract"
                }
                alt="Banner"
                className="w-full h-full object-cover"
              />

              <button
                onClick={() => setShowInfoBox((prev) => !prev)}
                className="absolute top-2 right-2 p-2 bg-zinc-900/70 hover:bg-zinc-800 rounded-full text-white">
                <Info className="w-5 h-5" />
              </button>

              {showInfoBox && (
                <div className="absolute top-12 right-2 w-64 p-4 rounded-xl bg-zinc-900 border border-zinc-700 shadow-lg z-20 text-sm text-zinc-300 space-y-2">
                  <p>
                    <span className="font-semibold text-white">Joined:</span>{" "}
                    {profileData.creationDate}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Email:</span>{" "}
                    {profileData.email}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Phone:</span>{" "}
                    {profileData.phno}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Location:</span>{" "}
                    {profileData.location}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Profile Image */}
          <div className="relative px-6 mt-[-80px] sm:mt-[-88px]">
            <div className="ml-10 w-40 h-40 rounded-full bg-zinc-800 border-4 border-zinc-900 overflow-hidden relative z-10">
              <img
                src={profileData.profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
              {isEditing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer p-4 rounded-full bg-gold text-zinc-900 hover:bg-gold/90 transition-colors">
                    <Camera className="w-6 h-6" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 px-6 flex flex-col lg:flex-row justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                {profileData.name}
                <span className="flex items-center gap-1 px-3 py-1 bg-pink-600 text-white text-sm rounded-full">
                  <Flame className="w-5 h-5" /> {profileData.streak}d streak
                </span>
              </h1>

              <p className="text-zinc-400 text-base mt-2 max-w-lg">
                {profileData.bio}
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-gold text-zinc-900 font-medium rounded-xl w-48 hover:bg-gold/90 transition-all">
                  <SquarePen className="w-5 h-5" />
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="mr-32">
              <div className="grid grid-cols-4 gap-10">
                {[
                  { label: "Followers", value: profileData.stats.follower },
                  { label: "Following", value: profileData.stats.following },
                  { label: "Posts", value: profileData.stats.numOfPost },
                  { label: "Characters", value: profileData.stats.numOfChar },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="w-40 h-32 flex flex-col justify-center items-center rounded-2xl transition-colors duration-200 cursor-default hover:bg-gold group">
                    <div className="text-2xl font-bold text-white group-hover:text-black">
                      {item.value}
                    </div>
                    <div className="text-zinc-400 text-sm mt-1 group-hover:text-black">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 mt-8 flex justify-center">
            <div className="flex space-x-4 bg-zinc-800 p-2 rounded-full">
              <button
                onClick={() => setActiveTab("videos")}
                className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                  activeTab === "videos"
                    ? "bg-gold text-zinc-900"
                    : "bg-zinc-700 text-zinc-300"
                }`}>
                Videos
              </button>
              <button
                onClick={() => setActiveTab("photos")}
                className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                  activeTab === "photos"
                    ? "bg-gold text-zinc-900"
                    : "bg-zinc-700 text-zinc-300"
                }`}>
                Photos
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 mt-6">
            {activeTab === "videos" ? (
              <div className="text-white">
                <p className="text-center text-zinc-400">
                  No videos uploaded yet.
                </p>
              </div>
            ) : (
              <div className="text-white">
                <p className="text-center text-zinc-400">
                  No photos uploaded yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ✅ Show Edit Modal */}
      {isEditing && (
        <EditProfileModal
          profileData={profileData}
          setProfileData={setProfileData}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
};

export default ProfileMain;
