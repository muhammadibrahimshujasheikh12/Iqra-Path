import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, BookOpen, Clock, Sparkles, 
  ChevronRight, Quote, Activity, Users, 
  Moon, Bot, PlayCircle, Sun, Feather, 
  HeartHandshake, Fingerprint, Globe
} from 'lucide-react';
import { fetchPrayerTimes, fetchPrayerTimesByIP, getCachedPrayerTimes } from '../services/prayerService';
import { getLastReadingProgress } from '../services/quranService';
import { PrayerTimes } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';

const DAILY_AYATS = [
  { text: "فَٱذْكُرُونِىٓ أَذْكُرْكُمْ وَٱشْكُرُوا۟ لِى وَلَا تَكْفُرُونِ", trans: "So remember Me; I will remember you. And be grateful to Me and do not deny Me.", ref: "Surah Al-Baqarah 2:152" },
  { text: "إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا", trans: "Verily, with hardship comes ease.", ref: "Surah Ash-Sharh 94:6" },
  { text: "اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ", trans: "Allah is the Light of the heavens and the earth.", ref: "Surah An-Nur 24:35" },
  { text: "وَرَهْبَانِيَّةً ٱبْتَدَعُوهَا مَا كَتَبْنَـٰهَا عَلَيْهِمْ", trans: "But the Monasticism which they invented for themselves, We did not prescribe for them.", ref: "Surah Al-Hadid 57:27" },
  { text: "وَقُل رَّبِّ زِدْنِى عِلْمًا", trans: "And say, 'My Lord, increase me in knowledge.'", ref: "Surah Taha 20:114" },
  { text: "أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ", trans: "Unquestionably, by the remembrance of Allah do hearts find rest.", ref: "Surah Ar-Ra'd 13:28" },
  { text: "وَإِذَا سَأَلَكَ عِبَادِى عَنِّى فَإِنِّى قَرِيبٌ", trans: "And when My servants ask you concerning Me, indeed I am near.", ref: "Surah Al-Baqarah 2:186" },
  { text: "لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا", trans: "Allah does not burden a soul beyond that it can bear.", ref: "Surah Al-Baqarah 2:286" }
];

const DAILY_SUNNAHS = [
  { title: "Smile", body: "Smiling in the face of your brother is charity.", source: "Tirmidhi" },
  { title: "Right Side", body: "Start with your right side when putting on shoes or clothes.", source: "Bukhari" },
  { title: "Remove Harm", body: "Removing a harmful object from the road is a charity.", source: "Muslim" },
  { title: "Gentleness", body: "Allah is Kind and loves kindness in all matters.", source: "Bukhari" },
  { title: "Sip Water", body: "Do not drink water in one breath, but drink it in two or three.", source: "Muslim" },
  { title: "Salam", body: "Spread the Salam (peace) amongst yourselves.", source: "Muslim" },
  { title: "Visiting Sick", body: "Visit the sick, feed the hungry, and free the captive.", source: "Bukhari" },
  { title: "Cleanliness", body: "Cleanliness is half of faith.", source: "Muslim" }
];

