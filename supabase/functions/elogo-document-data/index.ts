import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SoapClient } from '../_shared/soap-helper.ts';

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

    // Get e-Logo auth settings
    const { data: elogoAuth, error: authError } = await supabase
      .from('elogo_auth')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .single();

    if (authError || !elogoAuth) {
      return new Response(JSON.stringify({
        success: false,
        error: 'e-Logo kimlik doğrulama bilgileri bulunamadı'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const {
      ettn,
      documentType = 'EINVOICE',
      dataFormat = 'PDF', // UBL, HTML, PDF
    } = await req.json();

    if (!ettn) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ettn parametresi zorunludur'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📄 e-Logo belge verisi alınıyor...');
    console.log('🆔 ETTN:', ettn);
    console.log('📋 Document Type:', documentType);
    console.log('📁 Format:', dataFormat);

    // Login to e-Logo
    console.log('🔐 e-Logo girişi yapılıyor...');
    const loginResult = await SoapClient.login(
      {
        username: elogoAuth.username,
        password: elogoAuth.password,
      },
      elogoAuth.webservice_url
    );

    if (!loginResult.success || !loginResult.sessionID) {
      console.error('❌ e-Logo login başarısız:', loginResult.error);
      return new Response(JSON.stringify({
        success: false,
        error: loginResult.error || 'e-Logo giriş başarısız'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sessionID = loginResult.sessionID;
    console.log('✅ e-Logo login başarılı');

    try {
      // Prepare parameters
      const paramList = [
        `DOCUMENTTYPE=${documentType}`,
        `DATAFORMAT=${dataFormat}`,
      ];

      console.log('📊 GetDocumentData çağrılıyor...');
      console.log('📋 Parameters:', paramList);

      // Query document data
      const dataResult = await SoapClient.getDocumentData(
        sessionID,
        ettn,
        paramList,
        elogoAuth.webservice_url
      );

      if (!dataResult.success) {
        console.error('❌ GetDocumentData başarısız:', dataResult.error);
        return new Response(JSON.stringify({
          success: false,
          error: dataResult.error || 'Belge verisi alınamadı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const documentData = dataResult.data;
      console.log('✅ Belge verisi alındı');
      console.log('📁 File Name:', documentData.fileName);

      // Decode base64 data
      let decodedContent = null;
      if (documentData.binaryData) {
        if (dataFormat === 'UBL' || dataFormat === 'XML') {
          // XML/UBL format - decode to text
          const binaryData = SoapClient.decodeBase64(documentData.binaryData);
          const decoder = new TextDecoder();
          decodedContent = decoder.decode(binaryData);
        } else {
          // PDF/HTML - keep as base64 for frontend
          decodedContent = documentData.binaryData;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        data: {
          fileName: documentData.fileName,
          format: dataFormat,
          content: decodedContent,
          base64Data: documentData.binaryData, // Keep original for download
          hash: documentData.hash,
          currentDate: documentData.currentDate,
        },
        message: 'Belge verisi başarıyla alındı'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } finally {
      // Always logout
      try {
        await SoapClient.logout(sessionID, elogoAuth.webservice_url);
        console.log('✅ e-Logo oturumu kapatıldı');
      } catch (logoutError: any) {
        console.error('⚠️ Logout hatası (kritik değil):', logoutError.message);
      }
    }

  } catch (error: any) {
    console.error('❌ e-Logo document data function hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

