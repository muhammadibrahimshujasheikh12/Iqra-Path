
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Play, Pause, Settings, Bookmark, 
  AlertCircle, Volume2, Sparkles, Loader2, Copy, Check, Globe,
  Layout, BookOpen, Eye, EyeOff, Maximize2, Compass, ArrowDown, Languages,
  BookText
} from 'lucide-react';
import { fetchSurahDetail, saveReadingProgress, AVAILABLE_TRANSLATIONS } from '../services/quranService';
import { getGeminiResponse } from '../services/gemini';
import { Surah, Ayah } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';

type ViewMode = 'study' | 'sanctuary' | 'mushaf';

const EXTENDED_RECITERS = [
  { identifier: 'ar.alafasy', name: 'Mishary Alafasy' },
  { identifier: 'ar.yasseraldossari', name: 'Yasser Al-Dosari' },
  { identifier: 'ar.sudais', name: 'Abdur-Rahman as-Sudais' },
  { identifier: 'ar.mahermuaiqly', name: 'Maher Al-Muaiqly' },
  { identifier: 'ar.husary', name: 'Mahmoud Al-Husary' },
];

const AI_LANGUAGES = [
  { code: 'English', name: 'English' },
  { code: 'Arabic', name: 'Arabic (العربية)' },
  { code: 'Urdu', name: 'Urdu (اردو)' },
  { code: 'Indonesian', name: 'Indonesian (Bahasa Indonesia)' },
  { code: 'French', name: 'French (Français)' },
  { code: 'Turkish', name: 'Turkish (Türkçe)' },
];

const EVERY_AYAH_MAPPING: Record<string, string> = {
  'ar.alafasy': 'Alafasy_128kbps',
  'ar.yasseraldossari': 'Yasser_Ad-Dussary_128kbps',
  'ar.sudais': 'Abdurrahmaan_As-Sudais_192kbps',
  'ar.mahermuaiqly': 'MaherAlMuaiqly128kbps',
  'ar.husary': 'Husary_128kbps',
};

const pad3 = (n: number) => n.toString().padStart(3, '0');

