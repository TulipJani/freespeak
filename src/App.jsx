import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';


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
        icon: 'text-gray-600', controlBg: 'bg-white/80', controlHover: 'hover:bg-black/5',
        tabBg: 'bg-gray-200', tabText: 'text-gray-600', tabActiveBg: 'bg-[#F9F9F9]',
        tabActiveText: 'text-black', tabHover: 'hover:bg-gray-300', topbarBorder: 'border-gray-200',
    },
    dark: {
        bg: 'bg-[#121212]', text: 'text-[#E0E0E0]', placeholder: 'placeholder-gray-600',
        icon: 'text-gray-400', controlBg: 'bg-black/50', controlHover: 'hover:bg-white/10',
        tabBg: 'bg-[#202124]', tabText: 'text-gray-400', tabActiveBg: 'bg-[#121212]',
        tabActiveText: 'text-white', tabHover: 'hover:bg-[#2f3033]', topbarBorder: 'border-gray-800',
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
const ZenModeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v18M16 3v18M3 8h18M3 16h18" /></svg>;
const ExitZenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm3.5 14.5l-8-8M8.5 16.5l8-8" /></svg>;
const CrossIcon = ({ className }) => (<svg width="16" height="16" viewBox="0 0 20 20" fill="none" className={className}><path d="M6 6l8 8M6 14L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>);
const SunIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>);
const MoonIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>);
const PublishIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
const ZoomInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>;
const ZoomOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>;


// --- UI COMPONENTS ---

