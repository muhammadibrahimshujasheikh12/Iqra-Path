import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, BookOpen, Clock, Activity, BookCheck, Users, 
  Loader2, DollarSign, Moon, MapPin, History, 
  Bot, LayoutGrid, Sparkles, X, Fingerprint, ShieldCheck
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './supabase';
import { Session } from '@supabase/supabase-js';

// Components
import Logo from './components/Logo';

// Pages
import HomePage from './pages/HomePage';
import QuranPage from './pages/QuranPage';
import QuranReaderPage from './pages/QuranReaderPage';
import PrayerPage from './pages/PrayerPage';
import TrackerPage from './pages/TrackerPage';
import KnowledgeHub from './pages/KnowledgeHub';
import AIAssistant from './pages/AIAssistant';
import ZakatPage from './pages/ZakatPage';
import RamadanPage from './pages/RamadanPage';
import SocialPage from './pages/SocialPage';
import MasjidLocatorPage from './pages/MasjidLocatorPage';
import SirahPage from './pages/SirahPage';
import HafizAIPage from './pages/HafizAIPage';
import TasbihPage from './pages/TasbihPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import Footer from './Footer';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  
  const [authLoading, setAuthLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState<string>('U');
  const [showMenu, setShowMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const splashTimer = setTimeout(() => setShowSplash(false), 2500);

    const initAuth = async () => {
        try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession);
            if (currentSession?.user) {
                await fetchUserProfile(currentSession.user.id);
                if (currentSession.user.email === 'iqrapathoffical@gmail.com') setIsAdmin(true);
            }
        } catch (err) { setSession(null); } finally { setAuthLoading(false); }
    };

    const fetchUserProfile = async (userId: string) => {
        if (!isSupabaseConfigured()) return;
        try {
            const { data } = await supabase.from('profiles').select('avatar_url, full_name, username').eq('id', userId).single();
            if (data) {
                setUserAvatar(data.avatar_url);
                const name = data.full_name || data.username || 'User';
                setUserInitial(name.charAt(0).toUpperCase());
            }
        } catch (e) { console.error(e); }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
          fetchUserProfile(newSession.user.id);
          setIsAdmin(newSession.user.email === 'iqrapathoffical@gmail.com');
      } else { 
          setUserAvatar(null); 
          setUserInitial('U'); 
          setIsAdmin(false);
      }
    });

    return () => {
        subscription.unsubscribe();
        clearTimeout(splashTimer);
        clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (authLoading || showSplash) return;
    const isPublicRoute = ['/login', '/signup', '/forgot-password', '/reset-password', '/privacy', '/terms'].includes(location.pathname);
    if (!session && !isPublicRoute) {
      navigate('/login', { replace: true });
    } else if (session && (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password')) {
      navigate('/', { replace: true });
    }
  }, [session, authLoading, showSplash, location.pathname]);

  useEffect(() => {
      setShowMenu(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center overflow-hidden">
         <div className="absolute inset-0 bg-[#D4AF37]/5 animate-pulse-slow"></div>
         <div className="relative z-10 animate-logo-bloom">
             <Logo size="xl" className="shimmer-logo" />
         </div>
         <style>{`
            .animate-logo-bloom { animation: logoBloom 2.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
            @keyframes logoBloom { 0% { opacity: 0; transform: scale(0.8); filter: blur(10px); } 40% { opacity: 1; transform: scale(1); filter: blur(0); } 80% { opacity: 1; transform: scale(1); filter: blur(0); } 100% { opacity: 0; transform: scale(1.1); filter: blur(15px); } }
            .shimmer-logo { mask-image: linear-gradient(-75deg, rgba(0,0,0,0.6) 30%, #000 50%, rgba(0,0,0,0.6) 70%); mask-size: 200%; animation: shine 2s infinite linear; }
            @keyframes shine { from { mask-position: 150%; } to { mask-position: -50%; } }
            .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.1; } }
         `}</style>
      </div>
    );
  }

  const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(location.pathname);

  const mainNav = [
    { id: '', label: 'Home', icon: <Home /> },
    { id: 'quran', label: 'Quran', icon: <BookOpen /> },
    { id: 'prayer', label: 'Prayer', icon: <Clock /> },
    { id: 'ai', label: 'Noor', icon: <Sparkles /> },
    { id: 'tracker', label: 'Sacred', icon: <Activity /> },
  ];

  const menuItems = [
      { id: 'knowledge', label: 'Knowledge', icon: <BookCheck /> },
      { id: 'zakat', label: 'Zakat', icon: <DollarSign /> },
      { id: 'ramadan', label: 'Ramadan', icon: <Moon /> },
      { id: 'social', label: 'Social', icon: <Users /> },
      { id: 'masjid', label: 'Masjid', icon: <MapPin /> },
      { id: 'sirah', label: 'Sirah', icon: <History /> },
      { id: 'hafiz-ai', label: 'Hafiz AI', icon: <Bot /> },
      { id: 'tasbih', label: 'Tasbih', icon: <Fingerprint /> },
  ];

  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden bg-[#050505] selection:bg-[#D4AF37] selection:text-black">
      
      {showMenu && (
          <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl animate-enter overflow-y-auto pt-[env(safe-area-inset-top)]">
              <div className="max-w-7xl mx-auto p-6 md:p-12 pb-40">
                  <div className="flex items-center justify-between mb-12">
                      <h2 className="text-2xl md:text-4xl font-cinzel font-black text-white uppercase tracking-widest">Sanctuary Menu</h2>
                      <button onClick={() => setShowMenu(false)} className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white"><X size={24} /></button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {menuItems.map((item) => (
                          <button 
                            key={item.id} 
                            onClick={() => navigate(`/${item.id}`)}
                            className="group flex flex-col items-center justify-center gap-4 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-[#D4AF37]/30 transition-all active:scale-95"
                          >
                              <div className="w-14 h-14 rounded-2xl bg-black border border-white/10 flex items-center justify-center text-gray-500 group-hover:text-[#D4AF37] transition-all">
                                  {React.cloneElement(item.icon as React.ReactElement<any>, { size: 24, strokeWidth: 1.5 })}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white">{item.label}</span>
                          </button>
                      ))}
                      {isAdmin && (
                          <button onClick={() => navigate('/admin')} className="group flex flex-col items-center justify-center gap-4 p-8 rounded-[2.5rem] bg-red-900/5 border border-red-500/20 hover:border-red-500/50 transition-all active:scale-95">
                              <div className="w-14 h-14 rounded-2xl bg-black border border-red-500/10 flex items-center justify-center text-red-500/50 group-hover:text-red-500 transition-all">
                                  <ShieldCheck size={24} strokeWidth={1.5} />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 group-hover:text-red-500">Admin Panel</span>
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {!isAuthPage && (
        <header className="fixed top-0 w-full z-50 transition-all duration-300 backdrop-blur-md bg-[#050505]/40 border-b border-white/5 pt-[env(safe-area-inset-top)]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-24 flex items-center justify-between">
            <div className="cursor-pointer group flex items-center gap-4" onClick={() => navigate('/')}>
               <Logo size="sm" className="scale-75 md:scale-100 group-hover:scale-[1.02] transition-transform" />
               <div className="hidden lg:block h-8 w-px bg-white/10 mx-2"></div>
               <div className="hidden lg:block text-left">
                  <span className="text-[#D4AF37] font-mono text-sm font-bold tracking-widest block leading-none">
                      {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                  <span className="text-[7px] text-gray-600 uppercase font-black tracking-widest mt-1">Local Time</span>
               </div>
            </div>
            <div className="flex items-center gap-4 md:gap-8">
              <button onClick={() => navigate('/profile')} className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 flex items-center justify-center text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all overflow-hidden bg-black shadow-lg">
                  {userAvatar ? <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" /> : <span className="font-cinzel font-bold text-sm">{userInitial}</span>}
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={`flex-1 w-full mx-auto ${
        !isAuthPage ? 'pt-20 md:pt-32 pb-28 md:pb-40 px-4 md:px-8 max-w-7xl' : ''
      }`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/quran" element={<QuranPage />} />
          <Route path="/quran/:id" element={<QuranReaderPage />} />
          <Route path="/prayer" element={<PrayerPage />} />
          <Route path="/tracker" element={<TrackerPage />} />
          <Route path="/knowledge" element={<KnowledgeHub />} />
          <Route path="/ai" element={<AIAssistant />} />
          <Route path="/zakat" element={<ZakatPage />} />
          <Route path="/ramadan" element={<RamadanPage />} />
          <Route path="/social" element={<SocialPage />} />
          <Route path="/masjid" element={<MasjidLocatorPage />} />
          <Route path="/sirah" element={<SirahPage />} />
          <Route path="/hafiz-ai" element={<HafizAIPage />} />
          <Route path="/tasbih" element={<TasbihPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </main>

      {!isAuthPage && <Footer />}

      {!isAuthPage && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[92vw] max-w-2xl px-2 pb-[env(safe-area-inset-bottom)]">
          <div className="glass-nav rounded-full p-1.5 md:p-2 flex items-center justify-between shadow-2xl border border-white/10">
            {mainNav.map((item) => {
              const isActive = (item.id === '' && location.pathname === '/') || location.pathname === `/${item.id}`;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/${item.id}`)}
                  className={`relative group flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-300 ${
                    isActive ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  aria-label={item.label}
                >
                  {React.cloneElement(item.icon as React.ReactElement<any>, { size: 20, strokeWidth: isActive ? 2.5 : 1.5 })}
                  <span className="hidden md:block absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-black border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              );
            })}
            <div className="w-px h-6 bg-white/10 mx-2"></div>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-300 ${
                showMenu ? 'bg-white text-black scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              aria-label="Menu"
            >
              <LayoutGrid size={20} strokeWidth={showMenu ? 2.5 : 1.5} />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

const App: React.FC = () => { return ( <Router> <AppContent /> </Router> ); };

export default App;