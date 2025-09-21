import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

// --- CONFIGURATION & HELPERS ---
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
    console.error("Firebase initialization failed. Please check your configuration.", e);
}

// --- FONT & THEME DEFINITIONS ---
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

const themes = {
    light: {
        bg: 'bg-[#F9F9F9]', text: 'text-[#1F1F1F]', placeholder: 'placeholder-gray-400',
        icon: 'text-gray-600', controlBg: 'bg-white/60', controlHover: 'hover:bg-black/5',
        tabBg: 'bg-gray-200/80', tabText: 'text-gray-600', tabActiveBg: 'bg-[#F9F9F9]',
        tabActiveText: 'text-black', tabHover: 'hover:bg-gray-300/80', topbarBorder: 'border-gray-300/50',
    },
    dark: {
        bg: 'bg-[#121212]', text: 'text-[#E0E0E0]', placeholder: 'placeholder-gray-600',
        icon: 'text-gray-400', controlBg: 'bg-black/50', controlHover: 'hover:bg-white/10',
        tabBg: 'bg-[#202124]/80', tabText: 'text-gray-400', tabActiveBg: 'bg-[#121212]',
        tabActiveText: 'text-white', tabHover: 'hover:bg-[#2f3033]/80', topbarBorder: 'border-gray-700/50',
    }
};

// --- LOCAL STORAGE & SESSION UTILS ---
function saveTabsToStorage(sessionId, tabs) {
    localStorage.setItem(`freespeak_tabs_v3_${sessionId}`, JSON.stringify(tabs));
}
function loadTabsFromStorage(sessionId) {
    const raw = localStorage.getItem(`freespeak_tabs_v3_${sessionId}`);
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
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
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
    let sessionId = getCookie('freespeak_session');
    if (!sessionId) {
        sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
        setCookie('freespeak_session', sessionId, 365);
    }
    return sessionId;
}
// --- ICONS ---
const ZenModeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
        <line x1="12" y1="2" x2="12" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
);
const ExitZenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
        <line x1="9" y1="9" x2="15" y2="15" />
        <line x1="15" y1="9" x2="9" y2="15" />
    </svg>
);
const CrossIcon = ({ className }) => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className={className}>
        <path d="M6 6l8 8M6 14L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);
const SunIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
);
const MoonIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

const PublishIcon = () => (
    <svg width="20" height="20" viewBox="-0.5 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M13.47 4.13998C12.74 4.35998 12.28 5.96 12.09 7.91C6.77997 7.91 2 13.4802 2 20.0802C4.19 14.0802 8.99995 12.45 12.14 12.45C12.34 14.21 12.79 15.6202 13.47 15.8202C15.57 16.4302 22 12.4401 22 9.98006C22 7.52006 15.57 3.52998 13.47 4.13998Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);
const ZoomInIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);
const ZoomOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="8" y1="11" x2="14" y2="11" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
    </svg>
);
const MarkdownEnabledIcon = () => (
    <svg fill="currentColor" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path d="M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0 0 42 42h216v494zM429 481.2c-1.9-4.4-6.2-7.2-11-7.2h-35c-6.6 0-12 5.4-12 12v272c0 6.6 5.4 12 12 12h27.1c6.6 0 12-5.4 12-12V582.1l66.8 150.2a12 12 0 0 0 11 7.1H524c4.7 0 9-2.8 11-7.1l66.8-150.6V758c0 6.6 5.4 12 12 12H641c6.6 0 12-5.4 12-12V486c0-6.6-5.4-12-12-12h-34.7c-4.8 0-9.1 2.8-11 7.2l-83.1 191-83.2-191z" />
    </svg>
);
const MarkdownDisabledIcon = () => (
    <svg fill="currentColor" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path d="M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0 0 42 42h216v494zM429 481.2c-1.9-4.4-6.2-7.2-11-7.2h-35c-6.6 0-12 5.4-12 12v272c0 6.6 5.4 12 12 12h27.1c6.6 0 12-5.4 12-12V582.1l66.8 150.2a12 12 0 0 0 11 7.1H524c4.7 0 9-2.8 11-7.1l66.8-150.6V758c0 6.6 5.4 12 12 12H641c6.6 0 12-5.4 12-12V486c0-6.6-5.4-12-12-12h-34.7c-4.8 0-9.1 2.8-11 7.2l-83.1 191-83.2-191z" />
        {/* Diagonal strike to indicate disabled */}
        <line x1="100" y1="100" x2="924" y2="924" stroke="currentColor" strokeWidth="60" strokeLinecap="round" />
    </svg>
);


// --- UI COMPONENTS ---

const AppHeader = () => (
    <div className="fixed top-0 left-0 right-0 h-12 flex items-center justify-center z-40 pointer-events-none">
        <h1 className="text-xs font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-600 select-none">
            FREEWRITE
        </h1>
    </div>
);

