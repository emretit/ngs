/**
 * veriban-outgoing-invoices2 Edge Function
 * 
 * Veriban'dan giden e-faturaları çeker ve veritabanına kaydeder.
 * Bu versiyon müşteri VKN zorunluluğunu kaldırır ve tüm giden faturaları listeler.
 * 
 * Özellikler:
 * - Tüm giden faturaları listeler (müşteri VKN opsiyonel)
 * - Fatura durumlarını (stateCode, stateName) gösterir
 * - Cevap durumunu (answerStateCode, answerType) gösterir
 * - Cache mekanizması ile performans optimizasyonu
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VeribanSoapClient, getValidSessionCode } from '../_shared/veriban-soap-helper.ts';
import { parseUBLTRXML, decodeZIPAndExtractXML } from '../_shared/ubl-parser.ts';

// Kaynak limitini aşmamak için maksimum fatura sayısı
const MAX_INVOICES_PER_REQUEST = 50;
const BATCH_SIZE = 5;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Veriban durum kodları açıklamaları
const VERIBAN_STATE_CODES: Record<number, string> = {
  0: 'Beklemede',
  1: 'İşleniyor',
  2: 'Gönderildi',
  3: 'Teslim Edildi',
  4: 'Hata',
  5: 'İptal',
  6: 'Reddedildi',
  7: 'Kabul Edildi',
};

const VERIBAN_ANSWER_STATE_CODES: Record<number, string> = {
  0: 'Cevap Bekleniyor',
  1: 'Kabul Edildi',
  2: 'Reddedildi',
  3: 'İade Edildi',
};

interface OutgoingInvoiceData {
  id?: string;
  ettn: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  customer_name: string;
  customer_tax_number: string;
  customer_alias: string | null;
  tax_exclusive_amount: number;
  tax_total_amount: number;
  payable_amount: number;
  currency: string;
  invoice_type: string;
  invoice_profile: string;
  scenario: string;
  document_type: string;
  company_id: string;
  status: string;
  elogo_status: number | null;
  elogo_code: number | null;
  elogo_description: string | null;
  is_answered: boolean;
  answer_type: string | null;
  answer_description: string | null;
  answer_date: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  xml_content?: string; // 🔥 XML içeriği için eklendi
}

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
    
    // Parse request body first (only once)
    const requestBody = await req.json();
    
    // Try to get user from token
    let user: any;
    let profile: any;
    
    try {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !authUser) {
        console.log('⚠️ JWT verification failed, checking for direct company_id in request...');
        
        // For testing: allow direct company_id if no valid JWT
        if (requestBody.company_id) {
          console.log('✅ Using company_id from request body:', requestBody.company_id);
          profile = { company_id: requestBody.company_id };
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: 'Geçersiz kullanıcı token. Lütfen giriş yapın.'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        user = authUser;
        
        // Get user profile
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (profileError || !userProfile) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Kullanıcı profili bulunamadı'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        profile = userProfile;
      }
    } catch (error: any) {
      console.error('❌ Auth error:', error.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'Kimlik doğrulama hatası: ' + error.message
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract parameters from request body
    const { 
      startDate, 
      endDate, 
      forceRefresh = false, 
      customerTaxNumber,  // OPSİYONEL - Müşteri filtresi
      includeStatus = false,  // Durum bilgisi dahil edilsin mi
      limit = 100,  // Sayfa başına fatura sayısı
      offset = 0    // Sayfalama offset
    } = requestBody;

    // Validate dates
    let formattedStartDate: string | undefined;
    let formattedEndDate: string | undefined;

    console.log('📅 Raw dates from request:', { startDate, endDate });

    if (startDate) {
      const parsedStart = new Date(startDate);
      console.log('🔍 Parsing startDate:', { 
        input: startDate, 
        parsed: parsedStart.toISOString(), 
        isValid: !isNaN(parsedStart.getTime()) 
      });
      
      if (isNaN(parsedStart.getTime())) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Geçersiz startDate formatı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      formattedStartDate = parsedStart.toISOString().split('T')[0];
    }

    if (endDate) {
      const parsedEnd = new Date(endDate);
      console.log('🔍 Parsing endDate:', { 
        input: endDate, 
        parsed: parsedEnd.toISOString(), 
        isValid: !isNaN(parsedEnd.getTime()) 
      });
      
      if (isNaN(parsedEnd.getTime())) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Geçersiz endDate formatı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      formattedEndDate = parsedEnd.toISOString().split('T')[0];
    }

    console.log('✅ Formatted dates:', { formattedStartDate, formattedEndDate });

    console.log('📋 Veriban giden faturalar sorgulanıyor... (v2-all-invoices)');
    console.log('📅 Date Range:', formattedStartDate, '-', formattedEndDate);
    console.log('🔄 Force Refresh:', forceRefresh);
    console.log('🏢 Müşteri VKN (opsiyonel):', customerTaxNumber || '(tümü)');
    console.log('📊 Include Status:', includeStatus);
    console.log('👤 User ID:', user?.id || '(test mode)');
    console.log('🏢 Company ID:', profile.company_id);

    // ============ CACHE CHECK ============
    // If not force refresh, first check DB cache
    if (!forceRefresh) {
      let cacheQuery = supabase
        .from('outgoing_invoices')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('invoice_number', { ascending: false });

      if (formattedStartDate) {
        cacheQuery = cacheQuery.gte('invoice_date', formattedStartDate);
      }
      if (formattedEndDate) {
        cacheQuery = cacheQuery.lte('invoice_date', formattedEndDate);
      }
      // VKN filtresi - sadece geçerli ve dolu ise kullan
      if (customerTaxNumber && customerTaxNumber.length >= 10) {
        cacheQuery = cacheQuery.eq('customer_tax_number', customerTaxNumber);
      }

      // Apply pagination
      cacheQuery = cacheQuery.range(offset, offset + limit - 1);

      const { data: cachedInvoices, error: cacheError, count } = await cacheQuery;

      if (!cacheError && cachedInvoices && cachedInvoices.length > 0) {
        console.log(`✅ Cache'den ${cachedInvoices.length} fatura döndürülüyor`);
        
        // Transform cached data to expected format
        const formattedInvoices = cachedInvoices.map(inv => formatInvoiceResponse(inv));

        return new Response(JSON.stringify({
          success: true,
          invoices: formattedInvoices,
          totalCount: formattedInvoices.length,
          fromCache: true,
          pagination: {
            limit,
            offset,
            hasMore: formattedInvoices.length === limit
          },
          message: `${formattedInvoices.length} fatura cache'den yüklendi`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ============ FETCH FROM VERIBAN API ============
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
        error: 'Veriban kimlik doğrulama bilgileri bulunamadı. Lütfen Veriban ayarlarını kontrol edin.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get company info for logging
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('name, tax_number')
      .eq('id', profile.company_id)
      .single();

    if (companyError) {
      console.error('❌ Şirket bilgisi alınamadı:', companyError);
    }
    
    console.log('🏢 Şirket Bilgileri:', {
      name: companyData?.name,
      taxNumber: companyData?.tax_number,
      companyId: profile.company_id
    });

    // Get valid session code
    console.log('🔑 Getting valid session code...');
    const sessionResult = await getValidSessionCode(supabase, veribanAuth);

    if (!sessionResult.success || !sessionResult.sessionCode) {
      console.error('❌ Session code alınamadı:', sessionResult.error);
      return new Response(JSON.stringify({
        success: false,
        error: sessionResult.error || 'Veriban oturum açılamadı'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sessionCode = sessionResult.sessionCode;
    console.log('✅ Session code alındı');

    console.log('📋 Final formatted dates BEFORE try block:', { formattedStartDate, formattedEndDate });

    try {
      // Veriban API'sine boş tarih göndermeyelim - tarihler zorunlu
      if (!formattedStartDate || !formattedEndDate) {
        console.error('❌ Tarih aralığı belirtilmedi');
        return new Response(JSON.stringify({
          success: false,
          error: 'startDate ve endDate parametreleri zorunludur'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Tarih sırasını kontrol et
      const startDateObj = new Date(formattedStartDate);
      const endDateObj = new Date(formattedEndDate);
      
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        console.error('❌ Geçersiz tarih formatı:', formattedStartDate, formattedEndDate);
        return new Response(JSON.stringify({
          success: false,
          error: 'Geçersiz tarih formatı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Veriban API aynı tarihi kabul etmiyor - eğer aynıysa endDate'e 1 gün ekle
      if (startDateObj.getTime() === endDateObj.getTime()) {
        console.log('⚠️ startDate ve endDate aynı, endDate\'e 1 gün ekleniyor...');
        const newEndDate = new Date(endDateObj);
        newEndDate.setDate(newEndDate.getDate() + 1);
        formattedEndDate = newEndDate.toISOString().split('T')[0];
        console.log('✅ Yeni endDate:', formattedEndDate);
      }
      
      if (startDateObj > endDateObj) {
        console.error('❌ startDate endDate\'den büyük:', formattedStartDate, '>', formattedEndDate);
        console.error('❌ startDate timestamp:', startDateObj.getTime(), 'endDate timestamp:', endDateObj.getTime());
        return new Response(JSON.stringify({
          success: false,
          error: `startDate (${formattedStartDate}) endDate'den (${formattedEndDate}) büyük olamaz`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get Sales Invoice UUID List - müşteri VKN opsiyonel
      console.log('📊 GetSalesInvoiceUUIDList çağrılıyor...');
      console.log('📅 Tarih Aralığı:', { 
        startDate: formattedStartDate, 
        endDate: formattedEndDate
      });
      console.log('🌐 Webservice URL:', veribanAuth.webservice_url);

      const uuidListParams: {
        startDate: string;
        endDate: string;
        customerRegisterNumber?: string;
      } = {
        startDate: formattedStartDate, 
        endDate: formattedEndDate
      };

      // Müşteri VKN varsa ekle
      if (customerTaxNumber && customerTaxNumber.length >= 10) {
        uuidListParams.customerRegisterNumber = customerTaxNumber;
        console.log('🏢 Müşteri VKN filtresi:', customerTaxNumber);
      }
      
      const uuidListResult = await VeribanSoapClient.getSalesInvoiceUUIDList(
        sessionCode,
        uuidListParams,
        veribanAuth.webservice_url
      );

      console.log('📦 UUID List Response Success:', uuidListResult.success);

      if (!uuidListResult.success) {
        console.error('❌ UUID listesi alınamadı:', uuidListResult.error);
        return new Response(JSON.stringify({
          success: false,
          error: uuidListResult.error || 'Giden fatura listesi alınamadı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const uuidList = uuidListResult.data || [];
      console.log(`✅ ${uuidList.length} adet fatura UUID'si bulundu`);
      
      if (uuidList.length > 0) {
        console.log('📄 İlk 5 UUID:', uuidList.slice(0, 5));
      }

      if (uuidList.length === 0) {
        console.log('⚠️ Veriban API boş UUID listesi döndürdü');
        
        return new Response(JSON.stringify({
          success: true,
          invoices: [],
          totalCount: 0,
          fromCache: false,
          debug: {
            apiResponseSuccess: uuidListResult.success,
            uuidCount: 0,
            dateRange: { startDate: formattedStartDate, endDate: formattedEndDate },
            customerTaxNumber: customerTaxNumber || null
          },
          message: 'Seçili tarih aralığında giden fatura bulunamadı'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check which invoices are already in cache
      const { data: existingInvoices } = await supabase
        .from('outgoing_invoices')
        .select('ettn, id, updated_at')
        .eq('company_id', profile.company_id)
        .in('ettn', uuidList);

      const existingUUIDs = new Map((existingInvoices || []).map(inv => [inv.ettn || inv.id, inv]));
      const newUUIDs = uuidList.filter((uuid: string) => !existingUUIDs.has(uuid));

      console.log(`📦 ${existingUUIDs.size} fatura zaten cache'de, ${newUUIDs.length} yeni fatura çekilecek`);

      // Limit new invoices to process
      const invoiceUUIDsToFetch = newUUIDs.slice(0, MAX_INVOICES_PER_REQUEST);
      const processedInvoices: OutgoingInvoiceData[] = [];

      // Fetch new invoices in batches
      for (let batchStart = 0; batchStart < invoiceUUIDsToFetch.length; batchStart += BATCH_SIZE) {
        const batch = invoiceUUIDsToFetch.slice(batchStart, batchStart + BATCH_SIZE);
        console.log(`📦 Batch ${Math.floor(batchStart / BATCH_SIZE) + 1}: ${batch.length} fatura işleniyor...`);

        const batchPromises = batch.map(async (invoiceUUID: string, batchIndex: number) => {
          const globalIndex = batchStart + batchIndex;
          
          // Validate UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(invoiceUUID)) {
            console.error(`❌ Geçersiz UUID formatı: "${invoiceUUID}"`);
            return null;
          }
          
          console.log(`📄 Fatura ${globalIndex + 1}/${invoiceUUIDsToFetch.length} çekiliyor: ${invoiceUUID}`);

          try {
            // Download invoice XML
            const downloadResult = await VeribanSoapClient.downloadSalesInvoice(
              sessionCode,
              { invoiceUUID, downloadDataType: 'XML_INZIP' },
              veribanAuth.webservice_url
            );

            if (!downloadResult.success || !downloadResult.data?.binaryData) {
              console.error(`❌ Fatura indirilemedi: ${invoiceUUID}`);
              return null;
            }

            const xmlContent = await decodeZIPAndExtractXML(downloadResult.data.binaryData);
            if (!xmlContent) {
              console.error(`❌ XML decode edilemedi: ${invoiceUUID}`);
              return null;
            }
            console.log(`✅ XML decode edildi, uzunluk: ${xmlContent.length} karakter`);

            const parsedInvoice = parseUBLTRXML(xmlContent);
            if (!parsedInvoice) {
              console.error(`❌ XML parse edilemedi: ${invoiceUUID}`);
              return null;
            }
            console.log(`✅ XML parse edildi: ${invoiceUUID}`);
            console.log(`  📋 Fatura No: ${parsedInvoice.invoiceNumber}`);
            console.log(`  👤 Müşteri: ${parsedInvoice.customerInfo?.name || '(yok)'}`);
            console.log(`  🔢 Müşteri VKN: ${parsedInvoice.customerInfo?.taxNumber || '(YOK - SORUN BURADA!)'}`);
            console.log(`  💰 Tutar: ${parsedInvoice.payableAmount} ${parsedInvoice.currency}`);
            console.log(`  📦 Kalem sayısı: ${parsedInvoice.items?.length || 0}`);

            // Get invoice status if requested
            let statusData: any = null;
            if (includeStatus) {
              try {
                const statusResult = await VeribanSoapClient.getSalesInvoiceStatus(
                  sessionCode,
                  invoiceUUID,
                  veribanAuth.webservice_url
                );
                if (statusResult.success) {
                  statusData = statusResult.data;
                }
              } catch (statusError) {
                console.warn(`⚠️ Fatura durumu alınamadı: ${invoiceUUID}`);
              }
            }

            // Build invoice data
            const invoiceData: any = {
              ettn: invoiceUUID,
              invoice_number: parsedInvoice.invoiceNumber || '',
              customer_tax_number: parsedInvoice.customerInfo?.taxNumber || customerTaxNumber || '',
              customer_name: parsedInvoice.customerInfo?.name || '',
              customer_alias: null, // Will be fetched separately if needed
              invoice_date: parsedInvoice.invoiceDate?.split('T')[0] || new Date().toISOString().split('T')[0],
              invoice_time: parsedInvoice.invoiceTime || null,
              due_date: parsedInvoice.dueDate?.split('T')[0] || null,
              tax_exclusive_amount: parsedInvoice.taxExclusiveAmount || 0,
              tax_total_amount: parsedInvoice.taxTotalAmount || 0,
              payable_amount: parsedInvoice.payableAmount || 0,
              line_extension_amount: parsedInvoice.lineExtensionAmount || null,
              total_discount_amount: parsedInvoice.totalDiscountAmount || null,
              currency: parsedInvoice.currency || 'TRY',
              invoice_type: parsedInvoice.invoiceType || 'SATIS',
              invoice_profile: parsedInvoice.invoiceProfile || 'TEMELFATURA',
              invoice_note: parsedInvoice.invoiceNote || null,
              scenario: parsedInvoice.invoiceProfile?.includes('TICARIFATURA') ? 'TICARIFATURA' : 'TEMELFATURA',
              document_type: 'EINVOICE',
              company_id: profile.company_id,
              status: mapVeribanStateToStatus(statusData?.stateCode || 2),
              elogo_status: (statusData?.stateCode !== null && statusData?.stateCode !== undefined) ? statusData.stateCode : null,
              elogo_code: statusData?.answerStateCode || null,
              elogo_description: statusData?.stateDescription || null,
              is_answered: (statusData?.answerStateCode || 0) > 0,
              answer_type: mapAnswerTypeCode(statusData?.answerTypeCode),
              answer_description: statusData?.answerTypeDescription || null,
              answer_date: null,
              sent_at: parsedInvoice.invoiceDate || new Date().toISOString(),
              delivered_at: statusData?.stateCode === 3 ? new Date().toISOString() : null,
              notes: null,
              xml_content: xmlContent, // 🔥 XML içeriğini ekliyoruz
              
              // Supplier (AccountingSupplierParty) Information
              supplier_name: parsedInvoice.supplierInfo?.name || null,
              supplier_tax_number: parsedInvoice.supplierInfo?.taxNumber || null,
              supplier_tax_office: parsedInvoice.supplierInfo?.taxOffice || null,
              supplier_address_street: parsedInvoice.supplierInfo?.address?.street || null,
              supplier_address_city: parsedInvoice.supplierInfo?.address?.city || null,
              supplier_address_district: parsedInvoice.supplierInfo?.address?.district || null,
              supplier_contact_telephone: parsedInvoice.supplierInfo?.contact?.phone || null,
              supplier_contact_email: parsedInvoice.supplierInfo?.contact?.email || null,
              
              // Customer (AccountingCustomerParty) Extended Information
              customer_tax_office: parsedInvoice.customerInfo?.taxOffice || null,
              customer_address_street: parsedInvoice.customerInfo?.address?.street || null,
              customer_address_city: parsedInvoice.customerInfo?.address?.city || null,
              customer_address_district: parsedInvoice.customerInfo?.address?.district || null,
              customer_address_postal_zone: parsedInvoice.customerInfo?.address?.postalCode || null,
              customer_address_country: parsedInvoice.customerInfo?.address?.country || null,
              customer_contact_name: parsedInvoice.customerInfo?.contact?.name || null,
              customer_contact_telephone: parsedInvoice.customerInfo?.contact?.phone || null,
              customer_contact_email: parsedInvoice.customerInfo?.contact?.email || null,
              
              // Payment Information
              payment_means_code: parsedInvoice.paymentMeansCode || null,
              payment_channel_code: parsedInvoice.paymentChannelCode || null,
              payee_iban: parsedInvoice.payeeIBAN || null,
              payee_bank_name: parsedInvoice.payeeBankName || null,
              payment_terms_note: parsedInvoice.paymentTermsNote || null,
            };

            console.log(`📦 Invoice data hazırlandı:`);
            console.log(`  - customer_tax_number: "${invoiceData.customer_tax_number}" (${invoiceData.customer_tax_number?.length || 0} karakter)`);
            console.log(`  - xml_content: ${invoiceData.xml_content ? `${invoiceData.xml_content.length} karakter` : '(YOK - SORUN BURADA!)'}`);

            // Upsert to DB
            const { data: upsertedInvoice, error: upsertError } = await supabase
              .from('outgoing_invoices')
              .upsert(invoiceData, { onConflict: 'ettn' })
              .select()
              .single();

            if (upsertError) {
              console.error(`❌ Fatura kaydedilemedi: ${upsertError.message}`);
              return null;
            }

            console.log(`✅ Fatura kaydedildi: ${parsedInvoice.invoiceNumber || invoiceUUID}`);
            console.log(`  📄 DB'ye kaydedilen customer_tax_number: "${upsertedInvoice?.customer_tax_number || '(YOK)'}"`);
            console.log(`  📄 DB'ye kaydedilen xml_content length: ${upsertedInvoice?.xml_content?.length || 0}`);

            console.log(`✅ Fatura ${globalIndex + 1} kaydedildi: ${invoiceData.invoice_number}`);
            
            // 💡 Fatura kalemlerini kaydet
            console.log(`🔍 DEBUG: parsedInvoice.items kontrolü:`);
            console.log(`  - parsedInvoice.items var mı? ${parsedInvoice.items ? 'EVET' : 'HAYIR'}`);
            console.log(`  - parsedInvoice.items.length: ${parsedInvoice.items?.length || 0}`);
            console.log(`  - upsertedInvoice?.id: ${upsertedInvoice?.id || '(YOK)'}`);
            
            if (parsedInvoice.items && parsedInvoice.items.length > 0 && upsertedInvoice?.id) {
              console.log(`📝 ${parsedInvoice.items.length} kalem kaydediliyor...`);
              
              const invoiceItems = parsedInvoice.items.map((item: any, index: number) => ({
                outgoing_invoice_id: upsertedInvoice.id,
                company_id: profile.company_id,
                line_number: item.lineNumber || (index + 1),
                product_code: item.productCode || null,
                product_name: item.description || `Ürün ${index + 1}`,
                description: item.description || null,
                quantity: item.quantity || 1,
                unit: item.unit || 'Adet',
                unit_code: item.unitCode || null,  // 🔄 UBL-TR birim kodu eklendi
                unit_price: item.unitPrice || 0,
                gross_amount: (item.quantity || 1) * (item.unitPrice || 0),
                discount_rate: item.discountRate || 0,
                discount_amount: item.discountAmount || 0,
                tax_rate: item.vatRate || 18,
                tax_amount: item.vatAmount || 0,
                line_total: item.totalAmount || 0,
                line_total_with_tax: (item.totalAmount || 0) + (item.vatAmount || 0),
                gtip_code: item.gtipCode || null,
                notes: null,
              }));

              const { error: itemsError } = await supabase
                .from('outgoing_invoice_items')
                .upsert(invoiceItems, { 
                  onConflict: 'outgoing_invoice_id,line_number',
                  ignoreDuplicates: false 
                });

              if (itemsError) {
                console.error('⚠️ Fatura kalemleri kayıt hatası:', itemsError.message);
                console.error('⚠️ Hata detayları:', JSON.stringify(itemsError));
              } else {
                console.log(`✅ ${invoiceItems.length} kalem kaydedildi`);
              }
            } else {
              console.warn(`⚠️ Fatura kalemleri kaydedilmedi! Sebep:`);
              if (!parsedInvoice.items) {
                console.warn(`  - parsedInvoice.items undefined`);
              } else if (parsedInvoice.items.length === 0) {
                console.warn(`  - parsedInvoice.items.length = 0 (boş array)`);
              } else if (!upsertedInvoice?.id) {
                console.warn(`  - upsertedInvoice.id yok`);
              }
            }
            
            return { ...invoiceData, id: upsertedInvoice?.id };

          } catch (invoiceError: any) {
            console.error(`❌ Fatura işleme hatası:`, invoiceError.message);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        processedInvoices.push(...batchResults.filter((inv): inv is OutgoingInvoiceData => inv !== null));
        
        // Small delay between batches
        if (batchStart + BATCH_SIZE < invoiceUUIDsToFetch.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Fetch all invoices from cache for the date range
      let allInvoicesQuery = supabase
        .from('outgoing_invoices')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('invoice_number', { ascending: false });

      if (formattedStartDate) {
        allInvoicesQuery = allInvoicesQuery.gte('invoice_date', formattedStartDate);
      }
      if (formattedEndDate) {
        allInvoicesQuery = allInvoicesQuery.lte('invoice_date', formattedEndDate);
      }
      // VKN filtresi - sadece geçerli ve dolu ise kullan
      if (customerTaxNumber && customerTaxNumber.length >= 10) {
        allInvoicesQuery = allInvoicesQuery.eq('customer_tax_number', customerTaxNumber);
      }

      // Apply pagination
      allInvoicesQuery = allInvoicesQuery.range(offset, offset + limit - 1);

      const { data: allCachedInvoices } = await allInvoicesQuery;
      
      const allInvoices = (allCachedInvoices || []).map(inv => formatInvoiceResponse(inv));

      console.log(`✅ Toplam ${allInvoices.length} fatura döndürülüyor (${processedInvoices.length} yeni)`);

      return new Response(JSON.stringify({
        success: true,
        invoices: allInvoices,
        totalCount: allInvoices.length,
        newCount: processedInvoices.length,
        skippedCount: newUUIDs.length - invoiceUUIDsToFetch.length,
        fromCache: false,
        pagination: {
          limit,
          offset,
          hasMore: allInvoices.length === limit
        },
        dateRange: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        },
        message: `${allInvoices.length} giden fatura listelendi (${processedInvoices.length} yeni)`
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

  } catch (error: any) {
    console.error('❌ Veriban outgoing invoices v2 hatası:', error);
    console.error('❌ Error stack:', error.stack);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu',
      details: error.stack || error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Format invoice for API response
 */
