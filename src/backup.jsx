import React, { useState, useEffect, useRef } from 'react';

// --- HELPER FUNCTIONS & CONFIGURATION ---

/**
 * Injects the Google Fonts stylesheet into the document's head.
 */
const addGoogleFonts = () => {
    const fontLinkHref = "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Inconsolata:wght@400;700&display=swap";
    if (document.querySelector(`link[href="${fontLinkHref}"]`)) return;
    
    const link = document.createElement('link');
    link.href = fontLinkHref;
    link.rel = "stylesheet";
    document.head.appendChild(link);
};

// Array of font objects to cycle through
const FONT_OPTIONS = [
    { name: 'Inter', style: { fontFamily: "'Inter', sans-serif" } },
    { name: 'Lora', style: { fontFamily: "'Lora', serif" } },
    { name: 'Inconsolata', style: { fontFamily: "'Inconsolata', monospace" } },
];

// --- COOKIE UTILS ---

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

// --- SESSION UTILS ---

function getOrCreateSessionId() {
    let sessionId = getCookie('freespeech_session');
    if (!sessionId) {
        sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
        setCookie('freespeech_session', sessionId, 365);
    }
    return sessionId;
}

// --- UI COMPONENTS ---

/**
 * Renders the microphone icon.
 */
const MicrophoneIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="text-gray-300"
    >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
    </svg>
);

/**
 * Renders the stop icon.
 */
const StopIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-red-400"
    >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    </svg>
);


/**
 * Renders the timer display.
 */
const Timer = ({ seconds }) => {
    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
        const secs = (timeInSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${secs}`;
    };
    return <span className="text-gray-400 text-lg font-mono w-14 text-center">{formatTime(seconds)}</span>;
};

/**
 * Renders the speech control UI on the left.
 */
const SpeechControl = ({ onStart, onStop, isListening, isSpeechSupported, elapsedTime }) => {
    return (
        <div className="absolute top-4 left-4 z-10 bg-gray-800/50 backdrop-blur-sm p-1 rounded-lg flex items-center space-x-2">
            {!isListening ? (
                // Show Start button if not listening
                <button
                    onClick={onStart}
                    disabled={!isSpeechSupported}
                    title="Start Dictation"
                    className="p-2 rounded-md transition-colors duration-200 hover:bg-gray-700/80 disabled:opacity-50"
                >
                    <MicrophoneIcon />
                </button>
            ) : (
                // Show Stop button and timer if listening
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
};

/**
 * Renders the font control UI on the right.
 */
const FontControl = ({ onFontChange, currentFontName }) => {
    return (
        <div className="absolute top-4 right-4 z-10">
            <button
                onClick={onFontChange}
                className="bg-gray-800/50 backdrop-blur-sm px-4 py-2 text-sm text-gray-300 rounded-lg hover:bg-gray-700/80 transition-colors"
            >
                Font: <span className="font-semibold text-white">{currentFontName}</span>
            </button>
        </div>
    );
};


/**
 * Main App Component
 */
export default function App() {
    // Session and cookie keys
    const [sessionId] = useState(() => getOrCreateSessionId());
    const cookieKey = `freespeech_text_${sessionId}`;

    // Load initial text from cookie
    const [text, setText] = useState(() => {
        if (typeof window === 'undefined') return '';
        const saved = getCookie(cookieKey);
        return saved !== null ? saved : '';
    });
    const [fontIndex, setFontIndex] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    
    const recognitionRef = useRef(null);
    const textAreaRef = useRef(null);
    const stableTextOnStartRef = useRef('');
    const timerIntervalRef = useRef(null);

    const isSpeechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    // Setup speech recognition engine
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
        
        // **SIMPLIFIED onresult HANDLER FOR SMOOTHNESS**
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            
            setText(stableTextOnStartRef.current + transcript);
        };

        recognitionRef.current = recognition;
    }, [isSpeechSupported]);

    // Manage the dictation timer
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

    // Auto-resize textarea
    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [text]);

    // Load fonts on mount
    useEffect(() => {
        addGoogleFonts();
    }, []);

    // Save text to cookie whenever it changes (debounced for performance)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        // Debounce: only save after user stops typing for 400ms
        const timeout = setTimeout(() => {
            setCookie(cookieKey, text, 365);
        }, 400);
        return () => clearTimeout(timeout);
    }, [text, cookieKey]);

    // --- Handlers ---

    const handleStartListening = () => {
        if (isListening || !recognitionRef.current) return;
        stableTextOnStartRef.current = text ? text.trim() + ' ' : '';
        recognitionRef.current.start();
    };
    
    const handleStopListening = () => {
        if (!isListening || !recognitionRef.current) return;
        recognitionRef.current.stop();
    };

    const handleFontChange = () => {
        setFontIndex(prevIndex => (prevIndex + 1) % FONT_OPTIONS.length);
    };
    
    const currentFont = FONT_OPTIONS[fontIndex];
    const placeholderText = "Just write, or click the microphone to dictate...";

    return (
        <main 
            className="bg-gray-900 min-h-screen text-gray-200 w-full flex items-center justify-center relative"
            style={currentFont.style}
        >
            <SpeechControl 
                onStart={handleStartListening}
                onStop={handleStopListening}
                isListening={isListening}
                isSpeechSupported={isSpeechSupported}
                elapsedTime={elapsedTime}
            />
            <FontControl 
                onFontChange={handleFontChange}
                currentFontName={currentFont.name}
            />
            
            <div className="w-full max-w-3xl px-8 py-16">
                <textarea
                    ref={textAreaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={placeholderText}
                    className="w-full h-auto min-h-[80vh] p-0 bg-transparent text-gray-200 text-lg leading-relaxed resize-none border-none focus:outline-none focus:ring-0 placeholder-gray-600"
                />
            </div>
        </main>
    );
}