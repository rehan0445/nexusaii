import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Hash, Bold, Italic, Type, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/utils';

// Get the server URL for API calls
const getServerUrl = () => {
  return import.meta.env.VITE_SERVER_URL || globalThis.location.origin;
};

// Get session ID for confessions
const getSessionId = () => {
  const SESSION_KEY = 'confession_session_id';
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      localStorage.setItem(SESSION_KEY, sessionId);
    } catch (e) {
      console.warn('Failed to save session ID:', e);
    }
  }
  return sessionId;
};

export function WriteConfession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const postType = searchParams.get('type') as 'username' | 'alias' | null;
  const { currentUser } = useAuth();
  
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alias, setAlias] = useState<{ name: string; emoji: string; color: string; imageUrl?: string | null } | null>(null);
  const [loadingAlias, setLoadingAlias] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [showFontSizeSelector, setShowFontSizeSelector] = useState(false);
  const [fontSize, setFontSize] = useState('base');
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const tagSelectorRef = useRef<HTMLDivElement>(null);
  const fontSizeSelectorRef = useRef<HTMLDivElement>(null);
  
  const commonTags = ['#confession', '#vent', '#advice', '#support', '#anonymous', '#thoughts'];

  // Close tag selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagSelectorRef.current && !tagSelectorRef.current.contains(e.target as Node)) {
        setShowTagSelector(false);
      }
      if (fontSizeSelectorRef.current && !fontSizeSelectorRef.current.contains(e.target as Node)) {
        setShowFontSizeSelector(false);
      }
    };
    if (showTagSelector || showFontSizeSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTagSelector, showFontSizeSelector]);

  // Listen for selection changes to update button states
  useEffect(() => {
    const handleSelectionChange = () => {
      if (editorRef.current && document.activeElement === editorRef.current) {
        checkFormattingState();
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // Redirect if no post type selected or if username selected but not logged in
  useEffect(() => {
    if (!postType || (postType !== 'username' && postType !== 'alias')) {
      navigate('/campus/general/confessions');
      return;
    }
    if (postType === 'username' && !currentUser) {
      // Redirect to login or use alias instead
      alert('Please log in to post with your username, or use anonymous posting.');
      navigate('/campus/general/confessions');
    }
  }, [postType, currentUser, navigate]);

  // Fetch username if posting with username
  useEffect(() => {
    const fetchUsername = async () => {
      if (postType === 'username' && currentUser) {
        try {
          const serverUrl = getServerUrl();
          const res = await fetch(`${serverUrl}/api/v1/chat/get-profile-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ uid: currentUser.uid })
          });

          if (res.ok) {
            const result = await res.json();
            const row = (Array.isArray(result.data) ? result.data[0] : result.data) || {};
            const name = row.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
            setUsername(name);
          } else {
            setUsername(currentUser.displayName || currentUser.email?.split('@')[0] || 'User');
          }
        } catch (error) {
          console.error('Error fetching username:', error);
          setUsername(currentUser.displayName || currentUser.email?.split('@')[0] || 'User');
        }
      }
    };

    fetchUsername();
  }, [postType, currentUser]);

  // Fetch alias if posting with alias
  useEffect(() => {
    const fetchAlias = async () => {
      if (postType === 'alias') {
        setLoadingAlias(true);
        try {
          const sessionId = getSessionId();
          const serverUrl = getServerUrl();
          const response = await apiFetch(`${serverUrl}/api/confessions/alias/${sessionId}`);
          const result = await response.json();

          if (result.success && result.data) {
            setAlias({
              name: result.data.name || result.data.alias_name || 'Anonymous',
              emoji: result.data.emoji || result.data.alias_emoji || '👤',
              color: result.data.color || result.data.alias_color || 'from-gray-500 to-gray-600',
              imageUrl: result.data.imageUrl || result.data.alias_image_url || null
            });
          } else {
            // Create default alias if none exists
            const defaultAlias = {
              name: 'Anonymous',
              emoji: '👤',
              color: 'from-gray-500 to-gray-600',
              imageUrl: null
            };
            setAlias(defaultAlias);
          }
        } catch (error) {
          console.error('Error fetching alias:', error);
          // Use default alias on error
          setAlias({
            name: 'Anonymous',
            emoji: '👤',
            color: 'from-gray-500 to-gray-600',
            imageUrl: null
          });
        } finally {
          setLoadingAlias(false);
        }
      }
    };

    fetchAlias();
  }, [postType]);

  // Extract plain text from HTML content
  const getPlainText = (html: string): string => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  // Get text content from editor
  const getEditorText = (): string => {
    if (!editorRef.current) return '';
    return getPlainText(editorRef.current.innerHTML);
  };

  const handleSubmit = async () => {
    const textContent = getEditorText();
    if (isSubmitting || !textContent.trim()) return;

    setIsSubmitting(true);
    try {
      const sessionId = getSessionId();
      const serverUrl = getServerUrl();

      let aliasData = null;
      let userName = null;

      if (postType === 'alias') {
        // Use alias for posting
        aliasData = alias || {
          name: 'Anonymous',
          emoji: '👤',
          color: 'from-gray-500 to-gray-600'
        };
      } else if (postType === 'username') {
        // Use username for posting
        userName = username || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
        // Still need an alias object for the database (required field)
        aliasData = {
          name: userName,
          emoji: '👤',
          color: 'from-gray-500 to-gray-600'
        };
      }

      const response = await apiFetch(`${serverUrl}/api/confessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: textContent.trim(),
          alias: aliasData,
          sessionId: sessionId,
          campus: 'general', // Default to general campus
          userName: postType === 'username' ? userName : null,
          userEmail: postType === 'username' && currentUser?.email ? currentUser.email : null
        })
      });

      const result = await response.json();

      if (result.success) {
        // Navigate back to feed
        navigate('/campus/general/confessions');
      } else {
        console.error('Failed to post confession:', result.message);
        alert('Failed to post confession. Please try again.');
      }
    } catch (error) {
      console.error('Error posting confession:', error);
      alert('An error occurred while posting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = getEditorText().trim().length > 0 && !isSubmitting && !loadingAlias;

  // Check formatting state
  const checkFormattingState = () => {
    if (!editorRef.current) return;
    
    // Check bold state
    const boldState = document.queryCommandState('bold');
    setIsBoldActive(boldState);
    
    // Check italic state
    const italicState = document.queryCommandState('italic');
    setIsItalicActive(italicState);
  };

  // Formatting functions using document.execCommand
  const applyBold = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('bold', false);
    setTimeout(checkFormattingState, 0);
    processHashtags();
  };

  const applyItalic = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('italic', false);
    setTimeout(checkFormattingState, 0);
    processHashtags();
  };

  // Process hashtags to style them in purple (debounced to avoid excessive processing)
  const processHashtags = (() => {
    let timeoutId: NodeJS.Timeout | null = null;
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!editorRef.current) return;
        
        // Save current selection
        const selection = globalThis.getSelection();
        let savedRange: Range | null = null;
        if (selection && selection.rangeCount > 0) {
          savedRange = selection.getRangeAt(0).cloneRange();
        }
        
        // Walk through text nodes and wrap hashtags
        const walker = document.createTreeWalker(
          editorRef.current,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              // Skip if already inside a hashtag span
              const parent = node.parentElement;
              if (parent && parent.style.color === 'rgb(168, 85, 247)') {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );
        
        const textNodes: Text[] = [];
        let node;
        while ((node = walker.nextNode())) {
          const textNode = node as Text;
          const text = textNode.textContent || '';
          if (/#\w+/.test(text)) {
            textNodes.push(textNode);
          }
        }
        
        // Process each text node containing hashtags
        textNodes.forEach(textNode => {
          const text = textNode.textContent || '';
          const hashtagRegex = /(#\w+)/g;
          const parts: (string | Node)[] = [];
          let lastIndex = 0;
          let match;
          
          while ((match = hashtagRegex.exec(text)) !== null) {
            // Add text before hashtag
            if (match.index > lastIndex) {
              parts.push(text.substring(lastIndex, match.index));
            }
            
            // Add styled hashtag
            const span = document.createElement('span');
            span.style.color = '#A855F7';
            span.textContent = match[1];
            parts.push(span);
            
            lastIndex = match.index + match[1].length;
          }
          
          // Add remaining text
          if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
          }
          
          // Replace text node with new nodes
          if (parts.length > 0) {
            const parent = textNode.parentNode;
            if (parent) {
              parts.forEach(part => {
                if (typeof part === 'string') {
                  parent.insertBefore(document.createTextNode(part), textNode);
                } else {
                  parent.insertBefore(part, textNode);
                }
              });
              parent.removeChild(textNode);
            }
          }
        });
        
        // Restore selection
        if (savedRange && selection) {
          try {
            selection.removeAllRanges();
            selection.addRange(savedRange);
          } catch (e) {
            // Selection might be invalid, ignore
          }
        }
      }, 100); // Debounce by 100ms
    };
  })();

  // Handle key events in editor
  const handleEditorKeyDown = () => {
    setTimeout(processHashtags, 0);
  };

  // Handle input changes
  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const text = getPlainText(editorRef.current.innerHTML);
    setContent(text);
    checkFormattingState();
    processHashtags();
  };


  // Apply font size to selected text
  const applyFontSize = (size: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // No selection, set default font size for future typing
      setFontSize(size);
      setShowFontSizeSelector(false);
      return;
    }
    
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      // No text selected, set default
      setFontSize(size);
      setShowFontSizeSelector(false);
      return;
    }
    
    // Apply font size to selected text
    const sizeMap: Record<string, string> = {
      'sm': '0.875rem',
      'base': '1rem',
      'lg': '1.125rem',
      'xl': '1.25rem'
    };
    
    const fontSizeValue = sizeMap[size] || '1rem';
    
    // Create a span with the font size
    const span = document.createElement('span');
    span.style.fontSize = fontSizeValue;
    
    try {
      range.surroundContents(span);
      processHashtags();
    } catch (e) {
      // If surroundContents fails, use execCommand
      document.execCommand('fontSize', false, '7'); // Use arbitrary size
      // Then find and replace the font tag with our span
      const fontTags = editorRef.current.querySelectorAll('font[size="7"]');
      fontTags.forEach(font => {
        const span = document.createElement('span');
        span.style.fontSize = fontSizeValue;
        span.innerHTML = font.innerHTML;
        font.parentNode?.replaceChild(span, font);
      });
      processHashtags();
    }
    
    setShowFontSizeSelector(false);
  };

  const insertTag = (tag: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('insertText', false, tag + ' ');
    setShowTagSelector(false);
    processHashtags();
  };

  const fontSizeOptions = [
    { value: 'sm', label: 'Small' },
    { value: 'base', label: 'Normal' },
    { value: 'lg', label: 'Large' },
    { value: 'xl', label: 'XL' }
  ];

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/95 border-b border-white/10 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/campus/general/confessions')}
            className="text-[#A1A1AA] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Express</h1>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              canSubmit
                ? 'bg-gradient-to-r from-[#A855F7] to-[#9333EA] text-white hover:from-[#9333EA] hover:to-[#A855F7]'
                : 'bg-[#1A1A1A] text-[#A1A1AA] cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{isSubmitting ? 'Posting...' : 'Send'}</span>
          </button>
        </div>
      </header>

      {/* Post Type Indicator */}
      <div className="max-w-2xl mx-auto px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
          <span>Posting as:</span>
          <span className="text-[#A855F7] font-medium">
            {postType === 'username' 
              ? (username || 'Loading...') 
              : 'alias'
            }
          </span>
        </div>
      </div>

      {/* Writing Area */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Formatting Toolbar */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-2 mb-2 flex items-center gap-2 flex-wrap">
          {/* Tags */}
          <div className="relative" ref={tagSelectorRef}>
            <button
              onClick={() => setShowTagSelector(!showTagSelector)}
              className={`p-2 rounded-lg transition-colors ${
                showTagSelector
                  ? 'text-[#A855F7] bg-[#A855F7]/20'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#0A0A0A]'
              }`}
              title="Add tag"
            >
              <Hash className="w-4 h-4" />
            </button>
            {showTagSelector && (
              <div className="absolute top-full left-0 mt-2 bg-[#0A0A0A] border border-white/10 rounded-lg shadow-lg z-50 min-w-[200px]">
                <div className="p-2 border-b border-white/10 flex items-center justify-between">
                  <span className="text-xs text-[#A1A1AA]">Tags</span>
                  <button
                    onClick={() => setShowTagSelector(false)}
                    className="text-[#A1A1AA] hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-2 space-y-1">
                  {commonTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => insertTag(tag)}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#1A1A1A] rounded-lg transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bold */}
          <button
            onClick={applyBold}
            className={`p-2 rounded-lg transition-all ${
              isBoldActive
                ? 'bg-white/10 border-2 border-white text-white'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#0A0A0A] border-2 border-transparent'
            }`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>

          {/* Italic */}
          <button
            onClick={applyItalic}
            className={`p-2 rounded-lg transition-all ${
              isItalicActive
                ? 'bg-white/10 border-2 border-white text-white'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#0A0A0A] border-2 border-transparent'
            }`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>

          {/* Font Size */}
          <div className="relative" ref={fontSizeSelectorRef}>
            <button
              onClick={() => setShowFontSizeSelector(!showFontSizeSelector)}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                showFontSizeSelector
                  ? 'text-[#A855F7] bg-[#A855F7]/20'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#0A0A0A]'
              }`}
              title="Font size"
            >
              <Type className="w-4 h-4" />
              <span className="text-xs">{fontSizeOptions.find(o => o.value === fontSize)?.label}</span>
            </button>
            {showFontSizeSelector && (
              <div className="absolute top-full left-0 mt-2 bg-[#0A0A0A] border border-white/10 rounded-lg shadow-lg z-50 min-w-[120px]">
                <div className="p-2 space-y-1">
                  {fontSizeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        applyFontSize(option.value);
                        setShowFontSizeSelector(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        fontSize === option.value
                          ? 'text-[#A855F7] bg-[#A855F7]/20'
                          : 'text-white hover:bg-[#1A1A1A]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Character Count */}
          <span className="text-xs text-[#A1A1AA] px-2">{getEditorText().length}/5000</span>
        </div>

        <div
          ref={editorRef}
          contentEditable
          onInput={handleEditorInput}
          onKeyDown={handleEditorKeyDown}
          onMouseUp={checkFormattingState}
          onKeyUp={checkFormattingState}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
            setTimeout(checkFormattingState, 0);
            processHashtags();
          }}
          data-placeholder="Share your thoughts..."
          className={`w-full h-96 bg-[#1A1A1A] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#A855F7]/50 resize-none overflow-y-auto ${
            fontSize === 'sm' ? 'text-sm' :
            fontSize === 'lg' ? 'text-lg' :
            fontSize === 'xl' ? 'text-xl' :
            'text-base'
          }`}
          style={{
            minHeight: '24rem',
            maxHeight: '24rem',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap'
          }}
        />
        
        {/* Placeholder styling */}
        <style>{`
          [contenteditable][data-placeholder]:empty:before {
            content: attr(data-placeholder);
            color: #A1A1AA;
            pointer-events: none;
          }
        `}</style>
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-white/10 p-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              canSubmit
                ? 'bg-gradient-to-r from-[#A855F7] to-[#9333EA] text-white hover:from-[#9333EA] hover:to-[#A855F7]'
                : 'bg-[#1A1A1A] text-[#A1A1AA] cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
            {isSubmitting ? 'Posting...' : 'Express'}
          </button>
        </div>
      </div>
    </div>
  );
}
