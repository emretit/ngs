import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Otomatik Retry Edge Function
 * 
 * Bu fonksiyon:
 * - Geçici hata nedeniyle başarısız olan E-Arşiv faturalarını otomatik olarak yeniden gönderir
 * - Retry süresini dolmuş ve max retry limitine ulaşmamış faturaları işler
 * - Cron job ile periyodik olarak çalıştırılabilir
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log('🔄 Otomatik retry başlatılıyor...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth kontrolü
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('X-Cron-Secret');
    const expectedCronSecret = Deno.env.get('CRON_SECRET') || 'your-secret-here';
    
    if (!authHeader && (!cronSecret || cronSecret !== expectedCronSecret)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Yetkisiz erişim'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Retry edilebilir faturaları getir
    // 1) transfer_status = 'pending' (retry için işaretlenmiş)
    // 2) transfer_retry_count < 3
    // 3) transfer_error_details.shouldRetry = true
    // 4) transfer_error_details.retryAfter < şimdi (veya null)
    
    const now = new Date().toISOString();
    
    const { data: retryableInvoices, error: fetchError } = await supabase
      .from('sales_invoices')
      .select(`
        id,
        company_id,
        fatura_no,
        transfer_retry_count,
        transfer_error_details,
        einvoice_error_message
      `)
      .eq('transfer_status', 'pending')
      .lt('transfer_retry_count', 3)
      .not('transfer_error_details', 'is', null)
      .order('updated_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('❌ Fatura sorgusu hatası:', fetchError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Fatura sorgusu başarısız'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!retryableInvoices || retryableInvoices.length === 0) {
      console.log('✅ Retry edilecek fatura yok');
      return new Response(JSON.stringify({
        success: true,
        message: 'Retry edilecek fatura yok',
        retried: 0,
        success_count: 0,
        failed_count: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Retry süresini kontrol et ve filtrele
    const invoicesToRetry = retryableInvoices.filter(inv => {
      if (!inv.transfer_error_details?.shouldRetry) {
        return false;
      }
      
      // retryAfter varsa ve henüz gelmemişse atla
      if (inv.transfer_error_details.retryAfter) {
        const retryAfter = new Date(inv.transfer_error_details.retryAfter);
        if (retryAfter > new Date()) {
          console.log(`⏳ ${inv.fatura_no} - Retry süresi henüz gelmedi (${retryAfter.toISOString()})`);
          return false;
        }
      }
      
      return true;
    });

    console.log(`📋 ${invoicesToRetry.length} fatura retry edilecek`);

    let successCount = 0;
    let failedCount = 0;
    const results: any[] = [];

    // Her faturayı tekrar gönder
    for (const invoice of invoicesToRetry) {
      console.log(`🔄 Retry: ${invoice.fatura_no} (${invoice.transfer_retry_count + 1}. deneme)`);

      try {
        // veriban-send-earchive fonksiyonunu çağır
        const response = await fetch(
          `${supabaseUrl}/functions/v1/veriban-send-earchive`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
            },
            body: JSON.stringify({
              invoiceId: invoice.id,
              forceResend: true, // Kontrolleri atla
            })
          }
        );

        const result = await response.json();

        if (result.success) {
          successCount++;
          console.log(`  ✅ Başarılı`);
          
          results.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.fatura_no,
            success: true,
            retryCount: invoice.transfer_retry_count + 1,
          });
        } else {
          failedCount++;
          console.error(`  ❌ Başarısız:`, result.error);
          
          results.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.fatura_no,
            success: false,
            error: result.error,
            retryCount: invoice.transfer_retry_count + 1,
          });
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        failedCount++;
        console.error(`  ❌ Retry hatası:`, error.message);
        
        results.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.fatura_no,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(`\n✅ Retry işlemi tamamlandı`);
    console.log(`📊 Başarılı: ${successCount}, Başarısız: ${failedCount}`);

    return new Response(JSON.stringify({
      success: true,
      message: `${invoicesToRetry.length} fatura retry edildi`,
      retried: invoicesToRetry.length,
      success_count: successCount,
      failed_count: failedCount,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Otomatik retry hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
