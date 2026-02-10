import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Info, ShieldCheck, Heart, ArrowRight, X, 
  ExternalLink, CheckCircle2, Sparkles, Loader2, Globe,
  ShieldAlert, History, Wallet, GraduationCap
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';

interface Charity {
  name: string;
  url: string;
  tagline: string;
  logoColor: string;
}

const CHARITIES: Charity[] = [
  { name: "Islamic Relief", url: "https://www.islamic-relief.org/", tagline: "Global humanitarian response.", logoColor: "bg-blue-600" },
  { name: "Helping Hand (HHRD)", url: "https://hhrd.org/", tagline: "Global relief and development.", logoColor: "bg-green-600" },
  { name: "Muslim Aid", url: "https://www.muslimaid.org/", tagline: "Serving humanity for 30 years.", logoColor: "bg-red-600" },
  { name: "Zakat Foundation", url: "https://www.zakat.org/", tagline: "Direct zakat distribution.", logoColor: "bg-orange-600" }
];

const ZakatPage: React.FC = () => {
  const [savings, setSavings] = useState<string>('');
  const [gold, setGold] = useState<string>('');
  const [debts, setDebts] = useState<string>('');
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);

  const totalWealth = (parseFloat(savings) || 0) + (parseFloat(gold) || 0) - (parseFloat(debts) || 0);
  const zakatDue = Math.max(0, totalWealth * 0.025);

  const handleProceedToPayment = () => {
    if (zakatDue <= 0) {
      alert("Your current wealth does not require Zakat. You may consider giving optional Sadaqah.");
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handleFulfillPayment = async (charity: Charity) => {
    setSelectedCharity(charity);
    setIsProcessing(true);

    if (isSupabaseConfigured()) {
       try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
             await supabase.from('zakat_records').insert([{
                user_id: user.id,
                amount: zakatDue,
                charity_name: charity.name
             }]);
             const today = new Date().toISOString().split('T')[0];
             await supabase.from('ibadah_logs').upsert({
                user_id: user.id,
                date: today,
                charity: true
             });
          }
       } catch (e) { console.error(e); }
    }

    setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
        setTimeout(() => { window.open(charity.url, '_blank'); }, 2000);
    }, 2000);
  };

  return (
    <div className="py-4 md:py-10 space-y-8 md:space-y-20 max-w-5xl mx-auto pb-40 px-4">
      <div className="flex flex-col items-center text-center space-y-4 md:space-y-6">
        <div className="inline-flex items-center gap-3 glass border-[#D4AF37]/20 px-4 md:px-6 py-2 rounded-full">
          <ShieldCheck size={14} className="text-[#D4AF37]" />
          <span className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-[0.6em]">Third Pillar of Islam</span>
        </div>
        <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-cinzel font-black text-white leading-none tracking-tight">
          Sacred <span className="gold-shimmer">Purification</span>
        </h2>
        <p className="text-gray-500 max-w-2xl text-xs sm:text-sm md:text-xl font-light leading-relaxed px-2">
          Calculating Zakat is an act of worship. It purifies your wealth and brings barakah to your remaining provision.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
        <div className="space-y-6 md:space-y-12 order-2 lg:order-1">
          <div className="glass border-blue-500/20 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] flex gap-4 md:gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none"></div>
            <Info className="text-blue-400 shrink-0 mt-1" size={18} md:size={24} />
            <div className="space-y-2">
              <h4 className="text-[8px] md:text-[11px] uppercase tracking-[0.4em] font-black text-blue-400">The Requirement of Nisab</h4>
              <p className="text-[10px] md:text-sm text-gray-400 font-light leading-relaxed italic">
                Zakat is 2.5% of your surplus wealth held for one lunar year. Ensure your wealth exceeds the threshold (Nisab) before calculation.
              </p>
            </div>
          </div>

          <div className="space-y-6 md:space-y-10">
            <div className="space-y-2 md:space-y-4">
              <label className="block text-[8px] md:text-[10px] font-black text-gray-600 uppercase tracking-[0.5em] ml-2 md:ml-4">Liquid Cash & Savings</label>
              <div className="relative group">
                <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-[#D4AF37]">
                  <DollarSign size={16} md:size={20} strokeWidth={1} />
                </div>
                <input 
                  type="number" 
                  value={savings}
                  onChange={(e) => setSavings(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#050505] border border-white/5 rounded-[1.2rem] md:rounded-[2rem] py-4 md:py-6 pl-12 md:pl-16 pr-4 md:pr-8 focus:outline-none focus:border-[#D4AF37]/50 transition-all text-base md:text-xl font-mono text-white placeholder:text-gray-900 shadow-xl" 
                />
              </div>
            </div>

            <div className="space-y-2 md:space-y-4">
              <label className="block text-[8px] md:text-[10px] font-black text-gray-600 uppercase tracking-[0.5em] ml-2 md:ml-4">Valuation of Gold & Metals</label>
              <div className="relative group">
                <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-[#D4AF37]">
                  <DollarSign size={16} md:size={20} strokeWidth={1} />
                </div>
                <input 
                  type="number" 
                  value={gold}
                  onChange={(e) => setGold(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#050505] border border-white/5 rounded-[1.2rem] md:rounded-[2rem] py-4 md:py-6 pl-12 md:pl-16 pr-4 md:pr-8 focus:outline-none focus:border-[#D4AF37]/50 transition-all text-base md:text-xl font-mono text-white placeholder:text-gray-900 shadow-xl" 
                />
              </div>
            </div>

            <div className="space-y-2 md:space-y-4">
              <label className="block text-[8px] md:text-[10px] font-black text-gray-600 uppercase tracking-[0.5em] ml-2 md:ml-4">Immediate Debts & Liabilities</label>
              <div className="relative group">
                <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-red-500/50">
                  <DollarSign size={16} md:size={20} strokeWidth={1} />
                </div>
                <input 
                  type="number" 
                  value={debts}
                  onChange={(e) => setDebts(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#050505] border border-white/5 rounded-[1.2rem] md:rounded-[2rem] py-4 md:py-6 pl-12 md:pl-16 pr-4 md:pr-8 focus:outline-none focus:border-red-500/30 transition-all text-base md:text-xl font-mono text-white placeholder:text-gray-900 shadow-xl" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative group order-1 lg:order-2">
          <div className="absolute inset-0 bg-[#D4AF37]/10 rounded-[2rem] md:rounded-[4rem] blur-[40px] md:blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div className="relative premium-card p-6 sm:p-8 md:p-16 rounded-[2rem] md:rounded-[4rem] flex flex-col items-center text-center overflow-hidden min-h-[320px] sm:min-h-[400px] md:min-h-[600px] justify-center shadow-2xl">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent"></div>
            
            <div className="space-y-6 md:space-y-12 w-full">
              <div className="space-y-2 md:space-y-4">
                <p className="text-[#D4AF37] text-[7px] md:text-[11px] font-black uppercase tracking-[0.6em] md:tracking-[0.8em]">Calculated Zakat Al-Mal</p>
                <div className="relative overflow-hidden">
                  <h3 className="text-3xl sm:text-5xl md:text-8xl font-mono font-black text-white leading-none gold-shimmer break-words px-2">
                    ${zakatDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>

              <div className="w-12 md:w-24 h-px bg-white/10 mx-auto"></div>

              <div className="grid grid-cols-2 gap-4 md:gap-8 w-full text-left px-2">
                <div className="space-y-0.5 md:space-y-1">
                  <p className="text-[6px] md:text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">Net Assets</p>
                  <p className="text-xs sm:text-sm md:text-xl font-mono text-gray-400 font-bold">${totalWealth.toLocaleString()}</p>
                </div>
                <div className="space-y-0.5 md:space-y-1">
                  <p className="text-[6px] md:text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">Current Nisab</p>
                  <p className="text-xs sm:text-sm md:text-xl font-mono text-gray-400 font-bold">$5,420.00</p>
                </div>
              </div>

              <div className="pt-4 md:pt-10 border-t border-white/5 space-y-4 md:space-y-6 w-full">
                <div className="flex items-center gap-2 md:gap-4 justify-center text-[7px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] md:tracking-[0.4em]">
                  <Heart size={10} md:size={14} className="text-red-500/50" />
                  Eligible Recipients
                </div>
                <div className="flex flex-wrap justify-center gap-1.5 md:gap-3 px-2">
                  {['The Poor', 'The Needy', 'The Debt-ridden', 'The Wayfarer'].map(rec => (
                    <span key={rec} className="px-2 md:px-4 py-1 md:py-2 bg-white/5 border border-white/5 rounded-full text-[6px] md:text-[9px] font-black uppercase tracking-widest text-gray-500">
                      {rec}
                    </span>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleProceedToPayment}
                className="w-full py-4 md:py-6 bg-[#D4AF37] text-black font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-[7px] md:text-[10px] rounded-[1.2rem] md:rounded-[2rem] shadow-[0_15px_30px_rgba(212,175,55,0.2)] hover:scale-105 transition-all duration-500 flex items-center justify-center gap-3 md:gap-4"
              >
                Proceed to Payment <ArrowRight size={12} md:size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-3 sm:p-4 animate-enter">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
          
          <div className="w-full max-w-3xl bg-[#0c0c0c] border border-[#D4AF37]/30 rounded-[1.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent"></div>
            
            <div className="p-5 md:p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2 md:p-3 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg md:rounded-xl"><Wallet size={16} md:size={20} /></div>
                  <h3 className="font-cinzel text-sm sm:text-base md:text-xl font-black text-white uppercase tracking-widest">Fulfillment Portal</h3>
                </div>
                <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 md:p-3 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-all"><X size={18} md:size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 md:p-12 space-y-6 md:space-y-12 custom-scrollbar">
                {isSuccess ? (
                    <div className="text-center py-8 md:py-20 space-y-6 md:space-y-8 animate-enter">
                        <div className="relative inline-block">
                           <div className="absolute inset-0 bg-green-500 blur-2xl md:blur-3xl opacity-20 animate-pulse"></div>
                           <CheckCircle2 size={60} md:size={120} className="text-green-500 mx-auto relative z-10" />
                        </div>
                        <div className="space-y-3 md:space-y-4 px-4">
                           <h4 className="text-xl md:text-4xl font-cinzel font-black text-white uppercase">Al-ḥamdu lillāh</h4>
                           <p className="text-gray-400 font-light text-xs md:text-lg">Your intention has been logged. Redirecting to <strong>{selectedCharity?.name}</strong> to complete the transaction.</p>
                        </div>
                        <div className="flex justify-center gap-2">
                           <Sparkles className="text-[#D4AF37] animate-bounce" size={14} md:size={20} />
                           <span className="text-[7px] md:text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em]">Sacred Contribution Tracked</span>
                        </div>
                    </div>
                ) : isProcessing ? (
                    <div className="text-center py-12 md:py-24 space-y-6 md:space-y-10 animate-pulse">
                        <Loader2 size={40} md:size={64} className="animate-spin text-[#D4AF37] mx-auto" />
                        <div className="space-y-2">
                           <p className="text-[7px] md:text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.6em]">Initializing Spiritual Link</p>
                           <p className="text-[10px] md:text-sm text-gray-500 italic">Verifying Nisab and Intention...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="premium-card p-6 md:p-10 rounded-[1.2rem] md:rounded-[2.5rem] bg-[#050505] border border-[#D4AF37]/20 text-center">
                            <p className="text-[6px] md:text-[9px] font-black text-gray-600 uppercase tracking-[0.5em] mb-2 md:mb-4">Total Amount to Purify</p>
                            <h4 className="text-2xl sm:text-4xl md:text-6xl font-mono font-black text-white gold-shimmer">${zakatDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                        </div>

                        <div className="space-y-4 md:space-y-6">
                            <div className="flex items-center justify-between">
                                <h5 className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Verified Global Partners</h5>
                                <div className="hidden sm:flex items-center gap-1.5 md:gap-2 text-[6px] md:text-[8px] font-bold text-blue-400 uppercase tracking-widest bg-blue-400/10 px-1.5 md:py-1 rounded">
                                   <Globe size={8} md:size={10} /> Hand-picked Institutions
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                {CHARITIES.map((charity) => (
                                    <button 
                                      key={charity.name}
                                      onClick={() => handleFulfillPayment(charity)}
                                      className="group p-4 md:p-6 rounded-[1.2rem] md:rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-[#D4AF37]/40 transition-all text-left flex items-start gap-4 md:gap-5 hover:scale-[1.02]"
                                    >
                                        <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl shrink-0 flex items-center justify-center text-white font-black text-base md:text-xl shadow-lg ${charity.logoColor}`}>
                                            {charity.name[0]}
                                        </div>
                                        <div className="space-y-1 flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h6 className="font-cinzel text-[10px] md:text-sm font-black text-white tracking-widest uppercase truncate">{charity.name}</h6>
                                                <ExternalLink size={10} md:size={14} className="text-gray-700 group-hover:text-[#D4AF37] transition-colors shrink-0" />
                                            </div>
                                            <p className="text-[7px] md:text-[10px] text-gray-500 font-light leading-relaxed line-clamp-2">{charity.tagline}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 md:p-8 rounded-[1.2rem] md:rounded-[2rem] bg-yellow-900/10 border border-yellow-600/20 flex gap-3 md:gap-5 items-center">
                            <ShieldAlert size={18} md:size={24} className="text-yellow-500 shrink-0" />
                            <p className="text-[7px] md:text-[10px] text-gray-400 leading-relaxed font-light">
                                <span className="text-yellow-500 font-black uppercase">Disclaimer:</span> IqraPath does not store or process payment data. You will be redirected to the select charity's secure portal.
                            </p>
                        </div>
                    </>
                )}
            </div>

            {!isProcessing && !isSuccess && (
               <div className="p-5 md:p-8 border-t border-white/5 bg-[#0a0a0a] flex items-center justify-between">
                   <div className="flex items-center gap-2 md:gap-3">
                      <History size={12} md:size={16} className="text-gray-600" />
                      <span className="text-[6px] md:text-[9px] font-black text-gray-600 uppercase tracking-widest">Safe & Audited Flow</span>
                   </div>
                   <button onClick={() => setIsPaymentModalOpen(false)} className="text-[6px] md:text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest underline underline-offset-8">Review Calculation</button>
               </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .gold-shimmer { background: linear-gradient(90deg, #F3E5AB 0%, #D4AF37 50%, #B8860B 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 5s linear infinite; }
        @keyframes shimmer { to { background-position: 200% center; } }
      `}</style>
    </div>
  );
};

export default ZakatPage;