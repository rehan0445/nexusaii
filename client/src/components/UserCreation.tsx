import { User, Heart, Eye } from "lucide-react";
import { Character } from "../utils/characters";

interface CharacterCardData {
  slug: string;
  character: Character;
  views: number;
  likes: number;
}

interface UserCreationProps {
  title?: string;
  characters: CharacterCardData[];
  icon?: React.ReactNode;
  favorites?: Set<string>;
  toggleFavorite: (e: React.MouseEvent, slug: string) => void;
}

const UserCreation = ({
  title = "Your Creations",
  characters = [],
  icon = <User className="w-5 h-5 text-white" />,
  favorites = new Set(),
  toggleFavorite,
}: UserCreationProps) => {
  return (
    <div className="mb-12">
      <div className="flex items-center mb-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-800/80 mr-3">
          {icon}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <div className="h-1 w-12 mt-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          <p className="text-zinc-400 text-sm mt-1">
            Characters that you created
          </p>
        </div>
      </div>
      <div className="character-grid">
        {characters.map(({ slug, character, views, likes }) => (
          <div
            key={slug}
            className="character-card cursor-pointer transition-all duration-300 hover:bg-zinc-800/60">
            <div className="character-card__media">
              <img
                src={
                  character.image ||
                  "https://i.pinimg.com/736x/8d/45/d7/8d45d7182a790992f538de186944f79c.jpg"
                }
                alt={character.name}
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.onerror = null;
                  target.src = "https://i.pinimg.com/736x/8d/45/d7/8d45d7182a790992f538de186944f79c.jpg";
                }}
              />
              <div className="character-card__overlay"></div>
              <div className="character-card__actions">
                <button
                  className="character-card__action bg-black/40 text-white hover:bg-black/60"
                  onClick={(e) => toggleFavorite(e, slug)}>
                  <Heart
                    className={`w-4 h-4 ${
                      favorites?.has(slug) ? "fill-current text-red-400" : ""
                    }`}
                  />
                </button>
              </div>
              <div className="character-card__content">
                <h3 className="character-card__title">{character.name}</h3>
                <div className="character-card__stats">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-blue-400" />
                    <span>{likes}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>{views.toLocaleString()} views</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="character-card__footer">
              <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors text-sm">
                Edit Character
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserCreation;
