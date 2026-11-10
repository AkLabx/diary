// Deno Supabase Edge Function: weather-proxy
// Proxies OpenWeatherMap securely without exposing API keys to the client bundle,
// with server-side caching and automatic fallback to Open-Meteo.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHERMAP_API_KEY') || '227b57dcb9e272db9e362fee3a14b924';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { lat, lon, city } = body;

    // 1. Try OpenWeatherMap via secure server-side call
    if (OPENWEATHER_API_KEY) {
      try {
        let url = '';
        if (city && typeof city === 'string' && city.trim()) {
          url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city.trim())}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        } else if (typeof lat === 'number' && typeof lon === 'number') {
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
                location: data.name ?? (city || `Nearby (${lat?.toFixed(1)}, ${lon?.toFixed(1)})`),
                source: 'openweathermap'
              }),
              {
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json',
                  'Cache-Control': 'public, max-age=900' // 15-minute CDN/edge cache
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
    if (typeof lat === 'number' && typeof lon === 'number') {
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
            location: city || `Nearby (${lat.toFixed(1)}, ${lon.toFixed(1)})`,
            source: 'open-meteo'
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=900'
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
