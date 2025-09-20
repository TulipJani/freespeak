import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getFirestore, doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// --- CONFIGURATION & HELPERS ---
// You will get this from the Firebase Console after setting up your project.

const firebaseConfig = {
    apiKey: "AIzaSyBeaKTVwYG9prB9fKTa_1NdSrM9o6qX9hY",
    authDomain: "freespeak-87f24.firebaseapp.com",
    projectId: "freespeak-87f24",
    storageBucket: "freespeak-87f24.firebasestorage.app",
    messagingSenderId: "741713207667",
    appId: "1:741713207667:web:0ba4deffbfe4447ef2a506",
    measurementId: "G-KJYPCCEN2T"
};


let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase initialization failed. Check your config.", e);
}

// Additional fonts for a better experience.
const FONT_OPTIONS = [
    { name: 'System', style: { fontFamily: "system-ui, -apple-system, sans-serif" } },
    { name: 'Inter', style: { fontFamily: "'Inter', sans-serif" } },
    { name: 'Lora', style: { fontFamily: "'Lora', serif" } },
    { name: 'Roboto Mono', style: { fontFamily: "'Roboto Mono', monospace" } },
    { name: 'Playfair Display', style: { fontFamily: "'Playfair Display', serif" } },
    { name: 'Merriweather', style: { fontFamily: "'Merriweather', serif" } },
    { name: 'Poppins', style: { fontFamily: "'Poppins', sans-serif" } },
];

const FONT_SIZES = [14, 16, 18, 20, 22, 24, 28, 32];

// This helper function dynamically adds Google Fonts to the page.
const addGoogleFonts = () => {
    const fontLinkHref = "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Roboto+Mono:wght@400;700&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Poppins:wght@400;700&display=swap";
    if (document.querySelector(`link[href="${fontLinkHref}"]`)) return;
    const link = document.createElement('link');
    link.href = fontLinkHref;
    link.rel = "stylesheet";
    document.head.appendChild(link);
};

// --- LOCAL STORAGE & SESSION UTILS ---

function saveTabsToStorage(sessionId, tabs) {
    localStorage.setItem(`freespeech_tabs_v3_${sessionId}`, JSON.stringify(tabs));
}
function loadTabsFromStorage(sessionId) {
    const raw = localStorage.getItem(`freespeech_tabs_v3_${sessionId}`);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        return parsed.map(tab => ({
            id: tab.id || `tab_${Date.now()}`,
            content: tab.content || "",
            publishedId: tab.publishedId || null,
        }));
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
const ZenModeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v18M16 3v18M3 8h18M3 16h18" /></svg>;
const NewNoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6M12 18v-6M9 15h6"></path></svg>;
const CrossIcon = ({ className }) => (<svg width="16" height="16" viewBox="0 0 20 20" fill="none" className={className}><path d="M6 6l8 8M6 14L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>);
const HistoryIcon = ({ theme }) => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={theme.icon}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>);
const SunIcon = ({ theme }) => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={theme.icon}><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>);
const MoonIcon = ({ theme }) => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={theme.icon}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>);
const PublishIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
const FontIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"></path><path d="M6 15h12M12 3v14"></path></svg>;
const ZoomInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>;
const ZoomOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>;
const MicrophoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>;

// --- THEME DEFINITION ---
const themes = {
    light: {
        bg: 'bg-[#F9F9F9]', text: 'text-[#1F1F1F]', placeholder: 'placeholder-gray-400',
        icon: 'text-gray-600', controlBg: 'bg-white/80', controlHover: 'hover:bg-black/5',
        sidebarBg: 'bg-gray-100/80', sidebarBorder: 'border-gray-300', sidebarText: 'text-gray-800',
        sidebarActive: 'bg-gray-200 text-black', sidebarHover: 'hover:bg-gray-200',
        newEntry: 'text-gray-600 hover:bg-gray-200',
        topbarBorder: 'border-gray-200',
    },
    dark: {
        bg: 'bg-[#121212]', text: 'text-[#E0E0E0]', placeholder: 'placeholder-gray-600',
        icon: 'text-gray-400', controlBg: 'bg-black/50', controlHover: 'hover:bg-white/10',
        sidebarBg: 'bg-gray-900/80', sidebarBorder: 'border-gray-700', sidebarText: 'text-gray-300',
        sidebarActive: 'bg-gray-700 text-white', sidebarHover: 'hover:bg-gray-700/50',
        newEntry: 'text-gray-400 hover:bg-gray-700',
        topbarBorder: 'border-gray-800',
    }
};

// --- UI COMPONENTS ---

