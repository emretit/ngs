import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VeribanSoapClient, getValidSessionCode } from '../_shared/veriban-soap-helper.ts';
import { parseUBLTRXML, decodeZIPAndExtractXML } from '../_shared/ubl-parser.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { invoiceUUID } = await req.json();

    if (!invoiceUUID) {
      return new Response(
        JSON.stringify({ success: false, error: 'invoiceUUID gerekli' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🧪 Test başlatılıyor için ETTN:', invoiceUUID);

    // Get auth from DB
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Kullanıcı girişi gerekli');

    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.company_id) throw new Error('Firma bilgisi bulunamadı');

    const { data: veribanAuth } = await supabaseClient
      .from('veriban_auth')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .single();

    if (!veribanAuth) throw new Error('Veriban auth bilgisi bulunamadı');

    // Get session
    console.log('🔐 Veriban session alınıyor...');
    const sessionResult = await getValidSessionCode(supabaseClient, veribanAuth);

    if (!sessionResult.success || !sessionResult.sessionCode) {
      throw new Error('Session alınamadı: ' + sessionResult.error);
    }

    const sessionCode = sessionResult.sessionCode;
    console.log('✅ Session alındı');

    // Download invoice XML
    console.log('📥 Fatura indiriliyor...');
    const downloadResult = await VeribanSoapClient.downloadSalesInvoice(
      sessionCode,
      { invoiceUUID, downloadDataType: 'XML_INZIP' },
      veribanAuth.webservice_url
    );

    if (!downloadResult.success || !downloadResult.data?.binaryData) {
      throw new Error('Fatura indirilemedi');
    }

    console.log('✅ Binary data alındı, uzunluk:', downloadResult.data.binaryData.length);

    // Decode ZIP
    console.log('📦 ZIP decode ediliyor...');
    const xmlContent = await decodeZIPAndExtractXML(downloadResult.data.binaryData);
    
    if (!xmlContent) {
      throw new Error('XML içeriği çıkarılamadı');
    }

    console.log('✅ XML çıkarıldı, uzunluk:', xmlContent.length);
    console.log('📄 XML önizleme (ilk 500 karakter):');
    console.log(xmlContent.substring(0, 500));

    // Parse XML
    console.log('🔍 XML parse ediliyor...');
    const parsedInvoice = parseUBLTRXML(xmlContent);

    if (!parsedInvoice) {
      throw new Error('XML parse edilemedi');
    }

    console.log('✅ XML parse edildi!');
    console.log('📊 Parsed Invoice Data:');
    console.log('  - Invoice Number:', parsedInvoice.invoiceNumber);
    console.log('  - Customer Name:', parsedInvoice.customerInfo?.name);
    console.log('  - Customer Tax Number:', parsedInvoice.customerInfo?.taxNumber);
    console.log('  - Invoice Date:', parsedInvoice.invoiceDate);
    console.log('  - Total Amount:', parsedInvoice.payableAmount);
    console.log('  - Currency:', parsedInvoice.currency);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          xmlLength: xmlContent.length,
          xmlPreview: xmlContent.substring(0, 1000),
          parsed: {
            invoiceNumber: parsedInvoice.invoiceNumber,
            customerName: parsedInvoice.customerInfo?.name,
            customerTaxNumber: parsedInvoice.customerInfo?.taxNumber,
            customerTaxOffice: parsedInvoice.customerInfo?.taxOffice,
            invoiceDate: parsedInvoice.invoiceDate,
            totalAmount: parsedInvoice.payableAmount,
            currency: parsedInvoice.currency,
            invoiceType: parsedInvoice.invoiceType,
            invoiceProfile: parsedInvoice.invoiceProfile,
          },
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Test hatası:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Test sırasında hata oluştu',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

