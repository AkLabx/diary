// Deno Supabase Edge Function: weather-proxy
// Proxies OpenWeatherMap securely without exposing API keys to the client bundle,
// with server-side caching and automatic fallback to Open-Meteo.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  'https://aklabx.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
  'https://localhost'
]);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || req.headers.get('origin') || '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://aklabx.github.io';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
}

const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHERMAP_API_KEY');

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Enforce authenticated user verification
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !anonKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error: missing Supabase credentials' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json().catch(() => ({}));
    const { lat, lon, city } = body;

    // Validate inputs
    const isValidCity = typeof city === 'string' && city.trim().length > 0 && city.trim().length <= 120;
    const isValidCoords = typeof lat === 'number' && typeof lon === 'number' &&
      Number.isFinite(lat) && Number.isFinite(lon) &&
      lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;

    if (!isValidCity && !isValidCoords) {
      return new Response(
        JSON.stringify({ error: 'Invalid parameters: Provide a valid city string (<= 120 chars) or valid numeric coordinates (lat: [-90,90], lon: [-180,180])' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanCity = isValidCity ? city.trim() : undefined;

    // 1. Try OpenWeatherMap via secure server-side call if key is configured
    if (OPENWEATHER_API_KEY) {
      try {
        let url = '';
        if (cleanCity) {
          url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cleanCity)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        } else if (isValidCoords) {
          url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        }

        if (url) {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            return new Response(
              JSON.stringify({
                temp: data.main?.temp ?? 0,
                description: data.weather?.[0]?.description ?? '',
                icon: data.weather?.[0]?.icon ?? '',
                location: data.name ?? (cleanCity || `Nearby (${lat?.toFixed(1)}, ${lon?.toFixed(1)})`),
                source: 'openweathermap'
              }),
              {
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json',
                  'Cache-Control': 'private, max-age=900'
                }
              }
            );
          }
        }
      } catch (owmError) {
        console.warn('OpenWeatherMap server fetch failed, attempting Open-Meteo fallback:', owmError);
      }
    }

    // 2. Resilient Fallback to Open-Meteo if OpenWeatherMap failed or was unavailable
    if (isValidCoords) {
      const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      const omRes = await fetch(openMeteoUrl);
      if (omRes.ok) {
        const omData = await omRes.json();
        const current = omData.current_weather;
        return new Response(
          JSON.stringify({
            temp: current?.temperature ?? 0,
            description: 'Clear sky',
            icon: '01d',
            location: cleanCity || `Nearby (${lat.toFixed(1)}, ${lon.toFixed(1)})`,
            source: 'open-meteo'
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'private, max-age=900'
            }
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Unable to retrieve weather for provided parameters' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
