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
        error: 'Veriban kimlik doğrulama bilgileri bulunamadı. Lütfen ayarlar sayfasından Veriban bilgilerinizi girin.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const {
      invoiceId,
      xmlContent,
      customerAlias,
      isDirectSend = true,
      integrationCode,
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

    console.log('🚀 Veriban fatura gönderimi başlatılıyor...');
    console.log('📄 Invoice ID:', invoiceId);

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
    console.log('✅ Veriban login başarılı, sessionCode alındı');

    try {
      // Create ZIP file from XML content
      const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
      const zip = new JSZip();

      // Add XML to zip
      const xmlFileName = `${invoice.ettn || invoice.id}.xml`;
      zip.file(xmlFileName, xmlContent);

      // Generate ZIP
      const zipBlob = await zip.generateAsync({ type: 'uint8array' });

      // Convert to Base64
      const base64Zip = VeribanSoapClient.encodeBase64(zipBlob);

      // Calculate MD5 hash
      const md5Hash = await VeribanSoapClient.calculateMD5Async(zipBlob);

      console.log('📦 ZIP dosyası oluşturuldu');
      console.log('🔐 MD5 Hash:', md5Hash);

      const zipFileName = `${xmlFileName}.zip`;

      // Transfer Sales Invoice File
      console.log('📨 TransferSalesInvoiceFile çağrılıyor...');

      const transferResult = await VeribanSoapClient.transferSalesInvoice(
        sessionCode,
        {
          fileName: zipFileName,
          fileDataType: 'XML_INZIP',
          binaryData: base64Zip,
          binaryDataHash: md5Hash,
          customerAlias: customerAlias || '',
          isDirectSend: isDirectSend,
          integrationCode: integrationCode || '',
        },
        veribanAuth.webservice_url
      );

      if (!transferResult.success || !transferResult.data?.operationCompleted) {
        console.error('❌ TransferSalesInvoiceFile başarısız:', transferResult.error);

        // Update invoice status to failed
        await supabase
          .from('outgoing_invoices')
          .update({
            status: 'failed',
            veriban_status: -1,
            veriban_description: transferResult.error || 'Belge gönderilemedi',
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoiceId);

        return new Response(JSON.stringify({
          success: false,
          error: transferResult.error || 'Belge gönderilemedi'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const transferFileUniqueId = transferResult.data?.transferFileUniqueId;
      console.log('✅ Belge başarıyla gönderildi');
      console.log('🆔 Transfer File Unique ID:', transferFileUniqueId);

      // Update invoice in database
      const { error: updateError } = await supabase
        .from('outgoing_invoices')
        .update({
          status: 'sent',
          ref_id: transferFileUniqueId,
          veriban_status: 1, // İşlem devam ediyor
          veriban_code: 2, // İşlenmeyi bekliyor
          veriban_description: 'Belge Veriban sistemine gönderildi',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (updateError) {
        console.error('❌ Veritabanı güncelleme hatası:', updateError);
      }

      return new Response(JSON.stringify({
        success: true,
        transferFileUniqueId,
        message: 'Fatura başarıyla Veriban sistemine gönderildi'
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
    console.error('❌ Veriban send invoice function hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

