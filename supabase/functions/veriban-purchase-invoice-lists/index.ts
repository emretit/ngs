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
    const requestBody = await req.json();
    const {
      action, // 'getUnTransferred' or 'getWaitAnswer'
    } = requestBody;

    if (!action || (action !== 'getUnTransferred' && action !== 'getWaitAnswer')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'action parametresi zorunludur ve "getUnTransferred" veya "getWaitAnswer" olmalıdır'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📋 Veriban gelen fatura UUID listesi sorgulanıyor...');
    console.log('📋 Action:', action);
    console.log('🔑 Company ID:', profile.company_id);

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
    console.log('✅ Session code alındı');

    try {
      // Call appropriate method based on action
      let uuidListResult: { success: boolean; data?: string[]; error?: string } | undefined;
      
      if (action === 'getUnTransferred') {
        console.log('📊 GetUnTransferredPurchaseInvoiceUUIDList çağrılıyor...');
        uuidListResult = await VeribanSoapClient.getUnTransferredPurchaseInvoiceUUIDList(
          sessionCode,
          veribanAuth.webservice_url
        );
      } else if (action === 'getWaitAnswer') {
        console.log('📊 GetWaitAnswerPurchaseInvoiceUUIDList çağrılıyor...');
        uuidListResult = await VeribanSoapClient.getWaitAnswerPurchaseInvoiceUUIDList(
          sessionCode,
          veribanAuth.webservice_url
        );
      }

      if (!uuidListResult || !uuidListResult.success) {
        console.error('❌ UUID listesi alınamadı:', uuidListResult?.error);
        return new Response(JSON.stringify({
          success: false,
          error: uuidListResult?.error || 'UUID listesi alınamadı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const uuidList = uuidListResult.data || [];
      console.log(`✅ ${uuidList.length} adet UUID bulundu`);

      return new Response(JSON.stringify({
        success: true,
        uuids: Array.isArray(uuidList) ? uuidList : [],
        totalCount: Array.isArray(uuidList) ? uuidList.length : 0,
        message: `${Array.isArray(uuidList) ? uuidList.length : 0} adet UUID listelendi`
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
    console.error('❌ Veriban purchase invoice lists function hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

