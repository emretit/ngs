import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VeribanSoapClient } from '../_shared/veriban-soap-helper.ts';

/**
 * Veriban Transfer Durum Kontrol Edge Function
 * 
 * Bu fonksiyon TransferFileUniqueId kullanarak:
 * - E-Arşiv faturalarının GİB'e ulaşıp ulaşmadığını kontrol eder
 * - Durum bilgilerini veritabanında günceller
 * - Otomatik veya manuel olarak çağrılabilir
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authorization header gerekli'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Geçersiz kullanıcı token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Kullanıcı profili bulunamadı'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const { invoiceId, transferFileUniqueId, checkAll = false } = await req.json();

    if (!invoiceId && !transferFileUniqueId && !checkAll) {
      return new Response(JSON.stringify({
        success: false,
        error: 'invoiceId, transferFileUniqueId veya checkAll parametresi gerekli'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Veriban auth
    const { data: veribanAuth, error: authError } = await supabase
      .from('veriban_auth')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .single();

    if (authError || !veribanAuth) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Veriban kimlik doğrulama bilgileri bulunamadı.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Login to Veriban
    console.log('🔐 Veriban girişi yapılıyor...');
    const loginResult = await VeribanSoapClient.login(
      {
        username: veribanAuth.username,
        password: veribanAuth.password,
      },
      veribanAuth.webservice_url
    );

    if (!loginResult.success || !loginResult.sessionCode) {
      return new Response(JSON.stringify({
        success: false,
        error: loginResult.error || 'Veriban giriş başarısız'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sessionCode = loginResult.sessionCode;
    console.log('✅ Veriban login başarılı');

    try {
      let invoicesToCheck: any[] = [];

      // Kontrol edilecek faturaları belirle
      if (checkAll) {
        // Pending/queued/processing durumundaki tüm faturaları getir
        console.log('🔍 Pending durumundaki tüm faturalar kontrol ediliyor...');
        const { data: pendingInvoices } = await supabase
          .from('sales_invoices')
          .select('id, fatura_no, transfer_file_unique_id, transfer_status, last_status_check_at')
          .eq('company_id', profile.company_id)
          .in('transfer_status', ['queued', 'processing'])
          .not('transfer_file_unique_id', 'is', null)
          .order('last_status_check_at', { ascending: true, nullsFirst: true })
          .limit(50); // Aynı anda max 50 fatura kontrol et

        invoicesToCheck = pendingInvoices || [];
        console.log(`📋 ${invoicesToCheck.length} adet fatura bulundu`);
      } else if (invoiceId) {
        // Tek fatura getir
        const { data: invoice } = await supabase
          .from('sales_invoices')
          .select('id, fatura_no, transfer_file_unique_id, transfer_status')
          .eq('id', invoiceId)
          .eq('company_id', profile.company_id)
          .single();

        if (!invoice) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Fatura bulunamadı'
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!invoice.transfer_file_unique_id) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Bu fatura henüz gönderilmemiş (transfer_file_unique_id yok)'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        invoicesToCheck = [invoice];
      } else if (transferFileUniqueId) {
        // TransferFileUniqueId ile fatura bul
        const { data: invoice } = await supabase
          .from('sales_invoices')
          .select('id, fatura_no, transfer_file_unique_id, transfer_status')
          .eq('transfer_file_unique_id', transferFileUniqueId)
          .eq('company_id', profile.company_id)
          .single();

        if (!invoice) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Bu transfer ID ile fatura bulunamadı'
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        invoicesToCheck = [invoice];
      }

      const results = [];

      // Her fatura için durum kontrolü yap
      for (const invoice of invoicesToCheck) {
        console.log(`🔍 Fatura kontrol ediliyor: ${invoice.fatura_no} (Transfer ID: ${invoice.transfer_file_unique_id})`);

        try {
          const statusResult: TransferStatusResponse = await VeribanSoapClient.getTransferStatus(
            sessionCode,
            invoice.transfer_file_unique_id,
            veribanAuth.webservice_url
          );

          console.log(`📋 Durum yanıtı:`, JSON.stringify(statusResult, null, 2));

          if (statusResult.success && statusResult.data) {
            const stateCode = statusResult.data.einvoiceInvoiceState || 0;
            const stateDescription = statusResult.data.einvoiceInvoiceStateDescription || '';
            const errorMessage = statusResult.data.errorMessage || '';

            // Duruma göre transfer_status güncelle
            let transferStatus = invoice.transfer_status;
            if (stateCode === 5) {
              transferStatus = 'delivered'; // GİB'e başarıyla ulaştı
            } else if (stateCode === 4) {
              transferStatus = 'failed'; // Hatalı
            } else if (stateCode === 1 || stateCode === 3) {
              transferStatus = 'processing'; // İşleniyor
            } else if (stateCode === 2) {
              transferStatus = 'queued'; // Kuyrukta bekliyor
            }

            // Veritabanını güncelle
            const updateData: any = {
              transfer_status: transferStatus,
              gib_status: stateDescription,
              gib_status_code: stateCode,
              last_status_check_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Hata varsa kaydet
            if (errorMessage) {
              updateData.transfer_error_details = {
                error: errorMessage,
                timestamp: new Date().toISOString(),
                stateCode,
                stateDescription,
              };
            }

            // Başarılı ise einvoice_status'u güncelle
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

            console.log(`✅ Fatura güncellendi: ${invoice.fatura_no} - ${transferStatus} (GİB: ${stateCode})`);

            results.push({
              invoiceId: invoice.id,
              invoiceNumber: invoice.fatura_no,
              transferFileUniqueId: invoice.transfer_file_unique_id,
              transferStatus,
              gibStatus: stateDescription,
              gibStatusCode: stateCode,
              success: true,
            });
          } else {
            console.error(`❌ Durum sorgulaması başarısız: ${invoice.fatura_no}`, statusResult.error);
            results.push({
              invoiceId: invoice.id,
              invoiceNumber: invoice.fatura_no,
              transferFileUniqueId: invoice.transfer_file_unique_id,
              success: false,
              error: statusResult.error,
            });
          }
        } catch (invoiceError: any) {
          console.error(`❌ Fatura kontrol hatası: ${invoice.fatura_no}`, invoiceError);
          results.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.fatura_no,
            transferFileUniqueId: invoice.transfer_file_unique_id,
            success: false,
            error: invoiceError.message,
          });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: `${results.length} fatura kontrol edildi`,
        results,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } finally {
      // Logout
      try {
        await VeribanSoapClient.logout(sessionCode, veribanAuth.webservice_url);
        console.log('✅ Veriban oturumu kapatıldı');
      } catch (logoutError: any) {
        console.error('⚠️ Logout hatası:', logoutError.message);
      }
    }

  } catch (error: any) {
    console.error('❌ Veriban transfer durum kontrol hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
