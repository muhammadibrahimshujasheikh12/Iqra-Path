
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, BookOpen, Star, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchSurahs } from '../services/quranService';
import { Surah } from '../types';

const QuranPage: React.FC = () => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchSurahs();
      if (data && data.length > 0) {
        setSurahs(data);
      } else {
        throw new Error('No data received');
      }
    } catch (e) {
      console.warn("Failed to load Quran data:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSurahs = surahs.filter(s => 
    s.englishName.toLowerCase().includes(search.toLowerCase()) || 
    s.number.toString().includes(search)
  );

  return (
    <div className="space-y-10 animate-enter">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-8 pb-4 border-b border-white/5">
         <div className="space-y-4">
            <h1 className="text-5xl font-cinzel font-bold text-white">The Noble <span className="text-gradient-gold">Quran</span></h1>
            <p className="text-gray-400 font-light max-w-lg">
               Explore the divine revelation. 114 Surahs, timeless wisdom.
            </p>
         </div>
         <div className="relative w-full md:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 group-focus-within:text-[#D4AF37] transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name or number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#121212] border border-white/5 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-[#D4AF37]/50 text-gray-200 placeholder:text-gray-600 font-light tracking-wide transition-all shadow-lg"
            />
         </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
           <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
           <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Retrieving Revelation...</p>
        </div>
      ) : error ? (
        <div className="h-64 flex flex-col items-center justify-center gap-6 text-center">
           <div className="p-4 bg-red-500/10 rounded-full text-red-500">
             <AlertCircle size={32} />
           </div>
           <div>
             <h3 className="text-xl font-cinzel font-bold text-white mb-2">Connection Interrupted</h3>
             <p className="text-sm text-gray-500 max-w-md mx-auto">Unable to fetch the Surah list. Please check your internet connection.</p>
           </div>
           <button 
             onClick={loadData}
             className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-black rounded-full font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all"
           >
             <RefreshCw size={14} /> Retry Connection
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredSurahs.map((surah) => (
             <div 
               key={surah.number}
               onClick={() => navigate(`/quran/${surah.number}`)}
               className="group relative p-6 rounded-[2rem] bg-[#121212] border border-white/5 hover:border-[#D4AF37]/30 transition-all cursor-pointer hover:bg-[#1a1a1a] hover-lift overflow-hidden"
             >
                {/* Background Number */}
                <span className="absolute -bottom-4 -right-4 text-9xl font-cinzel font-black text-white/5 group-hover:text-[#D4AF37]/5 transition-colors select-none">
                   {surah.number}
                </span>

                <div className="flex items-start justify-between relative z-10">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#050505] border border-white/10 flex items-center justify-center text-[#D4AF37] font-bold font-cinzel group-hover:scale-110 transition-transform">
                         {surah.number}
                      </div>
                      <div>
                         <h3 className="font-bold text-lg text-white group-hover:text-[#D4AF37] transition-colors">{surah.englishName}</h3>
                         <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{surah.englishNameTranslation}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="font-arabic text-2xl text-gray-300 group-hover:text-[#D4AF37] transition-colors">{surah.name}</p>
                      <p className="text-[10px] text-gray-600 font-bold uppercase mt-1">{surah.numberOfAyahs} Ayahs</p>
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default QuranPage;
