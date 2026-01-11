import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

/**
 * Geocode Edge Function
 * Proxies LocationIQ API calls to keep the API key server-side
 */
Deno.serve(async (req) => {
  console.log('🗺️ Geocode Edge Function başlatıldı');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Get LocationIQ API key from secrets (server-side only)
    const locationIQApiKey = Deno.env.get('LOCATIONIQ_API_KEY');
    
    if (!locationIQApiKey) {
      console.error('❌ LOCATIONIQ_API_KEY secret bulunamadı');
      return new Response(JSON.stringify({ 
        error: 'LocationIQ API anahtarı yapılandırılmamış' 
      }), {
        headers: corsHeaders,
        status: 500
      });
    }

    // Parse request body
    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ 
        error: 'Geçersiz JSON formatı' 
      }), {
        headers: corsHeaders,
        status: 400
      });
    }

    const { action, query, lat, lon, countryCode = 'tr' } = payload;

    if (!action) {
      return new Response(JSON.stringify({ 
        error: 'action parametresi gerekli (autocomplete, geocode, reverse)' 
      }), {
        headers: corsHeaders,
        status: 400
      });
    }

    const BASE_URL = 'https://api.locationiq.com/v1';
    let apiUrl: string;
    let params: URLSearchParams;

    switch (action) {
      case 'autocomplete':
        if (!query || query.length < 3) {
          return new Response(JSON.stringify([]), {
            headers: corsHeaders,
            status: 200
          });
        }
        params = new URLSearchParams({
          key: locationIQApiKey,
          q: query,
          format: 'json',
          countrycodes: countryCode,
          addressdetails: '1',
          limit: '10',
          dedupe: '1',
        });
        apiUrl = `${BASE_URL}/autocomplete.php?${params}`;
        break;

      case 'geocode':
        if (!query) {
          return new Response(JSON.stringify({ 
            error: 'query parametresi gerekli' 
          }), {
            headers: corsHeaders,
            status: 400
          });
        }
        params = new URLSearchParams({
          key: locationIQApiKey,
          q: query,
          format: 'json',
          countrycodes: countryCode,
          addressdetails: '1',
          limit: '1',
        });
        apiUrl = `${BASE_URL}/search.php?${params}`;
        break;

      case 'reverse':
        if (lat === undefined || lon === undefined) {
          return new Response(JSON.stringify({ 
            error: 'lat ve lon parametreleri gerekli' 
          }), {
            headers: corsHeaders,
            status: 400
          });
        }
        params = new URLSearchParams({
          key: locationIQApiKey,
          lat: String(lat),
          lon: String(lon),
          format: 'json',
          addressdetails: '1',
        });
        apiUrl = `${BASE_URL}/reverse.php?${params}`;
        break;

      default:
        return new Response(JSON.stringify({ 
          error: 'Geçersiz action. Desteklenen: autocomplete, geocode, reverse' 
        }), {
          headers: corsHeaders,
          status: 400
        });
    }

    console.log(`📍 LocationIQ API çağrılıyor: ${action}`);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ LocationIQ API hatası:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: `LocationIQ API hatası: ${response.status}`,
        details: errorText
      }), {
        headers: corsHeaders,
        status: response.status
      });
    }

    const data = await response.json();
    console.log(`✅ LocationIQ ${action} başarılı, sonuç sayısı:`, Array.isArray(data) ? data.length : 1);

    return new Response(JSON.stringify(data), {
      headers: corsHeaders,
      status: 200
    });

  } catch (error: any) {
    console.error('❌ Geocode Edge Function hatası:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Bilinmeyen hata',
      timestamp: new Date().toISOString()
    }), {
      headers: corsHeaders,
      status: 500
    });
  }
});
