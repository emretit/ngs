import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VeribanSoapClient } from '../_shared/veriban-soap-helper.ts';

/**
 * Veriban E-Arşiv Fatura Durum Sorgulama Edge Function
 * 
 * SADECE E-ARŞİV faturalar için!
 * E-Fatura sorgulaması için ayrı fonksiyon kullanılmalı.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
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
    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'invoiceId parametresi zorunludur'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 E-Arşiv fatura durum sorgulama:', invoiceId);

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('sales_invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('company_id', profile.company_id)
      .single();

    if (invoiceError || !invoice) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Fatura bulunamadı'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // E-Arşiv kontrolü
    if (invoice.invoice_profile !== 'EARSIVFATURA') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Bu fatura E-Arşiv faturası değil. E-Fatura sorgulaması için ayrı endpoint kullanın.'
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

    // E-Arşiv için özel webservice URL
    const isTestMode = veribanAuth.webservice_url?.includes('test') || false;
    const earchiveWebserviceUrl = (veribanAuth as any).earchive_webservice_url || 
      (isTestMode 
        ? 'http://earsivtransfertest.veriban.com.tr/IntegrationService.svc'
        : 'http://earsivtransfer.veriban.com.tr/IntegrationService.svc'
      );
    
    console.log('🌐 E-Arşiv Webservice URL:', earchiveWebserviceUrl);

    // Login to Veriban
    const loginResult = await VeribanSoapClient.login(
      {
        username: veribanAuth.username,
        password: veribanAuth.password,
      },
      earchiveWebserviceUrl
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

    try {
      const invoiceNumber = invoice.fatura_no;
      const transferFileUniqueId = invoice.nilvera_transfer_id;

      if (!invoiceNumber) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Fatura numarası bulunamadı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let transferStatus = null;
      let invoiceStatus = null;

      // 1. TransferFileUniqueId varsa transfer durumunu sorgula
      if (transferFileUniqueId) {
        console.log('📊 Transfer durumu sorgulanıyor:', transferFileUniqueId);
        const transferResult = await VeribanSoapClient.getTransferStatus(
          sessionCode,
          transferFileUniqueId,
          earchiveWebserviceUrl
        );

        if (transferResult.success && transferResult.data) {
          transferStatus = transferResult.data;
          console.log('✅ Transfer durumu:', transferStatus);
        }
      }

      // 2. Fatura numarası ile detaylı durum sorgula
      console.log('📋 E-Arşiv fatura durumu sorgulanıyor:', invoiceNumber);
      const invoiceStatusResult = await VeribanSoapClient.getSalesInvoiceStatusWithInvoiceNumber(
        sessionCode,
        invoiceNumber,
        earchiveWebserviceUrl
      );

      if (invoiceStatusResult.success && invoiceStatusResult.data) {
        invoiceStatus = invoiceStatusResult.data;
        console.log('✅ E-Arşiv fatura durumu:', invoiceStatus);
      }

      // 3. Veritabanını güncelle
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Transfer durumundan güncelle
      if (transferStatus) {
        const stateCode = transferStatus.stateCode;
        
        // StateCode mapping:
        // 1: Bilinmiyor
        // 2: İşlenmeyi bekliyor
        // 3: İşleniyor
        // 4: Hatalı
        // 5: Başarılı
        
        if (stateCode === 2) {
          updateData.einvoice_transfer_state = 2;
          updateData.einvoice_status = 'pending';
        } else if (stateCode === 3) {
          updateData.einvoice_transfer_state = 3;
          updateData.einvoice_status = 'processing';
        } else if (stateCode === 4) {
          updateData.einvoice_transfer_state = 4;
          updateData.einvoice_status = 'error';
          updateData.durum = 'hata';
        } else if (stateCode === 5) {
          updateData.einvoice_transfer_state = 5;
          updateData.einvoice_status = 'sent';
          updateData.durum = 'gonderildi';
        }
      }

      // Fatura durumundan güncelle (daha detaylı)
      if (invoiceStatus) {
        const stateCode = invoiceStatus.stateCode;
        const gibReportStateCode = invoiceStatus.gibReportStateCode;
        const mailStateCode = invoiceStatus.mailStateCode;
        
        // GİB rapor durumu
        if (gibReportStateCode !== null && gibReportStateCode !== undefined) {
          updateData.elogo_status = gibReportStateCode;
        }
        
        // Mail gönderim durumu (xml_data içinde saklanabilir)
        if (mailStateCode !== null && mailStateCode !== undefined) {
          const xmlData = invoice.xml_data || {};
          xmlData.mailStateCode = mailStateCode;
          xmlData.mailStateName = invoiceStatus.mailStateName || '';
          updateData.xml_data = xmlData;
        }
        
        // Ana durum
        if (stateCode === 5) {
          updateData.einvoice_status = 'sent';
          updateData.einvoice_transfer_state = 5;
          updateData.durum = 'gonderildi';
        } else if (stateCode === 4) {
          updateData.einvoice_status = 'error';
          updateData.einvoice_transfer_state = 4;
          updateData.durum = 'hata';
          if (invoiceStatus.errorMessage) {
            updateData.einvoice_error_message = invoiceStatus.errorMessage;
          }
        }
      }

      // Veritabanını güncelle
      const { error: updateError } = await supabase
        .from('sales_invoices')
        .update(updateData)
        .eq('id', invoiceId);

      if (updateError) {
        console.error('❌ Veritabanı güncelleme hatası:', updateError);
      }

      return new Response(JSON.stringify({
        success: true,
        data: {
          transferStatus,
          invoiceStatus,
          updated: updateData,
        },
        message: 'E-Arşiv fatura durumu başarıyla güncellendi'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } finally {
      try {
        await VeribanSoapClient.logout(sessionCode, earchiveWebserviceUrl);
      } catch (logoutError: any) {
        console.error('⚠️ Logout hatası:', logoutError.message);
      }
    }

  } catch (error: any) {
    console.error('❌ Veriban E-Arşiv durum sorgulama hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
