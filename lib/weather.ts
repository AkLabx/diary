import { Weather } from '../types';
import { supabase } from './supabaseClient';

// =================================================================================
// Weather Service: Supabase Edge Proxy (OpenWeatherMap) + Resilient Open-Meteo Fallback
// =================================================================================
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

/**
 * Decode WMO Weather Codes (used by Open-Meteo) into human-readable description
 * and standard weather icon codes compatible with getWeatherConditionEmoji.
 */
export function decodeWmoWeatherCode(wmoCode: number, isDay: number = 1): { description: string; icon: string } {
  const daySuffix = isDay ? 'd' : 'n';
  switch (wmoCode) {
    case 0:
      return { description: 'Clear sky', icon: `01${daySuffix}` };
    case 1:
      return { description: 'Mainly clear', icon: `01${daySuffix}` };
    case 2:
      return { description: 'Partly cloudy', icon: `02${daySuffix}` };
    case 3:
      return { description: 'Overcast', icon: `04${daySuffix}` };
    case 45:
    case 48:
      return { description: 'Foggy', icon: `50${daySuffix}` };
    case 51:
    case 53:
    case 55:
      return { description: 'Drizzle', icon: `09${daySuffix}` };
    case 56:
    case 57:
      return { description: 'Freezing drizzle', icon: `09${daySuffix}` };
    case 61:
      return { description: 'Light rain', icon: `10${daySuffix}` };
    case 63:
      return { description: 'Moderate rain', icon: `10${daySuffix}` };
    case 65:
      return { description: 'Heavy rain', icon: `10${daySuffix}` };
    case 66:
    case 67:
      return { description: 'Freezing rain', icon: `13${daySuffix}` };
    case 71:
    case 73:
    case 75:
    case 77:
      return { description: 'Snow', icon: `13${daySuffix}` };
    case 80:
    case 81:
    case 82:
      return { description: 'Rain showers', icon: `09${daySuffix}` };
    case 85:
    case 86:
      return { description: 'Snow showers', icon: `13${daySuffix}` };
    case 95:
      return { description: 'Thunderstorm', icon: `11${daySuffix}` };
    case 96:
    case 99:
      return { description: 'Thunderstorm with hail', icon: `11${daySuffix}` };
    default:
      return { description: 'Partly cloudy', icon: `02${daySuffix}` };
  }
}

/**
 * Reverse geocodes coordinates to a friendly city or locality name.
 * Uses BigDataCloud client API, falling back to OpenStreetMap Nominatim.
 */
export async function reverseGeocodeCoordinates(lat: number, lon: number): Promise<string | null> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || data.principalSubdivision;
      if (city && typeof city === 'string') {
        return city;
      }
    }
  } catch (e) {
    console.warn("Reverse geocode via BigDataCloud failed:", e);
  }

  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    const res = await fetch(nomUrl, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      const name = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || data.name;
      if (name) return name;
    }
  } catch (e) {
    console.warn("Reverse geocode via Nominatim failed:", e);
  }

  return null;
}

/**
 * Open-Meteo Forecast fetcher (Free, zero API key, 10k calls/day non-commercial)
 */
export async function fetchOpenMeteoWeather(
  lat: number,
  lon: number,
  source: 'gps' | 'ip' | 'manual' = 'gps',
  locationNameHint?: string
): Promise<Weather | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo request failed with status ${response.status}`);
    }
    const data = await response.json();
    if (!data.current_weather) {
      throw new Error("Invalid Open-Meteo response structure");
    }

    let resolvedLocation = locationNameHint?.trim();
    if (!resolvedLocation) {
      const geoCity = await reverseGeocodeCoordinates(lat, lon);
      resolvedLocation = geoCity || `Nearby (${lat.toFixed(1)}, ${lon.toFixed(1)})`;
    }

    const { description, icon } = decodeWmoWeatherCode(
      data.current_weather.weathercode,
      data.current_weather.is_day
    );

    const result: Weather = {
      temp: data.current_weather.temperature,
      description,
      icon,
      location: resolvedLocation,
      source,
      updatedAt: Date.now()
    };
    setCachedWeather(result);
    return result;
  } catch (err) {
    console.error("Open-Meteo fallback request failed:", err);
    return null;
  }
}

/**
 * Open-Meteo Geocoding + Weather by City Name
 */
export async function fetchOpenMeteoWeatherByCity(cityName: string): Promise<Weather | null> {
  if (!cityName || !cityName.trim()) return null;

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName.trim())}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) {
      throw new Error(`Open-Meteo geocoding failed with status ${geoRes.status}`);
    }
    const geoData = await geoRes.json();
    if (!geoData.results || !geoData.results.length) {
      console.warn(`No Open-Meteo geocoding results for "${cityName}"`);
      return null;
    }

    const match = geoData.results[0];
    const lat = match.latitude;
    const lon = match.longitude;
    const resolvedName = match.name || cityName.trim();

    return await fetchOpenMeteoWeather(lat, lon, 'manual', resolvedName);
  } catch (err) {
    console.error("Open-Meteo city search failed:", err);
    return null;
  }
}

export async function fetchWeather(
  lat: number,
  lon: number,
  source: 'gps' | 'ip' | 'manual' = 'gps',
  locationNameHint?: string
): Promise<Weather | null> {
  // 1. Try secure Supabase Edge Function weather-proxy (proxies OpenWeatherMap + server-side Open-Meteo fallback)
  try {
    const { data, error } = await supabase.functions.invoke('weather-proxy', {
      body: { lat, lon }
    });
    if (!error && data && typeof data.temp === 'number') {
      const result: Weather = {
        temp: data.temp,
        description: data.description || '',
        icon: data.icon || '',
        location: data.location || locationNameHint || `Nearby (${lat.toFixed(1)}, ${lon.toFixed(1)})`,
        source,
        updatedAt: Date.now()
      };
      setCachedWeather(result);
      return result;
    }
  } catch (proxyError) {
    console.warn("Weather proxy Edge Function failed, falling back to direct Open-Meteo...", proxyError);
  }

  // 2. Direct client-side resilient fallback to Open-Meteo
  return fetchOpenMeteoWeather(lat, lon, source, locationNameHint);
}

export async function fetchWeatherByCity(cityName: string): Promise<Weather | null> {
  if (!cityName || !cityName.trim()) {
    return null;
  }

  // 1. Try secure Supabase Edge Function weather-proxy
  try {
    const { data, error } = await supabase.functions.invoke('weather-proxy', {
      body: { city: cityName.trim() }
    });
    if (!error && data && typeof data.temp === 'number') {
      const result: Weather = {
        temp: data.temp,
        description: data.description || '',
        icon: data.icon || '',
        location: data.location || cityName.trim(),
        source: 'manual',
        updatedAt: Date.now()
      };
      setCachedWeather(result);
      return result;
    }
  } catch (proxyError) {
    console.warn(`Weather proxy failed for city "${cityName}", falling back to direct Open-Meteo...`, proxyError);
  }

  // 2. Direct client-side resilient fallback to Open-Meteo
  return fetchOpenMeteoWeatherByCity(cityName);
}

export async function fetchLocationByIP(): Promise<{ lat: number; lon: number; city: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeout);
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
    console.warn("IP geolocation fallback failed or timed out:", e);
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
    const ipWeather = await fetchWeather(ipLocation.lat, ipLocation.lon, 'ip', ipLocation.city);
    if (ipWeather) return ipWeather;
  }

  return null;
}
