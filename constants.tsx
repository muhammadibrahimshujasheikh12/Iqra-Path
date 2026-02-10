
import React from 'react';
import { Home, BookOpen, Clock, Activity, BookCheck, MessageSquare, BadgePercent, Moon, MapPin, GraduationCap, History, HeartHandshake, BookText, Globe, Fingerprint, MessageCircle, Youtube } from 'lucide-react';
import { AppRoute, NavItem } from './types';

export const COLORS = {
  GOLD: '#D4AF37',
  GOLD_LIGHT: '#FCF6BA',
  GOLD_DARK: '#AA771C',
  BLACK: '#050505',
  SURFACE: '#121212',
  GREEN: '#1B4332',
  DEEP_GREEN: '#081C15',
  BG_DARK: '#050505'
};

export const NAV_ITEMS: NavItem[] = [
  { id: AppRoute.HOME, label: 'Home', icon: <Home className="w-5 h-5" /> },
  { id: AppRoute.QURAN, label: 'Quran', icon: <BookOpen className="w-5 h-5" /> },
  { id: AppRoute.AI, label: 'Noor', icon: <Moon className="w-5 h-5" /> },
  { id: AppRoute.TRACKER, label: 'Path', icon: <Activity className="w-5 h-5" /> },
];

export const KNOWLEDGE_CATEGORIES = [
  { id: AppRoute.SIRAH, label: 'Prophets & Sirah', description: 'Lives of the Holy Ones', icon: <History className="text-emerald-500" /> },
  { id: AppRoute.TASBIH, label: 'Tasbih Counter', description: 'Digital Prayer Beads', icon: <Fingerprint className="text-[#D4AF37]" /> },
  { id: AppRoute.MASJID, label: 'Masjid Locator', description: 'Find nearby Mosques', icon: <MapPin className="text-[#D4AF37]" /> },
  { id: AppRoute.ZAKAT, label: 'Zakat Hub', description: 'Calculator & Rules', icon: <BadgePercent className="text-yellow-600" /> },
  { id: AppRoute.RAMADAN, label: 'Ramadan', description: 'Fasting & Sawm', icon: <Moon className="text-indigo-400" /> },
];
