import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Circle, Trophy, Calendar, Sparkles, 
  Heart, Activity, Loader2, Plus, Trash2, PenLine, 
  Lightbulb, MessageSquare, Quote, ArrowRight, Bot, Star,
  Compass, Flame
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { getGeminiResponse } from '../services/gemini';

interface Habit {
  id: string;
  label: string;
  category: 'Salah' | 'Soul' | 'Virtue' | 'Custom';
  completed: boolean;
}

interface Recommendation {
  task: string;
  benefit: string;
  type: 'Surah' | 'Sunnah' | 'Habit';
}

const TrackerPage: React.FC = () => {
  const [baseGoals, setBaseGoals] = useState<Habit[]>([
    { id: 'fajr', label: 'Fajr Prayer', category: 'Salah', completed: false },
    { id: 'dhuhr', label: 'Dhuhr Prayer', category: 'Salah', completed: false },
    { id: 'asr', label: 'Asr Prayer', category: 'Salah', completed: false },
    { id: 'maghrib', label: 'Maghrib Prayer', category: 'Salah', completed: false },
    { id: 'isha', label: 'Isha Prayer', category: 'Salah', completed: false },
    { id: 'quran_reading', label: 'Holy Quran Reading', category: 'Soul', completed: false },
    { id: 'dhikr', label: 'Dhikr & Remembrance', category: 'Soul', completed: false },
    { id: 'charity', label: 'The Act of Sadaqah', category: 'Virtue', completed: false },
  ]);

  const [customHabits, setCustomHabits] = useState<Habit[]>([]);
  const [newHabitLabel, setNewHabitLabel] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const [coachWisdom, setCoachWisdom] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isCoachLoading, setIsCoachLoading] = useState(false);

  const getLocalTodayDate = () => new Date().toLocaleDateString('en-CA');

  useEffect(() => {
    loadTrackerData();
  }, []);

  const loadTrackerData = async () => {
    if (!isSupabaseConfigured()) return;
    setIsSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = getLocalTodayDate();
      const { data: habitDefs } = await supabase.from('custom_habits').select('*').eq('user_id', user.id);
      const { data: log } = await supabase.from('ibadah_logs').select('*').eq('user_id', user.id).eq('date', today).single();
      if (log) {
        setBaseGoals(prev => prev.map(g => ({ ...g, completed: !!log[g.id] })));
      }
      if (habitDefs) {
        const completedCustomIds = log?.custom_completions || [];
        setCustomHabits(habitDefs.map((hd: any) => ({
          id: hd.id,
          label: hd.label,
          category: 'Custom',
          completed: completedCustomIds.includes(hd.id)
        })));
      }
    } catch (err) { console.error(err); } finally { setIsSyncing(false); }
  };

  const consultCoach = async () => {
    setIsCoachLoading(true);
    const allHabits = [...baseGoals, ...customHabits];
    const completed = allHabits.filter(h => h.completed);
    const pending = allHabits.filter(h => !h.completed);

    const statsPrompt = `Analyze progress: Completed Today: ${completed.map(h => h.label).join(', ') || 'None'} Pending: ${pending.map(h => h.label).join(', ')}. Task: Provide JSON: {"wisdom": "Poetic text (NO SYMBOLS LIKE **)", "recommendations": [{ "task": "Act", "benefit": "Spiritual reward", "type": "Habit" }]}. STRICTLY FORBIDDEN: NO MARKDOWN BOLDING.`;

    try {
      const result = await getGeminiResponse(statsPrompt, "Noor Journey Coach", "application/json");
      const data = JSON.parse(result);
      setCoachWisdom(data.wisdom);
      setRecommendations(data.recommendations || []);
    } catch (e) {
      setCoachWisdom("Your sincerity is beautiful. Continue with patience.");
    } finally { setIsCoachLoading(false); }
  };

  const addFromRecommendation = (task: string) => { setNewHabitLabel(task); };

  const toggleGoal = async (id: string, isCustom: boolean) => {
    const today = getLocalTodayDate();
    let updatedBase = [...baseGoals];
    let updatedCustom = [...customHabits];
    if (isCustom) {
      updatedCustom = customHabits.map(h => h.id === id ? { ...h, completed: !h.completed } : h);
      setCustomHabits(updatedCustom);
    } else {
      updatedBase = baseGoals.map(g => g.id === id ? { ...g, completed: !g.completed } : g);
      setBaseGoals(updatedBase);
    }
    if (isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const updateObj: any = { user_id: user.id, date: today };
          updatedBase.forEach(g => { updateObj[g.id] = g.completed; });
          updateObj.custom_completions = updatedCustom.filter(h => h.completed).map(h => h.id);
          await supabase.from('ibadah_logs').upsert(updateObj);
        }
      } catch (err) { console.error(err); }
    }
  };

  const allHabits = [...baseGoals, ...customHabits];
  const completedCount = allHabits.filter(g => g.completed).length;
  const percentage = allHabits.length > 0 ? Math.round((completedCount / allHabits.length) * 100) : 0;

  return (
    <div className="py-10 space-y-12 md:space-y-16 max-w-4xl mx-auto pb-40 px-4">
      <div className="relative p-1 rounded-[3rem] md:rounded-[4rem] bg-gradient-to-br from-[#D4AF37]/30 to-transparent shadow-2xl overflow-hidden">
        <div className="relative bg-[#050505] rounded-[3rem] md:rounded-[4rem] p-10 md:p-16 overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-6 text-center md:text-left">
              <div className="inline-flex items-center gap-3 text-[#D4AF37]/60 font-black text-[10px] uppercase tracking-[0.5em]">
                {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>{isSyncing ? 'Syncing Deeds...' : 'Spiritual Elevation'}</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-cinzel font-black text-white gold-shimmer tracking-tight">Sacred Mirror</h2>
              <div className="px-5 py-2 rounded-full glass border-[#D4AF37]/20 text-[10px] font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-2 w-fit mx-auto md:mx-0">
                <Flame size={14} className="animate-pulse" /> Journey Level {Math.floor(completedCount / 5) + 1}
              </div>
            </div>
            <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" aria-label={`Progress: ${percentage}%`}>
                <circle cx="96" cy="96" r="88" stroke="rgba(212, 175, 55, 0.05)" strokeWidth="8" fill="transparent" />
                <circle cx="96" cy="96" r="88" stroke="url(#goldGradient)" strokeWidth="8" fill="transparent" strokeDasharray="552.9" strokeDashoffset={552.9 - (552.9 * percentage) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                <defs><linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#bf953f" /><stop offset="50%" stopColor="#fcf6ba" /><stop offset="100%" stopColor="#aa771c" /></linearGradient></defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-5xl font-mono font-black text-white leading-none">{percentage}%</span><span className="text-[9px] text-[#D4AF37] font-black uppercase tracking-[0.2em] mt-2">Aligned</span></div>
            </div>
          </div>
        </div>
      </div>

      <section className="animate-enter">
          <div className="premium-card p-1 rounded-[3rem] bg-gradient-to-r from-blue-500/10 via-[#D4AF37]/20 to-blue-500/10">
              <div className="bg-[#0a0a0a] rounded-[3rem] p-8 md:p-12 flex flex-col gap-10">
                  <div className="flex flex-col md:flex-row gap-10 items-center">
                    <div className="relative shrink-0"><div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#121212] to-[#050505] border border-white/10 flex items-center justify-center text-[#D4AF37] shadow-2xl overflow-hidden"><Bot size={40} strokeWidth={1} className={isCoachLoading ? 'animate-bounce' : ''} /></div><div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white border-black shadow-lg"><Star size={16} /></div></div>
                    <div className="flex-1 space-y-4 text-center md:text-left"><div className="space-y-1"><h3 className="font-cinzel text-xl font-black text-white tracking-widest uppercase">Noor Coach</h3><p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.4em]">Wisdom & Action</p></div>{coachWisdom ? (<div className="relative p-6 rounded-2xl bg-white/5 border border-white/5 animate-enter shadow-inner"><Quote className="absolute -top-3 -left-3 text-[#D4AF37]/40" size={24} /><p className="text-gray-300 text-sm font-light leading-relaxed italic">{coachWisdom}</p></div>) : (<p className="text-gray-500 text-sm font-light leading-relaxed">Peace be upon you. Share your progress for tailored soul-tasks today.</p>)}{!coachWisdom && (<button onClick={consultCoach} disabled={isCoachLoading} className="flex items-center gap-3 px-8 py-4 bg-[#D4AF37] text-black rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-xl active:scale-95 transition-all disabled:opacity-50">{isCoachLoading ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}{isCoachLoading ? "Consulting..." : "Get Guidance"}</button>)}</div>
                  </div>
                  {recommendations.length > 0 && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-enter">{recommendations.map((rec, i) => (<div key={i} className="group p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-[#D4AF37]/40 transition-all flex flex-col justify-between"><div className="space-y-4"><span className="px-3 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-[8px] font-black uppercase tracking-widest">{rec.type} Suggestion</span><h4 className="font-cinzel text-white text-sm font-black tracking-widest uppercase">{rec.task}</h4><p className="text-[10px] text-gray-500 font-light leading-relaxed">"{rec.benefit}"</p></div><button onClick={() => addFromRecommendation(rec.task)} className="mt-6 flex items-center gap-2 text-[9px] font-black text-[#D4AF37] uppercase tracking-widest hover:translate-x-2 transition-transform">Commit <ArrowRight size={12} /></button></div>))}</div>)}
              </div>
          </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <section className="space-y-8">
          <div className="flex items-center gap-4 px-4"><div className="w-1.5 h-8 bg-[#D4AF37] rounded-full"></div><h3 className="text-xs font-black uppercase tracking-[0.6em] text-white">Obligations</h3></div>
          <div className="space-y-4">{baseGoals.filter(g => g.category === 'Salah').map(goal => (<HabitItem key={goal.id} habit={goal} onToggle={() => toggleGoal(goal.id, false)} />))}</div>
        </section>
        <section className="space-y-8">
          <div className="flex items-center gap-4 px-4"><div className="w-1.5 h-8 bg-green-900 rounded-full"></div><h3 className="text-xs font-black uppercase tracking-[0.6em] text-white">Soul Care</h3></div>
          <div className="space-y-4">{baseGoals.filter(g => g.category !== 'Salah').map(goal => (<HabitItem key={goal.id} habit={goal} onToggle={() => toggleGoal(goal.id, false)} />))}</div>
        </section>
      </div>
      <style>{`
        .gold-shimmer { background: linear-gradient(90deg, #F3E5AB 0%, #D4AF37 50%, #AA771C 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 4s linear infinite; }
        @keyframes shimmer { to { background-position: 200% center; } }
      `}</style>
    </div>
  );
};

const HabitItem: React.FC<{ habit: Habit; onToggle: () => void }> = ({ habit, onToggle }) => {
  return (
    <div className={`group flex items-center justify-between p-6 rounded-[2.5rem] border transition-all duration-700 shadow-md ${habit.completed ? 'bg-[#1B4332]/10 border-[#D4AF37]/50 shadow-inner' : 'bg-white/5 border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:border-white/20'}`}>
      <button onClick={onToggle} className="flex-1 flex items-center gap-6 text-left">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${habit.completed ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'bg-[#111] text-gray-700'}`}>{habit.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}</div>
        <span className={`font-cinzel text-[11px] md:text-sm font-bold tracking-[0.1em] uppercase ${habit.completed ? 'text-white' : 'text-gray-500'}`}>{habit.label}</span>
      </button>
    </div>
  );
};

export default TrackerPage;