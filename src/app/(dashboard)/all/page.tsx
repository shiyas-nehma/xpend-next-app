'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
// import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Message, ChatSession } from '@/types';
import { AIIcon, UserCircleIcon, StopSquareIcon, PlusIcon, ChatBubbleLeftIcon, TrashIcon, PencilIcon, ClipboardIcon, RefreshIcon } from '@/components/icons/NavIcons';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { useToast } from '@/hooks/useToast';
import FormattedMessageContent from '@/components/common/FormattedMessageContent';

const ALL_SUGGESTED_PROMPTS = [
  "Summarize my expenses for last month.",
  "What are my top 3 spending categories?",
  "Give me tips to improve my savings rate.",
  "Draft an email to a client about an overdue invoice.",
  "Compare my income vs. expenses for the last quarter.",
  "What's the budget for the 'Entertainment' category?",
];

const initialMessage: Message = {
    role: 'model',
    content: "Hello! I'm your AI financial assistant. How can I help you analyze your data or be more productive today?"
};

const LoadingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1.5 p-2">
        <div className="w-2 h-2 bg-brand-text-secondary rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-brand-text-secondary rounded-full animate-pulse [animation-delay:0.2s]"></div>
        <div className="w-2 h-2 bg-brand-text-secondary rounded-full animate-pulse [animation-delay:0.4s]"></div>
    </div>
);

const ThinkingBubble: React.FC = () => (
    <div className="flex items-start gap-3 w-full justify-start animate-fade-in-scale">
        <div className="w-8 h-8 rounded-full bg-brand-surface-2 border border-brand-border flex items-center justify-center flex-shrink-0 mt-1">
            <AIIcon className="w-5 h-5 text-brand-text-secondary" />
        </div>
        <div className={`max-w-xl p-3 rounded-2xl text-sm bg-brand-surface border border-brand-border text-brand-text-primary rounded-bl-lg`}>
            <div className="flex items-center gap-2">
                <span className="text-brand-text-secondary">Thinking</span>
                <LoadingIndicator />
            </div>
        </div>
    </div>
);

interface ChatMessageProps {
    message: Message;
    isStreaming: boolean;
    isLastModelMessage: boolean;
    onCopy: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming, isLastModelMessage, onCopy }) => {
    const isModel = message.role === 'model';
    
    return (
        <div className={`flex items-start gap-3 w-full ${!isModel ? 'justify-end' : 'justify-start'}`}>
            {isModel && (
                <div className="w-8 h-8 rounded-full bg-brand-surface-2 border border-brand-border flex items-center justify-center flex-shrink-0 mt-1">
                    <AIIcon className="w-5 h-5 text-brand-text-secondary" />
                </div>
            )}
            <div className="max-w-xl group flex items-center gap-2">
                <div className={`relative p-4 rounded-2xl text-sm ${
                    !isModel
                        ? 'bg-brand-blue text-white rounded-br-lg'
                        : 'bg-brand-surface border border-brand-border text-brand-text-primary rounded-bl-lg'
                }`}>
                    {message.content ? <FormattedMessageContent content={message.content} /> : <LoadingIndicator />}
                    {isStreaming && <span className="inline-block w-2 h-4 bg-brand-text-primary ml-1 animate-blinking-cursor"></span>}
                </div>
                {isLastModelMessage && message.content && (
                    <div className="flex-shrink-0 flex items-center gap-1 text-brand-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={onCopy} className="p-1 hover:text-brand-text-primary" title="Copy"><ClipboardIcon className="w-4 h-4" /></button>
                    </div>
                )}
            </div>
            {!isModel && (
                <div className="w-8 h-8 rounded-full bg-brand-surface-2 border border-brand-border flex items-center justify-center flex-shrink-0 mt-1">
                    <UserCircleIcon className="w-6 h-6 text-brand-text-secondary" />
                </div>
            )}
        </div>
    );
};


const SuggestionCard: React.FC<{ prompt: string; onClick: () => void }> = ({ prompt, onClick }) => (
    <button onClick={onClick} className="text-left text-sm p-4 bg-brand-surface border border-brand-border rounded-lg hover:bg-brand-surface-2 transition-colors hover:border-brand-blue/50 group">
        <p className="font-semibold text-brand-text-primary">{prompt}</p>
        <p className="text-brand-text-secondary text-xs mt-1 group-hover:text-brand-text-primary transition-colors">Ask the AI assistant</p>
    </button>
);


