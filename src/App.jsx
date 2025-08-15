import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';

// --- CONFIGURATION & HELPERS ---

const FONT_OPTIONS = [
    { name: 'System', style: { fontFamily: "system-ui, -apple-system, sans-serif" } },
    { name: 'Inter', style: { fontFamily: "'Inter', sans-serif" } },
    { name: 'Lora', style: { fontFamily: "'Lora', serif" } },
    { name: 'Inconsolata', style: { fontFamily: "'Inconsolata', monospace" } },
];

const FONT_SIZES = [14, 16, 18, 20, 22, 24, 28, 32];

const addGoogleFonts = () => {
    const fontLinkHref = "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Inconsolata:wght@400;700&display=swap";
    if (document.querySelector(`link[href="${fontLinkHref}"]`)) return;
    const link = document.createElement('link');
    link.href = fontLinkHref;
    link.rel = "stylesheet";
    document.head.appendChild(link);
};

// --- LOCAL STORAGE & SESSION UTILS ---

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
function setCookie(name, value, days = 365) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
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

// --- ICONS ---

const MicrophoneIcon = ({ theme }) => (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={theme.icon}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>);
const StopIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><rect x="3" y="3" width="18" height="18" rx="0" ry="0"></rect></svg>);
const CrossIcon = ({ className }) => (<svg width="16" height="16" viewBox="0 0 20 20" fill="none" className={className}><path d="M6 6l8 8M6 14L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>);
const HistoryIcon = ({ theme }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={theme.icon}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
    </svg>
);
const SunIcon = ({ theme }) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={theme.icon}><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>);
const MoonIcon = ({ theme }) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={theme.icon}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>);
const LinkIcon = ({ className }) => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className={className}><path d="M7.5 12.5l5-5m-2.5-2.5h4a2 2 0 0 1 2 2v4m-2.5 2.5l-5-5m-2.5 2.5v4a2 2 0 0 0 2 2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
);

// --- THEME DEFINITION ---
const themes = {
    light: {
        bg: 'bg-[#FFFFFF]',
        text: 'text-[#1F1F1F]',
        placeholder: 'placeholder-gray-400',
        icon: 'text-gray-600',
        controlBg: 'bg-white/80',
        controlHover: 'hover:bg-black/5',
        sidebarBg: 'bg-gray-100/80',
        sidebarBorder: 'border-gray-300',
        sidebarText: 'text-gray-800',
        sidebarActive: 'bg-gray-200 text-black',
        sidebarHover: 'hover:bg-gray-200',
        newEntry: 'text-gray-600 hover:bg-gray-200',
    },
    dark: {
        bg: 'bg-[#121212]',
        text: 'text-[#E0E0E0]',
        placeholder: 'placeholder-gray-600',
        icon: 'text-gray-400',
        controlBg: 'bg-black/50',
        controlHover: 'hover:bg-white/10',
        sidebarBg: 'bg-gray-900/80',
        sidebarBorder: 'border-gray-700',
        sidebarText: 'text-gray-300',
        sidebarActive: 'bg-gray-700 text-white',
        sidebarHover: 'hover:bg-gray-700/50',
        newEntry: 'text-gray-400 hover:bg-gray-700',
    }
};

// --- UI COMPONENTS ---

const Timer = ({ seconds }) => {
    const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
    return <span className="text-base font-mono w-14 text-center text-red-500">{formatTime(seconds)}</span>;
};

const SpeechControl = ({ onStart, onStop, isListening, isSpeechSupported, elapsedTime, theme }) => (
    <div className={`absolute top-4 left-4 z-20 ${theme.controlBg} backdrop-blur-sm p-1 flex items-center space-x-2`}>
        {!isListening ? (
            <button onClick={onStart} disabled={!isSpeechSupported} title="Start Dictation" className={`p-2 transition-colors duration-200 ${theme.controlHover} disabled:opacity-50`}><MicrophoneIcon theme={theme} /></button>
        ) : (
            <>
                <button onClick={onStop} title="Stop Dictation" className={`p-2 transition-colors duration-200 ${theme.controlHover}`}><StopIcon /></button>
                <Timer seconds={elapsedTime} />
            </>
        )}
    </div>
);

