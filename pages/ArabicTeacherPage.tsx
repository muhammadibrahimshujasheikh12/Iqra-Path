
import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, Sparkles, Languages, MessageSquare, Loader2, 
  Volume2, Globe, Send, History, BrainCircuit, 
  BookOpen, Star, ArrowRight, X, ChevronRight,
  ShieldCheck, HelpCircle, Waves, Play, AlertCircle, RefreshCw
} from 'lucide-react';
import { playPCMData, getGeminiResponse, getGeminiVoiceResponse } from '../services/gemini';

const TEACHING_LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'ur-PK', name: 'Urdu (اردو)' },
  { code: 'id-ID', name: 'Indonesian (Indonesia)' },
  { code: 'tr-TR', name: 'Turkish (Türkçe)' }
];

const CURRICULUM = [
  { title: "Basics", prompt: "Teach me how to introduce myself in Arabic." },
  { title: "Verbs", prompt: "Explain the concept of the 3-letter root system." }
];

const ArabicTeacherPage: React.FC = () => {
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [nativeLang, setNativeLang] = useState('en-US');
  const [messages, setMessages] = useState<{role: 'ai' | 'user', text: string}[]>([
    { role: 'ai', text: "Assalamu Alaikum! I am Mu'allim al-Lughah. What shall we learn today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (chatScrollRef.current) chatScrollRef.current.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const initAudio = () => { if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)(); };

  const handleSend = async (customText?: string) => {
    const text = customText || input;
    if (!text.trim() || loading) return;

    setInput('');
    setIsQuotaExceeded(false);
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    initAudio();

    const langName = TEACHING_LANGUAGES.find(l => l.code === nativeLang)?.name || 'English';
    try {
      const instruction = `Expert Arabic teacher for ${langName} speaker. DO NOT use markdown bolding symbols (**). Use plain text. You may use capitalization for keywords.`;
      const response = await getGeminiResponse(text, instruction);

      if (response.startsWith("QUOTA_EXCEEDED")) {
        setIsQuotaExceeded(true);
        setMessages(prev => [...prev, { role: 'ai', text: "Sanctuary is temporarily at capacity. Please try again soon." }]);
        return;
      }

      setMessages(prev => [...prev, { role: 'ai', text: response }]);
      if (mode === 'voice') speakResponse(response);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "Connection faint. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const speakResponse = async (text: string) => {
    const base64Audio = await getGeminiVoiceResponse(`Arabic: ${text.substring(0, 200)}`, "Arabic Teacher", "ar-SA");
    if (base64Audio === "QUOTA_EXCEEDED") {
        setIsQuotaExceeded(true);
    } else if (base64Audio && audioContextRef.current) {
      setIsSpeaking(true);
      playPCMData(base64Audio, audioContextRef.current, () => setIsSpeaking(false));
    }
  };

  const startVoice = () => {
    initAudio();
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = nativeLang;
    recognitionRef.current.onstart = () => setVoiceStatus('listening');
    recognitionRef.current.onresult = (e: any) => handleSend(e.results[0][0].transcript);
    recognitionRef.current.onend = () => setVoiceStatus('idle');
    recognitionRef.current.start();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-enter pb-40 px-4">
      <div className="text-center space-y-6 pt-10">
        <div className="inline-flex items-center gap-3 glass border-emerald-500/20 px-6 py-2 rounded-full"><Languages size={14} className="text-emerald-500" /><span className="text-[10px] font-black text-white uppercase tracking-[0.6em]">Lughat al-Dhad</span></div>
        <h1 className="text-6xl md:text-8xl font-cinzel font-black text-white leading-none">Mu'allim <span className="gold-shimmer">Arabic</span></h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
           <div className="premium-card p-8 rounded-[2.5rem] bg-[#0c0c0c] border border-white/5 space-y-8">
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Native Language</h3>
                 <select value={nativeLang} onChange={(e) => setNativeLang(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none">
                    {TEACHING_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                 </select>
              </div>
              <div className="space-y-2">
                 {CURRICULUM.map((c, i) => (
                   <button key={i} onClick={() => handleSend(c.prompt)} className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all text-left">
                      <span className="text-xs font-bold text-gray-400 uppercase">{c.title}</span><ChevronRight size={14} />
                   </button>
                 ))}
              </div>
           </div>
           {isQuotaExceeded && <div className="p-6 bg-red-900/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-[10px] font-black uppercase tracking-widest"><AlertCircle size={16} /> Sanctuary Busy</div>}
        </div>

        <div className="lg:col-span-8 flex flex-col h-[600px]">
           <div className="flex-1 flex flex-col bg-[#0c0c0c] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                 {messages.map((m, i) => (
                   <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-6 rounded-[2rem] text-sm leading-loose whitespace-pre-wrap ${m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white/[0.03] text-gray-300'}`}>{m.text}</div>
                   </div>
                 ))}
              </div>
              <div className="p-6 bg-black/50 border-t border-white/5 flex gap-4">
                 <button onClick={startVoice} className="p-4 bg-blue-600/10 text-blue-500 rounded-2xl"><Mic size={20} /></button>
                 <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask Muallim..." className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 text-white outline-none" />
                 <button onClick={() => handleSend()} className="p-4 bg-emerald-600 text-white rounded-2xl"><Send size={20} /></button>
              </div>
           </div>
        </div>
      </div>
      <style>{`
        .gold-shimmer { background: linear-gradient(90deg, #fff 0%, #D4AF37 50%, #fff 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 4s linear infinite; }
        @keyframes shimmer { to { background-position: 200% center; } }
      `}</style>
    </div>
  );
};

export default ArabicTeacherPage;
