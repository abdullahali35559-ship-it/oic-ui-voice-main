import React, { useState, useRef, useEffect } from 'react';
import { generateAIResponse } from '../services/ComplianceAIService';

const truncateTitle = (text, max = 28) => {
    const cleaned = text.trim();
    return cleaned.length > max ? `${cleaned.slice(0, max)}...` : cleaned;
};

export const AskCompliancePage = () => {
    const initialDummyChats = [
        { id: 101, title: "Affiliated Institution Status", date: "2 hours ago", messages: 8 },
        { id: 102, title: "Council of Foreign Ministers", date: "Yesterday", messages: 8 },
        { id: 103, title: "Committee of Permanent Representatives", date: "2 days ago", messages: 8 }
    ];

    const initialDummyMessages = {
        101: [
            { role: "user", content: "Who can apply for OIC Affiliated Institution Status?" },
            { role: "assistant", content: "An institution can apply if it is officially submitted by a Host Member State, has legal personality, operates in one or more OIC Member States, has its headquarters in a Member State where it operates, and its objectives are compatible with the OIC Charter. (Source Articles: 4, 5)" },
            { role: "user", content: "Which documents must be submitted with the application?" },
            { role: "assistant", content: "The application must include the official application form, institution statute, officials' CVs, Host State endorsement, and activity and financial records for the previous three years. A headquarters agreement is required only when applicable." },
            { role: "user", content: "Who approves Affiliated Institution Status?" },
            { role: "assistant", content: "The Council of Foreign Ministers approves the status through a Council Resolution based on consensus." },
            { role: "user", content: "Can an affiliated institution use the OIC logo?" },
            { role: "assistant", content: "Yes, but only after receiving written approval from the Secretary General. Official OIC Affiliated Institution wording must be used." }
        ],
        102: [
            { role: "user", content: "How often is the Council of Foreign Ministers held?" },
            { role: "assistant", content: "The Council normally holds one regular session every year, usually between April and June." },
            { role: "user", content: "Can extraordinary meetings be organized?" },
            { role: "assistant", content: "Yes. Extraordinary meetings may be requested by a Member State or by the Secretary General. They require approval by a simple majority and notice is normally sent one week before the meeting." },
            { role: "user", content: "What is the quorum for a Council meeting?" },
            { role: "assistant", content: "A quorum requires the presence of two-thirds of the Member States." },
            { role: "user", content: "A resolution failed to achieve consensus. What happens next?" },
            { role: "assistant", content: "If consensus cannot be reached, the resolution may still be adopted by a two-thirds majority. Procedural matters require only a simple majority." }
        ],
        103: [
            { role: "user", content: "What is the Committee of Permanent Representatives?" },
            { role: "assistant", content: "The Committee of Permanent Representatives (CPR) is a permanent organ of the Organization of Islamic Cooperation established under Article 5 of the OIC Charter. It consists of the Permanent Representatives of all OIC Member States." },
            { role: "user", content: "What is the main purpose of the Committee?" },
            { role: "assistant", content: "The Committee coordinates among Member States and OIC organs, assists in monitoring implementation of Council decisions, provides expert advice when requested, and submits recommendations to the Council of Foreign Ministers." },
            { role: "user", content: "Can the Committee establish working groups?" },
            { role: "assistant", content: "The Committee may recommend the creation of temporary (ad hoc) working groups whenever necessary. The mandate, duration, and responsibilities must be clearly defined." },
            { role: "user", content: "Who receives the Committee's reports?" },
            { role: "assistant", content: "The Committee submits its reports and recommendations to the Council of Foreign Ministers for consideration and appropriate action." }
        ]
    };

    const [chatHistory, setChatHistory] = useState(() => {
        const saved = localStorage.getItem('oic_chatHistory');
        return saved ? JSON.parse(saved) : initialDummyChats;
    });

    const [chatMessagesById, setChatMessagesById] = useState(() => {
        const saved = localStorage.getItem('oic_chatMessagesById');
        return saved ? JSON.parse(saved) : initialDummyMessages;
    });

    useEffect(() => {
        localStorage.setItem('oic_chatHistory', JSON.stringify(chatHistory));
    }, [chatHistory]);

    useEffect(() => {
        localStorage.setItem('oic_chatMessagesById', JSON.stringify(chatMessagesById));
    }, [chatMessagesById]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showChatMobile, setShowChatMobile] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const suggestions = [
        "Where can I find our policy on diplomatic protocol and official communications?",
        "Summarise our document retention and records management requirements.",
        "Draft a standard operating procedure for preparing Ministerial Council meetings.",
        "What approvals are required before issuing an official OIC policy or guideline?"
    ];

    const getReply = (query) => {
        return generateAIResponse(query);
    };

    const handleSend = (textToSend = inputValue) => {
        const query = textToSend.trim();
        if (!query) return;

        setShowChatMobile(true);

        const userMsg = { role: "user", content: query };
        const nextMessages = [...messages, userMsg];
        setMessages(nextMessages);
        setInputValue("");
        setIsTyping(true);

        let chatId = activeChat;
        if (!chatId) {
            chatId = Date.now();
            const newChat = {
                id: chatId,
                title: truncateTitle(query),
                date: "Just now",
                messages: 1
            };
            setActiveChat(chatId);
            setChatHistory(prev => [newChat, ...prev]);
            setChatMessagesById(prev => ({ ...prev, [chatId]: nextMessages }));
        } else {
            setChatHistory(prev => prev.map(chat =>
                chat.id === chatId
                    ? { ...chat, messages: nextMessages.length, date: "Just now" }
                    : chat
            ));
            setChatMessagesById(prev => ({ ...prev, [chatId]: nextMessages }));
        }

        setTimeout(() => {
            const reply = getReply(query);
            const withAssistant = [...nextMessages, { role: "assistant", content: reply }];
            setMessages(withAssistant);
            setChatMessagesById(prev => ({ ...prev, [chatId]: withAssistant }));
            setChatHistory(prev => prev.map(chat =>
                chat.id === chatId
                    ? { ...chat, messages: withAssistant.length, date: "Just now" }
                    : chat
            ));
            setIsTyping(false);
        }, 900);
    };

    const handleSelectChat = (chat) => {
        setActiveChat(chat.id);
        setShowChatMobile(true);
        setMessages(chatMessagesById[chat.id] || []);
    };

    const handleNewChat = () => {
        setActiveChat(null);
        setMessages([]);
        setInputValue("");
        setShowChatMobile(true);
    };

    const handleDeleteChat = (e, chatId) => {
        e.stopPropagation();
        setChatHistory(prev => prev.filter(c => c.id !== chatId));
        setChatMessagesById(prev => {
            const next = { ...prev };
            delete next[chatId];
            return next;
        });
        if (activeChat === chatId) {
            setActiveChat(null);
            setMessages([]);
        }
    };

    const handleClearAllChats = () => {
        setChatHistory([]);
        setChatMessagesById({});
        setActiveChat(null);
        setMessages([]);
    };

    const handleSuggestionClick = (s) => {
        handleSend(s);
    };

    return (
        <div className="flex h-[calc(100vh-64px)] bg-gray-50/10 rounded-2xl overflow-hidden border border-white/20">
            {/* Sidebar history */}
            <div className={`w-full md:w-80 ${showChatMobile ? 'hidden md:flex' : 'flex'} flex-col border-r border-white/25 flex-shrink-0`}>
                <div className="p-4 border-b border-white/25">
                    <button 
                        onClick={handleNewChat}
                        id="new-chat-button"
                        name="new-chat"
                        aria-label="New chat"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a4731] text-white rounded-lg text-sm font-medium hover:bg-[#153d28] transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        New chat
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-3 px-2">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Recent Chats
                                </h3>
                                {chatHistory.length > 0 && (
                                    <button 
                                        onClick={handleClearAllChats}
                                        className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            <div className="space-y-1">
                                {chatHistory.length === 0 ? (
                                    <p className="text-sm text-gray-500 px-2 italic">No recent chats yet.</p>
                                ) : (
                                    chatHistory.map((chat) => (
                                        <div
                                            key={chat.id}
                                            onClick={() => handleSelectChat(chat)}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between group cursor-pointer ${
                                                activeChat === chat.id
                                                    ? 'bg-[#1a4731] text-white shadow-md'
                                                    : 'text-gray-700 hover:bg-white/60'
                                            }`}
                                        >
                                            <div className="flex flex-col truncate pr-2">
                                                <span className="font-medium truncate">{chat.title}</span>
                                                <span className={`text-[10px] mt-0.5 ${activeChat === chat.id ? 'text-emerald-100' : 'text-gray-400'}`}>
                                                    {chat.date} • {chat.messages} msgs
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteChat(e, chat.id)}
                                                className={`p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                                                    activeChat === chat.id 
                                                        ? 'text-white hover:bg-white/20' 
                                                        : 'text-gray-400 hover:bg-gray-200 hover:text-red-500'
                                                }`}
                                                title="Delete Chat"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                <div className="p-3 border-t border-white/25 text-xs text-gray-700">Signed in as admin@oic.org</div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 ${showChatMobile ? 'flex' : 'hidden md:flex'} flex-col bg-white/20`}>
                {showChatMobile && (
                    <div className="md:hidden p-3 border-b border-white/20 bg-white/20 flex items-center">
                        <button 
                            onClick={() => setShowChatMobile(false)}
                            className="flex items-center gap-1.5 text-[#1a4731] font-semibold text-xs"
                        >
                            ← Back to Chats
                        </button>
                    </div>
                )}
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-[#1a4731]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Compliance Assistant</h2>
                        <p className="text-sm text-gray-700 text-center max-w-md mb-8">Ask a compliance question, or ask me to draft a document. Answers are grounded in OIC's approved knowledge base.</p>
                        <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                            {suggestions.map((s, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => handleSuggestionClick(s)} 
                                    className="glass-card p-4 text-xs sm:text-sm text-gray-800 text-left hover:shadow-md hover:bg-white/40 transition-all"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === "user" ? "bg-[#1a4731] text-white" : "bg-white border border-gray-250 text-gray-700"}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="max-w-xs px-4 py-3 rounded-2xl text-sm bg-white border border-gray-250 text-gray-700 flex items-center gap-1.5 shadow-sm">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                <div className="p-4 pr-24 glass-bar border-t border-white/20">
                    <div className="relative max-w-3xl mx-auto flex items-center">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Ask a compliance question, or ask me to draft a document..."
                            id="compliance-query"
                            name="compliance-query"
                            aria-label="query"
                            className="w-full pl-4 pr-12 py-3 glass-input rounded-xl text-sm focus:outline-none"
                        />
                        <button 
                            onClick={() => handleSend()} 
                            id="send-query-button"
                            name="send"
                            aria-label="Send"
                            className="absolute right-2 p-2 bg-[#1a4731] rounded-lg text-white hover:bg-[#153d28] transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </div>
                    <p className="text-center text-xs text-gray-700 mt-2">AI-generated content must be reviewed by authorised OIC staff before use.</p>
                </div>
            </div>
        </div>
    );
};
