import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Mic, MicOff, Camera, CameraOff, X, Sparkles, Loader2, 
  Volume2, VolumeX, Maximize2, Minimize2, Globe, ShieldCheck, 
  Waves, MessageSquare, Info, AlertCircle, RefreshCw, Power, PlayCircle
} from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { isSupabaseConfigured, supabase } from '../supabase';
import { Profile } from '../types';
import Logo from '../components/Logo';

// --- AUDIO HELPERS ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- VISUALIZER COMPONENT ---
const SoundWave: React.FC<{ active: boolean; isAi: boolean }> = ({ active, isAi }) => {
  return (
    <div className="flex items-center gap-1.5 h-12">
      {[...Array(8)].map((_, i) => (
        <div 
          key={i} 
          className={`w-1.5 rounded-full transition-all duration-300 ${active ? 'animate-waveform' : 'h-1'} ${isAi ? 'bg-[#D4AF37]' : 'bg-blue-500'}`}
          style={{ 
            height: active ? `${30 + Math.random() * 70}%` : '4px',
            animationDelay: `${i * 0.1}s`,
            boxShadow: active ? `0 0 10px ${isAi ? '#D4AF37' : '#3b82f6'}` : 'none'
          }}
        />
      ))}
    </div>
  );
};

const NoorTalkPage: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<'connecting' | 'idle' | 'listening' | 'speaking' | 'error'>('idle');
  const [transcription, setTranscription] = useState('');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  
  // Audio Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const micStreamRef = useRef<MediaStream | null>(null);
  
  // Video Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<number | null>(null);
  
  // Session Refs
  const sessionRef = useRef<any>(null);
  const aiRef = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY }), []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (isSupabaseConfigured()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (data) setUserProfile(data);
        }
      }
    };
    fetchProfile();
    return () => endSession();
  }, []);

  const initAudio = () => {
    if (!inputAudioContextRef.current) inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    if (!outputAudioContextRef.current) outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  };

  const startSession = async () => {
    setStatus('connecting');
    initAudio();
    
    try {
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = aiRef.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setStatus('listening');
            
            // Setup Microphone Input Processing
            const source = inputAudioContextRef.current!.createMediaStreamSource(micStreamRef.current!);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Transcription Handling
            if (msg.serverContent?.outputTranscription) {
               setTranscription(prev => (prev + " " + msg.serverContent?.outputTranscription?.text).trim());
            }

            // Audio Response Handling
            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setStatus('speaking');
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current!.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current!, 24000, 1);
              const source = outputAudioContextRef.current!.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContextRef.current!.destination);
              
              source.onended = () => {
                activeSourcesRef.current.delete(source);
                if (activeSourcesRef.current.size === 0) setStatus('listening');
              };
              
              // Fixed: nextStartTimeRef.current is a number, removed incorrect property access
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              activeSourcesRef.current.add(source);
            }

            if (msg.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus('listening');
            }
          },
          onerror: (e) => { console.error(e); setStatus('error'); },
          onclose: () => endSession(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: `You are Noor, a supportive spiritual companion on IqraPath. User: ${userProfile?.full_name || 'Believer'}. Be concise, empathetic, and wise. Maintain a sanctuary-like tone.`,
          outputAudioTranscription: {},
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const toggleCamera = async () => {
    if (isCameraActive) {
      if (frameIntervalRef.current) window.clearInterval(frameIntervalRef.current);
      if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        
        // Setup Frame Streaming to model
        frameIntervalRef.current = window.setInterval(() => {
          if (!canvasRef.current || !videoRef.current) return;
          const ctx = canvasRef.current.getContext('2d');
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          ctx?.drawImage(videoRef.current, 0, 0);
          
          canvasRef.current.toBlob(async (blob) => {
            if (blob && sessionRef.current) {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                sessionRef.current.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } });
              };
              reader.readAsDataURL(blob);
            }
          }, 'image/jpeg', 0.5);
        }, 1000);
      } catch (e) { console.error(e); }
    }
  };

  const endSession = () => {
    setIsActive(false);
    setStatus('idle');
    if (sessionRef.current) sessionRef.current.close();
    if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
    if (frameIntervalRef.current) window.clearInterval(frameIntervalRef.current);
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    activeSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    activeSourcesRef.current.clear();
    setTranscription('');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center overflow-hidden safe-area-inset">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10"></div>
      
      {/* Dynamic Background Aura */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] rounded-full blur-[150px] transition-all duration-[3000ms] opacity-20 pointer-events-none ${
        status === 'listening' ? 'bg-blue-600/30' : 
        status === 'speaking' ? 'bg-[#D4AF37]/30' : 
        status === 'connecting' ? 'bg-white/10 animate-pulse' : 'bg-transparent'
      }`}></div>

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 md:p-10 flex items-center justify-between z-50">
        <Logo size="sm" />
        <div className="flex items-center gap-4">
           <div className="hidden md:flex items-center gap-3 px-4 py-2 glass rounded-full border-white/5">
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse shadow-[0_0_10px_green]' : 'bg-gray-700'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white">{isActive ? 'Live Path Active' : 'Disconnected'}</span>
           </div>
           <button onClick={() => window.history.back()} className="p-3 glass rounded-full text-white/50 hover:text-white transition-all"><X size={20} /></button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative w-full h-full flex flex-col items-center justify-center p-6 gap-12 z-20">
        
        {/* Multimodal Center Piece */}
        <div className="relative w-full max-w-2xl flex flex-col items-center justify-center gap-8">
            
            {/* The Orb / Video Frame */}
            <div className={`relative group transition-all duration-700 ${isCameraActive ? 'w-full aspect-video rounded-[3rem]' : 'w-56 h-56 md:w-80 md:h-80 rounded-full'} overflow-hidden border-2 shadow-2xl ${
              status === 'speaking' ? 'border-[#D4AF37] shadow-[0_0_60px_rgba(212,175,55,0.4)]' : 
              status === 'listening' ? 'border-blue-500' : 'border-white/10'
            }`}>
               {isCameraActive ? (
                 <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 transition-all duration-1000" />
               ) : (
                 <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.1),transparent_70%)]"></div>
                    {status === 'connecting' ? (
                      <Loader2 size={64} className="text-[#D4AF37] animate-spin" strokeWidth={1} />
                    ) : (
                      <Waves size={80} className={`${status === 'speaking' ? 'text-[#D4AF37] animate-pulse' : status === 'listening' ? 'text-blue-400 animate-bounce' : 'text-gray-800'}`} strokeWidth={0.5} />
                    )}
                 </div>
               )}
               <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Visualizer & Status */}
            <div className="flex flex-col items-center gap-6 text-center">
                <div className="space-y-2">
                   <h2 className="font-cinzel text-3xl md:text-5xl font-black text-white uppercase tracking-widest leading-none">Noor <span className="gold-shimmer">Talk</span></h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37]">{status === 'speaking' ? 'Noor is sharing wisdom' : status === 'listening' ? 'I am listening to you' : 'Sacred Real-time Link'}</p>
                </div>
                
                <div className="flex items-center gap-8 bg-black/40 backdrop-blur-xl px-10 py-4 rounded-full border border-white/5">
                   <SoundWave active={status === 'listening'} isAi={false} />
                   <div className="w-px h-6 bg-white/10"></div>
                   <SoundWave active={status === 'speaking'} isAi={true} />
                </div>
            </div>

            {/* Live Transcript Bubble */}
            <div className={`transition-all duration-700 max-w-lg w-full ${transcription ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="glass p-6 md:p-8 rounded-[2.5rem] border-white/10 text-center relative">
                   <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Real-time Whisper</div>
                   <p className="text-sm md:text-lg font-light text-gray-300 leading-relaxed italic line-clamp-3">"{transcription || "..."}"</p>
                </div>
            </div>
        </div>

        {/* Controls Toolbar */}
        <div className="flex items-center gap-6 md:gap-8 bg-black/60 backdrop-blur-3xl px-10 py-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-white/50 hover:text-white'}`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          <button 
            onClick={isActive ? endSession : startSession}
            className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all shadow-2xl group ${isActive ? 'bg-red-600 text-white' : 'bg-[#D4AF37] text-black hover:scale-105'}`}
          >
             {isActive ? <Power size={32} /> : <PlayCircle size={44} className="group-hover:scale-110 transition-transform" />}
          </button>

          <button 
            onClick={toggleCamera}
            className={`p-4 rounded-2xl transition-all ${isCameraActive ? 'bg-blue-600/20 text-blue-400' : 'bg-white/5 text-white/50 hover:text-white'}`}
          >
            {isCameraActive ? <Camera size={24} /> : <CameraOff size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Portrait Hint */}
      <div className="absolute bottom-10 text-[9px] font-black uppercase tracking-[0.4em] text-gray-600 md:hidden animate-pulse">Speak freely • Noor is here</div>

      <style>{`
        @keyframes waveform { 
          0%, 100% { height: 10%; opacity: 0.3; } 
          50% { height: 100%; opacity: 1; } 
        }
        .animate-waveform { animation: waveform 0.6s ease-in-out infinite; transform-origin: center; }
        .gold-shimmer { background: linear-gradient(90deg, #F3E5AB 0%, #D4AF37 50%, #B8860B 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 5s linear infinite; }
        @keyframes shimmer { to { background-position: 200% center; } }
        .safe-area-inset { padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }
      `}</style>
    </div>
  );
};

export default NoorTalkPage;
