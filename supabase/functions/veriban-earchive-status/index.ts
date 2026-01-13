import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VeribanSoapClient, getValidSessionCode } from '../_shared/veriban-soap-helper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * E-Arşiv Fatura Durum Sorgulama Edge Function
 * 
 * Bölüm 9) FATURA_SORGULAMA_TEST(): Fatura numarasıyla durum sorgu
 * - GetSalesInvoiceStatusWithInvoiceNumber(sessionCode, invoiceNumber)
 * 
 * Dönen EArchiveInvoiceQueryResult:
 * - StateCode/Name/Description (genel durum)
 * - GIBReportStateCode/Name (GİB rapor tarafı)
 * - MailStateCode/Name (mail gönderim durumu)
 * 
 * E-Arşiv özel alanlar:
 * - InvoiceProfile: "EARSIVFATURA" (E-Arşiv için)
 * - GIBReportStateCode: GİB'e rapor durumu
 * - MailStateCode: Mail gönderim durumu
 */

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

    // Get Veriban auth settings with e-Arşiv URL
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

    // Parse request body
    const {
      invoiceNumber,
      invoiceId,
    } = await req.json();

    if (!invoiceNumber && !invoiceId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'invoiceNumber veya invoiceId parametresi zorunludur'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 E-Arşiv fatura durum sorgulama başlatılıyor...');
    console.log('📄 Invoice Number:', invoiceNumber);
    console.log('🆔 Invoice ID:', invoiceId);

    // Get invoice from database if invoiceId provided
    let invoice;
    let finalInvoiceNumber = invoiceNumber;
    
    if (invoiceId) {
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('company_id', profile.company_id)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Fatura bulunamadı'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      invoice = data;
      // invoiceNumber yoksa faturadan al
      if (!finalInvoiceNumber) {
        finalInvoiceNumber = invoice.fatura_no || (invoice.xml_data as any)?.veribanInvoiceNumber;
      }
    }

    if (!finalInvoiceNumber) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Fatura numarası bulunamadı. Lütfen faturayı önce gönderin.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine e-Arşiv webservice URL based on test mode
    const earsivWebserviceUrl = veribanAuth.test_mode
      ? 'https://earsivtransfertest.veriban.com.tr/IntegrationService.svc'
      : 'https://earsivtransfer.veriban.com.tr/IntegrationService.svc';

    console.log('📡 E-Arşiv Webservice URL:', earsivWebserviceUrl);

    // Get valid session code (reuses existing session if not expired)
    console.log('🔑 Getting valid session code...');
    const sessionResult = await getValidSessionCode(supabase, {
      ...veribanAuth,
      webservice_url: earsivWebserviceUrl // E-Arşiv URL kullan
    });

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
      // GetSalesInvoiceStatusWithInvoiceNumber ile e-Arşiv durum sorgulama
      console.log('📊 GetSalesInvoiceStatusWithInvoiceNumber çağrılıyor (E-Arşiv)...');
      console.log('📄 Fatura Numarası:', finalInvoiceNumber);
      
      const statusResult = await VeribanSoapClient.getSalesInvoiceStatusWithInvoiceNumber(
        sessionCode,
        finalInvoiceNumber,
        earsivWebserviceUrl
      );

      if (!statusResult.success) {
        console.error('❌ GetSalesInvoiceStatusWithInvoiceNumber başarısız:', statusResult.error);
        
        // Kullanıcı dostu hata mesajları
        let userFriendlyError = statusResult.error || 'Durum sorgulanamadı';
        if (statusResult.error?.includes('bulunamadı') || statusResult.error?.includes('QUERY DOCUMENT ERROR')) {
          userFriendlyError = 'E-Arşiv fatura Veriban sisteminde bulunamadı. Fatura henüz işlenmemiş veya numara hatalı olabilir.';
        }
        
        return new Response(JSON.stringify({
          success: false,
          error: userFriendlyError
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const statusData = statusResult.data;
      console.log('✅ E-Arşiv durum bilgisi alındı');
      console.log('📊 StatusData:', JSON.stringify(statusData, null, 2));
      console.log('📋 InvoiceProfile:', statusData?.invoiceProfile);
      console.log('📊 StateCode:', statusData?.stateCode);
      console.log('📋 StateName:', statusData?.stateName);
      console.log('📝 StateDescription:', statusData?.stateDescription);
      console.log('📧 MailStateCode:', statusData?.mailStateCode);
      console.log('📧 MailStateName:', statusData?.mailStateName);
      console.log('📊 GIBReportStateCode:', statusData?.gibReportStateCode);
      console.log('📊 GIBReportStateName:', statusData?.gibReportStateName);

        // Combine error details for better error reporting
        let detailedErrorDescription = statusData?.stateDescription || '';
        if (statusData?.errorMessage) {
          detailedErrorDescription = statusData.errorMessage + (detailedErrorDescription ? ` - ${detailedErrorDescription}` : '');
        } else if (statusData?.message) {
          detailedErrorDescription = statusData.message + (detailedErrorDescription ? ` - ${detailedErrorDescription}` : '');
        }

        // Update invoice status in database if invoiceId provided
        if (invoiceId && invoice) {
          // StateCode kontrolü: null/undefined ise mevcut değeri koru
          const validStateCode = (statusData.stateCode !== null && statusData.stateCode !== undefined) 
            ? statusData.stateCode 
            : (invoice.einvoice_invoice_state || invoice.elogo_status || 0);

          const errorMessageForDB = validStateCode === 4 
            ? (detailedErrorDescription || statusData.stateName || 'Hata oluştu')
            : null;
          
          const updateData: any = {
            einvoice_invoice_state: validStateCode,
            einvoice_transfer_state: validStateCode,
            einvoice_error_message: errorMessageForDB,
            updated_at: new Date().toISOString(),
          };

        // Update xml_data
        const xmlDataUpdate: any = { ...(invoice.xml_data as any || {}) };

        // Fatura numarasını kaydet
        if (statusData.invoiceNumber) {
          if (!invoice.fatura_no || invoice.fatura_no !== statusData.invoiceNumber) {
            updateData.fatura_no = statusData.invoiceNumber;
            xmlDataUpdate.veribanInvoiceNumber = statusData.invoiceNumber;
            console.log('✅ E-Arşiv fatura numarası kaydedildi:', statusData.invoiceNumber);
          }
        } else if (finalInvoiceNumber && !invoice.fatura_no) {
          updateData.fatura_no = finalInvoiceNumber;
          xmlDataUpdate.veribanInvoiceNumber = finalInvoiceNumber;
        }

        // E-Arşiv özel alanlarını kaydet
        xmlDataUpdate.invoiceProfile = statusData.invoiceProfile || 'EARSIVFATURA';
        xmlDataUpdate.gibReportStateCode = statusData.gibReportStateCode;
        xmlDataUpdate.gibReportStateName = statusData.gibReportStateName;
        xmlDataUpdate.mailStateCode = statusData.mailStateCode;
        xmlDataUpdate.mailStateName = statusData.mailStateName;

        updateData.xml_data = xmlDataUpdate;

        // Update elogo_status (Single Source of Truth)
        updateData.elogo_status = validStateCode;
        console.log('✅ elogo_status güncelleniyor:', validStateCode, '(original stateCode:', statusData.stateCode, ')');
        
        // Update status based on Veriban state code
        // StateCode values: 0=Henüz işleme alınmadı, 1=TASLAK, 2=Gönderilmeyi bekliyor/İmza bekliyor, 3=Gönderim listesinde, 4=HATALI, 5=Başarıyla alıcıya iletildi
        if (validStateCode === 5) {
          updateData.durum = 'onaylandi';
          updateData.einvoice_status = 'delivered';
          updateData.einvoice_delivered_at = new Date().toISOString();
        } else if (validStateCode === 4) {
          updateData.durum = 'iptal'; // Check constraint'e uygun: 'iptal' değeri kullanılıyor
          updateData.einvoice_status = 'error';
        } else if (validStateCode === 3 || validStateCode === 2) {
          updateData.durum = 'gonderildi';
          updateData.einvoice_status = 'sent';
        } else if (validStateCode === 1) {
          updateData.durum = 'taslak';
          updateData.einvoice_status = 'draft';
        } else if (validStateCode === 0) {
          updateData.durum = 'gonderildi'; // StateCode=0: Henüz işleme alınmadı ama gönderildi
          updateData.einvoice_status = 'sending';
        }

        const { error: updateError } = await supabase
          .from('sales_invoices')
          .update(updateData)
          .eq('id', invoiceId);

        if (updateError) {
          console.error('❌ Veritabanı güncelleme hatası:', updateError);
        } else {
          console.log('✅ E-Arşiv fatura veritabanında güncellendi');
        }
      }

      // Prepare response with user-friendly status
      let userStatus = 'Bilinmeyen durum';
      if (statusData.stateCode === 5) {
        userStatus = 'Başarılı - E-Arşiv fatura alıcıya ulaştı';
      } else if (statusData.stateCode === 4) {
        userStatus = 'Başarısız - Hata oluştu';
      } else if (statusData.stateCode === 3) {
        userStatus = 'Gönderim listesinde, işlem yapılıyor';
      } else if (statusData.stateCode === 2) {
        userStatus = 'Gönderilmeyi bekliyor, imza bekliyor';
      } else if (statusData.stateCode === 1) {
        userStatus = 'Taslak veri';
      }

      // GIB Report Status
      let gibReportStatus = '';
      if (statusData.gibReportStateCode) {
        gibReportStatus = statusData.gibReportStateName || `Kod: ${statusData.gibReportStateCode}`;
      }

      // Mail Status
      let mailStatus = '';
      if (statusData.mailStateCode) {
        mailStatus = statusData.mailStateName || `Kod: ${statusData.mailStateCode}`;
      }

      return new Response(JSON.stringify({
        success: true,
        status: {
          // Genel durum
          stateCode: statusData.stateCode,
          stateName: statusData.stateName,
          stateDescription: detailedErrorDescription || statusData.stateDescription,
          userFriendlyStatus: userStatus,
          
          // E-Arşiv özel alanlar
          invoiceProfile: statusData.invoiceProfile,
          
          // GİB rapor durumu
          gibReportStateCode: statusData.gibReportStateCode,
          gibReportStateName: statusData.gibReportStateName,
          gibReportStatus: gibReportStatus,
          
          // Mail gönderim durumu
          mailStateCode: statusData.mailStateCode,
          mailStateName: statusData.mailStateName,
          mailStatus: mailStatus,
          
          // Fatura numarası
          invoiceNumber: statusData.invoiceNumber || finalInvoiceNumber || null,
          
          // Hata mesajları
          errorMessage: statusData.errorMessage || null,
          message: statusData.message || null,
        },
        message: 'E-Arşiv durum bilgisi başarıyla alındı'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (apiError: any) {
      console.error('❌ API çağrısı hatası:', apiError);
      return new Response(JSON.stringify({
        success: false,
        error: apiError.message || 'API çağrısı başarısız'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('❌ E-Arşiv durum sorgulama function hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
