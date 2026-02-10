
import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Sparkles, UserPlus, Loader2, Send, Check } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';

interface Post {
  id: string | number;
  user: string;
  handle: string;
  time: string;
  content: string;
  likes: number;
  comments: number;
  isVerified: boolean;
  isLiked?: boolean;
}

const SocialPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    if (!isSupabaseConfigured()) {
      // Mock data if Supabase isn't connected
      setPosts([
        {
          id: 1,
          user: "Sheikh Yusuf",
          handle: "@yusuf_scholar",
          time: "2h ago",
          content: "The sweetness of faith is found in the moments of silence with your Creator. Today's reflection from Surah Ad-Duha: 'Your Lord has not forsaken you, nor does He hate you.'",
          likes: 1200,
          comments: 48,
          isVerified: true,
          isLiked: false
        },
        {
          id: 2,
          user: "Maryam A.",
          handle: "@maryam_reflects",
          time: "4h ago",
          content: "Seeking knowledge is a path to Jannah. Let us all commit to reading at least one page of the Quran with translation today. 📖✨",
          likes: 850,
          comments: 12,
          isVerified: false,
          isLiked: false
        }
      ]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('social_posts')
      .select('*, profiles(username, avatar_url, membership_tier)')
      .order('created_at', { ascending: false });

    if (data) {
      setPosts(data.map((p: any) => ({
        id: p.id,
        user: p.profiles?.username || 'Faithful Soul',
        handle: `@${p.profiles?.username || 'user'}`,
        time: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: p.content,
        likes: p.likes_count || 0,
        comments: p.comments_count || 0,
        isVerified: p.is_verified,
        isLiked: false
      })));
    }
    setLoading(false);
  };

  const handlePost = async () => {
    if (!newPostContent.trim() || isPosting || !isSupabaseConfigured()) return;
    setIsPosting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Please sign in to share a reflection.");
      setIsPosting(false);
      return;
    }

    const { error } = await supabase
      .from('social_posts')
      .insert([{ user_id: user.id, content: newPostContent }]);

    if (!error) {
      setNewPostContent('');
      fetchPosts();
    }
    setIsPosting(false);
  };

  const handleLike = (postId: string | number) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
    
    // Haptic feedback if available
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const handleShare = (post: Post) => {
    const text = `Reflection from ${post.user} on IqraPath: "${post.content}"`;
    navigator.clipboard.writeText(text).then(() => {
      alert("Reflection link copied to clipboard!");
    });
  };

  const toggleFollow = (handle: string) => {
    setFollowedUsers(prev => {
      const next = new Set(prev);
      if (next.has(handle)) next.delete(handle);
      else next.add(handle);
      return next;
    });
  };

  return (
    <div className="py-10 space-y-12 max-w-4xl mx-auto pb-40">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-5xl font-cinzel font-black text-white leading-tight">
            Ummah <span className="gold-shimmer">Feed</span>
          </h2>
          <p className="text-gray-500 text-lg font-light tracking-wide">Connect with seekers in a space of purity and wisdom.</p>
        </div>
        {!isSupabaseConfigured() && (
          <div className="px-4 py-2 glass border-yellow-500/20 text-yellow-500 text-[9px] font-black uppercase tracking-widest rounded-full">
            Demo Mode • Local Interaction
          </div>
        )}
      </div>

      {/* New Post Input */}
      <div className="px-4">
        <div className="premium-card p-8 rounded-[2.5rem] space-y-6">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="What spiritual reflection is on your heart today?"
            className="w-full bg-[#050505] border border-white/5 rounded-2xl p-6 text-gray-300 font-light tracking-wide focus:outline-none focus:border-[#D4AF37]/30 transition-all resize-none min-h-[120px]"
          />
          <div className="flex justify-end">
            <button 
              onClick={handlePost}
              disabled={isPosting || !newPostContent.trim()}
              className="px-8 py-3 bg-[#D4AF37] text-black font-black uppercase tracking-widest text-[9px] rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg"
            >
              {isPosting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Share Reflection
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-4">
          <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
          <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Gathering Sacred Voices</p>
        </div>
      ) : (
        <div className="space-y-8 px-4">
          {posts.map((post) => (
            <div key={post.id} className="premium-card p-10 rounded-[3rem] transition-all duration-700 animate-enter">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#111] to-[#050505] border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] text-xl font-bold uppercase shadow-xl">
                    {post.user[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-cinzel text-sm font-black text-white tracking-widest uppercase">{post.user}</h4>
                      {post.isVerified && <div className="w-3 h-3 bg-[#D4AF37] rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.5)]"><Sparkles size={8} className="text-black" /></div>}
                    </div>
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{post.handle} • {post.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <button 
                    onClick={() => toggleFollow(post.handle)}
                    className={`p-2 transition-all rounded-full ${followedUsers.has(post.handle) ? 'text-green-500 bg-green-500/10' : 'text-gray-700 hover:text-[#D4AF37] hover:bg-white/5'}`}
                   >
                     {followedUsers.has(post.handle) ? <Check size={20} /> : <UserPlus size={20} />}
                   </button>
                   <button className="p-2 text-gray-700 hover:text-white transition-colors hover:bg-white/5 rounded-full"><MoreHorizontal size={20} /></button>
                </div>
              </div>

              <p className="text-gray-300 text-lg font-light leading-relaxed mb-8 tracking-wide">
                {post.content}
              </p>

              <div className="pt-8 border-t border-white/5 flex items-center gap-10">
                <button 
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-2 transition-all hover:scale-110 active:scale-90 group ${post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                >
                  <Heart size={22} className={`${post.isLiked ? 'fill-current animate-pulse' : 'group-hover:scale-110'}`} />
                  <span className="text-xs font-mono font-bold">{post.likes.toLocaleString()}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-500 hover:text-[#D4AF37] transition-all hover:scale-110 active:scale-90">
                  <MessageCircle size={22} />
                  <span className="text-xs font-mono font-bold">{post.comments.toLocaleString()}</span>
                </button>
                <button 
                  onClick={() => handleShare(post)}
                  className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-all hover:scale-110 active:scale-90 ml-auto"
                >
                  <Share2 size={22} />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Spread Wisdom</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center py-12">
        <p className="text-[10px] text-gray-700 uppercase tracking-[1em] font-black">End of Feed • Stay Grateful</p>
      </div>
    </div>
  );
};

export default SocialPage;
