/**
 * check-invoice-in-veriban Edge Function
 * 
 * Manuel olarak girilen fatura numarasının Veriban'da olup olmadığını kontrol eder.
 * Varsa durumunu döndürür ve sales_invoices ile ilişkilendirir.
 * 
 * Kullanım Senaryoları:
 * 1. Elle fatura eklerken, numara Veriban'da var mı kontrol et
 * 2. Mevcut faturayı Veriban ile senkronize et
 * 3. Durum güncellemesi yap
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VeribanSoapClient, getValidSessionCode } from '../_shared/veriban-soap-helper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user from Authorization header
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Kullanıcı profili bulunamadı'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { 
      invoiceNumber,  // GİB formatı fatura numarası (örn: FAT2026000000001)
      salesInvoiceId  // Opsiyonel: İlişkilendirmek için sales_invoices ID
    } = await req.json();

    if (!invoiceNumber) {
      return new Response(JSON.stringify({
        success: false,
        error: 'invoiceNumber parametresi zorunludur'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 Veriban\'da fatura numarası kontrolü başlatılıyor...');
    console.log('📄 Fatura Numarası:', invoiceNumber);
    console.log('🆔 Sales Invoice ID:', salesInvoiceId || '(yok)');

    // Get Veriban auth settings
    const { data: veribanAuth, error: authError } = await supabase
      .from('veriban_auth')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .single();

    if (authError || !veribanAuth) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Veriban kimlik doğrulama bilgileri bulunamadı'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get valid session code
    console.log('🔑 Getting valid session code...');
    const sessionResult = await getValidSessionCode(supabase, veribanAuth);

    if (!sessionResult.success || !sessionResult.sessionCode) {
      console.error('❌ Session code alınamadı:', sessionResult.error);
      return new Response(JSON.stringify({
        success: false,
        error: sessionResult.error || 'Session code alınamadı'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sessionCode = sessionResult.sessionCode;
    console.log('✅ Session code alındı');

    try {
      // 1. Önce outgoing_invoices cache'inde ara
      console.log('📦 Cache\'de aranıyor...');
      const { data: cachedInvoice, error: cacheError } = await supabase
        .from('outgoing_invoices')
        .select('*')
        .eq('invoice_number', invoiceNumber)
        .eq('company_id', profile.company_id)
        .maybeSingle();

      if (cacheError) {
        console.warn('⚠️ Cache sorgusu hatası:', cacheError.message);
      }

      let invoiceData = null;
      let fromCache = false;

      if (cachedInvoice) {
        console.log('✅ Cache\'de bulundu:', cachedInvoice.invoice_number);
        invoiceData = cachedInvoice;
        fromCache = true;
      } else {
        console.log('ℹ️ Cache\'de bulunamadı, Veriban API\'sinden sorgulanıyor...');
        
        // 2. Veriban API'sinden sorgula
        const statusResult = await VeribanSoapClient.getSalesInvoiceStatusWithInvoiceNumber(
          sessionCode,
          invoiceNumber,
          veribanAuth.webservice_url
        );

        if (!statusResult.success) {
          console.log('❌ Veriban\'da fatura bulunamadı');
          return new Response(JSON.stringify({
            success: false,
            found: false,
            error: 'Bu fatura numarası Veriban sisteminde bulunamadı',
            invoiceNumber: invoiceNumber
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('✅ Veriban\'da bulundu:', statusResult.data?.invoiceNumber);
        invoiceData = statusResult.data;
        fromCache = false;
      }

      // 3. Eğer salesInvoiceId verilmişse, ilişkilendir
      if (salesInvoiceId && invoiceData) {
        console.log('🔗 sales_invoices ile ilişkilendiriliyor...');
        
        // outgoing_invoices'da var mı kontrol et
        let outgoingInvoiceId = cachedInvoice?.id;
        
        if (!outgoingInvoiceId && invoiceData.invoiceUUID) {
          // Cache'de yoksa yeni kayıt oluştur
          const { data: newOutgoingInvoice, error: insertError } = await supabase
            .from('outgoing_invoices')
            .insert({
              company_id: profile.company_id,
              ettn: invoiceData.invoiceUUID,
              invoice_number: invoiceNumber,
              invoice_date: invoiceData.invoiceDate || new Date().toISOString().split('T')[0],
              customer_name: invoiceData.customerName || 'Bilinmiyor',
              customer_tax_number: invoiceData.customerTaxNumber || '',
              status: mapStateCodeToStatus(invoiceData.stateCode),
              elogo_status: invoiceData.stateCode !== null && invoiceData.stateCode !== undefined ? invoiceData.stateCode : 0,
              elogo_code: invoiceData.answerStateCode || 0,
              elogo_description: invoiceData.stateDescription || '',
              payable_amount: 0,
              tax_exclusive_amount: 0,
              tax_total_amount: 0,
              currency: 'TRY'
            })
            .select('id')
            .single();

          if (insertError) {
            console.error('❌ outgoing_invoices\'a kayıt hatası:', insertError.message);
          } else {
            outgoingInvoiceId = newOutgoingInvoice?.id;
            console.log('✅ outgoing_invoices\'a kaydedildi');
          }
        }

        // sales_invoices ile ilişkilendir
        if (outgoingInvoiceId) {
          // Önce mevcut faturayı çek (elogo_status'u korumak için)
          const { data: existingInvoice } = await supabase
            .from('sales_invoices')
            .select('elogo_status, einvoice_invoice_state')
            .eq('id', salesInvoiceId)
            .eq('company_id', profile.company_id)
            .single();

          // stateCode değeri varsa ve geçerliyse güncelle, yoksa mevcut değeri koru
          const newStateCode = (invoiceData.stateCode !== null && invoiceData.stateCode !== undefined && invoiceData.stateCode > 0)
            ? invoiceData.stateCode
            : (existingInvoice?.elogo_status || existingInvoice?.einvoice_invoice_state || 0);

          const { error: linkError } = await supabase
            .from('sales_invoices')
            .update({
              outgoing_invoice_id: outgoingInvoiceId,
              fatura_no: invoiceNumber,  // Fatura numarasını da güncelle
              einvoice_status: mapStateCodeToStatus(newStateCode),
              einvoice_invoice_state: newStateCode,
              elogo_status: newStateCode, // elogo_status'u da güncelle
              updated_at: new Date().toISOString()
            })
            .eq('id', salesInvoiceId)
            .eq('company_id', profile.company_id);

          if (linkError) {
            console.error('❌ İlişkilendirme hatası:', linkError.message);
          } else {
            console.log('✅ sales_invoices ilişkilendirildi ve güncellendi (stateCode:', newStateCode, ')');
          }
        }
      }

      // 4. Response döndür
      return new Response(JSON.stringify({
        success: true,
        found: true,
        fromCache: fromCache,
        invoiceNumber: invoiceNumber,
        status: {
          stateCode: invoiceData.elogo_status || invoiceData.stateCode || 0,
          stateName: getStateName(invoiceData.elogo_status || invoiceData.stateCode || 0),
          stateDescription: invoiceData.elogo_description || invoiceData.stateDescription || '',
          answerStateCode: invoiceData.elogo_code || invoiceData.answerStateCode || 0,
          userFriendlyStatus: getUserFriendlyStatus(invoiceData.elogo_status || invoiceData.stateCode || 0)
        },
        ettn: invoiceData.ettn || invoiceData.invoiceUUID || null,
        linked: !!salesInvoiceId,
        message: fromCache 
          ? 'Fatura cache\'de bulundu ve ilişkilendirildi'
          : 'Fatura Veriban\'da bulundu ve ilişkilendirildi'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (apiError: any) {
      console.error('❌ API hatası:', apiError);
      return new Response(JSON.stringify({
        success: false,
        error: apiError.message || 'API çağrısı başarısız'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('❌ Check invoice function hatası:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Map Veriban state code to status string
 */
