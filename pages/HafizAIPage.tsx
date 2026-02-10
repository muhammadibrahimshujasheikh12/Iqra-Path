import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Mic, Sparkles, Loader2, Star, 
  Eye, EyeOff, BrainCircuit, 
  RotateCcw, X, Search,
  Book as BookIcon, ShieldAlert, AlertCircle, RefreshCw, Square
} from 'lucide-react';
import { playPCMData, getGeminiResponse, getGeminiVoiceResponse } from '../services/gemini';
import { fetchSurahDetail, fetchSurahs } from '../services/quranService';
import { supabase, isSupabaseConfigured } from '../supabase';
import { Profile, Surah, Ayah } from '../types';

const normalizeArabic = (text: string) => {
  return text.replace(/[\u064B-\u0652]/g, "").replace(/\s+/g, " ").trim();
};

const HafizAIPage: React.FC = () => {
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(() => {
    return sessionStorage.getItem('hafiz_disclaimer_accepted') === 'true';
  });
  const [isFocusMode, setIsFocusMode] = useState(false); 
  const [showAyat, setShowAyat] = useState(true);
  const [currentSurah, setCurrentSurah] = useState({ name: "Al-Fatiha", number: 1 });
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hifzScore, setHifzScore] = useState<number | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [allSurahs, setAllSurahs] = useState<Surah[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const sessionRef = useRef(0);

  const currentAyah = ayahs[currentAyahIndex];
  const ayahWords = useMemo(() => {
    // Fixed: replaced incorrect reference 'currentAyat' with the correct 'currentAyah'
    if (!currentAyah) return [];
    return currentAyah.text.split(' ');
  }, [currentAyah]);

  const matchedWordIndices = useMemo(() => {
    if (!transcript || !currentAyah) return new Set<number>();
    const normTranscript = normalizeArabic(transcript);
    const indices = new Set<number>();
    ayahWords.forEach((word, idx) => {
      const normWord = normalizeArabic(word);
      if (normTranscript.includes(normWord)) indices.add(idx);
    });
    return indices;
  }, [transcript, ayahWords, currentAyah]);

  useEffect(() => {
    loadInitialData();
    return () => stopEverything();
  }, []);

  const stopEverything = () => {
      sessionRef.current += 1;
      if (recognitionRef.current) recognitionRef.current.stop();
      if (audioSourceRef.current) {
          try { audioSourceRef.current.stop(); } catch(e) {}
          audioSourceRef.current = null;
      }
      setIsListening(false);
      setIsSpeaking(false);
      setIsProcessing(false);
  };

  const loadInitialData = async () => {
    try {
      const surahs = await fetchSurahs();
      setAllSurahs(surahs);
      if (isSupabaseConfigured()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (data) setUserProfile(data);
        }
      }
      loadSurahContent(1);
    } catch (e) { console.error(e); }
  };

  const loadSurahContent = async (number: number) => {
    stopEverything();
    setHifzScore(null);
    setTranscript('');
    setCurrentAyahIndex(0);
    setIsProcessing(true);
    try {
      const data = await fetchSurahDetail(number);
      if (data && data.ayahs.length > 0) {
        setAyahs(data.ayahs);
        setCurrentSurah({ name: data.surah.englishName || "Surah", number: data.surah.number });
      }
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const startReciting = () => {
    stopEverything();
    initAudio();
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'ar-SA';
    recognitionRef.current.interimResults = true;
    recognitionRef.current.continuous = false; 
    recognitionRef.current.onstart = () => { setIsListening(true); setTranscript(''); setHifzScore(null); setIsQuotaExceeded(false); };
    recognitionRef.current.onresult = (event: any) => { const current = Array.from(event.results).map((result: any) => result[0].transcript).join(' '); setTranscript(current); };
    recognitionRef.current.onend = () => { setIsListening(false); setTimeout(() => { if (transcript.trim().length > 2) processInput(transcript); }, 100); };
    try { recognitionRef.current.start(); } catch(e) { setIsListening(false); }
  };

  const processInput = async (text: string) => {
    const currentSession = sessionRef.current;
    setIsProcessing(true);
    try {
      const prompt = `Compare recitation: "${text}" with verse: "${currentAyah.text}". Score 0-100 based on accuracy. Provide 5-word warm English feedback. JSON: {"score": number, "feedback": "text"}.`;
      const response = await getGeminiResponse(prompt, "Hafiz Evaluation Engine", "application/json");
      if (response.startsWith("QUOTA_EXCEEDED")) { setIsQuotaExceeded(true); return; }
      if (sessionRef.current !== currentSession) return;
      const result = JSON.parse(response || '{"score": 0, "feedback": "Try again."}');
      setHifzScore(result.score);
      const base64Audio = await getGeminiVoiceResponse(result.feedback, "Hafiz Feedback", "en-US");
      if (sessionRef.current !== currentSession) return;
      if (base64Audio === "QUOTA_EXCEEDED") { setIsQuotaExceeded(true); } 
      else if (base64Audio && audioContextRef.current) {
        setIsSpeaking(true);
        const source = await playPCMData(base64Audio, audioContextRef.current, () => {
            if (sessionRef.current === currentSession) {
                setIsSpeaking(false);
                if (result.score > 80 && currentAyahIndex < ayahs.length - 1) {
                    setCurrentAyahIndex(prev => prev + 1);
                    setTranscript('');
                    setHifzScore(null);
                }
            }
        });
        if(source) audioSourceRef.current = source;
      }
    } catch (e) { console.error(e); } finally { if (sessionRef.current === currentSession) setIsProcessing(false); }
  };

  const acceptDisclaimer = () => { setHasAcceptedDisclaimer(true); sessionStorage.setItem('hafiz_disclaimer_accepted', 'true'); };
  const filteredSurahs = allSurahs.filter(s => s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) || s.number.toString().includes(searchQuery));

  return (
    <div className="flex flex-col min-h-[calc(100dvh-120px)] md:min-h-[calc(100vh-140px)] items-center pt-4 md:pt-8 pb-40 relative overflow-hidden px-4 animate-enter">
      <div className="absolute inset-0 bg-[#050505]"></div>
      
      {!hasAcceptedDisclaimer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 sm:p-6">
          <div className="w-full max-w-xl bg-[#0c0c0c] border border-[#D4AF37]/40 rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-8 md:space-y-10">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-xl">
                <ShieldAlert size={32} md:size={48} />
              </div>
              <div className="space-y-4 md:space-y-6 px-2">
                <h3 className="font-cinzel text-xl md:text-3xl font-black text-white uppercase tracking-widest leading-none">Hifz <span className="text-red-500">Companion</span></h3>
                <p className="text-xs md:text-sm text-gray-400 font-light leading-relaxed">
                  As-salāmu ʿalaykum. This AI system is strictly a <span className="text-white font-bold">memory assistance tool</span>. It does <span className="text-red-500 font-black uppercase">NOT</span> replace a qualified <span className="text-[#D4AF37] font-bold">Qari</span>.
                </p>
              </div>
              <button onClick={acceptDisclaimer} className="w-full py-4 md:py-6 bg-[#D4AF37] text-black rounded-[1.2rem] md:rounded-2xl font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-[10px] md:text-xs shadow-xl hover:scale-105 active:scale-95 transition-all">I Understand</button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl flex justify-between items-center z-30 mb-6 md:mb-8 gap-4 px-1 md:px-2">
        <div className="flex items-center gap-2 md:gap-4 bg-white/5 backdrop-blur-md px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border border-white/10 min-w-0">
          <BrainCircuit className="text-[#D4AF37] shrink-0" size={14} md:size={20} />
          <div className="text-left min-w-0">
            <h3 className="text-[6px] md:text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-0.5">Neural Guide</h3>
            <p className="text-[9px] md:text-sm font-cinzel font-black text-white uppercase tracking-widest truncate">{currentSurah.name} • {currentAyahIndex + 1}</p>
          </div>
        </div>
        <button onClick={() => setIsFocusMode(!isFocusMode)} className={`flex items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 rounded-xl text-[7px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-500 shrink-0 ${isFocusMode ? 'bg-[#D4AF37] text-black shadow-[0_0_30px_#D4AF37]' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}>
          {isFocusMode ? <EyeOff size={12} md:size={14} /> : <Eye size={12} md:size={14} />} <span className="hidden sm:inline">{isFocusMode ? "Blind Practice" : "Guidance Mode"}</span>
        </button>
      </div>

      <div className="relative z-20 flex flex-col items-center gap-4 md:gap-8 mb-6 md:mb-12">
        <div className="relative">
          <div className={`absolute inset-0 border-2 border-[#D4AF37]/30 rounded-full transition-all duration-1000 ${isListening ? 'scale-150 opacity-0' : 'scale-100 opacity-20'}`}></div>
          <div 
            onClick={isListening || isSpeaking ? stopEverything : (isProcessing ? undefined : startReciting)}
            className={`relative w-32 h-32 sm:w-40 sm:h-40 md:w-64 md:h-64 rounded-full flex items-center justify-center cursor-pointer transition-all duration-700 shadow-2xl ${isListening ? 'scale-110' : 'scale-100 hover:scale-105'}`}
          >
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-[#121212] to-[#050505] border-2 transition-all duration-500 ${isListening ? 'border-[#D4AF37] shadow-[0_0_40px_md:shadow-[0_0_60px_#D4AF37]' : isQuotaExceeded ? 'border-red-500/50' : 'border-white/10'}`}></div>
            <div className="relative z-10">
              {isListening ? (
                <div className="flex gap-1 md:gap-2 items-end h-6 md:h-12">
                   {[...Array(5)].map((_, i) => <div key={i} className="w-1 md:w-2 bg-[#D4AF37] rounded-full animate-waveform shadow-[0_0_10px_#D4AF37]" style={{ height: `${40 + Math.random() * 60}%`, animationDelay: `${i * 0.1}s` }}></div>)}
                </div>
              ) : isProcessing ? (
                <Loader2 size={28} md:size={48} className="text-[#D4AF37] animate-spin" strokeWidth={1} />
              ) : isSpeaking ? (
                <Square size={28} md:size={48} className="text-[#D4AF37] fill-current" strokeWidth={1} />
              ) : isQuotaExceeded ? (
                <RefreshCw size={28} md:size={48} className="text-red-500 animate-spin" />
              ) : (
                <Mic size={28} md:size={48} className="text-gray-500 hover:text-[#D4AF37] transition-colors" strokeWidth={1} />
              )}
            </div>
          </div>
        </div>

        <div className="min-h-[30px] md:h-14 flex flex-col items-center justify-center gap-1 md:gap-2 text-center px-4 w-full">
           {isQuotaExceeded ? (
              <p className="text-red-400 font-bold uppercase tracking-widest text-[7px] md:text-xs">Sanctuary Capacity Exceeded</p>
           ) : hifzScore !== null ? (
              <div className="flex items-center gap-2 md:gap-3 animate-enter bg-white/5 px-3 md:px-6 py-1 md:py-2 rounded-full border border-white/5">
                  <span className="text-green-500 font-black text-xs sm:text-lg md:text-xl uppercase tracking-widest">{hifzScore}% Accurate</span>
                  {hifzScore > 90 && <Star className="text-[#D4AF37] animate-pulse" size={14} md:size={20} fill="currentColor" />}
              </div>
           ) : transcript ? (
              <p className="font-arabic text-base sm:text-xl md:text-3xl text-[#D4AF37] gold-shimmer animate-pulse truncate max-w-[250px] sm:max-w-md md:max-w-none" dir="rtl">"{transcript}"</p>
           ) : (
              <p className="text-[7px] md:text-[10px] text-gray-600 font-black uppercase tracking-[0.4em] md:tracking-[0.5em] animate-pulse">
                {isListening ? "Listening... Recite now" : isSpeaking ? "Tap to Stop" : "Tap Orb to Begin"}
              </p>
           )}
        </div>
      </div>

      <div className={`w-full max-w-4xl transition-all duration-1000 ease-in-out z-20 px-1 sm:px-2 md:px-0 ${isFocusMode ? 'translate-y-20 opacity-0 pointer-events-none scale-95' : 'translate-y-0 opacity-100 scale-100'}`}>
        <div className="premium-card p-0.5 rounded-[1.8rem] md:rounded-[3.5rem] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent">
          <div className="bg-[#0c0c0c] rounded-[1.8rem] md:rounded-[3.5rem] p-5 sm:p-8 md:p-14 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none hidden md:block"><BookIcon size={350} strokeWidth={0.5} /></div>
            <div className="flex flex-col items-center gap-6 md:gap-10 relative z-10">
              <div className="flex items-center justify-between w-full border-b border-white/5 pb-3 md:pb-6">
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37] shadow-inner shrink-0"><BookIcon size={14} md:size={20} /></div>
                  <div className="text-left min-w-0">
                    <h4 className="text-[6px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Divine Text</h4>
                    <p className="text-[10px] md:text-sm font-cinzel font-black text-white uppercase tracking-widest truncate">{currentSurah.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowAyat(!showAyat)} className="p-2 md:px-6 md:py-3 bg-white/5 border border-white/10 rounded-lg md:rounded-xl text-[7px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all shadow-xl flex items-center gap-2 shrink-0">
                  {showAyat ? <EyeOff size={12} md:size={14} /> : <Eye size={12} md:size={14} />} <span className="hidden sm:inline">{showAyat ? "Veil Verse" : "Reveal Text"}</span>
                </button>
              </div>

              <div className={`transition-all duration-700 w-full text-center flex flex-col justify-center min-h-[120px] sm:min-h-[150px] md:min-h-[250px] ${showAyat ? 'opacity-100' : 'opacity-0 blur-lg scale-95 pointer-events-none'}`}>
                <div className="flex flex-wrap justify-center gap-y-3 sm:gap-y-4 md:gap-y-6 gap-x-2 sm:gap-x-3 md:gap-x-6 px-2 sm:px-4 py-4 md:py-8" dir="rtl">
                  {ayahWords.map((word, i) => (
                    <span key={i} className={`font-arabic transition-all duration-500 cursor-default select-none ${matchedWordIndices.has(i) ? 'text-[#D4AF37] scale-105 md:scale-110 drop-shadow-[0_0_15px_rgba(212,175,55,0.7)] md:drop-shadow-[0_0_20px_rgba(212,175,55,0.7)]' : 'text-white/80'}`} style={{ fontSize: 'clamp(1.8rem, 7vw, 4.5rem)' }}>
                      {word}
                    </span>
                  ))}
                </div>
                <div className="w-24 md:w-48 h-px bg-white/10 mx-auto my-4 md:my-10"></div>
                <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                   <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 md:gap-3 px-4 md:px-8 py-2.5 md:py-4 bg-white/5 border border-white/10 rounded-lg md:rounded-2xl text-[7px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all"><Search size={12} md:size={14} /> Library</button>
                   <button onClick={() => loadSurahContent(currentSurah.number)} className="flex items-center gap-1.5 md:gap-3 px-4 md:px-8 py-2.5 md:py-4 bg-white/5 border border-white/10 rounded-lg md:rounded-2xl text-[7px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-400 transition-all"><RotateCcw size={12} md:size={14} /> Restart</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-3 sm:p-6 animate-enter">
          <div className="w-full max-w-2xl bg-[#0c0c0c] border border-white/10 rounded-[1.2rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-5 md:p-8 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]">
                <h3 className="font-cinzel text-sm sm:text-base md:text-xl font-black text-white uppercase tracking-widest">Library of Light</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white"><X size={18} md:size={24} /></button>
             </div>
             <div className="p-4 md:p-8 bg-[#080808]">
                <div className="relative group">
                   <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" size={16} md:size={20} />
                   <input type="text" placeholder="Search Chapters..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl py-3.5 md:py-5 pl-10 md:pl-14 pr-4 md:pr-6 text-[10px] md:text-sm text-white focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-gray-800 tracking-widest" />
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-4 custom-scrollbar">
                {filteredSurahs.map((s) => (
                  <button key={s.number} onClick={() => { loadSurahContent(s.number); setIsModalOpen(false); }} className={`flex items-center justify-between p-4 sm:p-5 md:p-6 rounded-[1rem] md:rounded-[2rem] border transition-all active:scale-95 ${currentSurah.number === s.number ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-white' : 'bg-white/5 border-white/5 hover:border-white/20 text-gray-400 hover:text-white'}`}>
                     <div className="flex items-center gap-3 md:gap-5 min-w-0">
                        <span className="text-[8px] md:text-[11px] font-mono font-bold text-gray-500 shrink-0 tabular-nums">{s.number}</span>
                        <div className="text-left min-w-0">
                           <p className="text-[10px] md:text-sm font-bold tracking-wide truncate">{s.englishName}</p>
                           <p className="text-[6px] md:text-[9px] text-gray-600 uppercase font-black">{s.numberOfAyahs} Ayats</p>
                        </div>
                     </div>
                     <span className="font-arabic text-lg md:text-2xl shrink-0">{s.name}</span>
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes waveform { 0%, 100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }
        .animate-waveform { animation: waveform 0.5s ease-in-out infinite; transform-origin: center; }
        .gold-shimmer { background: linear-gradient(90deg, #fff 0%, #D4AF37 50%, #fff 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 4s linear infinite; }
        @keyframes shimmer { to { background-position: 200% center; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default HafizAIPage;