const ChromeTabsBar = ({ tabs, activeTabId, onTabSwitch, onTabAdd, onTabDelete, theme }) => {
    const getTabName = (tab) => {
        const content = tab.content;
        if (!content?.trim()) return "Untitled Note";
        const firstLine = content.split('\n')[0].trim();
        return firstLine.length > 25 ? firstLine.substring(0, 25) + '...' : firstLine;
    };

    return (
        <>
            <div className={`h-7 flex items-center justify-center pointer-events-none border-b border-gray-700 backdrop-blur-md`}>
                <h1 className="text-xs font-semibold tracking-[1em] uppercase text-gray-400 dark:text-gray-600 select-none">
                    FREEWRITE
                </h1>
            </div>
            <div className={`fixed top-7 left-0 right-0 h-11 ${theme.tabBg} backdrop-blur-md z-30 flex items-end border-b ${theme.topbarBorder} select-none`}>
                <div className="flex-1 flex items-center h-full overflow-x-auto">
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            onClick={() => onTabSwitch(tab.id)}
                            className={`group relative flex items-center h-full pl-4 pr-3 cursor-pointer border-r transition-colors duration-200 ${theme.topbarBorder} ${tab.id === activeTabId ? `${theme.tabActiveBg} ${theme.tabActiveText}` : `${theme.tabText} ${theme.tabHover}`}`}
                        >
                            <span className="truncate text-sm font-medium mr-2">{getTabName(tab)}</span>
                            {tabs.length > 1 && (
                                <button
                                    onClick={e => { e.stopPropagation(); onTabDelete(tab.id); }}
                                    className="opacity-50 group-hover:opacity-100 rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-1 transition-all duration-200 hover:scale-110 active:scale-95"
                                    title="Close tab"
                                >
                                    <CrossIcon className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <button
                    onClick={onTabAdd}
                    className={`flex items-center justify-center h-full px-4 transition-colors duration-200 ${theme.tabText} ${theme.tabHover} border-l ${theme.topbarBorder}`}
                    title="New Tab"
                >
                    <PlusIcon />
                </button>
            </div></>
    );
};

const ControlBar = ({
    theme, handlePublish, toggleZen,
    currentFont, handleFontChange,
    handleZoomIn, handleZoomOut,
    toggleTheme, isLightMode,
    toggleMarkdownPreview, isMarkdownPreview
}) => {
    // Reusable classes for all control buttons
    const buttonClasses = "rounded-full p-2.5 transition-all duration-200 ease-in-out hover:scale-110 active:scale-95";

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center">
            <div className={`flex items-center space-x-1 p-2 rounded-full  ${theme.controlBg} backdrop-blur-xl shadow-2xl border border-white/20 dark:border-white/10`}>
                <button
                    onClick={handleFontChange}
                    className={`text-sm font-medium rounded-full py-2.5 px-4 whitespace-nowrap ${buttonClasses} ${theme.controlHover}`}
                    style={{ ...currentFont.style }}
                    title="Next font"
                >
                    {currentFont.name}
                </button>
                <button onClick={handleZoomOut} className={`${buttonClasses} ${theme.controlHover}`} title="Decrease font size"><ZoomOutIcon /></button>
                <button onClick={handleZoomIn} className={`${buttonClasses} ${theme.controlHover}`} title="Increase font size"><ZoomInIcon /></button>
                <div className="w-px h-6 bg-gray-300/50 dark:bg-gray-700/50 mx-1"></div>
                <button onClick={toggleTheme} className={`${buttonClasses} ${theme.controlHover}`} title="Toggle theme">
                    {isLightMode ? <MoonIcon className={theme.icon} /> : <SunIcon className={theme.icon} />}
                </button>
                <button onClick={toggleMarkdownPreview} className={`${buttonClasses} ${theme.controlHover} ${isMarkdownPreview ? 'bg-black/10 dark:bg-white/10' : ''}`} title="Toggle Markdown Preview">
                    {isMarkdownPreview ? <MarkdownDisabledIcon /> : <MarkdownEnabledIcon />}
                </button>

                <button onClick={toggleZen} className={`${buttonClasses} ${theme.controlHover}`} title="Zen Mode">
                    <ZenModeIcon />
                </button>
                <button onClick={handlePublish} className={`${buttonClasses} bg-black text-white hover:opacity-80`} title="Publish">
                    <PublishIcon />
                </button>
            </div>

        </div>
    );
};

const LoadingSpinnerIcon = () => (
    <svg className="animate-spin h-6 w-6 text-gray-800 dark:text-gray-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CopyIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

// --- THE REDESIGNED PUBLISHMODAL COMPONENT ---

const PublishModal = ({ open, onClose, shareableUrl, publishing }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!shareableUrl) return;
        navigator.clipboard.writeText(shareableUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Increased timeout for better visibility
        }).catch(err => console.error('Failed to copy text: ', err));
    };

    // Reset copied state when modal is closed
    useEffect(() => {
        if (!open) {
            setTimeout(() => setCopied(false), 300); // Delay reset until after closing animation
        }
    }, [open]);

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
            <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}></div>

            <div
                className={`w-full max-w-sm relative transition-all duration-300 bg-white dark:bg-white/50 border border-white/20 dark:border-white/10 rounded-xl shadow-2xl p-5 ${open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Close button for better accessibility */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 rounded-full p-1.5 text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 ease-in-out hover:scale-110 active:scale-95"
                    title="Close"
                >
                    <CrossIcon className="w-4 h-4" />
                </button>

                {publishing ? (
                    <div className="flex flex-col items-center justify-center space-y-3 py-4">
                        <LoadingSpinnerIcon />
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Publishing...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center">
                        <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Page Published!</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Anyone with the link can view a read-only version.</p>

                        <div className="relative w-full flex items-center justify-between bg-gray-100/80 dark:bg-black/20 rounded-lg p-2 border border-gray-300/50 dark:border-gray-700/50">
                            <input
                                className="w-full bg-transparent text-sm text-gray-600 dark:text-gray-300 focus:outline-none select-all"
                                value={shareableUrl || ''}
                                readOnly
                                onFocus={e => e.target.select()}
                            />
                            <button
                                className="ml-2 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-semibold transition-all duration-200 ease-in-out active:scale-95 flex items-center"
                                onClick={handleCopy}
                            >
                                <div className={`transition-all duration-300 flex items-center ${copied ? 'w-16' : 'w-5'}`}>
                                    <span className={`transition-opacity duration-300 ${copied ? 'opacity-0 -translate-x-2 absolute' : 'opacity-100'}`}>
                                        <CopyIcon />
                                    </span>
                                    <span className={`transition-opacity duration-300 whitespace-nowrap ${copied ? 'opacity-100' : 'opacity-0 translate-x-2 absolute'}`}>
                                        Copied!
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};



const PageView = () => {
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

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-black text-gray-800 dark:text-gray-200">Loading Page...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-black text-red-500">{error}</div>;

    const { content, fontName, theme: themeName } = pageData;
    const font = FONT_OPTIONS.find(f => f.name === fontName) || FONT_OPTIONS[0];
    const pageTheme = (themeName === 'dark') ? themes.dark : themes.light;

    const isDark = pageTheme === themes.dark;

    return (
        <div className={`min-h-screen w-full transition-colors duration-300 ${pageTheme.bg} ${pageTheme.text} ${isDark ? 'dark' : ''}`} style={{ ...font.style }}>
            <style>
                {`
                    .prose { max-width: none !important; }
                    .dark .prose { color: #E0E0E0; }
                    .dark .prose h1, .dark .prose h2, .dark .prose h3, .dark .prose h4, .dark .prose h5, .dark .prose h6, .dark .prose strong, .dark .prose thead { color: #fff; }
                    .dark .prose a { color: #93c5fd; }
                    .dark .prose code { color: #f9a8d4; }
                    .dark .prose blockquote { color: #d1d5db; border-left-color: #4b5563; }
                `}
            </style>
            <AppHeader />
            <main className="w-full h-full py-8 px-6 sm:px-12 md:px-20 pt-20">
                <article className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {content}
                    </ReactMarkdown>
                </article>
            </main>
        </div>
    );
};

// --- MAIN APP ---
function generateSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
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
    const [isLightMode, setIsLightMode] = useState(true);
    const [publishModalOpen, setPublishModalOpen] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isZen, setIsZen] = useState(false);
    const [shareableUrl, setShareableUrl] = useState(null);
    const [isMarkdownPreview, setMarkdownPreview] = useState(false);
    const textAreaRef = useRef(null);

    const currentTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
    const currentFont = FONT_OPTIONS[fontIndex];
    const theme = isLightMode ? themes.light : themes.dark;

    // Undo (Ctrl+Z) functionality
    useEffect(() => {
        const handleUndo = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                document.execCommand('undo');
            }
        };
        document.addEventListener('keydown', handleUndo);
        return () => {
            document.removeEventListener('keydown', handleUndo);
        };
    }, []);


    useEffect(() => {
        const timeout = setTimeout(() => {
            saveTabsToStorage(sessionId, tabs);
        }, 300);
        return () => clearTimeout(timeout);
    }, [tabs, sessionId]);

    const handlePublish = async () => {
        if (!db) {
            alert("Database connection not available. Cannot publish.");
            return;
        }
        if (!currentTab) return;

        setPublishing(true);
        setShareableUrl(null);
        setPublishModalOpen(true);

        const firstLine = currentTab.content.split('\n')[0].trim() || 'Untitled-Note';
        const slug = generateSlug(firstLine);
        const pageId = currentTab.publishedId || `${slug}-${Math.random().toString(36).slice(2, 8)}`;

        const pageData = {
            content: currentTab.content,
            fontName: currentFont.name,
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
    };

    const handleTabAdd = () => {
        const newTab = { id: `tab_${Date.now()}`, content: "", publishedId: null };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
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

    const handleFontChange = () => setFontIndex(prev => (prev + 1) % FONT_OPTIONS.length);
    const handleZoomIn = () => setFontSizeIndex(prev => Math.min(prev + 1, FONT_SIZES.length - 1));
    const handleZoomOut = () => setFontSizeIndex(prev => Math.max(prev - 1, 0));

    if (window.location.hash.startsWith('#/p/')) {
        return <PageView />;
    }

    return (
        <div className={`w-screen h-screen overflow-hidden transition-colors duration-300 ease-in-out ${theme.bg} ${theme.text} ${!isLightMode ? 'dark' : ''}`} style={{ ...currentFont.style, fontSize: `${FONT_SIZES[fontSizeIndex]}px` }}>
            <style>
                {`
                    .prose { max-width: none !important; }
                    .dark .prose { color: #E0E0E0; }
                    .dark .prose h1, .dark .prose h2, .dark .prose h3, .dark .prose h4, .dark .prose h5, .dark .prose h6, .dark .prose strong, .dark .prose thead { color: #fff; }
                    .dark .prose a { color: #93c5fd; }
                    .dark .prose code { color: #f9a8d4; }
                    .dark .prose blockquote { color: #d1d5db; border-left-color: #4b5563; }

                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Roboto+Mono:wght@400;700&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Poppins:wght@400;700&display=swap');
                    
                    textarea::-webkit-scrollbar, .markdown-preview::-webkit-scrollbar { width: 8px; }
                    textarea::-webkit-scrollbar-track, .markdown-preview::-webkit-scrollbar-track { background: transparent; }
                    textarea::-webkit-scrollbar-thumb, .markdown-preview::-webkit-scrollbar-thumb { background-color: rgba(128, 128, 128, 0.3); border-radius: 4px; }
                    textarea::-webkit-scrollbar-thumb:hover, .markdown-preview::-webkit-scrollbar-thumb:hover { background-color: rgba(128, 128, 128, 0.5); }
                `}
            </style>

            {!isZen && (
                <>
                    <ChromeTabsBar {...{ tabs, activeTabId, onTabSwitch: setActiveTabId, onTabAdd: handleTabAdd, onTabDelete: handleTabDelete, theme }} />
                    <ControlBar
                        theme={theme}
                        handlePublish={handlePublish}
                        toggleZen={() => setIsZen(true)}
                        currentFont={currentFont}
                        handleFontChange={handleFontChange}
                        handleZoomIn={handleZoomIn}
                        handleZoomOut={handleZoomOut}
                        toggleTheme={() => setIsLightMode(p => !p)}
                        isLightMode={isLightMode}
                        toggleMarkdownPreview={() => setMarkdownPreview(p => !p)}
                        isMarkdownPreview={isMarkdownPreview}
                    />
                </>
            )}

            {isMarkdownPreview ? (
                <article
                    style={{ fontSize: `${FONT_SIZES[fontSizeIndex]}px` }}
                    className={`prose dark:prose-invert h-full overflow-y-auto markdown-preview transition-all duration-300
                        ${isZen
                            ? 'px-6 sm:px-12 pt-12 pb-12'
                            : 'px-6 sm:px-12 md:px-20 pt-20 pb-32'
                        }`}
                >
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {currentTab?.content || "# Nothing to preview\nStart writing some **markdown**!"}
                    </ReactMarkdown>
                </article>
            ) : (
                <textarea
                    ref={textAreaRef}
                    value={currentTab?.content || ""}
                    onChange={e => handleTabContentChange(e.target.value)}
                    placeholder="Just write..."
                    className={`w-full h-full bg-transparent resize-none border-none focus:outline-none focus:ring-0 leading-relaxed ${theme.placeholder} transition-all duration-300
                        ${isZen
                            ? 'px-6 sm:px-12 pt-12 pb-12'
                            : 'px-6 sm:px-12 md:px-20 pt-20 pb-32'
                        }`}
                />
            )}

            {isZen && (
                <button
                    onClick={() => setIsZen(false)}
                    className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 z-50 rounded-full bg-black/40 text-white p-4 sm:p-5 shadow-lg transition-all duration-200 ease-in-out hover:scale-110 active:scale-95 hover:bg-black/60"
                    title="Exit Zen Mode"
                >
                    <ExitZenIcon />
                </button>
            )}

            <PublishModal {...{ open: publishModalOpen, onClose: () => setPublishModalOpen(false), shareableUrl, publishing }} />
        </div>
    );
}