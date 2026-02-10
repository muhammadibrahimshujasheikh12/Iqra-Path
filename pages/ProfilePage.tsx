
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../supabase';
import { User, MapPin, Calendar, LogOut, ShieldCheck, Edit, Grid, Camera, Save, X, ImageIcon, PenLine, Upload, Link as LinkIcon, Trash2, Sparkles, Trophy, BadgeCheck, AlertTriangle, FileText, Check } from 'lucide-react';
import { Profile } from '../types';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Verification State
  const [uploadProof, setUploadProof] = useState<string | null>(null);
  
  // Journey Stats
  const [journeyStats, setJourneyStats] = useState({
      level: 1,
      progress: 0,
      title: "Novice",
      totalXP: 0,
      nextLevelXP: 200
  });

  // Tabs for image editing: 'url' or 'upload'
  const [bannerMode, setBannerMode] = useState<'url' | 'upload'>('url');
  const [avatarMode, setAvatarMode] = useState<'url' | 'upload'>('url');

  useEffect(() => {
    fetchProfile();
  }, [navigate]);

  const calculateLevel = (currentProfile: Profile, logCount: number) => {
      let xp = 0;
      // Base XP from Profile Completeness (Max 200)
      if (currentProfile.avatar_url && currentProfile.avatar_url.length > 10) xp += 50;
      if (currentProfile.banner_url && currentProfile.banner_url.length > 10) xp += 50;
      if (currentProfile.about_me && currentProfile.about_me.length > 10) xp += 50;
      if (currentProfile.city && currentProfile.country) xp += 50;

      // Activity XP from Ibadah Logs (20 XP per logged day)
      xp += (logCount * 20);

      // Level Calculation (Every 200 XP = 1 Level)
      const level = Math.floor(xp / 200) + 1;
      const progress = ((xp % 200) / 200) * 100;

      // Title Determination
      let title = "Novice";
      if (level >= 3) title = "Adept";
      if (level >= 6) title = "Dedicated";
      if (level >= 10) title = "Guardian";
      if (level >= 20) title = "Luminary";

      return { level, progress, title, totalXP: xp, nextLevelXP: 200 - (xp % 200) };
  };

  const fetchProfile = async () => {
     if (!isSupabaseConfigured()) {
        // Mock data
        const mockProfile = {
           full_name: "Ibn Sina",
           username: "seeker99",
           role: "Scholar",
           age: 42,
           country: "Uzbekistan",
           city: "Bukhara",
           membership_tier: "Premium",
           gender: "Male",
           banner_url: "https://images.unsplash.com/photo-1542640244-7e672d6cef21?auto=format&fit=crop&q=80&w=1200",
           about_me: "A student of knowledge seeking the path of light through the Quran and Sunnah. Interested in Islamic history and medicine.",
           is_verified: false
        };
        setProfile(mockProfile);
        setEditForm(mockProfile);
        
        // Mock Stats Calculation
        const stats = calculateLevel(mockProfile, 5); // Simulate 5 days of logs
        setJourneyStats(stats);

        setLoading(false);
        return;
     }

     const { data: { user } } = await supabase.auth.getUser();
     if (!user) {
        return;
     }

     // Fetch Profile
     const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
     
     // Fetch Log Count for XP
     const { count: logCount } = await supabase
        .from('ibadah_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

     let currentProfile = data;

     if (!currentProfile) {
       // Fallback if no profile row
       currentProfile = {
          full_name: user.user_metadata?.full_name || 'Believer',
          username: user.email?.split('@')[0] || 'User',
          role: user.user_metadata?.role || 'Seeker',
          age: user.user_metadata?.age || 'N/A',
          country: user.user_metadata?.country || 'Unknown',
          city: user.user_metadata?.city || 'Unknown',
          membership_tier: 'Standard',
          gender: user.user_metadata?.gender || 'Not Specified',
          phone_number: user.user_metadata?.phone_number,
          about_me: "",
          banner_url: ""
       };
     }

     setProfile(currentProfile);
     setEditForm(currentProfile);

     // Calculate Level
     const stats = calculateLevel(currentProfile, logCount || 0);
     setJourneyStats(stats);

     setLoading(false);
  };

  const handleSignOut = async () => {
     await supabase.auth.signOut();
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaveLoading(true);

    if (!isSupabaseConfigured()) {
        // Mock Save
        setTimeout(() => {
            const updated = {...profile, ...editForm};
            setProfile(updated);
            // Recalculate stats with new profile data
            setJourneyStats(calculateLevel(updated, 5));
            setIsEditing(false);
            setSaveLoading(false);
        }, 1000);
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        const updates = {
            id: user.id,
            ...editForm,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('profiles').upsert(updates);
        if (!error) {
            const updated = { ...profile, ...editForm };
            setProfile(updated);
            
            // Recalculate stats (Fetch log count again to be accurate, or pass existing count if stored)
            // For now, assume log count hasn't changed during edit
            const { count: logCount } = await supabase
                .from('ibadah_logs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
            
            setJourneyStats(calculateLevel(updated, logCount || 0));
            setIsEditing(false);
        } else {
            console.error(error);
            alert("Failed to save profile. Please try again.");
        }
    }
    setSaveLoading(false);
  };

  const submitVerification = async () => {
      if (!uploadProof || !profile) return;
      setSaveLoading(true);
      
      if (isSupabaseConfigured()) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              await supabase.from('profiles').update({ verification_proof: uploadProof }).eq('id', user.id);
              alert("Verification proof uploaded successfully. Admin will review.");
              setProfile({...profile, verification_proof: uploadProof});
          }
      } else {
          alert("Verification proof uploaded (Mock).");
          setProfile({...profile, verification_proof: uploadProof});
      }
      setSaveLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'banner_url' | 'avatar_url' | 'proof') => {
      const file = e.target.files?.[0];
      if (file) {
          // Limit size to ~3MB to prevent payload issues with basic setup
          if (file.size > 3 * 1024 * 1024) {
              alert("File is too large. Please select an image under 3MB.");
              return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
              if (field === 'proof') {
                  setUploadProof(reader.result as string);
              } else {
                  setEditForm(prev => ({ ...prev, [field]: reader.result as string }));
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const clearImage = (field: 'banner_url' | 'avatar_url') => {
      setEditForm(prev => ({ ...prev, [field]: '' }));
  };

  if (loading) return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-[#D4AF37]">
      <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] uppercase tracking-[0.3em] font-black">Retrieving Identity...</p>
    </div>
  );

  if (!profile) return null;

  return (
    <div className="pb-40 animate-enter">
       {/* EDIT MODAL */}
       {isEditing && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-enter">
               <div className="bg-[#121212] border border-[#D4AF37]/20 w-full max-w-3xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                   <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]">
                       <div className="flex items-center gap-3">
                           <Edit size={18} className="text-[#D4AF37]" />
                           <h3 className="text-lg font-cinzel font-black text-white uppercase tracking-widest">Edit Identity</h3>
                       </div>
                       <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"><X size={20} /></button>
                   </div>
                   
                   <div className="p-8 overflow-y-auto space-y-10 custom-scrollbar bg-[#050505]">
                       
                       {/* Banner Editing */}
                       <div className="space-y-4">
                           <div className="flex items-center justify-between">
                               <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em]">Banner Image</label>
                               <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                                   <button onClick={() => setBannerMode('url')} className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${bannerMode === 'url' ? 'bg-[#D4AF37] text-black' : 'text-gray-500 hover:text-white'}`}>Link</button>
                                   <button onClick={() => setBannerMode('upload')} className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${bannerMode === 'upload' ? 'bg-[#D4AF37] text-black' : 'text-gray-500 hover:text-white'}`}>Upload</button>
                               </div>
                           </div>
                           
                           {/* Preview Banner */}
                           <div className="relative w-full h-32 rounded-xl bg-[#111] overflow-hidden border border-white/10 group">
                               {editForm.banner_url ? (
                                   <img src={editForm.banner_url} alt="Banner Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                               ) : (
                                   <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs uppercase tracking-widest">No Banner Set</div>
                               )}
                               {editForm.banner_url && (
                                   <button onClick={() => clearImage('banner_url')} className="absolute top-2 right-2 p-2 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"><Trash2 size={14} /></button>
                               )}
                           </div>

                           {bannerMode === 'url' ? (
                               <div className="relative">
                                   <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                                   <input name="banner_url" value={editForm.banner_url || ''} onChange={handleChange} className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50 font-light" placeholder="https://example.com/image.jpg" />
                               </div>
                           ) : (
                               <div className="relative border border-dashed border-white/20 rounded-xl p-8 text-center hover:border-[#D4AF37]/50 transition-colors bg-[#121212]">
                                   <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner_url')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                   <div className="flex flex-col items-center gap-2 text-gray-500 pointer-events-none">
                                       <Upload size={24} />
                                       <span className="text-xs uppercase tracking-widest">Click to Upload Banner</span>
                                   </div>
                               </div>
                           )}
                       </div>

                       {/* Avatar Editing */}
                       <div className="space-y-4">
                           <div className="flex items-center justify-between">
                               <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em]">Avatar Image</label>
                               <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                                   <button onClick={() => setAvatarMode('url')} className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${avatarMode === 'url' ? 'bg-[#D4AF37] text-black' : 'text-gray-500 hover:text-white'}`}>Link</button>
                                   <button onClick={() => setAvatarMode('upload')} className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${avatarMode === 'upload' ? 'bg-[#D4AF37] text-black' : 'text-gray-500 hover:text-white'}`}>Upload</button>
                               </div>
                           </div>

                           <div className="flex items-center gap-6">
                               <div className="w-20 h-20 rounded-full bg-[#111] border border-white/10 overflow-hidden shrink-0 relative group">
                                   {editForm.avatar_url ? (
                                       <img src={editForm.avatar_url} alt="Avatar Preview" className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" />
                                   ) : (
                                       <div className="w-full h-full flex items-center justify-center text-gray-700"><User size={24} /></div>
                                   )}
                                   {editForm.avatar_url && (
                                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                           <button onClick={() => clearImage('avatar_url')} className="p-2 bg-red-500/80 text-white rounded-full"><Trash2 size={12} /></button>
                                       </div>
                                   )}
                               </div>

                               <div className="flex-1">
                                   {avatarMode === 'url' ? (
                                       <div className="relative">
                                           <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                                           <input name="avatar_url" value={editForm.avatar_url || ''} onChange={handleChange} className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50 font-light" placeholder="https://example.com/avatar.jpg" />
                                       </div>
                                   ) : (
                                       <div className="relative border border-dashed border-white/20 rounded-xl p-4 text-center hover:border-[#D4AF37]/50 transition-colors bg-[#121212]">
                                           <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar_url')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                           <div className="flex items-center justify-center gap-3 text-gray-500 pointer-events-none">
                                               <Camera size={16} />
                                               <span className="text-[10px] uppercase tracking-widest">Select File</span>
                                           </div>
                                       </div>
                                   )}
                               </div>
                           </div>
                       </div>

                       {/* Bio Section */}
                       <div className="space-y-4">
                           <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em]">About Me</label>
                           <div className="relative">
                               <textarea 
                                   name="about_me" 
                                   value={editForm.about_me || ''} 
                                   onChange={handleChange} 
                                   rows={5}
                                   className="w-full bg-[#121212] border border-white/10 rounded-xl p-5 text-sm text-gray-300 focus:outline-none focus:border-[#D4AF37]/50 resize-none font-light leading-relaxed" 
                                   placeholder="Share your journey, interests, or favorite Surahs. This helps our AI personalize your experience." 
                               />
                               <div className="absolute bottom-4 right-4 text-[9px] text-gray-600 font-bold uppercase tracking-widest pointer-events-none">
                                   {(editForm.about_me || '').length} chars
                               </div>
                           </div>
                       </div>

                       {/* Basic Info */}
                       <div className="space-y-4">
                           <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em]">Personal Details</label>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="space-y-2">
                                   <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">Full Name</label>
                                   <input name="full_name" value={editForm.full_name || ''} onChange={handleChange} className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" />
                               </div>
                               <div className="space-y-2">
                                   <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">City</label>
                                   <input name="city" value={editForm.city || ''} onChange={handleChange} className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" />
                               </div>
                               <div className="space-y-2">
                                   <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">Country</label>
                                   <input name="country" value={editForm.country || ''} onChange={handleChange} className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" />
                               </div>
                               <div className="space-y-2">
                                   <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">Age</label>
                                   <input name="age" type="number" value={editForm.age || ''} onChange={handleChange} className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" />
                               </div>
                           </div>
                       </div>
                   </div>

                   <div className="p-6 border-t border-white/5 bg-[#0a0a0a] flex justify-end gap-4">
                       <button onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">Cancel</button>
                       <button 
                         onClick={handleSave} 
                         disabled={saveLoading}
                         className="px-8 py-3 bg-[#D4AF37] text-black rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                       >
                           {saveLoading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <>Save Changes <Save size={14} /></>}
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* PROFILE HEADER - BANNER AREA */}
       <div className="relative h-[200px] md:h-[350px] w-full bg-[#121212] overflow-hidden group">
           {profile.banner_url ? (
               <img src={profile.banner_url} alt="Cover" className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity duration-700" />
           ) : (
               <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30"></div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
           
           <button 
             onClick={() => setIsEditing(true)}
             className="absolute top-6 right-6 md:top-10 md:right-10 px-6 py-3 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all hover:scale-105 z-10"
           >
               <Edit size={12} /> Edit Profile
           </button>
       </div>

       {/* PROFILE CONTENT */}
       <div className="max-w-5xl mx-auto px-6 -mt-16 md:-mt-20 relative z-10 space-y-12">
           
           {/* ID Card */}
           <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 text-center md:text-left">
               <div className="relative shrink-0">
                   <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#050505] border-4 border-[#050505] overflow-hidden shadow-2xl relative group mx-auto md:mx-0">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#121212] text-[#D4AF37]">
                                <User size={48} />
                            </div>
                        )}
                        <div onClick={() => setIsEditing(true)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Camera size={24} className="text-white" />
                        </div>
                   </div>
                   <div className={`absolute bottom-2 right-0 md:right-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 shadow-lg flex items-center gap-1 ${profile.role === 'Scholar' ? 'bg-green-600 text-white' : 'bg-[#D4AF37] text-black'}`}>
                      {profile.role}
                      {profile.role === 'Scholar' && profile.is_verified && <BadgeCheck size={10} />}
                   </div>
               </div>

               <div className="flex-1 space-y-2 mb-4 w-full">
                   <h1 className="text-3xl md:text-5xl font-cinzel font-black text-white">{profile.full_name}</h1>
                   <p className="text-[#D4AF37] text-sm font-bold uppercase tracking-[0.2em] opacity-80">@{profile.username}</p>
                   <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-wide">
                            <MapPin size={14} className="text-gray-600" /> {profile.city !== 'Unknown' ? `${profile.city}, ${profile.country}` : 'Location Not Set'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-wide">
                            <Calendar size={14} className="text-gray-600" /> {profile.age !== 'N/A' ? `${profile.age} Years` : 'Age N/A'}
                        </div>
                   </div>
               </div>

               <button 
                  onClick={handleSignOut}
                  className="mb-6 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-black uppercase tracking-widest text-red-500 transition-all flex items-center gap-2"
                >
                   <LogOut size={14} /> Sign Out
               </button>
           </div>

           {/* VERIFICATION SECTION (ONLY FOR SCHOLARS) */}
           {profile.role === 'Scholar' && !profile.is_verified && (
               <div className="premium-card p-8 rounded-[2rem] bg-amber-900/10 border border-amber-500/20 flex flex-col md:flex-row items-center gap-8">
                   <div className="p-4 bg-amber-500/10 rounded-full text-amber-500 shrink-0">
                       <AlertTriangle size={32} />
                   </div>
                   <div className="flex-1 space-y-4 text-center md:text-left">
                       <h3 className="font-cinzel text-xl font-black text-white uppercase tracking-widest">Verification Pending</h3>
                       <p className="text-sm text-gray-400 font-light leading-relaxed">
                           To activate full Scholar privileges (video uploads, verified badge), please upload a proof of identity or qualification (Certificate/ID).
                       </p>
                       
                       <div className="flex flex-col gap-4">
                           {uploadProof ? (
                               <div className="flex items-center gap-4 bg-black/30 p-3 rounded-xl border border-white/5">
                                   <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-gray-500"><FileText size={20} /></div>
                                   <span className="text-xs text-green-500 font-bold uppercase tracking-wide flex items-center gap-2"><Check size={14} /> Document Ready</span>
                               </div>
                           ) : (
                               <div className="relative border border-dashed border-amber-500/30 rounded-xl p-6 text-center hover:bg-amber-500/5 transition-colors cursor-pointer">
                                   <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'proof')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                   <span className="text-xs text-amber-500 font-bold uppercase tracking-widest">Tap to Upload Certificate</span>
                               </div>
                           )}
                           
                           {uploadProof && (
                               <button 
                                 onClick={submitVerification}
                                 disabled={saveLoading}
                                 className="px-8 py-3 bg-amber-500 text-black rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg"
                               >
                                   {saveLoading ? "Submitting..." : "Submit for Verification"}
                               </button>
                           )}
                       </div>
                   </div>
               </div>
           )}

           {profile.role === 'Scholar' && profile.is_verified && (
               <div className="premium-card p-6 rounded-[2rem] bg-green-900/10 border border-green-500/20 flex items-center gap-4">
                   <BadgeCheck className="text-green-500" size={24} />
                   <span className="text-sm font-bold text-green-500 uppercase tracking-widest">Verified Scholar Account</span>
               </div>
           )}

           {/* About Me Section */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-8">
                   <div className="premium-card p-10 rounded-[2.5rem] space-y-6 min-h-[250px] flex flex-col">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                 <div className="w-1.5 h-6 bg-[#D4AF37] rounded-full"></div>
                                 <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white">About Me</h3>
                            </div>
                            <button onClick={() => setIsEditing(true)} className="text-[#D4AF37] hover:text-white transition-colors">
                                <Edit size={14} />
                            </button>
                        </div>
                        
                        {profile.about_me ? (
                             <p className="text-gray-300 font-light leading-loose text-lg italic border-l-2 border-[#D4AF37]/30 pl-6 py-2">
                                "{profile.about_me}"
                             </p>
                        ) : (
                             <div className="flex-1 flex flex-col items-center justify-center py-8 border border-dashed border-white/10 rounded-2xl bg-white/5">
                                 <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-4">Your story is yet to be written</p>
                                 <button onClick={() => setIsEditing(true)} className="text-[#D4AF37] text-xs font-bold hover:underline flex items-center justify-center gap-2">
                                     <PenLine size={12} /> Add Bio
                                 </button>
                             </div>
                        )}
                   </div>

                   {/* Stats Grid */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="premium-card p-8 rounded-[2rem] space-y-4">
                            <div className="flex items-center gap-3 text-[#D4AF37]">
                                <ShieldCheck size={20} />
                                <span className="text-xs font-black uppercase tracking-widest">Membership</span>
                            </div>
                            <div>
                                <h4 className="text-2xl font-cinzel font-black text-white">{profile.membership_tier}</h4>
                                <p className="text-[10px] text-gray-500 mt-1">Active since {new Date().getFullYear()}</p>
                            </div>
                        </div>

                        {/* Updated Dynamic Journey Progress */}
                        <div className="premium-card p-8 rounded-[2rem] space-y-4 group hover:border-green-500/30 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-green-500">
                                    <Grid size={20} />
                                    <span className="text-xs font-black uppercase tracking-widest">Journey Progress</span>
                                </div>
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <Trophy size={14} className="text-green-500" />
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex items-end justify-between mb-2">
                                    <h4 className="text-2xl font-cinzel font-black text-white">Level {journeyStats.level} <span className="text-green-500">{journeyStats.title}</span></h4>
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{Math.round(journeyStats.nextLevelXP)} XP to next</span>
                                </div>
                                <div className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-1000 ease-out relative" 
                                      style={{ width: `${journeyStats.progress}%` }}
                                    >
                                        <div className="absolute top-0 right-0 bottom-0 w-[2px] bg-white/50 shadow-[0_0_10px_white]"></div>
                                    </div>
                                </div>
                                <p className="text-[9px] text-gray-500 mt-3 font-medium uppercase tracking-wider flex items-center gap-2">
                                    <Sparkles size={10} className="text-[#D4AF37]" /> Total Experience: {journeyStats.totalXP} XP
                                </p>
                            </div>
                        </div>
                    </div>
               </div>

               {/* Right Side Info */}
               <div className="space-y-6">
                   <div className="premium-card p-8 rounded-[2rem] space-y-6 h-full">
                       <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Personal Details</h3>
                       
                       <div className="space-y-4">
                           <div className="flex justify-between items-center py-3 border-b border-white/5">
                               <span className="text-xs text-gray-400">Gender</span>
                               <span className="text-xs font-bold text-white">{profile.gender || 'Not Set'}</span>
                           </div>
                           <div className="flex justify-between items-center py-3 border-b border-white/5">
                               <span className="text-xs text-gray-400">Phone</span>
                               <span className="text-xs font-bold text-white">{profile.phone_number || 'Hidden'}</span>
                           </div>
                           <div className="flex justify-between items-center py-3 border-b border-white/5">
                               <span className="text-xs text-gray-400">Role</span>
                               <span className="text-xs font-bold text-[#D4AF37]">{profile.role}</span>
                           </div>
                           <div className="flex justify-between items-center py-3 border-b border-white/5">
                               <span className="text-xs text-gray-400">Joined</span>
                               <span className="text-xs font-bold text-white">{new Date().toLocaleDateString()}</span>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       </div>
    </div>
  );
};

export default ProfilePage;
