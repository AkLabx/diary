import { Weather } from '../types';

// =================================================================================
// IMPORTANT: Weather API Setup
// =================================================================================
// This feature uses the OpenWeatherMap API to fetch local weather.
// To enable it, you need a FREE API key.
//
// 1. Sign up for a free account at: https://openweathermap.org/
// 2. Go to your API keys page and generate a key.
// 3. Replace the placeholder 'YOUR_OPENWEATHERMAP_API_KEY' below with your actual key.
//
// Fix: Explicitly type API_KEY as a string to prevent TypeScript from inferring a narrow literal type,
// which causes a comparison error on the placeholder check below.
const API_KEY: string = '227b57dcb9e272db9e362fee3a14b924';
// =================================================================================

export async function fetchWeather(lat: number, lon: number): Promise<Weather | null> {
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

    return {
      temp: data.main.temp,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      location: data.name,
    };
  } catch (error) {
    console.error("Could not fetch weather data:", error);
    return null;
  }
}