import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { XMLParser } from 'https://esm.sh/fast-xml-parser@5.0.9';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExchangeRate {
  id?: string;
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
    const EVDS_API_KEY = 'tVCpbbhja8'; // EVDS API anahtarı direkt olarak eklendi
    
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log('✅ Supabase client created');

    // Check if we already have today's rates
    const todayISO = new Date().toISOString().split('T')[0];
    console.log('📅 Checking for today:', todayISO);
    
    const { data: existingRates, error: checkError } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('update_date', todayISO)
      .limit(3);

    if (checkError) {
      console.error('❌ Error checking existing rates:', checkError);
      // Don't throw here, continue to try fetch fresh rates
    }

    console.log('🔍 Found existing rates:', existingRates?.length || 0);

    // If we already have today's rates and it's not a force refresh, return them
    // UNLESS effective values are missing for major currencies (USD/EUR/GBP)
    if (existingRates && existingRates.length > 2 && !forceRefresh) { // Only return if we have multiple currencies
      const needsRefresh = existingRates.some((r: any) =>
        ['USD','EUR','GBP'].includes(r.currency_code) && (r.banknote_buying == null || r.banknote_selling == null)
      );

      if (!needsRefresh) {
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

      console.log('♻️ Cached rates missing effective values for major currencies, refreshing from TCMB XML...');
    }

    console.log('🔄 Fetching fresh rates from TCMB today.xml...', forceRefresh ? '(Force refresh)' : '(No cache or missing effective)');

    // TCMB today.xml'den veri çek
    const rates: ExchangeRate[] = [];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const tcmbUrl = 'https://www.tcmb.gov.tr/kurlar/today.xml';
      const xmlResponse = await fetch(tcmbUrl, {
        signal: controller.signal,
        headers: { 'Content-Type': 'application/xml' }
      });
      clearTimeout(timeoutId);

      if (!xmlResponse.ok) {
        throw new Error(`TCMB today.xml fetch failed with status ${xmlResponse.status}`);
      }

      const xmlText = await xmlResponse.text();
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        parseTagValue: false,
        trimValues: true,
      });

      const parsed = parser.parse(xmlText);
      const currencies = parsed?.Tarih_Date?.Currency;

      const toNum = (val: any): number | null => {
        if (val === undefined || val === null) return null;
        const s = String(val).replace(',', '.').trim();
        if (s === '' || s === '-') return null;
        const n = parseFloat(s);
        return isNaN(n) ? null : n;
      };

      if (Array.isArray(currencies)) {
        for (const c of currencies) {
          const code: string | undefined = c?.['@_CurrencyCode'];
          if (!code) continue;

          const fxBuy = toNum(c?.ForexBuying);
          const fxSell = toNum(c?.ForexSelling);
          const bnBuy = toNum(c?.BanknoteBuying);
          const bnSell = toNum(c?.BanknoteSelling);

          // forex değerleri null ise banknote ile doldur, o da yoksa 0 yapma (kayıt dışı bırak)
          const computedFxBuy = fxBuy ?? bnBuy;
          const computedFxSell = fxSell ?? bnSell ?? computedFxBuy ?? null;

          if (computedFxBuy !== null || computedFxSell !== null || bnBuy !== null || bnSell !== null) {
            rates.push({
              currency_code: code,
              forex_buying: (computedFxBuy ?? 0),
              forex_selling: (computedFxSell ?? (computedFxBuy ?? 0)),
              banknote_buying: bnBuy,
              banknote_selling: bnSell,
              cross_rate: null,
              update_date: todayISO
            });
            console.log(`✅ Added ${code} from TCMB XML (fxBuy: ${computedFxBuy}, fxSell: ${computedFxSell}, bnBuy: ${bnBuy}, bnSell: ${bnSell})`);
          }
        }
      }

      console.log(`✅ Parsed ${rates.length} exchange rates from TCMB XML`);

    } catch (error) {
      console.error('❌ Error fetching/parsing TCMB XML:', error);
      throw error;
    }

    // TCMB XML zaten forex ve efektif (banknote) değerleri sağlıyor.
    console.log('ℹ️ Using rates from TCMB XML; skipping additional EVDS fetch.');

    if (rates.length === 0) {
      throw new Error('No valid exchange rates parsed from EVDS data');
    }

    // Delete today's existing rates first, then insert new ones
    await supabase
      .from('exchange_rates')
      .delete()
      .eq('update_date', todayISO);

    // Insert new rates and get the inserted data with IDs
    const { data: insertedRates, error: insertError } = await supabase
      .from('exchange_rates')
      .insert(rates)
      .select('id, currency_code, forex_buying, forex_selling, banknote_buying, banknote_selling, cross_rate, update_date');

    if (insertError) {
      console.error('❌ Error inserting rates:', insertError);
      throw new Error(`Database insert error: ${insertError.message}`);
    }

    // Log the successful update
    await supabase
      .from('exchange_rate_updates')
      .insert({
        status: 'success',
        message: `Successfully updated ${rates.length} exchange rates from TCMB XML`,
        count: rates.length,
        company_id: null // Global update
      });

    console.log('✅ Exchange rates updated successfully');

    return new Response(
      JSON.stringify({ 
        rates: insertedRates || rates,
        cached: false,
        message: `Updated ${(insertedRates || rates).length} exchange rates`
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
