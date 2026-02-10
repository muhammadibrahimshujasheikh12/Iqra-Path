
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../supabase';
import { Profile } from '../types';
import { ShieldCheck, Users, AlertTriangle, CheckCircle, XCircle, Search, Eye, Filter, Loader2, Lock } from 'lucide-react';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [filter, setFilter] = useState<'all' | 'scholar_pending' | 'scholar_verified'>('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email === 'iqrapathoffical@gmail.com') {
        setIsAdmin(true); fetchUsers();
    } else { navigate('/', { replace: true }); }
    setLoading(false);
  };

  const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) setUsers(data);
  };

  const handleVerification = async (userId: string, status: boolean) => {
      setActionLoading(userId);
      await supabase.from('profiles').update({ is_verified: status }).eq('id', userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: status } : u));
      setActionLoading(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#050505]"><Loader2 className="animate-spin text-[#D4AF37]" size={32} /></div>;
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center bg-[#050505] text-red-500 font-black uppercase tracking-widest"><Lock size={20} className="mr-2" /> Access Denied</div>;

  const filteredUsers = users.filter(u => {
      const matchesSearch = (u.full_name?.toLowerCase() || '').includes(search.toLowerCase()) || (u.username?.toLowerCase() || '').includes(search.toLowerCase());
      if (filter === 'scholar_pending') return matchesSearch && u.role === 'Scholar' && !u.is_verified && u.verification_proof;
      if (filter === 'scholar_verified') return matchesSearch && u.role === 'Scholar' && u.is_verified;
      return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#050505] p-8 pb-40">
        <div className="max-w-7xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-white/5 pb-8">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#D4AF37] flex items-center justify-center text-black shadow-xl"><ShieldCheck size={32} /></div>
                    <div><h1 className="text-3xl font-cinzel font-black text-white uppercase tracking-widest">Admin Command</h1><p className="text-xs text-gray-500 font-bold uppercase tracking-[0.3em]">Guardian Protocol Active</p></div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
                        {[{ id: 'all', label: 'All Users' }, { id: 'scholar_pending', label: 'Pending Verification' }, { id: 'scholar_verified', label: 'Verified Scholars' }].map(f => (
                            <button key={f.id} onClick={() => setFilter(f.id as any)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === f.id ? 'bg-[#D4AF37] text-black' : 'text-gray-500 hover:text-white'}`}>{f.label}</button>
                        ))}
                    </div>
                    <input type="text" placeholder="Search database..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-[#121212] border border-white/10 rounded-xl py-3 px-6 text-xs text-white outline-none w-full md:w-64" />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {filteredUsers.map(user => (
                        <div key={user.id} className="p-6 rounded-[2rem] bg-[#0c0c0c] border border-white/5 flex flex-col md:flex-row items-center gap-6 group hover:border-[#D4AF37]/20 transition-all">
                            <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center text-gray-500 font-bold overflow-hidden border border-white/5">{user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : user.username?.[0]}</div>
                            <div className="flex-1 space-y-1 text-center md:text-left"><h4 className="font-bold text-white flex items-center gap-2 justify-center md:justify-start">{user.full_name || user.username}{user.role === 'Scholar' && <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-400 text-[8px] uppercase font-black">Scholar</span>}{user.is_verified && <CheckCircle size={14} className="text-green-500" />}</h4><p className="text-xs text-gray-500">{user.email || 'No Email'} • {user.country || 'Unknown'}</p></div>
                            {user.role === 'Scholar' && !user.is_verified && user.verification_proof && (<div className="flex items-center gap-4"><a href={user.verification_proof} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-[9px] font-bold uppercase text-gray-400 hover:text-white"><Eye size={12} /> View Proof</a><div className="flex gap-2"><button onClick={() => handleVerification(user.id!, true)} className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-black transition-all"><CheckCircle size={16} /></button><button onClick={() => handleVerification(user.id!, false)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><XCircle size={16} /></button></div></div>)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminPage;
