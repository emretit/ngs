import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VeribanSoapClient } from '../_shared/veriban-soap-helper.ts';

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
      invoiceType = 'sales', // 'sales' or 'purchase'
    } = await req.json();

    if (!invoiceUUID) {
      return new Response(JSON.stringify({
        success: false,
        error: 'invoiceUUID parametresi zorunludur'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📄 Veriban belge verisi alınıyor...');
    console.log('🆔 Invoice UUID:', invoiceUUID);
    console.log('📋 Invoice Type:', invoiceType);

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
      console.error('❌ Veriban login başarısız:', loginResult.error);
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
      // Download invoice based on type
      let downloadResult;
      
      if (invoiceType === 'purchase') {
        console.log('📊 GetPurchaseInvoiceWithInvoiceUUID çağrılıyor...');
        downloadResult = await VeribanSoapClient.downloadPurchaseInvoice(
          sessionCode,
          invoiceUUID,
          veribanAuth.webservice_url
        );
      } else {
        console.log('📊 GetSalesInvoiceWithInvoiceUUID çağrılıyor...');
        downloadResult = await VeribanSoapClient.downloadSalesInvoice(
          sessionCode,
          invoiceUUID,
          veribanAuth.webservice_url
        );
      }

      if (!downloadResult.success) {
        console.error('❌ Download invoice başarısız:', downloadResult.error);
        return new Response(JSON.stringify({
          success: false,
          error: downloadResult.error || 'Belge verisi alınamadı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const documentData = downloadResult.data;
      console.log('✅ Belge verisi alındı');
      console.log('📁 File Name:', documentData.fileName);

      // Decode ZIP and extract XML
      let xmlContent = null;
      if (documentData.binaryData) {
        try {
          // Decode base64 ZIP
          const zipData = VeribanSoapClient.decodeBase64(documentData.binaryData);
          
          // Extract from ZIP
          const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
          const zip = await JSZip.loadAsync(zipData);
          
          // Find XML file in ZIP
          const xmlFiles = Object.keys(zip.files).filter(name => name.endsWith('.xml'));
          if (xmlFiles.length > 0) {
            const xmlFile = zip.files[xmlFiles[0]];
            xmlContent = await xmlFile.async('string');
          }
        } catch (zipError: any) {
          console.error('⚠️ ZIP decode hatası:', zipError.message);
          // Continue without XML extraction
        }
      }

      return new Response(JSON.stringify({
        success: true,
        data: {
          fileName: documentData.fileName,
          xmlContent: xmlContent,
          binaryData: documentData.binaryData, // Base64 ZIP
          invoiceUUID: invoiceUUID,
        },
        message: 'Belge verisi başarıyla alındı'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } finally {
      // Always logout
      try {
        await VeribanSoapClient.logout(sessionCode, veribanAuth.webservice_url);
        console.log('✅ Veriban oturumu kapatıldı');
      } catch (logoutError: any) {
        console.error('⚠️ Logout hatası (kritik değil):', logoutError.message);
      }
    }

  } catch (error: any) {
    console.error('❌ Veriban document data function hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

