import { Weather } from '../types';

// =================================================================================
// OpenWeatherMap API & Weather Service
// =================================================================================
const API_KEY: string = '227b57dcb9e272db9e362fee3a14b924';
const CACHE_KEY = 'diary_cached_weather';
const CUSTOM_CITY_KEY = 'diary_custom_city';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache validity

export function getCachedWeather(): Weather | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: Weather = JSON.parse(raw);
    if (parsed.updatedAt && Date.now() - parsed.updatedAt < CACHE_DURATION) {
      return parsed;
    }
  } catch (e) {
    console.warn("Error reading cached weather:", e);
  }
  return null;
}

export function setCachedWeather(weather: Weather): void {
  try {
    const dataWithTime: Weather = { ...weather, updatedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(dataWithTime));
  } catch (e) {
    console.warn("Error saving cached weather:", e);
  }
}

export function getCustomCity(): string | null {
  try {
    return localStorage.getItem(CUSTOM_CITY_KEY);
  } catch (e) {
    return null;
  }
}

export function setCustomCity(city: string | null): void {
  try {
    if (city && city.trim()) {
      localStorage.setItem(CUSTOM_CITY_KEY, city.trim());
    } else {
      localStorage.removeItem(CUSTOM_CITY_KEY);
    }
  } catch (e) {
    console.warn("Error persisting custom city:", e);
  }
}

export async function fetchWeather(lat: number, lon: number, source: 'gps' | 'ip' = 'gps'): Promise<Weather | null> {
  if (API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') {
    console.warn("Weather feature is disabled. Please provide an OpenWeatherMap API key in `lib/weather.ts`.");
    return null;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API request failed with status ${response.status}`);
    }
    const data = await response.json();

    const result: Weather = {
      temp: data.main.temp,
      description: data.weather[0]?.description || '',
      icon: data.weather[0]?.icon || '',
      location: data.name,
      source,
      updatedAt: Date.now()
    };
    setCachedWeather(result);
    return result;
  } catch (error) {
    console.error("Could not fetch weather data:", error);
    return null;
  }
}

export async function fetchWeatherByCity(cityName: string): Promise<Weather | null> {
  if (!cityName || !cityName.trim() || API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') {
    return null;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName.trim())}&appid=${API_KEY}&units=metric`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API request failed with status ${response.status}`);
    }
    const data = await response.json();

    const result: Weather = {
      temp: data.main.temp,
      description: data.weather[0]?.description || '',
      icon: data.weather[0]?.icon || '',
      location: data.name,
      source: 'manual',
      updatedAt: Date.now()
    };
    setCachedWeather(result);
    return result;
  } catch (error) {
    console.error("Could not fetch weather data by city:", error);
    return null;
  }
}

export async function fetchLocationByIP(): Promise<{ lat: number; lon: number; city: string } | null> {
  try {
    const res = await fetch('https://ipwho.is/');
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
      return {
        lat: data.latitude,
        lon: data.longitude,
        city: data.city || data.region || data.country || ''
      };
    }
  } catch (e) {
    console.warn("IP geolocation fallback failed:", e);
  }
  return null;
}

export function getCoordinatesFromGPS(timeoutMs: number = 8000): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 1000 * 60 * 30 }
    );
  });
}

export function getWeatherConditionEmoji(iconCode?: string, description?: string): string {
  const code = (iconCode || '').toLowerCase();
  const desc = (description || '').toLowerCase();

  if (code.startsWith('01')) return code.includes('n') ? '🌙' : '☀️';
  if (code.startsWith('02')) return '⛅';
  if (code.startsWith('03') || code.startsWith('04')) return '☁️';
  if (code.startsWith('09') || code.startsWith('10')) return '🌧️';
  if (code.startsWith('11')) return '⛈️';
  if (code.startsWith('13')) return '❄️';
  if (code.startsWith('50')) return '🌫️';

  if (desc.includes('clear')) return '☀️';
  if (desc.includes('cloud')) return '⛅';
  if (desc.includes('rain') || desc.includes('drizzle')) return '🌧️';
  if (desc.includes('thunder')) return '⛈️';
  if (desc.includes('snow')) return '❄️';
  if (desc.includes('mist') || desc.includes('fog')) return '🌫️';

  return '🌤️';
}

export async function loadWeather(options?: { forceRefresh?: boolean }): Promise<Weather | null> {
  // 1. If user set a custom city, respect that preference first
  const customCity = getCustomCity();
  if (customCity) {
    const res = await fetchWeatherByCity(customCity);
    if (res) return res;
  }

  // 2. Check cached weather if not forcing a refresh
  if (!options?.forceRefresh) {
    const cached = getCachedWeather();
    if (cached) return cached;
  }

  // 3. Try browser GPS location
  try {
    const coords = await getCoordinatesFromGPS(6000);
    const gpsWeather = await fetchWeather(coords.lat, coords.lon, 'gps');
    if (gpsWeather) return gpsWeather;
  } catch (gpsError) {
    console.warn("GPS failed or denied, trying network IP fallback...", gpsError);
  }

  // 4. Try network IP fallback
  const ipLocation = await fetchLocationByIP();
  if (ipLocation) {
    const ipWeather = await fetchWeather(ipLocation.lat, ipLocation.lon, 'ip');
    if (ipWeather) return ipWeather;
  }

  return null;
}
