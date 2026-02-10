
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Sparkles, Loader2, Bot, User, 
  Mic, X, Waves, Globe, Square, AlertCircle, MessageSquare
} from 'lucide-react';
import { streamGeminiResponse, getGeminiVoiceResponse, playPCMData } from '../services/gemini';
import { supabase, isSupabaseConfigured } from '../supabase';
import { Profile } from '../types';

interface Message { role: 'ai' | 'user'; text: string; isError?: boolean; }

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English', native: 'English' },
  { code: 'ar-SA', name: 'Arabic', native: 'العربية' },
  { code: 'ur-PK', name: 'Urdu', native: 'اردو' },
  { code: 'id-ID', name: 'Indonesian', native: 'Indonesia' },
  { code: 'tr-TR', name: 'Turkish', native: 'Türkçe' },
  { code: 'fr-FR', name: 'French', native: 'Français' },
];

const NeuralVisualizer: React.FC<{ state: 'idle' | 'listening' | 'processing' | 'speaking' }> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let animationId: number; let time = 0;
    const getConfig = () => {
      switch (state) {
        case 'listening': return { amplitude: 30, frequency: 0.05, speed: 0.2, color: '#D4AF37', lines: 5 };
        case 'processing': return { amplitude: 10, frequency: 0.1, speed: 0.05, color: '#ffffff', lines: 3 };
        case 'speaking': return { amplitude: 50, frequency: 0.03, speed: 0.15, color: '#4ade80', lines: 7 };
        default: return { amplitude: 5, frequency: 0.02, speed: 0.02, color: '#D4AF37', lines: 2 };
      }
    };
    const draw = () => {
      const { amplitude, frequency, speed, color, lines } = getConfig();
      const width = canvas.width; const height = canvas.height; const centerY = height / 2;
      ctx.clearRect(0, 0, width, height); time += speed; ctx.shadowBlur = 15; ctx.shadowColor = color;
      for (let i = 0; i < lines; i++) {
        ctx.beginPath(); ctx.lineWidth = 1.5;
        ctx.strokeStyle = `${color}${Math.floor(255 - (i * 40)).toString(16).padStart(2, '0')}`;
        for (let x = 0; x < width; x++) {
          const y = centerY + Math.sin(x * frequency + time + (i * 0.5)) * amplitude * Math.sin(x / width * Math.PI);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        } ctx.stroke();
      }
      animationId = requestAnimationFrame(draw);
    };
    const resize = () => { if (canvas.parentElement) { canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight; } };
    window.addEventListener('resize', resize); resize(); draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationId); };
  }, [state]);
  return <canvas ref={canvasRef} className="w-full h-full absolute inset-0 pointer-events-none z-0" />;
};

