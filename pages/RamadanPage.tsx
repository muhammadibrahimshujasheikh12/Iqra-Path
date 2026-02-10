import React from 'react';
import { Moon, Sun, UtensilsCrossed, Heart, Sparkles, Clock, Star, Quote } from 'lucide-react';

const RamadanPage: React.FC = () => {
  return (
    <div className="py-4 md:py-10 space-y-8 md:space-y-20 max-w-5xl mx-auto px-4 pb-40">
      {/* Cinematic Header - Fluid height for aspect ratios */}
      <section className="relative min-h-[300px] sm:min-h-[400px] md:min-h-[500px] flex items-center overflow-hidden rounded-[2rem] md:rounded-[4rem] p-1 shadow-2xl border border-white/5 group">
        <img 
          src="https://images.unsplash.com/photo-1542640244-7e672d6cef21?auto=format&fit=crop&q=80&w=1200" 
          className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-[3000ms]" 
          alt="Ramadan Night" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/80 to-transparent"></div>
        <div className="relative z-10 w-full text-center px-4 md:px-12 py-10 md:py-24 space-y-4 md:space-y-8">
          <div className="inline-flex items-center gap-2 md:gap-4 glass border-[#D4AF37]/30 px-3 md:px-6 py-1.5 md:py-2 rounded-full">
            <Moon size={12} md:size={16} className="text-[#D4AF37]" />
            <span className="text-[7px] md:text-[10px] font-black text-white uppercase tracking-[0.4em] md:tracking-[1em]">The Month of Mercy</span>
          </div>
          <h2 className="text-3xl sm:text-6xl md:text-9xl font-cinzel font-black text-white leading-none tracking-tight">
            Rama<span className="gold-shimmer">dan</span>
          </h2>
          <p className="text-[#D4AF37] font-arabic text-xl sm:text-3xl md:text-5xl opacity-80 tracking-widest leading-loose">شهر القرآن</p>
          <div className="max-w-2xl mx-auto pt-2 md:pt-8">
            <p className="text-gray-400 text-xs sm:text-sm md:text-xl font-light leading-relaxed italic px-2 md:px-4">
              "The month of Ramadan [is that] in which was revealed the Qur'an, a guidance for the people and clear proofs of guidance and criterion."
            </p>
          </div>
        </div>
      </section>

      {/* Schedule Dashboards - Dynamic column stacking */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-10">
        <div className="premium-card p-6 md:p-10 rounded-[1.5rem] md:rounded-[3.5rem] flex flex-col items-center text-center space-y-6 md:space-y-8 group">
          <div className="p-4 md:p-6 bg-[#050505] border border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] text-[#D4AF37] group-hover:border-[#D4AF37]/40 group-hover:scale-110 transition-all duration-700 shadow-2xl">
            <UtensilsCrossed size={28} md:size={40} strokeWidth={1} />
          </div>
          <div className="space-y-1 md:space-y-2">
            <h4 className="font-cinzel text-base md:text-xl font-black text-white tracking-widest uppercase">Suhoor</h4>
            <p className="text-[7px] md:text-[10px] text-gray-600 font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">The Sacred Meal</p>
          </div>
          <p className="text-3xl md:text-5xl font-mono font-black text-white gold-shimmer tracking-tighter tabular-nums">04:12 AM</p>
          <div className="w-10 md:w-16 h-px bg-white/10"></div>
          <p className="text-[9px] md:text-xs text-gray-500 font-light italic leading-relaxed px-2">Closing of the fast. Blessings are in Suhoor.</p>
        </div>

        {/* Live Highlight Card */}
        <div className="premium-card p-8 md:p-12 rounded-[1.5rem] md:rounded-[3.5rem] flex flex-col items-center text-center space-y-6 md:space-y-10 group relative border-[#D4AF37]/50 shadow-[0_30px_60px_-15px_rgba(212,175,55,0.2)] scale-100 sm:scale-105 lg:scale-110 sm:my-2 lg:my-0 order-first sm:order-none col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="absolute top-4 right-4 flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 bg-[#D4AF37] text-black text-[6px] md:text-[9px] font-black rounded-full shadow-lg">
            <Sparkles size={8} md:size={10} /> LIVE
          </div>
          <div className="p-5 md:p-8 bg-[#D4AF37] rounded-[1.5rem] md:rounded-[3rem] text-black shadow-2xl relative overflow-hidden group-hover:scale-105 transition-all duration-700">
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            <Moon size={32} md:size={56} strokeWidth={2.5} className="relative z-10" />
          </div>
          <div className="space-y-1 md:space-y-2">
            <h4 className="font-cinzel text-lg md:text-2xl font-black text-white tracking-widest uppercase">Iftar</h4>
            <p className="text-[7px] md:text-[10px] text-[#D4AF37] font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">The Moment of Opening</p>
          </div>
          <p className="text-4xl sm:text-5xl md:text-7xl font-mono font-black text-white tracking-tighter tabular-nums">06:42 PM</p>
          <div className="text-[8px] md:text-[11px] text-gray-400 font-black uppercase tracking-[0.2em] flex items-center gap-2 md:gap-3">
            <Clock size={10} md:size={14} /> 02:14:32 LEFT
          </div>
        </div>

        <div className="premium-card p-6 md:p-10 rounded-[1.5rem] md:rounded-[3.5rem] flex flex-col items-center text-center space-y-6 md:space-y-8 group">
          <div className="p-4 md:p-6 bg-[#050505] border border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] text-orange-500/80 group-hover:border-orange-500/40 group-hover:scale-110 transition-all duration-700 shadow-2xl">
            <Sun size={28} md:size={40} strokeWidth={1} />
          </div>
          <div className="space-y-1 md:space-y-2">
            <h4 className="font-cinzel text-base md:text-xl font-black text-white tracking-widest uppercase">Sunrise</h4>
            <p className="text-[7px] md:text-[10px] text-gray-600 font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">Beginning of Day</p>
          </div>
          <p className="text-3xl md:text-5xl font-mono font-black text-gray-400 tracking-tighter tabular-nums">05:48 AM</p>
          <div className="w-10 md:w-16 h-px bg-white/10"></div>
          <p className="text-[9px] md:text-xs text-gray-500 font-light italic leading-relaxed px-2">Ishraq begins 15 mins after.</p>
        </div>
      </div>

      {/* Daily Spiritual Guidance - Visualizer Optimization */}
      <section className="space-y-6 md:space-y-12">
        <div className="flex items-center gap-3 md:gap-6 px-2 md:px-4">
          <div className="w-1.5 md:w-2 h-6 md:h-10 bg-[#D4AF37] rounded-full"></div>
          <h3 className="text-lg md:text-3xl font-cinzel font-black text-white tracking-[0.1em] md:tracking-[0.2em] uppercase">Daily Duas</h3>
        </div>
        
        <div className="premium-card p-6 sm:p-8 md:p-16 rounded-[1.5rem] md:rounded-[4rem] relative overflow-hidden flex flex-col items-center gap-6 md:gap-16">
          <div className="absolute top-0 right-0 p-4 md:p-12 opacity-[0.02] pointer-events-none">
            <Star size={150} md:size={300} strokeWidth={0.5} />
          </div>
          <div className="flex-1 space-y-6 md:space-y-12 relative z-10 text-center w-full">
            <div className="inline-flex items-center gap-2 md:gap-4 text-[#D4AF37]/40 font-black text-[7px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.6em]">
              <Quote size={10} md:size={14} /> Dua for Breaking Fast
            </div>
            <div className="overflow-x-auto no-scrollbar py-2">
              <p className="font-arabic text-2xl sm:text-4xl md:text-6xl leading-[1.8] md:leading-[1.8] gold-shimmer whitespace-normal px-2 md:px-4">
                ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ
              </p>
            </div>
            <div className="pt-4 md:pt-10 border-t border-white/5 text-center px-2 md:px-4">
              <p className="text-xs sm:text-base md:text-xl text-gray-400 font-light italic leading-relaxed max-w-3xl mx-auto">
                "Thirst has gone, the arteries are moist, and the reward is certain, if Allah wills."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sadaqah Section - Flex-row to Column transition */}
      <section className="premium-card p-6 sm:p-10 md:p-16 rounded-[1.5rem] md:rounded-[4rem] bg-gradient-to-br from-[#081C15] via-[#030303] to-[#030303] border-[#1B4332]/40 flex flex-col sm:flex-row gap-8 md:gap-16 items-center shadow-2xl group text-center sm:text-left">
        <div className="p-6 md:p-10 bg-red-500/10 rounded-[1.5rem] md:rounded-[3rem] text-red-500 shrink-0 group-hover:scale-105 transition-all duration-700 shadow-2xl border border-red-500/20 relative">
          <div className="absolute inset-0 bg-red-500/5 animate-ping rounded-[1.5rem] md:rounded-[3rem]"></div>
          <Heart size={36} md:size={64} strokeWidth={1} className="relative z-10" />
        </div>
        <div className="space-y-3 md:space-y-8 flex-1 min-w-0">
          <div className="space-y-2 md:space-y-4">
            <h4 className="text-xl md:text-4xl font-cinzel font-black text-white tracking-[0.05em] md:tracking-[0.1em] uppercase">Generosity of the Heart</h4>
            <p className="text-xs sm:text-sm md:text-xl text-gray-500 font-light leading-relaxed max-w-2xl mx-auto sm:mx-0">
              The Prophet ﷺ was the most generous of people, and he was even more generous during Ramadan. Let your hands be open.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RamadanPage;