function mapStateCodeToStatus(stateCode: number): string {
  switch (stateCode) {
    case 0:
    case 1:
      return 'draft';
    case 2:
      return 'sending';
    case 3:
      return 'sent';
    case 4:
      return 'error';
    case 5:
      return 'delivered';
    case 6:
      return 'rejected';
    case 7:
      return 'accepted';
    default:
      return 'draft';
  }
}

/**
 * Get state name from state code
 */
function getStateName(stateCode: number): string {
  switch (stateCode) {
    case 0: return 'Beklemede';
    case 1: return 'Taslak';
    case 2: return 'İmza Bekliyor';
    case 3: return 'Gönderildi';
    case 4: return 'Hatalı';
    case 5: return 'Başarılı';
    case 6: return 'Reddedildi';
    case 7: return 'Kabul Edildi';
    default: return 'Bilinmiyor';
  }
}

/**
 * Get user-friendly status from state code
 */
function getUserFriendlyStatus(stateCode: number): string {
  switch (stateCode) {
    case 0: return 'Beklemede';
    case 1: return 'Taslak veri';
    case 2: return 'Gönderilmeyi bekliyor, imza bekliyor';
    case 3: return 'Gönderim listesinde, işlem yapılıyor';
    case 4: return 'Başarısız - Hata oluştu';
    case 5: return 'Başarılı - Fatura alıcıya ulaştı';
    case 6: return 'Reddedildi';
    case 7: return 'Kabul Edildi';
    default: return 'Bilinmeyen durum';
  }
}

