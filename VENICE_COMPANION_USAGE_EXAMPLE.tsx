// Example React Component using Optimized Companion Service
import React, { useState, useEffect, useRef } from "react";
import {
  createChatSession,
  sendMessage,
  sendMessageStreaming,
  saveConversation,
  restoreConversation,
  getSessionStats,
  clearSession,
  ChatSession,
} from "./services/companionService";
import { MessageSquare, Send, BarChart3, Trash2, Download } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  emotion?: string;
}

export default function OptimizedCompanionChat() {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [useStreaming, setUseStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Character selection
  const [characterSlug] = useState("naruto-uzumaki");

  // Initialize or restore session
  useEffect(() => {
    const initSession = async () => {
      // Try to restore existing conversation
      const restored = restoreConversation(characterSlug);
      
      if (restored) {
        setSession(restored);
        // Reconstruct messages from conversation
        const msgs = restored.conversation
          .filter((m) => m.role !== "system")
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: m.timestamp || Date.now(),
          }));
        setMessages(msgs);
        console.log("📂 Restored conversation with", msgs.length, "messages");
      } else {
        // Create new session
        const newSession = createChatSession(characterSlug);
        setSession(newSession);
        console.log("✨ Created new session:", newSession.id);
      }
    };

    initSession();

    // Cleanup on unmount
    return () => {
      if (session) {
        saveConversation(session.id);
      }
    };
  }, [characterSlug]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update stats every 5 seconds
  useEffect(() => {
    if (!session) return;

    const updateStats = () => {
      const sessionStats = getSessionStats(session.id);
      setStats(sessionStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [session]);

  // Handle send message
  const handleSend = async () => {
    if (!input.trim() || !session || isTyping) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      if (useStreaming) {
        // Streaming mode
        let streamedContent = "";
        const assistantMessage: Message = {
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        await sendMessageStreaming(
          session.id,
          input,
          (chunk) => {
            streamedContent += chunk;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1].content = streamedContent;
              return updated;
            });
          }
        );
      } else {
        // Normal mode (with caching & queue)
        const response = await sendMessage(session.id, input);

        const assistantMessage: Message = {
          role: "assistant",
          content: response,
          timestamp: Date.now(),
          emotion: session.emotion,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }

      // Auto-save after each message
      saveConversation(session.id);
    } catch (error: any) {
      console.error("Error sending message:", error);
      
      const errorMessage: Message = {
        role: "assistant",
        content: error.message || "Sorry, I couldn't process that. Please try again.",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Clear conversation
  const handleClear = () => {
    if (!session) return;
    
    if (confirm("Clear this conversation? This cannot be undone.")) {
      clearSession(session.id);
      localStorage.removeItem(`chat_${characterSlug}`);
      
      // Create new session
      const newSession = createChatSession(characterSlug);
      setSession(newSession);
      setMessages([]);
    }
  };

  // Export conversation
  const handleExport = () => {
    if (!session) return;

    const exportData = {
      character: characterSlug,
      date: new Date().toISOString(),
      messages: messages,
      stats: stats,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation-${characterSlug}-${Date.now()}.json`;
    a.click();
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading companion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-amber-500" />
            <div>
              <h1 className="text-lg font-semibold">Optimized Companion Chat</h1>
              <p className="text-sm text-gray-500">
                {session.emotion} • {session.model}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Streaming Toggle */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useStreaming}
                onChange={(e) => setUseStreaming(e.target.checked)}
                className="rounded text-amber-500"
              />
              Streaming
            </label>

            {/* Actions */}
            <button
              onClick={handleExport}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Export conversation"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleClear}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Clear conversation"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="mt-3 flex gap-4 text-xs text-gray-500">
            <span>📊 {stats.messageCount} messages</span>
            <span>💾 Cache: {stats.cacheSize}</span>
            <span>⏳ Queue: {stats.queueSize}</span>
            <span>🔄 Active: {stats.activeRequests}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <p>Start a conversation with your companion!</p>
            <p className="text-sm mt-2">
              ✨ Powered by optimized Venice AI with caching, queuing & smart compression
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                msg.role === "user"
                  ? "bg-amber-500 text-white"
                  : "bg-white border border-gray-200"
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(msg.timestamp).toLocaleTimeString()}
                {msg.emotion && ` • ${msg.emotion}`}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            disabled={isTyping}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="px-6 py-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>

        {/* Tips */}
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
          <BarChart3 className="w-3 h-3" />
          <span>
            {useStreaming
              ? "Streaming mode: Real-time responses"
              : "Normal mode: Optimized with caching & queuing"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Advanced Usage Examples
// ============================================

// Example 1: Group Chat Component
export function GroupChatExample() {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [participants] = useState(["Alice", "Bob", "Charlie"]);

  useEffect(() => {
    const newSession = createChatSession("goku-son", participants);
    setSession(newSession);
  }, []);

  const handleGroupMessage = async (messages: { name: string; text: string }[]) => {
    if (!session) return;

    try {
      const response = await groupChat(session.id, messages);
      console.log("AI Response:", response);
    } catch (error) {
      console.error("Group chat error:", error);
    }
  };

  // Usage
  // handleGroupMessage([
  //   { name: "Alice", text: "Hey Goku!" },
  //   { name: "Bob", text: "Want to train?" },
  // ]);

  return null;
}

// Example 2: Priority Messaging
export function PriorityMessagingExample() {
  const sendUrgentMessage = async (sessionId: string, message: string) => {
    // High priority (processed first in queue)
    const response = await sendMessage(sessionId, message, "User", 10);
    return response;
  };

  const sendNormalMessage = async (sessionId: string, message: string) => {
    // Normal priority
    const response = await sendMessage(sessionId, message, "User", 5);
    return response;
  };

  return null;
}

// Example 3: Session Management Dashboard
export function SessionDashboard() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    const active = getActiveSessions();
    setSessions(active);

    const interval = setInterval(() => {
      const updated = getActiveSessions();
      setSessions(updated);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Active Sessions</h2>
      <div className="grid gap-4">
        {sessions.map((session) => {
          const stats = getSessionStats(session.id);
          return (
            <div key={session.id} className="border rounded-lg p-4">
              <h3 className="font-semibold">{session.characterSlug}</h3>
              <p className="text-sm text-gray-600">
                Messages: {stats?.messageCount} | Emotion: {session.emotion}
              </p>
              <p className="text-sm text-gray-600">
                Model: {session.model} | Last: {stats?.lastActivity}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

