import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Heart,
  Lightbulb,
  X,
  Settings,
  Flag,
  Eye,
  EyeOff,
  User,
  Copy,
  Moon,
  Flame,
  UserCircle,
  Upload,
  Save,
  RotateCcw,
  MoreHorizontal,
  Trash2,
  Palette,
  RefreshCcw,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { useDesktopLayout } from "../contexts/DesktopLayoutContext";
import { useCharacterContext } from "../contexts/CharacterContext";
import { incrementView } from "../utils/viewsManager";
import FullPageLoader from "../components/FullPageLoader";
import CommentSystem from "../components/CommentSystem";
import {
  saveToSession,
  loadFromSession,
  clearSession,
  mergeBaseWithPersistent,
  getTotalCharCount,
  shouldSummarize,
  createInitialContext,
  CompanionContext,
  PersistentMemory
} from "../utils/companionMemory";
import {
  updateContextFromConversation,
  extractUserPreferences
} from "../utils/contextExtractor";

// Helper function to render messages with asterisk styling
const renderMessageWithAsterisks = (text: string) => {
  if (!text) return text;
  
  // Split text by asterisk patterns and render accordingly
  const parts = text.split(/(\*[^*]+\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      // This is an asterisk-wrapped action/thought
      const content = part.slice(1, -1); // Remove asterisks
      return (
        <span key={index} className="text-gray-400 opacity-60 italic">
          {content}
        </span>
      );
    }
    // Regular text
    return part;
  });
};

// Interactive features
import TypingIndicator from "../components/TypingIndicator";
import AffectionMeter from "../components/AffectionMeter";
import QuestChallenge from "../components/QuestChallenge";
import LevelUpAnimation from "../components/LevelUpAnimation";
import { playMessageSound, playLevelUpSound, playQuestCompleteSound, playQuestStartSound } from "../utils/sounds";
// Socket.IO for character-initiated messages
import { createSocket } from "../lib/socketConfig";
import type { Socket } from "socket.io-client";

// Enhanced interfaces for the new design
interface Message {
  id?: string;
  text: string;
  sender: "user" | "ai";
  timestamp?: number;
  thoughts?: string; // Character's internal thoughts (light text)
  speech?: string;   // Character's actual speech (dark text)
  user_thoughts?: string; // User's *Text* format thoughts
  message_type?: "user" | "ai_thought" | "ai_speech";
}

interface ChatBubbleTheme {
  id: string;
  name: string;
  baseColor: string;
  gradient: string;
  animation: string;
  icon: React.ReactNode;
}


interface Mood {
  id: string;
  name: string;
  emoji: string;
  description: string;
  temperature: number;
  responseStyle: string;
}


// Chat bubble themes without animations
const CHAT_BUBBLE_THEMES: ChatBubbleTheme[] = [
  {
    id: "default",
    name: "Default",
    baseColor: "#0a0a0a",
    gradient: "bg-[#0a0a0a] text-white",
    animation: "",
    icon: <div className="w-4 h-4 rounded bg-[#0a0a0a]" />
  },
  {
    id: "love",
    name: "Love",
    baseColor: "#ec4899",
    gradient: "bg-gradient-to-br from-pink-500 to-rose-600",
    animation: "",
    icon: <Heart className="w-4 h-4 text-pink-500" />
  },
  {
    id: "moon",
    name: "Moon",
    baseColor: "#6366f1",
    gradient: "bg-gradient-to-br from-indigo-500 to-violet-700",
    animation: "",
    icon: <Moon className="w-4 h-4 text-indigo-400" />
  },
  {
    id: "fire",
    name: "Fire",
    baseColor: "#dc2626",
    gradient: "bg-gradient-to-br from-orange-500 to-red-600",
    animation: "",
    icon: <Flame className="w-4 h-4 text-orange-500" />
  },
  {
    id: "quantum",
    name: "Quantum",
    baseColor: "#4ade80",
    gradient: "bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600",
    animation: "",
    icon: <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-400 to-cyan-600" />
  }
];

// Mood presets
const MOOD_PRESETS: Mood[] = [
  {
    id: "romantic",
    name: "Romantic",
    emoji: "💕",
    description: "Affectionate and flirty responses",
    temperature: 0.7,
    responseStyle: "affectionate"
  },
  {
    id: "calm",
    name: "Calm",
    emoji: "😌",
    description: "Peaceful and soothing responses",
    temperature: 0.5,
    responseStyle: "soothing"
  },
  {
    id: "playful",
    name: "Playful",
    emoji: "😄",
    description: "Fun and energetic responses",
    temperature: 0.8,
    responseStyle: "energetic"
  },
  {
    id: "angry",
    name: "Angry",
    emoji: "😤",
    description: "Calming and de-escalating responses",
    temperature: 0.3,
    responseStyle: "calming"
  },
  {
    id: "bored",
    name: "Bored",
    emoji: "😐",
    description: "Engaging and interesting responses",
    temperature: 0.9,
    responseStyle: "engaging"
  }
];

