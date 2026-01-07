import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { VeribanSoapClient, getValidSessionCode } from '../_shared/veriban-soap-helper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Veriban Sales Invoice Details Edge Function
 * 
 * Bu fonksiyon Veriban'dan GİDEN FATURA detaylarını çeker:
 * 1. Fatura UUID ile giden faturayı indirir (XML formatında)
 * 2. XML'i parse eder
 * 3. Fatura kalemlerini ve müşteri bilgilerini döndürür
 * 
 * Bölüm 35: Giden Faturayı İndirme (DownloadSalesInvoiceWithInvoiceUUID)
 */

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    console.log('🎯 [Veriban Sales Invoice Details] Function invoked');
    
    // Get request body
    const { invoiceUUID } = await req.json();
    
    if (!invoiceUUID) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'invoiceUUID parametresi gerekli'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📋 [Veriban] Invoice UUID:', invoiceUUID);

    // Get auth from request headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Yetkilendirme hatası'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('❌ [Veriban] Auth error:', userError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Kullanıcı doğrulanamadı'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ [Veriban] User authenticated:', user.id);

    // Get user's company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('❌ [Veriban] Profile error:', profileError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Profil bulunamadı'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const companyId = profile.company_id;
    console.log('🏢 [Veriban] Company ID:', companyId);

    // Get Veriban auth credentials
    const { data: veribanAuth, error: veribanAuthError } = await supabase
      .from('veriban_auth')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .single();

    if (veribanAuthError || !veribanAuth) {
      console.error('❌ [Veriban] Auth credentials not found:', veribanAuthError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Veriban bağlantı ayarları bulunamadı. Lütfen ayarlardan Veriban entegrasyonunu yapılandırın.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🔑 [Veriban] Auth credentials found');

    // Get or create valid session code
    const sessionResult = await getValidSessionCode(supabase, veribanAuth);
    
    if (!sessionResult.success || !sessionResult.sessionCode) {
      console.error('❌ [Veriban] Session error:', sessionResult.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: sessionResult.error || 'Oturum oluşturulamadı'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const sessionCode = sessionResult.sessionCode;
    console.log('✅ [Veriban] Valid session code obtained');

    // Download SALES invoice XML (NOT purchase!)
    console.log('📥 [Veriban] Downloading SALES invoice XML...');
    const downloadResult = await VeribanSoapClient.downloadSalesInvoice(
      sessionCode,
      {
        invoiceUUID: invoiceUUID,
        downloadDataType: 'XML_INZIP' // ZIP içinde XML
      },
      veribanAuth.webservice_url
    );

    if (!downloadResult.success || !downloadResult.data?.binaryData) {
      console.error('❌ [Veriban] Download failed:', downloadResult.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: downloadResult.error || 'Giden fatura indirilemedi'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ [Veriban] Sales invoice downloaded successfully');
    console.log('📦 [Veriban] Binary data length:', downloadResult.data.binaryData.length);

    // Decode base64 ZIP
    const zipData = VeribanSoapClient.decodeBase64(downloadResult.data.binaryData);
    console.log('📦 [Veriban] ZIP data size:', zipData.length, 'bytes');

    // Extract XML from ZIP
    console.log('📂 [Veriban] Extracting XML from ZIP...');
    const zipjs = await import('https://deno.land/x/zipjs@v2.7.32/index.js');
    
    // Create blob from Uint8Array
    const zipBlob = new Blob([zipData as BlobPart]);
    const zipReader = new zipjs.ZipReader(
      new zipjs.BlobReader(zipBlob)
    );
    
    const entries = await zipReader.getEntries();
    console.log('📁 [Veriban] ZIP entries:', entries.length);

    if (entries.length === 0) {
      await zipReader.close();
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ZIP dosyası boş'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get first XML file
    const xmlEntry = entries.find((entry: any) => entry.filename.toLowerCase().endsWith('.xml'));
    if (!xmlEntry) {
      await zipReader.close();
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ZIP içinde XML dosyası bulunamadı'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📄 [Veriban] XML file found:', xmlEntry.filename);

    // Extract XML content
    const xmlTextWriter = new zipjs.TextWriter();
    const xmlContent = await xmlEntry.getData!(xmlTextWriter);
    await zipReader.close();

    console.log('✅ [Veriban] XML extracted, length:', xmlContent.length);
    console.log('📄 [Veriban] XML preview (first 1000 chars):', xmlContent.substring(0, 1000));
    console.log('📄 [Veriban] XML preview (last 500 chars):', xmlContent.substring(xmlContent.length - 500));
    
    // 🔍 TAM XML'İ LOGLAYALIM
    console.log('\n' + '='.repeat(80));
    console.log('📄📄📄 FULL SALES INVOICE XML CONTENT 📄📄📄');
    console.log('='.repeat(80));
    console.log(xmlContent);
    console.log('='.repeat(80) + '\n');

    // Parse XML to extract invoice items (FOR SALES INVOICE - CUSTOMER INFO)
    console.log('🔍 [Veriban] Parsing sales invoice XML...');
    const invoiceDetails = parseVeribanSalesInvoiceXML(xmlContent);

    console.log('✅ [Veriban] Sales invoice parsed successfully');
    console.log('📊 [Veriban] Items count:', invoiceDetails.items.length);

    return new Response(
      JSON.stringify({
        success: true,
        data: invoiceDetails
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ [Veriban Sales Invoice Details] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Giden fatura detayları alınırken hata oluştu'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Parse Veriban SALES Invoice XML (UBL-TR Format)
 * 
 * Giden fatura XML'ini parse eder, MÜŞTERİ bilgilerini çıkarır (AccountingCustomerParty)
 */
function parseVeribanSalesInvoiceXML(xmlContent: string): any {
  try {
    console.log('\n' + '🔍'.repeat(40));
    console.log('🔍 [Parser] Starting SALES invoice XML parse...');
    console.log('🔍'.repeat(40) + '\n');
    
    // ========================================
    // 1️⃣ INVOICE LINES (FATURA KALEMLERİ)
    // ========================================
    console.log('\n📦 1️⃣ EXTRACTING INVOICE LINES...\n');
    
    const invoiceLineRegex = /<cac:InvoiceLine[\s\S]*?<\/cac:InvoiceLine>/g;
    const invoiceLines = xmlContent.match(invoiceLineRegex) || [];
    
    console.log('📋 [Parser] Found invoice lines:', invoiceLines.length);
    
    const items: any[] = [];
    
    for (let i = 0; i < invoiceLines.length; i++) {
      const line = invoiceLines[i];
      
      console.log(`\n🔍 [Parser] Processing line ${i + 1}/${invoiceLines.length}`);
      
      // Line number
      const lineNumberMatch = line.match(/<cbc:ID[^>]*>(.*?)<\/cbc:ID>/);
      const lineNumber = lineNumberMatch ? parseInt(lineNumberMatch[1].trim()) : i + 1;
      
      // Quantity
      const quantityMatch = line.match(/<cbc:InvoicedQuantity[^>]*>(.*?)<\/cbc:InvoicedQuantity>/);
      const quantity = quantityMatch ? parseFloat(quantityMatch[1].trim()) : 0;
      
      // Unit
      const unitCodeMatch = line.match(/<cbc:InvoicedQuantity[^>]*unitCode="([^"]*)"[^>]*>/);
      const unit = unitCodeMatch ? unitCodeMatch[1].trim() : 'Adet';
      
      // Line Extension Amount
      const lineExtensionMatch = line.match(/<cbc:LineExtensionAmount[^>]*>(.*?)<\/cbc:LineExtensionAmount>/);
      const lineExtensionAmount = lineExtensionMatch ? parseFloat(lineExtensionMatch[1].trim()) : 0;
      
      // Unit Price
      const priceAmountMatch = line.match(/<cbc:PriceAmount[^>]*>(.*?)<\/cbc:PriceAmount>/);
      const unitPrice = priceAmountMatch ? parseFloat(priceAmountMatch[1].trim()) : 0;
      
      // Item Name/Description
      const itemSectionMatch = line.match(/<cac:Item[\s\S]*?<\/cac:Item>/);
      const itemSection = itemSectionMatch ? itemSectionMatch[0] : '';
      
      const itemNameMatch = itemSection.match(/<cbc:Name[^>]*>(.*?)<\/cbc:Name>/);
      const itemName = itemNameMatch ? itemNameMatch[1].trim() : '';
      
      const itemDescMatch = itemSection.match(/<cbc:Description[^>]*>(.*?)<\/cbc:Description>/);
      const itemDescription = itemDescMatch ? itemDescMatch[1].trim() : '';
      
      const description = itemName || itemDescription || 'Ürün/Hizmet';
      
      // Product Code
      const sellerItemIdMatch = line.match(/<cac:SellersItemIdentification[\s\S]*?<cbc:ID[^>]*>(.*?)<\/cbc:ID>[\s\S]*?<\/cac:SellersItemIdentification>/);
      const productCode = sellerItemIdMatch ? sellerItemIdMatch[1].trim() : '';
      
      // VAT
      const taxTotalMatch = line.match(/<cac:TaxTotal[\s\S]*?<cbc:TaxAmount[^>]*>(.*?)<\/cbc:TaxAmount>[\s\S]*?<\/cac:TaxTotal>/);
      const vatAmount = taxTotalMatch ? parseFloat(taxTotalMatch[1].trim()) : 0;
      
      const vatRateMatch = line.match(/<cbc:Percent[^>]*>(.*?)<\/cbc:Percent>/);
      const vatRate = vatRateMatch ? parseFloat(vatRateMatch[1].trim()) : 18;
      
      // Discount
      const allowanceChargeMatch = line.match(/<cac:AllowanceCharge[\s\S]*?<cbc:Amount[^>]*>(.*?)<\/cbc:Amount>[\s\S]*?<\/cac:AllowanceCharge>/);
      const discountAmount = allowanceChargeMatch ? parseFloat(allowanceChargeMatch[1].trim()) : 0;
      
      const totalAmount = lineExtensionAmount + vatAmount;
      
      const item = {
        id: `line-${lineNumber}`,
        lineNumber: lineNumber,
        description: description,
        productCode: productCode,
        quantity: quantity,
        unit: unit,
        unitPrice: unitPrice,
        vatRate: vatRate,
        vatAmount: vatAmount,
        totalAmount: totalAmount,
        discountRate: 0,
        discountAmount: discountAmount,
        isMatched: false
      };
      
      items.push(item);
      console.log('  ✅ Item added:', JSON.stringify(item, null, 2));
    }
    
    // ========================================
    // 2️⃣ INVOICE HEADER
    // ========================================
    console.log('\n📋 2️⃣ EXTRACTING INVOICE HEADER...\n');
    
    const invoiceNumberMatch = xmlContent.match(/<cbc:ID[^>]*>(.*?)<\/cbc:ID>/);
    const invoiceNumber = invoiceNumberMatch ? invoiceNumberMatch[1].trim() : '';
    
    const invoiceDateMatch = xmlContent.match(/<cbc:IssueDate[^>]*>(.*?)<\/cbc:IssueDate>/);
    const invoiceDate = invoiceDateMatch ? invoiceDateMatch[1].trim() : '';
    
    const dueDateMatch = xmlContent.match(/<cbc:DueDate[^>]*>(.*?)<\/cbc:DueDate>/);
    const dueDate = dueDateMatch ? dueDateMatch[1].trim() : '';
    
    const currencyMatch = xmlContent.match(/currencyID="([^"]*)"/) || xmlContent.match(/<cbc:DocumentCurrencyCode[^>]*>(.*?)<\/cbc:DocumentCurrencyCode>/);
    const currency = currencyMatch ? currencyMatch[1].trim() : 'TRY';
    
    // ========================================
    // 3️⃣ CUSTOMER INFO (MÜŞTERİ BİLGİLERİ) - NOT SUPPLIER!
    // ========================================
    console.log('\n👤 3️⃣ EXTRACTING CUSTOMER INFO (AccountingCustomerParty)...\n');
    
    // CUSTOMER Info (AccountingCustomerParty) - GİDEN FATURALARDA MÜŞTERİ BİLGİLERİ
    const customerPartyMatch = xmlContent.match(/<cac:AccountingCustomerParty[\s\S]*?<\/cac:AccountingCustomerParty>/);
    const customerPartyXml = customerPartyMatch ? customerPartyMatch[0] : '';
    console.log('📄 AccountingCustomerParty XML (FULL):');
    console.log(customerPartyXml);
    
    // Customer Name
    const customerNameMatch = customerPartyXml.match(/<cbc:Name[^>]*>(.*?)<\/cbc:Name>/);
    const customerName = customerNameMatch ? customerNameMatch[1].trim() : '';
    console.log('👤 Customer Name:', customerName, customerNameMatch ? '✅' : '❌');
    
    // Customer Tax Number (VKN)
    const vknMatch1 = customerPartyXml.match(/<cac:PartyIdentification[\s\S]*?<cbc:ID[^>]*schemeID\s*=\s*["']VKN["'][^>]*>(.*?)<\/cbc:ID>/i);
    const vknMatch2 = customerPartyXml.match(/<cac:PartyIdentification[\s\S]*?<cbc:ID[^>]*schemeID\s*=\s*["']TCKN["'][^>]*>(.*?)<\/cbc:ID>/i);
    const vknMatch3 = customerPartyXml.match(/<cac:PartyTaxScheme[\s\S]*?<cac:TaxScheme[\s\S]*?<cbc:ID[^>]*>(.*?)<\/cbc:ID>[\s\S]*?<\/cac:TaxScheme>/);
    const vknMatch4 = customerPartyXml.match(/<cac:PartyIdentification[\s\S]*?<cbc:ID[^>]*>(.*?)<\/cbc:ID>[\s\S]*?<\/cac:PartyIdentification>/);
    
    const customerTaxNumber = 
      (vknMatch1 && vknMatch1[1].trim()) ||
      (vknMatch2 && vknMatch2[1].trim()) ||
      (vknMatch3 && vknMatch3[1].trim()) ||
      (vknMatch4 && vknMatch4[1].trim()) ||
      '';
    
    console.log('✅ Customer Tax Number (VKN):', customerTaxNumber || '❌ NOT FOUND');
    
    // ========================================
    // 4️⃣ TOTALS
    // ========================================
    console.log('\n💰 4️⃣ EXTRACTING TOTALS...\n');
    
    const legalMonetaryMatch = xmlContent.match(/<cac:LegalMonetaryTotal[\s\S]*?<\/cac:LegalMonetaryTotal>/);
    const legalMonetaryXml = legalMonetaryMatch ? legalMonetaryMatch[0] : '';
    
    const lineExtensionTotalMatch = legalMonetaryXml.match(/<cbc:LineExtensionAmount[^>]*>(.*?)<\/cbc:LineExtensionAmount>/) ||
                                     xmlContent.match(/<cbc:LineExtensionAmount[^>]*>(.*?)<\/cbc:LineExtensionAmount>/);
    const lineExtensionTotal = lineExtensionTotalMatch ? parseFloat(lineExtensionTotalMatch[1].trim()) : 0;
    
    const taxExclusiveMatch = legalMonetaryXml.match(/<cbc:TaxExclusiveAmount[^>]*>(.*?)<\/cbc:TaxExclusiveAmount>/);
    const taxExclusiveAmount = taxExclusiveMatch ? parseFloat(taxExclusiveMatch[1].trim()) : lineExtensionTotal;
    
    const taxInclusiveMatch = legalMonetaryXml.match(/<cbc:TaxInclusiveAmount[^>]*>(.*?)<\/cbc:TaxInclusiveAmount>/);
    const taxInclusiveAmount = taxInclusiveMatch ? parseFloat(taxInclusiveMatch[1].trim()) : 0;
    
    const payableAmountMatch = legalMonetaryXml.match(/<cbc:PayableAmount[^>]*>(.*?)<\/cbc:PayableAmount>/) ||
                                xmlContent.match(/<cbc:PayableAmount[^>]*>(.*?)<\/cbc:PayableAmount>/);
    const payableAmount = payableAmountMatch ? parseFloat(payableAmountMatch[1].trim()) : taxInclusiveAmount;
    
    const taxTotalAmountMatch = xmlContent.match(/<cac:TaxTotal[\s\S]*?<cbc:TaxAmount[^>]*>(.*?)<\/cbc:TaxAmount>/);
    const taxTotalAmount = taxTotalAmountMatch ? parseFloat(taxTotalAmountMatch[1].trim()) : 0;
    
    // ========================================
    // 5️⃣ FINAL RESULT
    // ========================================
    const finalResult = {
      invoiceNumber,
      invoiceDate,
      InvoiceDate: invoiceDate, // Alias
      dueDate,
      DueDate: dueDate, // Alias
      customerName,
      customerTaxNumber,
      currency,
      CurrencyCode: currency, // Alias
      // Toplam tutarlar
      lineExtensionTotal: taxExclusiveAmount || lineExtensionTotal,
      taxTotalAmount: taxTotalAmount,
      payableAmount: payableAmount || (taxExclusiveAmount + taxTotalAmount),
      items: items,
      rawXml: xmlContent, // Debug için tam XML
      
      // customerInfo ve supplierInfo için uyumlu formatlar
      customerInfo: {
        companyName: customerName,
        taxNumber: customerTaxNumber
      },
      // Giden faturada biz satıcıyız, ama backward compatibility için boş bırakabiliriz
      supplierInfo: {
        companyName: '',
        taxNumber: ''
      }
    };
    
    console.log('\n' + '🎉'.repeat(40));
    console.log('🎉 FINAL PARSED SALES INVOICE RESULT:');
    console.log('🎉'.repeat(40));
    console.log(JSON.stringify(finalResult, null, 2));
    console.log('🎉'.repeat(40) + '\n');
    
    return finalResult;
    
  } catch (error: any) {
    console.error('❌ [Parser] Sales invoice parse error:', error);
    throw new Error('XML parse hatası: ' + error.message);
  }
}

