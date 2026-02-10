
import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Sparkles, BookOpen, Quote, ShieldCheck, 
  Loader2, PlayCircle, History, BrainCircuit, 
  MessageSquare, ChevronRight, Star, Volume2, Mic, Info, 
  BookText, ScrollText, CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import { playPCMData, getGeminiResponse, getGeminiVoiceResponse } from '../services/gemini';

interface HadithResult {
  arabic: string;
  english: string;
  source: string;
  authenticity: string;
  explanation: string;
}

const TOPICS = [
  { label: "Character (Akhlaq)", prompt: "Explain the Sunnah regarding good character and controlling anger." },
  { label: "Social Conduct", prompt: "What are the Hadiths regarding kindness to neighbors and orphans?" },
  { label: "Spiritual Acts", prompt: "Explain the merits of Tahajjud and voluntary fasting." }
];

const SunnahAIPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HadithResult | null>(null);
  const [error, setError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const handleConsult = async (customQuery?: string) => {
    const finalQuery = customQuery || query;
    if (!finalQuery.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);
    setIsQuotaExceeded(false);
    initAudio();

    try {
      const systemInstruction = `You are Noor al-Sunnah. Provide JSON: {"arabic": "text", "english": "text", "source": "text", "authenticity": "text", "explanation": "text"}. RULE: ALL text must be clean plain text. NO markdown bolding (**). NO symbols.`;
      const response = await getGeminiResponse(finalQuery, systemInstruction, "application/json");

      if (response.startsWith("QUOTA_EXCEEDED")) {
        setIsQuotaExceeded(true);
        return;
      }

      const data = JSON.parse(response || '{}');
      setResult(data);

      const base64Audio = await getGeminiVoiceResponse(`Regarding this Hadith from ${data.source}: ${data.explanation}`, "Sunnah Voice", "en-US");
      if (base64Audio && base64Audio !== "QUOTA_EXCEEDED" && audioContextRef.current) {
        setIsSpeaking(true);
        playPCMData(base64Audio, audioContextRef.current, () => setIsSpeaking(false));
      }
    } catch (err) {
      setError("The link to the sacred tradition is faint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-enter pb-40 px-4">
      <div className="text-center space-y-6 pt-10">
        <div className="inline-flex items-center gap-3 glass border-[#D4AF37]/20 px-6 py-2 rounded-full">
          <History size={14} className="text-[#D4AF37]" /><span className="text-[10px] font-black text-white uppercase tracking-[0.6em]">Prophetic Wisdom</span>
        </div>
        <h1 className="text-6xl md:text-8xl font-cinzel font-black text-white leading-none">Noor <span className="gold-shimmer">Sunnah</span></h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-8">
           <div className="premium-card p-10 rounded-[3rem] bg-[#0c0c0c] border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="space-y-8 relative z-10">
                 <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]">Explore Traditions</h3>
                    <div className="relative group">
                       <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleConsult()} placeholder="Ask about Sunnah..." className="w-full bg-black border border-white/10 rounded-2xl py-6 pl-6 pr-16 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" />
                       <button onClick={() => handleConsult()} disabled={loading || !query.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-[#D4AF37] text-black rounded-xl hover:scale-110 active:scale-95 transition-all shadow-xl disabled:opacity-30">
                         {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                       </button>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 gap-3">
                    {TOPICS.map((t, i) => (
                      <button key={i} onClick={() => handleConsult(t.prompt)} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-[#D4AF37]/30 group transition-all text-left">
                         <span className="text-xs font-bold text-gray-400 group-hover:text-white uppercase tracking-widest">{t.label}</span>
                         <ChevronRight size={14} className="text-gray-700 group-hover:text-[#D4AF37] transition-all" />
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-7">
           {loading && <div className="h-full min-h-[500px] flex flex-col items-center justify-center space-y-8 animate-pulse"><div className="w-20 h-20 rounded-[2rem] bg-[#0c0c0c] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]"><Sparkles size={32} className="animate-spin-slow" /></div><p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37]">Opening the Scrolls...</p></div>}
           {result && (
             <div className="animate-enter space-y-8 pb-10">
                <div className="premium-card p-12 md:p-16 rounded-[4.5rem] relative overflow-hidden bg-[#0c0c0c] border border-white/10 shadow-2xl">
                   <div className="space-y-12 relative z-10">
                      <div className="flex items-center justify-between border-b border-white/5 pb-8">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]"><Star size={16} fill="currentColor" /></div>
                            <div>
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">{result.source}</h4>
                               <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">{result.authenticity} Narration</span>
                            </div>
                         </div>
                      </div>
                      <div className="space-y-8 text-center">
                         <p className="font-arabic text-4xl md:text-5xl text-white leading-[2.2] gold-shimmer">{result.arabic}</p>
                         <p className="text-lg md:text-xl text-gray-400 font-light leading-relaxed italic border-l-2 border-[#D4AF37]/20 pl-8 mx-auto max-w-2xl">"{result.english}"</p>
                      </div>
                      <div className="pt-10 space-y-6">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><BookText size={16} /></div>
                            <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Noor's Explanation</h5>
                         </div>
                         <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem]">
                            <p className="text-gray-300 text-sm md:text-base font-light leading-[1.8]">{result.explanation}</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
      <style>{`
        .gold-shimmer { background: linear-gradient(90deg, #F3E5AB 0%, #D4AF37 50%, #B8860B 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 4s linear infinite; }
        @keyframes shimmer { to { background-position: 200% center; } }
      `}</style>
    </div>
  );
};

export default SunnahAIPage;
