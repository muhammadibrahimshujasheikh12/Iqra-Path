import React from 'react';
import { useNavigate } from 'react-router-dom';
import { KNOWLEDGE_CATEGORIES } from '../constants';
import { ChevronRight, Sparkles, BookCheck, ShieldCheck, GraduationCap, BookOpen, Star, BookText, Globe, MessageCircle, PlayCircle } from 'lucide-react';

const KnowledgeHub: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="py-10 space-y-20 max-w-5xl mx-auto pb-40">
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="inline-flex items-center gap-3 glass border-[#D4AF37]/20 px-6 py-2 rounded-full">
          <BookCheck size={14} className="text-[#D4AF37]" />
          <span className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-[0.6em]">Sacred Repository</span>
        </div>
        <h2 className="text-3xl sm:text-6xl md:text-8xl font-cinzel font-black text-white leading-none tracking-tight">
          Divine <span className="gold-shimmer">Foundations</span>
        </h2>
        <p className="text-gray-500 max-w-2xl text-xs sm:text-lg md:text-xl font-light leading-relaxed px-4">
          The curated sanctuary of authentic Islamic knowledge. Built upon the firm foundations of the Quran and authentic Sunnah.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {KNOWLEDGE_CATEGORIES.map((cat) => (
          <div 
            key={cat.id}
            onClick={() => navigate(`/${cat.id}`)}
            className="premium-card group relative p-12 rounded-[3.5rem] cursor-pointer overflow-hidden transition-all duration-700"
          >
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
              {React.cloneElement(cat.icon as React.ReactElement<any>, { size: 200, strokeWidth: 0.5 })}
            </div>
            
            <div className="space-y-8 relative z-10">
              <div className="w-20 h-20 rounded-[2rem] bg-[#050505] border border-white/5 flex items-center justify-center group-hover:border-[#D4AF37]/50 group-hover:shadow-2xl transition-all duration-700">
                <div className="text-[#D4AF37]">
                  {React.cloneElement(cat.icon as React.ReactElement<any>, { size: 36, strokeWidth: 1.5 })}
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg sm:text-2xl md:text-3xl font-cinzel font-black text-white tracking-widest uppercase group-hover:text-[#D4AF37] transition-colors">
                  {cat.label}
                </h3>
                <p className="text-[10px] sm:text-sm md:text-base text-gray-500 font-light leading-relaxed tracking-wide">
                  {cat.description}
                </p>
              </div>
              <div className="flex items-center gap-4 text-[9px] md:text-[10px] font-black text-[#D4AF37]/40 uppercase tracking-[0.5em] group-hover:text-[#D4AF37] transition-colors">
                <span>Explore Wisdom</span>
                <ChevronRight size={14} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KnowledgeHub;