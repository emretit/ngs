import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { XMLParser } from 'https://esm.sh/fast-xml-parser@5.0.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExchangeRate {
  id: string;
  currency_code: string;
  forex_buying: number;
  forex_selling: number;
  banknote_buying: number;
  banknote_selling: number;
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
    const { data: existingRates, error: checkError } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('update_date', today)
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking existing rates:', checkError);
      throw new Error(`Database error: ${checkError.message}`);
    }

    // If we already have today's rates, return them
    if (existingRates && existingRates.length > 0) {
      console.log('✅ Today\'s rates already exist, returning cached data');
      
      // Log the update check
      await supabase
        .from('exchange_rate_updates')
        .insert({
          status: 'success',
          message: `Today's rates already exist (${existingRates.length} currencies)`,
          count: existingRates.length,
          company_id: null // Global update
        });

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

    console.log('🔄 Fetching fresh rates from TCMB API...');

    // Fetch rates from TCMB API
    const tcmbResponse = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml');
    
    if (!tcmbResponse.ok) {
      throw new Error(`TCMB API error: ${tcmbResponse.status}`);
    }

    const xmlData = await tcmbResponse.text();
    console.log('✅ TCMB API response received');

    // Parse XML data using fast-xml-parser
    const rates: ExchangeRate[] = [];
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text"
    });
    
    const jsonObj = parser.parse(xmlData);
    const currencies = jsonObj.Tarih_Date?.Currency || [];
    
    // Handle both single currency object and array of currencies
    const currencyArray = Array.isArray(currencies) ? currencies : [currencies];

    for (const currency of currencyArray) {
      const code = currency['@_CurrencyCode'];
      const forexBuying = currency.ForexBuying;
      const forexSelling = currency.ForexSelling;
      const banknoteBuying = currency.BanknoteBuying;
      const banknoteSelling = currency.BanknoteSelling;
      const crossRate = currency.CrossRateOther;

      if (code && forexBuying && forexSelling) {
        rates.push({
          id: `tcmb-${code}-${today}`,
          currency_code: code,
          forex_buying: parseFloat(forexBuying),
          forex_selling: parseFloat(forexSelling),
          banknote_buying: banknoteBuying ? parseFloat(banknoteBuying) : 0,
          banknote_selling: banknoteSelling ? parseFloat(banknoteSelling) : 0,
          cross_rate: crossRate ? parseFloat(crossRate) : null,
          update_date: today
        });
      }
    }

    console.log(`✅ Parsed ${rates.length} exchange rates`);

    // Insert rates into database
    const { error: insertError } = await supabase
      .from('exchange_rates')
      .upsert(rates, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

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
