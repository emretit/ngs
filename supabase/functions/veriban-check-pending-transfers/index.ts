import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VeribanSoapClient } from '../_shared/veriban-soap-helper.ts';

/**
 * Periyodik E-Arşiv Transfer Durum Kontrol Edge Function
 * 
 * Bu fonksiyon:
 * - Supabase Cron Job tarafından otomatik olarak çağrılır (her 5-15 dakikada bir)
 * - Pending/queued/processing durumundaki tüm E-Arşiv faturalarını kontrol eder
 * - Her şirket için Veriban API'sini kullanarak durum günceller
 * 
 * Cron ayarı için: Supabase Dashboard > Database > Cron Jobs
 * Schedule: Her 15 dakikada bir
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface TransferStatusResponse {
  success: boolean;
  data?: {
    operationCompleted: boolean;
    invoiceNumber?: string;
    einvoiceInvoiceState?: number;
    einvoiceInvoiceStateDescription?: string;
    errorCode?: number;
    errorMessage?: string;
    description?: string;
  };
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log('🚀 Periyodik transfer durum kontrolü başlatılıyor...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Cron job için auth gerekli değil, ama manuel çağrı için kontrol yapalım
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('X-Cron-Secret');
    
    // Cron secret kontrolü (güvenlik için)
    const expectedCronSecret = Deno.env.get('CRON_SECRET') || 'your-secret-here';
    
    if (!authHeader && (!cronSecret || cronSecret !== expectedCronSecret)) {
      console.warn('⚠️ Yetkisiz erişim denemesi');
      return new Response(JSON.stringify({
        success: false,
        error: 'Yetkisiz erişim'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Son 2 saat içinde kontrol edilmemiş veya hiç kontrol edilmemiş faturaları getir
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    const { data: pendingInvoices, error: fetchError } = await supabase
      .from('sales_invoices')
      .select(`
        id,
        company_id,
        fatura_no,
        transfer_file_unique_id,
        transfer_status,
        last_status_check_at,
        transfer_retry_count
      `)
      .in('transfer_status', ['queued', 'processing'])
      .not('transfer_file_unique_id', 'is', null)
      .or(`last_status_check_at.is.null,last_status_check_at.lt.${twoHoursAgo}`)
      .order('last_status_check_at', { ascending: true, nullsFirst: true })
      .limit(100); // Max 100 fatura

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

    if (!pendingInvoices || pendingInvoices.length === 0) {
      console.log('✅ Kontrol edilecek bekleyen fatura yok');
      return new Response(JSON.stringify({
        success: true,
        message: 'Kontrol edilecek bekleyen fatura yok',
        checked: 0,
        updated: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 ${pendingInvoices.length} fatura kontrol edilecek`);

    // Şirketlere göre grupla
    const invoicesByCompany = new Map<string, typeof pendingInvoices>();
    for (const invoice of pendingInvoices) {
      if (!invoicesByCompany.has(invoice.company_id)) {
        invoicesByCompany.set(invoice.company_id, []);
      }
      invoicesByCompany.get(invoice.company_id)!.push(invoice);
    }

    console.log(`🏢 ${invoicesByCompany.size} farklı şirket için kontrol yapılacak`);

    let totalChecked = 0;
    let totalUpdated = 0;
    const results: any[] = [];

    // Her şirket için Veriban kontrolü yap
    for (const [companyId, invoices] of invoicesByCompany) {
      console.log(`\n🏢 Şirket: ${companyId} (${invoices.length} fatura)`);

      try {
        // Şirketin Veriban auth bilgilerini getir
        const { data: veribanAuth, error: authError } = await supabase
          .from('veriban_auth')
          .select('*')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .single();

        if (authError || !veribanAuth) {
          console.warn(`⚠️ Şirket ${companyId} için Veriban auth bulunamadı`);
          continue;
        }

        // Login
        const loginResult = await VeribanSoapClient.login(
          {
            username: veribanAuth.username,
            password: veribanAuth.password,
          },
          veribanAuth.webservice_url
        );

        if (!loginResult.success || !loginResult.sessionCode) {
          console.error(`❌ Şirket ${companyId} için Veriban login başarısız`);
          continue;
        }

        const sessionCode = loginResult.sessionCode;

        try {
          // Bu şirketteki tüm faturaları kontrol et
          for (const invoice of invoices) {
            totalChecked++;

            try {
              console.log(`  🔍 ${invoice.fatura_no} (${invoice.transfer_file_unique_id})`);

              const statusResult: TransferStatusResponse = await VeribanSoapClient.getTransferStatus(
                sessionCode,
                invoice.transfer_file_unique_id,
                veribanAuth.webservice_url
              );

              if (statusResult.success && statusResult.data) {
                const stateCode = statusResult.data.einvoiceInvoiceState || 0;
                const stateDescription = statusResult.data.einvoiceInvoiceStateDescription || '';
                const errorMessage = statusResult.data.errorMessage || '';

                // Duruma göre transfer_status güncelle
                let transferStatus = invoice.transfer_status;
                if (stateCode === 5) {
                  transferStatus = 'delivered';
                } else if (stateCode === 4) {
                  transferStatus = 'failed';
                } else if (stateCode === 1 || stateCode === 3) {
                  transferStatus = 'processing';
                } else if (stateCode === 2) {
                  transferStatus = 'queued';
                }

                // Veritabanını güncelle
                const updateData: any = {
                  transfer_status: transferStatus,
                  gib_status: stateDescription,
                  gib_status_code: stateCode,
                  last_status_check_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };

                if (errorMessage) {
                  updateData.transfer_error_details = {
                    error: errorMessage,
                    timestamp: new Date().toISOString(),
                    stateCode,
                    stateDescription,
                  };
                }

                // Başarılı veya hatalı ise einvoice_status güncelle
                if (stateCode === 5) {
                  updateData.einvoice_status = 'approved';
                  updateData.einvoice_invoice_state = 5;
                  updateData.durum = 'onaylandi';
                } else if (stateCode === 4) {
                  updateData.einvoice_status = 'error';
                  updateData.einvoice_error_message = errorMessage || stateDescription;
                  updateData.durum = 'iptal';
                }

                await supabase
                  .from('sales_invoices')
                  .update(updateData)
                  .eq('id', invoice.id);

                totalUpdated++;
                console.log(`  ✅ ${transferStatus} (GİB: ${stateCode})`);

                results.push({
                  invoiceId: invoice.id,
                  invoiceNumber: invoice.fatura_no,
                  transferStatus,
                  gibStatusCode: stateCode,
                  success: true,
                });
              } else {
                console.error(`  ❌ Durum sorgusu başarısız:`, statusResult.error);
                
                // Hata detaylarını kaydet
                await supabase
                  .from('sales_invoices')
                  .update({
                    last_status_check_at: new Date().toISOString(),
                    transfer_error_details: {
                      error: statusResult.error,
                      timestamp: new Date().toISOString(),
                    },
                  })
                  .eq('id', invoice.id);
              }

              // Rate limiting - her sorgu arasında 100ms bekle
              await new Promise(resolve => setTimeout(resolve, 100));

            } catch (invoiceError: any) {
              console.error(`  ❌ Fatura kontrol hatası:`, invoiceError.message);
            }
          }
        } finally {
          // Logout
          try {
            await VeribanSoapClient.logout(sessionCode, veribanAuth.webservice_url);
          } catch (e) {
            // Ignore
          }
        }

      } catch (companyError: any) {
        console.error(`❌ Şirket ${companyId} işlem hatası:`, companyError.message);
      }
    }

    console.log(`\n✅ Periyodik kontrol tamamlandı`);
    console.log(`📊 Kontrol edilen: ${totalChecked}, Güncellenen: ${totalUpdated}`);

    return new Response(JSON.stringify({
      success: true,
      message: `${totalChecked} fatura kontrol edildi, ${totalUpdated} fatura güncellendi`,
      checked: totalChecked,
      updated: totalUpdated,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Periyodik kontrol hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
