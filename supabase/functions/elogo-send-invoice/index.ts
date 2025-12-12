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
        error: 'e-Logo kimlik doğrulama bilgileri bulunamadı. Lütfen ayarlar sayfasından e-Logo bilgilerinizi girin.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const {
      invoiceId,
      xmlContent,
      documentType = 'EINVOICE',
      customerAlias,
      signed = 0,
    } = await req.json();

    if (!invoiceId || !xmlContent) {
      return new Response(JSON.stringify({
        success: false,
        error: 'invoiceId ve xmlContent parametreleri zorunludur'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🚀 e-Logo fatura gönderimi başlatılıyor...');
    console.log('📄 Invoice ID:', invoiceId);
    console.log('📡 Document Type:', documentType);

    // Get invoice from database
    const { data: invoice, error: invoiceError } = await supabase
      .from('outgoing_invoices')
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
    console.log('✅ e-Logo login başarılı, sessionID alındı');

    try {
      // Create ZIP file from XML content
      // Import JSZip
      const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
      const zip = new JSZip();

      // Add XML to zip
      const fileName = `${invoice.ettn || invoice.id}.xml`;
      zip.file(fileName, xmlContent);

      // Generate ZIP
      const zipBlob = await zip.generateAsync({ type: 'uint8array' });

      // Convert to Base64
      const base64Zip = SoapClient.encodeBase64(zipBlob);

      // Calculate MD5 hash (ASYNC for proper MD5)
      const md5Hash = await SoapClient.calculateMD5Async(zipBlob);

      console.log('📦 ZIP dosyası oluşturuldu');
      console.log('🔐 MD5 Hash:', md5Hash);

      // Prepare parameters
      const paramList: string[] = [`DOCUMENTTYPE=${documentType}`];

      // Add customer alias if e-Fatura
      if (documentType === 'EINVOICE' && customerAlias) {
        paramList.push(`ALIAS=${customerAlias}`);
      }

      // Add signed parameter
      paramList.push(`SIGNED=${signed}`);

      console.log('📨 SendDocument çağrılıyor...');
      console.log('📋 Parameters:', paramList);

      // Send document
      const sendResult = await SoapClient.sendDocument(
        sessionID,
        paramList,
        {
          binaryData: base64Zip,
          fileName: `${fileName}.zip`,
          hash: md5Hash,
          currentDate: new Date().toISOString().split('T')[0],
        },
        elogoAuth.webservice_url
      );

      if (!sendResult.success) {
        console.error('❌ SendDocument başarısız:', sendResult.error);

        // Update invoice status to failed
        await supabase
          .from('outgoing_invoices')
          .update({
            status: 'failed',
            elogo_status: -1,
            elogo_description: sendResult.error,
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoiceId);

        return new Response(JSON.stringify({
          success: false,
          error: sendResult.error || 'Belge gönderilemedi'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const refId = sendResult.data?.refId;
      console.log('✅ Belge başarıyla gönderildi');
      console.log('🆔 Ref ID:', refId);

      // Update invoice in database
      const { error: updateError } = await supabase
        .from('outgoing_invoices')
        .update({
          status: 'sent',
          ref_id: refId,
          elogo_status: 1, // İşlem devam ediyor
          elogo_code: 10, // Entegratörde Kuyrukta
          elogo_description: 'Belge e-Logo sistemine gönderildi',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (updateError) {
        console.error('❌ Veritabanı güncelleme hatası:', updateError);
      }

      return new Response(JSON.stringify({
        success: true,
        refId,
        message: 'Fatura başarıyla e-Logo sistemine gönderildi'
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
    console.error('❌ e-Logo send invoice function hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
