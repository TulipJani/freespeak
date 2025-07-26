import React, { useState, useEffect, useRef } from 'react';

// --- HELPER FUNCTIONS & CONFIGURATION ---

const addGoogleFonts = () => {
    const fontLinkHref = "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Inconsolata:wght@400;700&family=Lato:wght@400;700&family=Palatino:ital,wght@0,400;0,700;1,400&display=swap";
    if (document.querySelector(`link[href="${fontLinkHref}"]`)) return;
    const link = document.createElement('link');
    link.href = fontLinkHref;
    link.rel = "stylesheet";
    document.head.appendChild(link);
};

const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 20, 22, 24, 26, 28, 32];

const FONT_OPTIONS = [
    { name: 'Lato', category: 'Sans', style: { fontFamily: "'Lato', sans-serif" } },
    { name: 'System', category: 'Sans', style: { fontFamily: "system-ui, -apple-system, sans-serif" } },
    { name: 'Serif', category: 'Serif', style: { fontFamily: "Georgia, serif" } },
    { name: 'Inter', category: 'Sans', style: { fontFamily: "'Inter', sans-serif" } },
    { name: 'Lora', category: 'Serif', style: { fontFamily: "'Lora', serif" } },
    { name: 'Inconsolata', category: 'Mono', style: { fontFamily: "'Inconsolata', monospace" } },
    { name: 'Palatino', category: 'Serif', style: { fontFamily: "'Palatino', serif" } },
];

// --- LOCAL STORAGE UTILS ---

function saveTabsToStorage(sessionId, tabs) {
    localStorage.setItem(`freespeech_tabs_${sessionId}`, JSON.stringify(tabs));
}
function loadTabsFromStorage(sessionId) {
    const raw = localStorage.getItem(`freespeech_tabs_${sessionId}`);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

// --- SESSION UTILS ---

function setCookie(name, value, days = 365) {
    const expires = new Date(Date.now() + days*24*60*60*1000).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}
function getCookie(name) {
    const cookies = document.cookie.split(';').map(c => c.trim());
    for (let c of cookies) {
        if (c.startsWith(encodeURIComponent(name) + '=')) {
            return decodeURIComponent(c.substring(name.length + 1));
        }
    }
    return null;
}
function getOrCreateSessionId() {
    let sessionId = getCookie('freespeech_session');
    if (!sessionId) {
        sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
        setCookie('freespeech_session', sessionId, 365);
    }
    return sessionId;
}

// --- UI ICONS ---

const MicrophoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
    </svg>
);
const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    </svg>
);
const PlusIcon = () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-gray-400">
        <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);
const CrossIcon = () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-gray-500 group-hover:text-red-400 transition-colors">
        <path d="M6 6l8 8M6 14L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);
const HistoryIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v4l3 3"/>
        <circle cx="12" cy="12" r="10"/>
    </svg>
);
const ChevronDownIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6,9 12,15 18,9"/>
    </svg>
);

// --- TIMER ---

