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

    // Parse request body
    const {
      invoiceUUID,
      invoiceNumber,
    } = await req.json();

    if (!invoiceUUID && !invoiceNumber) {
      return new Response(JSON.stringify({
        success: false,
        error: 'invoiceUUID veya invoiceNumber parametrelerinden biri zorunludur'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 Veriban gelen fatura durum sorgulama başlatılıyor...');
    console.log('🆔 Invoice UUID:', invoiceUUID);
    console.log('📄 Invoice Number:', invoiceNumber);

    // Get valid session code (reuses existing session if not expired)
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

    try {
      // Query purchase invoice status based on provided identifier
      let statusResult;
      
      if (invoiceNumber) {
        console.log('📊 GetPurchaseInvoiceStatusWithInvoiceNumber çağrılıyor...');
        statusResult = await VeribanSoapClient.getPurchaseInvoiceStatusWithInvoiceNumber(
          sessionCode,
          invoiceNumber,
          veribanAuth.webservice_url
        );
      } else {
        console.log('📊 GetPurchaseInvoiceStatusWithInvoiceUUID çağrılıyor...');
        statusResult = await VeribanSoapClient.getPurchaseInvoiceStatus(
          sessionCode,
          invoiceUUID,
          veribanAuth.webservice_url
        );
      }

      if (!statusResult.success) {
        console.error('❌ GetPurchaseInvoiceStatus başarısız:', statusResult.error);
        return new Response(JSON.stringify({
          success: false,
          error: statusResult.error || 'Durum sorgulanamadı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const statusData = statusResult.data;
      console.log('✅ Durum bilgisi alındı');
      console.log('📊 StateCode:', statusData.stateCode);
      console.log('📋 StateName:', statusData.stateName);
      console.log('📝 StateDescription:', statusData.stateDescription);
      console.log('📋 AnswerStateCode:', statusData.answerStateCode);
      console.log('📋 AnswerTypeCode:', statusData.answerTypeCode);

      // Prepare user-friendly status
      let userStatus = 'Bilinmeyen durum';
      if (statusData.stateCode === 5) {
        userStatus = 'Başarılı - Fatura alıcıya ulaştı';
      } else if (statusData.stateCode === 4) {
        userStatus = 'Başarısız - Hata oluştu';
      } else if (statusData.stateCode === 3) {
        userStatus = 'Gönderim listesinde, işlem yapılıyor';
      } else if (statusData.stateCode === 2) {
        userStatus = 'Gönderilmeyi bekliyor, imza bekliyor';
      } else if (statusData.stateCode === 1) {
        userStatus = 'Taslak veri';
      }

      // Answer status
      let answerStatus = '';
      if (statusData.answerTypeCode === 5) {
        answerStatus = 'Kabul edildi';
      } else if (statusData.answerTypeCode === 4) {
        answerStatus = 'Reddedildi';
      } else if (statusData.answerTypeCode === 3) {
        answerStatus = 'Iade edildi';
      } else if (statusData.answerStateCode === 2) {
        answerStatus = 'Cevap bekliyor';
      }

      return new Response(JSON.stringify({
        success: true,
        status: {
          stateCode: statusData.stateCode,
          stateName: statusData.stateName,
          stateDescription: statusData.stateDescription,
          answerStateCode: statusData.answerStateCode,
          answerStateName: statusData.answerStateName,
          answerStateDescription: statusData.answerStateDescription,
          answerTypeCode: statusData.answerTypeCode,
          answerTypeName: statusData.answerTypeName,
          answerTypeDescription: statusData.answerTypeDescription,
          envelopeIdentifier: statusData.envelopeIdentifier,
          envelopeGIBCode: statusData.envelopeGIBCode,
          envelopeGIBStateName: statusData.envelopeGIBStateName,
          envelopeCreationTime: statusData.envelopeCreationTime,
          userFriendlyStatus: userStatus,
          answerStatus: answerStatus,
        },
        message: 'Durum bilgisi başarıyla alındı'
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
    // Note: We DO NOT logout here - session is cached for 6 hours

  } catch (error: any) {
    console.error('❌ Veriban purchase invoice status function hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