export default function QuranReaderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{ surah: Surah; ayahs: Ayah[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View States
  const [viewMode, setViewMode] = useState<ViewMode>(() => (localStorage.getItem('pref_view_mode') as ViewMode) || 'study');
  const [fontSize, setFontSize] = useState(42);
  const [showSettings, setShowSettings] = useState(false);
  const [scrolledIndex, setScrolledIndex] = useState(0);
  const [hijriDate, setHijriDate] = useState<string>("");
  
  // Preferences
  const [reciter, setReciter] = useState(() => localStorage.getItem('pref_quran_reciter') || 'ar.alafasy');
  const [translation, setTranslation] = useState(() => localStorage.getItem('pref_quran_translation') || 'en.sahih');
  const [aiLanguage, setAiLanguage] = useState(() => localStorage.getItem('pref_quran_ai_lang') || 'English');
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  
  // Audio Preferences
  const [playTranslationAudio, setPlayTranslationAudio] = useState(false);

  // Content States
  const [expandedTafseer, setExpandedTafseer] = useState<number | null>(null);
  const [tafseerCache, setTafseerCache] = useState<Record<string, string>>({});
  const [loadingTafseer, setLoadingTafseer] = useState(false);

  // Audio States
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [speakingTranslationAyah, setSpeakingTranslationAyah] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const activeTranslationDetails = AVAILABLE_TRANSLATIONS.find(t => t.id === translation) || AVAILABLE_TRANSLATIONS[0];

  useEffect(() => {
    const savedBookmarks = localStorage.getItem('quran_bookmarks');
    if (savedBookmarks) setBookmarks(new Set(JSON.parse(savedBookmarks)));
    
    // Set Hijri Date
    try {
        const date = new Date();
        const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        setHijriDate(formatter.format(date));
    } catch (e) {
        console.error("Date formatting error", e);
        setHijriDate("Hijri Date Unavailable");
    }

    const handleScroll = () => {
        const elements = document.querySelectorAll('.ayah-node');
        let closest = 0;
        let minDistance = Infinity;
        elements.forEach((el, idx) => {
            const rect = el.getBoundingClientRect();
            const dist = Math.abs(rect.top - 200);
            if (dist < minDistance) {
                minDistance = dist;
                closest = idx;
            }
        });
        setScrolledIndex(closest);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
        window.removeEventListener('scroll', handleScroll);
        if (audioRef.current) audioRef.current.pause();
        window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    loadSurah();
  }, [id, reciter, translation]);

  const loadSurah = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchSurahDetail(parseInt(id), reciter, translation);
      setData(detail);
      saveReadingProgress(detail.surah.number, detail.surah.englishName, 1);
    } catch (e) { 
      setError("Unable to retrieve Surah.");
    } finally { 
      setLoading(false); 
    }
  };

  const changeViewMode = (mode: ViewMode) => {
      setViewMode(mode);
      localStorage.setItem('pref_view_mode', mode);
  };

  const handleTranslationChange = (newId: string) => {
      setTranslation(newId);
      localStorage.setItem('pref_quran_translation', newId);
  };

  // Logic to play recitation -> then TTS translation -> then next ayah
  const playArabicAudio = (idx: number) => {
    // 1. Reset current playback
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }
    window.speechSynthesis.cancel();
    setSpeakingTranslationAyah(null);

    // Toggle off if already playing the same index
    if (playingAyah === idx) {
        setPlayingAyah(null);
        return;
    }

    if (!data?.ayahs[idx]) {
        setPlayingAyah(null);
        return; // End of Surah
    }

    // 2. Setup Arabic Audio
    const surahNum = data.surah.number;
    const ayahNumInSurah = data.ayahs[idx].numberInSurah;
    const everyAyahSlug = EVERY_AYAH_MAPPING[reciter];
    const src = `https://everyayah.com/data/${everyAyahSlug || 'Alafasy_128kbps'}/${pad3(surahNum)}${pad3(ayahNumInSurah)}.mp3`;

    const audio = new Audio(src);
    audioRef.current = audio;
    
    // 3. Handle End of Arabic Audio
    audio.onended = () => {
        if (playTranslationAudio && data.ayahs[idx].translation) {
            // Play TTS Translation
            setSpeakingTranslationAyah(idx);
            
            const utterance = new SpeechSynthesisUtterance(data.ayahs[idx].translation || "");
            utterance.lang = activeTranslationDetails.lang;
            utterance.rate = 0.9;
            
            utterance.onend = () => {
                setSpeakingTranslationAyah(null);
                // Proceed to next ayah
                playArabicAudio(idx + 1);
            };
            
            utterance.onerror = () => {
                // If TTS fails, skip to next
                setSpeakingTranslationAyah(null);
                playArabicAudio(idx + 1);
            };

            window.speechSynthesis.speak(utterance);
        } else {
            // No TTS, just go to next ayah
            playArabicAudio(idx + 1);
        }
    };

    // 4. Start Playback
    audio.play().then(() => {
        setPlayingAyah(idx);
        // Auto-scroll logic with delay to ensure rendering catches up if layout shifts
        setTimeout(() => {
            const element = document.getElementById(`ayah-${idx}`);
            if (element) {
                element.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
            }
        }, 100);
    }).catch(e => {
        console.error("Audio playback error", e);
        setPlayingAyah(null);
    });
  };

  const toggleTafseer = async (idx: number, ayahNumInSurah: number) => {
    if (expandedTafseer === idx) {
        setExpandedTafseer(null);
        return;
    }
    setExpandedTafseer(idx);
    const cacheKey = `${idx}-${aiLanguage}`;
    if (tafseerCache[cacheKey]) return;

    if (!data) return;
    setLoadingTafseer(true);
    
    try {
        const prompt = `Provide a spiritually uplifting Tafseer and life lesson for Surah ${data.surah.englishName}, Ayah ${ayahNumInSurah}. Language: ${aiLanguage}. Max 100 words. Plain text.`;
        const text = await getGeminiResponse(prompt);
        setTafseerCache(prev => ({ ...prev, [cacheKey]: text }));
    } catch (e) {
        setTafseerCache(prev => ({ ...prev, [cacheKey]: "Divine wisdom is currently unreachable. Check your connection." }));
    } finally {
        setLoadingTafseer(false);
    }
  };

  const toggleBookmark = (surahNum: number, ayahNumInSurah: number) => {
    const key = `${surahNum}:${ayahNumInSurah}`;
    const newBookmarks = new Set(bookmarks);
    if (newBookmarks.has(key)) newBookmarks.delete(key);
    else newBookmarks.add(key);
    setBookmarks(newBookmarks);
    localStorage.setItem('quran_bookmarks', JSON.stringify([...newBookmarks]));
  };

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
      <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37] animate-pulse">Illuminating Pages...</p>
    </div>
  );

  if (error || !data) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
       <AlertCircle size={48} className="text-red-500/30" />
       <p className="text-gray-400 font-light text-sm">{error || "The link to the sacred library is broken."}</p>
       <button onClick={loadSurah} className="px-8 py-3 bg-[#D4AF37] text-black rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">Reconnect</button>
    </div>
  );

  const progressPercent = Math.round(((scrolledIndex + 1) / data.ayahs.length) * 100);

  return (
    <div className={`relative pb-80 animate-enter transition-all duration-700 ${viewMode === 'sanctuary' ? 'max-w-6xl' : 'max-w-4xl'} mx-auto px-4`}>
      
      {/* Floating Dynamic Header - Sticky */}
      <div className="sticky top-4 md:top-20 z-50 mb-8 md:mb-12 flex items-center justify-between bg-[#050505]/80 backdrop-blur-2xl px-4 md:px-6 py-3 md:py-4 rounded-[2rem] border border-white/5 shadow-2xl transition-all hover:border-[#D4AF37]/30">
         <div className="flex items-center gap-3 md:gap-5">
             <button onClick={() => navigate('/quran')} className="w-8 h-8 md:w-10 md:h-10 rounded-full glass flex items-center justify-center text-gray-400 hover:text-white transition-all"><ChevronLeft size={20} /></button>
             <div className="space-y-0.5 md:space-y-1">
                <h2 className="font-cinzel font-black text-white text-base md:text-lg tracking-widest leading-none uppercase">{data.surah.englishName}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                   <p className="text-[8px] md:text-[9px] text-[#D4AF37] font-black uppercase tracking-widest">{data.surah.englishNameTranslation}</p>
                   <span className="w-1 h-1 rounded-full bg-gray-700 hidden md:block"></span>
                   <p className="text-[8px] md:text-[9px] text-gray-500 font-bold uppercase tracking-widest hidden md:block">{data.surah.numberOfAyahs} Verses</p>
                   {/* Hijri Date Display */}
                   <span className="w-1 h-1 rounded-full bg-gray-700 hidden md:block"></span>
                   <p className="text-[8px] md:text-[9px] text-gray-400 font-black uppercase tracking-widest">{hijriDate}</p>
                </div>
             </div>
         </div>
         
         <div className="flex items-center gap-3 md:gap-4">
             {/* Progress Capsule - Hidden on small mobile */}
             <div className="hidden md:flex items-center gap-4 px-5 py-2.5 rounded-full bg-white/5 border border-white/5">
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4AF37] transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <span className="text-[10px] font-black text-[#D4AF37] tabular-nums">{progressPercent}%</span>
             </div>

             <button 
                onClick={() => setShowSettings(!showSettings)} 
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${showSettings ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'glass text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/30'}`}
             >
                <Settings size={18} className={showSettings ? 'animate-spin-slow' : ''} />
             </button>
         </div>

         {/* Advanced Settings Panel */}
         {showSettings && (
            <div className="absolute top-16 md:top-20 right-0 w-[85vw] max-w-xs md:w-80 bg-[#0a0a0a] border border-[#D4AF37]/20 rounded-[2.5rem] shadow-2xl overflow-hidden animate-enter origin-top-right z-[60] p-6 md:p-8 space-y-8 backdrop-blur-3xl">
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Reading Mode</h4>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'study', label: 'Study', icon: <BookOpen size={14} /> },
                            { id: 'sanctuary', label: 'Sanctuary', icon: <Compass size={14} /> },
                            { id: 'mushaf', label: 'Mushaf', icon: <Maximize2 size={14} /> }
                        ].map(mode => (
                            <button 
                                key={mode.id}
                                onClick={() => changeViewMode(mode.id as ViewMode)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${viewMode === mode.id ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-lg scale-105' : 'bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}
                            >
                                {mode.icon}
                                <span className="text-[8px] font-black uppercase">{mode.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between text-[9px] font-black uppercase text-gray-500">
                        <span>Script Size</span>
                        <span className="text-[#D4AF37]">{fontSize}px</span>
                    </div>
                    <input type="range" min="24" max="64" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1 bg-gray-800 rounded-full appearance-none cursor-pointer accent-[#D4AF37]" />
                </div>

                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Scholar Preferences</h4>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-[8px] font-bold text-gray-600 uppercase ml-2">Divine Voice</label>
                            <select value={reciter} onChange={(e) => setReciter(e.target.value)} className="w-full bg-[#111] border border-white/5 text-xs text-white p-3 rounded-xl outline-none focus:border-[#D4AF37]/50">
                                {EXTENDED_RECITERS.map(r => <option key={r.identifier} value={r.identifier}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] font-bold text-gray-600 uppercase ml-2">Translation Language</label>
                            <select value={translation} onChange={(e) => handleTranslationChange(e.target.value)} className="w-full bg-[#111] border border-white/5 text-xs text-white p-3 rounded-xl outline-none focus:border-[#D4AF37]/50">
                                {AVAILABLE_TRANSLATIONS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        
                        {/* Audio Settings */}
                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Read Translation</span>
                            <button 
                                onClick={() => setPlayTranslationAudio(!playTranslationAudio)}
                                className={`w-8 h-4 rounded-full relative transition-all ${playTranslationAudio ? 'bg-[#D4AF37]' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${playTranslationAudio ? 'left-4.5' : 'left-0.5'}`}></div>
                            </button>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[8px] font-bold text-gray-600 uppercase ml-2">Noor AI Language</label>
                            <select value={aiLanguage} onChange={(e) => setAiLanguage(e.target.value)} className="w-full bg-[#111] border border-white/5 text-xs text-white p-3 rounded-xl outline-none focus:border-[#D4AF37]/50">
                                {AI_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
         )}
      </div>

      {/* Bismillah Header */}
      {data.surah.number !== 1 && data.surah.number !== 9 && (
         <div className="text-center py-8 md:py-16 animate-enter">
            <p className="font-arabic text-3xl md:text-4xl text-[#D4AF37] gold-shimmer opacity-80 leading-loose">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
         </div>
      )}

      {/* Main Reading Flow */}
      <div className={`space-y-8 md:space-y-12 transition-all duration-500 ${viewMode === 'mushaf' ? 'text-center' : ''}`}>
         {data.ayahs.map((ayah, idx) => {
            const isBookmarked = bookmarks.has(`${data.surah.number}:${ayah.numberInSurah}`);
            const isTafseerOpen = expandedTafseer === idx;
            const isPlaying = playingAyah === idx;
            const isSpeakingTranslation = speakingTranslationAyah === idx;
            const tafseerText = tafseerCache[`${idx}-${aiLanguage}`];
            
            // Adjust base font size for mobile
            const effectiveFontSize = window.innerWidth < 768 ? Math.max(24, fontSize - 8) : fontSize;
            
            return (
              <div 
                key={ayah.number} 
                id={`ayah-${idx}`}
                className={`ayah-node group relative transition-all duration-700 ${
                    viewMode === 'sanctuary' ? 'py-16 md:py-32' : 'p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] bg-[#080808]/50 border border-white/5 hover:border-[#D4AF37]/20 shadow-2xl'
                } ${isPlaying ? 'ring-1 ring-[#D4AF37]/40 bg-[#0c0c0c]' : isSpeakingTranslation ? 'ring-1 ring-blue-500/40 bg-[#0c0c0c]' : ''}`}
              >
                 {/* Metadata Badge */}
                 <div className={`flex items-center gap-4 mb-6 md:mb-10 ${viewMode === 'mushaf' || viewMode === 'sanctuary' ? 'justify-center' : 'justify-start'}`}>
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-mono font-bold ${isPlaying ? 'text-[#D4AF37] border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.2)]' : isSpeakingTranslation ? 'text-blue-500 border-blue-500/40' : 'text-gray-600'}`}>
                        {ayah.numberInSurah}
                    </div>
                    {isBookmarked && <div className="text-red-500 animate-pulse"><Bookmark size={12} fill="currentColor" /></div>}
                 </div>

                 {/* Visual Hierarchy Switcher */}
                 <div className="space-y-6 md:space-y-10">
                    <p 
                      className={`font-arabic transition-all duration-700 leading-[2] text-white select-text ${
                        viewMode === 'sanctuary' ? 'text-center' : viewMode === 'mushaf' ? 'text-center' : 'text-right'
                      } ${isPlaying ? 'text-[#D4AF37]' : ''}`}
                      style={{ fontSize: `${viewMode === 'sanctuary' ? effectiveFontSize * 1.2 : effectiveFontSize}px` }}
                    >
                      {ayah.text}
                    </p>

                    {(viewMode === 'study' || viewMode === 'mushaf') && (
                        <p 
                            className={`font-light leading-loose max-w-2xl transition-all duration-500 ${viewMode === 'mushaf' ? 'text-xs text-gray-700 italic mx-auto' : 'text-sm md:text-base ml-auto md:ml-0'} ${isSpeakingTranslation ? 'text-blue-400' : 'text-gray-500'}`}
                            dir={activeTranslationDetails.dir}
                        >
                           {ayah.translation}
                        </p>
                    )}
                 </div>

                 {/* Control Ribbon */}
                 <div className={`flex items-center gap-4 md:gap-6 pt-8 md:pt-12 ${viewMode === 'mushaf' || viewMode === 'sanctuary' ? 'justify-center' : 'justify-center md:justify-start'}`}>
                    <button 
                        onClick={() => playArabicAudio(idx)}
                        className={`p-3 md:p-4 rounded-full transition-all ${isPlaying ? 'bg-[#D4AF37] text-black shadow-lg scale-110' : 'glass text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/40'}`}
                    >
                        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    </button>
                    
                    <button 
                        onClick={() => toggleTafseer(idx, ayah.numberInSurah)}
                        className={`p-3 md:p-4 rounded-full transition-all ${isTafseerOpen ? 'bg-blue-600 text-white shadow-lg' : 'glass text-gray-400 hover:text-blue-400 hover:border-blue-400/40'}`}
                    >
                        <BookText size={18} />
                    </button>

                    <button 
                        onClick={() => toggleBookmark(data.surah.number, ayah.numberInSurah)}
                        className={`p-3 md:p-4 rounded-full transition-all ${isBookmarked ? 'bg-red-500/10 text-red-500 border-red-500/40' : 'glass text-gray-400 hover:text-red-500'}`}
                    >
                        <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
                    </button>
                 </div>

                 {/* AI Tafseer Panel */}
                 {isTafseerOpen && (
                    <div className="mt-8 md:mt-12 animate-enter bg-[#0a0a0a] border border-[#D4AF37]/20 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Sparkles size={100} /></div>
                        
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                <div className="p-3 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl"><Sparkles size={20} /></div>
                                <h4 className="text-sm font-cinzel font-black text-white uppercase tracking-widest">Noor AI Tafseer</h4>
                            </div>
                            
                            {loadingTafseer && !tafseerText ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-4">
                                    <Loader2 className="animate-spin text-[#D4AF37]" size={32} />
                                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-gray-500">Contemplating Wisdom...</p>
                                </div>
                            ) : (
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-gray-300 font-light leading-loose text-sm md:text-lg">{tafseerText}</p>
                                    <div className="mt-6 flex justify-end">
                                        <button 
                                            onClick={() => navigator.clipboard.writeText(tafseerText)}
                                            className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors"
                                        >
                                            <Copy size={12} /> Copy Reflection
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                 )}
              </div>
            );
         })}
      </div>
    </div>
  );
}
