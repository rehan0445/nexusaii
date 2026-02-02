import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Shield, Lock, ArrowLeft, Moon, Trash2 } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { Group } from '../utils/darkroomData';
import { EnhancedChatBubble } from './EnhancedChatBubble';
import { ContentAnalyzer } from '../utils/themeManager';

interface AnonymousMessage {
    alias: string;
    message: string;
    time: string;
}

interface Props {
    group: Group;
    message: string;
    setMessage: (val: string) => void;
    alias: string;
    onBack: () => void;
    socket: Socket;
    onSend: () => void;
    setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
    onDeleteGroup?: (groupId: string) => void;
    canDeleteGroup?: boolean;
}

const AnonymousChat: React.FC<Props> = ({ group, message, setMessage, alias, onBack, socket, onSend, setGroups, onDeleteGroup, canDeleteGroup }) => {
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const inputBarRef = useRef<HTMLDivElement | null>(null);

    const [localMessages, setLocalMessages] = useState<AnonymousMessage[]>(group.messages || []);
    
    const [inputBarHeight, setInputBarHeight] = useState<number>(88);
    const [keyboardOffset, setKeyboardOffset] = useState<number>(0);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [lastSentMessage, setLastSentMessage] = useState<string>('');
    const [lastSentTime, setLastSentTime] = useState<number>(0);

    // Update local messages when group messages change
    useEffect(() => {
        console.log('📨 [AnonymousChat] Group messages updated:', group.messages?.length || 0, 'messages');
        console.log('📨 [AnonymousChat] Current local messages:', localMessages.length);
        
        // Only update if the messages are actually different to prevent unnecessary re-renders
        setLocalMessages(prev => {
            console.log('📨 [AnonymousChat] Comparing messages - prev:', prev.length, 'new:', group.messages?.length || 0);
            
            // Deep comparison to check if messages are actually different
            if (prev.length !== group.messages.length) {
                console.log('📨 [AnonymousChat] Message count changed, updating local messages');
                return group.messages;
            }
            
            // Check if any messages are different
            for (let i = 0; i < prev.length; i++) {
                if (prev[i].alias !== group.messages[i].alias ||
                    prev[i].message !== group.messages[i].message ||
                    prev[i].time !== group.messages[i].time) {
                    console.log('📨 [AnonymousChat] Message content changed, updating local messages');
                    return group.messages;
                }
            }
            
            // No changes detected, keep current state
            console.log('📨 [AnonymousChat] No changes detected, keeping current state');
            return prev;
        });
    }, [group.messages]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [localMessages]);

    // Request room join when component mounts (parent handles the actual joining)
    useEffect(() => {
        if (socket && alias) {
            console.log(`🔗 AnonymousChat ensuring room join for ${group.id}`);
            // The parent component handles the actual socket joining and message management
            // We just need to make sure we're properly connected
        }
    }, [socket, group.id, alias]);

    // Debounced send function to prevent rapid-fire sending
    const debouncedSend = useCallback(() => {
        if (isSending) {
            console.log('⚠️ Message sending in progress, ignoring duplicate send');
            return;
        }
        
        // Check for duplicate message within 3 seconds
        const now = Date.now();
        if (message.trim() === lastSentMessage && (now - lastSentTime) < 3000) {
            console.log('⚠️ Duplicate message detected within 3 seconds, ignoring send');
            return;
        }
        
        setIsSending(true);
        setLastSentMessage(message.trim());
        setLastSentTime(now);
        // Optimistically add the message locally so it appears immediately
        const optimisticMessage = {
            alias,
            message: message.trim(),
            time: new Date().toISOString(),
        };
        setLocalMessages(prev => [...prev, optimisticMessage]);
        onSend();
        // Clear input after sending
        setMessage('');
        
        // Reset sending state after a short delay
        setTimeout(() => {
            setIsSending(false);
        }, 1000);
    }, [isSending, onSend, message, lastSentMessage, lastSentTime]);

    

    const autoResize = () => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = 'auto';
        const maxHeight = 120; // px
        el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
    };

    const recalcInputBarHeight = () => {
        if (inputBarRef.current) {
            setInputBarHeight(inputBarRef.current.offsetHeight);
        }
    };

    useEffect(() => {
        recalcInputBarHeight();
    }, [message]);

    useEffect(() => {
        const onResize = () => recalcInputBarHeight();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Mobile keyboard handling using visualViewport
    useEffect(() => {
        const vv: any = (window as any).visualViewport;
        if (!vv) return;
        const update = () => {
            const bottomInset = Math.max(0, window.innerHeight - (vv.height + (vv.offsetTop || 0)));
            setKeyboardOffset(bottomInset);
        };
        update();
        vv.addEventListener('resize', update);
        vv.addEventListener('scroll', update);
        return () => {
            vv.removeEventListener('resize', update);
            vv.removeEventListener('scroll', update);
        };
    }, []);

    

    console.log("AnonymousChat - Group ID:", group.id, "| Messages count:", localMessages.length);
    console.log("AnonymousChat - Created By:", group.createdBy, "| Alias:", alias);

    return (
        <div className="fixed inset-0 z-40 bg-black flex flex-col" style={{fontFamily: 'Roboto Mono, monospace'}}>
            {/* Dark Room Chat Header */}
            <div className="p-4 border-b border-green-500/30 bg-zinc-900/90 flex items-center justify-between">
                <div className="flex items-center">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onBack();
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white mr-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center">
                        <Moon className="w-5 h-5 text-green-500 mr-2" />
                        <h2 className="text-lg font-bold text-white" style={{fontFamily: 'UnifrakturCook, cursive'}}>{group.name}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <code className="px-2 py-1 rounded bg-[#0c0c0c] border border-green-500/30 text-green-400 text-xs" style={{fontFamily: 'Roboto Mono, monospace'}}>
                        dark_id: {group.id}
                    </code>
                    
                    {/* Delete Button (Creator Only) */}
                    {canDeleteGroup && onDeleteGroup && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteGroup(group.id);
                            }}
                            className="w-8 h-8 bg-red-900/50 hover:bg-red-800/70 text-red-400 hover:text-red-300 rounded border border-red-500/30 flex items-center justify-center transition-all duration-200"
                            title="Delete group (Creator only)"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Room Description */}
            {group.description && (
                <div className="px-4 py-2 bg-zinc-900/50 border-b border-green-500/20">
                    <p className="text-zinc-300 text-sm">{group.description}</p>
                </div>
            )}

            {/* Privacy Indicator */}
            <div className="px-4 py-2 bg-green-900/10 border-b border-green-500/20">
                <div className="flex items-center gap-2 text-xs text-green-400" style={{fontFamily: 'Roboto Mono, monospace'}}>
                    <Shield className="w-3 h-3" />
                    <span>Alias protected</span>
                    <Lock className="w-3 h-3" />
                    <span>Private room</span>
                    <span className="ml-2">• End-to-End Encrypted</span>
                </div>
            </div>

            {/* Messages Container - Scrollable with dynamic bottom padding */}
            <div
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-black relative z-10"
                style={{ paddingBottom: `calc(${inputBarHeight}px + env(safe-area-inset-bottom, 0px) + 8px)` }}
            >
                {localMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
                            <span className="text-green-500 text-2xl">💬</span>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-1">
                            Welcome to {group.name}
                        </h3>
                        <p className="text-zinc-500 max-w-sm mb-4">
                            Be the first to start a conversation in this anonymous group.
                        </p>
                        <div className="flex items-center gap-3 text-xs text-zinc-500" style={{fontFamily: 'Roboto Mono, monospace'}}>
                            <span className="inline-flex items-center gap-1"><Shield className="w-4 h-4 text-green-500/80" /> Alias protected</span>
                            <span className="inline-flex items-center gap-1"><Lock className="w-4 h-4 text-green-500/80" /> Private room</span>
                            <span className="inline-flex items-center gap-1">• End-to-End Encrypted</span>
                        </div>
                    </div>
                ) : (
                    localMessages.map((msg, i) => {
                        const isUser = msg.alias === alias;
                        const genre = ContentAnalyzer.detectGenre(msg.message);
                        const responseType = ContentAnalyzer.detectResponseType(msg.message);

                        // Create a more unique key using message content hash and timestamp
                        const messageHash = `${msg.alias}-${msg.message.substring(0, 20)}-${msg.time}`;
                        const uniqueKey = `${messageHash}-${i}`;

                        return (
                            <div
                                key={uniqueKey}
                                className={`flex w-full mb-4 ${
                                    i === localMessages.length - 1 ? 'scroll-mb-20' : ''
                                }`}
                            >
                                <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] sm:max-w-[70%] ${isUser ? 'ml-auto' : 'mr-auto'}`}>
                                        <EnhancedChatBubble
                                            content={msg.message}
                                            sender={isUser ? "user" : "anonymous"}
                                            characterName={msg.alias}
                                            genre={genre as any}
                                            responseType={responseType as any}
                                            showMetadata={!isUser}
                                            showActions={false}
                                            className={`${
                                                isUser
                                                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-md ml-auto'
                                                    : 'bg-zinc-700 text-white rounded-2xl rounded-bl-md mr-auto'
                                            }`}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Fixed Bottom Message Input */}
            <div
                ref={inputBarRef}
                className="fixed inset-x-0 bg-black border-t border-green-500/30 z-50"
                style={{ bottom: `calc(${keyboardOffset}px + env(safe-area-inset-bottom, 0px))` }}
            >
                <div className="p-4">
                    <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                            <textarea
                                ref={inputRef}
                                value={message}
                                onChange={(e) => { setMessage(e.target.value); autoResize(); recalcInputBarHeight(); }}
                                onFocus={() => {
                                    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                onInput={() => { autoResize(); recalcInputBarHeight(); }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        debouncedSend();
                                    }
                                }}
                                placeholder="Type anonymously..."
                                rows={1}
                                inputMode="text"
                                enterKeyHint="send"
                                className="w-full px-4 py-3 bg-[#0c0c0c] border border-green-500/30 rounded-lg text-white placeholder-green-500/50 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 font-mono min-h-[44px] max-h-[120px] resize-none"
                                aria-label="Message input"
                            />
                        </div>
                        <button
                            onClick={debouncedSend}
                            disabled={isSending}
                            className={`px-4 py-3 bg-green-900/50 hover:bg-green-800/60 text-green-300 rounded-lg border border-green-500/40 font-mono min-h-[44px] min-w-[44px] flex items-center justify-center transition-opacity ${
                                isSending ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            aria-label="Send"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnonymousChat; 