const TopRightControls = ({ onFontChange, currentFontName, onToggleMode, isLightMode, onToggleSidebar, onZoomIn, onZoomOut, theme, onShare }) => (
    <div className="absolute top-4 right-4 z-20 flex items-center space-x-1">
        <div className={`flex items-center ${theme.controlBg} backdrop-blur-sm`}>
            <button onClick={onZoomOut} className={`p-2 ${theme.controlHover} transition-colors`} title="Decrease font size">-</button>
            <div className={`w-px h-5 ${isLightMode ? 'bg-gray-300' : 'bg-gray-700'}`}></div>
            <button onClick={onZoomIn} className={`p-2 ${theme.controlHover} transition-colors`} title="Increase font size">+</button>
        </div>
        <button onClick={onFontChange} className={`${theme.controlBg} backdrop-blur-sm px-4 py-2 text-sm ${theme.controlHover} transition-colors`}>
            Font: <span className={`font-semibold ${isLightMode ? 'text-black' : 'text-white'}`}>{currentFontName}</span>
        </button>
        <button onClick={onShare} className={`${theme.controlBg} backdrop-blur-sm p-2 ${theme.controlHover} transition-colors`} title="Share current entry">
            <LinkIcon className="text-blue-500" />
        </button>
        <button onClick={onToggleMode} className={`${theme.controlBg} backdrop-blur-sm p-2 ${theme.controlHover} transition-colors`}>
            {isLightMode ? <MoonIcon theme={theme} /> : <SunIcon theme={theme} />}
        </button>
        <button onClick={onToggleSidebar} className={`${theme.controlBg} backdrop-blur-sm p-2 ${theme.controlHover} transition-colors`}>
            <HistoryIcon theme={theme} />
        </button>
    </div>
);

