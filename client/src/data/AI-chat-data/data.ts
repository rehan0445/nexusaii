import {
  MessageSquare,
  Home,
  Trophy,
  Video,
} from "lucide-react";

// Interface for announcement objects
export interface Announcement {
  id: number;
  title: string;
  description: string;
  cta: string;
  ctaLink: string;
  color: string;
  image: string;
  tagline: string;
}

// Navigation Menu Items
export const menuItems = [
  { icon: Home, label: "Home", active: false },
  { icon: MessageSquare, label: "My Chats", active: false },
  { icon: Trophy, label: "Trending", active: false },
  { icon: Video, label: "Shorts", active: false },
];

// Tags
export const availableTags = [
  { id: 1, name: "Male" },
  { id: 2, name: "Female" },
  { id: 3, name: "FemalePOV" },
  { id: 4, name: "Dominant" },
  { id: 5, name: "Romantic" },
  { id: 6, name: "MalePOV" },
  { id: 7, name: "English" },
  { id: 8, name: "Drama" },
  { id: 9, name: "LGBTQ+" },
  { id: 10, name: "Action" },
  { id: 11, name: "Fantasy" },
  { id: 12, name: "Anime" },
  { id: 13, name: "Comedy" },
  { id: 14, name: "Drama" },
  { id: 15, name: "Horror" },
  { id: 16, name: "Mystery" },
  { id: 17, name: "Romance" },
  { id: 18, name: "Sci-Fi" },
  { id: 19, name: "Slice of Life" },
  { id: 20, name: "Star Wars" },
  { id: 21, name: "Marvel" },
  { id: 22, name: "DC" },
  { id: 23, name: "Harry Potter" },
  { id: 24, name: "The Ancients" },
];

// Tag Categories
export const tagCategories = [
  {
    name: "Type",
    tags: ["Male", "Female", "Anime", "Movies", "Historic Figures"],
  },
  {
    name: "Interests",
    tags: [
      "Education",
      "Entertainment",
      "Writing",
      "Creativity",
      "Science",
      "Philosophy",
    ],
  },
  {
    name: "Fields",
    tags: ["Technology", "Art", "Music", "Literature"],
  },
];

// Announcements
export const announcements: Announcement[] = [
  {
    id: 1,
    title: "Hinata",
    description:
      "Beautiful, strong, and determined. Hinata is a character that is not afraid to stand up for what she believes in.",
    cta: "Chat Now",
    ctaLink: "/chat/hinata-hyuga",
    color: "from-blue-900/80 to-purple-900/70",
    image: "https://wallpapercave.com/wp/wp2598741.jpg",
    tagline: "HOT CHARACTER",
  },
  {
    id: 2,
    title: "AI Showdown",
    description:
      "Create epic conversations with multiple AI characters. Watch them interact with each other in real-time.",
    cta: "Start Showdown",
    ctaLink: "/showdown",
    color: "from-softgold-900/80 to-orange-900/70",
    image:
      "https://i.pinimg.com/736x/8b/b7/5c/8bb75cb0245e6abdd5559da02ed29332.jpg",
    tagline: "FEATURED EXPERIENCE",
  },
  {
    id: 3,
    title: "Create Your Own AI Companion",
    description:
      "Design a custom AI companion with unique personality traits, interests, and appearance.",
    cta: "Create Now",
    ctaLink: "/create-buddy",
    color: "from-emerald-900/80 to-teal-900/70",
    image:
      "https://i.pinimg.com/736x/30/e5/ec/30e5ec8f1ec47882de36ee53e26fada9.jpg",
    tagline: "PERSONALIZE YOUR EXPERIENCE",
  },
];
