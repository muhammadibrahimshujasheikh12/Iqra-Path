
import { PrayerTimes } from '../types';

const CACHE_KEY = 'iqrapath_prayer_cache_v4';

// New: Synchronous cache retrieval for instant UI load
export const getCachedPrayerTimes = (): { times: PrayerTimes, location?: any } | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      // Check if data is from today to ensure relevance
      const today = new Date().toISOString().split('T')[0];
      if (data.date === today) {
        return { times: data.times, location: data.location };
      }
    }
  } catch (e) {
    // Ignore cache errors
  }
  return null;
};

export const fetchPrayerTimes = async (lat: number, lng: number): Promise<PrayerTimes> => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  // Try cache first (redundant check but good for safety)
  const cachedData = getCachedPrayerTimes();
  if (cachedData && cachedData.location) {
     // Allow small drift in location (approx 1km) to use cache
     const { lat: cLat, lng: cLng } = cachedData.location;
     if (Math.abs(cLat - lat) < 0.01 && Math.abs(cLng - lng) < 0.01) {
        return cachedData.times;
     }
  }

  try {
    return await refreshPrayerTimes(lat, lng, dateStr);
  } catch (err) {
    if (cachedData) return cachedData.times;
    return getDefaultPrayerTimes();
  }
};

export const fetchPrayerTimesByCity = async (city: string, country: string): Promise<PrayerTimes> => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const cacheKey = `iqrapath_city_cache_${city}_${country}`;

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
      try {
          const { date, times } = JSON.parse(cached);
          if (date === dateStr) return times;
      } catch (e) { localStorage.removeItem(cacheKey); }
  }

  try {
    // Using Method 3 (Muslim World League) as a standard global default
    const url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=3`;
    const response = await fetch(url, { headers: { 'Accept': 'application/json' }});
    
    if (!response.ok) throw new Error('API_REJECTED');

    const data = await response.json();
    const timings = data?.data?.timings;

    if (timings) {
      const sanitized: PrayerTimes = {
        Fajr: timings.Fajr.split(' ')[0],
        Sunrise: timings.Sunrise.split(' ')[0],
        Dhuhr: timings.Dhuhr.split(' ')[0],
        Asr: timings.Asr.split(' ')[0],
        Sunset: timings.Sunset.split(' ')[0],
        Maghrib: timings.Maghrib.split(' ')[0],
        Isha: timings.Isha.split(' ')[0],
      };
      localStorage.setItem(cacheKey, JSON.stringify({ date: dateStr, times: sanitized }));
      return sanitized;
    }
    throw new Error('INVALID_STRUCTURE');
  } catch (error) {
    console.warn("City fetch failed, falling back to defaults", error);
    return getDefaultPrayerTimes();
  }
};

const refreshPrayerTimes = async (lat: number, lng: number, dateStr: string): Promise<PrayerTimes> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    // Changed to Method 3 (Muslim World League) which is standard for Fajr (18 deg) vs ISNA (15 deg)
    const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=3`;
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
      mode: 'cors'
    });
    
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error('API_REJECTED');

    const data = await response.json();
    const timings = data?.data?.timings;

    if (timings) {
      const sanitized: PrayerTimes = {
        Fajr: timings.Fajr.split(' ')[0],
        Sunrise: timings.Sunrise.split(' ')[0],
        Dhuhr: timings.Dhuhr.split(' ')[0],
        Asr: timings.Asr.split(' ')[0],
        Sunset: timings.Sunset.split(' ')[0],
        Maghrib: timings.Maghrib.split(' ')[0],
        Isha: timings.Isha.split(' ')[0],
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify({ date: dateStr, times: sanitized, location: { lat, lng } }));
      return sanitized;
    }
    throw new Error('INVALID_STRUCTURE');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Helper to get City Name from Coordinates (Reverse Geocoding)
export const getReverseGeocoding = async (lat: number, lng: number): Promise<string> => {
  try {
    // Using BigDataCloud's free client-side reverse geocoding API
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || data.principalSubdivision;
      const country = data.countryName;
      if (city && country) return `${city}, ${country}`;
      return country || "Unknown Location";
    }
  } catch (e) {
    console.warn("Reverse geocoding failed", e);
  }
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

// Fallback: Fetch location via IP then get prayer times
export const fetchPrayerTimesByIP = async (): Promise<{ times: PrayerTimes, method: 'IP' | 'Default' }> => {
  try {
    const locRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
    if (locRes.ok) {
        const locData = await locRes.json();
        const lat = parseFloat(locData.latitude);
        const lng = parseFloat(locData.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
            const times = await fetchPrayerTimes(lat, lng);
            return { times, method: 'IP' };
        }
    }
  } catch (e) {
    console.warn("IP Geo failed, falling back to defaults", e);
  }
  return { times: getDefaultPrayerTimes(), method: 'Default' };
};

export const getDefaultPrayerTimes = (): PrayerTimes => ({
  Fajr: '05:15',
  Sunrise: '06:45',
  Dhuhr: '12:30',
  Asr: '15:30',
  Sunset: '18:10',
  Maghrib: '18:15',
  Isha: '19:45'
});