const formatTime12h = (time24: string | undefined) => {
  if (!time24) return "--:--";
  try {
    const [h, m] = time24.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${suffix}`;
  } catch (e) { return "--:--"; }
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [times, setTimes] = useState<PrayerTimes | null>(() => getCachedPrayerTimes()?.times || null);
  const [nextPrayer, setNextPrayer] = useState<{name: string, time: string, timeLeft: string} | null>(null);
  const [userName, setUserName] = useState<string>('Seeker');
  const [lastRead, setLastRead] = useState<{surah: string, number: number, ayah: number} | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Night'>('Morning');
  const [dailyAyat, setDailyAyat] = useState(DAILY_AYATS[0]);
  const [dailySunnah, setDailySunnah] = useState(DAILY_SUNNAHS[0]);
  const [hijriDate, setHijriDate] = useState<string>("");

  useEffect(() => {
    const timer = setInterval(() => {
        if (times) determineNextPrayer(times);
        
        // Rotate Ayat every 60 seconds
        const minuteCounter = Math.floor(Date.now() / 60000);
        setDailyAyat(DAILY_AYATS[minuteCounter % DAILY_AYATS.length]);
        setDailySunnah(DAILY_SUNNAHS[minuteCounter % DAILY_SUNNAHS.length]);
    }, 1000);
    
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('Morning'); 
    else if (hour < 17) setTimeOfDay('Afternoon'); 
    else if (hour < 20) setTimeOfDay('Evening'); 
    else setTimeOfDay('Night');
    
    if (times) determineNextPrayer(times);
    
    const minuteCounter = Math.floor(Date.now() / 60000);
    setDailyAyat(DAILY_AYATS[minuteCounter % DAILY_AYATS.length]);
    setDailySunnah(DAILY_SUNNAHS[minuteCounter % DAILY_SUNNAHS.length]);

    try {
      const date = new Date();
      const hijriFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
          day: 'numeric', month: 'long', year: 'numeric'
      });
      setHijriDate(hijriFormatter.format(date));
    } catch (e) { setHijriDate("Islamic Date"); }

    initData();
    return () => clearInterval(timer);
  }, [times]);

  const initData = async () => {
      try {
          if (isSupabaseConfigured()) {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                  const { data: profile } = await supabase.from('profiles').select('full_name, username').eq('id', user.id).single();
                  if (profile) setUserName((profile.full_name || profile.username || 'Seeker').split(' ')[0]);
                  const progress = await getLastReadingProgress();
                  if (progress) setLastRead({ surah: progress.surah_name, number: progress.surah_number, ayah: progress.ayah_number });
              }
          }
          if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(async (pos) => {
                  try { const data = await fetchPrayerTimes(pos.coords.latitude, pos.coords.longitude); setTimes(data); } catch(e) { fallbackToIP(); }
              }, () => fallbackToIP());
          } else { fallbackToIP(); }
      } catch (e) { if (!times) fallbackToIP(); }
  };

  const fallbackToIP = async () => { try { const { times: ipTimes } = await fetchPrayerTimesByIP(); setTimes(ipTimes); } catch (e) {} };

  const determineNextPrayer = (data: PrayerTimes) => {
    try {
        const now = new Date();
        const curTotalMins = now.getHours() * 60 + now.getMinutes();
        const prayers = [ 
            { name: 'Fajr', time: data.Fajr }, { name: 'Dhuhr', time: data.Dhuhr }, 
            { name: 'Asr', time: data.Asr }, { name: 'Maghrib', time: data.Maghrib }, { name: 'Isha', time: data.Isha } 
        ];
        let upcoming = prayers.find(p => {
          if (!p.time) return false;
          const [h, m] = p.time.split(':').map(Number);
          return (h * 60 + m) > curTotalMins;
        }) || prayers[0];

        const [h, m] = upcoming.time.split(':').map(Number);
        let targetDate = new Date(); targetDate.setHours(h, m, 0, 0);
        if (targetDate.getTime() <= now.getTime()) targetDate.setDate(targetDate.getDate() + 1);

        const diffMs = targetDate.getTime() - now.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        setNextPrayer({ 
            name: upcoming.name, 
            time: formatTime12h(upcoming.time), 
            timeLeft: `-${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}` 
        });
    } catch (e) {}
  };

  return (
    <div className="pb-10 space-y-6 md:space-y-10 animate-enter overflow-hidden px-1">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div className="space-y-2 md:space-y-4">
          <div className="flex items-center gap-2 md:gap-3">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
             <p className="text-[9px] md:text-[10px] font-black tracking-[0.3em] uppercase text-gray-500">{hijriDate}</p>
          </div>
          <h1 className="text-2xl sm:text-5xl md:text-7xl font-cinzel font-black text-white leading-tight">Good {timeOfDay}, <br className="hidden sm:block" /><span className="gold-shimmer">{userName}</span>.</h1>
        </div>
        <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
            <div className="w-12 h-12 rounded-full border border-[#D4AF37]/20 items-center justify-center text-[#D4AF37] bg-[#050505] shadow-xl flex">
                <Moon size={22} fill="currentColor" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Ramadan Countdown</span>
        </div>
      </header>

      {/* Main Feature Grid (Fluid Bento) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6">
        
        {/* 1. Next Prayer Hero */}
        <div onClick={() => navigate('/prayer')} className="md:col-span-12 lg:col-span-7 relative group cursor-pointer overflow-hidden rounded-[2.5rem] md:rounded-[3rem] bg-[#080808] border border-white/5 min-h-[280px] md:min-h-[360px] flex flex-col justify-between p-8 md:p-12 transition-all hover:border-[#D4AF37]/30 shadow-2xl active:scale-[0.98]">
           <div className="absolute inset-0 bg-gradient-to-br from-[#121212] via-[#050505] to-[#0a0a0a]"></div>
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10"></div>
           
           <div className="relative z-10 flex justify-between items-start">
               <div className="px-4 py-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[9px] md:text-[11px] font-black uppercase tracking-widest text-[#D4AF37] flex items-center gap-2">
                   <Clock size={14} /> Next Prayer
               </div>
               <div className="font-mono text-xl md:text-3xl font-bold text-white tracking-widest animate-pulse tabular-nums bg-white/5 px-4 py-1 rounded-lg">
                   {nextPrayer?.timeLeft || "--:--:--"}
               </div>
           </div>
           
           <div className="relative z-10 mt-4">
               <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-cinzel font-black text-white leading-none tracking-tighter">
                   {nextPrayer?.name || "Loading..." }
               </h2>
               <p className="text-2xl md:text-5xl text-[#D4AF37] font-mono mt-2 opacity-80 font-bold">
                   {nextPrayer?.time || "--:--"}
               </p>
           </div>
           
           <div className="relative z-10 w-full mt-auto pt-8 border-t border-white/5 flex justify-between gap-2 overflow-x-auto no-scrollbar">
              {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((p) => {
                  const isNext = p === nextPrayer?.name;
                  return (
                      <div key={p} className={`flex flex-col items-center gap-2 transition-all ${isNext ? 'opacity-100 scale-110' : 'opacity-30'}`}>
                          <span className={`text-[8px] md:text-[10px] font-black uppercase ${isNext ? 'text-[#D4AF37]' : 'text-white'}`}>{p}</span>
                          <div className={`w-1.5 h-1.5 rounded-full ${isNext ? 'bg-[#D4AF37] shadow-[0_0_15px_#D4AF37]' : 'bg-white/20'}`}></div>
                      </div>
                  );
              })}
           </div>
        </div>

        {/* 2. Quran Resume */}
        <div onClick={() => navigate(lastRead ? `/quran/${lastRead.number}` : '/quran')} className="md:col-span-12 lg:col-span-5 relative group cursor-pointer overflow-hidden rounded-[2.5rem] md:rounded-[3rem] bg-[#0a0a0a] border border-white/5 p-8 md:p-12 flex flex-col justify-between hover:border-[#D4AF37]/30 transition-all shadow-xl min-h-[260px] md:min-h-[360px] active:scale-[0.98]">
           <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 to-transparent opacity-50"></div>
           <div className="absolute right-0 top-0 p-8 md:p-12 opacity-5 group-hover:opacity-10 transition-opacity"><BookOpen size={100} className="md:w-32 md:h-32" /></div>
           
           <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6 md:mb-10">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-black border border-white/10 flex items-center justify-center text-[#D4AF37] shadow-xl">
                      <BookOpen size={24} md:size={28} />
                  </div>
                  <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] text-gray-600">Sacred Path</span>
              </div>
              
              <div className="space-y-1 md:space-y-3 mt-auto mb-8 md:mb-12">
                  <p className="text-[9px] md:text-[11px] text-gray-500 font-black uppercase tracking-widest">Continue Reading</p>
                  <h3 className="text-3xl md:text-5xl font-cinzel font-black text-white truncate leading-tight tracking-wide">
                      {lastRead ? lastRead.surah : "Al-Fatiha"}
                  </h3>
                  {lastRead && <p className="text-sm md:text-lg text-gray-400 font-mono font-bold tracking-widest">Ayah {lastRead.ayah}</p>}
              </div>
              
              <button className="w-full py-4 md:py-6 bg-[#D4AF37] text-black font-black uppercase text-[10px] md:text-[12px] rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] transition-transform">
                  Resume Journey <ChevronRight size={18} />
              </button>
           </div>
        </div>

        {/* 3. Ayat of the Moment */}
        <div className="md:col-span-12 lg:col-span-8 p-1 rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/5 to-transparent relative group">
            <div className="bg-[#0c0c0c] rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-14 h-full border border-white/5 relative overflow-hidden flex flex-col justify-center gap-8 md:gap-10 shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03]"><Quote size={120} /></div>
                
                <div className="flex items-center gap-4 relative z-10">
                    <span className="px-4 py-1.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-[9px] md:text-[11px] font-black uppercase tracking-widest border border-[#D4AF37]/20">Ayat of the Moment</span>
                    <div className="h-px flex-1 bg-white/5"></div>
                </div>

                <div className="space-y-6 md:space-y-10 text-center md:text-left relative z-10">
                    <p className="font-arabic text-3xl sm:text-4xl md:text-6xl text-white leading-[1.8] md:leading-[2.2] gold-shimmer" dir="rtl">
                        {dailyAyat.text}
                    </p>
                    <p className="text-gray-400 text-sm md:text-xl font-light italic leading-relaxed max-w-3xl">
                        "{dailyAyat.trans}"
                    </p>
                </div>

                <div className="flex justify-end mt-auto relative z-10">
                    <p className="text-[9px] md:text-[12px] font-black text-gray-700 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-lg border border-white/5">{dailyAyat.ref}</p>
                </div>
            </div>
        </div>

        {/* 4. Sunnah of the Moment */}
        <div className="md:col-span-12 lg:col-span-4 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] bg-emerald-950/10 border border-emerald-500/20 relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/40 transition-all min-h-[280px] shadow-2xl">
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex justify-between items-start relative z-10">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-xl">
                    <Feather size={24} md:size={28} />
                </div>
                <span className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-emerald-600/70">Sunnah of the Moment</span>
            </div>

            <div className="space-y-3 md:space-y-4 relative z-10 my-8">
                <h4 className="font-cinzel text-xl md:text-3xl font-black text-white uppercase tracking-widest leading-tight">{dailySunnah.title}</h4>
                <p className="text-sm md:text-lg text-gray-500 font-light leading-relaxed line-clamp-4">
                    "{dailySunnah.body}"
                </p>
            </div>

            <div className="flex items-center gap-3 text-[10px] md:text-[12px] font-black text-emerald-500 uppercase tracking-widest relative z-10">
                <Sparkles size={14} className="animate-pulse" /> {dailySunnah.source}
            </div>
        </div>

      </div>
      <style>{`
        .gold-shimmer { background: linear-gradient(90deg, #F3E5AB 0%, #D4AF37 50%, #B8860B 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 4s linear infinite; }
        @keyframes shimmer { to { background-position: 200% center; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default HomePage;