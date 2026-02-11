import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabase';
import Logo from '../components/Logo';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 🔥 Added: Handle Supabase recovery session
  useEffect(() => {
    let cancelled = false;

    const handleRecovery = async () => {
      if (!cancelled) setRecoveryLoading(true);

      try {
        const searchParams = new URLSearchParams(location.search.replace(/^\?/, ''));
        const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));

        const code = searchParams.get('code') ?? hashParams.get('code');

        const access_token =
          hashParams.get('access_token') ??
          searchParams.get('access_token') ??
          (window.location.hash.includes('access_token=')
            ? new URLSearchParams(window.location.hash.slice(window.location.hash.indexOf('access_token='))).get('access_token')
            : null);

        const refresh_token =
          hashParams.get('refresh_token') ??
          searchParams.get('refresh_token') ??
          (window.location.hash.includes('refresh_token=')
            ? new URLSearchParams(window.location.hash.slice(window.location.hash.indexOf('refresh_token='))).get('refresh_token')
            : null);

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          navigate('/reset-password', { replace: true });
          return;
        }

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;
          navigate('/reset-password', { replace: true });
        }
      } catch (err: any) {
        const message = err?.message || 'Authentication missing or recovery link expired. Please request a new reset link.';
        console.error('Recovery session error:', message);
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setRecoveryLoading(false);
      }
    };

    handleRecovery();

    return () => {
      cancelled = true;
    };
  }, [location.hash, location.search, navigate]);

  // Requirement checks
  const hasLength = password.length >= 8;
  const hasMatch = password === confirmPassword && password.length > 0;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasLength || !hasMatch) return;

    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Authentication missing. Please open the password recovery link from your email again.');
      }

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
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
        <div className="premium-card p-10 rounded-[2.5rem] border-[#D4AF37]/10 bg-[#0a0a0a]/80 backdrop-blur-xl shadow-2xl">
          {success ? (
            <div className="text-center space-y-8 py-4 animate-enter">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse"></div>
                <div className="w-20 h-20 mx-auto rounded-[1.5rem] bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 relative z-10">
                  <CheckCircle2 size={32} />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-cinzel font-black text-white uppercase tracking-widest">Success</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-light">
                  Your password has been purified and updated. Redirecting you to the sanctuary entrance...
                </p>
              </div>
              <button 
                onClick={() => navigate('/login')}
                className="w-full py-4 bg-[#D4AF37] text-black rounded-2xl font-black uppercase tracking-widest text-[10px]"
              >
                Login Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-8">
              <div className="text-center space-y-4">
                <Logo size="md" className="mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-2xl font-cinzel font-black text-white uppercase tracking-widest">New Identity</h3>
                  <p className="text-xs text-gray-500 font-light leading-relaxed">
                    Set a strong, new password for your account.
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-3">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-14 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all font-light"
                      placeholder="••••••••"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-[#D4AF37] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-3">Confirm Password</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all font-light"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider ${hasLength ? 'text-green-500' : 'text-gray-600'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${hasLength ? 'bg-green-500 shadow-[0_0_8px_green]' : 'bg-gray-800'}`}></div>
                  8+ Characters
                </div>
                <div className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider ${hasMatch ? 'text-green-500' : 'text-gray-600'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${hasMatch ? 'bg-green-500 shadow-[0_0_8px_green]' : 'bg-gray-800'}`}></div>
                  Passwords Match
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || recoveryLoading || !hasLength || !hasMatch}
                className="w-full py-5 bg-[#D4AF37] hover:bg-[#b8962e] text-[#050505] rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(212,175,55,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading || recoveryLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Update Password <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
