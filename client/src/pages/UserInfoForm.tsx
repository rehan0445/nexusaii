import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Camera, UploadCloud } from "lucide-react";

const predefinedInterests = [
  "Technology",
  "Art",
  "Music",
  "Fitness",
  "Gaming",
  "Travel",
];

const UserInfoForm = () => {
  const location = useLocation();
  const { name, email, uid } = location.state || {};
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    location: "",
    profileImg: {
      file: null as File | null,
      preview: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
    bannerImg: {
      file: null as File | null,
      preview:
        "https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1200&q=80",
    },
    interests: [] as string[],
  });

  useEffect(() => {
    if (!uid) {
      navigate("/register");
    }
  }, [uid, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "username") {
      let updated = value;
      if (!updated.startsWith("@")) {
        updated = "@" + updated.replace(/@/g, "");
      } else {
        updated = "@" + updated.slice(1).replace(/@/g, "");
      }

      setFormData((prev) => ({
        ...prev,
        [name]: updated,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      const preview = URL.createObjectURL(file);

      setFormData((prev) => ({
        ...prev,
        [name]: {
          file,
          preview,
        },
      }));
    }
  };

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const form = new FormData();
      form.append("uid", uid);
      form.append("name", name);
      form.append("email", email);
      form.append("username", formData.username);
      form.append("bio", formData.bio);
      form.append("location", formData.location);
      form.append("phno", "");
      form.append("interests", JSON.stringify(formData.interests));

      if (formData.profileImg.file) {
        form.append("profileImg", formData.profileImg.file);
      }

      if (formData.bannerImg.file) {
        form.append("bannerImg", formData.bannerImg.file);
      }

      const res = await fetch(
        "/api/v1/chat/create-profile",
        {
          method: "POST",
          body: form,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile");
      }

      alert("Profile created successfully!");
      navigate("/");
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <img
        src="/images/bgimg.png"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover z-[-1]"
      />
      <div className="absolute inset-0 bg-black/50 z-[-1]" />

      <div className="relative w-full max-w-2xl">
        <div className="relative z-10 backdrop-blur-xl bg-black/50 rounded-3xl p-12 overflow-hidden border border-white/20">
          <h2 className="text-3xl font-bold text-center text-white mb-10">
            User Profile Setup
          </h2>

          <div className="flex flex-col gap-6 text-white">
            {/* Username */}
            <div>
              <input
                type="text"
                name="username"
                placeholder="@username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full py-4 px-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-white/30 placeholder:text-white/70"
              />
              <p className="text-sm text-white/50 mt-1">
                Usernames always start with "@"
              </p>
            </div>

            {/* Bio */}
            <textarea
              name="bio"
              placeholder="Bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              className="w-full py-4 px-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-white/30 placeholder:text-white/70"
            />

            {/* Location */}
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={formData.location}
              onChange={handleChange}
              className="w-full py-4 px-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-white/30 placeholder:text-white/70"
            />

            {/* Profile & Banner Upload */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-10 text-white text-sm">
              {/* Profile Upload */}
              <div className="flex flex-col items-center">
                <h3 className="mb-2 font-medium text-white">Profile Picture</h3>
                <label
                  htmlFor="profileImg"
                  className="w-16 h-16 bg-white/10 border border-white/30 rounded-full flex items-center justify-center hover:bg-white/20 transition cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    id="profileImg"
                    name="profileImg"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {formData.profileImg.preview && (
                  <img
                    src={formData.profileImg.preview}
                    alt="Profile Preview"
                    className="mt-2 w-16 h-16 rounded-full object-cover border border-white/30"
                  />
                )}
              </div>

              {/* Banner Upload */}
              <div className="flex flex-col items-center">
                <h3 className="mb-2 font-medium text-white">Banner Image</h3>
                <label
                  htmlFor="bannerImg"
                  className="w-16 h-16 bg-white/10 border border-white/30 rounded-full flex items-center justify-center hover:bg-white/20 transition cursor-pointer">
                  <UploadCloud className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    id="bannerImg"
                    name="bannerImg"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {formData.bannerImg.preview && (
                  <img
                    src={formData.bannerImg.preview}
                    alt="Banner Preview"
                    className="mt-2 w-full h-20 object-cover rounded-xl border border-white/30"
                  />
                )}
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="block mb-3 text-white/80 text-sm">
                Select Your Interests
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {predefinedInterests.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleInterestToggle(interest)}
                    className={`py-2 px-4 rounded-xl text-sm border transition-all duration-200 ${
                      formData.interests.includes(interest)
                        ? "bg-[#f4e3b5] text-black font-semibold border-[#f4e3b5]"
                        : "bg-white/10 text-white/80 border-white/30 hover:bg-white/20"
                    }`}>
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full mt-6 py-4 rounded-xl font-semibold text-gray-800 bg-[#f4e3b5] text-base transition-transform transform hover:scale-105 hover:shadow-xl active:scale-95 ${
                loading ? "opacity-60 cursor-not-allowed" : ""
              }`}>
              {loading ? "Saving..." : "Save Information"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfoForm;
