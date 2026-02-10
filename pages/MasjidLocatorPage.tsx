import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Phone, Clock, Search, Info, Loader2, RefreshCw, AlertCircle, ExternalLink, ShieldAlert } from 'lucide-react';
import { getNearbyMasjidsFromAI } from '../services/gemini';

interface Masjid {
  name: string;
  address: string;
  url?: string;
  distance?: string;
}

const MasjidLocatorPage: React.FC = () => {
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isInsecureOrigin, setIsInsecureOrigin] = useState(false);

  useEffect(() => {
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setIsInsecureOrigin(true);
      setLoading(false);
      return;
    }
    getLocation();
  }, []);

  const getLocation = () => {
    setLoading(true);
    setError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          fetchNearbyMasjids(coords.lat, coords.lng);
        },
        (err) => {
          console.error("Geo Error:", err);
          setError(err.code === 1 ? "Location access denied." : "Unable to retrieve location.");
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    } else {
      setError("Geolocation is not supported.");
      setLoading(false);
    }
  };

  const fetchNearbyMasjids = async (lat: number, lng: number) => {
    try {
      const result = await getNearbyMasjidsFromAI(lat, lng);
      if (result.text === "UNAVAILABLE") {
        setError("Search engine is resting.");
        return;
      }
      const grounded = result.masjids;
      const lines = result.text.split('\n').filter(l => l.trim().length > 5);
      const parsedFromText: Masjid[] = [];
      lines.forEach((line) => {
          const cleanLine = line.replace(/^\d+\.\s*/, '').replace(/^[*#-]\s*/, '').trim();
          if (cleanLine.includes(':')) {
              const [name, address] = cleanLine.split(':');
              parsedFromText.push({ name: name.trim(), address: address.trim() });
          } else if (cleanLine.length > 15) {
              const parts = cleanLine.split(/-(.+)/);
              parsedFromText.push({ name: parts[0]?.trim() || "Masjid", address: parts[1]?.trim() || cleanLine });
          }
      });
      const finalMasjids: Masjid[] = grounded.map((g) => {
          const textMatch = parsedFromText.find(pt => pt.name.toLowerCase().includes(g.name.toLowerCase()) || g.name.toLowerCase().includes(pt.name.toLowerCase()));
          return { name: g.name, address: textMatch?.address || "Address on map", url: g.url };
      });
      setMasjids(finalMasjids.length > 0 ? finalMasjids : parsedFromText.slice(0, 5));
    } catch (e) { setError("Map connection failed."); } finally { setLoading(false); }
  };

  if (isInsecureOrigin) {
    return (
      <div className="py-10 md:py-20 flex flex-col items-center justify-center text-center px-6 max-w-2xl mx-auto space-y-6 md:space-y-8 animate-enter">
          <div className="p-6 md:p-8 bg-red-900/10 rounded-full text-red-500 border border-red-500/20">
              <ShieldAlert size={48} md:size={64} strokeWidth={1} />
          </div>
          <div className="space-y-2 md:space-y-4">
              <h2 className="text-2xl md:text-3xl font-cinzel font-black text-white uppercase tracking-widest">Insecure Context</h2>
              <p className="text-xs md:text-sm text-gray-400 font-light leading-relaxed">
                  HTTPS is required for location features.
              </p>
          </div>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-[#D4AF37] text-black rounded-xl font-black uppercase tracking-widest text-[9px]">Retry</button>
      </div>
    );
  }

  return (
    <div className="py-4 md:py-10 space-y-6 md:space-y-16 max-w-5xl mx-auto pb-40 px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 text-center md:text-left">
        <div className="space-y-2 md:space-y-4">
          <div className="inline-flex items-center gap-2 glass border-[#D4AF37]/20 px-4 md:px-6 py-1.5 md:py-2 rounded-full">
            <MapPin size={12} className="text-[#D4AF37]" />
            <span className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-[0.4em] md:tracking-[0.6em]">GPS Synchronized</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-cinzel font-black text-white leading-none">
            Masjid <span className="gold-shimmer">Locator</span>
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm md:text-lg font-light tracking-wide">Real-time grounding via Google Maps.</p>
        </div>
        <button 
          onClick={getLocation}
          disabled={loading}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-6 md:px-8 py-3.5 md:py-4 bg-[#D4AF37] text-black rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-xl active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {loading ? "Acquiring Link..." : "Refresh Map"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
        {/* Radar View - Optimized aspect ratios for mobile & tablets */}
        <div className="lg:col-span-7 relative aspect-[4/3] sm:aspect-square md:aspect-video lg:aspect-auto min-h-[250px] sm:min-h-[350px] md:min-h-[500px] rounded-[1.5rem] md:rounded-[4rem] bg-[#050505] border border-white/5 overflow-hidden shadow-2xl flex items-center justify-center">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
          
          {loading ? (
             <div className="relative z-10 flex flex-col items-center gap-4 md:gap-6 animate-pulse">
                <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin"></div>
                <p className="text-[7px] md:text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37]">Scanning Horizons...</p>
             </div>
          ) : error ? (
             <div className="relative z-10 text-center space-y-4 md:space-y-6 max-w-[200px] sm:max-w-xs md:max-w-sm px-4">
                <AlertCircle size={28} md:size={48} className="text-red-500 mx-auto opacity-50" />
                <p className="text-[10px] md:text-sm text-gray-400 font-light">{error}</p>
                <button onClick={getLocation} className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-[#D4AF37] underline underline-offset-4">Try Again</button>
             </div>
          ) : (
             <>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] h-[75%] md:w-[80%] md:h-[80%] border border-[#D4AF37]/10 rounded-full animate-[ping_4s_linear_infinite] pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#D4AF37]">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#D4AF37] blur-2xl opacity-20 rounded-full"></div>
                        <MapPin size={28} md:size={48} className="relative z-10" />
                    </div>
                </div>

                {masjids.map((m, i) => (
                    <div key={i} className="absolute text-[#D4AF37]" style={{ 
                        top: `${35 + (Math.sin(i * 1.5) * 20)}%`, left: `${50 + (Math.cos(i * 1.5) * 30)}%` 
                    }}>
                        <div className="relative group/pin cursor-pointer" onClick={() => m.url && window.open(m.url, '_blank')}>
                            <MapPin size={16} md:size={24} className="opacity-60 hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                ))}
             </>
          )}

          <div className="absolute bottom-2 md:bottom-8 inset-x-2 md:inset-x-8 glass border-white/10 p-3 md:p-6 rounded-[1rem] md:rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-2 md:gap-3">
             <div className="flex items-center gap-2 md:gap-3">
                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${loading ? 'text-yellow-500' : 'text-green-500'} animate-pulse bg-current`}></div>
                <span className="text-[6px] md:text-[9px] font-black uppercase tracking-widest text-white">
                    {loading ? 'Acquiring Link' : 'Location Synchronized'}
                </span>
             </div>
             {userCoords && (
                 <span className="text-[5px] md:text-[8px] font-mono text-gray-500 tabular-nums">
                    {userCoords.lat.toFixed(3)}°N, {userCoords.lng.toFixed(3)}°E
                 </span>
             )}
          </div>
        </div>

        {/* List of Nearby Mosques - Better mobile list density */}
        <div className="lg:col-span-5 flex flex-col gap-3 md:gap-6 min-h-0">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-[8px] md:text-xs font-black uppercase tracking-[0.4em] text-gray-600">Local Sanctuaries</h3>
              <span className="text-[7px] md:text-[10px] font-bold text-gray-800 tabular-nums">{masjids.length} Results</span>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 md:gap-4 overflow-y-auto max-h-[400px] lg:max-h-none lg:flex-1 lg:h-auto custom-scrollbar pb-16 md:pb-24">
              {loading ? (
                [...Array(3)].map((_, i) => (
                    <div key={i} className="p-5 md:p-8 rounded-[1.2rem] md:rounded-[2.5rem] bg-white/[0.02] border border-white/5 animate-pulse h-24 md:h-32"></div>
                ))
              ) : masjids.map((masjid, i) => (
                <div 
                    key={i} 
                    onClick={() => masjid.url && window.open(masjid.url, '_blank')}
                    className="premium-card p-4 md:p-8 rounded-[1.2rem] md:rounded-[2.5rem] transition-all hover:border-[#D4AF37]/30 bg-[#0a0a0a] cursor-pointer group active:scale-98"
                >
                    <div className="flex justify-between items-start mb-2 md:mb-4">
                        <div className="space-y-0.5 md:space-y-1 flex-1 min-w-0">
                            <h4 className="font-cinzel text-[10px] sm:text-xs md:text-sm font-black text-white uppercase group-hover:text-[#D4AF37] line-clamp-1 break-words">{masjid.name}</h4>
                            <div className="flex items-center gap-1.5 md:gap-2 text-[6px] md:text-[8px] font-black text-gray-600 uppercase tracking-widest">
                                <Clock size={8} md:size={10} className="text-[#D4AF37]/50" /> Grounded Result
                            </div>
                        </div>
                        <div className="p-1.5 md:p-2 rounded-lg bg-white/5 text-gray-500 group-hover:text-[#D4AF37] shrink-0 ml-2">
                            <ExternalLink size={10} md:size={14} />
                        </div>
                    </div>
                    <div className="space-y-3 md:space-y-4">
                        <p className="text-[7px] md:text-[10px] font-bold uppercase tracking-widest text-gray-600 line-clamp-2 leading-relaxed h-[20px] md:h-auto">{masjid.address}</p>
                        <button className="w-full py-2.5 md:py-3 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] text-[7px] md:text-[9px] font-black uppercase tracking-widest group-hover:bg-[#D4AF37] group-hover:text-black transition-all">Get Directions</button>
                    </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default MasjidLocatorPage;