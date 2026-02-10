
import React from 'react';

export interface Word {
  arabic: string;
  translation: string;
  transliteration?: string;
}

export interface Ayah {
  number: number;
  text: string;
  translation?: string;
  numberInSurah: number;
  juz: number;
  audio?: string;
  audioSecondary?: string[];
  words?: Word[];
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
  audioUrl?: string;
}

export interface Reciter {
  id: string;
  identifier: string;
  name: string;
  style?: string;
  language?: string;
}

export interface Edition {
  identifier: string;
  language: string;
  name: string;
  english_name: string;
  format: string;
  type: string;
}

export interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Sunrise: string;
  Sunset: string;
}

export interface Profile {
  id?: string;
  username: string;
  full_name: string;
  role: string;
  email?: string; // Added for Admin view
  age: number | string;
  country: string;
  city: string;
  membership_tier: string;
  gender?: string;
  phone_number?: string;
  avatar_url?: string;
  banner_url?: string;
  about_me?: string;
  is_verified?: boolean;
  verification_proof?: string;
}

export enum AppRoute {
  HOME = 'home',
  QURAN = 'quran',
  QURAN_READER = 'quran-reader',
  PRAYER = 'prayer',
  TRACKER = 'tracker',
  KNOWLEDGE = 'knowledge',
  AI = 'ai',
  ZAKAT = 'zakat',
  RAMADAN = 'ramadan',
  SOCIAL = 'social',
  MASJID = 'masjid',
  SIRAH = 'sirah',
  SADAQAH = 'sadaqah',
  HAFIZ_AI = 'hafiz-ai',
  TASBIH = 'tasbih',
  ADMIN = 'admin',
  PRIVACY = 'privacy',
  TERMS = 'terms'
}

export interface NavItem {
  id: AppRoute;
  label: string;
  icon: React.ReactNode;
}