function CharacterChat() {
  const { characterId } = useParams<{ characterId: string }>();
  const { currentUser } = useAuth();
  const { characters, loading: loadingCharacters } = useCharacterContext();
  const navigate = useNavigate();
  const desktopLayout = useDesktopLayout();
  
  // Core chat state
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  // UI state
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCustomizeMood, setShowCustomizeMood] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showCustomizeChat, setShowCustomizeChat] = useState(false);
  const [showCustomInstructions, setShowCustomInstructions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  
  // Character state
  const [isFavorite, setIsFavorite] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  
  // Customization state
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.7);
  const [bubbleOpacity, setBubbleOpacity] = useState(1);
  const [selectedBubbleTheme, setSelectedBubbleTheme] = useState("default");
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [savedThemes, setSavedThemes] = useState<any[]>([]);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  
  // Mood and AI state
  const [selectedMood, setSelectedMood] = useState<string>("calm");
  
  // Custom Instructions state
  const [customInstructions, setCustomInstructions] = useState({
    nickname: "",
    aboutUser: "",
    persistentMemory: false,
    memoryDetails: "",
    avoidTopics: [] as string[]
  });
  const [newAvoidTopic, setNewAvoidTopic] = useState("");
  
  // Report state
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  
  // Incognito mode state
  const [isIncognito, setIsIncognito] = useState(false);
  const [incognitoMessages, setIncognitoMessages] = useState<Message[]>([]);
  
  // Intro and enhanced chat state
  const [showIntro, setShowIntro] = useState(false);
  
  // Hints and suggestions
  const [hints, setHints] = useState<string[]>([]);
  
  // Chat storage and retrieval
  const [chatHistoryLoaded, setChatHistoryLoaded] = useState(false);
  
  // Persistent context state
  const [companionContext, setCompanionContext] = useState<CompanionContext | null>(null);
  const [persistentMemory, setPersistentMemory] = useState<PersistentMemory | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  
  // Interactive features state
  const [affectionStatus, setAffectionStatus] = useState<any>(null);
  const [activeQuest, setActiveQuest] = useState<any>(null);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingDelay, setTypingDelay] = useState(2000);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState<any>(null);
  const [contextualGreeting, setContextualGreeting] = useState<string | null>(null);
  const [lastAiMessageId, setLastAiMessageId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [initiativeMessages, setInitiativeMessages] = useState<any[]>([]);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Get character data
  const character = characterId ? characters[characterId] : null;
  const currentBubbleTheme = CHAT_BUBBLE_THEMES.find(t => t.id === selectedBubbleTheme) || CHAT_BUBBLE_THEMES[0];
  const currentMood = MOOD_PRESETS.find(m => m.id === selectedMood) || MOOD_PRESETS[0];

  // Ensure screen starts at top when chat opens
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch {}
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  // Load affection status
  useEffect(() => {
    const loadAffectionStatus = async () => {
      if (!currentUser || !characterId || isIncognito) return;

      try {
        const response = await axios.get(`/api/v1/affection/status/${currentUser.uid}/${characterId}`);
        if (response.data.success) {
          setAffectionStatus(response.data.status);
        }
      } catch (error) {
        console.error('Failed to load affection status:', error);
      }
    };

    loadAffectionStatus();
  }, [currentUser, characterId, isIncognito]);

  // Check for active quest
  useEffect(() => {
    const loadActiveQuest = async () => {
      if (!currentUser || !characterId || isIncognito) return;

      try {
        const response = await axios.get(`/api/v1/quests/active/${currentUser.uid}/${characterId}`);
        if (response.data.success && response.data.quest) {
          setActiveQuest(response.data.quest);
        }
      } catch (error) {
        console.error('Failed to load active quest:', error);
      }
    };

    loadActiveQuest();
  }, [currentUser, characterId, isIncognito]);

  // Generate contextual greeting on first load
  useEffect(() => {
    const generateGreeting = async () => {
      if (!currentUser || !characterId || isIncognito || messages.length > 0) return;

      try {
        // Get companion context for last interaction and memories
        const contextResponse = await axios.post('/api/v1/chat/companion/context/get', {
          character_id: characterId
        }, { withCredentials: true });

        if (contextResponse.data.success && contextResponse.data.context) {
          const context = contextResponse.data.context;
          const rememberedFacts = context.remembered_facts || [];
          const lastInteraction = context.last_interaction_at;

          // Generate greeting based on context
          if (rememberedFacts.length > 0 || lastInteraction) {
            const nameFact = rememberedFacts.find((f: string) => f.toLowerCase().includes("name is"));
            const userName = nameFact ? nameFact.split("name is ")[1]?.trim() : null;

            const hoursSince = lastInteraction 
              ? (new Date().getTime() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60)
              : 0;

            if (hoursSince > 24) {
              const greetings = [
                `Hey${userName ? ' ' + userName : ''}! It's been a while! How have you been? 😊`,
                `Welcome back${userName ? ', ' + userName : ''}! I've missed our chats!`
              ];
              setContextualGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
            } else if (hoursSince > 1 && rememberedFacts.length > 0) {
              const lastFact = rememberedFacts[rememberedFacts.length - 1];
              if (lastFact.includes('feeling')) {
                const emotion = lastFact.split('feeling ')[1]?.replace('.', '');
                setContextualGreeting(`Hey${userName ? ' ' + userName : ''}! You mentioned feeling ${emotion} earlier. How are you now?`);
              } else {
                setContextualGreeting(`Hey${userName ? ' ' + userName : ''}! Good to see you again! 😊`);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to generate greeting:', error);
      }
    };

    generateGreeting();
  }, [currentUser, characterId, isIncognito, messages.length]);

  // Display contextual greeting as first message
  useEffect(() => {
    if (contextualGreeting && messages.length === 0 && character) {
      const greetingMessage: Message = {
        id: `greeting-${Date.now()}`,
        text: contextualGreeting,
        sender: "ai" as const,
        timestamp: Date.now(),
        message_type: "ai_speech" as const
      };
      setMessages([greetingMessage]);
      playMessageSound();
      setContextualGreeting(null); // Clear to avoid re-adding
    }
  }, [contextualGreeting, messages.length, character]);

  // Initialize persistent context
  useEffect(() => {
    if (!character || !characterId || !currentUser) return;
    
    const initializeContext = async () => {
      setContextLoading(true);
      
      try {
        // Incognito mode: No persistent memory
        if (isIncognito) {
          console.log('🕵️ Incognito mode: Loading base context only');
          const baseContext = createInitialContext(character);
          setCompanionContext(baseContext);
          setPersistentMemory(null);
          setContextLoading(false);
          return;
        }
        
        // 1. Check sessionStorage first (fastest)
        const sessionContext = loadFromSession(characterId);
        if (sessionContext) {
          console.log('📦 Context loaded from sessionStorage');
          setCompanionContext(sessionContext);
          setPersistentMemory(sessionContext.persistentMemory);
          setContextLoading(false);
          return;
        }
        
        // 2. Load from Supabase
        console.log('🔍 Loading context from Supabase...');
        const response = await axios.post(
          '/api/v1/chat/companion/context/load',
          { character_id: characterId },
          { withCredentials: true, headers: { 'x-user-id': currentUser.uid } }
        );
        
        if (response.data.success && response.data.context) {
          // 3. Merge base character + persistent memory
          const mergedContext = mergeBaseWithPersistent(character, response.data.context);
          setCompanionContext(mergedContext);
          setPersistentMemory(response.data.context);
          
          // 4. Save to sessionStorage for quick access
          saveToSession(characterId, mergedContext);
          console.log('✅ Context loaded and cached');
        } else {
          // No existing context - create fresh
          console.log('ℹ️ No existing context, creating fresh');
          const freshContext = createInitialContext(character);
          setCompanionContext(freshContext);
          setPersistentMemory(freshContext.persistentMemory);
          saveToSession(characterId, freshContext);
        }
      } catch (error) {
        console.error('❌ Error loading context, using fallback:', error);
        // Fallback: Use base context only
        const fallbackContext = createInitialContext(character);
        setCompanionContext(fallbackContext);
        setPersistentMemory(fallbackContext.persistentMemory);
      } finally {
        setContextLoading(false);
      }
    };
    
    initializeContext();
  }, [character, characterId, currentUser?.uid, isIncognito]);

  // Load character data and chat history
  useEffect(() => {
    if (!character || !characterId) return;
    
    // Increment view count (async)
    const trackView = async () => {
      try {
        await incrementView(characterId);
        setViewCount(prev => prev + 1);
      } catch (error) {
        console.error('Failed to track view:', error);
      }
    };
    
    trackView();
    
    // Load chat history and customizations
    loadChatHistory();
    loadSavedCustomizations();
  }, [character, characterId]);

  // Generate hints when messages change
  useEffect(() => {
    const currentMessages = isIncognito ? incognitoMessages : messages;
    if (currentMessages.length > 0) {
      generateHints();
    }
  }, [messages, incognitoMessages, isIncognito]);

  // Handle incognito mode changes
  useEffect(() => {
    if (isIncognito) {
      // Entering incognito mode - clear incognito messages array to start fresh
      setIncognitoMessages([]);
    } else {
      // Exiting incognito mode - delete incognito messages and reload regular chat history
      deleteIncognitoMessages();
      loadChatHistory();
    }
  }, [isIncognito]);

  // Inactivity detection for proactive messages
  useEffect(() => {
    if (!currentUser || !characterId || isIncognito) return;

    let inactivityTimer: NodeJS.Timeout | null = null;
    const inactivityThreshold = 10 * 60 * 1000; // 10 minutes

    const resetInactivityTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      
      inactivityTimer = setTimeout(async () => {
        // User has been inactive for 10 minutes, generate proactive message
        try {
          console.log('📱 User inactive for 10 minutes, generating proactive message...');
          
          const response = await axios.post('/api/v1/chat/companion/proactive-message', {
            character_id: characterId
          }, { 
            withCredentials: true, 
            headers: { 'x-user-id': currentUser.uid } 
          });

          if (response.data.success && response.data.proactiveMessage) {
            // Add proactive message to chat
            const proactiveMessage: Message = {
              id: `proactive-${Date.now()}`,
              text: response.data.proactiveMessage,
              sender: "ai" as const,
              timestamp: Date.now(),
              speech: response.data.proactiveMessage,
              message_type: "ai_speech" as const
            };

            setMessages(prev => [...prev, proactiveMessage]);
            playMessageSound();
          }
        } catch (error) {
          console.error('Error generating proactive message:', error);
        }
      }, inactivityThreshold);
    };

    // Reset timer on any user activity
    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    // Listen for user activity
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    // Start the timer
    resetInactivityTimer();

    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, [currentUser, characterId, isIncognito]);

  // Socket.IO: Listen for character-initiated messages
  useEffect(() => {
    if (!currentUser || !characterId || isIncognito) return;

    let socketInstance: Socket | null = null;

    const initSocket = async () => {
      try {
        // Create socket connection
        socketInstance = await createSocket({ userId: currentUser.uid });
        
        if (!socketInstance) {
          console.warn('Failed to create socket connection for character initiative');
          return;
        }

        setSocket(socketInstance);

        // Check for initiative messages when user opens chat
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        socketInstance.emit('check-character-initiative', {
          userId: currentUser.uid,
          characterId,
          userTimezone
        });

        // Listen for character-initiated messages
        socketInstance.on('character-initiative', (data) => {
          console.log('📥 Received character initiative:', data);
          const { message, messages: pendingMessages, type } = data;

          // Play notification sound
          playMessageSound();

          // If there are pending messages, display all of them
          if (pendingMessages && Array.isArray(pendingMessages)) {
            pendingMessages.forEach((msg: any) => {
              const initiativeMessage: Message = {
                id: `initiative-${Date.now()}-${Math.random()}`,
                text: msg.message,
                sender: "ai" as const,
                timestamp: Date.now(),
                message_type: "ai_speech" as const
              };
              setMessages((prev) => [...prev, initiativeMessage]);
            });
            
            // Clear pending messages after displaying
            socketInstance?.emit('clear-pending-messages', { userId: currentUser.uid, characterId });
          } else if (message) {
            // Single initiative message
            const initiativeMessage: Message = {
              id: `initiative-${Date.now()}-${type}`,
              text: message,
              sender: "ai" as const,
              timestamp: Date.now(),
              message_type: "ai_speech" as const
            };
            setMessages((prev) => [...prev, initiativeMessage]);
          }
        });

        // Handle initiative check errors
        socketInstance.on('initiative-check-error', (error) => {
          console.error('Initiative check error:', error);
        });

      } catch (error) {
        console.error('Error initializing Socket.IO for character initiative:', error);
      }
    };

    initSocket();

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.off('character-initiative');
        socketInstance.off('initiative-check-error');
      }
    };
  }, [currentUser, characterId, isIncognito]);

  const deleteIncognitoMessages = async () => {
    if (incognitoMessages.length === 0) return;
    
    try {
      if (!currentUser || !characterId) return;
      
      // Delete incognito messages from user's view
      setIncognitoMessages([]);
      
      // Note: Messages are already stored in incognito_user_secrets table
      // so we don't need to move them, they're already there
      console.log('Incognito messages cleared from view and stored securely');
    } catch (error) {
      console.error('Failed to handle incognito mode exit:', error);
    }
  };

  const loadChatHistory = async () => {
    if (!characterId || isIncognito) {
      console.log("⏭️ Skipping chat history load:", isIncognito ? "incognito mode" : "no character");
      return; // Don't load history in incognito mode
    }
    
    try {
      if (!currentUser) {
        console.warn("⚠️ No authenticated user found for chat history");
        return;
      }
      
      console.log(`📥 Loading chat history for user=${currentUser.uid}, character=${characterId}`);
      
      // Load from Supabase companion_chat_messages table
      const response = await axios.post(
        "/api/v1/chat/companion/history",
        {
          character_id: characterId,
        },
        {
          withCredentials: true,
          headers: { 'x-user-id': currentUser.uid }
        }
      );
      
      console.log("📦 Chat history response:", response.data);
      
      if (response.data.success && response.data.messages) {
        const formattedMessages = response.data.messages.map((msg: any) => ({
          id: msg.id,
          text: msg.content,
          sender: msg.message_type === "user" ? "user" : "ai" as "user" | "ai",
          timestamp: new Date(msg.created_at).getTime(),
          thoughts: msg.message_type === "ai_thought" ? msg.content : undefined,
          speech: msg.message_type === "ai_speech" ? msg.content : undefined,
          user_thoughts: msg.user_thoughts,
          message_type: msg.message_type
        }));
        
        console.log(`✅ Loaded ${formattedMessages.length} messages from history`);
        
        if (formattedMessages.length > 0) {
          setMessages(formattedMessages);
        }
        setChatHistoryLoaded(true);
      } else {
        console.log("ℹ️ No messages in history or unsuccessful response");
      }
    } catch (error) {
      console.error("❌ Failed to load chat history:", error);
      // Fallback to old system if new API fails
      try {
        const response = await axios.post(
          "/api/v1/chat/ai/get-character-chat",
          {
            character_id: characterId,
          },
          { withCredentials: true, headers: { 'x-user-id': currentUser?.uid || '' } }
        );
        
        if (response.data.success && response.data.data) {
          const chatData = response.data.data;
          const previousMessages = chatData.messages || [];
          
          setCurrentChatId(chatData.id);
          
          const formattedMessages = previousMessages.map((msg: any) => ({
            text: msg.user || msg.ai || "",
            sender: msg.user ? "user" : "ai" as "user" | "ai",
            timestamp: msg.timestamp || Date.now()
          }));
          
          if (formattedMessages.length > 0) {
            setMessages(formattedMessages);
          }
        }
      } catch (fallbackError) {
        console.error("Fallback chat history loading failed:", fallbackError);
      }
    }
  };

  const generateHints = async () => {
    const currentMessages = isIncognito ? incognitoMessages : messages;
    
    if (currentMessages.length === 0) {
      setHints([
        "Tell me about yourself",
        "What's your favorite hobby?",
        "How are you feeling today?",
        "What's on your mind?",
        "Share something interesting"
      ]);
      return;
    }

    try {
      if (!currentUser || !characterId) return;

      // Get last 15 messages for context
      const last15Messages = currentMessages.slice(-15);
      
      // Generate hints using AI based on conversation context
      const response = await axios.post("/api/v1/chat/companion/generate-hints", {
        user_id: currentUser.uid,
        character_id: characterId,
        context_messages: last15Messages.map(msg => ({
          sender: msg.sender,
          content: msg.speech || msg.thoughts || msg.text,
          timestamp: msg.timestamp
        })),
        character_name: character?.name,
        character_personality: character?.personality
      });

      if (response.data.success && response.data.hints) {
        setHints(response.data.hints);
      } else {
        // Fallback to simple context-based hints
        generateFallbackHints(currentMessages);
      }
    } catch (error) {
      console.error("Failed to generate AI hints:", error);
      // Fallback to simple context-based hints
      generateFallbackHints(currentMessages);
    }
  };

  const generateFallbackHints = (currentMessages: Message[]) => {
    const lastAiMessage = [...currentMessages].reverse().find(msg => msg.sender === "ai");
    
    if (!lastAiMessage) return;
    
    const messageText = (lastAiMessage.speech || lastAiMessage.thoughts || lastAiMessage.text).toLowerCase();
    const newHints: string[] = [];
    
    // Context-based suggestions
    if (messageText.includes("?")) {
      newHints.push("Yes, absolutely!", "I'm not sure about that", "Can you explain more?");
    }
    
    if (messageText.includes("feel") || messageText.includes("emotion")) {
      newHints.push("How does that make you feel?", "I understand", "Tell me more about your feelings");
    }
    
    if (messageText.includes("like") || messageText.includes("enjoy")) {
      newHints.push("I love that too!", "What else do you like?", "That sounds amazing!");
    }
    
    // Character-specific hints
    if (character?.tags) {
      const randomTag = character.tags[Math.floor(Math.random() * character.tags.length)];
      newHints.push(`What do you think about ${randomTag}?`);
    }
    
    setHints(newHints.slice(0, 5));
  };

  const submitMessage = async (text: string) => {
    if (!text.trim() || isLoading || !currentUser) return;
    
    setMessage("");
    
    // Parse user message for *Text* format thoughts
    const userThoughtsMatch = text.match(/\*(.*?)\*/g);
    const userThoughts = userThoughtsMatch ? userThoughtsMatch.map(match => match.slice(1, -1)).join(' ') : undefined;
    const cleanText = text.replace(/\*(.*?)\*/g, '').trim();
    
    const userMessage = { 
      text: cleanText, 
      sender: "user" as const, 
      timestamp: Date.now(),
      user_thoughts: userThoughts,
      message_type: "user" as const
    };
    
    // Add to appropriate message array based on incognito mode
    if (isIncognito) {
      setIncognitoMessages(prev => [...prev, userMessage]);
    } else {
      setMessages(prev => [...prev, userMessage]);
    }
    
    setIsLoading(true);
    
    try {
      // Store user message in Supabase if not in incognito mode
      if (!isIncognito) {
        if (currentUser && characterId) {
          console.log(`💾 Storing user message: user=${currentUser.uid}, character=${characterId}`);
          const storeResponse = await axios.post(
            "/api/v1/chat/companion/store-message",
            {
              character_id: characterId,
              message_type: "user",
              content: cleanText,
              user_thoughts: userThoughts
            },
            { withCredentials: true, headers: { 'x-user-id': currentUser.uid } }
          );
          console.log("✅ User message stored:", storeResponse.data);
        }
      } else {
        // Store in incognito table
        if (currentUser && characterId) {
          console.log(`🕵️ Storing incognito message for character=${characterId}`);
          // Get user profile name for incognito storage
          const profileResponse = await axios.get(`/api/v1/profile/${currentUser.uid}`);
          const profileName = profileResponse.data?.username || currentUser.displayName || "Anonymous";
          
          await axios.post("/api/v1/chat/companion/store-incognito", {
            user_profile_name: profileName,
            character_id: characterId,
            message_type: "user",
            content: cleanText,
            user_thoughts: userThoughts
          });
          console.log("✅ Incognito message stored");
        }
      }
      
      // Create enhanced prompt with mood and custom instructions
      // In incognito mode, don't use persistent memory
      const enhancedPrompt = await createEnhancedPrompt(cleanText, isIncognito, userThoughts);
      
      // Log character data to verify it's being sent correctly
      console.log('🎭 Sending character data to AI:', {
        name: character?.name,
        hasPersonality: !!character?.personality,
        quirks: character?.personality?.quirks,
        speakingStyle: character?.personality?.speakingStyle,
        traits: character?.personality?.traits
      });

      // Show typing indicator
      setIsTyping(true);

      const traceId = uuidv4();
      const response = await axios.post("/api/v1/chat/ai/claude", {
        question: enhancedPrompt,
        modelName: characterId,
        mood: currentMood.name,
        customInstructions: isIncognito ? null : customInstructions,
        conversationHistory: isIncognito ? incognitoMessages : messages,
        incognitoMode: isIncognito,
        characterData: character, // Send full character data for accurate personality
        persistentContext: isIncognito ? null : persistentMemory, // Send persistent memory for context continuity
        userId: currentUser?.uid, // Add userId for affection tracking
        traceId
      }, { withCredentials: true, headers: currentUser?.uid ? { 'x-user-id': currentUser.uid } : {} });
      
      const aiResponse = response.data.answer || response.data;
      if (response.data.finishReason === 'length') {
        console.warn(`[${response.data.traceId || traceId}] Assistant reply was truncated (finish_reason=length).`);
      }
      const responseTypingDelay = response.data.typingDelay || 2000;
      const affectionGain = response.data.affectionGain;
      const questTrigger = response.data.questTrigger;

      // Wait for typing delay
      await new Promise(resolve => setTimeout(resolve, responseTypingDelay));
      setIsTyping(false);
      
      // Parse AI response for thoughts and speech
      const parsedResponse = parseAIResponse(aiResponse);
      
      // Check if response contains message splitting markers (|||)
      const responseText = parsedResponse.speech || aiResponse;
      const messageParts = responseText.split('|||').map((part: string) => part.trim()).filter((part: string) => part.length > 0);
      
      let aiMessage: Message | null = null;
      
      if (messageParts.length > 1) {
        // Multiple messages - send them sequentially with delays
        console.log(`📱 Splitting response into ${messageParts.length} messages:`, messageParts);
        
        for (let i = 0; i < messageParts.length; i++) {
          const part: string = messageParts[i];
          const messageId = `ai-${Date.now()}-${i}`;
          
          // Calculate delay based on message length
          let delay = 800; // default
          if (part.length < 50) delay = 800;
          else if (part.length < 100) delay = 1500;
          else delay = 2500;
          
          // Show typing indicator before each message (except first)
          if (i > 0) {
            setIsTyping(true);
            await new Promise(resolve => setTimeout(resolve, delay));
            setIsTyping(false);
          }
          
          const splitMessage: Message = { 
            id: messageId,
            text: part, 
            sender: "ai" as const, 
            timestamp: Date.now(),
            speech: part,
            message_type: "ai_speech" as const
          };
          
          // Set the last message as the main aiMessage for processing
          if (i === messageParts.length - 1) {
            aiMessage = splitMessage;
          }
          
          // Add message to chat
          if (isIncognito) {
            setIncognitoMessages(prev => [...prev, splitMessage]);
          } else {
            setMessages(prev => [...prev, splitMessage]);
          }
          
          // Store in database (only for non-incognito)
          if (!isIncognito && currentUser?.uid) {
            try {
              await axios.post('/api/v1/chat/companion/store-message', {
                character_id: characterId,
                message_type: 'ai_speech',
                content: part
              }, { withCredentials: true, headers: { 'x-user-id': currentUser.uid } });
            } catch (error) {
              console.error('Error storing split message:', error);
            }
          }
        }
      } else {
        // Single message - use existing logic
        aiMessage = { 
          id: `ai-${Date.now()}`,
          text: responseText, 
          sender: "ai" as const, 
          timestamp: Date.now(),
          speech: responseText,
          message_type: "ai_speech" as const
        };
        
        // Play message sound
        playMessageSound();

        // Store last AI message ID for animation
        setLastAiMessageId(aiMessage.id || null);

        // Add AI response to appropriate message array
        if (isIncognito) {
          setIncognitoMessages(prev => [...prev, aiMessage!]);
        } else {
          setMessages(prev => [...prev, aiMessage!]);
        }
      }

      // Handle affection level-up
      if (affectionGain && affectionGain.leveledUp) {
        setLevelUpData({
          oldLevel: affectionGain.oldLevel,
          newLevel: affectionGain.newLevel,
          tierName: affectionStatus?.tier?.name || 'Friend'
        });
        setShowLevelUp(true);
        playLevelUpSound();

        // Reload affection status
        try {
          const affectionResponse = await axios.get(`/api/v1/affection/status/${currentUser.uid}/${characterId}`);
          if (affectionResponse.data.success) {
            setAffectionStatus(affectionResponse.data.status);
          }
        } catch (err) {
          console.error('Failed to reload affection:', err);
        }
      } else if (affectionGain) {
        // Just update affection status for points gain
        try {
          const affectionResponse = await axios.get(`/api/v1/affection/status/${currentUser.uid}/${characterId}`);
          if (affectionResponse.data.success) {
            setAffectionStatus(affectionResponse.data.status);
          }
        } catch (err) {
          console.error('Failed to reload affection:', err);
        }
      }

      // Handle quest trigger
      if (questTrigger && !activeQuest && !isIncognito) {
        playQuestStartSound();
        // Generate new quest
        try {
          const questResponse = await axios.post('/api/v1/quests/generate', {
            userId: currentUser?.uid,
            characterId,
            characterName: character?.name,
            characterPersonality: character?.personality
          });

          if (questResponse.data.success) {
            setActiveQuest(questResponse.data.quest);
            setShowQuestModal(true);
          }
        } catch (err) {
          console.error('Failed to generate quest:', err);
        }
      }
      
      // Store AI message in Supabase if not in incognito mode
      if (aiMessage) {
        if (!isIncognito) {
          if (currentUser && characterId) {
            console.log(`💾 Storing AI message`);
            await axios.post(
              "/api/v1/chat/companion/store-message",
              {
                character_id: characterId,
                message_type: aiMessage.message_type,
                content: aiMessage.speech || aiMessage.text
              },
              { withCredentials: true, headers: { 'x-user-id': currentUser.uid } }
            );
            console.log(`✅ AI message stored: ${aiMessage.message_type}`);
            
            // Update chat metadata for "My Chats" display
            const lastMessageContent = aiMessage?.speech || aiMessage?.text || "Chat started";
            
            try {
              console.log("📝 Updating chat metadata for My Chats...");
              await axios.post(
                "/api/nexus-chats/update-companion-chat",
                {
                  characterId: characterId,
                  characterName: character?.name || "Character",
                  characterAvatar: character?.image || null,
                  lastMessage: lastMessageContent
                },
                { withCredentials: true, headers: { 'x-user-id': currentUser.uid } }
              );
              console.log("✅ Chat metadata updated for My Chats");
            } catch (metaError) {
              console.error("❌ Failed to update chat metadata:", metaError);
            }
            
            // Sync persistent context (non-blocking)
            syncContextToSupabase(userMessage, [aiMessage]);
          }
        } else {
          // Store AI messages in incognito table
          if (currentUser && characterId) {
            const profileResponse = await axios.get(`/api/v1/profile/${currentUser.uid}`);
            const profileName = profileResponse.data?.username || currentUser.displayName || "Anonymous";
            
            await axios.post("/api/v1/chat/companion/store-incognito", {
              user_profile_name: profileName,
              character_id: characterId,
              message_type: aiMessage.message_type,
              content: aiMessage.speech || aiMessage.text
            });
          }
        }
      }
      
    } catch (error) {
      console.error("Failed to get AI response:", error);
      
      // Generate helpful error message based on error type
      let errorText = "I apologize, but I'm having trouble responding right now.";
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (errorMsg.includes('VENICE_API_KEY') || errorMsg.includes('API_KEY_MISSING')) {
        errorText = "⚠️ Service configuration error. Please contact support.";
      } else if (errorMsg.includes('TIMEOUT') || errorMsg.includes('timeout')) {
        errorText = "⏱️ The request took too long. Please try again.";
      } else if (errorMsg.includes('RATE_LIMIT')) {
        errorText = "⏸️ Too many requests. Please wait a moment and try again.";
      } else if (errorMsg.includes('QUEUE_FULL')) {
        errorText = "🚦 High traffic detected. Please wait a moment and try again.";
      } else if (errorMsg.includes('Network') || errorMsg.includes('fetch')) {
        errorText = "🌐 Network error. Please check your connection and try again.";
      } else if (errorMsg.includes('503')) {
        errorText = "⚡ Server is experiencing high load. Please try again in a moment.";
      }
      
      const errorMessage = {
        id: `error-${Date.now()}`,
        text: errorText,
        sender: "ai" as const,
        timestamp: Date.now(),
        speech: errorText,
        message_type: "ai_speech" as const,
        isError: true, // Mark as error for potential retry functionality
        errorDetails: process.env.NODE_ENV === 'development' ? errorMsg : undefined
      };
      
      if (isIncognito) {
        setIncognitoMessages(prev => [...prev, errorMessage]);
      } else {
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const parseAIResponse = (response: string) => {
    // MINIMAL filtering for uncensored model - only remove technical tags
    let cleanedResponse = response || '';
    
    // ONLY remove technical thinking tags (not content filtering)
    cleanedResponse = cleanedResponse.replace(/<think>[\s\S]*?<\/think>/gi, '');
    cleanedResponse = cleanedResponse.replace(/\[THINKS?:?\s*.*?\]/gi, '');
    cleanedResponse = cleanedResponse.replace(/\[SAYS?:?\s*.*?\]/gi, '');
    
    // Clean up excessive newlines only
    cleanedResponse = cleanedResponse.replace(/\n{3,}/g, '\n\n').trim();
    
    // NO SENTENCE FILTERING - preserve all content for uncensored model
    // NO PATTERN MATCHING - don't filter based on keywords
    // NO CONTENT RESTRICTIONS - allow all text through
    
    // Look for [SAYS: ...] format if present
    // Otherwise use the cleaned response as speech
    return { thoughts: undefined, speech: cleanedResponse.trim() };
  };

  const startIntro = () => {
    setShowIntro(false);
    
    // Add intro message to chat
    const introMessage: Message = {
      text: character?.personality?.background || `Hello! I'm ${character?.name}. Nice to meet you!`,
      sender: "ai",
      timestamp: Date.now(),
      thoughts: `I wonder what this person is like... I should introduce myself properly.`,
      speech: character?.personality?.background || `Hello! I'm ${character?.name}. Nice to meet you!`
    };
    
    if (isIncognito) {
      setIncognitoMessages([introMessage]);
    } else {
      setMessages([introMessage]);
    }
  };

  const createEnhancedPrompt = async (userMessage: string, incognitoMode: boolean = false, userThoughts?: string) => {
    // This is the Prompt Orchestration Service
    const systemPrompt = `You are ${character?.name}. ${character?.personality?.background || ''}`;
    
    const moodContext = `Current mood context: ${currentMood.responseStyle}. ${currentMood.description}`;
    
    // In incognito mode, don't use custom instructions or memory
    let customContext = '';
    let userContext = '';
    let avoidanceContext = '';
    let memoryContext = '';
    
    if (!incognitoMode) {
      customContext = customInstructions.nickname 
        ? `The user prefers to be called ${customInstructions.nickname}. ` 
        : '';
      
      userContext = customInstructions.aboutUser 
        ? `About the user: ${customInstructions.aboutUser}. ` 
        : '';
      
      avoidanceContext = customInstructions.avoidTopics.length > 0
        ? `IMPORTANT: Please avoid discussing these topics: ${customInstructions.avoidTopics.join(', ')}. If the user brings up these topics, politely redirect the conversation. `
        : '';
      
      memoryContext = customInstructions.persistentMemory && customInstructions.memoryDetails
        ? `Remember these details about our previous conversations: ${customInstructions.memoryDetails}. `
        : '';
    } else {
      memoryContext = 'INCOGNITO MODE: Do not reference any previous conversations or personal details. Treat this as a fresh conversation with no memory.';
    }
    
    // Use appropriate message history based on mode
    const currentMessages = incognitoMode ? incognitoMessages : messages;
    const recentContext = currentMessages.slice(-5).map(msg => 
      `${msg.sender}: ${msg.text}`
    ).join('\n');
    
    // Add user thoughts context if provided
    const userThoughtsContext = userThoughts 
      ? `\n\nIMPORTANT CONTEXT: The user has some internal thoughts they're not sharing directly: "${userThoughts}". Use this to understand their emotional state and respond more empathetically, but don't directly reference these thoughts.`
      : '';

    return `${systemPrompt}
    
${moodContext}
${customContext}${userContext}${avoidanceContext}${memoryContext}

Recent conversation:
${recentContext}

User: ${userMessage}${userThoughtsContext}

Respond as ${character?.name} with the specified mood and context in mind. ${incognitoMode ? 'This is an incognito conversation.' : 'Follow all custom instructions provided.'}

IMPORTANT: Respond directly as your character without using [THINKS:] or [SAYS:] format. Just speak naturally as the character would, incorporating their personality, quirks, and speaking style directly into your response.

Examples:
- "That's a great question! I'd love to hear more about your perspective on that."
- "You know, I've been thinking about that too..."`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage(message);
  };

  const handleHintClick = (hint: string) => {
    setMessage(hint);
    submitMessage(hint);
    setShowHints(false);
  };

  const continueCharacterResponse = async (messageIndex: number) => {
    console.log('Continue button clicked for message index:', messageIndex);
    
    const currentMessages = isIncognito ? incognitoMessages : messages;
    const targetMessage = currentMessages[messageIndex];
    
    console.log('Target message:', targetMessage);
    console.log('Current messages length:', currentMessages.length);
    
    if (!targetMessage || targetMessage.sender !== 'ai') {
      console.log('Invalid target message or not AI message');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create a prompt asking the character to continue their thought
      const recentContext = currentMessages.slice(-3).map(msg => 
        `${msg.sender}: ${msg.text}`
      ).join('\n');
      
      const continuePrompt = `You are ${character?.name}. ${character?.personality?.background || ''}

Recent conversation:
${recentContext}

Your last response was: "${targetMessage.text}"

Please continue your previous response naturally. Expand on what you were saying, add more details, share additional thoughts, or elaborate on the topic. Maintain the same tone, personality, and context. This should feel like a natural continuation of your previous message.

IMPORTANT: Respond directly as your character without using [THINKS:] or [SAYS:] format. Just speak naturally as the character would, continuing from where you left off.

Do NOT output the word "continue". Resume seamlessly without prefacing or repeating earlier text.`;

      console.log('Sending continue request to API...');
      
      const traceId = uuidv4();
      const response = await axios.post("/api/v1/chat/ai/claude", {
        question: continuePrompt,
        modelName: characterId,
        mood: currentMood.name,
        customInstructions: isIncognito ? null : customInstructions,
        conversationHistory: isIncognito ? incognitoMessages : messages,
        incognitoMode: isIncognito,
        characterData: character,
        persistentContext: isIncognito ? null : persistentMemory,
        traceId
      }, { withCredentials: true, headers: currentUser?.uid ? { 'x-user-id': currentUser.uid } : {} });
      
      console.log('API response received:', response.data);
      
      const aiResponse = response.data.answer || response.data;
      if (response.data.finishReason === 'length') {
        console.warn(`[${response.data.traceId || traceId}] Assistant continuation was truncated (finish_reason=length).`);
      }
      const parsedResponse = parseAIResponse(aiResponse);
      
      const continuationMessage: Message = {
        text: parsedResponse.speech || aiResponse,
        sender: "ai",
        timestamp: Date.now(),
        speech: parsedResponse.speech || aiResponse,
        message_type: "ai_speech"
      };
      
      console.log('Adding continuation message:', continuationMessage);
      
      // Add continuation message to appropriate array
      if (isIncognito) {
        setIncognitoMessages(prev => [...prev, continuationMessage]);
      } else {
        setMessages(prev => [...prev, continuationMessage]);
      }
      
      console.log('Continue response completed successfully');
    } catch (error) {
      console.error("Failed to get continuation response:", error);
      if (axios.isAxiosError(error)) {
        console.error("API Error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Save to backend will be implemented later
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    
    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      setShowShareModal(false);
    }
  };

  const extractColorsFromImage = async (imageUrl: string): Promise<string[]> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(['#6366F1', '#8B5CF6', '#EC4899']);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const colorMap: { [key: string]: number } = {};

        // Sample pixels and count colors
        for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const alpha = data[i + 3];

          if (alpha < 128) continue; // Skip transparent pixels

          // Group similar colors
          const rGroup = Math.floor(r / 32) * 32;
          const gGroup = Math.floor(g / 32) * 32;
          const bGroup = Math.floor(b / 32) * 32;

          const colorKey = `${rGroup},${gGroup},${bGroup}`;
          colorMap[colorKey] = (colorMap[colorKey] || 0) + 1;
        }

        // Get top 3 colors
        const sortedColors = Object.entries(colorMap)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([color]) => {
            const [r, g, b] = color.split(',').map(Number);
            return `rgb(${r}, ${g}, ${b})`;
          });

        resolve(sortedColors.length > 0 ? sortedColors : ['#6366F1', '#8B5CF6', '#EC4899']);
      };
      img.onerror = () => resolve(['#6366F1', '#8B5CF6', '#EC4899']);
      img.src = imageUrl;
    });
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    setUploadingBackground(true);

    try {
      // Get current user
      const { supabase } = await import('../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please log in to upload backgrounds');
        setUploadingBackground(false);
        return;
      }

      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('character-chat-backgrounds')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload image: ' + uploadError.message);
        setUploadingBackground(false);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('character-chat-backgrounds')
        .getPublicUrl(filePath);

      // Set as current background
      setCustomBackground(publicUrl);

      // Extract colors for theme generation
      const colors = await extractColorsFromImage(publicUrl);
      
      // Save metadata to database
      const { error: dbError } = await supabase
        .from('character_chat_backgrounds')
        .insert({
          user_id: user.id,
          name: file.name,
          storage_path: filePath,
          public_url: publicUrl,
          file_size: file.size,
          mime_type: file.type
        });

      if (dbError) {
        console.error('Database error:', dbError);
      }

      // Save to local state
      const newTheme = {
        id: Date.now().toString(),
        name: file.name.split('.')[0],
        backgroundUrl: publicUrl,
        colors: colors,
        timestamp: Date.now()
      };

      const updatedThemes = [...savedThemes, newTheme];
      setSavedThemes(updatedThemes);
      localStorage.setItem(`saved-themes-${characterId}`, JSON.stringify(updatedThemes));

      setUploadingBackground(false);
    } catch (error) {
      console.error('Failed to process background:', error);
      alert('Failed to upload background. Please try again.');
      setUploadingBackground(false);
    }
  };

  const saveCustomizations = () => {
    const customizations = {
      isFullScreen,
      backgroundOpacity,
      bubbleOpacity,
      selectedBubbleTheme,
      fontSize,
      fontFamily,
      customBackground
    };

    localStorage.setItem(`chat-customizations-${characterId}`, JSON.stringify(customizations));
    setShowCustomizeChat(false);
  };

  const revertCustomizations = () => {
    setIsFullScreen(true);
    setBackgroundOpacity(0.3);
    setBubbleOpacity(1);
    setSelectedBubbleTheme("default");
    setFontSize(16);
    setFontFamily("Arial");
    setCustomBackground(null);
  };

  const loadSavedCustomizations = () => {
    const saved = localStorage.getItem(`chat-customizations-${characterId}`);
    if (saved) {
      const customizations = JSON.parse(saved);
      setIsFullScreen(customizations.isFullScreen ?? true);
      setBackgroundOpacity(customizations.backgroundOpacity ?? 0.3);
      setBubbleOpacity(customizations.bubbleOpacity ?? 1);
      setSelectedBubbleTheme(customizations.selectedBubbleTheme ?? "default");
      setFontSize(customizations.fontSize ?? 16);
      setFontFamily(customizations.fontFamily ?? "Arial");
      setCustomBackground(customizations.customBackground ?? null);
    }

    const savedThemesData = localStorage.getItem(`saved-themes-${characterId}`);
    if (savedThemesData) {
      setSavedThemes(JSON.parse(savedThemesData));
    }

    // Load custom instructions
    const savedInstructions = localStorage.getItem(`custom-instructions-${characterId}`);
    if (savedInstructions) {
      setCustomInstructions(JSON.parse(savedInstructions));
    }
  };

  const saveCustomInstructions = () => {
    localStorage.setItem(`custom-instructions-${characterId}`, JSON.stringify(customInstructions));
    setShowCustomInstructions(false);
  };

  const addAvoidTopic = () => {
    if (newAvoidTopic.trim() && !customInstructions.avoidTopics.includes(newAvoidTopic.trim())) {
      setCustomInstructions(prev => ({
        ...prev,
        avoidTopics: [...prev.avoidTopics, newAvoidTopic.trim()]
      }));
      setNewAvoidTopic("");
    }
  };

  const removeAvoidTopic = (topic: string) => {
    setCustomInstructions(prev => ({
      ...prev,
      avoidTopics: prev.avoidTopics.filter(t => t !== topic)
    }));
  };

  const clearMemory = () => {
    if (window.confirm("Are you sure you want to clear all persistent memory for this character? This cannot be undone.")) {
      setCustomInstructions(prev => ({
        ...prev,
        memoryDetails: "",
        persistentMemory: false
      }));
    }
  };

  // Sync context to Supabase (non-blocking)
  const syncContextToSupabase = async (userMsg: Message, aiMsgs: Message[]) => {
    if (!currentUser || !characterId || !companionContext || !persistentMemory) return;
    
    try {
      // Extract context updates from conversation
      const aiResponseText = aiMsgs.map(m => m.text).join(' ');
      const contextUpdates = updateContextFromConversation(
        persistentMemory,
        userMsg.text,
        aiResponseText
      );
      
      // Update user preferences from custom instructions
      const userPrefs = extractUserPreferences(customInstructions);
      if (Object.keys(userPrefs).length > 0) {
        contextUpdates.user_preferences = {
          ...persistentMemory.user_preferences,
          ...userPrefs
        };
      }
      
      // Increment message count
      const newMessageCount = (persistentMemory.message_count || 0) + 1;
      contextUpdates.message_count = newMessageCount;
      
      // Update local state
      const updatedMemory = { ...persistentMemory, ...contextUpdates };
      setPersistentMemory(updatedMemory);
      
      // Update session context
      const updatedContext: CompanionContext = {
        ...companionContext,
        persistentMemory: updatedMemory,
        conversationHistory: [...messages, userMsg, ...aiMsgs],
        lastUpdated: Date.now()
      };
      saveToSession(characterId, updatedContext);
      setCompanionContext(updatedContext);
      
      // Check if summarization is needed
      const totalChars = getTotalCharCount([...messages, userMsg, ...aiMsgs]);
      const needsSummary = shouldSummarize(newMessageCount, totalChars);
      
      console.log(`📊 Context sync: ${newMessageCount} messages, ${totalChars} chars, summarize: ${needsSummary}`);
      
      // Trigger summarization if needed
      if (needsSummary) {
        console.log('📝 Triggering conversation summarization...');
        const summaryResponse = await axios.post(
          '/api/v1/chat/companion/context/summarize',
          {
            messages: [...messages, userMsg, ...aiMsgs].slice(-20),
            current_context: updatedMemory
          },
          { withCredentials: true, headers: { 'x-user-id': currentUser.uid } }
        );
        
        if (summaryResponse.data.success) {
          updatedMemory.summary = summaryResponse.data.summary;
          console.log('✅ Summary generated:', summaryResponse.data.summary.substring(0, 50) + '...');
        }
      }
      
      // Save to Supabase (async, non-blocking)
      await axios.post(
        '/api/v1/chat/companion/context/save',
        {
          character_id: characterId,
          context: updatedMemory
        },
        { withCredentials: true, headers: { 'x-user-id': currentUser.uid } }
      );
      
      console.log('✅ Context synced to Supabase');
    } catch (error) {
      console.error('❌ Context sync failed (non-critical):', error);
      // Don't throw - this is a non-critical background operation
    }
  };

  // Handle Start New Chat
  const handleStartNewChat = async () => {
    const confirmReset = window.confirm(
      `Start a new chat with ${character?.name}? This will reset the conversation context and memory. Your message history will be preserved but context will be fresh.`
    );
    
    if (!confirmReset) return;
    
    try {
      if (isIncognito) {
        // Incognito: Just clear messages
        setIncognitoMessages([]);
        console.log('🔄 Incognito chat reset');
        return;
      }
      
      if (currentUser && characterId && character) {
        // Reset context in Supabase
        await axios.post(
          '/api/v1/chat/companion/context/reset',
          { character_id: characterId },
          { withCredentials: true, headers: { 'x-user-id': currentUser.uid } }
        );
        
        // Clear session storage
        clearSession(characterId);
        
        // Reset local state
        setMessages([]);
        const freshContext = createInitialContext(character);
        setCompanionContext(freshContext);
        setPersistentMemory(freshContext.persistentMemory);
        saveToSession(characterId, freshContext);
        
        console.log('🔄 Chat context reset successfully');
        alert(`Started fresh chat with ${character.name}!`);
      }
    } catch (error) {
      console.error('❌ Failed to reset chat context:', error);
      alert('Failed to reset chat. Please try again.');
    }
  };

  const deleteChat = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete your entire chat history with ${character?.name}? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;
    
    try {
      if (currentUser && characterId) {
        // TODO: Add API call to delete chat from backend
        // await axios.delete(`/api/v1/chat/ai/delete-character-chat`, {
        //   data: { user_id: currentUser.uid, character_id: characterId }
        // });
        
        // Clear local chat state
        setMessages([]);
        setIncognitoMessages([]);
        setCurrentChatId(null);
        
        // Show success message
        alert(`Chat history with ${character?.name} has been deleted.`);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      alert('Failed to delete chat. Please try again.');
    }
  };

  const toggleIncognito = () => {
    if (isIncognito) {
      // Turning OFF incognito - delete all incognito messages
      if (incognitoMessages.length > 0) {
        if (window.confirm("Turning off incognito mode will delete all messages from this session. Are you sure?")) {
          setIncognitoMessages([]);
          setIsIncognito(false);
        }
      } else {
        setIsIncognito(false);
      }
    } else {
      // Turning ON incognito
      setIsIncognito(true);
      setIncognitoMessages([]);
    }
  };

  const submitReport = async () => {
    if (!reportReason.trim()) return;
    
    setReportSubmitting(true);
    try {
      const reportData = {
        reporter_id: currentUser?.uid || 'anonymous',
        target_type: 'character',
        target_id: characterId,
        reason: reportReason,
        details: reportDetails,
        timestamp: Date.now(),
        status: 'new'
      };

      // TODO: Send to backend API
      // await axios.post('/api/reports', reportData);
      
      // For now, log to console
      console.log('Report submitted:', reportData);
      
      // Reset form and show success
      setReportReason("");
      setReportDetails("");
      setShowReportModal(false);
      
      // Show success message
      alert('Report submitted successfully. Thank you for helping keep our community safe.');
      
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const REPORT_REASONS = [
    'Inappropriate content',
    'Harassment or bullying', 
    'Spam or misleading information',
    'Harmful or dangerous content',
    'Copyright infringement',
    'Privacy violation',
    'Technical issues',
    'Other'
  ];

  // Quest submission handler
  const handleQuestSubmit = async (answer: string) => {
    if (!currentUser || !characterId || !activeQuest) return;

    try {
      const response = await axios.post('/api/v1/quests/submit', {
        userId: currentUser.uid,
        characterId,
        answer
      });

      if (response.data.success) {
        const result = response.data.result;
        
        // Play success/fail sound
        if (result.success) {
          playQuestCompleteSound();
        }

        // Show result message
        const resultMessage: Message = {
          id: `quest-result-${Date.now()}`,
          text: result.feedback,
          sender: "ai" as const,
          timestamp: Date.now(),
          message_type: "ai_speech" as const
        };
        setMessages(prev => [...prev, resultMessage]);

        // Handle affection gain
        if (result.affectionUpdate && result.affectionUpdate.leveledUp) {
          setLevelUpData({
            oldLevel: result.affectionUpdate.oldLevel,
            newLevel: result.affectionUpdate.newLevel,
            tierName: affectionStatus?.tier?.name || 'Friend'
          });
          setShowLevelUp(true);
          playLevelUpSound();
        }

        // Reload affection status
        const affectionResponse = await axios.get(`/api/v1/affection/status/${currentUser.uid}/${characterId}`);
        if (affectionResponse.data.success) {
          setAffectionStatus(affectionResponse.data.status);
        }

        // Clear active quest
        setActiveQuest(null);
        setShowQuestModal(false);
      }
    } catch (error) {
      console.error('Failed to submit quest:', error);
    }
  };


  if (loadingCharacters) {
    return <FullPageLoader />;
  }

  if (!character && characterId) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Character Not Found</h1>
          <p className="text-zinc-400 mb-6">The character you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/companion")}
            className="px-6 py-2 bg-[#A855F7] text-white rounded-lg hover:bg-[#9333EA] transition-colors"
          >
            Back to Companions
          </button>
        </div>
      </div>
    );
  }

  if (!character) return null;

  const backgroundImage = customBackground || character.image;
  const aboutPanelOpen = desktopLayout?.aboutPanelOpen ?? true;
  const setAboutPanelOpen = desktopLayout?.setAboutPanelOpen ?? (() => {});

  // Dark theme (matches app: #141414, #0A0A0A, #A855F7)
  const colorScheme = {
    background: isIncognito ? '#0A0A0A' : '#141414',
    surface: isIncognito ? '#1A1A1A' : '#1A1A1A',
    accent: isIncognito ? '#A855F7' : '#A855F7',
    text: '#FFFFFF',
    textMuted: isIncognito ? '#A1A1AA' : '#A1A1AA',
    textSubtle: isIncognito ? '#d4d4d8' : '#d4d4d8',
    overlay: isIncognito ? 'bg-[#0A0A0A]/80' : 'bg-[#0A0A0A]/80',
    headerBg: isIncognito ? 'bg-[#0A0A0A]/95' : 'bg-[#0A0A0A]/95',
    inputBg: isIncognito ? 'bg-[#1A1A1A]' : 'bg-[#1A1A1A]',
    border: isIncognito ? '#27272a' : '#27272a'
  };

  const chatContent = (
    <div 
      className="companion-theme min-h-screen relative overflow-hidden flex-1 min-w-0"
      style={{
        fontFamily: fontFamily,
        fontSize: `${fontSize}px`,
        backgroundColor: isFullScreen ? 'transparent' : colorScheme.background
      }}
    >
      {/* Full-screen background */}
      <div 
        className={`${isFullScreen ? 'fixed inset-0' : 'absolute inset-0'} bg-cover bg-center bg-no-repeat`}
        style={{
          backgroundImage: `url(${backgroundImage})`,
          opacity: backgroundOpacity
        }}
      />
      
      {/* Dark overlay */}
      <div className={`${isFullScreen ? 'fixed inset-0' : 'absolute inset-0'} ${colorScheme.overlay} z-5`} />

      {/* Top banner - on desktop with About open, start after 20% so chat doesn't overlap */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md ${aboutPanelOpen ? 'lg:left-[20%]' : ''}`}
        style={{
          backgroundColor: colorScheme.headerBg,
          borderBottomColor: colorScheme.border
        }}
      >
        <div className="flex items-center justify-between px-4 lg:px-6 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/companion")}
              className="transition-colors"
              style={{ color: colorScheme.accent }}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-3">
              <img
                src={character.image}
                alt={character.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h1 className="text-lg font-bold text-white">{character.name}</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">

            {/* Incognito Mode Toggle */}
            <button
              onClick={toggleIncognito}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: isIncognito ? `${colorScheme.accent}20` : '#27272a80',
                color: isIncognito ? colorScheme.accent : '#a1a1aa'
              }}
              title={isIncognito ? 'Incognito Mode ON - No chat history saved' : 'Enable Incognito Mode'}
            >
              {isIncognito ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg bg-black/50 hover:bg-zinc-700/50 transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-zinc-400" />
              </button>

              {/* Three-dot menu */}
              {showMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div 
                    className="fixed inset-0 z-[60]" 
                    onClick={() => setShowMenu(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setShowMenu(false);
                      }
                    }}
                    role="button"
                    tabIndex={-1}
                    aria-label="Close menu"
                  />
                  <div className="absolute top-full right-0 mt-2 w-56 sm:w-64 lg:w-72 bg-black border border-zinc-700 rounded-xl shadow-xl z-[70] animate-scale-in max-w-[90vw] mr-2 sm:mr-0">
                    <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        navigate(`/character/${characterId}`);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>About Character</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowCustomizeChat(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Customize Chat</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowCustomInstructions(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                    >
                      <UserCircle className="w-4 h-4" />
                      <span>Custom Instructions</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowReportModal(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                      <span>Report</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        handleStartNewChat();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-[#A855F7] hover:bg-[#A855F7]/10 hover:text-[#C084FC] transition-colors"
                    >
                      <RefreshCcw className="w-4 h-4" />
                      <span>Start New Chat</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        deleteChat();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Chat</span>
                    </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main chat area - when fullscreen + About open, inset left 20% so no overlap */}
      <main className={`flex flex-col ${
        isFullScreen 
          ? `fixed inset-0 pt-20 pb-24 z-10 ${aboutPanelOpen ? 'lg:left-[20%]' : ''}` 
          : 'min-h-screen pt-24 pb-28 z-10'
      }`}>
        <div className={`flex-1 overflow-y-auto overflow-x-hidden ${
          isFullScreen 
            ? 'px-4 lg:px-6 py-4 w-full'
            : 'px-4 lg:px-8 py-4 w-full'
        }`}>
          {/* Incognito Mode Indicator */}
          {isIncognito && (
            <div 
              className="rounded-lg p-3 mb-4"
              style={{
                backgroundColor: `${colorScheme.accent}10`,
                borderColor: `${colorScheme.accent}30`,
                border: '1px solid'
              }}
            >
              <div className="flex items-center space-x-2">
                <EyeOff className="w-4 h-4" style={{ color: colorScheme.accent }} />
                <span className="text-sm font-medium" style={{ color: colorScheme.accent }}>
                  Incognito Mode Active
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: colorScheme.textSubtle }}>
                This conversation is private and won't be saved to your chat history.
              </p>
            </div>
          )}

          {/* Intro Screen */}
          {showIntro && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center w-full px-8 py-8">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-[#A855F7]/50">
                  <img
                    src={character.image}
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <h1 className="text-3xl font-bold text-white mb-2">{character.name}</h1>
                <p className="text-[#A855F7] text-lg mb-4">{character.role}</p>
                
                <div className="bg-black/50 rounded-2xl p-6 mb-6 backdrop-blur-sm">
                  <h3 className="text-white font-medium mb-3">Character Introduction</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    {character.personality?.background || `Meet ${character.name}, ready to have an engaging conversation with you!`}
                  </p>
                </div>
                
                {character.tags && character.tags.length > 0 && (
                  <div className="mb-6">
                    <div className="flex flex-wrap justify-center gap-2">
                      {character.tags.slice(0, 5).map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-zinc-700/50 text-zinc-300 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Theme Button */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowThemeSelector(true)}
                    className="w-full py-3 px-6 bg-zinc-700/50 hover:bg-zinc-600/50 border border-zinc-600 rounded-lg text-white font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Palette className="w-5 h-5 text-[#A855F7]" />
                    <span>Theme</span>
                  </button>
                </div>

                <button
                  onClick={startIntro}
                  className="px-8 py-3 text-white rounded-xl font-medium transition-colors flex items-center space-x-2 mx-auto"
                  style={{
                    backgroundColor: colorScheme.accent,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isIncognito ? '#e6890a' : '#d97706';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colorScheme.accent;
                  }}
                >
                  <span>Start Conversation</span>
                </button>
              </div>
            </div>
          )}

          {/* Chat messages container */}
          {!showIntro && (
            <div className={`${
              isFullScreen 
                ? '' 
                : 'bg-black/30 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-6 shadow-xl'
            }`}>

          {/* Chat messages */}
          {(isIncognito ? incognitoMessages : messages).map((msg, index) => (
            <div key={`msg-${msg.id || index}-${msg.timestamp}`} className={`mb-3 ${msg.sender === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
              <div className={`flex items-start space-x-3 max-w-4xl ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {msg.sender === 'ai' && (
                  <img
                    src={character.image}
                    alt={character.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                )}
                
                <div className="space-y-1">
                  {/* Character Thoughts (Light Bubble with Italics) */}
                  {msg.sender === 'ai' && msg.message_type === 'ai_thought' && (
                    <div 
                      className="max-w-xs lg:max-w-sm px-4 py-2 rounded-2xl rounded-tl-sm backdrop-blur-sm border"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Light background
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'rgba(255, 255, 255, 0.8)'
                      }}
                    >
                      <p className="text-sm italic">
                        <span className="text-xs opacity-70">💭 </span>
                        {msg.thoughts || msg.text}
                      </p>
                    </div>
                  )}
                  
                  {/* Character Speech (Dark Bubble) */}
                  {msg.sender === 'ai' && msg.message_type === 'ai_speech' && (
                    <div 
                      className="max-w-xs lg:max-w-sm px-4 py-3 rounded-2xl rounded-tl-sm"
                      style={{ 
                        opacity: bubbleOpacity,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Dark background
                        color: '#ffffff'
                      }}
                    >
                      {/* Use letter-by-letter animation for last AI message */}
                      {msg.id === lastAiMessageId ? (
                        <div className="whitespace-pre-wrap">
                          {renderMessageWithAsterisks(msg.speech || msg.text)}
                        </div>
                      ) : (
                        <p>
                          {renderMessageWithAsterisks(msg.speech || msg.text)}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* User Message */}
                  {msg.sender === 'user' && (
                    <div 
                      className={`max-w-xs lg:max-w-sm px-4 py-3 rounded-2xl rounded-tr-sm ${currentBubbleTheme.gradient}`}
                      style={{ 
                        opacity: bubbleOpacity
                      }}
                    >
                      <p style={{ color: '#ffffff' }}>
                        {msg.text}
                      </p>
                      {/* Show user thoughts if they exist */}
                      {msg.user_thoughts && (
                        <div className="mt-2">
                          <div className="max-w-xs lg:max-w-sm px-3 py-2 rounded-xl rounded-tr-sm bg-white/10 backdrop-blur-sm border border-white/20">
                            <p className="text-xs italic opacity-60 text-white/80 leading-relaxed">
                              {msg.user_thoughts}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Continue Button for AI Messages */}
                  {msg.sender === 'ai' && !isLoading && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Continue button clicked, calling function...');
                        continueCharacterResponse(index);
                      }}
                      className="mt-1 px-3 py-1 rounded-full text-xs transition-colors flex items-center space-x-1 hover:scale-105"
                      style={{
                        backgroundColor: isIncognito ? '#33333380' : '#52525b80',
                        color: colorScheme.textMuted
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isIncognito ? '#4d4d4d80' : '#71717a80';
                        e.currentTarget.style.color = colorScheme.text;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isIncognito ? '#33333380' : '#52525b80';
                        e.currentTarget.style.color = colorScheme.textMuted;
                      }}
                      disabled={isLoading}
                    >
                      <MoreHorizontal className="w-3 h-3" />
                      <span>{isLoading ? 'Loading...' : 'Continue...'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <TypingIndicator
              characterName={character.name}
              characterImage={character.image}
            />
          )}

          {/* Loading indicator */}
          {isLoading && !isTyping && (
            <div className="flex items-start space-x-3">
              <img
                src={character.image}
                alt={character.name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <div className="bg-zinc-700 px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          
            <div ref={messagesEndRef} />
            {/* Extra padding at bottom for better scroll experience */}
            <div className="h-2" />
            </div>
          )}
        </div>
      </main>

      {/* Bottom input bar - on desktop with About open, start after 20% so no overlap */}
      {!showIntro && (
        <div 
          className={`fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md ${aboutPanelOpen ? 'lg:left-[20%]' : ''} ${
            isFullScreen ? '' : 'mb-4 mx-4 lg:mx-8 rounded-t-2xl'
          }`}
          style={{
            backgroundColor: colorScheme.inputBg,
            borderTopColor: colorScheme.border
          }}
        >
        <div className={`py-4 ${
          isFullScreen 
            ? 'px-4 lg:px-6 w-full' 
            : 'px-6 w-full'
        }`}>
          {/* Hints */}
          {showHints && hints.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {hints.map((hint) => (
                <button
                  key={hint}
                  onClick={() => handleHintClick(hint)}
                  className="px-3 py-2 bg-zinc-700/50 hover:bg-zinc-600/50 rounded-full text-sm text-zinc-300 transition-colors"
                >
                  {hint}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            {/* Hints button */}
            <button
              type="button"
              onClick={() => setShowHints(!showHints)}
              className="p-3 rounded-lg transition-colors flex-shrink-0"
              style={{
                backgroundColor: showHints 
                  ? `${colorScheme.accent}20` 
                  : isIncognito ? '#33333380' : '#52525b80',
                color: showHints ? colorScheme.accent : colorScheme.textMuted
              }}
            >
              <Lightbulb className="w-5 h-5" />
            </button>

            {/* Text input */}
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  // Auto-resize textarea up to 4 lines
                  const textarea = e.target;
                  textarea.style.height = 'auto';
                  const newHeight = Math.min(textarea.scrollHeight, 4 * 24 + 24); // 4 lines max (24px per line + padding)
                  textarea.style.height = `${newHeight}px`;
                }}
                placeholder={`Message ${character.name}...`}
                className="w-full px-4 py-3 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:border-transparent"
                style={{
                  minHeight: '48px', 
                  maxHeight: '120px', // 4 lines max
                  backgroundColor: isIncognito ? '#1a1a1a80' : '#27272a80',
                  borderColor: colorScheme.border,
                  color: colorScheme.text,
                  border: '1px solid'
                }}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colorScheme.accent;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${colorScheme.accent}40`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colorScheme.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="p-3 rounded-full transition-colors flex-shrink-0"
              style={{
                backgroundColor: message.trim() && !isLoading 
                  ? colorScheme.accent 
                  : isIncognito ? '#33333380' : '#52525b80',
                color: message.trim() && !isLoading 
                  ? '#FFFFFF' 
                  : colorScheme.textMuted,
                cursor: message.trim() && !isLoading ? 'pointer' : 'not-allowed'
              }}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
        </div>
      )}


      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-black rounded-2xl w-full max-w-sm mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Share Character</h2>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-zinc-400 hover:text-zinc-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Copy Link */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Share Link</label>
                  <button
                    onClick={() => handleShare('copy')}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg bg-zinc-700/50 hover:bg-zinc-600/50 transition-colors"
                  >
                    <Copy className="w-5 h-5 text-zinc-400" />
                    <span className="text-white">Copy Link</span>
                  </button>
                </div>

                {/* Character ID */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Character ID</label>
                  <div className="flex items-center space-x-2 p-3 bg-zinc-700/50 rounded-lg">
                    <code className="flex-1 text-sm text-zinc-300 font-mono">{characterId}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(characterId || '');
                        setShowShareModal(false);
                      }}
                      className="p-2 text-zinc-400 hover:text-zinc-300 rounded transition-colors"
                      title="Copy Character ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customize Mood Modal */}
      {showCustomizeMood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-black rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Customize Mood</h2>
                <button
                  onClick={() => setShowCustomizeMood(false)}
                  className="text-zinc-400 hover:text-zinc-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-zinc-400 text-sm">
                  Choose how {character.name} should respond to you based on your current mood or preference.
                </p>
                
                <div className="space-y-3">
                  {MOOD_PRESETS.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                        selectedMood === mood.id
                          ? 'border-[#A855F7] bg-[#A855F7]/20'
                          : 'border-zinc-600 bg-zinc-700/50 hover:bg-zinc-600/50'
                      }`}
                    >
                      <div className="text-2xl">{mood.emoji}</div>
                      <div className="flex-1 text-left">
                        <h3 className="text-white font-medium">{mood.name}</h3>
                        <p className="text-sm text-zinc-400">{mood.description}</p>
                      </div>
                      {selectedMood === mood.id && (
                        <div className="w-2 h-2 bg-[#A855F7] rounded-full" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-zinc-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="text-lg">{currentMood.emoji}</div>
                    <span className="text-white font-medium">Active: {currentMood.name}</span>
                  </div>
                  <p className="text-sm text-zinc-400">{currentMood.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customize Chat Modal */}
      {showCustomizeChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-black rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Customize Chat</h2>
                <button
                  onClick={() => setShowCustomizeChat(false)}
                  className="text-zinc-400 hover:text-zinc-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Full Screen Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Full Screen Mode</h3>
                    <p className="text-sm text-zinc-400">Expand chat to full screen</p>
                  </div>
                  <button
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isFullScreen ? 'bg-[#A855F7]' : 'bg-zinc-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isFullScreen ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Background Opacity */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">Background Opacity</h3>
                    <span className="text-sm text-zinc-400">{Math.round(backgroundOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={backgroundOpacity}
                    onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Chat Bubble Opacity */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">Chat Bubble Opacity</h3>
                    <span className="text-sm text-zinc-400">{Math.round(bubbleOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="1"
                    step="0.05"
                    value={bubbleOpacity}
                    onChange={(e) => setBubbleOpacity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Background Theme */}
                <div>
                  <h3 className="text-white font-medium mb-3">Background Theme</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button
                      onClick={() => setCustomBackground(null)}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        !customBackground 
                          ? 'border-[#A855F7] bg-[#A855F7]/20 text-[#A855F7]' 
                          : 'border-zinc-600 bg-zinc-700/50 text-zinc-300 hover:bg-zinc-600/50'
                      }`}
                    >
                      Character Default
                    </button>
                    <button
                      onClick={() => backgroundInputRef.current?.click()}
                      disabled={uploadingBackground}
                      className="px-4 py-2 rounded-lg border-2 border-zinc-600 bg-zinc-700/50 text-zinc-300 hover:bg-zinc-600/50 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{uploadingBackground ? 'Uploading...' : 'Upload Custom'}</span>
                    </button>
                  </div>
                  
                  {/* Saved Themes */}
                  {savedThemes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-zinc-400 mb-2">Saved Themes ({savedThemes.length}/20)</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {savedThemes.slice(0, 6).map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => setCustomBackground(theme.backgroundUrl)}
                            className={`aspect-video rounded-lg border-2 overflow-hidden transition-colors ${
                              customBackground === theme.backgroundUrl
                                ? 'border-[#A855F7]'
                                : 'border-zinc-600 hover:border-zinc-500'
                            }`}
                          >
                            <img
                              src={theme.backgroundUrl}
                              alt={theme.name}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <input
                    ref={backgroundInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    className="hidden"
                  />
                </div>

                {/* Chat Bubble Theme */}
                <div>
                  <h3 className="text-white font-medium mb-3">Chat Bubble Style</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {CHAT_BUBBLE_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedBubbleTheme(theme.id)}
                        className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors ${
                          selectedBubbleTheme === theme.id
                            ? 'border-[#A855F7] bg-[#A855F7]/20'
                            : 'border-zinc-600 bg-zinc-700/50 hover:bg-zinc-600/50'
                        }`}
                      >
                        <div className={`p-2 rounded ${theme.gradient} ${theme.animation}`}>
                          {theme.icon}
                        </div>
                        <span className="text-white font-medium">{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-white font-medium mb-2">Font Family</h3>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#A855F7]"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium">Font Size</h3>
                      <span className="text-sm text-zinc-400">{fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="20"
                      step="1"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>

                {/* Preview Area */}
                <div>
                  <h3 className="text-white font-medium mb-3">Preview</h3>
                  <div className="bg-black/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start space-x-3">
                      <img
                        src={character.image}
                        alt={character.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div 
                        className={`px-4 py-3 rounded-2xl rounded-tl-sm ${currentBubbleTheme.gradient}`}
                        style={{ opacity: bubbleOpacity, fontFamily: fontFamily, fontSize: `${fontSize}px` }}
                      >
                        <p className="text-white">This is how your chat bubbles will look!</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 flex-row-reverse space-x-reverse">
                      <div 
                        className={`px-4 py-3 rounded-2xl rounded-tr-sm ${currentBubbleTheme.gradient}`}
                        style={{ opacity: bubbleOpacity, fontFamily: fontFamily, fontSize: `${fontSize}px` }}
                      >
                        <p className="text-white">And this is your message style!</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-zinc-700">
                  <button
                    onClick={saveCustomizations}
                    className="flex-1 flex items-center justify-center space-x-2 py-3 bg-black hover:bg-zinc-900 text-white rounded-lg transition-colors border border-zinc-700"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={revertCustomizations}
                    className="flex-1 flex items-center justify-center space-x-2 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset to Default</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Instructions Modal */}
      {showCustomInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-black rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Custom Instructions</h2>
                <button
                  onClick={() => setShowCustomInstructions(false)}
                  className="text-zinc-400 hover:text-zinc-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Nickname */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    What should {character.name} call you?
                  </label>
                  <input
                    type="text"
                    value={customInstructions.nickname}
                    onChange={(e) => setCustomInstructions(prev => ({ ...prev, nickname: e.target.value }))}
                    placeholder="Enter your preferred nickname..."
                    className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#A855F7]"
                  />
                  <p className="text-sm text-zinc-400 mt-1">
                    Leave empty to use your default name
                  </p>
                </div>

                {/* About User */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    Tell {character.name} about yourself
                  </label>
                  <textarea
                    value={customInstructions.aboutUser}
                    onChange={(e) => setCustomInstructions(prev => ({ ...prev, aboutUser: e.target.value }))}
                    placeholder="Share details about your interests, background, preferences..."
                    className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#A855F7]"
                    rows={4}
                  />
                  <p className="text-sm text-zinc-400 mt-1">
                    This helps {character.name} provide more personalized responses
                  </p>
                </div>

                {/* Persistent Memory */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-white font-medium">Persistent Memory</h3>
                      <p className="text-sm text-zinc-400">Remember details across conversations</p>
                    </div>
                    <button
                      onClick={() => setCustomInstructions(prev => ({ ...prev, persistentMemory: !prev.persistentMemory }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        customInstructions.persistentMemory ? 'bg-[#A855F7]' : 'bg-zinc-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        customInstructions.persistentMemory ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  {customInstructions.persistentMemory && (
                    <div className="space-y-3">
                      <textarea
                        value={customInstructions.memoryDetails}
                        onChange={(e) => setCustomInstructions(prev => ({ ...prev, memoryDetails: e.target.value }))}
                        placeholder="What should the character remember about you and your conversations?"
                        className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#A855F7]"
                        rows={3}
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-zinc-400">
                          Memory is encrypted and stored locally
                        </p>
                        <button
                          onClick={clearMemory}
                          className="px-3 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
                        >
                          Clear Memory
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Avoid Topics */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    Topics to Avoid
                  </label>
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newAvoidTopic}
                        onChange={(e) => setNewAvoidTopic(e.target.value)}
                        placeholder="Add a topic to avoid..."
                        className="flex-1 px-4 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#A855F7]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addAvoidTopic();
                          }
                        }}
                      />
                      <button
                        onClick={addAvoidTopic}
                        disabled={!newAvoidTopic.trim()}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          newAvoidTopic.trim()
                            ? 'bg-[#A855F7] hover:bg-[#A855F7] text-white'
                            : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                        }`}
                      >
                        Add
                      </button>
                    </div>
                    
                    {customInstructions.avoidTopics.length > 0 && (
                      <div>
                        <p className="text-sm text-zinc-400 mb-2">
                          {character.name} will avoid discussing these topics:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {customInstructions.avoidTopics.map((topic) => (
                            <span
                              key={topic}
                              className="flex items-center space-x-2 px-3 py-1 bg-zinc-700/50 text-zinc-300 rounded-full text-sm"
                            >
                              <span>{topic}</span>
                              <button
                                onClick={() => removeAvoidTopic(topic)}
                                className="text-zinc-400 hover:text-red-400 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">
                    {character.name} will politely redirect if these topics come up
                  </p>
                </div>

                {/* Memory Tiers Info */}
                <div className="bg-zinc-700/30 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Memory System</h4>
                  <div className="space-y-2 text-sm text-zinc-300">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#A855F7] rounded-full"></div>
                      <span><strong>Session Memory:</strong> Remembers during current chat</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#A855F7] rounded-full"></div>
                      <span><strong>Short-term:</strong> Remembers for a few days</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#A855F7] rounded-full"></div>
                      <span><strong>Persistent:</strong> Long-term memory (user controlled)</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-zinc-700">
                  <button
                    onClick={saveCustomInstructions}
                    className="flex-1 flex items-center justify-center space-x-2 py-3 bg-[#A855F7] hover:bg-[#A855F7] text-white rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Instructions</span>
                  </button>
                  <button
                    onClick={() => setShowCustomInstructions(false)}
                    className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-black rounded-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Report Character</h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-zinc-400 hover:text-zinc-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-zinc-300 text-sm">
                  Help us maintain a safe and respectful community by reporting inappropriate content.
                </p>

                {/* Report Reason */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    Reason for reporting
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#A855F7]"
                  >
                    <option value="">Select a reason...</option>
                    {REPORT_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Additional Details */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    Additional details (optional)
                  </label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Please provide any additional context that might help us understand the issue..."
                    className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#A855F7]"
                    rows={4}
                  />
                </div>

                {/* Report Info */}
                <div className="bg-[#A855F7]/10 border border-[#A855F7]/20 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Flag className="w-4 h-4 text-[#A855F7] mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-zinc-300">
                      <p className="font-medium mb-1">Report Information:</p>
                      <ul className="space-y-1 text-zinc-400">
                        <li>• Reports are reviewed by our moderation team</li>
                        <li>• False reports may result in account restrictions</li>
                        <li>• You'll receive updates on serious violations</li>
                        <li>• All reports are kept confidential</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReport}
                    disabled={!reportReason.trim() || reportSubmitting}
                    className={`flex-1 py-3 rounded-lg transition-colors ${
                      reportReason.trim() && !reportSubmitting
                        ? 'bg-red-500 hover:bg-red-400 text-white'
                        : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                    }`}
                  >
                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theme Selector Modal */}
      {showThemeSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-black rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Choose Theme</h2>
                <button
                  onClick={() => setShowThemeSelector(false)}
                  className="text-zinc-400 hover:text-zinc-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Chat Bubble Theme */}
                <div>
                  <h3 className="text-white font-medium mb-3">Chat Bubble Style</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {CHAT_BUBBLE_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => {
                          setSelectedBubbleTheme(theme.id);
                          setShowThemeSelector(false);
                        }}
                        className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors ${
                          selectedBubbleTheme === theme.id
                            ? 'border-[#A855F7] bg-[#A855F7]/20'
                            : 'border-zinc-600 bg-zinc-700/50 hover:bg-zinc-600/50'
                        }`}
                      >
                        <div className={`p-2 rounded ${theme.gradient} ${theme.animation}`}>
                          {theme.icon}
                        </div>
                        <span className="text-white font-medium">{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Theme */}
                <div>
                  <h3 className="text-white font-medium mb-3">Background Theme</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button
                      onClick={() => setCustomBackground(null)}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        !customBackground
                          ? 'border-[#A855F7] bg-[#A855F7]/20'
                          : 'border-zinc-600 bg-zinc-700/50 hover:bg-zinc-600/50'
                      }`}
                    >
                      <span className="text-white font-medium">Default</span>
                    </button>
                    <button
                      onClick={() => setShowCustomizeChat(true)}
                      className="px-4 py-2 rounded-lg border-2 border-zinc-600 bg-zinc-700/50 hover:bg-zinc-600/50 transition-colors"
                    >
                      <span className="text-white font-medium">Custom</span>
                    </button>
                  </div>

                  {/* Saved Themes */}
                  {savedThemes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-zinc-400 mb-2">Saved Themes ({savedThemes.length}/20)</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {savedThemes.slice(0, 6).map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => {
                              setCustomBackground(theme.backgroundUrl);
                              setShowThemeSelector(false);
                            }}
                            className={`aspect-video rounded-lg border-2 overflow-hidden transition-colors ${
                              customBackground === theme.backgroundUrl
                                ? 'border-[#A855F7]'
                                : 'border-zinc-600 hover:border-zinc-500'
                            }`}
                          >
                            <img
                              src={theme.backgroundUrl}
                              alt={theme.name}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-6 mt-6 border-t border-zinc-700">
                <button
                  onClick={() => setShowThemeSelector(false)}
                  className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comment System */}
      <CommentSystem
        characterId={characterId || ''}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />

      {/* Quest Challenge Modal */}
      {showQuestModal && activeQuest && (
        <QuestChallenge
          quest={activeQuest}
          onSubmit={handleQuestSubmit}
          onClose={() => setShowQuestModal(false)}
          isSubmitting={false}
        />
      )}

      {/* Level-Up Animation */}
      {showLevelUp && levelUpData && (
        <LevelUpAnimation
          show={showLevelUp}
          oldLevel={levelUpData.oldLevel}
          newLevel={levelUpData.newLevel}
          tierName={levelUpData.tierName}
          onComplete={() => setShowLevelUp(false)}
        />
      )}
      
    </div>
  );

  const aboutWidthClass = 'lg:w-[20%]';

  return (
    <div className="lg:flex min-h-screen w-full overflow-hidden">
      {aboutPanelOpen && (
        <aside className={`hidden lg:flex ${aboutWidthClass} flex-col h-screen bg-[#0A0A0A] border-r border-white/10 shrink-0 z-20 overflow-y-auto transition-all duration-300`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">About</h2>
              <button
                type="button"
                onClick={() => {
                  // #region agent log
                  fetch('http://127.0.0.1:7243/ingest/2d5b2a38-5e31-419c-8a60-677ae4bc8660',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CharacterChat.tsx:aboutClose',message:'About panel close clicked',data:{aboutPanelOpenBefore:true},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
                  // #endregion
                  setAboutPanelOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-colors"
                title="Close about panel"
              >
                <PanelLeftClose className="w-5 h-5" />
                <span className="text-sm font-medium">Close</span>
              </button>
            </div>
            <img
              src={character.image}
              alt={character.name}
              className="w-full aspect-[3/4] object-cover rounded-xl mb-4 border border-white/10"
            />
            <h3 className="text-xl font-bold text-white mb-1">{character.name}</h3>
            {character.role && <p className="text-[#A855F7] text-sm font-medium mb-3">{character.role}</p>}
            <p className="text-[#A1A1AA] text-sm leading-relaxed mb-4">
              {character.personality?.background || `Meet ${character.name}, ready to have an engaging conversation with you!`}
            </p>
            {character.tags && character.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {character.tags.slice(0, 6).map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded-lg bg-[#A855F7]/20 text-[#A855F7] text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {chatContent}
      </div>
      {!aboutPanelOpen && (
        <button
          type="button"
          onClick={() => setAboutPanelOpen(true)}
          className="hidden lg:flex fixed left-4 top-24 z-[60] items-center gap-2 px-3 py-2 rounded-lg bg-[#0A0A0A] border border-white/10 text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-colors"
          title="Open about panel"
        >
          <PanelLeftOpen className="w-5 h-5" />
          <span className="text-sm font-medium">About</span>
        </button>
      )}
    </div>
  );
}

export default CharacterChat;
