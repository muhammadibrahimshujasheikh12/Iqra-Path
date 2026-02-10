import React, { useState, useEffect } from 'react';
import { fetchPrayerTimes, fetchPrayerTimesByIP, fetchPrayerTimesByCity, getReverseGeocoding } from '../services/prayerService';
import { PrayerTimes } from '../types';
import { Sun, Moon, MapPin, RefreshCw, Navigation, Compass, AlertCircle, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';

const formatTime12h = (time24: string | undefined) => {
  if (!time24) return "--:--";
  try {
    const [h, m] = time24.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${suffix}`;
  } catch (e) { return "--:--"; }
};

const PrayerPage: React.FC = () => {
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [currentPrayer, setCurrentPrayer] = useState<string>('...');
  const [loading, setLoading] = useState(true);
  const [locationType, setLocationType] = useState<'GPS' | 'IP' | 'Default' | 'Profile'>('Default');
  const [locationName, setLocationName] = useState<string>('');
  
  const [qiblaAngle, setQiblaAngle] = useState<number>(0);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [isCompassActive, setIsCompassActive] = useState(false);

  useEffect(() => { 
    loadData();
    const handleOrientation = (e: any) => {
        let heading = 0;
        if (e.webkitCompassHeading !== undefined) {
          heading = e.webkitCompassHeading;
        } else if (e.absolute) {
          heading = 360 - e.alpha;
        } else if (e.alpha !== null) {
          heading = 360 - e.alpha;
        } else {
          return;
        }
        // Normalize heading for smoother UI transition
        setDeviceHeading(heading);
        setIsCompassActive(true);
    };
    
    // Support both modern and absolute orientation events
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
    
    return () => {
        window.removeEventListener('deviceorientationabsolute', handleOrientation);
        window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const calculateQibla = (lat: number, lng: number) => {
    const KAABA_LAT = 21.422487, KAABA_LNG = 39.826206;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const phiK = toRad(KAABA_LAT), lambdaK = toRad(KAABA_LNG);
    const phi = toRad(lat), lambda = toRad(lng);
    const y = Math.sin(lambdaK - lambda);
    const x = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda);
    const angle = (Math.atan2(y, x) * 180) / Math.PI;
    setQiblaAngle((angle + 360) % 360);
  };

  const loadData = async () => {
      setLoading(true);
      if (isSupabaseConfigured()) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              const { data } = await supabase.from('profiles').select('city, country').eq('id', user.id).single();
              if (data?.city && data?.country) {
                  try {
                      const ct = await fetchPrayerTimesByCity(data.city, data.country);
                      setTimes(ct); determineCurrent(ct); setLocationType('Profile'); setLocationName(`${data.city}, ${data.country}`);
                      setLoading(false); return;
                  } catch (e) {}
              }
          }
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
              const { latitude, longitude } = pos.coords;
              const d = await fetchPrayerTimes(latitude, longitude);
              const name = await getReverseGeocoding(latitude, longitude);
              setTimes(d); determineCurrent(d); calculateQibla(latitude, longitude); setLocationType('GPS'); setLocationName(name);
              setLoading(false);
        }, async () => { await fallbackToIP(); setLoading(false); }, { timeout: 10000 });
      } else { await fallbackToIP(); setLoading(false); }
  };

  const fallbackToIP = async () => {
      const { times: t, method } = await fetchPrayerTimesByIP();
      setTimes(t); determineCurrent(t); setLocationType(method);
      setLocationName(method === 'IP' ? "Approximate Area" : "Standard Zone");
  };

  const determineCurrent = (data: PrayerTimes) => {
    const now = new Date(), cur = now.getHours() * 60 + now.getMinutes();
    const list = [ {n:'Fajr', t:data.Fajr}, {n:'Dhuhr', t:data.Dhuhr}, {n:'Asr', t:data.Asr}, {n:'Maghrib', t:data.Maghrib}, {n:'Isha', t:data.Isha} ];
    let found = 'Isha';
    for (const p of list) { const [h, m] = p.t.split(':').map(Number); if (cur >= (h * 60 + m)) found = p.n; }
    setCurrentPrayer(found);
  };

  const requestCompassPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') setIsCompassActive(true);
      } catch (e) { console.error(e); }
    } else {
        setIsCompassActive(true);
    }
  };

  if (loading && !times) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
              <Loader2 className="animate-spin text-[#D4AF37]" size={48} />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37]">Aligning Sacred Time...</p>
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 md:space-y-20 animate-enter pb-40 px-2 md:px-4">
       <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass border-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:border-[#D4AF37]/40 transition-all" onClick={loadData}>
             <MapPin size={12} className={locationType === 'GPS' ? "text-green-500" : "text-[#D4AF37]"} />
             {locationName || "Detecting Location..."} <RefreshCw size={10} className="ml-2 opacity-30" />
          </div>
          <h1 className="text-fluid-h1 font-cinzel font-black text-white leading-none tracking-tight">Sacred <span className="gold-shimmer">Schedule</span></h1>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
          <div className="lg:col-span-7 space-y-8 order-2 lg:order-1">
            <div className="premium-card p-10 md:p-16 rounded-[2.5rem] md:rounded-[4rem] text-center relative overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08),transparent_70%)]"></div>
                <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.5em] mb-6">Active Prayer</p>
                <h2 className="text-6xl md:text-8xl lg:text-9xl font-cinzel font-black text-white leading-none tracking-tighter uppercase">{currentPrayer}</h2>
                <p className="font-mono text-2xl md:text-5xl text-white/40 mt-6 tracking-widest">
                   {times ? formatTime12h((times as any)[currentPrayer]) : '--:--'}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((p) => (
                    <div key={p} className={`p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border transition-all duration-500 flex items-center justify-between shadow-lg ${p === currentPrayer ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 scale-[1.01]' : 'bg-[#0a0a0a] border-white/5 opacity-50 hover:opacity-100 hover:border-white/20'}`}>
                        <div className="flex items-center gap-4 md:gap-6">
                            <div className={`w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border transition-colors ${p === currentPrayer ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-black text-gray-700 border-white/10'}`}>
                                {['Fajr', 'Isha'].includes(p) ? <Moon size={20} /> : <Sun size={20} />}
                            </div>
                            <div>
                                <h4 className="font-cinzel font-black text-base md:text-xl text-white uppercase tracking-wider">{p}</h4>
                                <p className="text-[8px] md:text-[10px] text-gray-600 uppercase font-black tracking-widest">{p === currentPrayer ? 'Active' : 'Upcoming'}</p>
                            </div>
                        </div>
                        <span className="font-mono text-lg md:text-3xl text-white/60">
                          {times ? formatTime12h((times as any)[p]) : '--:--'}
                        </span>
                    </div>
                ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8 order-1 lg:order-2 sticky top-24">
            <div className="premium-card p-10 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] relative overflow-hidden flex flex-col items-center shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none"><Compass size={250} /></div>
                <h3 className="font-cinzel text-xl font-black text-white uppercase tracking-widest mb-12 flex items-center gap-4">Qibla <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse"></span></h3>
                {/* Outer Ring: Rotates to align phone with North */}
                <div className="relative w-full aspect-square max-w-[320px] bg-black rounded-full border border-white/10 shadow-[inset_0_0_50px_rgba(0,0,0,1)] flex items-center justify-center p-8 transition-transform duration-[100ms] ease-out" style={{ transform: isCompassActive ? `rotate(${-deviceHeading}deg)` : 'none' }}>
                    <div className="absolute inset-4 border border-dashed border-white/5 rounded-full"></div>
                    <div className="absolute top-6 font-black text-gray-700 text-[10px]">N</div>
                    <div className="absolute bottom-6 font-black text-gray-700 text-[10px]">S</div>
                    <div className="absolute left-6 font-black text-gray-700 text-[10px]">W</div>
                    <div className="absolute right-6 font-black text-gray-700 text-[10px]">E</div>
                    {/* Inner Needle: Rotates to the calculated Qibla angle relative to North */}
                    <div className="absolute w-full h-full flex items-center justify-center transition-transform duration-[500ms]" style={{ transform: `rotate(${qiblaAngle}deg)` }}>
                        <div className="relative w-1 h-[80%] bg-gradient-to-t from-transparent via-[#D4AF37] to-transparent">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#D4AF37] rounded-full shadow-[0_0_20px_#D4AF37] flex items-center justify-center"><div className="w-1 h-1 bg-black rounded-full"></div></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass border border-[#D4AF37]/40 flex items-center justify-center animate-pulse"><Navigation size={16} className="text-[#D4AF37] fill-[#D4AF37]" /></div>
                        </div>
                    </div>
                </div>
                <div className="mt-12 text-center space-y-4">
                   <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">{Math.round(qiblaAngle)}° Heading to Kaaba</p>
                   {!isCompassActive && <button onClick={requestCompassPermission} className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase text-[#D4AF37] hover:bg-white/10 transition-all flex items-center gap-2"><Compass size={12} /> Sync Compass</button>}
                </div>
            </div>
            <div className="premium-card p-10 rounded-[2.5rem] bg-gradient-to-br from-[#0c0c0c] to-black border-white/5 text-center space-y-4">
                <AlertCircle className="text-gray-700 mx-auto" size={24} />
                <p className="text-[10px] text-gray-500 font-light leading-relaxed italic">"Turn then your face toward al-Masjid al-Haram. And wherever you are, turn your faces toward it." (2:144)</p>
            </div>
          </div>
       </div>
       <style>{`
         .gold-shimmer { background: linear-gradient(90deg, #F3E5AB 0%, #D4AF37 50%, #B8860B 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 5s linear infinite; }
         @keyframes shimmer { to { background-position: 200% center; } }
       `}</style>
    </div>
  );
};

export default PrayerPage;