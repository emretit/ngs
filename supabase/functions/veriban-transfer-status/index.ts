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
      transferFileUniqueId,
      integrationCode,
    } = await req.json();

    if (!transferFileUniqueId && !integrationCode) {
      return new Response(JSON.stringify({
        success: false,
        error: 'transferFileUniqueId veya integrationCode parametrelerinden biri zorunludur'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 Veriban transfer durum sorgulama başlatılıyor...');
    console.log('🆔 Transfer File Unique ID:', transferFileUniqueId);
    console.log('🔑 Integration Code:', integrationCode);

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
      // Query transfer status based on provided identifier
      let transferStatusResult;
      
      if (integrationCode) {
        console.log('📊 GetTransferSalesInvoiceFileStatusWithIntegrationCode çağrılıyor...');
        transferStatusResult = await VeribanSoapClient.getTransferStatusWithIntegrationCode(
          sessionCode,
          integrationCode,
          veribanAuth.webservice_url
        );
      } else {
        console.log('📊 GetTransferSalesInvoiceFileStatus çağrılıyor...');
        transferStatusResult = await VeribanSoapClient.getTransferStatus(
          sessionCode,
          transferFileUniqueId,
          veribanAuth.webservice_url
        );
      }

      if (!transferStatusResult.success) {
        console.error('❌ GetTransferStatus başarısız:', transferStatusResult.error);
        return new Response(JSON.stringify({
          success: false,
          error: transferStatusResult.error || 'Transfer durumu sorgulanamadı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const statusData = transferStatusResult.data;
      console.log('✅ Transfer durum bilgisi alındı');
      console.log('📊 StateCode:', statusData.stateCode);
      console.log('📋 StateName:', statusData.stateName);
      console.log('📝 StateDescription:', statusData.stateDescription);

      // Prepare user-friendly status
      let userStatus = 'Bilinmeyen durum';
      if (statusData.stateCode === 5) {
        userStatus = 'Başarıyla işlendi';
      } else if (statusData.stateCode === 4) {
        userStatus = 'Hatalı';
      } else if (statusData.stateCode === 3) {
        userStatus = 'İşleniyor';
      } else if (statusData.stateCode === 2) {
        userStatus = 'İşlenmeyi bekliyor';
      } else if (statusData.stateCode === 1) {
        userStatus = 'Bilinmiyor';
      }

      return new Response(JSON.stringify({
        success: true,
        status: {
          stateCode: statusData.stateCode,
          stateName: statusData.stateName,
          stateDescription: statusData.stateDescription,
          userFriendlyStatus: userStatus,
        },
        message: 'Transfer durum bilgisi başarıyla alındı'
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
    console.error('❌ Veriban transfer status function hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