const AIAssistant: React.FC = () => {
  const [mode, setMode] = useState<'chat' | 'voice'>('chat');
  const [language, setLanguage] = useState<string>('en-US');
  const [messages, setMessages] = useState<Message[]>([{ role: 'ai', text: 'Peace be upon you. I am Noor. Speak, and I shall listen.' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const sessionActiveRef = useRef(0);

  useEffect(() => {
    const fetchProfile = async () => {
      if (isSupabaseConfigured()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) { const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single(); if (data) setUserProfile(data); }
      }
    };
    fetchProfile();
    return () => stopEverything();
  }, []);

  useEffect(() => { 
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); 
  }, [messages, mode]);

  const stopEverything = () => {
      sessionActiveRef.current += 1;
      if (recognitionRef.current) recognitionRef.current.stop();
      if (audioSourceRef.current) { try { audioSourceRef.current.stop(); } catch(e) {} audioSourceRef.current = null; }
      setVoiceStatus('idle'); setIsLoading(false);
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input; if (!textToSend.trim() || isLoading) return;
    setInput(''); setMessages(prev => [...prev, { role: 'user', text: textToSend }, { role: 'ai', text: "..." }]);
    setIsLoading(true);
    try {
      await streamGeminiResponse(textToSend, `User: ${userProfile?.full_name || 'Seeker'}. Lang: ${language}.`, (chunkText) => {
          setMessages(prev => {
              const newMsgs = [...prev];
              if (newMsgs[newMsgs.length - 1].role === 'ai') newMsgs[newMsgs.length - 1].text = chunkText;
              return newMsgs;
          });
      });
    } catch (e) { setMessages(prev => [...prev, { role: 'ai', text: "Connection error.", isError: true }]); } finally { setIsLoading(false); }
  };

  const startListening = () => {
    stopEverything(); initAudio();
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;
    recognitionRef.current = new SpeechRec(); recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true; recognitionRef.current.lang = language;
    recognitionRef.current.onstart = () => { setVoiceStatus('listening'); setTranscript(''); };
    recognitionRef.current.onresult = (e: any) => setTranscript(e.results[0][0].transcript);
    recognitionRef.current.onend = () => { if (transcript.trim()) handleVoiceQuery(transcript.trim()); else setVoiceStatus('idle'); };
    try { recognitionRef.current.start(); } catch(e) { setVoiceStatus('idle'); }
  };

  const initAudio = () => { if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)(); };

  const handleVoiceQuery = async (query: string) => {
    const id = sessionActiveRef.current; setVoiceStatus('processing'); setMessages(prev => [...prev, { role: 'user', text: query }]);
    try {
      const audio = await getGeminiVoiceResponse(query, `User: ${userProfile?.full_name || 'Seeker'}.`, language);
      if (sessionActiveRef.current !== id) return;
      if (audio && audioContextRef.current) {
        setVoiceStatus('speaking');
        const src = await playPCMData(audio, audioContextRef.current, () => { if (sessionActiveRef.current === id) setVoiceStatus('idle'); });
        if (src) audioSourceRef.current = src;
      } else setVoiceStatus('idle');
    } catch (e) { if (sessionActiveRef.current === id) setVoiceStatus('idle'); }
  };

  return (
    <div className="flex flex-col w-full h-[calc(100dvh-120px)] md:h-[calc(100vh-160px)] lg:h-[calc(100vh-180px)] rounded-2xl md:rounded-[2.5rem] bg-[#080808] border border-white/5 relative overflow-hidden transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-[#020202]"></div>
      
      {/* Dynamic Header */}
      <div className="shrink-0 px-4 md:px-6 py-4 md:py-5 flex items-center justify-between z-20 backdrop-blur-md relative border-b border-white/5">
        <div className="flex items-center gap-3 md:gap-4">
          <div className={`p-2.5 rounded-xl border transition-all ${mode === 'voice' ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-lg' : 'glass border-white/10 text-[#D4AF37]'}`}>
            {mode === 'voice' ? <Waves size={18} /> : <Sparkles size={18} />}
          </div>
          <div>
            <h2 className="font-cinzel font-black text-white text-base md:text-xl uppercase tracking-wider">Noor <span className="text-[#D4AF37]">AI</span></h2>
            <p className="text-[7px] md:text-[9px] text-gray-500 font-bold uppercase tracking-widest">{mode === 'voice' ? 'Live Mode' : 'Chat Mode'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
             <div className="relative group z-30">
               <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-[8px] font-black text-gray-400 hover:text-white uppercase tracking-widest"><Globe size={10} /> {language.split('-')[0]}</button>
               <select value={language} onChange={(e) => setLanguage(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">{SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}</select>
             </div>
             <div className="glass p-1 rounded-full flex gap-0.5">
               {/* Fixed: MessageSquare icon added to fix ReferenceError */}
               <button onClick={() => { setMode('chat'); stopEverything(); }} className={`w-8 h-7 md:w-10 md:h-8 rounded-full flex items-center justify-center transition-all ${mode === 'chat' ? 'bg-[#D4AF37] text-black' : 'text-gray-500'}`}><MessageSquare size={14} /></button>
               <button onClick={() => setMode('voice')} className={`w-8 h-7 md:w-10 md:h-8 rounded-full flex items-center justify-center transition-all ${mode === 'voice' ? 'bg-[#D4AF37] text-black' : 'text-gray-500'}`}><Mic size={14} /></button>
             </div>
        </div>
      </div>

      {mode === 'chat' ? (
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 pb-32 pt-6 custom-scrollbar space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[90%] md:max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full shrink-0 flex items-center justify-center border ${m.role === 'ai' ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]' : 'bg-white/5 border-white/10 text-gray-500'}`}>{m.role === 'ai' ? <Bot size={16} /> : <User size={16} />}</div>
                  <div className={`px-5 py-4 md:px-6 md:py-5 rounded-2xl md:rounded-[2rem] text-xs md:text-sm leading-relaxed shadow-lg ${m.role === 'user' ? 'bg-[#D4AF37] text-black' : 'glass border-white/5 text-gray-200'}`}>{m.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#020202] via-[#020202]/80 to-transparent">
            <div className="relative max-w-4xl mx-auto">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Consult Noor..." className="w-full bg-[#0c0c0c] border border-white/10 rounded-full py-4 md:py-5 pl-6 md:pl-8 pr-14 md:pr-16 text-xs md:text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" />
              <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-2.5 md:p-3 bg-[#D4AF37] text-black rounded-full transition-transform active:scale-90"><Send size={16} /></button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 text-center">
           <NeuralVisualizer state={voiceStatus} />
           <div className="relative z-20 space-y-10 md:space-y-16 w-full max-w-lg">
              <div className="min-h-[100px] flex flex-col items-center justify-center gap-4">
                  {transcript ? (
                      <p className="text-lg md:text-2xl font-light text-white italic">"{transcript}"</p>
                  ) : (
                      <h3 className="text-2xl md:text-4xl font-cinzel font-black text-white uppercase tracking-widest">{voiceStatus === 'idle' ? "Tap Orb" : voiceStatus === 'listening' ? "Listening..." : "Processing"}</h3>
                  )}
              </div>
              
              <div 
                onClick={voiceStatus === 'idle' ? startListening : stopEverything}
                className={`relative w-40 h-40 md:w-56 md:h-56 rounded-full bg-black border-2 mx-auto flex items-center justify-center shadow-2xl transition-all duration-300 ${voiceStatus === 'listening' ? 'scale-110 border-[#D4AF37] shadow-[0_0_50px_rgba(212,175,55,0.2)]' : 'border-white/10'}`}
              >
                  {voiceStatus === 'idle' && <Mic size={40} className="text-[#D4AF37] opacity-60" />}
                  {voiceStatus === 'listening' && <Waves size={48} className="text-[#D4AF37] animate-pulse" />}
                  {voiceStatus === 'processing' && <Loader2 size={48} className="text-[#D4AF37] animate-spin" />}
                  {voiceStatus === 'speaking' && <Square size={30} className="text-green-500 fill-current" />}
              </div>
              
              <p className="text-[8px] md:text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">{voiceStatus === 'idle' ? "Neural Voice Link Available" : "Tap again to End"}</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
