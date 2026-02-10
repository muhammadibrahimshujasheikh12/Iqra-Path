
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, ChevronLeft, AtSign, Globe, MapPin, Calendar, BookOpen, GraduationCap, Phone, CheckCircle2, UserCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabase';
import Logo from '../components/Logo';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: 'Male',
    country: '',
    city: '',
    role: 'Seeker' // 'Scholar' or 'Seeker'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (role: string) => {
    setFormData({ ...formData, role });
  };

  const handleGenderSelect = (gender: string) => {
    setFormData({ ...formData, gender });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Step 1 Validation
    if (step === 1) {
       if (formData.password !== formData.confirmPassword) {
           setError("Passwords do not match.");
           return;
       }
       if (formData.password.length < 6) {
           setError("Password must be at least 6 characters.");
           return;
       }
       setStep(2);
       return;
    }

    // Step 2 Submission
    setLoading(true);

    try {
      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            username: formData.username,
            role: formData.role,
            gender: formData.gender,
            age: formData.age,
            country: formData.country,
            city: formData.city,
            phone_number: formData.phoneNumber
          }
        }
      });

      if (authError) throw authError;

      // 2. Safely Attempt Profile Creation
      if (authData.user) {
        try {
            const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: authData.user.id,
                username: formData.username,
                full_name: formData.fullName,
                phone_number: formData.phoneNumber,
                gender: formData.gender,
                membership_tier: 'Standard',
                age: parseInt(formData.age) || null,
                country: formData.country,
                city: formData.city,
                role: formData.role,
                updated_at: new Date().toISOString()
            });
            
            if (profileError) {
                console.warn("Profile sync warning (non-blocking):", profileError);
                // We proceed anyway because Auth user is created.
            }
        } catch (profileCatch) {
            console.warn("Profile creation exception (non-blocking):", profileCatch);
        }
      }

      navigate('/profile');
    } catch (err: any) {
      console.error("Signup Error:", err);
      setError(err.message || "Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050505]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none"></div>

        <button onClick={() => navigate('/')} className="absolute top-8 left-8 text-gray-500 hover:text-[#D4AF37] transition-colors flex items-center gap-2 z-20">
            <ChevronLeft size={20} /> <span className="text-xs font-black uppercase tracking-widest">Back to Sanctuary</span>
        </button>

        <div className="w-full max-w-2xl space-y-8 animate-enter relative z-10">
            <div className="text-center space-y-4">
                <div className="flex justify-center mb-2 drop-shadow-[0_0_25px_rgba(212,175,55,0.3)]">
                    <Logo size="md" />
                </div>
                <h2 className="text-4xl font-cinzel font-black text-white">Assalamu Alaikum</h2>
                <p className="text-gray-500 text-sm font-light tracking-wide">
                   {step === 1 ? "Begin your journey of sacred knowledge." : "Complete your profile details."}
                </p>
                <div className="flex justify-center gap-2 mt-2">
                   <div className={`h-1 rounded-full transition-all duration-500 ${step >= 1 ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-white/20'}`}></div>
                   <div className={`h-1 rounded-full transition-all duration-500 ${step >= 2 ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-white/20'}`}></div>
                </div>
            </div>

            <div className="premium-card p-8 md:p-12 rounded-[2.5rem] border-[#D4AF37]/10 bg-[#0a0a0a]/90 backdrop-blur-xl shadow-2xl">
                <form onSubmit={handleSignup} className="space-y-8">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}
                    
                    {step === 1 && (
                      <div className="space-y-6 animate-enter">
                        {/* Identity Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-3">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" size={16} />
                                    <input 
                                        name="fullName"
                                        type="text" 
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all font-light text-sm"
                                        placeholder="Ibn Sina"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-3">Username</label>
                                <div className="relative group">
                                    <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" size={16} />
                                    <input 
                                        name="username"
                                        type="text" 
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all font-light text-sm"
                                        placeholder="seeker99"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-3">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                                    <input 
                                        name="email"
                                        type="email" 
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all font-light text-sm"
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-3">Phone Number</label>
                                <div className="relative group">
                                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                                    <input 
                                        name="phoneNumber"
                                        type="tel" 
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all font-light text-sm"
                                        placeholder="+1 234 567 890"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-3">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                                    <input 
                                        name="password"
                                        type={showPassword ? "text" : "password"} 
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all font-light text-sm"
                                        placeholder="Create password"
                                        required
                                    />
                                    <button 
                                      type="button"
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-[#D4AF37] transition-colors"
                                    >
                                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-3">Confirm Password</label>
                                <div className="relative group">
                                    <CheckCircle2 className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                                    <input 
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"} 
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all font-light text-sm"
                                        placeholder="Repeat password"
                                        required
                                    />
                                    <button 
                                      type="button"
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-[#D4AF37] transition-colors"
                                    >
                                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-8 animate-enter">
                         {/* Role & Gender Grid */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-3">
                               <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-3">Your Role</label>
                               <div className="grid grid-cols-2 gap-3">
                                  <button 
                                    type="button"
                                    onClick={() => handleRoleSelect('Seeker')}
                                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${formData.role === 'Seeker' ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white' : 'bg-[#050505] border-white/10 text-gray-500 hover:border-white/30'}`}
                                  >
                                     <BookOpen size={20} className={formData.role === 'Seeker' ? 'text-[#D4AF37]' : ''} />
                                     <span className="text-[10px] font-bold uppercase tracking-widest">Seeker</span>
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => handleRoleSelect('Scholar')}
                                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${formData.role === 'Scholar' ? 'bg-green-500/20 border-green-500 text-white' : 'bg-[#050505] border-white/10 text-gray-500 hover:border-white/30'}`}
                                  >
                                     <GraduationCap size={20} className={formData.role === 'Scholar' ? 'text-green-500' : ''} />
                                     <span className="text-[10px] font-bold uppercase tracking-widest">Scholar</span>
                                  </button>
                                </div>
                             </div>

                             <div className="space-y-3">
                               <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-3">Gender</label>
                               <div className="grid grid-cols-2 gap-3">
                                  <button 
                                    type="button"
                                    onClick={() => handleGenderSelect('Male')}
                                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${formData.gender === 'Male' ? 'bg-blue-500/20 border-blue-500 text-white' : 'bg-[#050505] border-white/10 text-gray-500 hover:border-white/30'}`}
                                  >
                                     <User size={20} className={formData.gender === 'Male' ? 'text-blue-500' : ''} />
                                     <span className="text-[10px] font-bold uppercase tracking-widest">Male</span>
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => handleGenderSelect('Female')}
                                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${formData.gender === 'Female' ? 'bg-pink-500/20 border-pink-500 text-white' : 'bg-[#050505] border-white/10 text-gray-500 hover:border-white/30'}`}
                                  >
                                     <UserCircle size={20} className={formData.gender === 'Female' ? 'text-pink-500' : ''} />
                                     <span className="text-[10px] font-bold uppercase tracking-widest">Female</span>
                                  </button>
                               </div>
                             </div>
                         </div>

                         {/* Details Grid */}
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-3">Age</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" size={16} />
                                    <input 
                                        name="age"
                                        type="number" 
                                        value={formData.age}
                                        onChange={handleChange}
                                        className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all font-light text-sm"
                                        placeholder="25"
                                        min="5"
                                        max="120"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-3">Country</label>
                                <div className="relative group">
                                    <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" size={16} />
                                    <input 
                                        name="country"
                                        type="text" 
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all font-light text-sm"
                                        placeholder="Egypt"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-3">City</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors" size={16} />
                                    <input 
                                        name="city"
                                        type="text" 
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all font-light text-sm"
                                        placeholder="Cairo"
                                        required
                                    />
                                </div>
                            </div>
                         </div>
                      </div>
                    )}

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 bg-[#D4AF37] hover:bg-[#b8962e] text-[#050505] rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <>{step === 1 ? 'Next Step' : 'Complete Registration'} <ArrowRight size={16} /></>}
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-xs text-gray-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#D4AF37] font-bold hover:underline decoration-[#D4AF37]/50 underline-offset-4">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SignupPage;
