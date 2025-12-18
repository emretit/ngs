import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VeribanSoapClient } from '../_shared/veriban-soap-helper.ts';
import { generateUBLTRXML } from '../_shared/ubl-generator.ts';

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
      xmlContent, // Optional - if not provided, will be generated
      customerAlias,
      isDirectSend = true,
      integrationCode,
    } = await req.json();

    if (!invoiceId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'invoiceId parametresi zorunludur'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🚀 Veriban fatura gönderimi başlatılıyor...');
    console.log('📄 Invoice ID:', invoiceId);

    // Get invoice from database with related data
    const { data: invoice, error: invoiceError } = await supabase
      .from('sales_invoices')
      .select(`
        *,
        companies(*),
        customers(*),
        sales_invoice_items(*)
      `)
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

    // Validate required data
    if (!invoice.companies?.tax_number) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Şirket vergi numarası bulunamadı. Lütfen şirket bilgilerini tamamlayın.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!invoice.customers?.tax_number) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Müşteri vergi numarası bulunamadı. Lütfen müşteri bilgilerini tamamlayın.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate XML if not provided
    let finalXmlContent = xmlContent;
    let ettn: string;

    if (!finalXmlContent) {
      console.log('📝 UBL-TR XML oluşturuluyor...');
      
      // Extract ETTN from existing data if available
      if (invoice.xml_data && invoice.xml_data.ettn) {
        ettn = invoice.xml_data.ettn;
      } else if (invoice.einvoice_xml_content) {
        const ettnMatch = invoice.einvoice_xml_content.match(/<cbc:UUID[^>]*>(.*?)<\/cbc:UUID>/i);
        if (ettnMatch) {
          ettn = ettnMatch[1].trim();
        } else {
          ettn = generateETTN();
        }
      } else {
        ettn = generateETTN();
      }

      // Generate UBL-TR XML
      finalXmlContent = generateUBLTRXML(invoice, ettn);
      
      console.log('✅ UBL-TR XML oluşturuldu');
      console.log('🆔 ETTN:', ettn);

      // Save XML content and ETTN to database
      await supabase
        .from('sales_invoices')
        .update({
          einvoice_xml_content: finalXmlContent,
          xml_data: { ...(invoice.xml_data || {}), ettn },
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
    } else {
      // Extract ETTN from provided XML
      const ettnMatch = finalXmlContent.match(/<cbc:UUID[^>]*>(.*?)<\/cbc:UUID>/i);
      if (ettnMatch) {
        ettn = ettnMatch[1].trim();
      } else {
        ettn = invoice.id;
      }
    }

    // Determine customer alias
    let finalCustomerAlias = customerAlias || '';
    if (!finalCustomerAlias && invoice.customers?.is_einvoice_mukellef) {
      finalCustomerAlias = invoice.customers?.einvoice_alias_name || '';
      if (finalCustomerAlias === 'undefined' || finalCustomerAlias === 'null') {
        finalCustomerAlias = '';
      }
    }

    // Helper function to generate ETTN
    function generateETTN(): string {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
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
      const xmlFileName = `${ettn}.xml`;
      zip.file(xmlFileName, finalXmlContent);

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

      // Generate integration code if not provided (use invoice ID)
      const finalIntegrationCode = integrationCode || invoice.id;

      const transferResult = await VeribanSoapClient.transferSalesInvoice(
        sessionCode,
        {
          fileName: zipFileName,
          fileDataType: 'XML_INZIP',
          binaryData: base64Zip,
          binaryDataHash: md5Hash,
          customerAlias: finalCustomerAlias,
          isDirectSend: isDirectSend,
          integrationCode: finalIntegrationCode,
        },
        veribanAuth.webservice_url
      );

      if (!transferResult.success || !transferResult.data?.operationCompleted) {
        console.error('❌ TransferSalesInvoiceFile başarısız:', transferResult.error);

        // Update invoice status to failed
        await supabase
          .from('sales_invoices')
          .update({
            durum: 'iptal',
            einvoice_status: 'error',
            einvoice_error_message: transferResult.error || 'Belge gönderilemedi',
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
        .from('sales_invoices')
        .update({
          durum: 'gonderildi',
          einvoice_status: 'sent',
          nilvera_transfer_id: transferFileUniqueId, // Using nilvera_transfer_id field for Veriban transfer ID
          einvoice_transfer_state: 2, // İşlenmeyi bekliyor
          einvoice_sent_at: new Date().toISOString(),
          einvoice_xml_content: finalXmlContent, // Save generated XML
          xml_data: { ...(invoice.xml_data || {}), ettn, integrationCode: finalIntegrationCode },
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (updateError) {
        console.error('❌ Veritabanı güncelleme hatası:', updateError);
      }

      return new Response(JSON.stringify({
        success: true,
        transferFileUniqueId,
        ettn,
        integrationCode: finalIntegrationCode,
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