const AIPage: React.FC = () => {
    const { addToast } = useToast();
    const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
        try {
            const saved = localStorage.getItem('aiChatSessions');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [activeChatId, setActiveChatId] = useState<string | null>(() => {
        try {
            const saved = localStorage.getItem('aiActiveChatId');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });
    
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
    const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
    const [editingTitleValue, setEditingTitleValue] = useState('');
    const isCancelledRef = useRef(false);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);
    const [chat, setChat] = useState<Chat | null>(null);

    const activeChat = useMemo(() => chatSessions.find(s => s.id === activeChatId), [chatSessions, activeChatId]);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('aiChatSessions', JSON.stringify(chatSessions));
        localStorage.setItem('aiActiveChatId', JSON.stringify(activeChatId));
    }, [chatSessions, activeChatId]);

    // Scroll to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [activeChat?.messages, isLoading, isThinking]);
    
    // Auto-select first chat if active one is deleted or on initial load
    useEffect(() => {
        if (activeChatId === null && chatSessions.length > 0) {
            setActiveChatId(chatSessions[0].id);
        }
        if (activeChatId && !chatSessions.some(c => c.id === activeChatId)) {
            setActiveChatId(chatSessions.length > 0 ? chatSessions[0].id : null);
        }
    }, [chatSessions, activeChatId]);

    // Effect to sync the chat object with the active session
    useEffect(() => {
        if (activeChat) {
            const chatHistory = activeChat.messages
                .slice(1) // Remove initial system "Hello" message
                .filter(m => m.content) // Ensure no empty content messages are in history
                .map(m => ({
                    role: m.role,
                    parts: [{ text: m.content }],
                }));

            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction: 'You are a specialized financial assistant for the Equota Admin Panel. Your capabilities are strictly limited to analyzing and answering questions about the user\'s financial data (income, expenses, budgets, categories) as presented within this application. You must decline any requests that are not directly related to this financial data, including but not limited to general knowledge questions, creative writing, or personal advice. If a user asks an off-topic question, you must politely state your purpose and guide them back to financial topics. For all financial answers, provide concise and clear information. Use the following markdown formats to highlight key data points: wrap important phrases in double asterisks like **this**, format currency as $1,234.56, positive percentages as +12.5%, and negative percentages as -5.2%.' },
                history: chatHistory,
            });
            setChat(newChat);
        } else {
            setChat(null);
        }
    }, [activeChat, ai]);

    const handleNewChat = () => {
        const newChat: ChatSession = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [initialMessage],
        };
        setChatSessions(prev => [newChat, ...prev]);
        setActiveChatId(newChat.id);
    };

    const handleSelectChat = (id: string) => {
        if (isLoading) return;
        setActiveChatId(id);
    };

    const handleDeleteRequest = (id: string) => {
        setDeletingChatId(id);
    };

    const handleConfirmDelete = () => {
        if (deletingChatId) {
            const chatToDelete = chatSessions.find(s => s.id === deletingChatId);
            setChatSessions(prev => prev.filter(s => s.id !== deletingChatId));
            if (chatToDelete) {
                addToast(`Chat "${chatToDelete.title}" deleted.`, 'info');
            }
            setDeletingChatId(null);
        }
    };
    
    const handleStopStream = () => {
        isCancelledRef.current = true;
        setIsLoading(false);
    };

    const handleRenameStart = (id: string, title: string) => {
        setEditingTitleId(id);
        setEditingTitleValue(title);
    };

    const handleRenameCancel = () => {
        setEditingTitleId(null);
        setEditingTitleValue('');
    };

    const handleRenameSave = (id: string) => {
        if (!editingTitleValue.trim()) {
            handleRenameCancel();
            return;
        }
        setChatSessions(prev =>
            prev.map(s => (s.id === id ? { ...s, title: editingTitleValue.trim() } : s))
        );
        addToast("Chat renamed successfully!", "success");
        handleRenameCancel();
    };
    
    const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
        if (e.key === 'Enter') {
            handleRenameSave(id);
        } else if (e.key === 'Escape') {
            handleRenameCancel();
        }
    };

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content)
            .then(() => {
                addToast('Copied to clipboard!', 'success');
            })
            .catch(err => {
                addToast('Failed to copy text.', 'error');
                console.error('Could not copy text: ', err);
            });
    };

    const generateTitle = async (userMessage: string, modelResponse: string): Promise<string> => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Based on this conversation, create a short, descriptive title (max 5 words).\n\nUSER: ${userMessage}\nMODEL: ${modelResponse}`,
            });
            return response.text.trim().replace(/["'*]/g, '');
        } catch (e) {
            console.error("Title generation failed:", e);
            return "Untitled Chat";
        }
    };
    
    const handleSendMessage = async (messageContent: string) => {
        if (isLoading || !messageContent.trim()) return;
        
        let currentChatId = activeChatId;
        let currentChatInstance = chat;
        let isFirstUserMessage = activeChat?.messages.length === 1;

        // If no active chat, create a new one
        if (!currentChatId || !currentChatInstance) {
            const newChatSession: ChatSession = { id: Date.now().toString(), title: "New Chat", messages: [initialMessage] };
            setChatSessions(prev => [newChatSession, ...prev]);
            currentChatId = newChatSession.id;
            setActiveChatId(newChatSession.id);
            isFirstUserMessage = true;

            currentChatInstance = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction: 'You are a specialized financial assistant for the Equota Admin Panel. Your capabilities are strictly limited to analyzing and answering questions about the user\'s financial data (income, expenses, budgets, categories) as presented within this application. You must decline any requests that are not directly related to this financial data, including but not limited to general knowledge questions, creative writing, or personal advice. If a user asks an off-topic question, you must politely state your purpose and guide them back to financial topics. For all financial answers, provide concise and clear information. Use the following markdown formats to highlight key data points: wrap important phrases in double asterisks like **this**, format currency as $1,234.56, positive percentages as +12.5%, and negative percentages as -5.2%.' },
                history: []
            });
            setChat(currentChatInstance);
        }

        const userMessage: Message = { role: 'user', content: messageContent };

        setChatSessions(prev => prev.map(s => s.id === currentChatId ? { ...s, messages: [...s.messages, userMessage] } : s));
        isCancelledRef.current = false;
        setIsLoading(true);
        setIsThinking(true);
        setError(null);
        setInputValue('');
        
        try {
            const stream = await currentChatInstance.sendMessageStream({ message: messageContent });
            
            let modelResponse = '';
            let isFirstChunk = true;

            for await (const chunk of stream) {
                if (isCancelledRef.current) break;

                if (isFirstChunk) {
                    setIsThinking(false);
                    isFirstChunk = false;
                    setChatSessions(prev => prev.map(s => s.id === currentChatId ? { ...s, messages: [...s.messages, { role: 'model', content: '' }] } : s));
                }

                modelResponse += chunk.text;
                setChatSessions(prev => prev.map(s => {
                    if (s.id === currentChatId) {
                        const newMessages = [...s.messages];
                        newMessages[newMessages.length - 1].content = modelResponse;
                        return { ...s, messages: newMessages };
                    }
                    return s;
                }));
            }
            
            if (isFirstUserMessage && !isCancelledRef.current && modelResponse) {
                const newTitle = await generateTitle(userMessage.content, modelResponse);
                setChatSessions(prev => prev.map(s => s.id === currentChatId ? { ...s, title: newTitle } : s));
            }
        } catch (e) {
            setIsThinking(false);
            const errorMessage = "I'm sorry, I couldn't process that request. Please try again.";
            setError(errorMessage);
            setChatSessions(prev => prev.map(s => {
                if (s.id === currentChatId) {
                    const newMessages = [...s.messages];
                    newMessages.push({ role: 'model', content: errorMessage });
                    return { ...s, messages: newMessages };
                }
                return s;
            }));
        } finally {
            setIsLoading(false);
            setIsThinking(false);
            isCancelledRef.current = false;
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSendMessage(inputValue);
    };

    const chatToDelete = chatSessions.find(s => s.id === deletingChatId);

    return (
        <div className="flex h-full bg-brand-bg">
            <div className="w-72 bg-brand-surface border-r border-brand-border flex flex-col p-4">
                <button
                    onClick={handleNewChat}
                    className="flex w-full items-center justify-center space-x-2 bg-brand-surface-2 border border-brand-border text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-border transition-colors text-brand-text-primary"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>New Chat</span>
                </button>
                <div className="flex-grow overflow-y-auto mt-4 -mr-2 pr-2 space-y-2">
                    {chatSessions.map(session => (
                        <div key={session.id} className="group relative">
                            {editingTitleId === session.id ? (
                                <input
                                    type="text"
                                    value={editingTitleValue}
                                    onChange={(e) => setEditingTitleValue(e.target.value)}
                                    onBlur={() => handleRenameSave(session.id)}
                                    onKeyDown={(e) => handleRenameKeyDown(e, session.id)}
                                    className="w-full bg-brand-surface-2 border border-brand-blue rounded-lg text-sm px-2 py-2 focus:outline-none"
                                    autoFocus
                                />
                            ) : (
                                <>
                                    <button 
                                        onClick={() => handleSelectChat(session.id)}
                                        className={`w-full flex items-center gap-3 text-left p-2 rounded-lg text-sm transition-colors ${
                                            activeChatId === session.id ? 'bg-brand-surface-2 text-brand-text-primary font-semibold' : 'text-brand-text-secondary hover:bg-brand-surface-2/50 hover:text-brand-text-primary'
                                        }`}
                                    >
                                        <ChatBubbleLeftIcon className="w-5 h-5 flex-shrink-0" />
                                        <span className="truncate flex-1">{session.title}</span>
                                    </button>
                                     <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center bg-brand-surface-2/50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleRenameStart(session.id, session.title)}
                                            className="p-1 text-brand-text-secondary hover:text-brand-text-primary"
                                            title="Rename chat"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteRequest(session.id)} 
                                            className="p-1 text-brand-text-secondary hover:text-red-400"
                                            title="Delete chat"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col h-full">
                <div className="relative p-8 flex flex-col h-full">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,_rgba(93,120,255,0.1),_transparent_40%)]"></div>

                    <div ref={chatContainerRef} className="flex-grow overflow-y-auto mb-4 pr-2 -mr-2 space-y-6 smooth-scroll">
                        {!activeChat ? (
                            <div className="h-full flex flex-col justify-center items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-brand-surface-2 border border-brand-border flex items-center justify-center mb-4">
                                    <AIIcon className="w-8 h-8 text-brand-blue" />
                                </div>
                                <h2 className="text-2xl font-bold text-brand-text-primary mb-2">How can I help you today?</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 w-full max-w-2xl">
                                    {ALL_SUGGESTED_PROMPTS.slice(0, 4).map(prompt => (
                                        <SuggestionCard key={prompt} prompt={prompt} onClick={() => handleSendMessage(prompt)} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            activeChat.messages.map((msg, index) => {
                                const isLastModelMessage = msg.role === 'model' && index === activeChat.messages.length - 1 && !isLoading && !isThinking;
                                return (
                                    <ChatMessage
                                        key={index}
                                        message={msg}
                                        isStreaming={isLoading && !isThinking && index === activeChat.messages.length - 1 && msg.role === 'model'}
                                        isLastModelMessage={isLastModelMessage}
                                        onCopy={() => handleCopy(msg.content)}
                                    />
                                );
                            })
                        )}
                        {isThinking && <ThinkingBubble />}
                    </div>
                    
                    <div className="mt-auto flex-shrink-0 pt-4 border-t border-brand-border/50">
                        {isLoading && !isThinking && (
                            <div className="flex justify-center mb-2">
                                <button onClick={handleStopStream} className="flex items-center gap-2 text-sm bg-brand-surface px-4 py-1.5 rounded-lg border border-brand-border text-brand-text-secondary hover:border-red-500/50 hover:text-red-400 transition-colors">
                                    <StopSquareIcon className="w-4 h-4" />
                                    Stop generating
                                </button>
                            </div>
                        )}

                        {error && !isLoading && <p className="text-red-400 text-sm mb-2 text-center">{error}</p>}
                        
                        <form onSubmit={handleSubmit} className="relative">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Ask about your finances, draft an email, get tips..."
                                className="w-full bg-brand-surface border border-brand-border rounded-xl py-4 pl-5 pr-14 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                disabled={isLoading}
                            />
                            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-brand-blue hover:bg-blue-600 disabled:bg-brand-surface-2 transition-colors" disabled={isLoading || !inputValue.trim()}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${isLoading || !inputValue.trim() ? 'text-brand-text-secondary' : 'text-white'}`}>
                                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={!!deletingChatId}
                onClose={() => setDeletingChatId(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Chat"
                message={`Are you sure you want to delete "${chatToDelete?.title}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default AIPage;