const SidebarTabs = ({ tabs, activeTabId, onTabSwitch, onTabAdd, onTabDelete, showSidebar, onCloseSidebar, theme }) => {
    const getTabName = (content) => {
        if (!content?.trim()) return "Untitled Entry";
        const firstLine = content.split('\n')[0].trim();
        return firstLine.length > 40 ? firstLine.substring(0, 40) + '...' : firstLine;
    };
    return (
        <>
            <div className={`fixed top-0 right-0 h-full w-80 ${theme.sidebarBg} backdrop-blur-lg border-l ${theme.sidebarBorder} transform transition-transform duration-300 z-40 ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className={`flex items-center justify-between p-4 border-b ${theme.sidebarBorder}`}>
                        <h3 className="font-semibold text-lg">Entries</h3>
                        <button onClick={onCloseSidebar} className={`p-1 ${theme.controlHover}`}><CrossIcon className="text-gray-500" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        <div className="space-y-1">
                            {tabs.map((tab) => (
                                <div key={tab.id} className={`group flex items-center justify-between gap-2 transition-colors cursor-pointer px-3 py-2 ${tab.id === activeTabId ? theme.sidebarActive : `${theme.sidebarText} ${theme.sidebarHover}`}`} onClick={() => onTabSwitch(tab.id)}>
                                    <span className="flex-1 truncate text-sm font-medium select-none">{getTabName(tab.content)}</span>
                                    {tabs.length > 1 && (<button className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition p-1" onClick={e => { e.stopPropagation(); onTabDelete(tab.id); }} title="Delete entry"><CrossIcon className="text-gray-500 group-hover:text-red-500" /></button>)}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={`p-3 border-t ${theme.sidebarBorder}`}>
                        <button onClick={onTabAdd} className={`w-full text-sm font-semibold py-2 transition-colors ${theme.newEntry}`}>New Entry</button>
                    </div>
                </div>
            </div>
            {showSidebar && <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={onCloseSidebar} />}
        </>
    );
}

// Utility to encode share data
function encodeShareData({ content, fontName, theme }) {
    const obj = { c: content, f: fontName, t: theme };
    let json = JSON.stringify(obj);
    let b64 = btoa(unescape(encodeURIComponent(json)));
    // URL-safe base64
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function getShareUrl({ content, fontName, theme }) {
    const data = encodeShareData({ content, fontName, theme });
    return `${window.location.origin}/#/s/${data}`;
}

const ShareModal = ({ open, onClose, tab, fontName, themeName }) => {
    const [copied, setCopied] = useState(false);
    const ref = useRef();
    // Always call hooks first
    let url = '';
    if (tab) {
        url = getShareUrl({ content: tab.content, fontName, theme: themeName });
    }
    useEffect(() => {
        function onKey(e) { if (e.key === 'Escape') onClose(); }
        if (open) document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open || !tab) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white dark:bg-[#232323] rounded-xl shadow-xl p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-semibold mb-2">Share Entry</h2>
                            <input
                    ref={ref}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-[#181818] text-sm mb-2 text-gray-800 dark:text-gray-100 select-all"
                    value={url}
                    readOnly
                    onFocus={e => e.target.select()}
                />
                <div className="flex items-center gap-2 mb-2">
                    <button
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
                    >{copied ? 'Copied!' : 'Copy Link'}</button>
                            <button
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                        onClick={onClose}
                    >Close</button>
                    </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Note: Sharing is suitable for most entries, but extremely long documents may exceed URL length limits.</div>
            </div>
        </div>
    );
};

function decodeShareData(dataString) {
    try {
        let b64 = dataString.replace(/-/g, '+').replace(/_/g, '/');
        // Pad base64 if needed
        while (b64.length % 4) b64 += '=';
        const json = decodeURIComponent(escape(atob(b64)));
        const obj = JSON.parse(json);
        if (!obj.c) throw new Error('No content');
        return obj;
    } catch (e) {
        return { error: 'Invalid or corrupted share link.' };
    }
}

const ShareView = () => {
    const { dataString } = useParams();
    const [data, setData] = useState(null);
    useEffect(() => {
        if (dataString) setData(decodeShareData(dataString));
    }, [dataString]);
    if (!dataString) return <div className="min-h-screen flex items-center justify-center text-center text-red-500">Invalid share link.</div>;
    if (!data) return <div className="min-h-screen flex items-center justify-center text-center">Loading...</div>;
    if (data.error) return <div className="min-h-screen flex items-center justify-center text-center text-red-500">{data.error}</div>;
    const font = FONT_OPTIONS.find(f => f.name === data.f) || FONT_OPTIONS[0];
    const theme = (data.t === 'dark') ? themes.dark : themes.light;
    return (
        <div className={`min-h-screen w-full flex flex-col items-center justify-center px-4 ${theme.bg} ${theme.text}`} style={{ ...font.style }}>
            <div className="w-full max-w-3xl mt-16 mb-8">
                <div className="text-xs mb-2 text-gray-400 text-center">Read-only shared entry</div>
                <div className="whitespace-pre-wrap leading-relaxed text-lg p-4 rounded bg-white/60 dark:bg-black/30 shadow" style={{ fontFamily: font.style.fontFamily }}>{data.c}</div>
            </div>
        </div>
    );
};

// --- MAIN APP ---

export default function App() {
    const [sessionId] = useState(getOrCreateSessionId);
    const [tabs, setTabs] = useState(() => {
        const loaded = loadTabsFromStorage(sessionId);
        return (loaded && Array.isArray(loaded) && loaded.length > 0) ? loaded : [{ id: `tab_${Date.now()}`, content: "" }];
    });
    const [activeTabId, setActiveTabId] = useState(tabs[0]?.id);
    const [fontIndex, setFontIndex] = useState(0);
    const [fontSizeIndex, setFontSizeIndex] = useState(2); // Default to 18px
    const [isListening, setIsListening] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isLightMode, setIsLightMode] = useState(true);
    const [showSidebar, setShowSidebar] = useState(false);
    const [shareModal, setShareModal] = useState({ open: false, tab: null });

    const recognitionRef = useRef(null);
    const textAreaRef = useRef(null);
    const stableTextOnStartRef = useRef('');
    const timerIntervalRef = useRef(null);

    const isSpeechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    useEffect(() => {
        if (!isSpeechSupported) return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        const handleEnd = () => setIsListening(false);
        recognition.onstart = () => setIsListening(true);
        recognition.onend = handleEnd;
        recognition.onerror = (e) => {
            console.error("Speech recognition error:", e.error);
            handleEnd();
        };
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results).map(r => r[0]).map(r => r.transcript).join('');
            setTabs(prevTabs => prevTabs.map(tab =>
                tab.id === activeTabId ? { ...tab, content: stableTextOnStartRef.current + transcript } : tab
            ));
        };
        recognitionRef.current = recognition;
        
        return () => {
            recognition.removeEventListener('end', handleEnd);
        };
    }, [isSpeechSupported, activeTabId]);

    useEffect(() => {
        if (isListening) {
            timerIntervalRef.current = setInterval(() => setElapsedTime(t => t + 1), 1000);
        } else {
            clearInterval(timerIntervalRef.current);
            setElapsedTime(0);
        }
        return () => clearInterval(timerIntervalRef.current);
    }, [isListening]);

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [tabs, activeTabId, fontSizeIndex]);

    useEffect(() => { addGoogleFonts(); }, []);

    useEffect(() => {
        const timeout = setTimeout(() => saveTabsToStorage(sessionId, tabs), 300);
        return () => clearTimeout(timeout);
    }, [tabs, sessionId]);

    const handleStartListening = () => {
        if (isListening || !recognitionRef.current) return;
        const currentTab = tabs.find(tab => tab.id === activeTabId);
        stableTextOnStartRef.current = currentTab?.content ? currentTab.content.trim() + ' ' : '';
        recognitionRef.current.start();
    };
    
    const handleStopListening = () => {
        if (!isListening || !recognitionRef.current) return;
        recognitionRef.current.stop();
    };
    
    const handleFontChange = () => setFontIndex(prev => (prev + 1) % FONT_OPTIONS.length);
    const handleZoomIn = () => setFontSizeIndex(prev => Math.min(prev + 1, FONT_SIZES.length - 1));
    const handleZoomOut = () => setFontSizeIndex(prev => Math.max(prev - 1, 0));

    const handleTabContentChange = (val) => {
        setTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, content: val } : tab));
    };
    const handleTabAdd = () => {
        const newTab = { id: `tab_${Date.now()}`, content: "" };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
        setShowSidebar(true);
    };
    const handleTabDelete = (id) => {
        if (tabs.length === 1) return;
        const idx = tabs.findIndex(tab => tab.id === id);
        const newTabs = tabs.filter(tab => tab.id !== id);
        let newActiveId = activeTabId;
        if (id === activeTabId) {
             newActiveId = newTabs[Math.max(0, idx - 1)]?.id || newTabs[0]?.id;
        }
        setTabs(newTabs);
        setActiveTabId(newActiveId);
    };

    const currentFont = FONT_OPTIONS[fontIndex];
    const currentFontSize = FONT_SIZES[fontSizeIndex];
    const currentTab = tabs.find(tab => tab.id === activeTabId);
    const theme = isLightMode ? themes.light : themes.dark;

    return (
        <Routes>
            <Route path="/s/:dataString" element={<ShareView />} />
            <Route path="*" element={
                <main style={{ ...currentFont.style, fontSize: `${currentFontSize}px` }} className={`${theme.bg} ${theme.text} transition-colors duration-300`}>
                    <TopRightControls onFontChange={handleFontChange} currentFontName={currentFont.name} onToggleMode={() => setIsLightMode(p => !p)} isLightMode={isLightMode} onToggleSidebar={() => setShowSidebar(p => !p)} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} theme={theme} onShare={() => setShareModal({ open: true, tab: currentTab })} />
                    <SpeechControl onStart={handleStartListening} onStop={handleStopListening} isListening={isListening} isSpeechSupported={isSpeechSupported} elapsedTime={elapsedTime} theme={theme} />
                    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-8 pt-24 pb-16">
                <div className="w-full max-w-3xl">
                    <textarea
                        ref={textAreaRef}
                        value={currentTab?.content || ""}
                        onChange={e => handleTabContentChange(e.target.value)}
                                placeholder="Just write..."
                                className={`w-full h-auto min-h-[75vh] p-0 bg-transparent leading-relaxed resize-none border-none focus:outline-none focus:ring-0 ${theme.placeholder}`}
                    />
                </div>
            </div>
                    <SidebarTabs tabs={tabs} activeTabId={activeTabId} onTabSwitch={setActiveTabId} onTabAdd={handleTabAdd} onTabDelete={handleTabDelete} showSidebar={showSidebar} onCloseSidebar={() => setShowSidebar(false)} theme={theme} />
                    <ShareModal open={shareModal.open} onClose={() => setShareModal({ open: false, tab: null })} tab={shareModal.tab} fontName={currentFont.name} themeName={isLightMode ? 'light' : 'dark'} />
        </main>
            } />
        </Routes>
    );
}