
import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, Sparkles, GraduationCap, ShieldAlert, Loader2, 
  Volume2, X, BookOpen, Star, BrainCircuit, Waves, 
  ChevronRight, PlayCircle, Info, ExternalLink, Youtube,
  ArrowRightCircle, CheckCircle, ListChecks, MessageSquare,
  AlertCircle, RefreshCw
} from 'lucide-react';
import { playPCMData, getGeminiResponse, getGeminiVoiceResponse } from '../services/gemini';

interface Lesson {
  id: number;
  title: string;
  arabic: string;
  demo: string;
  phonetic: string;
  rule: string;
}

const QAIDA_LESSONS: Lesson[] = [
  { id: 1, title: "Individual Letters", arabic: "الحروف المفردة", demo: "أ ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن و هـ ء ي", phonetic: "Alif, Baa, Taa, Thaa, Jeem, Haa, Khaa, Daal, Thaal, Raa, Zaa, Seen, Sheen, Saad, Daad, Toa, Zoa, Ayn, Ghayn, Faa, Qaaf, Kaaf, Laam, Meem, Noon, Waaw, Ha, Hamza, Yaa", rule: "Master the basic 29 letters and their exit points (Makharij)." },
  { id: 2, title: "Compound Letters", arabic: "الحروف المركبة", demo: "لا با طا", phonetic: "Laam Alif, Baa Alif, Taa Alif", rule: "Learn how letters change shape when they connect." },
  { id: 3, title: "Abbreviated Letters", arabic: "الحروف المقطعة", demo: "الم المص الر طسم", phonetic: "Alif Laam Meem, Alif Laam Meem Saad", rule: "The mysterious letters at the start of certain Surahs." },
  { id: 4, title: "Harakat (Vowels)", arabic: "الحركات", demo: "أَ إِ أُ بَ بِ بُ تَ تِ تُ", phonetic: "Aah, Eeh, Ooh, Ba, Bi, Bu, Ta, Ti, Tu", rule: "Fatha is the Ah sound (top), Kasra is Ee (bottom), and Damma is Oo (loop)." },
  { id: 14, title: "Quranic Verses", arabic: "آيات قرآنية", demo: "قُلْ هُوَ اللَّهُ أَحَدٌ", phonetic: "Qul Huwal lahu Ahad", rule: "Applying all the rules to full verses from the Quran." }
];