const ChromeTabsBar = ({ tabs, activeTabId, onTabSwitch, onTabAdd, onTabDelete, theme }) => {
    const getTabName = (tab) => {
        const content = tab.content;
        if (!content?.trim()) return "Untitled Note";
        const firstLine = content.split('\n')[0].trim();
        return firstLine.length > 25 ? firstLine.substring(0, 25) + '...' : firstLine;
    };

    return (
        <div className={`fixed top-0 left-0 right-0 h-11 ${theme.tabBg} z-30 flex items-end border-b ${theme.topbarBorder} select-none`}>
            <div className="flex items-center h-full overflow-x-auto">
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => onTabSwitch(tab.id)}
                        className={`group relative flex items-center h-full pl-4 pr-3 cursor-pointer border-r ${theme.topbarBorder} ${tab.id === activeTabId ? `${theme.tabActiveBg} ${theme.tabActiveText}` : `${theme.tabText} ${theme.tabHover}`}`}
                    >
                        <span className="truncate text-sm font-medium mr-2">{getTabName(tab)}</span>
                        {tabs.length > 1 && (
                            <button
                                onClick={e => { e.stopPropagation(); onTabDelete(tab.id); }}
                                className="opacity-50 group-hover:opacity-100 rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-1 transition-opacity"
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
                className={`flex items-center justify-center h-full px-4 ${theme.tabText} ${theme.tabHover} border-l ${theme.topbarBorder}`}
                title="New Tab"
            >
                <PlusIcon />
            </button>
        </div>
    );
};

const ControlBar = ({
    theme, handlePublish, toggleZen,
    currentFont, handleFontChange,
    handleZoomIn, handleZoomOut,
    toggleTheme, isLightMode
}) => (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center space-x-1 p-2 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-lg shadow-xl">
            {/* Font Cycle Button */}
            <button
                onClick={handleFontChange}
                className={`text-sm font-medium rounded-full py-2.5 px-4 ${theme.controlHover} transition-colors`}
                style={{ ...currentFont.style }}
                title="Next font"
            >
                {currentFont.name}
            </button>
            <button onClick={handleZoomOut} className={`rounded-full p-2.5 ${theme.controlHover} transition-colors`} title="Decrease font size"><ZoomOutIcon /></button>
            <button onClick={handleZoomIn} className={`rounded-full p-2.5 ${theme.controlHover} transition-colors`} title="Increase font size"><ZoomInIcon /></button>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
            <button onClick={toggleTheme} className={`rounded-full p-2.5 ${theme.controlHover} transition-colors`} title="Toggle theme">
                {isLightMode ? <MoonIcon className={theme.icon} /> : <SunIcon className={theme.icon} />}
            </button>
            <button onClick={handlePublish} className={`rounded-full p-2.5 ${theme.controlHover} transition-colors`} title="Publish">
                <PublishIcon />
            </button>
            <button onClick={toggleZen} className={`rounded-full p-2.5 ${theme.controlHover} transition-colors`} title="Zen Mode">
                <ZenModeIcon />
            </button>
        </div>
    </div>
);

const PublishModal = ({ open, onClose, shareableUrl, publishing }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!shareableUrl) return;
        navigator.clipboard.writeText(shareableUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }).catch(err => console.error('Failed to copy text: ', err));
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
            <div className={`bg-white dark:bg-[#232323] rounded-xl shadow-xl p-6 w-full max-w-md relative transition-transform duration-300 ${open ? 'scale-100' : 'scale-95'}`} onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">{publishing ? 'Publishing...' : 'Page Published!'}</h2>
                {shareableUrl ? (
                    <>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Your page is live. Share this link with others.</p>
                        <input className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-[#181818] text-sm mb-2" value={shareableUrl} readOnly onFocus={e => e.target.select()} />
                        <button className="w-full mb-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold" onClick={handleCopy}>{copied ? 'Copied!' : 'Copy Link'}</button>
                    </>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">A read-only version of this note will be accessible to anyone with the link.</p>
                )}
                <div className="flex justify-end mt-4">
                    <button disabled={publishing} onClick={onClose} className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 rounded text-sm font-semibold">Close</button>
                </div>
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

    return (
        <div className={`min-h-screen w-full ${pageTheme.bg} ${pageTheme.text} p-4 sm:p-8`} style={{ ...font.style }}>
            <div className="max-w-3xl mx-auto py-8">
                <div className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
            </div>
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
    const [isLightMode, setIsLightMode] = useState(() => !window.matchMedia('(prefers-color-scheme: dark)').matches);
    const [publishModalOpen, setPublishModalOpen] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isZen, setIsZen] = useState(false);
    const [shareableUrl, setShareableUrl] = useState(null);
    const textAreaRef = useRef(null);

    const currentTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
    const currentFont = FONT_OPTIONS[fontIndex];
    const theme = isLightMode ? themes.light : themes.dark;

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
        <div className={`w-screen h-screen overflow-hidden ${theme.bg} ${theme.text}`} style={{ ...currentFont.style, fontSize: `${FONT_SIZES[fontSizeIndex]}px` }}>
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Roboto+Mono:wght@400;700&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Poppins:wght@400;700&display=swap');
                    textarea { -webkit-user-select: text; user-select: text; }
                    /* Custom scrollbar for a cleaner look */
                    textarea::-webkit-scrollbar { width: 8px; }
                    textarea::-webkit-scrollbar-track { background: transparent; }
                    textarea::-webkit-scrollbar-thumb { background-color: rgba(128, 128, 128, 0.3); border-radius: 4px; }
                    textarea::-webkit-scrollbar-thumb:hover { background-color: rgba(128, 128, 128, 0.5); }
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
                    />
                </>
            )}

            <textarea
                ref={textAreaRef}
                value={currentTab?.content || ""}
                onChange={e => handleTabContentChange(e.target.value)}
                placeholder="Just write..."
                className={`w-full h-full bg-transparent resize-none border-none focus:outline-none focus:ring-0
                            leading-relaxed ${theme.placeholder} overflow-y-auto
                            transition-all duration-300
                            ${isZen
                        ? 'px-4 sm:px-8 pt-8 sm:pt-12 pb-8 sm:pb-12' // Zen Mode padding
                        : 'px-4 sm:px-12 md:px-20 pt-16 pb-32'      // Normal Mode padding
                    }`}
            />

            {isZen && (
                <button
                    onClick={() => setIsZen(false)}
                    className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 z-50 rounded-full bg-black/40 text-white p-4 sm:p-5 transition-colors hover:bg-black/60 shadow-lg"
                    title="Exit Zen Mode"
                >
                    <ExitZenIcon />
                </button>
            )}

            <PublishModal {...{ open: publishModalOpen, onClose: () => setPublishModalOpen(false), shareableUrl, publishing }} />
        </div>
    );
}