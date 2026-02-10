import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, AlertCircle, ChevronLeft, Send, Sparkles } from 'lucide-react';
import { supabase } from '../supabase';
import Logo from '../components/Logo';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/#/reset-password',
      });

      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050505]">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none"></div>
      
      <div className="w-full max-w-md space-y-8 animate-enter relative z-10">
        <button 
          onClick={() => navigate('/login')} 
          className="text-gray-500 hover:text-[#D4AF37] transition-colors flex items-center gap-2 group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
          <span className="text-xs font-black uppercase tracking-widest">Return to Login</span>
        </button>

        <div className="premium-card p-10 rounded-[2.5rem] border-[#D4AF37]/10 bg-[#0a0a0a]/80 backdrop-blur-xl shadow-2xl">
          {sent ? (
            <div className="text-center space-y-8 py-4 animate-enter">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse"></div>
                <div className="w-20 h-20 mx-auto rounded-[1.5rem] bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 relative z-10">
                  <Send size={32} />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-cinzel font-black text-white uppercase tracking-widest">Link Sent</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-light">
                  We've sent a recovery link to <span className="text-white font-medium">{email}</span>. Please check your inbox and follow the instructions.
                </p>
              </div>
              <div className="pt-4 space-y-4">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Didn't receive it?</p>
                <button 
                  onClick={() => setSent(false)} 
                  className="text-[#D4AF37] text-xs font-black uppercase tracking-widest hover:underline underline-offset-8"
                >
                  Try another email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-8">
              <div className="text-center space-y-4">
                <Logo size="md" className="mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-2xl font-cinzel font-black text-white uppercase tracking-widest">Forgot Password?</h3>
                  <p className="text-xs text-gray-500 font-light leading-relaxed">
                    No worries. Enter your email and we'll help you reconnect to your sanctuary.
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-3">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all font-light"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !email.trim()}
                className="w-full py-5 bg-[#D4AF37] hover:bg-[#b8962e] text-[#050505] rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(212,175,55,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Send Reset Link <ArrowRight size={18} /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;