
import React, { useState, useEffect, useRef } from 'react';
import { 
  Fingerprint, RotateCcw, Plus, Trash2, Save, 
  ChevronRight, Sparkles, CheckCircle2, List, 
  X, Loader2, Info, Moon, Settings2, Volume2
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';

interface Tasbih {
  id: string;
  label: string;
  arabic_text?: string;
  target_count: number;
  current_count: number;
  is_preset?: boolean;
}

const PRESETS: Tasbih[] = [
  { id: 'p1', label: 'SubhanAllah', arabic_text: 'سُبْحَانَ ٱللَّٰهِ', target_count: 33, current_count: 0, is_preset: true },
  { id: 'p2', label: 'Alhamdulillah', arabic_text: 'ٱلْحَمْدُ لِلَّٰهِ', target_count: 33, current_count: 0, is_preset: true },
  { id: 'p3', label: 'Allahu Akbar', arabic_text: 'ٱللَّٰهُ أَكْبَرُ', target_count: 34, current_count: 0, is_preset: true },
  { id: 'p4', label: 'La ilaha illa Allah', arabic_text: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', target_count: 100, current_count: 0, is_preset: true },
];

const TasbihPage: React.FC = () => {
  const [activeTasbih, setActiveTasbih] = useState<Tasbih>(PRESETS[0]);
  const [userTasbihs, setUserTasbihs] = useState<Tasbih[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Form State
  const [newLabel, setNewLabel] = useState('');
  const [newTarget, setNewTarget] = useState(33);
  const [newArabic, setNewArabic] = useState('');

  const [clickPulse, setClickPulse] = useState(false);

  useEffect(() => {
    loadTasbihs();
  }, []);

  const loadTasbihs = async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('user_tasbihs').select('*').order('created_at', { ascending: false });
        if (data) {
          const formatted = data.map(t => ({
             id: t.id,
             label: t.label,
             arabic_text: t.arabic_text,
             target_count: t.target_count,
             current_count: t.current_count
          }));
          setUserTasbihs(formatted);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = () => {
    if (activeTasbih.current_count < activeTasbih.target_count || activeTasbih.target_count === 0) {
      const updated = { ...activeTasbih, current_count: activeTasbih.current_count + 1 };
      setActiveTasbih(updated);
      
      // Haptic Feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(40);
      }

      setClickPulse(true);
      setTimeout(() => setClickPulse(false), 150);

      // Persistence for user tasbihs
      if (!activeTasbih.is_preset && isSupabaseConfigured()) {
        updateDbCount(activeTasbih.id, updated.current_count);
      }
    }
  };

  const updateDbCount = async (id: string, count: number) => {
     await supabase.from('user_tasbihs').update({ current_count: count }).eq('id', id);
  };

  const handleReset = () => {
    const updated = { ...activeTasbih, current_count: 0 };
    setActiveTasbih(updated);
    if (!activeTasbih.is_preset && isSupabaseConfigured()) {
        updateDbCount(activeTasbih.id, 0);
    }
  };

  const createTasbih = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || saveLoading || !isSupabaseConfigured()) return;

    setSaveLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_tasbihs')
          .insert([{
            user_id: user.id,
            label: newLabel,
            arabic_text: newArabic,
            target_count: newTarget,
            current_count: 0
          }])
          .select()
          .single();

        if (data) {
          const created = { id: data.id, label: data.label, arabic_text: data.arabic_text, target_count: data.target_count, current_count: 0 };
          setUserTasbihs([created, ...userTasbihs]);
          setActiveTasbih(created);
          setIsNewModalOpen(false);
          setNewLabel('');
          setNewArabic('');
          setNewTarget(33);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaveLoading(false);
    }
  };

  const deleteTasbih = async (id: string) => {
    if (activeTasbih.id === id) setActiveTasbih(PRESETS[0]);
    setUserTasbihs(userTasbihs.filter(t => t.id !== id));
    if (isSupabaseConfigured()) {
        await supabase.from('user_tasbihs').delete().eq('id', id);
    }
  };

  const completionPercent = activeTasbih.target_count > 0 
    ? Math.min(100, (activeTasbih.current_count / activeTasbih.target_count) * 100)
    : 0;

  return (
    <div className="py-10 space-y-12 max-w-4xl mx-auto pb-40 px-4">
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="inline-flex items-center gap-3 glass border-[#D4AF37]/20 px-6 py-2 rounded-full">
          <Fingerprint size={14} className="text-[#D4AF37]" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.6em]">Digital Misbaha</span>
        </div>
        <h2 className="text-5xl md:text-7xl font-cinzel font-black text-white leading-none tracking-tight">
          Sacred <span className="gold-shimmer">Remembrance</span>
        </h2>
      </div>

      {/* MAIN COUNTER UI */}
      <div className="relative flex flex-col items-center gap-12 pt-10">
        
        {/* Active Title */}
        <div className="text-center space-y-4 animate-enter">
           <h3 className="font-arabic text-5xl md:text-7xl text-[#D4AF37] gold-shimmer opacity-80" dir="rtl">{activeTasbih.arabic_text}</h3>
           <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-500">{activeTasbih.label}</p>
        </div>

        {/* Counter Orb */}
        <div className="relative group">
            {/* Background Glows */}
            <div className={`absolute inset-0 rounded-full blur-[80px] transition-all duration-700 opacity-20 ${completionPercent >= 100 ? 'bg-green-500 scale-125' : 'bg-[#D4AF37]'}`}></div>
            
            <button 
                onClick={handleIncrement}
                className={`relative w-64 h-64 md:w-80 md:h-80 rounded-full bg-[#050505] border-2 transition-all duration-300 flex flex-col items-center justify-center shadow-2xl overflow-hidden active:scale-95 ${clickPulse ? 'scale-[1.02]' : 'scale-100'} ${completionPercent >= 100 ? 'border-green-500 shadow-[0_0_60px_rgba(34,197,94,0.4)]' : 'border-white/10 group-hover:border-[#D4AF37]/40'}`}
            >
                {/* Completion Wave Fill */}
                <div 
                    className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out opacity-20 ${completionPercent >= 100 ? 'bg-green-500' : 'bg-[#D4AF37]'}`} 
                    style={{ height: `${completionPercent}%` }}
                ></div>

                <div className="relative z-10 flex flex-col items-center gap-2">
                    <span className={`text-8xl md:text-9xl font-mono font-black tabular-nums transition-colors duration-500 ${completionPercent >= 100 ? 'text-green-500' : 'text-white'}`}>
                        {activeTasbih.current_count}
                    </span>
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-0.5 bg-white/10 my-2"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-600">
                           Target: {activeTasbih.target_count || '∞'}
                        </span>
                    </div>
                </div>

                {completionPercent >= 100 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 animate-pulse">
                         <CheckCircle2 size={120} className="text-green-500 opacity-20" />
                    </div>
                )}
            </button>

            {/* Tap Instructions */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[9px] font-black text-gray-700 uppercase tracking-[0.6em] animate-pulse">
                Tap Orb to Count
            </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-6 z-20">
            <button 
                onClick={handleReset}
                className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:border-white/30 transition-all"
                title="Reset Count"
            >
                <RotateCcw size={20} />
            </button>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="px-10 py-5 bg-[#D4AF37] text-black rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(212,175,55,0.3)] transition-all"
            >
                <List size={16} /> Collection
            </button>
            <button 
                onClick={() => setIsNewModalOpen(true)}
                className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 transition-all"
                title="Add Custom Dhikr"
            >
                <Plus size={24} />
            </button>
        </div>
      </div>

      {/* COLLECTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-enter">
            <div className="w-full max-w-2xl bg-[#0c0c0c] border border-white/5 rounded-[3rem] overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <h3 className="font-cinzel text-xl font-black text-white uppercase tracking-widest">Remembrance Vault</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-all"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Presets */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] ml-2">Eternal Presets</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {PRESETS.map((p) => (
                                <button 
                                    key={p.id} 
                                    onClick={() => { setActiveTasbih(p); setIsModalOpen(false); }}
                                    className={`p-6 rounded-[2rem] border text-left transition-all ${activeTasbih.id === p.id ? 'bg-[#D4AF37]/10 border-[#D4AF37]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                >
                                    <p className="font-arabic text-2xl text-white mb-2">{p.arabic_text}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{p.label}</span>
                                        <span className="text-[10px] font-mono text-[#D4AF37]">{p.target_count} Beads</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* User Saved */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center ml-2">
                             <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Personal Dhikr</h4>
                             <button onClick={() => { setIsModalOpen(false); setIsNewModalOpen(true); }} className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest hover:underline">+ Create New</button>
                        </div>
                        {userTasbihs.length === 0 ? (
                            <div className="py-12 border border-dashed border-white/5 rounded-[2rem] flex flex-col items-center text-center px-8 space-y-4">
                                <Sparkles className="text-gray-800" />
                                <p className="text-xs text-gray-600 font-light italic">Your personal treasury is empty. Add your favorite prayers below.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {userTasbihs.map((t) => (
                                    <div 
                                        key={t.id} 
                                        className={`group relative p-6 rounded-[2rem] border text-left transition-all ${activeTasbih.id === t.id ? 'bg-[#D4AF37]/10 border-[#D4AF37]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                    >
                                        <div onClick={() => { setActiveTasbih(t); setIsModalOpen(false); }} className="cursor-pointer">
                                            <p className="font-arabic text-2xl text-white mb-2">{t.arabic_text || '---'}</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t.label}</span>
                                                <span className="text-[10px] font-mono text-[#D4AF37]">{t.current_count}/{t.target_count}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => deleteTasbih(t.id)}
                                            className="absolute top-4 right-4 p-2 text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* NEW TASBIH MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-enter">
            <div className="w-full max-w-md bg-[#0c0c0c] border border-[#D4AF37]/20 rounded-[3rem] overflow-hidden shadow-2xl p-10 space-y-8">
                <div className="flex justify-between items-center">
                     <h3 className="font-cinzel text-xl font-black text-white uppercase tracking-widest">New String</h3>
                     <button onClick={() => setIsNewModalOpen(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                </div>

                <form onSubmit={createTasbih} className="space-y-6">
                    <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-4">Identifier / Label</label>
                         <input 
                            type="text" 
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            placeholder="e.g. My Morning Dhikr"
                            required
                            className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" 
                         />
                    </div>
                    <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-4">Arabic Script (Optional)</label>
                         <input 
                            type="text" 
                            value={newArabic}
                            onChange={(e) => setNewArabic(e.target.value)}
                            placeholder="سُبْحَانَ ٱللَّٰهِ"
                            className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-xl text-white font-arabic focus:outline-none focus:border-[#D4AF37]/50" 
                            dir="rtl"
                         />
                    </div>
                    <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-4">Target Count (0 for ∞)</label>
                         <input 
                            type="number" 
                            value={newTarget}
                            onChange={(e) => setNewTarget(parseInt(e.target.value) || 0)}
                            className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50 font-mono" 
                         />
                    </div>

                    <button 
                        type="submit" 
                        disabled={saveLoading || !newLabel.trim()}
                        className="w-full py-5 bg-[#D4AF37] text-black rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {saveLoading ? <Loader2 size={16} className="animate-spin" /> : <>Save to Vault <Save size={16} /></>}
                    </button>
                </form>
            </div>
        </div>
      )}

      <div className="text-center pt-10">
          <p className="text-[10px] text-gray-600 font-light max-w-sm mx-auto leading-relaxed italic">
              "Verily, in the remembrance of Allah do hearts find rest." (13:28)
          </p>
      </div>

      <style>{`
        .gold-shimmer { background: linear-gradient(90deg, #F3E5AB 0%, #D4AF37 50%, #B8860B 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 4s linear infinite; }
        @keyframes shimmer { to { background-position: 200% center; } }
      `}</style>
    </div>
  );
};

export default TasbihPage;
