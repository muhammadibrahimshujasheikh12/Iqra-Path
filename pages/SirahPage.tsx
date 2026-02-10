
import React, { useState, useRef, useEffect } from 'react';
import { 
  History, Search, BookOpen, Star, ChevronRight, 
  Compass, X, Sparkles, Loader2, Quote, 
  BookText, ScrollText, Play, ArrowLeft,
  ShieldCheck, MapPin, Feather, Heart, AlertCircle, RefreshCw
} from 'lucide-react';
import { getGeminiResponse } from '../services/gemini';

interface Prophet {
  name: string;
  title: string;
  era: 'Beginning' | 'Israel' | 'Final';
  summary: string;
}

const ALL_PROPHETS: Prophet[] = [
  { name: "Adam (AS)", title: "Father of Mankind", era: 'Beginning', summary: "The first human and the first Prophet, created from clay." },
  { name: "Idris (AS)", title: "The Wise Scribe", era: 'Beginning', summary: "Known for his wisdom and being the first to use the pen." },
  { name: "Nuh (AS)", title: "The Great Ark-Builder", era: 'Beginning', summary: "Patiently called his people for 950 years before the Great Flood." },
  { name: "Hud (AS)", title: "Messenger to 'Ad", era: 'Beginning', summary: "Sent to the powerful tribe of 'Ad who built lofty pillars." },
  { name: "Saleh (AS)", title: "The Prophet of the She-Camel", era: 'Beginning', summary: "Sent to Thamud with a miraculous sign from the mountains." },
  { name: "Ibrahim (AS)", title: "The Friend of Allah", era: 'Beginning', summary: "The patriarch of monotheism and builder of the Ka'bah." },
  { name: "Lut (AS)", title: "The Guardian of Virtue", era: 'Beginning', summary: "Sent to the cities of the plain to call for purity." },
  { name: "Ismail (AS)", title: "The Patient Sacrifice", era: 'Beginning', summary: "Son of Ibrahim, the ancestor of the final Messenger ﷺ." },
  { name: "Ishaq (AS)", title: "Father of Nations", era: 'Beginning', summary: "The second son of Ibrahim, ancestor of many Prophets." },
  { name: "Yaqub (AS)", title: "The Grieving Father", era: 'Israel', summary: "Whose patience and trust in Allah was tested through his children." },
  { name: "Yusuf (AS)", title: "The Symbol of Beauty", era: 'Israel', summary: "Thrown into a well, sold into slavery, and rose to lead Egypt." },
  { name: "Ayyub (AS)", title: "The Icon of Patience", era: 'Israel', summary: "Endured severe trials with unwavering gratitude to Allah." },
  { name: "Shu'ayb (AS)", title: "The Speaker to Midian", era: 'Israel', summary: "Called for justice in trade and fair weights in the market." },
  { name: "Musa (AS)", title: "The Interlocutor of Allah", era: 'Israel', summary: "Led the Israelites out of Egypt and received the Torah." },
  { name: "Harun (AS)", title: "The Eloquent Supporter", era: 'Israel', summary: "Brother of Musa and his partner in the message to Pharaoh." },
  { name: "Dawud (AS)", title: "The King-Prophet", era: 'Israel', summary: "A warrior-king who sang the praises of Allah in the Zabur." },
  { name: "Sulayman (AS)", title: "Master of Wisdom", era: 'Israel', summary: "Granted a kingdom like no other, speaking to birds and jinn." },
  { name: "Ilyas (AS)", title: "Messenger to Ba'lbek", era: 'Israel', summary: "Revived the faith of his people against the worship of idols." },
  { name: "Al-Yasa (AS)", title: "The Healer of Faith", era: 'Israel', summary: "Succeeded Ilyas in guiding the Israelites." },
  { name: "Dhul-Kifl (AS)", title: "The Keeper of Pledges", era: 'Israel', summary: "Known for his strict adherence to his promises and duties." },
  { name: "Yunus (AS)", title: "The Man of the Whale", era: 'Israel', summary: "Called his people to repentance and was tried in the deep sea." },
  { name: "Zakariyya (AS)", title: "The Guardian of Maryam", era: 'Israel', summary: "Granted a son in old age through a divine miracle." },
  { name: "Yahya (AS)", title: "The Pure Witness", era: 'Israel', summary: "Son of Zakariyya, a Prophet of extreme asceticism and truth." },
  { name: "Isa (AS)", title: "The Spirit from Allah", era: 'Israel', summary: "Born of a virgin, spoke in the cradle, and healed the sick." },
  { name: "Muhammad ﷺ", title: "The Final Seal", era: 'Final', summary: "The Mercy to all worlds and the recipient of the Final Revelation." },
];

const SirahPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProphet, setSelectedProphet] = useState<Prophet | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [storyContent, setStoryContent] = useState<string>('');
  const [loadingStory, setLoadingStory] = useState(false);
  const [activeEra, setActiveEra] = useState<'All' | 'Beginning' | 'Israel' | 'Final'>('All');
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  const fetchStory = async (prophet: Prophet) => {
    setLoadingStory(true);
    setIsReading(true);
    setStoryContent('');
    setIsQuotaExceeded(false);
    
    try {
      const prompt = `
        Tell the authentic story of Prophet ${prophet.name} (${prophet.title}) as narrated in the Quran and authentic Hadith.
        STRUCTURE:
        1. Context: Their world and the people they were sent to.
        2. The Message: Their core invitation to Allah.
        3. The Trial: The main struggle or miracle they faced.
        4. The Legacy: 3 key lessons for a modern believer.
      `;

      const response = await getGeminiResponse(prompt, "You are an expert in Qisas al-Anbiya (Stories of the Prophets).");

      if (response.startsWith("QUOTA_EXCEEDED")) {
        setIsQuotaExceeded(true);
        setStoryContent("The sanctuary library is currently full of seekers. Please wait a moment for the light to return.");
      } else {
        setStoryContent(response);
      }
    } catch (e) {
      setStoryContent("Connection to the sacred library was interrupted. Please try again later.");
    } finally {
      setLoadingStory(false);
    }
  };

  const filteredProphets = ALL_PROPHETS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEra = activeEra === 'All' || p.era === activeEra;
    return matchesSearch && matchesEra;
  });

  return (
    <div className="py-10 space-y-20 max-w-7xl mx-auto pb-40 px-4">
      
      {/* Cinematic Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-12 pt-10">
        <div className="space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-3 glass border-[#D4AF37]/20 px-6 py-2 rounded-full">
            <History size={16} className="text-[#D4AF37]" />
            <span className="text-[10px] font-black text-white uppercase tracking-[1em]">The Golden Chain</span>
          </div>
          <h1 className="text-6xl md:text-9xl font-cinzel font-black text-white leading-none tracking-tight">
            Prophetic <span className="gold-shimmer">History</span>
          </h1>
          <p className="text-gray-500 max-w-xl text-xl font-light leading-relaxed">
            Walk through the ages. Discover the trials, triumphs, and eternal lessons from the 25 chosen messengers mentioned in the Noble Quran.
          </p>
        </div>
        
        <div className="hidden lg:flex w-64 h-64 rounded-full border border-[#D4AF37]/10 items-center justify-center p-8 relative animate-float">
           <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/10 to-transparent rounded-full blur-2xl"></div>
           <Compass size={120} strokeWidth={0.5} className="text-[#D4AF37]/30" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#D4AF37] rounded-full shadow-[0_0_20px_#D4AF37]"></div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row gap-8 items-center justify-between sticky top-24 z-40 bg-[#050505]/80 backdrop-blur-3xl p-4 rounded-[2.5rem] border border-white/5 shadow-2xl">
         <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 lg:pb-0 w-full lg:w-auto">
            {['All', 'Beginning', 'Israel', 'Final'].map((era) => (
              <button 
                key={era}
                onClick={() => setActiveEra(era as any)}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeEra === era ? 'bg-[#D4AF37] text-black shadow-lg' : 'bg-white/5 text-gray-500 hover:text-white border border-white/5'}`}
              >
                {era === 'Beginning' ? 'Early Prophets' : era === 'Israel' ? 'Bani Israel' : era === 'Final' ? 'The Seal' : 'All Chains'}
              </button>
            ))}
         </div>

         <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5 group-focus-within:text-[#D4AF37] transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name or title..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-2xl py-5 pl-14 pr-6 focus:outline-none focus:border-[#D4AF37]/50 text-sm text-white placeholder:text-gray-800 tracking-widest shadow-inner transition-all"
            />
         </div>
      </div>

      {/* Prophet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredProphets.map((prophet, i) => (
          <div 
            key={prophet.name}
            onClick={() => { setSelectedProphet(prophet); fetchStory(prophet); }}
            className="premium-card group relative p-10 rounded-[3rem] cursor-pointer overflow-hidden transition-all duration-700 hover:border-[#D4AF37]/40 hover:-translate-y-2 flex flex-col justify-between min-h-[320px] bg-[#0c0c0c]"
          >
            <div className="absolute -top-10 -right-10 p-12 opacity-[0.02] group-hover:opacity-[0.08] transition-opacity duration-1000 rotate-12">
               <History size={300} strokeWidth={0.5} />
            </div>

            <div className="space-y-6 relative z-10">
               <div className="flex items-center justify-between">
                  <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/10 ${prophet.era === 'Final' ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-white/5 text-gray-500'}`}>
                    {prophet.era === 'Beginning' ? 'Beginning' : prophet.era === 'Israel' ? 'Bani Israel' : 'Final Seal'}
                  </div>
                  <Star size={14} className="text-gray-800 group-hover:text-[#D4AF37] transition-colors" />
               </div>

               <div className="space-y-2">
                  <h3 className="text-3xl font-cinzel font-black text-white group-hover:text-[#D4AF37] transition-colors leading-tight">
                    {prophet.name}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">
                    {prophet.title}
                  </p>
               </div>

               <p className="text-sm text-gray-600 font-light leading-relaxed line-clamp-3">
                 {prophet.summary}
               </p>
            </div>

            <div className="pt-8 relative z-10">
               <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37]/40 group-hover:text-[#D4AF37] transition-all">
                  <span>Open Scroll</span>
                  <ChevronRight size={14} className="group-hover:translate-x-2 transition-transform" />
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* STORY OVERLAY */}
      {isReading && selectedProphet && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-enter">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10 pointer-events-none"></div>
            
            <div className="w-full max-w-4xl bg-[#0c0c0c] border border-[#D4AF37]/30 rounded-[4rem] overflow-hidden shadow-2xl flex flex-col h-[90vh] relative">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_20px_#D4AF37]"></div>
                
                <div className="p-8 md:p-12 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsReading(false)} className="w-12 h-12 rounded-full glass flex items-center justify-center text-gray-500 hover:text-white transition-all"><ArrowLeft size={20} /></button>
                        <div>
                           <h2 className="text-3xl font-cinzel font-black text-white uppercase tracking-widest">{selectedProphet.name}</h2>
                           <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-[0.4em]">{selectedProphet.title}</p>
                        </div>
                    </div>
                    <button onClick={() => setIsReading(false)} className="p-4 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 md:p-20 custom-scrollbar relative">
                    {loadingStory ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-10">
                         <div className="relative">
                            <div className="w-24 h-24 rounded-[2.5rem] bg-[#0c0c0c] border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                               <Feather size={40} className="animate-pulse" />
                            </div>
                            <div className="absolute inset-0 border border-[#D4AF37] rounded-[2.5rem] animate-ping opacity-20"></div>
                         </div>
                         <div className="text-center space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[#D4AF37] animate-pulse">Unrolling Sacred Scroll...</p>
                            <p className="text-gray-600 text-xs font-light italic">Gathering narrations from authentic sources</p>
                         </div>
                      </div>
                    ) : isQuotaExceeded ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-8 animate-enter text-center">
                         <div className="p-6 rounded-full bg-red-500/10 text-red-500"><AlertCircle size={48} /></div>
                         <div className="space-y-4 max-w-sm">
                            <h3 className="text-2xl font-cinzel font-black text-white uppercase tracking-widest">Sanctuary Busy</h3>
                            <p className="text-sm text-gray-500 font-light leading-relaxed">The AI narrators are currently at capacity. Please try again in a few moments.</p>
                            <button onClick={() => fetchStory(selectedProphet)} className="px-8 py-3 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all flex items-center gap-2 mx-auto mt-6">
                               <RefreshCw size={14} /> Retry Scroll
                            </button>
                         </div>
                      </div>
                    ) : (
                      <article className="animate-enter max-w-2xl mx-auto space-y-12">
                         <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 flex gap-8 items-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-[2000ms]"><History size={150} /></div>
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                               <Sparkles size={24} />
                            </div>
                            <p className="text-sm md:text-base text-gray-400 font-light leading-relaxed italic relative z-10">
                               "Peace be upon them on the day they were born, the day they passed, and the day they will be raised alive."
                            </p>
                         </div>

                         <div className="prose prose-invert max-w-none text-gray-300 leading-[2] font-light text-lg space-y-8">
                             {storyContent.split('\n\n').map((para, i) => (
                               <p key={i} className="reveal-text" style={{ animationDelay: `${i * 0.1}s` }}>
                                  {para}
                                </p>
                             ))}
                         </div>

                         <div className="pt-20 border-t border-white/5 flex flex-col items-center gap-8">
                            <Heart size={32} className="text-red-500 opacity-20 animate-pulse" />
                            <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.6em] text-center max-w-sm">May Allah grant us the wisdom to follow in their righteous footsteps.</p>
                            <button onClick={() => setIsReading(false)} className="px-12 py-5 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-xl hover:scale-105 transition-all">Close Scroll</button>
                         </div>
                      </article>
                    )}
                </div>

                <div className="h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50 shadow-inner"></div>
            </div>
        </div>
      )}

      <style>{`
        .gold-shimmer { background: linear-gradient(90deg, #F3E5AB 0%, #D4AF37 50%, #B8860B 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 5s linear infinite; }
        @keyframes shimmer { to { background-position: 200% center; } }
        .reveal-text { animation: revealText 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(10px); }
        @keyframes revealText { to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default SirahPage;
