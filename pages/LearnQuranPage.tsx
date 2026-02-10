
import React from 'react';
import { GraduationCap, PlayCircle, BookOpen, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

const LearnQuranPage: React.FC = () => {
  const levels = [
    { id: 1, title: "The Foundation", sub: "Arabic Alphabet & Phonetics", progress: 100, status: "Mastered", color: "text-[#D4AF37]" },
    { id: 2, title: "Connecting Hearts", sub: "Word Construction & Joining", progress: 45, status: "In Progress", color: "text-blue-400" },
    { id: 3, title: "The Flow of Light", sub: "Introduction to Tajwid", progress: 0, status: "Locked", color: "text-gray-700" },
    { id: 4, title: "Divine Articulation", sub: "Advanced Rules of Recitation", progress: 0, status: "Locked", color: "text-gray-800" },
  ];

  return (
    <div className="py-10 space-y-16 max-w-5xl mx-auto pb-40">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-3 glass border-[#D4AF37]/20 px-6 py-2 rounded-full">
          <GraduationCap size={16} className="text-[#D4AF37]" />
          <span className="text-[10px] font-black text-white uppercase tracking-[1em]">Academy of Light</span>
        </div>
        <h2 className="text-6xl md:text-8xl font-cinzel font-black text-white leading-none tracking-tight">
          Learn <span className="gold-shimmer">Quran</span>
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto text-xl font-light leading-relaxed">
          From the first letter to the rhythmic flow of Tajwid. A structured path for seekers of all ages.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {levels.map((lvl) => (
           <div key={lvl.id} className={`premium-card p-12 rounded-[3.5rem] relative overflow-hidden group ${lvl.status === 'Locked' ? 'opacity-40 grayscale pointer-events-none' : 'hover:scale-102 cursor-pointer'}`}>
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <span className="text-[150px] font-cinzel font-black">{lvl.id}</span>
              </div>
              
              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                   <div className={`w-14 h-14 rounded-2xl bg-[#050505] border border-white/5 flex items-center justify-center ${lvl.color}`}>
                      {lvl.progress === 100 ? <CheckCircle2 size={24} /> : <BookOpen size={24} />}
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-600">Level 0{lvl.id}</span>
                </div>

                <div className="space-y-3">
                   <h3 className="text-3xl font-cinzel font-black text-white tracking-widest uppercase">{lvl.title}</h3>
                   <p className="text-base text-gray-500 font-light tracking-wide italic">{lvl.sub}</p>
                </div>

                <div className="space-y-4">
                   <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#D4AF37] to-transparent transition-all duration-1000" style={{ width: `${lvl.progress}%` }}></div>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{lvl.status}</span>
                      <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] group-hover:translate-x-2 transition-transform">
                         {lvl.progress === 0 ? 'Enroll Now' : 'Continue'} <ChevronRight size={14} />
                      </button>
                   </div>
                </div>
              </div>
           </div>
        ))}
      </div>

      {/* Featured Lesson Video Snippet */}
      <div className="premium-card p-16 rounded-[4rem] flex flex-col md:flex-row items-center gap-16 shadow-2xl">
         <div className="relative aspect-video w-full md:w-80 rounded-[2.5rem] bg-black overflow-hidden group">
            <img src="https://images.unsplash.com/photo-1591115711431-299f01715206?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-[2000ms]" alt="Lesson" />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-16 h-16 rounded-full glass flex items-center justify-center text-[#D4AF37] shadow-2xl">
                  <PlayCircle size={32} />
               </div>
            </div>
         </div>
         <div className="space-y-6 flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 text-[#D4AF37]/50 font-black text-[10px] uppercase tracking-[0.5em]">
               <Sparkles size={14} /> Lesson of the Day
            </div>
            <h3 className="text-3xl font-cinzel font-black text-white tracking-[0.1em] uppercase leading-tight">Makharij al-Huruf: <br /> Points of Articulation</h3>
            <p className="text-gray-500 font-light max-w-lg">Master the 17 exit points of the Arabic letters to perfect your recitation. Essential for Level 3 students.</p>
         </div>
      </div>
    </div>
  );
};

export default LearnQuranPage;
