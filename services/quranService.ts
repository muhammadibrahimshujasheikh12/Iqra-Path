
import { Surah, Ayah, Reciter, Edition, Word } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';

const BASE_URL = 'https://api.alquran.cloud/v1';

export const AVAILABLE_TRANSLATIONS = [
  { id: 'en.sahih', name: 'English (Sahih International)', lang: 'en-US', dir: 'ltr' },
  { id: 'ur.jalandhry', name: 'Urdu (Jalandhry)', lang: 'ur-PK', dir: 'rtl' },
  { id: 'fr.hamidullah', name: 'French (Hamidullah)', lang: 'fr-FR', dir: 'ltr' },
  { id: 'id.indonesian', name: 'Indonesian (Bahasa)', lang: 'id-ID', dir: 'ltr' },
  { id: 'tr.ates', name: 'Turkish (Süleyman Ateş)', lang: 'tr-TR', dir: 'ltr' },
  { id: 'es.basio', name: 'Spanish (Cortés)', lang: 'es-ES', dir: 'ltr' },
  { id: 'ru.kuliev', name: 'Russian (Kuliev)', lang: 'ru-RU', dir: 'ltr' },
  { id: 'zh.jian', name: 'Chinese (Ma Jian)', lang: 'zh-CN', dir: 'ltr' },
  { id: 'bn.bengali', name: 'Bengali (Muhiuddin Khan)', lang: 'bn-BD', dir: 'ltr' }
];

async function safeFetch(url: string, options: any = {}): Promise<Response | null> {
    try {
        const response = await safeFetchInternal(url, options);
        return response;
    } catch (err) {
        console.error("Fetch failed:", err);
        return null;
    }
}

// Wrapper to handle fetch retries or timeouts if necessary
async function safeFetchInternal(url: string, options: any): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 15000); // 15s timeout
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
}

export const fetchSurahs = async (): Promise<Surah[]> => {
  try {
    const response = await safeFetch(`${BASE_URL}/surah`);
    if (response && response.ok) {
      const data = await response.json();
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch surahs", error);
    return [];
  }
};

export const fetchSurahDetail = async (
  number: number, 
  audioEdition: string = 'ar.alafasy', 
  textEdition: string = 'en.sahih'
): Promise<{ surah: Surah; ayahs: Ayah[] }> => {
    
    // Construct API call
    // We use comma separation to get multiple editions in one call
    const url = `${BASE_URL}/surah/${number}/editions/${audioEdition},${textEdition}`;
    const response = await safeFetch(url);
    
    if (!response || !response.ok) {
        throw new Error('Failed to load Surah data');
    }

    const json = await response.json();
    const datasets = json.data; 

    // 1. Identify Audio Dataset
    let audioData = datasets.find((d: any) => d.identifier === audioEdition && d.format === 'audio');
    // Fallback: search just by format if identifier mismatch
    if (!audioData) audioData = datasets.find((d: any) => d.format === 'audio');
    
    // 2. Identify Text Dataset
    let textData = datasets.find((d: any) => d.identifier === textEdition);
    // If not found by specific ID, find any text translation
    if (!textData) textData = datasets.find((d: any) => d.type === 'translation' || d.format === 'text');

    // 3. Last Resort Fallbacks
    if (!audioData) audioData = datasets[0];
    if (!textData) textData = datasets.length > 1 ? datasets[1] : datasets[0];

    const ayahs = audioData.ayahs.map((audioAyah: any, index: number) => {
        const textAyah = textData && textData.ayahs && textData.ayahs[index] ? textData.ayahs[index] : null;
        
        // Robust Audio URL Extraction
        let audioUrl = audioAyah.audio;
        
        // Check secondary if primary is empty
        if (!audioUrl && audioAyah.audioSecondary && audioAyah.audioSecondary.length > 0) {
            audioUrl = audioAyah.audioSecondary[0];
        }

        // FORCE HTTPS
        if (audioUrl && audioUrl.startsWith('http://')) {
            audioUrl = audioUrl.replace('http://', 'https://');
        }

        // FALLBACK: If API returns no audio, construct CDN link manually
        if (!audioUrl) {
            const reciterId = audioEdition || 'ar.alafasy';
            audioUrl = `https://cdn.islamic.network/quran/audio/128/${reciterId}/${audioAyah.number}.mp3`;
        }

        // TEXT CLEANING
        let displayText = audioData.format === 'text' ? audioAyah.text : (textData && textData.language === 'ar' ? textData.ayahs[index].text : audioAyah.text);
        
        if (number !== 1 && number !== 9 && index === 0) {
            const bismillahForms = [
                "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
                "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
                "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
                "بسم الله الرحمن الرحيم"
            ];
            for (const b of bismillahForms) {
                if (displayText.startsWith(b)) {
                    displayText = displayText.replace(b, '').trim();
                }
            }
        }

        return {
            number: audioAyah.number, // Global Ayah Number
            text: displayText,
            translation: textAyah ? textAyah.text : '',
            numberInSurah: audioAyah.numberInSurah,
            juz: audioAyah.juz,
            audio: audioUrl,
            words: []
        };
    });

    return {
        surah: {
            number: audioData.number,
            name: audioData.name,
            englishName: audioData.englishName,
            englishNameTranslation: audioData.englishNameTranslation,
            numberOfAyahs: audioData.numberOfAyahs,
            revelationType: audioData.revelationType
        },
        ayahs: ayahs
    };
};

export const fetchAyahTafseer = async (surahNumber: number, ayahNumber: number, edition: string): Promise<string> => {
    const tafseerId = edition.includes('ibnkathir') ? 'en.ibnkathir' : edition;
    const response = await safeFetch(`${BASE_URL}/ayah/${surahNumber}:${ayahNumber}/editions/${tafseerId}`);
    if (response && response.ok) {
        const data = await response.json();
        const tafseerData = data.data.find((d: any) => d.identifier === tafseerId) || data.data[0];
        if (tafseerData && tafseerData.text) {
             return tafseerData.text;
        }
    }
    return "Tafseer currently unavailable for this specific Ayah.";
}

export const saveReadingProgress = async (surahNumber: number, surahName: string, ayahNumber: number) => {
  if (!isSupabaseConfigured()) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('quran_progress').upsert({
      user_id: user.id, 
      surah_number: surahNumber, 
      surah_name: surahName, 
      ayah_number: ayahNumber, 
      last_read_at: new Date().toISOString()
    });
  } catch (err) {
      console.error("Failed to save progress:", err);
  }
};

export const getLastReadingProgress = async () => {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from('quran_progress').select('*').eq('user_id', user.id).single();
    return data;
  } catch (err) { return null; }
};

export const seedFullEdition = async (editionIdentifier: string): Promise<void> => {};
export const autoSeedSacredLibrary = async (): Promise<void> => {};