const Timer = ({ seconds }) => {
    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
        const secs = (timeInSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${secs}`;
    };
    return <span className="text-gray-400 text-base font-mono w-14 text-center">{formatTime(seconds)}</span>;
};

// --- HEADER BAR ---

const HeaderBar = ({ 
    fontSize, 
    onFontSizeChange, 
    fontIndex, 
    onFontChange, 
    isLightMode, 
    onToggleMode, 
    onNewTab, 
    onToggleSidebar,
    showSidebar 
}) => {
    const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
    const [showFontDropdown, setShowFontDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowFontSizeDropdown(false);
                setShowFontDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentFont = FONT_OPTIONS[fontIndex];
    const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50">
            <div className="flex items-center justify-between px-6 py-3">
                {/* Left Section - Font Controls */}
                <div className="flex items-center space-x-4">
                    {/* Font Size Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowFontSizeDropdown(!showFontSizeDropdown)}
                            className="flex items-center space-x-2 px-3 py-1.5 text-gray-300 hover:text-white transition-colors rounded-md hover:bg-gray-700/50"
                        >
                            <span className="text-sm">{fontSize}px</span>
                            <ChevronDownIcon />
                        </button>
                        {showFontSizeDropdown && (
                            <div className="absolute top-full left-0 mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg py-1 min-w-[80px] z-50">
                                {FONT_SIZE_OPTIONS.map(size => (
                                    <button
                                        key={size}
                                        onClick={() => {
                                            onFontSizeChange(size);
                                            setShowFontSizeDropdown(false);
                                        }}
                                        className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-600 transition-colors
                                            ${fontSize === size ? 'text-white bg-gray-600' : 'text-gray-300'}`}
                                    >
                                        {size}px
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Separator */}
                    <div className="w-1 h-1 bg-gray-600 rounded-full"></div>

                    {/* Font Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowFontDropdown(!showFontDropdown)}
                            className="flex items-center space-x-2 px-3 py-1.5 text-gray-300 hover:text-white transition-colors rounded-md hover:bg-gray-700/50"
                        >
                            <span className="text-sm">{currentFont.name}</span>
                            <ChevronDownIcon />
                        </button>
                        {showFontDropdown && (
                            <div className="absolute top-full left-0 mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg py-1 min-w-[140px] z-50 max-h-60 overflow-y-auto">
                                {/* Categories */}
                                {['Sans', 'Serif', 'Mono', 'All'].map(category => (
                                    <div key={category}>
                                        <div className="px-3 py-1 text-xs text-gray-400 font-medium border-b border-gray-600">
                                            {category}
                                        </div>
                                        {FONT_OPTIONS
                                            .filter(font => category === 'All' || font.category === category)
                                            .map(font => (
                                                <button
                                                    key={font.name}
                                                    onClick={() => {
                                                        onFontChange(FONT_OPTIONS.findIndex(f => f.name === font.name));
                                                        setShowFontDropdown(false);
                                                    }}
                                                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-600 transition-colors
                                                        ${fontIndex === FONT_OPTIONS.findIndex(f => f.name === font.name) ? 'text-white bg-gray-600' : 'text-gray-300'}`}
                                                    style={font.style}
                                                >
                                                    {font.name}
                                                </button>
                                            ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Section - Time, Mode, Actions */}
                <div className="flex items-center space-x-4">
                    {/* Current Time */}
                    <span className="text-gray-300 text-sm font-mono">{currentTime}</span>

                    {/* Separator */}
                    <div className="w-1 h-1 bg-gray-600 rounded-full"></div>

                    {/* Light/Dark Mode Toggle */}
                    <button
                        onClick={onToggleMode}
                        className="px-3 py-1.5 text-gray-300 hover:text-white transition-colors rounded-md hover:bg-gray-700/50"
                    >
                        <span className="text-sm">{isLightMode ? 'Dark Mode' : 'Light Mode'}</span>
                    </button>

                    {/* Separator */}
                    <div className="w-1 h-1 bg-gray-600 rounded-full"></div>

                    {/* New Tab Button */}
                    <button
                        onClick={onNewTab}
                        className="px-3 py-1.5 text-gray-300 hover:text-white transition-colors rounded-md hover:bg-gray-700/50"
                    >
                        <span className="text-sm">New Entry</span>
                    </button>

                    {/* History/Sidebar Toggle */}
                    <button
                        onClick={onToggleSidebar}
                        className="p-1.5 text-gray-300 hover:text-white transition-colors rounded-md hover:bg-gray-700/50"
                        title="Show tabs sidebar"
                    >
                        <HistoryIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- SPEECH CONTROL ---

const SpeechControl = ({ onStart, onStop, isListening, isSpeechSupported, elapsedTime }) => (
    <div className="fixed top-20 left-4 z-10 bg-gray-800/50 backdrop-blur-sm p-1 rounded-lg flex items-center space-x-2">
        {!isListening ? (
            <button
                onClick={onStart}
                disabled={!isSpeechSupported}
                title="Start Dictation"
                className="p-2 rounded-md transition-colors duration-200 hover:bg-gray-700/80 disabled:opacity-50"
            >
                <MicrophoneIcon />
            </button>
        ) : (
            <>
                <button
                    onClick={onStop}
                    title="Stop Dictation"
                    className="p-2 rounded-md transition-colors duration-200 hover:bg-gray-700/80"
                >
                    <StopIcon />
                </button>
                <Timer seconds={elapsedTime} />
            </>
        )}
    </div>
);

// --- SIDEBAR TABS ---

function SidebarTabs({
    tabs,
    activeTabId,
    onTabSwitch,
    onTabAdd,
    onTabDelete,
    onTabRename,
    showSidebar,
    onCloseSidebar
}) {
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingId]);

    const getTabName = (content) => {
        if (!content.trim()) return "Untitled";
        const firstLine = content.split('\n')[0].trim();
        return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
    };

    return (
        <div className={`fixed top-0 right-0 h-full w-80 bg-gray-800/95 backdrop-blur-sm border-l border-gray-700/50 transform transition-transform duration-300 z-40
            ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                    <h3 className="text-gray-300 font-medium">Tabs</h3>
                    <button
                        onClick={onCloseSidebar}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                        <CrossIcon />
                    </button>
                </div>

                {/* Tabs List */}
                <div className="flex-1 overflow-y-auto p-2">
                    <div className="space-y-1">
                        {tabs.map((tab) => (
                            <div
                                key={tab.id}
                                className={`group flex items-center justify-between gap-2 rounded-md transition-colors cursor-pointer
                                    ${tab.id === activeTabId
                                        ? "bg-gray-700/80 text-white"
                                        : "hover:bg-gray-700/40 text-gray-300"
                                    }
                                    px-3 py-2`}
                                onClick={() => onTabSwitch(tab.id)}
                                onDoubleClick={e => {
                                    e.stopPropagation();
                                    setEditingId(tab.id);
                                    setEditValue(getTabName(tab.content));
                                }}
                            >
                                {editingId === tab.id ? (
                                    <input
                                        ref={inputRef}
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        onBlur={() => {
                                            setEditingId(null);
                                            if (editValue.trim() && editValue !== getTabName(tab.content)) {
                                                onTabRename(tab.id, editValue.trim());
                                            }
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                setEditingId(null);
                                                if (editValue.trim() && editValue !== getTabName(tab.content)) {
                                                    onTabRename(tab.id, editValue.trim());
                                                }
                                            } else if (e.key === 'Escape') {
                                                setEditingId(null);
                                            }
                                        }}
                                        className="flex-1 bg-transparent border-none outline-none text-white text-sm"
                                        maxLength={50}
                                    />
                                ) : (
                                    <span className="flex-1 truncate text-sm font-medium select-none" title={getTabName(tab.content)}>
                                        {getTabName(tab.content)}
                                    </span>
                                )}
                                {tabs.length > 1 && (
                                    <button
                                        className="opacity-60 hover:opacity-100 rounded transition group-hover:bg-gray-600/40 p-1"
                                        onClick={e => {
                                            e.stopPropagation();
                                            onTabDelete(tab.id);
                                        }}
                                        tabIndex={-1}
                                        title="Delete tab"
                                    >
                                        <CrossIcon />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add New Tab Button */}
                <div className="p-3 border-t border-gray-700/50">
                    <button
                        onClick={onTabAdd}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700/40 transition-colors rounded-md"
                        title="Add new tab"
                    >
                        <PlusIcon />
                        <span className="text-sm font-medium">New Tab</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- MAIN APP ---

export default function App() {
    // Session
    const [sessionId] = useState(() => getOrCreateSessionId());

    // Tabs state
    const [tabs, setTabs] = useState(() => {
        const loaded = loadTabsFromStorage(sessionId);
        if (loaded && Array.isArray(loaded) && loaded.length > 0) return loaded;
        // Default: 1 tab
        return [
            {
                id: Math.random().toString(36).slice(2) + Date.now().toString(36),
                name: "Untitled",
                content: "",
            }
        ];
    });
    const [activeTabId, setActiveTabId] = useState(() => tabs[0]?.id);

    // Font, speech, timer, UI state
    const [fontIndex, setFontIndex] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [fontSize, setFontSize] = useState(18); // Default font size
    const [isLightMode, setIsLightMode] = useState(false); // Light mode state
    const [showSidebar, setShowSidebar] = useState(false);

    // Refs
    const recognitionRef = useRef(null);
    const textAreaRef = useRef(null);
    const stableTextOnStartRef = useRef('');
    const timerIntervalRef = useRef(null);

    // Speech support
    const isSpeechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    // --- Speech Recognition Setup ---
    useEffect(() => {
        if (!isSpeechSupported) return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => console.error("Speech recognition error:", event.error);
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            setTabs(prevTabs => prevTabs.map(tab =>
                tab.id === activeTabId
                    ? { ...tab, content: stableTextOnStartRef.current + transcript }
                    : tab
            ));
        };
        recognitionRef.current = recognition;
    }, [isSpeechSupported, activeTabId]);

    // --- Timer ---
    useEffect(() => {
        if (isListening) {
            timerIntervalRef.current = setInterval(() => {
                setElapsedTime(prevTime => prevTime + 1);
            }, 1000);
        } else {
            clearInterval(timerIntervalRef.current);
            setElapsedTime(0);
        }
        return () => clearInterval(timerIntervalRef.current);
    }, [isListening]);

    // --- Auto-resize textarea ---
    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [activeTabId, tabs]);

    // --- Load fonts on mount ---
    useEffect(() => {
        addGoogleFonts();
    }, []);

    // --- Save tabs to localStorage whenever they change (debounced) ---
    useEffect(() => {
        const timeout = setTimeout(() => {
            saveTabsToStorage(sessionId, tabs);
        }, 300);
        return () => clearTimeout(timeout);
    }, [tabs, sessionId]);

    // --- Handlers ---

    const handleStartListening = () => {
        if (isListening || !recognitionRef.current) return;
        const currentTab = tabs.find(tab => tab.id === activeTabId);
        stableTextOnStartRef.current = currentTab && currentTab.content ? currentTab.content.trim() + ' ' : '';
        recognitionRef.current.start();
    };
    const handleStopListening = () => {
        if (!isListening || !recognitionRef.current) return;
        recognitionRef.current.stop();
    };
    const handleFontChange = (newIndex) => {
        setFontIndex(newIndex);
    };
    const handleFontSizeChange = (size) => setFontSize(size);
    const toggleLightMode = () => setIsLightMode(prev => !prev);
    const toggleSidebar = () => setShowSidebar(prev => !prev);

    // Tab logic
    const handleTabSwitch = (id) => setActiveTabId(id);
    const handleTabAdd = () => {
        const newTab = {
            id: Math.random().toString(36).slice(2) + Date.now().toString(36),
            name: "Untitled",
            content: "",
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
    };
    const handleTabDelete = (id) => {
        if (tabs.length === 1) return;
        let idx = tabs.findIndex(tab => tab.id === id);
        let newTabs = tabs.filter(tab => tab.id !== id);
        // Switch to previous tab if possible, else next
        let newActive = newTabs[Math.max(0, idx - 1)]?.id || newTabs[0].id;
        setTabs(newTabs);
        setActiveTabId(newActive);
    };
    const handleTabRename = (id, newName) => {
        setTabs(prev => prev.map(tab => tab.id === id ? { ...tab, name: newName } : tab));
    };
    const handleTabContentChange = (val) => {
        setTabs(prev => prev.map(tab =>
            tab.id === activeTabId ? { ...tab, content: val } : tab
        ));
    };

    // --- UI ---

    const currentFont = FONT_OPTIONS[fontIndex];
    const currentTab = tabs.find(tab => tab.id === activeTabId);
    const placeholderText = "Just write, or click the microphone to dictate...";
    
    // Colors based on light/dark mode
    const bgColor = isLightMode ? '#f8f8f8' : '#2a2a2a'; // Off-white / Dark gray
    const textColor = isLightMode ? '#2a2a2a' : '#f0f0f0'; // Dark gray / Off-white

    return (
        <main
            className="min-h-screen flex flex-col"
            style={{ 
                backgroundColor: bgColor, 
                color: textColor, 
                fontSize: `${fontSize}px`, 
                fontFamily: currentFont.style.fontFamily 
            }}
        >
            {/* Header Bar */}
            <HeaderBar
                fontSize={fontSize}
                onFontSizeChange={handleFontSizeChange}
                fontIndex={fontIndex}
                onFontChange={handleFontChange}
                isLightMode={isLightMode}
                onToggleMode={toggleLightMode}
                onNewTab={handleTabAdd}
                onToggleSidebar={toggleSidebar}
                showSidebar={showSidebar}
            />

            {/* Speech Control */}
            <SpeechControl
                onStart={handleStartListening}
                onStop={handleStopListening}
                isListening={isListening}
                isSpeechSupported={isSpeechSupported}
                elapsedTime={elapsedTime}
            />

            {/* Main content area */}
            <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-8 py-10 sm:py-16 mt-16">
                <div className="w-full max-w-4xl">
                    <textarea
                        ref={textAreaRef}
                        value={currentTab?.content || ""}
                        onChange={e => handleTabContentChange(e.target.value)}
                        placeholder={placeholderText}
                        className="w-full h-auto min-h-[60vh] sm:min-h-[80vh] p-0 bg-transparent text-lg leading-relaxed resize-none border-none focus:outline-none focus:ring-0 transition"
                        style={{ color: textColor }}
                        spellCheck={true}
                        autoCorrect="on"
                    />
                </div>
            </div>

            {/* Sidebar Tabs */}
            <SidebarTabs
                tabs={tabs}
                activeTabId={activeTabId}
                onTabSwitch={handleTabSwitch}
                onTabAdd={handleTabAdd}
                onTabDelete={handleTabDelete}
                onTabRename={handleTabRename}
                showSidebar={showSidebar}
                onCloseSidebar={() => setShowSidebar(false)}
            />

            {/* Overlay for sidebar */}
            {showSidebar && (
                <div 
                    className="fixed inset-0 bg-black/20 z-30 sm:hidden"
                    onClick={() => setShowSidebar(false)}
                />
            )}
        </main>
    );
}