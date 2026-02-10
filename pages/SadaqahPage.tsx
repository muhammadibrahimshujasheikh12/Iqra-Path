
import React from 'react';
import { HeartHandshake, Zap, Smile, MessageCircle, Handshake, Sparkles, ArrowUpRight } from 'lucide-react';

const SadaqahPage: React.FC = () => {
  const acts = [
    { label: "A Sincere Smile", icon: <Smile />, desc: "Smiling in the face of your brother is charity." },
    { label: "Removing Obstacles", icon: <Zap />, desc: "Clearing a path for others brings divine blessings." },
    { label: "A Kind Word", icon: <MessageCircle />, desc: "Beautiful speech is a continuous form of Sadaqah." },
    { label: "Helping a Neighbor", icon: <Handshake />, desc: "Small acts of service are heavy on the scales." },
  ];

  return (
    <div className="py-10 space-y-20 max-w-5xl mx-auto pb-40">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-3 glass border-[#D4AF37]/20 px-6 py-2 rounded-full">
          <HeartHandshake size={16} className="text-[#D4AF37]" />
          <span className="text-[10px] font-black text-white uppercase tracking-[1em]">The Art of Giving</span>
        </div>
        <h2 className="text-6xl md:text-8xl font-cinzel font-black text-white leading-none tracking-tight">
          Pure <span className="gold-shimmer">Sadaqah</span>
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto text-xl font-light leading-relaxed">
          Beyond wealth. Sadaqah is the character of a believer. Every small act is a signature of faith on your soul.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {acts.map((act, i) => (
           <div key={i} className="premium-card p-10 rounded-[3rem] text-center flex flex-col items-center group hover:scale-105 transition-all duration-700">
              <div className="w-16 h-16 rounded-[1.5rem] bg-[#050505] border border-white/5 flex items-center justify-center text-[#D4AF37] mb-8 group-hover:border-[#D4AF37]/40 group-hover:shadow-2xl transition-all">
                 {React.cloneElement(act.icon as React.ReactElement<any>, { size: 28, strokeWidth: 1.5 })}
              </div>
              <h4 className="font-cinzel text-sm font-black text-white uppercase tracking-widest mb-3">{act.label}</h4>
              <p className="text-[10px] text-gray-600 leading-relaxed font-bold uppercase tracking-widest">{act.desc}</p>
           </div>
        ))}
      </div>

      <section className="premium-card p-16 rounded-[4rem] bg-gradient-to-br from-[#1B4332]/20 to-transparent border-[#1B4332]/30 flex flex-col md:flex-row items-center gap-16 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Sparkles size={300} strokeWidth={0.5} />
         </div>
         <div className="space-y-8 flex-1 relative z-10 text-center md:text-left">
            <h3 className="text-4xl font-cinzel font-black text-white tracking-[0.1em] uppercase">Sadaqah Jariyah</h3>
            <p className="text-lg text-gray-500 font-light leading-relaxed max-w-xl">
               Invest in a legacy that outlives your life. Support mosques, wells, and knowledge centers that continue to reward you forever.
            </p>
            <div className="flex gap-6 justify-center md:justify-start">
               <button className="px-10 py-5 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-[0.5em] rounded-2xl shadow-xl hover:scale-105 transition-all">
                  Browse Opportunities
               </button>
               <button className="px-10 py-5 glass border-white/10 text-white text-[10px] font-black uppercase tracking-[0.5em] rounded-2xl hover:bg-white/5 transition-all flex items-center gap-3">
                  Read Benefits <ArrowUpRight size={14} />
               </button>
            </div>
         </div>
      </section>

      <div className="text-center py-12 space-y-4">
        <p className="text-[11px] text-[#D4AF37] font-black uppercase tracking-[1em] opacity-40">IqraPath Charity Mindset</p>
        <p className="text-sm text-gray-700 font-light italic max-w-xl mx-auto leading-relaxed">
           "Charity does not decrease wealth." — Our mission is to facilitate the flow of barakah through the Ummah.
        </p>
      </div>
    </div>
  );
};

export default SadaqahPage;
