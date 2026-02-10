import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Twitter, Instagram, Github, Moon, Heart } from 'lucide-react';
import { AppRoute } from './types';
import Logo from './components/Logo';

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const handleNav = (route: string) => {
    navigate(`/${route}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialLinks = [
    { Icon: Twitter, url: 'https://twitter.com/iqrapath', label: 'Twitter' },
    { Icon: Instagram, url: 'https://instagram.com/iqrapath', label: 'Instagram' },
    { Icon: Github, url: 'https://github.com/iqrapath', label: 'Github' }
  ];

  return (
    <footer className="relative border-t border-[#D4AF37]/10 bg-[#030303] overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>
      
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-40 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          
          <div className="space-y-8 col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="cursor-pointer group w-fit" onClick={() => handleNav('')}>
              <Logo size="md" className="group-hover:scale-105 transition-transform duration-500" />
            </div>
            <p className="text-gray-500 text-sm font-light leading-relaxed tracking-wide max-w-sm">
              A modern sanctuary for sacred knowledge. Providing an authentic experience for the global Ummah as a form of Sadaqah Jariyah.
            </p>
            <div className="flex gap-5">
              {socialLinks.map(({ Icon, url, label }, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className="w-10 h-10 rounded-xl glass border-white/5 flex items-center justify-center text-gray-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all hover:scale-110 active:scale-95">
                  <Icon size={18} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.6em] text-white flex items-center gap-3">
              <span className="w-2 h-2 bg-[#D4AF37] rounded-full"></span>
              Sanctuary
            </h4>
            <ul className="space-y-5">
              {[
                { label: 'The Holy Quran', route: AppRoute.QURAN },
                { label: 'Prayer Times', route: AppRoute.PRAYER },
                { label: 'Sacred Path', route: AppRoute.TRACKER },
                { label: 'Masjid Locator', route: 'masjid' },
                { label: 'Knowledge Hub', route: AppRoute.KNOWLEDGE },
              ].map((link) => (
                <li key={link.label}>
                  <button onClick={() => handleNav(link.route)} className="text-gray-500 hover:text-[#D4AF37] text-xs font-bold uppercase tracking-widest transition-all hover:translate-x-2 text-left">{link.label}</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.6em] text-white flex items-center gap-3">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Learning AI
            </h4>
            <ul className="space-y-5">
              {[
                { label: 'AI Noor Companion', route: AppRoute.AI },
                { label: 'Hafiz Companion', route: AppRoute.HAFIZ_AI },
                { label: 'Sirah History', route: AppRoute.SIRAH },
              ].map((link) => (
                <li key={link.label}>
                  <button onClick={() => handleNav(link.route)} className="text-gray-500 hover:text-green-500 text-xs font-bold uppercase tracking-widest transition-all hover:translate-x-2 flex items-center gap-2 text-left">{link.label}</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.6em] text-white flex items-center gap-3">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Legal
            </h4>
            <div className="flex flex-col gap-5 pt-2">
                 <button onClick={() => handleNav(AppRoute.PRIVACY)} className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest text-left transition-all hover:translate-x-2">Privacy Policy</button>
                 <button onClick={() => handleNav(AppRoute.TERMS)} className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest text-left transition-all hover:translate-x-2">Terms & Conditions</button>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <Moon size={16} className="text-[#D4AF37] opacity-30" />
            <span className="text-[10px] text-gray-600 font-black uppercase tracking-[0.5em]">
              &copy; {currentYear} • Al-ḥamdu lillāh
            </span>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-gray-700 font-bold uppercase tracking-widest">
            <Heart size={12} className="text-red-900" />
            Made for the Ummah
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;