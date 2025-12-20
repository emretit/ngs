import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { VeribanSoapClient, getValidSessionCode } from '../_shared/veriban-soap-helper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Veriban Invoice Details Edge Function
 * 
 * Bu fonksiyon Veriban'dan fatura detaylarını çeker:
 * 1. Fatura UUID ile faturayı indirir (XML formatında)
 * 2. XML'i parse eder
 * 3. Fatura kalemlerini döndürür
 * 
 * Bölüm 28: Gelen Faturayı İndirme (DownloadPurchaseInvoiceWithInvoiceUUID)
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
    console.log('🎯 [Veriban Invoice Details] Function invoked');
    
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

    // Download invoice XML
    console.log('📥 [Veriban] Downloading invoice XML...');
    const downloadResult = await VeribanSoapClient.downloadPurchaseInvoice(
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
          error: downloadResult.error || 'Fatura indirilemedi'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ [Veriban] Invoice downloaded successfully');
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
    
    // 🔍 TAM XML'İ LOGLAYALIM (Supabase Dashboard'da görebilmek için)
    console.log('\n' + '='.repeat(80));
    console.log('📄📄📄 FULL XML CONTENT 📄📄📄');
    console.log('='.repeat(80));
    console.log(xmlContent);
    console.log('='.repeat(80) + '\n');

    // Parse XML to extract invoice items
    console.log('🔍 [Veriban] Parsing XML...');
    const invoiceDetails = parseVeribanInvoiceXML(xmlContent);

    console.log('✅ [Veriban] Invoice parsed successfully');
    console.log('📊 [Veriban] Items count:', invoiceDetails.items.length);

    return new Response(
      JSON.stringify({
        success: true,
        invoiceDetails: invoiceDetails
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ [Veriban Invoice Details] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Fatura detayları alınırken hata oluştu'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Parse Veriban Invoice XML (UBL-TR Format)
 * 
 * UBL-TR e-Fatura XML formatını parse eder ve fatura kalemlerini çıkarır
 */
function parseVeribanInvoiceXML(xmlContent: string): any {
  try {
    console.log('\n' + '🔍'.repeat(40));
    console.log('🔍 [Parser] Starting XML parse...');
    console.log('🔍'.repeat(40) + '\n');
    
    // ========================================
    // 1️⃣ INVOICE LINES (FATURA KALEMLERİ)
    // ========================================
    console.log('\n📦 1️⃣ EXTRACTING INVOICE LINES...\n');
    
    // UBL-TR formatında fatura kalemleri <cac:InvoiceLine> tag'inde bulunur
    const invoiceLineRegex = /<cac:InvoiceLine[\s\S]*?<\/cac:InvoiceLine>/g;
    const invoiceLines = xmlContent.match(invoiceLineRegex) || [];
    
    console.log('📋 [Parser] Found invoice lines:', invoiceLines.length);
    
    // Her bir invoice line'ı ayrı ayrı yazdıralım
    invoiceLines.forEach((line, idx) => {
      console.log(`\n📄 Invoice Line ${idx + 1} RAW XML (first 500 chars):`);
      console.log(line.substring(0, 500));
      console.log('...');
    });
    
    const items: any[] = [];
    
    for (let i = 0; i < invoiceLines.length; i++) {
      const line = invoiceLines[i];
      
      console.log(`\n🔍 [Parser] Processing line ${i + 1}/${invoiceLines.length}`);
      console.log('📄 [Parser] Line XML (first 500 chars):', line.substring(0, 500));
      
      // Line number (ID)
      const lineNumberMatch = line.match(/<cbc:ID[^>]*>(.*?)<\/cbc:ID>/);
      const lineNumber = lineNumberMatch ? parseInt(lineNumberMatch[1].trim()) : i + 1;
      console.log('  📍 Line Number:', lineNumber);
      
      // Quantity
      const quantityMatch = line.match(/<cbc:InvoicedQuantity[^>]*>(.*?)<\/cbc:InvoicedQuantity>/);
      const quantity = quantityMatch ? parseFloat(quantityMatch[1].trim()) : 0;
      console.log('  📦 Quantity:', quantity, quantityMatch ? '✅' : '❌');
      
      // Unit
      const unitCodeMatch = line.match(/<cbc:InvoicedQuantity[^>]*unitCode="([^"]*)"[^>]*>/);
      const unit = unitCodeMatch ? unitCodeMatch[1].trim() : 'Adet';
      console.log('  📏 Unit:', unit);
      
      // Line Extension Amount (Mal Hizmet Tutarı - KDV hariç)
      const lineExtensionMatch = line.match(/<cbc:LineExtensionAmount[^>]*>(.*?)<\/cbc:LineExtensionAmount>/);
      const lineExtensionAmount = lineExtensionMatch ? parseFloat(lineExtensionMatch[1].trim()) : 0;
      console.log('  💵 Line Extension Amount:', lineExtensionAmount, lineExtensionMatch ? '✅' : '❌');
      
      // Unit Price
      const priceAmountMatch = line.match(/<cbc:PriceAmount[^>]*>(.*?)<\/cbc:PriceAmount>/);
      const unitPrice = priceAmountMatch ? parseFloat(priceAmountMatch[1].trim()) : 0;
      console.log('  💰 Unit Price:', unitPrice, priceAmountMatch ? '✅' : '❌');
      
      // Item Name/Description - DOĞRU PARSE
      // Önce <cac:Item> section'ını bul
      const itemSectionMatch = line.match(/<cac:Item[\s\S]*?<\/cac:Item>/);
      const itemSection = itemSectionMatch ? itemSectionMatch[0] : '';
      console.log('  📦 Item Section found:', itemSectionMatch ? '✅' : '❌');
      if (itemSection) {
        console.log('  📦 Item Section (first 300 chars):', itemSection.substring(0, 300));
      }
      
      // Item section içinden Name'i al (ürün adı)
      const itemNameMatch = itemSection.match(/<cbc:Name[^>]*>(.*?)<\/cbc:Name>/);
      const itemName = itemNameMatch ? itemNameMatch[1].trim() : '';
      console.log('  📝 Item Name (from Item section):', itemName || '(yok)', itemNameMatch ? '✅' : '❌');
      
      // Item section içinden Description'ı al (detaylı açıklama - opsiyonel)
      const itemDescMatch = itemSection.match(/<cbc:Description[^>]*>(.*?)<\/cbc:Description>/);
      const itemDescription = itemDescMatch ? itemDescMatch[1].trim() : '';
      console.log('  📝 Item Description:', itemDescription || '(yok)', itemDescMatch ? '✅' : '❌');
      
      // Final description - önce Name, sonra Description, sonra fallback
      const description = itemName || itemDescription || 'Ürün/Hizmet';
      console.log('  ✅ Final Description:', description);
      
      // Seller Item ID (Product Code)
      const sellerItemIdMatch = line.match(/<cac:SellersItemIdentification[\s\S]*?<cbc:ID[^>]*>(.*?)<\/cbc:ID>[\s\S]*?<\/cac:SellersItemIdentification>/);
      const productCode = sellerItemIdMatch ? sellerItemIdMatch[1].trim() : '';
      console.log('  🔖 Product Code:', productCode || '(yok)');
      
      // VAT (KDV)
      const taxTotalMatch = line.match(/<cac:TaxTotal[\s\S]*?<cbc:TaxAmount[^>]*>(.*?)<\/cbc:TaxAmount>[\s\S]*?<\/cac:TaxTotal>/);
      const vatAmount = taxTotalMatch ? parseFloat(taxTotalMatch[1].trim()) : 0;
      console.log('  🏦 VAT Amount:', vatAmount, taxTotalMatch ? '✅' : '❌');
      
      // VAT Rate (Percent)
      const vatRateMatch = line.match(/<cbc:Percent[^>]*>(.*?)<\/cbc:Percent>/);
      const vatRate = vatRateMatch ? parseFloat(vatRateMatch[1].trim()) : 18;
      console.log('  📊 VAT Rate:', vatRate + '%', vatRateMatch ? '✅' : '❌');
      
      // Discount
      const allowanceChargeMatch = line.match(/<cac:AllowanceCharge[\s\S]*?<cbc:Amount[^>]*>(.*?)<\/cbc:Amount>[\s\S]*?<\/cac:AllowanceCharge>/);
      const discountAmount = allowanceChargeMatch ? parseFloat(allowanceChargeMatch[1].trim()) : 0;
      console.log('  🎁 Discount Amount:', discountAmount);
      
      // Total Amount (Mal Hizmet Tutarı + KDV)
      const totalAmount = lineExtensionAmount + vatAmount;
      console.log('  💳 Total Amount:', totalAmount, '(lineExt + VAT)');
      
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
    
    console.log('\n✅ [Parser] Parsed items:', items.length);
    if (items.length > 0) {
      console.log('📊 [Parser] First item:', JSON.stringify(items[0], null, 2));
    }
    
    // ========================================
    // 2️⃣ INVOICE HEADER (FATURA BAŞLIĞI)
    // ========================================
    console.log('\n📋 2️⃣ EXTRACTING INVOICE HEADER...\n');
    
    // Invoice ID - İlk ID tag'i genellikle fatura numarasıdır
    const invoiceNumberMatch = xmlContent.match(/<cbc:ID[^>]*>(.*?)<\/cbc:ID>/);
    const invoiceNumber = invoiceNumberMatch ? invoiceNumberMatch[1].trim() : '';
    console.log('🔢 Invoice Number:', invoiceNumber, invoiceNumberMatch ? '✅' : '❌');
    
    // Issue Date
    const invoiceDateMatch = xmlContent.match(/<cbc:IssueDate[^>]*>(.*?)<\/cbc:IssueDate>/);
    const invoiceDate = invoiceDateMatch ? invoiceDateMatch[1].trim() : '';
    console.log('📅 Issue Date:', invoiceDate, invoiceDateMatch ? '✅' : '❌');
    
    // Due Date (Vade Tarihi)
    const dueDateMatch = xmlContent.match(/<cbc:DueDate[^>]*>(.*?)<\/cbc:DueDate>/);
    const dueDate = dueDateMatch ? dueDateMatch[1].trim() : '';
    console.log('📅 Due Date:', dueDate || '(yok)', dueDateMatch ? '✅' : '❌');
    
    // Currency Code
    const currencyMatch = xmlContent.match(/currencyID="([^"]*)"/) || xmlContent.match(/<cbc:DocumentCurrencyCode[^>]*>(.*?)<\/cbc:DocumentCurrencyCode>/);
    const currency = currencyMatch ? currencyMatch[1].trim() : 'TRY';
    console.log('💱 Currency:', currency);
    
    // ========================================
    // 3️⃣ SUPPLIER INFO (TEDARİKÇİ BİLGİLERİ)
    // ========================================
    console.log('\n🏢 3️⃣ EXTRACTING SUPPLIER INFO...\n');
    
    // Supplier Info (AccountingSupplierParty)
    const supplierPartyMatch = xmlContent.match(/<cac:AccountingSupplierParty[\s\S]*?<\/cac:AccountingSupplierParty>/);
    const supplierPartyXml = supplierPartyMatch ? supplierPartyMatch[0] : '';
    console.log('📄 AccountingSupplierParty XML (FULL):');
    console.log(supplierPartyXml);
    
    // Supplier Name
    const supplierNameMatch = supplierPartyXml.match(/<cbc:Name[^>]*>(.*?)<\/cbc:Name>/);
    const supplierName = supplierNameMatch ? supplierNameMatch[1].trim() : '';
    console.log('🏢 Supplier Name:', supplierName, supplierNameMatch ? '✅' : '❌');
    
    // Supplier Tax Number (VKN) - DOĞRU PARSE
    // UBL-TR'de VKN genellikle schemeID="VKN" ile işaretlenir
    console.log('\n🔍 Searching for VKN (Tax Number)...');
    
    // Yöntem 1: PartyIdentification içinde schemeID="VKN" olan ID
    const vknMatch1 = supplierPartyXml.match(/<cac:PartyIdentification[\s\S]*?<cbc:ID[^>]*schemeID\s*=\s*["']VKN["'][^>]*>(.*?)<\/cbc:ID>/i);
    console.log('  🔍 Method 1 (PartyIdentification with schemeID="VKN"):', vknMatch1 ? vknMatch1[1].trim() : '❌ Not found');
    
    // Yöntem 2: PartyIdentification içinde schemeID="TCKN" olan ID (bazen TCKN olarak da geçer)
    const vknMatch2 = supplierPartyXml.match(/<cac:PartyIdentification[\s\S]*?<cbc:ID[^>]*schemeID\s*=\s*["']TCKN["'][^>]*>(.*?)<\/cbc:ID>/i);
    console.log('  🔍 Method 2 (PartyIdentification with schemeID="TCKN"):', vknMatch2 ? vknMatch2[1].trim() : '❌ Not found');
    
    // Yöntem 3: PartyTaxScheme > TaxScheme > ID
    const vknMatch3 = supplierPartyXml.match(/<cac:PartyTaxScheme[\s\S]*?<cac:TaxScheme[\s\S]*?<cbc:ID[^>]*>(.*?)<\/cbc:ID>[\s\S]*?<\/cac:TaxScheme>/);
    console.log('  🔍 Method 3 (PartyTaxScheme > TaxScheme > ID):', vknMatch3 ? vknMatch3[1].trim() : '❌ Not found');
    
    // Yöntem 4: PartyIdentification içinde herhangi bir ID (fallback)
    const vknMatch4 = supplierPartyXml.match(/<cac:PartyIdentification[\s\S]*?<cbc:ID[^>]*>(.*?)<\/cbc:ID>[\s\S]*?<\/cac:PartyIdentification>/);
    console.log('  🔍 Method 4 (PartyIdentification any ID - fallback):', vknMatch4 ? vknMatch4[1].trim() : '❌ Not found');
    
    // Yöntem 5: PartyTaxScheme içinde direkt ID
    const vknMatch5 = supplierPartyXml.match(/<cac:PartyTaxScheme[\s\S]*?<cbc:ID[^>]*>(.*?)<\/cbc:ID>/);
    console.log('  🔍 Method 5 (PartyTaxScheme direct ID):', vknMatch5 ? vknMatch5[1].trim() : '❌ Not found');
    
    // En uygun eşleşmeyi seç (öncelik sırasına göre)
    const supplierTaxNumber = 
      (vknMatch1 && vknMatch1[1].trim()) ||  // Önce VKN schemeID'li
      (vknMatch2 && vknMatch2[1].trim()) ||  // Sonra TCKN schemeID'li
      (vknMatch3 && vknMatch3[1].trim()) ||  // Sonra TaxScheme içinden
      (vknMatch4 && vknMatch4[1].trim()) ||  // Sonra PartyIdentification'dan
      (vknMatch5 && vknMatch5[1].trim()) ||  // Son olarak PartyTaxScheme'den
      '';
    
    console.log('✅ Final Supplier Tax Number (VKN):', supplierTaxNumber || '❌ NOT FOUND');
    
    // ========================================
    // 4️⃣ TOTALS (TOPLAM TUTARLAR)
    // ========================================
    console.log('\n💰 4️⃣ EXTRACTING TOTALS...\n');
    
    // Totals (LegalMonetaryTotal)
    const legalMonetaryMatch = xmlContent.match(/<cac:LegalMonetaryTotal[\s\S]*?<\/cac:LegalMonetaryTotal>/);
    const legalMonetaryXml = legalMonetaryMatch ? legalMonetaryMatch[0] : '';
    console.log('📄 LegalMonetaryTotal XML:');
    console.log(legalMonetaryXml || '(not found)');
    
    // Line Extension Amount (Ara Toplam - KDV Hariç)
    const lineExtensionTotalMatch = legalMonetaryXml.match(/<cbc:LineExtensionAmount[^>]*>(.*?)<\/cbc:LineExtensionAmount>/) ||
                                     xmlContent.match(/<cbc:LineExtensionAmount[^>]*>(.*?)<\/cbc:LineExtensionAmount>/);
    const lineExtensionTotal = lineExtensionTotalMatch ? parseFloat(lineExtensionTotalMatch[1].trim()) : 0;
    console.log('💵 Line Extension Amount:', lineExtensionTotal, lineExtensionTotalMatch ? '✅' : '❌');
    
    // Tax Exclusive Amount (Vergi Hariç Tutar)
    const taxExclusiveMatch = legalMonetaryXml.match(/<cbc:TaxExclusiveAmount[^>]*>(.*?)<\/cbc:TaxExclusiveAmount>/);
    const taxExclusiveAmount = taxExclusiveMatch ? parseFloat(taxExclusiveMatch[1].trim()) : lineExtensionTotal;
    console.log('💵 Tax Exclusive Amount:', taxExclusiveAmount, taxExclusiveMatch ? '✅' : '❌');
    
    // Tax Inclusive Amount (Vergi Dahil Tutar)
    const taxInclusiveMatch = legalMonetaryXml.match(/<cbc:TaxInclusiveAmount[^>]*>(.*?)<\/cbc:TaxInclusiveAmount>/);
    const taxInclusiveAmount = taxInclusiveMatch ? parseFloat(taxInclusiveMatch[1].trim()) : 0;
    console.log('💵 Tax Inclusive Amount:', taxInclusiveAmount, taxInclusiveMatch ? '✅' : '❌');
    
    // Payable Amount (Ödenecek Tutar - Genel Toplam)
    const payableAmountMatch = legalMonetaryXml.match(/<cbc:PayableAmount[^>]*>(.*?)<\/cbc:PayableAmount>/) ||
                                xmlContent.match(/<cbc:PayableAmount[^>]*>(.*?)<\/cbc:PayableAmount>/);
    const payableAmount = payableAmountMatch ? parseFloat(payableAmountMatch[1].trim()) : taxInclusiveAmount;
    console.log('💰 Payable Amount:', payableAmount, payableAmountMatch ? '✅' : '❌');
    
    // Tax Total (Toplam KDV)
    const taxTotalAmountMatch = xmlContent.match(/<cac:TaxTotal[\s\S]*?<cbc:TaxAmount[^>]*>(.*?)<\/cbc:TaxAmount>/);
    const taxTotalAmount = taxTotalAmountMatch ? parseFloat(taxTotalAmountMatch[1].trim()) : 0;
    console.log('🏦 Tax Total Amount:', taxTotalAmount, taxTotalAmountMatch ? '✅' : '❌');
    
    console.log('\n📊 [Parser] FINAL TOTALS:', {
      lineExtensionTotal,
      taxExclusiveAmount,
      taxInclusiveAmount,
      payableAmount,
      taxTotalAmount,
      currency
    });
    
    console.log('\n🏢 [Parser] FINAL SUPPLIER:', {
      supplierName,
      supplierTaxNumber
    });
    
    // ========================================
    // 5️⃣ FINAL RESULT
    // ========================================
    const finalResult = {
      invoiceNumber,
      invoiceDate,
      dueDate,
      supplierName,
      supplierTaxNumber,
      currency,
      // Toplam tutarlar
      lineExtensionTotal: taxExclusiveAmount || lineExtensionTotal,
      taxTotalAmount: taxTotalAmount,
      payableAmount: payableAmount || (taxExclusiveAmount + taxTotalAmount),
      items: items,
      rawXml: xmlContent // Debug için tam XML
    };
    
    console.log('\n' + '🎉'.repeat(40));
    console.log('🎉 5️⃣ FINAL PARSED RESULT:');
    console.log('🎉'.repeat(40));
    console.log(JSON.stringify(finalResult, null, 2));
    console.log('🎉'.repeat(40) + '\n');
    
    return finalResult;
    
  } catch (error: any) {
    console.error('❌ [Parser] Parse error:', error);
    throw new Error('XML parse hatası: ' + error.message);
  }
}

