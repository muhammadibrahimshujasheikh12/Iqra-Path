import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabase';
import Logo from '../components/Logo';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050505]">
        {/* Background effects */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none"></div>
        
        <div className="w-full max-w-md space-y-8 animate-enter relative z-10">
            <div className="text-center space-y-4">
                <div className="flex justify-center mb-2 drop-shadow-[0_0_25px_rgba(212,175,55,0.3)]">
                    <Logo size="md" />
                </div>
                <h2 className="text-4xl font-cinzel font-black text-white">Assalamu Alaikum</h2>
                <p className="text-gray-500 text-sm font-light tracking-wide">Enter the sanctuary of knowledge.</p>
            </div>

            <div className="premium-card p-8 rounded-[2.5rem] border-[#D4AF37]/10 bg-[#0a0a0a]/80 backdrop-blur-xl shadow-2xl">
                <form onSubmit={handleLogin} className="space-y-6">
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

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-3">Password</label>
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
                        <div className="text-right">
                          <Link to="/forgot-password" size={18} className="text-[9px] font-black text-gray-600 hover:text-[#D4AF37] uppercase tracking-widest">Forgot Password?</Link>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-[#D4AF37] hover:bg-[#b8962e] text-[#050505] rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <>Sign In <ArrowRight size={16} /></>}
                    </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-xs text-gray-500">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-[#D4AF37] font-bold hover:underline decoration-[#D4AF37]/50 underline-offset-4">
                            Join the Ummah
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default LoginPage;