import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Wifi, WifiOff, AlertCircle, Timer as TimerIcon, Settings2, Info, Heart, BookOpen, ShipWheel, Menu, X } from 'lucide-react';
import { SuttaReader } from './components/SuttaReader';
import { Timer } from './components/Timer';
import { Settings } from './components/Settings';
import { About } from './components/About';
import { Support } from './components/Support';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useStore } from './store/useStore';
import { initDatabase } from './db';
import { audioService } from './services/AudioService';
import { speechService } from './services/speech/SpeechService';
import { mobileSpeechService } from './services/speech/MobileSpeechService';
import { isMobileDevice } from './utils/deviceDetection';

interface NavLinkProps {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon: Icon, children, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center px-4 py-3 mx-2 rounded-xl text-gray-700 dark:text-gray-200 transition-all duration-300 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-700 ${
        isActive ? 'bg-primary/10 text-primary font-medium' : ''
      }`}
      aria-label={children?.toString()}
    >
      <Icon size={22} aria-hidden="true" className="min-w-[22px]" />
      <span className="ml-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 md:transform md:translate-x-[-20px] md:group-hover:translate-x-0 whitespace-nowrap">
        {children}
      </span>
    </Link>
  );
};

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden">
      <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-xl">
        <div className="flex flex-col h-full py-6">
          <div className="flex items-center justify-between px-6 mb-6">
            <Link
              to="/"
              onClick={onClose}
              className="flex items-center space-x-3 text-primary hover:text-primary-hover transition-all duration-300"
              aria-label="Metta Voice Home"
            >
              <ShipWheel size={24} className="text-primary" aria-hidden="true" />
              <span className="text-lg font-semibold text-primary">Metta Voice</span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 py-4 space-y-2">
            <NavLink to="/" icon={BookOpen} onClick={onClose}>Reader</NavLink>
            <NavLink to="/timer" icon={TimerIcon} onClick={onClose}>Timer</NavLink>
            <NavLink to="/settings" icon={Settings2} onClick={onClose}>Settings</NavLink>
            <NavLink to="/support" icon={Heart} onClick={onClose}>Support</NavLink>
            <NavLink to="/about" icon={Info} onClick={onClose}>About</NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { updateTTSProvider } = useStore();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const initAttempted = React.useRef(false);

  useEffect(() => {
    const init = async () => {
      if (initAttempted.current) return;
      initAttempted.current = true;

      try {
        // Initialize database first
        await initDatabase();

        // Initialize audio service without waiting
        audioService.initialize().catch(console.error);

        // Initialize speech service
        const service = isMobileDevice() ? mobileSpeechService : speechService;
        await service.initialize();

        // Set default voice
        const voices = window.speechSynthesis.getVoices();
        const defaultVoice = voices.find(v => 
          v.name.toLowerCase().includes('daniel') && 
          v.lang === 'en-GB'
        ) || voices.find(v => v.lang === 'en-GB') || voices[0];

        if (defaultVoice) {
          await updateTTSProvider({
            name: 'browser',
            enabled: true,
            selectedVoiceId: defaultVoice.voiceURI,
            selectedLocale: defaultVoice.lang
          });
        }

        // Immediately set initializing to false after database and speech are ready
        setIsInitializing(false);
      } catch (error) {
        console.error('Failed to initialize:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize application');
        setIsInitializing(false);
      }
    };

    init();

    return () => {
      audioService.cleanup();
    };
  }, [updateTTSProvider]);

  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileNavOpen]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading application...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-50 dark:bg-red-900 p-6 rounded-lg max-w-md w-full">
          <h1 className="text-red-800 dark:text-red-200 text-xl font-semibold mb-2">
            Initialization Error
          </h1>
          <p className="text-red-700 dark:text-red-300">
            {initError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 h-16 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 md:hidden z-30 flex items-center px-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsMobileNavOpen(true)}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <Link to="/" className="flex items-center space-x-2">
                <ShipWheel size={22} className="text-primary" />
                <span className="text-base font-semibold text-primary">
                  Metta Voice
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />

        {/* Desktop Navigation */}
        <nav 
          className="fixed top-4 left-4 w-20 hover:w-64 h-[calc(100vh-2rem)] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-lg transition-all duration-300 ease-in-out z-40 group hidden md:block rounded-2xl"
          role="navigation" 
          aria-label="Main navigation"
        >
          <div className="flex flex-col h-full py-8">
            <div className="flex items-center px-6 mb-8">
              <Link
                to="/"
                className="flex items-center space-x-3 text-primary hover:text-primary-hover transition-all duration-300"
                aria-label="Metta Voice Home"
              >
                <ShipWheel size={28} aria-hidden="true" className="min-w-[28px] text-primary transition-transform duration-300 hover:scale-110" />
                <span className="text-lg font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-20px] group-hover:translate-x-0 whitespace-nowrap text-primary">
                  Metta Voice
                </span>
              </Link>
            </div>

            <div className="flex-1 py-4 space-y-2">
              <NavLink to="/" icon={BookOpen}>Reader</NavLink>
              <NavLink to="/timer" icon={TimerIcon}>Timer</NavLink>
              <NavLink to="/settings" icon={Settings2}>Settings</NavLink>
              <NavLink to="/support" icon={Heart}>Support</NavLink>
              <NavLink to="/about" icon={Info}>About</NavLink>
            </div>
          </div>
        </nav>

        <main className="transition-[margin-left] duration-300 ease-in-out md:ml-32 pt-16 md:pt-4">
          <div className="p-4 lg:p-6 md:pt-0">
            <div className="max-w-4xl mx-auto">
              <ErrorBoundary>
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={<SuttaReader />} />
                    <Route path="/timer" element={<Timer />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/about" element={<About />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        </main>

        <style>
          {`
            @media (min-width: 768px) {
              nav:hover ~ main {
                margin-left: 17rem;
              }
            }
          `}
        </style>
      </div>
    </Router>
  );
};

export default App;