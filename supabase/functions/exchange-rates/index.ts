import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExchangeRate {
  currency_code: string;
  forex_buying: number;
  forex_selling: number;
  banknote_buying: number | null;
  banknote_selling: number | null;
  cross_rate: number | null;
  update_date: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Exchange rates function started');

    // Parse request body to check for forceRefresh parameter
    const body = await req.json().catch(() => ({}));
    const forceRefresh = body.forceRefresh || false;
    console.log('🔄 Force refresh requested:', forceRefresh);

    const SUPABASE_URL = 'https://vwhwufnckpqirxptwncw.supabase.co';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log('✅ Supabase client created');

    // Check if we already have today's rates
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Checking for today:', today);
    
    const { data: existingRates, error: checkError } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('update_date', today)
      .limit(3);

    if (checkError) {
      console.error('❌ Error checking existing rates:', checkError);
      // Don't throw here, continue to try fetch fresh rates
    }

    console.log('🔍 Found existing rates:', existingRates?.length || 0);

    // If we already have today's rates and it's not a force refresh, return them
    if (existingRates && existingRates.length > 2 && !forceRefresh) { // Only return if we have multiple currencies
      console.log('✅ Today\'s rates already exist, returning cached data');
      
      return new Response(
        JSON.stringify({ 
          rates: existingRates,
          cached: true,
          message: 'Using cached rates for today'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🔄 Fetching fresh rates from TCMB API...', forceRefresh ? '(Force refresh)' : '(No cache found)');

    // Fetch rates from TCMB API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const tcmbResponse = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!tcmbResponse.ok) {
      throw new Error(`TCMB API error: ${tcmbResponse.status}`);
    }

    const xmlData = await tcmbResponse.text();
    console.log('✅ TCMB API response received, length:', xmlData.length);

    // Parse XML data using regex (simple approach for TCMB XML)
    const rates: ExchangeRate[] = [];
    
    // Helper: safely parse numbers like "32,7156" or "-"
    const parseNumber = (val: string | null): number | null => {
      if (!val) return null;
      const cleaned = val.replace(/,/g, '.').trim();
      if (cleaned === '-' || cleaned === '') return null;
      const num = parseFloat(cleaned);
      return Number.isFinite(num) ? num : null;
    };
    
    // Extract currency data using regex - Updated to match actual TCMB XML format
    const currencyRegex = /<currency[^>]*currencycode="([^"]+)"[^>]*>([\s\S]*?)<\/currency>/gi;
    let match;
    
    while ((match = currencyRegex.exec(xmlData)) !== null) {
      const [, code, currencyData] = match;
      
      // Extract values using regex with case-insensitive matching
      const getXmlValue = (tag: string, data: string) => {
        const regex = new RegExp(`<${tag}>([^<]+)<\/${tag}>`, 'i');
        const m = data.match(regex);
        return m ? m[1] : null;
      };
      
      const forexBuyingN = parseNumber(getXmlValue('forexbuying', currencyData));
      const forexSellingN = parseNumber(getXmlValue('forexselling', currencyData));
      const banknoteBuyingN = parseNumber(getXmlValue('banknotebuying', currencyData));
      const banknoteSellingN = parseNumber(getXmlValue('banknoteselling', currencyData));
      const crossRateN = parseNumber(getXmlValue('crossrateother', currencyData));

      if (code && forexBuyingN !== null && forexSellingN !== null) {
        rates.push({
          currency_code: code,
          forex_buying: forexBuyingN,
          forex_selling: forexSellingN,
          banknote_buying: banknoteBuyingN,
          banknote_selling: banknoteSellingN,
          cross_rate: crossRateN,
          update_date: today
        });
      }
    }

    console.log(`✅ Parsed ${rates.length} exchange rates from TCMB`);

    if (rates.length === 0) {
      throw new Error('No valid exchange rates parsed from TCMB data');
    }

    // Delete today's existing rates first, then insert new ones
    await supabase
      .from('exchange_rates')
      .delete()
      .eq('update_date', today);

    // Insert new rates
    const { error: insertError } = await supabase
      .from('exchange_rates')
      .insert(rates);

    if (insertError) {
      console.error('❌ Error inserting rates:', insertError);
      throw new Error(`Database insert error: ${insertError.message}`);
    }

    // Log the successful update
    await supabase
      .from('exchange_rate_updates')
      .insert({
        status: 'success',
        message: `Successfully updated ${rates.length} exchange rates from TCMB`,
        count: rates.length,
        company_id: null // Global update
      });

    console.log('✅ Exchange rates updated successfully');

    return new Response(
      JSON.stringify({ 
        rates: rates,
        cached: false,
        message: `Updated ${rates.length} exchange rates`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Exchange rates function error:', error);
    
    // Log the error
    try {
      const SUPABASE_URL = 'https://vwhwufnckpqirxptwncw.supabase.co';
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase
          .from('exchange_rate_updates')
          .insert({
            status: 'error',
            message: `Error: ${error.message}`,
            count: 0,
            company_id: null
          });
      }
    } catch (logError) {
      console.error('❌ Error logging error:', logError);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        rates: [],
        cached: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
