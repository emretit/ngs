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

    console.log('🔄 Fetching fresh rates from EVDS API...', forceRefresh ? '(Force refresh)' : '(No cache found)');

    // EVDS API seri kodları - ana döviz kurları
    const currencySeries = {
      'USD': 'TP.DK.USD.A.YTL',  // USD Alış
      'EUR': 'TP.DK.EUR.A.YTL',  // EUR Alış
      'GBP': 'TP.DK.GBP.A.YTL',  // GBP Alış
      'JPY': 'TP.DK.JPY.A.YTL',  // JPY Alış
      'CHF': 'TP.DK.CHF.A.YTL',  // CHF Alış
      'CAD': 'TP.DK.CAD.A.YTL',  // CAD Alış
      'AUD': 'TP.DK.AUD.A.YTL',  // AUD Alış
      'SEK': 'TP.DK.SEK.A.YTL',  // SEK Alış
      'NOK': 'TP.DK.NOK.A.YTL',  // NOK Alış
      'DKK': 'TP.DK.DKK.A.YTL',  // DKK Alış
      'RUB': 'TP.DK.RUB.A.YTL',  // RUB Alış
      'CNY': 'TP.DK.CNY.A.YTL',  // CNY Alış
      'SAR': 'TP.DK.SAR.A.YTL',  // SAR Alış
      'AED': 'TP.DK.AED.A.YTL',  // AED Alış
      'KWD': 'TP.DK.KWD.A.YTL',  // KWD Alış
      'BHD': 'TP.DK.BHD.A.YTL',  // BHD Alış
      'QAR': 'TP.DK.QAR.A.YTL',  // QAR Alış
      'OMR': 'TP.DK.OMR.A.YTL',  // OMR Alış
      'JOD': 'TP.DK.JOD.A.YTL',  // JOD Alış
      'ILS': 'TP.DK.ILS.A.YTL',  // ILS Alış
      'IRR': 'TP.DK.IRR.A.YTL',  // IRR Alış
      'INR': 'TP.DK.INR.A.YTL',  // INR Alış
      'PKR': 'TP.DK.PKR.A.YTL',  // PKR Alış
      'BGN': 'TP.DK.BGN.A.YTL',  // BGN Alış
      'RON': 'TP.DK.RON.A.YTL',  // RON Alış
      'UAH': 'TP.DK.UAH.A.YTL',  // UAH Alış
      'PLN': 'TP.DK.PLN.A.YTL',  // PLN Alış
      'CZK': 'TP.DK.CZK.A.YTL',  // CZK Alış
      'HUF': 'TP.DK.HUF.A.YTL',  // HUF Alış
      'ZAR': 'TP.DK.ZAR.A.YTL',  // ZAR Alış
      'BRL': 'TP.DK.BRL.A.YTL',  // BRL Alış
      'MXN': 'TP.DK.MXN.A.YTL',  // MXN Alış
      'KRW': 'TP.DK.KRW.A.YTL',  // KRW Alış
      'SGD': 'TP.DK.SGD.A.YTL',  // SGD Alış
      'HKD': 'TP.DK.HKD.A.YTL',  // HKD Alış
      'NZD': 'TP.DK.NZD.A.YTL',  // NZD Alış
      'MYR': 'TP.DK.MYR.A.YTL',  // MYR Alış
      'THB': 'TP.DK.THB.A.YTL',  // THB Alış
      'PHP': 'TP.DK.PHP.A.YTL',  // PHP Alış
      'IDR': 'TP.DK.IDR.A.YTL',  // IDR Alış
      'VND': 'TP.DK.VND.A.YTL',  // VND Alış
      'TRY': 'TP.DK.TRY.A.YTL'   // TRY Alış
    };

    // EVDS API seri kodları - efektif kurlar (doğru format)
    const effectiveCurrencySeries = {
      'USD': { buying: 'TP.DK.USD.E.A', selling: 'TP.DK.USD.E.S' },  // USD Efektif
      'EUR': { buying: 'TP.DK.EUR.E.A', selling: 'TP.DK.EUR.E.S' },  // EUR Efektif
      'GBP': { buying: 'TP.DK.GBP.E.A', selling: 'TP.DK.GBP.E.S' },  // GBP Efektif
      'JPY': { buying: 'TP.DK.JPY.E.A', selling: 'TP.DK.JPY.E.S' },  // JPY Efektif
      'CHF': { buying: 'TP.DK.CHF.E.A', selling: 'TP.DK.CHF.E.S' },  // CHF Efektif
      'CAD': { buying: 'TP.DK.CAD.E.A', selling: 'TP.DK.CAD.E.S' },  // CAD Efektif
      'AUD': { buying: 'TP.DK.AUD.E.A', selling: 'TP.DK.AUD.E.S' },  // AUD Efektif
      'SEK': { buying: 'TP.DK.SEK.E.A', selling: 'TP.DK.SEK.E.S' },  // SEK Efektif
      'NOK': { buying: 'TP.DK.NOK.E.A', selling: 'TP.DK.NOK.E.S' },  // NOK Efektif
      'DKK': { buying: 'TP.DK.DKK.E.A', selling: 'TP.DK.DKK.E.S' },  // DKK Efektif
      'RUB': { buying: 'TP.DK.RUB.E.A', selling: 'TP.DK.RUB.E.S' },  // RUB Efektif
      'CNY': { buying: 'TP.DK.CNY.E.A', selling: 'TP.DK.CNY.E.S' },  // CNY Efektif
      'SAR': { buying: 'TP.DK.SAR.E.A', selling: 'TP.DK.SAR.E.S' },  // SAR Efektif
      'AED': { buying: 'TP.DK.AED.E.A', selling: 'TP.DK.AED.E.S' },  // AED Efektif
      'KWD': { buying: 'TP.DK.KWD.E.A', selling: 'TP.DK.KWD.E.S' },  // KWD Efektif
      'BHD': { buying: 'TP.DK.BHD.E.A', selling: 'TP.DK.BHD.E.S' },  // BHD Efektif
      'QAR': { buying: 'TP.DK.QAR.E.A', selling: 'TP.DK.QAR.E.S' },  // QAR Efektif
      'OMR': { buying: 'TP.DK.OMR.E.A', selling: 'TP.DK.OMR.E.S' },  // OMR Efektif
      'JOD': { buying: 'TP.DK.JOD.E.A', selling: 'TP.DK.JOD.E.S' },  // JOD Efektif
      'ILS': { buying: 'TP.DK.ILS.E.A', selling: 'TP.DK.ILS.E.S' },  // ILS Efektif
      'IRR': { buying: 'TP.DK.IRR.E.A', selling: 'TP.DK.IRR.E.S' },  // IRR Efektif
      'INR': { buying: 'TP.DK.INR.E.A', selling: 'TP.DK.INR.E.S' },  // INR Efektif
      'PKR': { buying: 'TP.DK.PKR.E.A', selling: 'TP.DK.PKR.E.S' },  // PKR Efektif
      'BGN': { buying: 'TP.DK.BGN.E.A', selling: 'TP.DK.BGN.E.S' },  // BGN Efektif
      'RON': { buying: 'TP.DK.RON.E.A', selling: 'TP.DK.RON.E.S' },  // RON Efektif
      'UAH': { buying: 'TP.DK.UAH.E.A', selling: 'TP.DK.UAH.E.S' },  // UAH Efektif
      'PLN': { buying: 'TP.DK.PLN.E.A', selling: 'TP.DK.PLN.E.S' },  // PLN Efektif
      'CZK': { buying: 'TP.DK.CZK.E.A', selling: 'TP.DK.CZK.E.S' },  // CZK Efektif
      'HUF': { buying: 'TP.DK.HUF.E.A', selling: 'TP.DK.HUF.E.S' },  // HUF Efektif
      'ZAR': { buying: 'TP.DK.ZAR.E.A', selling: 'TP.DK.ZAR.E.S' },  // ZAR Efektif
      'BRL': { buying: 'TP.DK.BRL.E.A', selling: 'TP.DK.BRL.E.S' },  // BRL Efektif
      'MXN': { buying: 'TP.DK.MXN.E.A', selling: 'TP.DK.MXN.E.S' },  // MXN Efektif
      'KRW': { buying: 'TP.DK.KRW.E.A', selling: 'TP.DK.KRW.E.S' },  // KRW Efektif
      'SGD': { buying: 'TP.DK.SGD.E.A', selling: 'TP.DK.SGD.E.S' },  // SGD Efektif
      'HKD': { buying: 'TP.DK.HKD.E.A', selling: 'TP.DK.HKD.E.S' },  // HKD Efektif
      'NZD': { buying: 'TP.DK.NZD.E.A', selling: 'TP.DK.NZD.E.S' },  // NZD Efektif
      'MYR': { buying: 'TP.DK.MYR.E.A', selling: 'TP.DK.MYR.E.S' },  // MYR Efektif
      'THB': { buying: 'TP.DK.THB.E.A', selling: 'TP.DK.THB.E.S' },  // THB Efektif
      'PHP': { buying: 'TP.DK.PHP.E.A', selling: 'TP.DK.PHP.E.S' },  // PHP Efektif
      'IDR': { buying: 'TP.DK.IDR.E.A', selling: 'TP.DK.IDR.E.S' },  // IDR Efektif
      'VND': { buying: 'TP.DK.VND.E.A', selling: 'TP.DK.VND.E.S' },  // VND Efektif
      'TRY': { buying: 'TP.DK.TRY.E.A', selling: 'TP.DK.TRY.E.S' }   // TRY Efektif
    };

    // Bugünün tarihini formatla (DD-MM-YYYY) - EVDS API formatı
    const todayDate = new Date();
    const day = todayDate.getDate().toString().padStart(2, '0');
    const month = (todayDate.getMonth() + 1).toString().padStart(2, '0');
    const year = todayDate.getFullYear();
    const todayFormatted = `${day}-${month}-${year}`;
    
    console.log('📅 EVDS API tarih formatı:', todayFormatted);

    // EVDS API'den veri çek
    const rates: ExchangeRate[] = [];
    
    for (const [currency, seriesCode] of Object.entries(currencySeries)) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const evdsUrl = `https://evds2.tcmb.gov.tr/service/evds/series=${seriesCode}&startDate=${todayFormatted}&endDate=${todayFormatted}&type=json&aggregationTypes=avg&frequency=1`;
        
        const evdsResponse = await fetch(evdsUrl, {
          signal: controller.signal,
          headers: {
            'key': EVDS_API_KEY,
            'Content-Type': 'application/json'
          }
        });
        clearTimeout(timeoutId);
        
        if (!evdsResponse.ok) {
          console.warn(`⚠️ EVDS API error for ${currency}: ${evdsResponse.status}`);
          continue;
        }

        const evdsData = await evdsResponse.json();
        console.log(`✅ EVDS API response received for ${currency}:`, evdsData);

        // EVDS API'den gelen veriyi işle
        if (evdsData && evdsData.items && evdsData.items.length > 0) {
          const item = evdsData.items[0];
          // EVDS API field name'i underscore ile döndürüyor: TP_DK_USD_A_YTL
          const fieldName = seriesCode.replace(/\./g, '_');
          const rateValue = parseFloat(item[fieldName]);
          
          console.log(`🔍 ${currency} - Field: ${fieldName}, Value: ${item[fieldName]}, Parsed: ${rateValue}`);
          
          if (!isNaN(rateValue) && rateValue > 0) {
            rates.push({
              currency_code: currency,
              forex_buying: rateValue,
              forex_selling: rateValue, // EVDS'de sadece alış kuru var, satış kuru aynı
              banknote_buying: null, // Şimdilik null, sonra efektif kurları çekeceğiz
              banknote_selling: null, // Şimdilik null, sonra efektif kurları çekeceğiz
              cross_rate: null,
              update_date: todayISO
            });
            console.log(`✅ Added ${currency} rate: ${rateValue}`);
          } else {
            console.log(`⚠️ ${currency} rate is null or invalid: ${item[fieldName]}`);
          }
        } else {
          console.log(`⚠️ No data received for ${currency}`);
        }
      } catch (error) {
        console.warn(`⚠️ Error fetching ${currency} rate:`, error);
        continue;
      }
    }

    console.log(`✅ Parsed ${rates.length} exchange rates from EVDS`);

    // Şimdi efektif kurları çek
    console.log('🔄 Fetching effective rates from EVDS API...');
    
    for (let i = 0; i < rates.length; i++) {
      const rate = rates[i];
      const currency = rate.currency_code;
      
      // Bu para birimi için efektif kurlar var mı kontrol et
      if (effectiveCurrencySeries[currency]) {
        try {
          const { buying: buyingSeries, selling: sellingSeries } = effectiveCurrencySeries[currency];
          
          // Efektif alış kuru
          const buyingController = new AbortController();
          const buyingTimeoutId = setTimeout(() => buyingController.abort(), 10000);
          
          const buyingUrl = `https://evds2.tcmb.gov.tr/service/evds/series=${buyingSeries}&startDate=${todayFormatted}&endDate=${todayFormatted}&type=json&aggregationTypes=avg&frequency=1`;
          
          const buyingResponse = await fetch(buyingUrl, {
            signal: buyingController.signal,
            headers: {
              'key': EVDS_API_KEY,
              'Content-Type': 'application/json'
            }
          });
          clearTimeout(buyingTimeoutId);
          
          if (buyingResponse.ok) {
            const buyingData = await buyingResponse.json();
            if (buyingData && buyingData.items && buyingData.items.length > 0) {
              const item = buyingData.items[0];
              const fieldName = buyingSeries.replace(/\./g, '_');
              const buyingValue = parseFloat(item[fieldName]);
              
              if (!isNaN(buyingValue) && buyingValue > 0) {
                rates[i].banknote_buying = buyingValue;
                console.log(`✅ Added ${currency} effective buying rate: ${buyingValue}`);
              }
            }
          }
          
          // Efektif satış kuru
          const sellingController = new AbortController();
          const sellingTimeoutId = setTimeout(() => sellingController.abort(), 10000);
          
          const sellingUrl = `https://evds2.tcmb.gov.tr/service/evds/series=${sellingSeries}&startDate=${todayFormatted}&endDate=${todayFormatted}&type=json&aggregationTypes=avg&frequency=1`;
          
          const sellingResponse = await fetch(sellingUrl, {
            signal: sellingController.signal,
            headers: {
              'key': EVDS_API_KEY,
              'Content-Type': 'application/json'
            }
          });
          clearTimeout(sellingTimeoutId);
          
          if (sellingResponse.ok) {
            const sellingData = await sellingResponse.json();
            if (sellingData && sellingData.items && sellingData.items.length > 0) {
              const item = sellingData.items[0];
              const fieldName = sellingSeries.replace(/\./g, '_');
              const sellingValue = parseFloat(item[fieldName]);
              
              if (!isNaN(sellingValue) && sellingValue > 0) {
                rates[i].banknote_selling = sellingValue;
                console.log(`✅ Added ${currency} effective selling rate: ${sellingValue}`);
              }
            }
          }
          
        } catch (error) {
          console.warn(`⚠️ Error fetching effective rates for ${currency}:`, error);
          // Devam et, sadece bu para birimini atla
        }
      }
    }

    console.log(`✅ Updated effective rates for currencies`);

    if (rates.length === 0) {
      throw new Error('No valid exchange rates parsed from EVDS data');
    }

    // Delete today's existing rates first, then insert new ones
    await supabase
      .from('exchange_rates')
      .delete()
      .eq('update_date', todayISO);

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
        message: `Successfully updated ${rates.length} exchange rates from EVDS`,
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
