import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VeribanSoapClient, getValidSessionCode } from '../_shared/veriban-soap-helper.ts';
import { parseUBLTRXML, decodeZIPAndExtractXML } from '../_shared/ubl-parser.ts';

// Kaynak limitini aşmamak için maksimum fatura sayısı
// Liste görünümü için daha az fatura işle (detaylar sonra açılabilir)
const MAX_INVOICES_PER_REQUEST = 20;

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
      startDate,
      endDate,
    } = requestBody;

    // Validate dates
    let formattedStartDate: string | undefined;
    let formattedEndDate: string | undefined;

    if (startDate) {
      const parsedStart = new Date(startDate);
      if (isNaN(parsedStart.getTime())) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Geçersiz startDate formatı. Format: YYYY-MM-DD veya ISO 8601'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      formattedStartDate = parsedStart.toISOString().split('T')[0];
    }

    if (endDate) {
      const parsedEnd = new Date(endDate);
      if (isNaN(parsedEnd.getTime())) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Geçersiz endDate formatı. Format: YYYY-MM-DD veya ISO 8601'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      formattedEndDate = parsedEnd.toISOString().split('T')[0];
    }

    if (formattedStartDate && formattedEndDate && formattedStartDate > formattedEndDate) {
      return new Response(JSON.stringify({
        success: false,
        error: 'startDate cannot be after endDate'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📋 Veriban gelen faturalar sorgulanıyor...');
    console.log('📅 Date Range:', formattedStartDate, '-', formattedEndDate);
    console.log('🔑 Company ID:', profile.company_id);
    console.log('👤 User ID:', user.id);

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
      // Step 1: Get Purchase Invoice UUID List
      console.log('📊 GetPurchaseInvoiceUUIDList çağrılıyor...');
      const uuidListResult = await VeribanSoapClient.getPurchaseInvoiceUUIDList(
        sessionCode,
        {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        },
        veribanAuth.webservice_url
      );

      if (!uuidListResult.success) {
        console.error('❌ UUID listesi alınamadı:', uuidListResult.error);
        return new Response(JSON.stringify({
          success: false,
          error: uuidListResult.error || 'UUID listesi alınamadı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const uuidList = uuidListResult.data || [];
      console.log(`✅ ${uuidList.length} adet fatura UUID'si bulundu`);

      if (uuidList.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          invoices: [],
          message: 'Seçili tarih aralığında fatura bulunamadı'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Limit the number of invoices to process
      const invoiceUUIDs = Array.isArray(uuidList) 
        ? uuidList.slice(0, MAX_INVOICES_PER_REQUEST)
        : [];

      if (uuidList.length > MAX_INVOICES_PER_REQUEST) {
        console.log(`⚠️ Toplam ${uuidList.length} fatura var, kaynak limiti nedeniyle ilk ${MAX_INVOICES_PER_REQUEST} tanesi işlenecek`);
      }

      // Step 2: Download and parse each invoice (sadece liste görünümü için)
      console.log(`🔄 ${invoiceUUIDs.length} adet fatura detayı çekiliyor (liste görünümü için)...`);
      const invoices: any[] = [];

      // Paralel işlem için batch size (CPU limit'i aşmamak için)
      const BATCH_SIZE = 5; // Her seferde 5 fatura işle
      
      for (let batchStart = 0; batchStart < invoiceUUIDs.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, invoiceUUIDs.length);
        const batch = invoiceUUIDs.slice(batchStart, batchEnd);
        
        console.log(`📦 Batch ${Math.floor(batchStart / BATCH_SIZE) + 1}: ${batch.length} fatura işleniyor...`);

        // Batch içindeki faturaları paralel işle
        const batchPromises = batch.map(async (invoiceUUID, batchIndex) => {
          const globalIndex = batchStart + batchIndex;
          console.log(`📄 Fatura ${globalIndex + 1}/${invoiceUUIDs.length} çekiliyor (UUID: ${invoiceUUID?.substring(0, 8)}...)`);

          try {
            // Download invoice
            const downloadResult = await VeribanSoapClient.downloadPurchaseInvoice(
              sessionCode,
              {
                invoiceUUID: invoiceUUID,
                downloadDataType: 'XML_INZIP',
              },
              veribanAuth.webservice_url
            );

            if (!downloadResult.success || !downloadResult.data?.binaryData) {
              const errorMsg = downloadResult.error || downloadResult.data?.downloadDescription || 'Bilinmeyen hata';
              console.error(`❌ Fatura indirilemedi: ${invoiceUUID}`, errorMsg);
              return null; // Return null for failed invoices
            }

            // Decode ZIP and extract XML
            let xmlContent: string | null = null;
            try {
              xmlContent = await decodeZIPAndExtractXML(downloadResult.data.binaryData);
              if (!xmlContent) {
                console.error(`❌ XML içeriği çıkarılamadı: ${invoiceUUID}`);
                return null;
              }
            } catch (decodeError: any) {
              console.error(`❌ ZIP decode hatası (${invoiceUUID}):`, decodeError.message);
              return null;
            }

            // Parse UBL-TR XML
            let parsedInvoice: any = null;
            try {
              parsedInvoice = parseUBLTRXML(xmlContent);
              if (!parsedInvoice) {
                console.error(`❌ XML parse edilemedi: ${invoiceUUID}`);
                return null;
              }
            } catch (parseError: any) {
              console.error(`❌ XML parse hatası (${invoiceUUID}):`, parseError.message);
              return null;
            }

            // Format invoice data - use parsed invoice structure from parseUBLTRXML
            // Liste görünümü için sadece temel bilgileri al, XML'i saklama (performans için)
            const formattedInvoice = {
              einvoice_id: invoiceUUID,
              invoiceNumber: parsedInvoice.invoiceNumber || '',
              invoiceDate: parsedInvoice.invoiceDate || new Date().toISOString(),
              dueDate: parsedInvoice.dueDate || undefined,
              supplierName: parsedInvoice.supplierInfo?.name || '',
              supplierTaxNumber: parsedInvoice.supplierInfo?.taxNumber || '',
              supplierVkn: parsedInvoice.supplierInfo?.taxNumber || '',
              totalAmount: parsedInvoice.payableAmount || parsedInvoice.taxExclusiveAmount + parsedInvoice.taxTotalAmount || 0,
              taxAmount: parsedInvoice.taxTotalAmount || 0,
              currency: parsedInvoice.currency || 'TRY',
              invoiceType: parsedInvoice.invoiceType || 'TEMEL',
              invoiceProfile: parsedInvoice.invoiceProfile || 'TEMELFATURA',
              // XML'i saklama - liste görünümü için gerekli değil, detay sayfasında indirilebilir
              // xmlContent: xmlContent,
              // rawData: parsedInvoice,
            };

            console.log(`✅ Fatura ${globalIndex + 1} başarıyla işlendi: ${formattedInvoice.invoiceNumber}`);
            return formattedInvoice;

          } catch (invoiceError: any) {
            console.error(`❌ Fatura işleme hatası (${globalIndex + 1}):`, invoiceError.message);
            return null;
          }
        });

        // Batch'i bekle ve sonuçları topla
        const batchResults = await Promise.all(batchPromises);
        const successfulInvoices = batchResults.filter(inv => inv !== null);
        invoices.push(...successfulInvoices);
        
        console.log(`✅ Batch tamamlandı: ${successfulInvoices.length}/${batch.length} fatura başarılı`);
        
        // CPU limit'i aşmamak için kısa bir bekleme
        if (batchEnd < invoiceUUIDs.length) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms bekleme
        }
      }

      console.log(`✅ Toplam ${invoices.length} adet fatura başarıyla işlendi`);

      return new Response(JSON.stringify({
        success: true,
        invoices: invoices,
        totalCount: invoices.length,
        message: `${invoices.length} adet gelen fatura listelendi`
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
    console.error('❌ Veriban incoming invoices function hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