const QaidaAIPage: React.FC = () => {
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(() => {
    return sessionStorage.getItem('qaida_disclaimer_accepted') === 'true';
  });
  const [activeLesson, setActiveLesson] = useState(QAIDA_LESSONS[0]);
  const [status, setStatus] = useState<'idle' | 'explaining' | 'demonstrating' | 'listening' | 'evaluating'>('idle');
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [teacherScript, setTeacherScript] = useState('');
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isComponentMounted = useRef(true);

  useEffect(() => {
    return () => { isComponentMounted.current = false; };
  }, []);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const stopAllAudio = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
  };

  const generateAndSpeak = async (instruction: string): Promise<boolean> => {
    setIsQuotaExceeded(false);
    const textGen = await getGeminiResponse(instruction + " (Short English text only. No Arabic script.)", "Digital Muallim Service");
    
    if (textGen.startsWith("QUOTA_EXCEEDED")) {
        setIsQuotaExceeded(true);
        return false;
    }
    
    const speechText = textGen.replace(/[\*\#\_]/g, '').replace(/[\u0600-\u06FF]/g, '').trim();
    setTeacherScript(speechText);

    const base64Audio = await getGeminiVoiceResponse(speechText, "Muallim Voice", "en-US");

    if (base64Audio === "QUOTA_EXCEEDED") {
        setIsQuotaExceeded(true);
        return false;
    }

    if (base64Audio && audioContextRef.current) {
      return new Promise((resolve) => {
        playPCMData(base64Audio, audioContextRef.current!, () => resolve(true));
      });
    }
    return true;
  };

  const startTeachingSession = async (lesson = activeLesson) => {
    initAudio();
    stopAllAudio();
    setFeedback('');
    setTranscript('');
    setTeacherScript('');
    
    try {
      setStatus('explaining');
      const success1 = await generateAndSpeak(`Teacher: Introduce Lesson ${lesson.id}: ${lesson.title}. Explaining: ${lesson.rule}.`);
      if (!success1 || !isComponentMounted.current) { setStatus('idle'); return; }

      setStatus('demonstrating');
      const success2 = await generateAndSpeak(`Teacher: Recite clearly: "${lesson.phonetic}". Ask me to repeat.`);
      if (!success2 || !isComponentMounted.current) { setStatus('idle'); return; }

      startListening();
    } catch (e) {
      setStatus('idle');
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'ar-SA';
    recognitionRef.current.continuous = false;
    recognitionRef.current.onstart = () => setStatus('listening');
    recognitionRef.current.onresult = (e: any) => setTranscript(e.results[0][0].transcript);
    recognitionRef.current.onend = () => { if (isComponentMounted.current) setStatus('evaluating'); };
    recognitionRef.current.start();
  };

  useEffect(() => {
    if (status === 'evaluating' && transcript) {
      processFeedback(transcript);
    } else if (status === 'evaluating' && !transcript) {
      setStatus('idle');
      setFeedback("I missed that. Tap to retry.");
    }
  }, [status]);

  const processFeedback = async (userInput: string) => {
    await generateAndSpeak(`Teacher: I heard "${userInput}" for "${activeLesson.demo}". Encourage me.`);
    if (isComponentMounted.current) setStatus('idle');
  };

  const demoItems = activeLesson.demo.split(' ');

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] py-4 max-w-7xl mx-auto w-full relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-[#050505]"></div>
      
      {!hasAcceptedDisclaimer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-6">
          <div className="w-full max-w-xl bg-[#0c0c0c] border border-green-500/30 rounded-[3rem] p-12 text-center space-y-8 animate-enter">
            <GraduationCap size={64} className="mx-auto text-green-500 shadow-[0_0_40px_rgba(34,197,94,0.2)]" />
            <h3 className="text-3xl font-cinzel font-black text-white uppercase tracking-widest">Digital Madrasah</h3>
            <p className="text-sm text-gray-400 font-light leading-relaxed"> specialized phonetic guide. Seek certification from human teachers.</p>
            <button onClick={() => { setHasAcceptedDisclaimer(true); sessionStorage.setItem('qaida_disclaimer_accepted', 'true'); }} className="w-full py-6 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all shadow-xl">Enter Academy</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 relative z-10 pt-4">
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
          <div className="flex items-center gap-4 px-4">
            <div className="p-3 bg-green-900/20 rounded-2xl border border-green-500/20 text-green-500 shadow-xl"><ListChecks size={20} /></div>
            <div>
              <h2 className="text-lg font-cinzel font-black text-white tracking-widest uppercase">Sacred Steps</h2>
              <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">Noorani Qaida Syllabus</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 px-2 pb-20">
            {QAIDA_LESSONS.map((lesson) => (
              <button key={lesson.id} onClick={() => { setActiveLesson(lesson); startTeachingSession(lesson); }} className={`w-full text-left p-5 rounded-[2.5rem] border transition-all duration-500 flex items-center justify-between group ${activeLesson.id === lesson.id ? 'bg-green-900/10 border-green-500/50 shadow-2xl scale-[1.02]' : 'bg-[#0a0a0a] border-white/5 hover:border-white/20'}`}>
                <div className="flex items-center gap-5">
                   <span className={`text-[10px] font-mono font-bold ${activeLesson.id === lesson.id ? 'text-green-500' : 'text-gray-700'}`}>{lesson.id.toString().padStart(2, '0')}</span>
                   <div>
                      <p className={`text-xs font-bold uppercase tracking-widest ${activeLesson.id === lesson.id ? 'text-white' : 'text-gray-500'}`}>{lesson.title}</p>
                      <p className="text-[9px] text-gray-600 truncate max-w-[120px]">{lesson.rule}</p>
                   </div>
                </div>
                <span className={`font-arabic text-xl ${activeLesson.id === lesson.id ? 'text-green-500' : 'text-gray-700'}`}>{lesson.arabic}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col items-center justify-center relative min-h-[500px]">
           <div className="relative z-10 flex flex-col items-center text-center space-y-8 w-full max-w-4xl px-4">
              <div className="w-full premium-card p-10 md:p-14 rounded-[4rem] bg-[#0c0c0c] border border-white/10 shadow-2xl animate-enter">
                  <div className="flex flex-col items-center gap-12">
                     <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass border-white/5 text-[9px] font-black uppercase tracking-[0.5em] text-[#D4AF37]"><Sparkles size={12} className="animate-pulse" /> Academy Recitation</div>
                     <div className={`grid w-full max-w-4xl gap-8 px-2 ${activeLesson.id === 1 ? 'grid-cols-4 sm:grid-cols-5 md:grid-cols-7' : 'grid-cols-2 md:grid-cols-4'}`} dir="rtl">
                        {demoItems.map((item, i) => (
                          <div key={i} className={`flex flex-col items-center justify-center rounded-[2.5rem] border-2 transition-all duration-700 py-12 px-6 bg-[#0a0a0a] min-h-[200px] ${status === 'demonstrating' ? 'border-[#D4AF37] shadow-[0_0_50px_rgba(212,175,55,0.3)] scale-105' : 'border-white/5 hover:border-white/20'}`}>
                             <span className={`font-arabic text-white leading-[4.2] py-8 gold-shimmer block text-center transition-all duration-500 whitespace-nowrap ${activeLesson.id === 1 ? 'text-6xl md:text-7xl' : 'text-5xl md:text-6xl'} ${status === 'demonstrating' ? 'opacity-100' : 'opacity-70'}`}>{item}</span>
                          </div>
                        ))}
                     </div>
                     <div className="space-y-4 pt-12 border-t border-white/5 w-full">
                        <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-[0.4em]">{activeLesson.title}</p>
                        <p className="text-sm text-gray-500 font-light italic max-w-lg mx-auto leading-relaxed">{isQuotaExceeded ? "Sanctuary is resting. Please try again later." : teacherScript || "Observe the vowels carefully."}</p>
                     </div>
                  </div>
              </div>

              <div onClick={() => status === 'idle' && startTeachingSession()} className={`relative w-40 h-40 md:w-52 md:h-52 rounded-full flex items-center justify-center cursor-pointer transition-all duration-700 group ${status === 'listening' ? 'scale-110 shadow-[0_0_80px_rgba(34,197,94,0.3)]' : 'hover:scale-105'}`}>
                  <div className={`absolute inset-0 rounded-full bg-[#0c0c0c] border-2 transition-all duration-500 ${isQuotaExceeded ? 'border-red-500' : status === 'listening' ? 'border-green-500' : 'border-white/10 group-hover:border-[#D4AF37]/50'}`}></div>
                  <div className="relative z-10 flex flex-col items-center gap-4">
                     {isQuotaExceeded ? <RefreshCw size={48} className="text-red-500 animate-spin" /> : status === 'listening' ? <div className="flex gap-1.5 items-end h-12">{[...Array(6)].map((_, i) => <div key={i} className="w-1.5 bg-green-500 rounded-full animate-waveform" style={{ height: `${40 + Math.random() * 60}%`, animationDelay: `${i * 0.1}s` }}></div>)}</div> : status === 'evaluating' ? <Loader2 size={48} className="text-green-500 animate-spin" /> : <PlayCircle size={64} className="text-[#D4AF37] opacity-60" />}
                  </div>
                  <div className="absolute -bottom-10 w-full"><p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-700">{isQuotaExceeded ? "CAPACITY EXCEEDED" : status === 'idle' ? "Activate Lesson" : status.toUpperCase()}</p></div>
              </div>
           </div>
        </div>
      </div>

      <style>{`
        @keyframes waveform { 0%, 100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }
        .animate-waveform { animation: waveform 0.6s ease-in-out infinite; transform-origin: center; }
        .gold-shimmer { background: linear-gradient(90deg, #fff 0%, #22c55e 50%, #fff 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 4s linear infinite; }
        @keyframes shimmer { to { background-position: 200% center; } }
      `}</style>
    </div>
  );
};

export default QaidaAIPage;