const TopBar = ({ children, theme, isZen }) => (
    <div className={`fixed top-0 left-0 right-0 z-20 bg-opacity-80 backdrop-blur-lg transition-all duration-300 ${isZen ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className={`flex items-center justify-between p-2 sm:p-4 border-b ${theme.topbarBorder}`}>
            {children}
        </div>
    </div>
);

const SidebarTabs = ({ tabs, activeTabId, onTabSwitch, onTabAdd, onTabDelete, showSidebar, onCloseSidebar, theme }) => {
    const getTabName = (tab) => {
        const content = tab.content;
        if (!content?.trim()) return "Untitled Entry";
        const firstLine = content.split('\n')[0].trim();
        return firstLine.length > 40 ? firstLine.substring(0, 40) + '...' : firstLine;
    };
    return (
        <>
            <div className={`fixed top-0 right-0 h-full w-80 ${theme.sidebarBg} backdrop-blur-lg border-l ${theme.sidebarBorder} transform transition-transform duration-300 z-40 ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full pt-14">
                    <div className={`flex items-center justify-between p-4 border-b ${theme.sidebarBorder}`}>
                        <h3 className="font-semibold text-lg">My Notes</h3>
                        <button onClick={onCloseSidebar} className={`p-1 ${theme.controlHover} rounded-full`}><CrossIcon className="text-gray-500" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        <div className="space-y-1">
                            {tabs.map((tab) => (
                                <div key={tab.id} className={`group flex items-center justify-between gap-2 transition-colors cursor-pointer px-3 py-2 rounded-md ${tab.id === activeTabId ? theme.sidebarActive : `${theme.sidebarText} ${theme.sidebarHover}`}`} onClick={() => onTabSwitch(tab.id)}>
                                    <span className="flex-1 truncate text-sm font-medium select-none">{getTabName(tab)}</span>
                                    {tabs.length > 1 && (<button className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition p-1" onClick={e => { e.stopPropagation(); onTabDelete(tab.id); }} title="Delete entry"><CrossIcon className="text-gray-500 group-hover:text-red-500" /></button>)}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={`p-3 border-t ${theme.sidebarBorder}`}>
                        <button onClick={onTabAdd} className={`w-full text-sm font-semibold py-2 transition-colors ${theme.newEntry} rounded-md`}>New Entry</button>
                    </div>
                </div>
            </div>
            {showSidebar && <div className="fixed inset-0 bg-black/30 z-30 " onClick={onCloseSidebar} />}
        </>
    );
}

const PublishModal = ({ open, onClose, shareableUrl, publishing, theme }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!shareableUrl) return;
        const tempInput = document.createElement('textarea');
        tempInput.value = shareableUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
        document.body.removeChild(tempInput);
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
            <div className={`bg-white dark:bg-[#232323] rounded-xl shadow-xl p-6 w-full max-w-md relative transition-transform duration-300 ${open ? 'scale-100' : 'scale-95'}`} onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">{shareableUrl ? 'Page Published!' : 'Publishing...'}</h2>
                {shareableUrl ? (
                    <>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Your page is live. Share this link with others.</p>
                        <input className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-[#181818] text-sm mb-2" value={shareableUrl || ''} readOnly onFocus={e => e.target.select()} />
                        <button className="w-full mb-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm" onClick={handleCopy}>{copied ? 'Copied!' : 'Copy Link'}</button>
                    </>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Publishing will make a read-only version of this note accessible to anyone with the link.</p>
                )}
                <div className="flex justify-end">
                    <button disabled={publishing} onClick={onClose} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">Close</button>
                </div>
            </div>
        </div>
    );
};

const PageView = ({ theme }) => {
    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const hash = window.location.hash;
        if (!hash.startsWith('#/p/')) {
            setError("Invalid page link.");
            setLoading(false);
            return;
        }
        const pageId = hash.substring(4);

        if (!db) {
            setError("Database connection not available.");
            setLoading(false);
            return;
        }

        const docRef = doc(db, "pages", pageId);
        getDoc(docRef).then(docSnap => {
            if (docSnap.exists()) {
                setPageData(docSnap.data());
            } else {
                setError("This page does not exist or has been removed.");
            }
        }).catch(() => setError("Could not retrieve the page.")).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Page...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

    const { content, fontName, theme: themeName } = pageData;
    const font = FONT_OPTIONS.find(f => f.name === fontName) || FONT_OPTIONS[0];
    const pageTheme = (themeName === 'dark') ? themes.dark : themes.light;

    return (
        <div className={`min-h-screen w-full ${pageTheme.bg} ${pageTheme.text} p-4 sm:p-8`} style={{ ...font.style }}>
            <div className="max-w-3xl mx-auto py-8">
                <div>
                    <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP ---

function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

export default function App() {
    const [sessionId] = useState(getOrCreateSessionId);
    const [tabs, setTabs] = useState(() => {
        const loaded = loadTabsFromStorage(sessionId);
        return (loaded && loaded.length > 0)
            ? loaded
            : [{ id: `tab_${Date.now()}`, content: "", publishedId: null }];
    });

    const [activeTabId, setActiveTabId] = useState(tabs[0]?.id);
    const [fontIndex, setFontIndex] = useState(0);
    const [fontSizeIndex, setFontSizeIndex] = useState(2);
    const [isLightMode, setIsLightMode] = useState(() => !window.matchMedia('(prefers-color-scheme: dark)').matches);
    const [showSidebar, setShowSidebar] = useState(false);
    const [publishModalOpen, setPublishModalOpen] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isZen, setIsZen] = useState(false);
    const [shareableUrl, setShareableUrl] = useState(null);
    const [timer, setTimer] = useState(0);
    const [isTiming, setIsTiming] = useState(false);
    const typingTimeoutRef = useRef(null);
    const textAreaRef = useRef(null);

    const currentTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
    const currentFont = FONT_OPTIONS[fontIndex];
    const currentFontSize = FONT_SIZES[fontSizeIndex];
    const theme = isLightMode ? themes.light : themes.dark;
    const wordCount = currentTab.content.split(/\s+/).filter(Boolean).length;
    const isSpeechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    const recognitionRef = useRef(null);

    // Timer and word count logic
    const handleTyping = () => {
        if (!isTiming) {
            setIsTiming(true);
        }
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            setIsTiming(false);
        }, 3000);
    };

    useEffect(() => {
        if (isTiming) {
            const interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isTiming]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handlePublish = async () => {
        if (!db) {
            console.error("Database connection not available. Cannot publish.");
            return;
        }
        const currentTab = tabs.find(tab => tab.id === activeTabId);
        if (!currentTab) return;

        setPublishing(true);
        setShareableUrl(null);
        setPublishModalOpen(true);

        const firstLine = currentTab.content.split('\n')[0].trim() || 'Untitled-Note';
        const slug = generateSlug(firstLine);
        const pageId = currentTab.publishedId || `${slug}-${Math.random().toString(36).slice(2, 8)}`;

        const pageData = {
            content: currentTab.content,
            fontName: FONT_OPTIONS[fontIndex].name,
            theme: isLightMode ? 'light' : 'dark',
            lastUpdated: new Date(),
        };

        try {
            await setDoc(doc(db, "pages", pageId), pageData);
            setTabs(tabs.map(t => t.id === activeTabId ? { ...t, publishedId: pageId } : t));
            const url = `${window.location.origin}${window.location.pathname}#/p/${pageId}`;
            setShareableUrl(url);
        } catch (error) {
            console.error("Error publishing page: ", error);
        } finally {
            setPublishing(false);
        }
    };

    const handleTabContentChange = (val) => {
        setTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, content: val } : tab));
        handleTyping();
    };

    const handleTabAdd = () => {
        const newTab = { id: `tab_${Date.now()}`, content: "", publishedId: null };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
        setShowSidebar(true);
    };

    const handleTabDelete = (id) => {
        if (tabs.length === 1) return;
        const idx = tabs.findIndex(tab => tab.id === id);
        const newTabs = tabs.filter(tab => tab.id !== id);
        if (id === activeTabId) {
            setActiveTabId(newTabs[Math.max(0, idx - 1)]?.id || newTabs[0]?.id);
        }
        setTabs(newTabs);
    };

    const handleTabSwitch = (id) => {
        setActiveTabId(id);
        setShowSidebar(false);
    }

    const handleFontChange = () => setFontIndex(prev => (prev + 1) % FONT_OPTIONS.length);
    const handleZoomIn = () => setFontSizeIndex(prev => Math.min(prev + 1, FONT_SIZES.length - 1));
    const handleZoomOut = () => setFontSizeIndex(prev => Math.max(prev - 1, 0));

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isZen) {
                setIsZen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isZen]);

    useEffect(() => addGoogleFonts(), []);
    useEffect(() => {
        const timeout = setTimeout(() => {
            saveTabsToStorage(sessionId, tabs);
        }, 300);
        return () => clearTimeout(timeout);
    }, [tabs, sessionId]);

    // Speech Recognition logic
    useEffect(() => {
        if (!isSpeechSupported) return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        // This variable stores the part of the transcript that is already written to the document
        let stableTranscript = '';

        recognition.onstart = () => {
            console.log("Speech recognition started.");
            setIsTiming(true);
            stableTranscript = currentTab.content; // Capture the current content at the start of dictation
        };
        recognition.onend = () => {
            console.log("Speech recognition ended.");
            setIsTiming(false);
            stableTranscript = ''; // Reset the stable transcript for the next session
        };
        recognition.onerror = (e) => {
            console.error("Speech recognition error:", e.error);
            setIsTiming(false);
        };
        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    stableTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            setTabs(prevTabs => prevTabs.map(tab =>
                tab.id === activeTabId ? { ...tab, content: stableTranscript + interimTranscript } : tab
            ));
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [isSpeechSupported, activeTabId]);

    const handleVoiceStart = () => {
        if (!isSpeechSupported) return;
        if (!isTiming) {
            recognitionRef.current.start();
        }
    };

    const handleVoiceStop = () => {
        if (isTiming) {
            recognitionRef.current.stop();
        }
    };

    // A simple router based on the URL hash
    const hash = window.location.hash;
    const isSharedPage = hash.startsWith('#/p/');
    const mainContent = (
        <main style={{ ...currentFont.style, fontSize: `${currentFontSize}px` }} className={`${theme.bg} ${theme.text} transition-colors duration-300 min-h-screen flex items-center justify-center p-8`}>
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Roboto+Mono:wght@400;700&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Poppins:wght@400;700&display=swap');
                    @tailwind base;
                    @tailwind components;
                    @tailwind utilities;
                    
                    textarea {
                        -webkit-user-select: text;
                        -moz-user-select: text;
                        -ms-user-select: text;
                        user-select: text;
                    }
                `}
            </style>

            <TopBar theme={theme} isZen={isZen}>
                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={() => setShowSidebar(p => !p)} className={`rounded-full p-2.5 ${theme.controlHover} transition-colors`} title="History">
                        <HistoryIcon theme={theme} />
                    </button>
                    <button onClick={handleTabAdd} className={`rounded-full p-2.5 ${theme.controlHover} transition-colors`} title="New Note">
                        <NewNoteIcon />
                    </button>
                    <button onClick={isTiming ? handleVoiceStop : handleVoiceStart} disabled={!isSpeechSupported} className={`rounded-full p-2.5 ${isTiming ? 'bg-red-500 text-white hover:bg-red-600' : `${theme.controlHover} transition-colors`}`} title={isTiming ? "Stop Dictation" : "Start Dictation"}>
                        <MicrophoneIcon />
                    </button>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={handlePublish} className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-full hover:bg-green-600">
                        <PublishIcon />
                        <span>Publish</span>
                    </button>
                    <button onClick={handlePublish} className="sm:hidden rounded-full p-2.5 text-sm font-medium bg-green-500 text-white hover:bg-green-600" title="Publish">
                        <PublishIcon />
                    </button>
                    <button onClick={handleFontChange} className={`rounded-full p-2.5 ${theme.controlHover} transition-colors`} title="Change Font"><FontIcon /></button>
                    <div className={`hidden sm:flex items-center rounded-full ${theme.controlHover} transition-colors`}>
                        <button onClick={handleZoomOut} className={`rounded-l-full p-2.5 ${theme.controlHover} transition-colors`} title="Zoom Out"><ZoomOutIcon /></button>
                        <button onClick={handleZoomIn} className={`rounded-r-full p-2.5 ${theme.controlHover} transition-colors`} title="Zoom In"><ZoomInIcon /></button>
                    </div>
                    <button onClick={() => setIsLightMode(p => !p)} className={`rounded-full p-2.5 ${theme.controlHover} transition-colors`} title="Toggle Theme">
                        {isLightMode ? <MoonIcon theme={theme} /> : <SunIcon theme={theme} />}
                    </button>
                    <button onClick={() => setIsZen(p => !p)} className={`rounded-full p-2.5 ${theme.controlHover} transition-colors`} title="Zen Mode"><ZenModeIcon /></button>
                </div>
            </TopBar>

            <div className={`min-h-[80vh] w-full max-w-5xl flex flex-col justify-center transition-all duration-300 ${isZen ? 'max-w-screen-xl' : ''}`}>
                <textarea
                    ref={textAreaRef}
                    value={currentTab?.content || ""}
                    onChange={e => handleTabContentChange(e.target.value)}
                    placeholder="Just write..."
                    className={`w-full h-[80vh] bg-transparent leading-relaxed resize-none border-none focus:outline-none focus:ring-0 ${theme.placeholder}`}
                />
            </div>

            {!isZen && (
                <div className={`fixed bottom-0 left-0 right-0 z-20 bg-opacity-80 backdrop-blur-lg border-t ${theme.topbarBorder} transition-all duration-300`}>
                    <div className={`flex justify-center text-sm py-2 ${theme.text}`}>
                        {formatTime(timer)} &nbsp; Words: {wordCount}
                    </div>
                </div>
            )}

            <SidebarTabs {...{ tabs, activeTabId, onTabSwitch: handleTabSwitch, onTabAdd: handleTabAdd, onTabDelete: handleTabDelete, showSidebar, onCloseSidebar: () => setShowSidebar(false), theme }} />
            <PublishModal {...{ open: publishModalOpen, onClose: () => setPublishModalOpen(false), shareableUrl, publishing, theme }} />
        </main>
    );

    return isSharedPage ? <PageView theme={theme} /> : mainContent;
}