function formatInvoiceResponse(inv: any) {
  return {
    // Temel Bilgiler
    id: inv.id,
    ettn: inv.ettn,
    invoiceNumber: inv.invoice_number || '',
    invoiceDate: inv.invoice_date || '',
    dueDate: inv.due_date || null,
    
    // Müşteri Bilgileri
    customerName: inv.customer_name || '',
    customerTaxNumber: inv.customer_tax_number || '',
    customerAlias: inv.customer_alias || null,
    
    // Tutar Bilgileri
    taxExclusiveAmount: parseFloat(inv.tax_exclusive_amount) || 0,
    taxTotalAmount: parseFloat(inv.tax_total_amount) || 0,
    payableAmount: parseFloat(inv.payable_amount) || 0,
    currency: inv.currency || 'TRY',
    
    // Fatura Türü Bilgileri
    invoiceType: inv.invoice_type || 'SATIS',
    invoiceProfile: inv.invoice_profile || 'TEMELFATURA',
    scenario: inv.scenario || 'TICARIFATURA',
    documentType: inv.document_type || 'EINVOICE',
    
    // Durum Bilgileri
    status: inv.status || 'sent',
    statusDescription: VERIBAN_STATE_CODES[inv.elogo_status] || inv.elogo_description || '',
    stateCode: inv.elogo_status || null,
    
    // Cevap Bilgileri
    isAnswered: inv.is_answered || false,
    answerType: inv.answer_type || null,
    answerDescription: inv.answer_description || null,
    answerDate: inv.answer_date || null,
    answerStateDescription: inv.answer_type ? VERIBAN_ANSWER_STATE_CODES[getAnswerStateCodeFromType(inv.answer_type)] : null,
    
    // Zaman Bilgileri
    sentAt: inv.sent_at || null,
    deliveredAt: inv.delivered_at || null,
    createdAt: inv.created_at || null,
    updatedAt: inv.updated_at || null,
    
    // Ek Bilgiler
    envelopeId: inv.envelope_id || null,
    refId: inv.ref_id || null,
    notes: inv.notes || null,
    pdfUrl: inv.pdf_url || null,
    xmlContent: inv.xml_content || null, // 🔥 XML içeriğini response'a ekliyoruz
  };
}

/**
 * Map Veriban state code to status string
 */
function mapVeribanStateToStatus(stateCode: number): string {
  switch (stateCode) {
    case 0:
    case 1:
      return 'pending';
    case 2:
      return 'sent';
    case 3:
      return 'delivered';
    case 4:
      return 'error';
    case 5:
      return 'cancelled';
    case 6:
      return 'rejected';
    case 7:
      return 'accepted';
    default:
      return 'sent';
  }
}

/**
 * Map answer type code to string
 */
function mapAnswerTypeCode(answerTypeCode: number | undefined): string | null {
  if (answerTypeCode === undefined || answerTypeCode === null || answerTypeCode === 0) {
    return null;
  }
  switch (answerTypeCode) {
    case 1:
      return 'KABUL';
    case 2:
      return 'RED';
    case 3:
      return 'IADE';
    default:
      return null;
  }
}

/**
 * Get answer state code from answer type string
 */
function getAnswerStateCodeFromType(answerType: string | null): number {
  if (!answerType) return 0;
  switch (answerType.toUpperCase()) {
    case 'KABUL':
      return 1;
    case 'RED':
      return 2;
    case 'IADE':
      return 3;
    default:
      return 0;
  }
}

