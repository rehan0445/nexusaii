import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ArrowLeft, Bot, Sparkles, Check, ChevronRight, ChevronLeft, User, Palette, Brain, MessageCircle, Film, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCharacterContext } from "../contexts/CharacterContext";
import { Character } from "../utils/characters";
import axios from "axios";
import { getAuth } from "../utils/auth";
import MobileStepIndicator from "../components/form/MobileStepIndicator";
import StickyNavigator from "../components/form/StickyNavigator";
import TextareaAutosize from "../components/form/TextareaAutosize";
import ErrorBoundary from "../components/ErrorBoundary";
import { trackStepProgress } from "../services/progress";

interface FormState {
  name: string;
  title: string;
  greeting: string;
  visibility: string;
  personalityTraits: string[];
  interests: string[];
  background: string;
  speakingStyle: string;
  scenario: string;
  scenarioType: string;
  dos: string[];
  donts: string[];
  // Emotional State fields
  defaultMood: string;
  moodTriggers: Array<{
    trigger: string;
    response: string;
    intensity: string;
  }>;
  escalationCurve: {
    calmThreshold: string;
    escalationSpeed: string;
    maxIntensity: string;
    recoveryTime: string;
  };
}

const STORAGE_KEY = "aiSettingsForm";

function AISettings() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isStepUiLoading, setIsStepUiLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsStepUiLoading(false), 250);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Track progress whenever current step changes
    trackStepProgress(currentStep, totalSteps);
  }, [currentStep]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstInvalidRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const stepContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Form data
  const [name, setName] = useState("Companion");
  const [title, setTitle] = useState("AI Companion");
  const [greeting, setGreeting] = useState("Hello! How can I help you today?");
  const [visibility, setVisibility] = useState("public");
  const [saved, setSaved] = useState(false);

  // New fields for personality and scenario
  const [personalityTraits, setPersonalityTraits] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [background, setBackground] = useState("");
  const [speakingStyle, setSpeakingStyle] = useState("");
  const [scenario, setScenario] = useState("");
  const [scenarioType, setScenarioType] = useState("casual");

  // New fields for guidelines (Step 6)
  const [dos, setDos] = useState<string[]>([]);
  const [donts, setDonts] = useState<string[]>([]);

  // Emotional State fields
  const [defaultMood, setDefaultMood] = useState("calm and helpful");
  const [moodTriggers, setMoodTriggers] = useState<Array<{
    trigger: string;
    response: string;
    intensity: string;
  }>>([]);
  const [escalationCurve, setEscalationCurve] = useState({
    calmThreshold: "medium",
    escalationSpeed: "gradual",
    maxIntensity: "high",
    recoveryTime: "slow"
  });

  // Avatar handling
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("default");

  // Particle state
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
    }>
  >([]);

  const { refreshCharacters } = useCharacterContext();

  // Available personality traits
  const availableTraits = [
    "Empathetic", "Humorous", "Intellectual", "Creative", "Supportive",
    "Playful", "Wise", "Energetic", "Calm", "Curious", "Optimistic",
    "Analytical", "Adventurous", "Patient", "Witty", "Romantic"
  ];

  // Available interests
  const availableInterests = [
    "Technology", "Art", "Music", "Literature", "Science", "Philosophy",
    "Gaming", "Movies", "Travel", "Cooking", "Fitness", "Nature",
    "History", "Fashion", "Sports", "Photography", "Writing", "Psychology"
  ];

  // Available do's and don'ts for guidelines
  const availableDos = [
    "Be respectful", "Listen actively", "Stay helpful", "Be encouraging", "Maintain boundaries",
    "Show empathy", "Be honest", "Respect privacy", "Stay positive", "Be patient",
    "Provide useful info", "Be supportive", "Stay professional", "Be creative", "Show interest"
  ];

  const availableDonts = [
    "Don't be offensive", "Don't share personal info", "Don't be judgmental", "Don't interrupt",
    "Don't be inappropriate", "Don't give medical advice", "Don't be pushy", "Don't be rude",
    "Don't break character", "Don't be negative", "Don't argue", "Don't be dismissive",
    "Don't overshare", "Don't be boring", "Don't ignore context"
  ];

  // Predefined mood options
  const availableMoods = [
    "calm and helpful", "cynical but witty", "enthusiastic and energetic", "mysterious and intriguing",
    "sarcastic and sharp", "warm and nurturing", "analytical and logical", "playful and mischievous",
    "stoic and composed", "passionate and intense", "gentle and patient", "bold and confident"
  ];

  // Intensity options for mood triggers
  const intensityOptions = [
    "subtle", "noticeable", "moderate", "strong", "intense", "extreme"
  ];

  // Scenario types
  const scenarioTypes = [
    { value: "casual", label: "Casual Conversation", description: "Everyday chat and friendly discussion" },
    { value: "romantic", label: "Romantic", description: "Intimate and affectionate interactions" },
    { value: "adventure", label: "Adventure", description: "Exciting scenarios and storytelling" },
    { value: "educational", label: "Educational", description: "Learning and knowledge sharing" },
    { value: "therapeutic", label: "Therapeutic", description: "Emotional support and guidance" },
    { value: "creative", label: "Creative", description: "Artistic collaboration and brainstorming" }
  ];

  // Step configuration
  const steps = [
    { number: 1, title: "Basic Info", icon: User, description: "Name and greeting" },
    { number: 2, title: "Appearance", icon: Palette, description: "Visual identity" },
    { number: 3, title: "Emotional State", icon: Brain, description: "Mood and reactions" },
    { number: 4, title: "Personality", icon: MessageCircle, description: "Character traits" },
    { number: 5, title: "Scenario", icon: Film, description: "Starting context" },
    { number: 6, title: "Guidelines", icon: CheckCircle, description: "Do's and don'ts" }
  ];

  const stepTitles = useMemo(() => steps.map(s => s.title), [steps]);
  const stepIcons = useMemo(() => ["👤", "👁️", "⚡", "🎭", "🎬", "📋"], []);

  // Particle animation
  const createParticles = useCallback(() => {
    const newParticles = [] as any[];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 5 + 1,
        speed: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }
    return newParticles;
  }, []);

  const updateParticles = useCallback((prev: any[]) => {
    return prev.map((p) => ({
      ...p,
      y: p.y - p.speed > 0 ? p.y - p.speed : 100,
      opacity: (p.y / 100) * 0.5,
    }));
  }, []);

  useEffect(() => {
    setParticles(createParticles());

    const interval = setInterval(() => {
      setParticles(updateParticles);
    }, 50);

    return () => clearInterval(interval);
  }, [createParticles, updateParticles]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedStr = localStorage.getItem(STORAGE_KEY);
      if (savedStr) {
        const data: FormState = JSON.parse(savedStr);
        setName(data.name ?? name);
        setTitle(data.title ?? title);
        setGreeting(data.greeting ?? greeting);
        setVisibility(data.visibility ?? visibility);
        setPersonalityTraits(data.personalityTraits ?? []);
        setInterests(data.interests ?? []);
        setBackground(data.background ?? "");
        setSpeakingStyle(data.speakingStyle ?? "");
        setScenario(data.scenario ?? "");
        setScenarioType(data.scenarioType ?? "casual");
        setDos(data.dos ?? []);
        setDonts(data.donts ?? []);
        // Load emotional state fields
        setDefaultMood(data.defaultMood ?? defaultMood);
        setMoodTriggers(data.moodTriggers ?? []);
        setEscalationCurve(data.escalationCurve ?? escalationCurve);
      }
    } catch (error) {
      console.warn("Failed to load saved form data:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to localStorage on changes (debounced via microtask by batching)
  const formState: FormState = {
    name,
    title,
    greeting,
    visibility,
    personalityTraits,
    interests,
    background,
    speakingStyle,
    scenario,
    scenarioType,
    dos,
    donts,
    // Emotional state fields
    defaultMood,
    moodTriggers,
    escalationCurve,
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formState));
    } catch (error) {
      console.warn("Failed to save form data to localStorage:", error);
    }
  }, [formState]);

  const validateStep = useCallback((stepNum: number) => {
    const nextErrors: Record<string, string> = {};
    if (stepNum === 1) {
      if (!name || name.trim().length < 2) nextErrors.name = "Please enter a name (min 2 characters).";
      if (!title || title.trim().length < 2) nextErrors.title = "Please enter a title (min 2 characters).";
      if (!greeting || greeting.trim().length < 5) nextErrors.greeting = "Please add a greeting (min 5 characters).";
    }
    if (stepNum === 3) {
      if (!defaultMood || defaultMood.trim().length < 3) nextErrors.defaultMood = "Please set a default mood.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [name, title, greeting, defaultMood]);

  const handleBack = useCallback(() => {
    navigate("/ai");
  }, [navigate]);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps) {
      if (!validateStep(currentStep)) {
        // focus first invalid
        queueMicrotask(() => firstInvalidRef.current?.focus());
        return;
      }
      setCurrentStep((s) => s + 1);
      stepContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep, totalSteps, validateStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      stepContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep]);

  const handleGotoStep = useCallback((n: number) => {
    if (n < 1 || n > totalSteps) return;
    setCurrentStep(n);
    stepContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [totalSteps]);

  const togglePersonalityTrait = useCallback((trait: string) => {
    setPersonalityTraits(prev => 
      prev.includes(trait) 
        ? prev.filter(t => t !== trait)
        : [...prev, trait]
    );
  }, []);

  const toggleInterest = useCallback((interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  }, []);

  const toggleDo = useCallback((behavior: string) => {
    setDos(prev =>
      prev.includes(behavior)
        ? prev.filter(d => d !== behavior)
        : [...prev, behavior]
    );
  }, []);

  const toggleDont = useCallback((behavior: string) => {
    setDonts(prev =>
      prev.includes(behavior)
        ? prev.filter(d => d !== behavior)
        : [...prev, behavior]
    );
  }, []);

  // Mood trigger management functions
  const addMoodTrigger = useCallback(() => {
    setMoodTriggers(prev => [...prev, { trigger: "", response: "", intensity: "moderate" }]);
  }, []);

  const removeMoodTrigger = useCallback((index: number) => {
    setMoodTriggers(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateMoodTrigger = useCallback((index: number, field: 'trigger' | 'response' | 'intensity', value: string) => {
    setMoodTriggers(prev => prev.map((trigger, i) => 
      i === index ? { ...trigger, [field]: value } : trigger
    ));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setErrors({ submit: "You must be signed in." });
        return;
      }

      const uid = currentUser.uid;

      const character: Omit<Character, "image"> = {
        id: Date.now(),
        name,
        role: title,
        description: `A ${defaultMood} AI companion with dynamic emotional responses.`,
        tags: [defaultMood, ...personalityTraits.slice(0, 3)],
        languages: {
          primary: "English",
          style: speakingStyle || defaultMood,
          greeting,
        },
        personality: {
          traits: personalityTraits,
          quirks: [],
          emotionalStyle: defaultMood,
          speakingStyle: speakingStyle || defaultMood,
          interests,
          background: background || `Created with ${visibility} visibility.`,
          scenario: scenario,
          scenarioType: scenarioType,
          guidelines: {
            dos: dos,
            donts: donts
          },
          // Emotional state data
          emotionalState: {
            defaultMood,
            moodTriggers,
            escalationCurve
          }
        },
      };

      const formData = new FormData();
      formData.append("user_id", uid);
      formData.append("character", JSON.stringify(character));

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      await axios.post(
        "/api/v1/character/create",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      await refreshCharacters();

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        localStorage.removeItem(STORAGE_KEY);
        navigate(`/ai?newCharacter=${encodeURIComponent(name)}`);
      }, 1200);
    } catch (error) {
      console.error("Failed to save character:", error);
      setErrors({ submit: "Failed to save. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }, [name, title, defaultMood, moodTriggers, escalationCurve, personalityTraits, speakingStyle, interests, background, visibility, scenario, scenarioType, dos, donts, avatarFile, refreshCharacters, navigate]);

  // Swipe gestures for mobile
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    touchStartRef.current = null;
    if (absDx > 60 && absDy < 40) {
      if (dx < 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    }
  }, [handleNext, handlePrevious]);

  const renderError = (field: string) => (
    errors[field] ? <p className="text-red-400 text-sm mt-2 ml-2" role="alert">{errors[field]}</p> : null
  );

  const renderBasicInfo = () => (
    <div className="space-y-8 animate-fade-slide-up">
      <h2 className="font-bold mb-8 flex items-center text-[clamp(1.25rem,3.5vw,1.875rem)]">
        <User className="w-[clamp(1.25rem,3.5vw,1.75rem)] h-[clamp(1.25rem,3.5vw,1.75rem)] text-gold mr-3" />
        <span>Basic Information</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="group">
          <label htmlFor="ai-name" className="block text-gold font-medium mb-3 text-lg group-hover:text-softgold-500 transition-colors">
            Name
          </label>
          <div className="relative">
            <input
              id="ai-name"
              ref={!name || errors.name ? (el) => { if (el) firstInvalidRef.current = el; } : undefined}
              type="text"
              inputMode="text"
              autoComplete="name"
              autoCapitalize="words"
              aria-invalid={!!errors.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-800/50 text-white rounded-xl p-4 pl-6 min-h-[44px] border border-zinc-700/50 focus:border-gold focus:ring-2 focus:ring-gold/30 focus:outline-none transition-all duration-300 placeholder-zinc-500 shadow-inner"
              placeholder="Enter AI name"
            />
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[0_0_15px_rgba(212,175,55,0.3)]"></div>
          </div>
          {renderError("name")}
        </div>

        <div className="group">
          <label htmlFor="ai-title" className="block text-gold font-medium mb-3 text-lg group-hover:text-softgold-500 transition-colors">
            Title
          </label>
          <div className="relative">
            <input
              id="ai-title"
              ref={!title || errors.title ? (el) => { if (el) firstInvalidRef.current = el; } : undefined}
              type="text"
              inputMode="text"
              autoComplete="organization-title"
              aria-invalid={!!errors.title}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-800/50 text-white rounded-xl p-4 pl-6 min-h-[44px] border border-zinc-700/50 focus:border-gold focus:ring-2 focus:ring-gold/30 focus:outline-none transition-all duration-300 placeholder-zinc-500 shadow-inner"
              placeholder="Enter AI title"
            />
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[0_0_15px_rgba(212,175,55,0.3)]"></div>
          </div>
          {renderError("title")}
        </div>
      </div>

      <div className="group">
        <label htmlFor="ai-greeting" className="block text-gold font-medium mb-3 text-lg group-hover:text-softgold-500 transition-colors">
          Greeting
        </label>
        <div className="relative">
          <TextareaAutosize
            id="ai-greeting"
            ariaLabel="Greeting"
            value={greeting}
            onValueChange={setGreeting}
            maxLength={300}
            aria-invalid={!!errors.greeting}
            placeholder="What will they say to start a conversation?"
            className="min-h-[44px]"
          />
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[0_0_15px_rgba(212,175,55,0.3)]"></div>
        </div>
        {renderError("greeting")}
        <p className="text-zinc-400 text-sm mt-2 ml-2">
          This is what your AI will say when starting a new conversation.
        </p>
      </div>
    </div>
  );

  const renderVisualIdentity = () => (
    <div className="space-y-8 animate-fade-slide-up">
      <h2 className="font-bold mb-8 flex items-center text-[clamp(1.25rem,3.5vw,1.875rem)]">
        <Palette className="w-[clamp(1.25rem,3.5vw,1.75rem)] h-[clamp(1.25rem,3.5vw,1.75rem)] text-gold mr-3" />
        <span>Visual Identity</span>
      </h2>

      <div className="flex flex-col-reverse md:flex-row items-start gap-8">
        <div className="flex-1 group w-full">
          <label htmlFor="ai-avatar" className="block text-gold font-medium mb-3 text-lg group-hover:text-softgold-500 transition-colors">
            Avatar
          </label>
          <div className="relative">
            <input
              id="ai-avatar"
              type="file"
              accept="image/*"
              aria-label="Upload avatar"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
                }
              }}
              className="w-full bg-zinc-800/50 text-white rounded-xl p-4 file:mr-5 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-zinc-900 file:bg-gold hover:file:bg-softgold-500 file:transition-all file:duration-300 file:cursor-pointer transition-all duration-300 shadow-inner"
            />
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[0_0_15px_rgba(212,175,55,0.3)]"></div>
          </div>
          <p className="text-zinc-400 text-sm mt-2 ml-2">
            Choose an image to represent your AI.
          </p>
        </div>

        {avatarPreview && (
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-gold/30">
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>

      <div className="group">
        <label htmlFor="ai-visibility" className="block text-gold font-medium mb-3 text-lg group-hover:text-softgold-500 transition-colors">
          Definition Visibility
        </label>
        <div className="relative">
          <select
            id="ai-visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full bg-zinc-800/50 text-white rounded-xl p-4 pl-6 min-h-[44px] border border-zinc-700/50 focus:border-gold focus:ring-2 focus:ring-gold/30 focus:outline-none transition-all duration-300 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNC40NSA2LjQ1TDggMTBMIDExLjU1IDYuNCIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-no-repeat bg-[right_1rem_center] bg-[length:1rem] shadow-inner"
          >
            <option value="public">Public - Everyone can see</option>
            <option value="private">Private - Only I can see</option>
            <option value="friends">Friends - Only my friends can see</option>
          </select>
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[0_0_15px_rgba(212,175,55,0.3)]"></div>
        </div>
        <p className="text-zinc-400 text-sm mt-2 ml-2">
          Controls who can view your AI's personality settings.
        </p>
      </div>
    </div>
  );

  const renderEmotionalState = () => (
    <div className="space-y-8 animate-fade-slide-up">
      <h2 className="font-bold mb-8 flex items-center text-[clamp(1.25rem,3.5vw,1.875rem)]">
        <Brain className="w-[clamp(1.25rem,3.5vw,1.75rem)] h-[clamp(1.25rem,3.5vw,1.75rem)] text-gold mr-3" />
        <span>Emotional State</span>
      </h2>

      {/* Default Mood Section */}
      <div className="space-y-6">
        <div className="group">
          <label htmlFor="default-mood" className="block text-gold font-medium mb-3 text-lg group-hover:text-softgold-500 transition-colors">
            Default Mood
          </label>
          <p className="text-zinc-400 text-sm mb-4">
            Choose your AI's baseline emotional state
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {availableMoods.map((mood) => (
              <button
                key={mood}
                onClick={() => setDefaultMood(mood)}
                className={`p-3 rounded-xl border transition-all duration-300 min-h-[44px] ${
                  defaultMood === mood
                    ? "bg-gold/20 border-gold text-gold"
                    : "bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:border-gold/50"
                } active:scale-95`}
              >
                {mood}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              id="default-mood"
              ref={!defaultMood || errors.defaultMood ? (el) => { if (el) firstInvalidRef.current = el; } : undefined}
              type="text"
              value={defaultMood}
              onChange={(e) => setDefaultMood(e.target.value)}
              className="w-full bg-zinc-800/50 text-white rounded-xl p-4 pl-6 min-h-[44px] border border-zinc-700/50 focus:border-gold focus:ring-2 focus:ring-gold/30 focus:outline-none transition-all duration-300 placeholder-zinc-500 shadow-inner"
              placeholder="Or type a custom mood (e.g., 'cynical but witty')"
            />
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[0_0_15px_rgba(212,175,55,0.3)]"></div>
          </div>
          {renderError("defaultMood")}
        </div>

        {/* Mood Triggers Section */}
        <div className="group">
          <h3 className="block text-gold font-medium mb-3 text-lg group-hover:text-softgold-500 transition-colors">
            Mood Triggers
          </h3>
          <p className="text-zinc-400 text-sm mb-4">
            Define how your AI reacts to different situations
          </p>
          
          <div className="space-y-4">
            {moodTriggers.map((trigger, index) => (
              <div key={`trigger-${index}-${trigger.trigger}-${trigger.response}`} className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <label htmlFor={`trigger-${index}`} className="block text-zinc-300 text-sm mb-2">Trigger</label>
                    <input
                      id={`trigger-${index}`}
                      type="text"
                      value={trigger.trigger}
                      onChange={(e) => updateMoodTrigger(index, 'trigger', e.target.value)}
                      placeholder="e.g., 'If insulted'"
                      className="w-full bg-zinc-700/50 text-white rounded-lg p-3 border border-zinc-600/50 focus:border-gold focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor={`response-${index}`} className="block text-zinc-300 text-sm mb-2">Response</label>
                    <input
                      id={`response-${index}`}
                      type="text"
                      value={trigger.response}
                      onChange={(e) => updateMoodTrigger(index, 'response', e.target.value)}
                      placeholder="e.g., 'becomes harsher'"
                      className="w-full bg-zinc-700/50 text-white rounded-lg p-3 border border-zinc-600/50 focus:border-gold focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor={`intensity-${index}`} className="block text-zinc-300 text-sm mb-2">Intensity</label>
                    <select
                      id={`intensity-${index}`}
                      value={trigger.intensity}
                      onChange={(e) => updateMoodTrigger(index, 'intensity', e.target.value)}
                      className="w-full bg-zinc-700/50 text-white rounded-lg p-3 border border-zinc-600/50 focus:border-gold focus:outline-none transition-all"
                    >
                      {intensityOptions.map(intensity => (
                        <option key={intensity} value={intensity}>{intensity}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => removeMoodTrigger(index)}
                  className="text-red-400 hover:text-red-300 text-sm transition-colors"
                >
                  Remove trigger
                </button>
              </div>
            ))}
            
            <button
              onClick={addMoodTrigger}
              className="w-full p-4 border-2 border-dashed border-zinc-600 rounded-xl text-zinc-400 hover:text-gold hover:border-gold transition-all duration-300"
            >
              + Add Mood Trigger
            </button>
          </div>
        </div>

        {/* Escalation Curve Section */}
        <div className="group">
          <h3 className="block text-gold font-medium mb-3 text-lg group-hover:text-softgold-500 transition-colors">
            Escalation Curve
          </h3>
          <p className="text-zinc-400 text-sm mb-4">
            How does your AI's emotional intensity change over time?
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="calm-threshold" className="block text-zinc-300 text-sm mb-2">Calm Threshold</label>
              <select
                id="calm-threshold"
                value={escalationCurve.calmThreshold}
                onChange={(e) => setEscalationCurve(prev => ({ ...prev, calmThreshold: e.target.value }))}
                className="w-full bg-zinc-800/50 text-white rounded-lg p-3 border border-zinc-700/50 focus:border-gold focus:outline-none transition-all"
              >
                <option value="low">Low - Gets upset easily</option>
                <option value="medium">Medium - Balanced reactions</option>
                <option value="high">High - Stays calm longer</option>
                <option value="very-high">Very High - Rarely gets upset</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="escalation-speed" className="block text-zinc-300 text-sm mb-2">Escalation Speed</label>
              <select
                id="escalation-speed"
                value={escalationCurve.escalationSpeed}
                onChange={(e) => setEscalationCurve(prev => ({ ...prev, escalationSpeed: e.target.value }))}
                className="w-full bg-zinc-800/50 text-white rounded-lg p-3 border border-zinc-700/50 focus:border-gold focus:outline-none transition-all"
              >
                <option value="instant">Instant - Immediate reaction</option>
                <option value="fast">Fast - Quick escalation</option>
                <option value="gradual">Gradual - Builds up over time</option>
                <option value="slow">Slow - Takes time to escalate</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="max-intensity" className="block text-zinc-300 text-sm mb-2">Max Intensity</label>
              <select
                id="max-intensity"
                value={escalationCurve.maxIntensity}
                onChange={(e) => setEscalationCurve(prev => ({ ...prev, maxIntensity: e.target.value }))}
                className="w-full bg-zinc-800/50 text-white rounded-lg p-3 border border-zinc-700/50 focus:border-gold focus:outline-none transition-all"
              >
                <option value="mild">Mild - Subtle changes</option>
                <option value="moderate">Moderate - Noticeable changes</option>
                <option value="high">High - Strong reactions</option>
                <option value="extreme">Extreme - Dramatic changes</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="recovery-time" className="block text-zinc-300 text-sm mb-2">Recovery Time</label>
              <select
                id="recovery-time"
                value={escalationCurve.recoveryTime}
                onChange={(e) => setEscalationCurve(prev => ({ ...prev, recoveryTime: e.target.value }))}
                className="w-full bg-zinc-800/50 text-white rounded-lg p-3 border border-zinc-700/50 focus:border-gold focus:outline-none transition-all"
              >
                <option value="instant">Instant - Quick recovery</option>
                <option value="fast">Fast - Recovers quickly</option>
                <option value="moderate">Moderate - Takes some time</option>
                <option value="slow">Slow - Lingers for a while</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gold/10 rounded-xl border border-gold/20">
          <h3 className="font-medium text-gold mb-2 flex items-center">
            <Sparkles className="w-5 h-5 mr-2" /> Emotional State Summary
          </h3>
          <div className="space-y-2 text-sm">
            <p className="text-zinc-300">
              <strong>Default Mood:</strong> {defaultMood}
            </p>
            <p className="text-zinc-300">
              <strong>Mood Triggers:</strong> {moodTriggers.length} configured
            </p>
            <p className="text-zinc-300">
              <strong>Escalation:</strong> {escalationCurve.escalationSpeed} escalation with {escalationCurve.maxIntensity} intensity
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPersonality = () => (
    <div className="space-y-8 animate-fade-slide-up">
      <h2 className="font-bold mb-8 flex items-center text-[clamp(1.25rem,3.5vw,1.875rem)]">
        <MessageCircle className="w-[clamp(1.25rem,3.5vw,1.75rem)] h-[clamp(1.25rem,3.5vw,1.75rem)] text-gold mr-3" />
        <span>Chatbot Personality</span>
      </h2>

      <div className="space-y-6">
        <div className="group">
          <label htmlFor="personality-traits" className="block text-gold font-medium mb-3 text-lg group-hover:text-softgold-500 transition-colors">
            Personality Traits
          </label>
          <p className="text-zinc-400 text-sm mb-4">
            Select traits that define your AI's personality (up to 6 traits)
          </p>
          <div id="personality-traits" className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableTraits.map((trait) => (
              <button
                key={trait}
                onClick={() => togglePersonalityTrait(trait)}
                disabled={!personalityTraits.includes(trait) && personalityTraits.length >= 6}
                className={`p-3 rounded-xl border transition-all duration-300 min-h-[44px] ${
                  personalityTraits.includes(trait)
                    ? "bg-gold/20 border-gold text-gold"
                    : "bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:border-gold/50"
                } ${
                  !personalityTraits.includes(trait) && personalityTraits.length >= 6
                    ? "opacity-50 cursor-not-allowed"
                    : "active:scale-95"
                }`}
              >
                {trait}
              </button>
            ))}
          </div>
        </div>

        <div className="group">
          <label htmlFor="interests" className="block text-gold font-medium mb-3 text-lg group-hover:text-softgold-500 transition-colors">
            Interests
          </label>
          <p className="text-zinc-400 text-sm mb-4">
            What topics does your AI enjoy discussing? (up to 8 interests)
          </p>
          <div id="interests" className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableInterests.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                disabled={!interests.includes(interest) && interests.length >= 8}
                className={`p-3 rounded-xl border transition-all duration-300 min-h-[44px] ${
                  interests.includes(interest)
                    ? "bg-gold/20 border-gold text-gold"
                    : "bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:border-gold/50"
                } ${
                  !interests.includes(interest) && interests.length >= 8
                    ? "opacity-50 cursor-not-allowed"
                    : "active:scale-95"
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group">
            <label htmlFor="ai-speaking-style" className="block text-gold font-medium mb-3 text-lg group-hover:text-softgold-500 transition-colors">
              Speaking Style
            </label>
            <div className="relative">
              <input
                id="ai-speaking-style"
                type="text"
                inputMode="text"
                value={speakingStyle}
                onChange={(e) => setSpeakingStyle(e.target.value)}
                className="w-full bg-zinc-800/50 text-white rounded-xl p-4 pl-6 min-h-[44px] border border-zinc-700/50 focus:border-gold focus:ring-2 focus:ring-gold/30 focus:outline-none transition-all duration-300 placeholder-zinc-500 shadow-inner"
                placeholder="e.g., Uses emojis, Speaks in metaphors"
              />
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[0_0_15px_rgba(212,175,55,0.3)]"></div>
            </div>
            <p className="text-zinc-400 text-sm mt-2 ml-2">
              How does your AI express itself?
            </p>
          </div>

          <div className="group">
            <label htmlFor="ai-background" className="block text-gold font-medium mb-3 text-lg group-hover:text-softgold-500 transition-colors">
              Background
            </label>
            <div className="relative">
              <TextareaAutosize
                id="ai-background"
                ariaLabel="Background"
                value={background}
                onValueChange={setBackground}
                maxLength={600}
                placeholder="Brief backstory or origin"
                className="min-h-[44px]"
              />
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[0_0_15px_rgba(212,175,55,0.3)]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScenario = () => (
    <div className="space-y-8 animate-fade-slide-up">
      <h2 className="font-bold mb-8 flex items-center text-[clamp(1.25rem,3.5vw,1.875rem)]">
        <Film className="w-[clamp(1.25rem,3.5vw,1.75rem)] h-[clamp(1.25rem,3.5vw,1.75rem)] text-gold mr-3" />
        <span>Starting Scenario</span>
      </h2>

      <div className="space-y-6">
        <div className="group">
          <label htmlFor="scenario-type" className="block text-gold font-medium mb-3 text-lg group-hover:text-softgold-500 transition-colors">
            Scenario Type
          </label>
          <p className="text-zinc-400 text-sm mb-4">
            Choose the context for initial conversations
          </p>
          <div id="scenario-type" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarioTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setScenarioType(type.value)}
                className={`p-4 rounded-xl border transition-all duration-300 text-left min-h-[44px] ${
                  scenarioType === type.value
                    ? "bg-gold/20 border-gold"
                    : "bg-zinc-800/50 border-zinc-700/50 hover:border-gold/50"
                } active:scale-95`}
              >
                <h3 className={`font-medium ${scenarioType === type.value ? "text-gold" : "text-white"}`}>
                  {type.label}
                </h3>
                <p className="text-zinc-400 text-sm mt-1">
                  {type.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="group">
          <label htmlFor="ai-custom-scenario" className="block text-gold font-medium mb-3 text-lg group-hover:text-softgold-500 transition-colors">
            Custom Scenario
          </label>
          <div className="relative">
            <TextareaAutosize
              id="ai-custom-scenario"
              ariaLabel="Custom scenario"
              value={scenario}
              onValueChange={setScenario}
              maxLength={1000}
              placeholder="Describe a specific situation or context for starting conversations..."
              className="min-h-[44px]"
            />
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[0_0_15px_rgba(212,175,55,0.3)]"></div>
          </div>
          <p className="text-zinc-400 text-sm mt-2 ml-2">
            Optional: Set a specific context for how conversations should begin.
          </p>
        </div>
      </div>
    </div>
  );

  const renderGuidelines = () => (
    <div className="space-y-8 animate-fade-slide-up">
      <h2 className="font-bold mb-8 flex items-center text-[clamp(1.25rem,3.5vw,1.875rem)]">
        <CheckCircle className="w-[clamp(1.25rem,3.5vw,1.75rem)] h-[clamp(1.25rem,3.5vw,1.75rem)] text-gold mr-3" />
        <span>Guidelines & Behavior</span>
      </h2>

      <div className="space-y-8">
        <div className="group">
          <label htmlFor="dos-behaviors" className="block text-gold font-medium mb-3 text-lg group-hover:text-softgold-500 transition-colors">
            ✅ Do's - Positive Behaviors
          </label>
          <p className="text-zinc-400 text-sm mb-4">
            Select behaviors your AI companion should always exhibit (up to 8 behaviors)
          </p>
          <div id="dos-behaviors" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableDos.map((behavior) => (
              <button
                key={behavior}
                onClick={() => toggleDo(behavior)}
                disabled={!dos.includes(behavior) && dos.length >= 8}
                className={`p-3 rounded-xl border transition-all duration-300 text-left min-h-[44px] ${
                  dos.includes(behavior)
                    ? "bg-green-500/20 border-green-500 text-green-400"
                    : "bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:border-green-500/50"
                } ${
                  !dos.includes(behavior) && dos.length >= 8
                    ? "opacity-50 cursor-not-allowed"
                    : "active:scale-95"
                }`}
              >
                <span className="text-green-400 mr-2">✓</span>
                {behavior}
              </button>
            ))}
          </div>
          {dos.length > 0 && (
            <div className="mt-4 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <p className="text-green-400 text-sm">
                <strong>Selected Do's:</strong> {dos.join(", ")}
              </p>
            </div>
          )}
        </div>

        <div className="group">
          <label htmlFor="donts-behaviors" className="block text-red-400 font-medium mb-3 text-lg group-hover:text-red-300 transition-colors">
            ❌ Don'ts - Behaviors to Avoid
          </label>
          <p className="text-zinc-400 text-sm mb-4">
            Select behaviors your AI companion should never exhibit (up to 8 behaviors)
          </p>
          <div id="donts-behaviors" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableDonts.map((behavior) => (
              <button
                key={behavior}
                onClick={() => toggleDont(behavior)}
                disabled={!donts.includes(behavior) && donts.length >= 8}
                className={`p-3 rounded-xl border transition-all duration-300 text-left min-h-[44px] ${
                  donts.includes(behavior)
                    ? "bg-red-500/20 border-red-500 text-red-400"
                    : "bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:border-red-500/50"
                } ${
                  !donts.includes(behavior) && donts.length >= 8
                    ? "opacity-50 cursor-not-allowed"
                    : "active:scale-95"
                }`}
              >
                <span className="text-red-400 mr-2">✗</span>
                {behavior}
              </button>
            ))}
          </div>
          {donts.length > 0 && (
            <div className="mt-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
              <p className="text-red-400 text-sm">
                <strong>Selected Don'ts:</strong> {donts.join(", ")}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-gold/10 rounded-xl border border-gold/20">
          <h3 className="font-medium text-gold mb-2 flex items-center">
            <Sparkles className="w-5 h-5 mr-2" /> Guidelines Summary
          </h3>
          <div className="space-y-2 text-sm">
            <p className="text-zinc-300">
              <strong>{name}</strong> will be guided by {dos.length} positive behaviors and will avoid {donts.length} negative behaviors.
            </p>
            {dos.length > 0 && (
              <p className="text-green-400">
                <strong>Key Strengths:</strong> {dos.slice(0, 3).join(", ")}{dos.length > 3 ? "..." : ""}
              </p>
            )}
            {donts.length > 0 && (
              <p className="text-red-400">
                <strong>Avoids:</strong> {donts.slice(0, 3).join(", ")}{donts.length > 3 ? "..." : ""}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfo();
      case 2:
        return renderVisualIdentity();
      case 3:
        return renderEmotionalState();
      case 4:
        return renderPersonality();
      case 5:
        return renderScenario();
      case 6:
        return renderGuidelines();
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-purple-900/20 to-zinc-900 text-white overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Animated background particles */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-gold/40"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              filter: "blur(1px)",
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="border-b border-zinc-700/20 bg-zinc-900/80 backdrop-blur-2xl fixed left-0 right-0 top-0 z-50 shadow-lg">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="text-gold hover:text-gold/80 transition-colors duration-300 transform active:scale-95 min-h-[44px]"
              aria-label="Back"
            >
              <ArrowLeft className="w-7 h-7" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center border border-gold/20 relative overflow-hidden group shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <Bot className="w-7 h-7 text-gold group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/20 to-gold/0 opacity-0 group-hover:opacity-100 animate-shimmer transition-opacity duration-500"></div>
              </div>
              <div>
                <span className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-gold via-softgold-500 to-gold text-[clamp(1.25rem,4vw,1.875rem)]">
                  Create Companion
                </span>
                <p className="text-zinc-400 text-sm">Step {currentStep} of {totalSteps}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 pb-28 md:pb-16 px-6 animate-fade-in">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-6">
            <MobileStepIndicator
              currentStep={currentStep}
              totalSteps={totalSteps}
              titles={stepTitles}
              icons={stepIcons}
              isLoading={isStepUiLoading}
              onStepClick={handleGotoStep}
            />
          </div>

          {/* Progress Steps (desktop) */}
          <div className="mb-12 hidden md:block">
            <div className="flex justify-center items-center space-x-4 overflow-x-auto pb-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center min-w-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      currentStep >= step.number
                        ? "bg-gold border-gold text-zinc-900"
                        : "bg-zinc-800/50 border-zinc-700 text-zinc-400"
                    }`}>
                      {currentStep > step.number ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <step.icon className="w-6 h-6" />
                      )}
                    </div>
                    <p className={`text-sm mt-2 text-center ${
                      currentStep >= step.number ? "text-gold" : "text-zinc-400"
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-zinc-500 text-center hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 transition-all duration-300 ${
                      currentStep > step.number ? "bg-gold" : "bg-zinc-700"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-zinc-700/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-gold/0 via-gold/30 to-gold/0 blur-xl opacity-20" aria-hidden="true"></div>
            
            {/* Inner content with glass effect */}
            <div className="relative z-10 p-6 md:p-10" ref={stepContainerRef}>
              {isSubmitting && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col gap-3 p-6" aria-hidden="true">
                  <div className="h-6 w-1/2 bg-zinc-700/40 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-zinc-700/40 rounded animate-pulse" />
                  <div className="h-40 w-full bg-zinc-700/40 rounded animate-pulse" />
                </div>
              )}
              {renderStepContent()}

              {/* Validation submit error */}
              {errors.submit && (
                <div className="mt-6 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300" role="alert">
                  {errors.submit}
                </div>
              )}

              {/* Navigation buttons (desktop) */}
              <div className="hidden md:flex justify-between items-center mt-10">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 min-h-[44px] ${
                    currentStep === 1
                      ? "bg-zinc-800/50 text-zinc-500 cursor-not-allowed"
                      : "bg-zinc-800/60 text-white hover:bg-zinc-700/60 border border-zinc-700/30 active:scale-95"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Previous
                </button>

                <div className="flex space-x-4">
                  {currentStep === totalSteps ? (
                    <div className="relative group">
                {saved && (
                  <div className="absolute right-0 bottom-16 bg-green-500/90 text-white px-6 py-3 rounded-xl animate-fade-slide-up flex items-center shadow-lg" aria-live="polite">
                    <Check className="w-5 h-5 mr-2" />
                    <span>Settings saved successfully!</span>
                  </div>
                )}
                  <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="flex items-center bg-gradient-to-r from-gold to-softgold-500 text-zinc-900 rounded-xl py-4 px-8 hover:from-gold/90 hover:to-softgold-500/90 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-softgold-500/20 hover:shadow-xl active:scale-95 disabled:opacity-60"
                  >
                        <span>{isSubmitting ? "Creating…" : "Create Companion"}</span>
                        {!isSubmitting && <Check className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />}
                  </button>
                  <div className="absolute inset-0 rounded-xl -z-10 blur-md bg-gold/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true"></div>
                </div>
                  ) : (
                <button
                      onClick={handleNext}
                      disabled={isSubmitting}
                      className="flex items-center bg-gradient-to-r from-gold to-softgold-500 text-zinc-900 rounded-xl py-4 px-8 hover:from-gold/90 hover:to-softgold-500/90 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-softgold-500/20 hover:shadow-xl group active:scale-95 disabled:opacity-60"
                >
                      <span>Next</span>
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky mobile navigator */}
      <StickyNavigator
        currentStep={currentStep}
        totalSteps={totalSteps}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSubmit={handleSave}
        isSubmitting={isSubmitting}
        disablePrev={false}
        disableNext={false}
      />
    </div>
    </ErrorBoundary>
  );
}

export default AISettings;
