import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Heart, Star } from "lucide-react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext"; // ✅ Import AuthContext instead of Firebase
import { pluralizeLikes } from "../utils/pluralize";

interface Character {
  id: number;
  name: string;
  role: string;
  image: string;
  slug: string;
}

interface CharacterLikes {
  [slug: string]: { likeCount: number; userLiked: boolean };
}

interface Views {
  [slug: string]: number;
}

interface Props {
  favorites: string[];
  toggleFavorite: (e: React.MouseEvent, slug: string) => void;
  characterLikes: CharacterLikes;
  views: Views;
  handleLike: (e: React.MouseEvent, slug: string) => void;
  likeLoading: Record<string, boolean>;
}

const UserCreations: React.FC<Props> = ({
  favorites,
  toggleFavorite,
  characterLikes,
  views,
  handleLike,
  likeLoading,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // ✅ Use AuthContext instead of Firebase
  const [yourCharacters, setYourCharacters] = useState<Record<string, Character>>({});

  useEffect(() => {
    const fetchYourCreations = async () => {
      try {
        // ✅ Use currentUser from AuthContext instead of Firebase
        if (!currentUser) {
          console.log("User not authenticated or Firebase disabled.");
          return;
        }

        const uid = currentUser.uid;
        const response = await axios.post(
          "/api/v1/character/user",
          {
            user_id: uid,
          }
        );

        console.log(response.data);

        if (response.data.success) {
          setYourCharacters(response.data.data || {});
        } else {
          console.error("Server error:", response.data.message);
        }
      } catch (error) {
        console.error("Failed to fetch your creations", error);
      }
    };

    fetchYourCreations();
  }, [currentUser]); // ✅ Add currentUser as dependency

  if (Object.keys(yourCharacters).length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center mb-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-800/80 mr-3">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Your Creations</h2>
          <div className="h-1 w-12 mt-1 bg-gradient-to-r from-blue-500 to-teal-400 rounded-full"></div>
          <p className="text-zinc-400 text-sm mt-1">
            Characters you've brought to life
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Object.entries(yourCharacters)
          .slice(0, 8)
          .map(([slug, character]) => (
            <div
              key={slug}
              onClick={() => navigate(`/character/${slug}`)}
              className="group relative bg-gradient-to-br from-blue-900/30 to-teal-900/30 rounded-xl overflow-hidden shadow-lg cursor-pointer hover:from-blue-900/40 hover:to-teal-900/40 transition-all duration-300">
              <div className="absolute top-3 left-3 z-10 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                <User className="w-3 h-3 mr-1" />
                YOU
              </div>

              <div className="aspect-[2/3] relative overflow-hidden">
                <img
                  src={character.image}
                  alt={character.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
              </div>

              <div className="absolute top-3 right-3 z-10 flex gap-2">
                <button
                  onClick={(e) => toggleFavorite(e, slug)}
                  className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                    favorites.includes(slug)
                      ? "bg-gold/90 text-zinc-900"
                      : "bg-black/40 text-white hover:bg-black/60"
                  }`}>
                  <Star
                    className="w-4 h-4"
                    fill={favorites.includes(slug) ? "currentColor" : "none"}
                  />
                </button>

                {/* Like Button */}
                <button
                  onClick={(e) => handleLike(e, slug)}
                  disabled={likeLoading[slug]}
                  className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                    characterLikes[slug]?.userLiked
                      ? "bg-red-500/90 text-white"
                      : "bg-black/40 text-white hover:bg-black/60"
                  } ${likeLoading[slug] ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <Heart
                    className="w-4 h-4"
                    fill={characterLikes[slug]?.userLiked ? "currentColor" : "none"}
                  />
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                <h3 className="text-white text-xl font-bold mb-1">
                  {character.name}
                </h3>
                <p className="text-teal-400 text-sm mb-3">{character.role}</p>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center text-zinc-300 text-sm">
                    <Heart className="w-4 h-4 mr-1 text-pink-400" />
                    <span>{pluralizeLikes(characterLikes[slug]?.likeCount || 0)}</span>
                  </div>
                  <div className="flex items-center text-zinc-300 text-sm">
                    <div className="flex -space-x-1 mr-1">
                      <div className="w-4 h-4 rounded-full bg-blue-400 border border-blue-900"></div>
                      <div className="w-4 h-4 rounded-full bg-teal-400 border border-teal-900"></div>
                      <div className="w-4 h-4 rounded-full bg-purple-400 border border-purple-900"></div>
                    </div>
                    <span>{views[slug] || 0} views</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation(); // ✅ Prevent parent click
                    navigate(`/chat/${slug}`);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors text-sm">
                  Chat Now
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default UserCreations;
