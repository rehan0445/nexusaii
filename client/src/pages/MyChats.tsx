import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageSquare
} from "lucide-react";

import { useCharacterContext } from "../contexts/CharacterContext";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { useSettings } from "../contexts/SettingsContext";

interface ChatHistoryItem {
  id: string;
  characterId: string;
  characterName: string;
  characterImage: string;
  lastMessage: string;
  timestamp: number | Date;
  messages: {
    user: string;
    ai: string;
    timestamp: number;
  }[];
  role?: string;
  isCompanion?: boolean; // New field to identify companions
  scenarioType?: string; // New field for scenario type
}

// Helper function to get theme colors based on incognito mode
const getThemeColors = (incognitoMode: boolean) => ({
  mainBg: incognitoMode ? "bg-black" : "bg-zinc-900",
  buttonBg: incognitoMode ? "bg-orange-500 hover:bg-orange-500/90 text-white" : "bg-gold hover:bg-gold/90 text-zinc-900"
});

// Helper function to format chat data
const formatChatData = (chat: any, characters: any): ChatHistoryItem => {
  const messages = Array.isArray(chat.messages) ? chat.messages : [];
  const lastMessageObj = messages[messages.length - 1] || {};
  const characterInfo = characters[chat.character_id] || {};

  // Check if this is a companion based on personality data
  const isCompanion = !!(characterInfo.personality?.scenario || characterInfo.personality?.scenarioType);
  const scenarioType = characterInfo.personality?.scenarioType;

  return {
    id: chat.id,
    characterId: chat.character_id,
    characterName: characterInfo.name || `AI Character`,
    characterImage:
      characterInfo.image ||
      "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=150&h=150",
    lastMessage:
      lastMessageObj.ai || lastMessageObj.message || "No message",
    timestamp: chat.updated_at
      ? new Date(chat.updated_at)
      : new Date(),
    messages: messages.map((msg: any) => ({
      user: msg.user || "",
      ai: msg.ai || "",
      timestamp: msg.timestamp || Date.now(),
    })),
    role: characterInfo.role,
    isCompanion,
    scenarioType,
  };
};

// Helper function to get empty state message
const getEmptyStateMessage = (): string => {
  return "You don't have any previous conversations with AI characters";
};

function MyChats() {
  const navigate = useNavigate();
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const { characters } = useCharacterContext();
  const { incognitoMode } = useSettings();
  const { currentUser } = useAuth();
  const { mainBg, buttonBg } = getThemeColors(incognitoMode);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const user = currentUser;

        if (!user) {
          console.warn("No authenticated Firebase user found");
          setChatHistory([]);
          return;
        }

        const userId = user.uid;
        console.log("Fetching chat history for user:", userId);

        // Use centralized API configuration
        const { API_CONFIG } = await import('../lib/config');
        const API_BASE_URL = API_CONFIG.getServerUrl();
        
        // Fetch from ai_chat_metadata table (which includes companion chats)
        console.log("🔍 Fetching chat history from:", `${API_BASE_URL}/api/nexus-chats/`);
        const metadataResponse = await axios.get(
          `${API_BASE_URL}/api/nexus-chats/`,
          { withCredentials: true, headers: { 'x-user-id': userId } }
        );

        console.log("📦 Chat metadata response:", metadataResponse.data);

        const chats = metadataResponse.data?.chats || [];
        console.log("All chats:", chats);

        // Keep only companion chats and map to UI shape
        const formattedChats: ChatHistoryItem[] = chats
          .filter((chat: any) => chat?.type === 'companion')
          .map((chat: any) => ({
            id: chat.id, // character id
            characterId: chat.id,
            characterName: chat.name || characters[chat.id]?.name || "Character",
            characterImage: chat.avatar || characters[chat.id]?.image || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=150&h=150",
            lastMessage: chat.lastMessage || "Start chatting!",
            timestamp: chat.timestamp ? new Date(chat.timestamp) : new Date(),
            messages: [],
            role: characters[chat.id]?.role || "AI Character",
            isCompanion: true,
            scenarioType: characters[chat.id]?.personality?.scenarioType
          }));

        console.log("Formatted chats:", formattedChats);
        setChatHistory(formattedChats);
      } catch (error) {
        console.error("Failed to fetch chat history from backend:", error);
        
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNREFUSED') {
            console.error("Backend server is not running. Please start the server.");
          } else if (error.response?.status === 404) {
            console.error("API endpoint not found. Check server routes.");
          } else {
            console.error("API error:", error.response?.data);
          }
        }
        
        setChatHistory([]);
      }
    };

    fetchChatHistory();
  }, [characters]);

  // single-chat deletion not shown in compact cards; keep bulk clear for now

  const deleteAllChats = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.warn("No authenticated Firebase user found");
      alert("Please log in to delete chats.");
      return;
    }

    const userId = user.uid;

    try {
      console.log("Deleting all chats for user:", userId);
      await axios.post(
        "/api/v1/chat/ai/delete-all-chats",
        { user_id: userId }
      );
      setChatHistory([]);
      console.log("All chats deleted successfully");
    } catch (error) {
      console.error("Failed to delete all chats:", error);
      alert("Failed to delete all chats. Please try again.");
    }
  };

  // Show all chat history without any filtering
  const filteredChats = chatHistory;

  // timestamp hidden in compact layout

  const handleChatClick = (characterId: string) => {
    navigate(`/chat/${characterId}`);
  };

  const handleDeleteAllChats = () => {
    if (confirm("Are you sure you want to delete all conversation history?")) {
      deleteAllChats();
    }
  };

  const renderEmptyState = () => (
    <div className="bg-zinc-800/50 rounded-xl p-8 text-center">
      <MessageSquare className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
      <h3 className="text-xl font-medium text-white mb-2">
        No Conversations Found
      </h3>
      <p className="text-zinc-400 mb-6">
        {getEmptyStateMessage()}
      </p>
      <button
        onClick={() => navigate("/ai")}
        className={`px-6 py-3 rounded-lg transition-all font-medium ${buttonBg}`}>
        Start Chatting
      </button>
    </div>
  );

  const renderChatItem = (chat: ChatHistoryItem) => (
    <button
      key={chat.id}
      onClick={() => handleChatClick(chat.characterId)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleChatClick(chat.characterId);
        }
      }}
      className="w-full bg-zinc-900/40 rounded-xl border border-green-500/40 hover:border-green-500/70 hover:bg-zinc-900/60 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/50 px-3 py-3 max-h-[15vh]"
    >
            <div className="flex items-center gap-3">
        <img
          src={chat.characterImage}
          alt={chat.characterName}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0 ring-2 ring-green-500/60"
        />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate text-base">{chat.characterName}</h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleChatClick(chat.characterId);
          }}
          className="px-3 py-1.5 text-sm rounded-lg bg-green-500 text-black hover:bg-green-600 transition-colors font-mono"
        >
          Chat
        </button>
      </div>
    </button>
  );

  return (
    <div className={mainBg} style={{fontFamily: 'Roboto Mono, monospace'}}>
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm fixed left-0 right-0 top-0 z-50">
        <div className="w-full px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-center">
            <button
              onClick={() => navigate("/ai")}
              className="absolute left-4 sm:left-6 text-green-500 hover:text-green-400 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 text-green-500" />
              <span className="text-xl sm:text-2xl font-bold text-green-500" style={{fontFamily: 'UnifrakturCook, cursive'}}>
                Previous Conversations
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-20 sm:pt-24 pb-24 sm:pb-12 px-4 sm:px-6">
        <div className="w-full">
          <div className="mb-8 flex items-center justify-between">
            <div className="text-center flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">Your Conversations</h2>
              <p className="text-zinc-400">Your past chats with AI characters</p>
            </div>
            {filteredChats.length > 0 && (
              <button
                onClick={handleDeleteAllChats}
                className="px-4 py-2 bg-zinc-800 text-green-500 rounded-lg hover:bg-zinc-700 hover:text-green-400 transition-colors font-mono">
                Clear History
              </button>
            )}
          </div>

          {filteredChats.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="flex flex-col gap-3 md:gap-4 lg:gap-5">
              {filteredChats.map(renderChatItem)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default MyChats;
