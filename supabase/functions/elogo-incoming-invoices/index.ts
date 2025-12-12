import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SoapClient } from '../_shared/soap-helper.ts';
import { parseUBLTRXML, decodeZIPAndExtractXML } from '../_shared/ubl-parser.ts';

// Kaynak limitini aşmamak için maksimum fatura sayısı
const MAX_INVOICES_PER_REQUEST = 5;

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
      console.error('❌ e-Logo auth bulunamadı:', {
        authError,
        companyId: profile.company_id,
        hasElogoAuth: !!elogoAuth
      });
      return new Response(JSON.stringify({ 
        success: false,
        error: 'e-Logo kimlik doğrulama bilgileri bulunamadı. Lütfen ayarlar sayfasından e-Logo bilgilerinizi girin.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate webservice URL
    if (!elogoAuth.webservice_url) {
      console.error('❌ e-Logo webservice URL bulunamadı');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'e-Logo webservice URL yapılandırılmamış. Lütfen ayarlar sayfasından e-Logo bilgilerinizi kontrol edin.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body safely
    let filters: any = {};
    try {
      const requestBody = await req.json();
      filters = requestBody?.filters || {};
      console.log('📨 Request body parsed:', { filters });
    } catch (parseError: any) {
      console.warn('⚠️ Request body parse hatası, varsayılan filtreler kullanılıyor:', parseError.message);
      // Continue with empty filters if parsing fails
    }

    // Parse date filters - default to current month if not provided
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Get dates in YYYY-MM-DD format first
    const startDateISO = filters?.startDate 
      ? filters.startDate.split('T')[0]
      : startOfMonth.toISOString().split('T')[0];
    const endDateISO = filters?.endDate 
      ? filters.endDate.split('T')[0]
      : endOfMonth.toISOString().split('T')[0];

    // Convert to DD.MM.YYYY format (e-Logo API format)
    const formatDateForElogo = (isoDate: string): string => {
      const [year, month, day] = isoDate.split('-');
      return `${day}.${month}.${year}`;
    };

    console.log('🔍 e-Logo gelen faturalar alınıyor...');
    console.log('📡 Webservice URL:', elogoAuth.webservice_url);
    console.log('👤 User ID:', user.id);
    console.log('🏢 Company ID:', profile.company_id);
    console.log('📅 Tarih aralığı (ISO):', { startDateISO, endDateISO });

    // e-Logo API sadece maksimum 30 günlük aralık destekliyor
    // Tarih aralığını 30 günlük parçalara bölelim
    const generateDateRanges = (start: string, end: string): Array<{start: string, end: string}> => {
      const ranges: Array<{start: string, end: string}> = [];
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      let currentStart = new Date(startDate);
      
      while (currentStart < endDate) {
        let currentEnd = new Date(currentStart);
        currentEnd.setDate(currentEnd.getDate() + 29); // 30 gün (başlangıç dahil)
        
        if (currentEnd > endDate) {
          currentEnd = new Date(endDate);
        }
        
        ranges.push({
          start: currentStart.toISOString().split('T')[0],
          end: currentEnd.toISOString().split('T')[0]
        });
        
        // Sonraki aralığın başlangıcı
        currentStart = new Date(currentEnd);
        currentStart.setDate(currentStart.getDate() + 1);
      }
      
      return ranges;
    };

    const dateRanges = generateDateRanges(startDateISO, endDateISO);
    console.log(`📅 Tarih aralığı ${dateRanges.length} parçaya bölündü:`, dateRanges);

    // Validate required fields
    if (!elogoAuth.username || !elogoAuth.password) {
      console.error('❌ e-Logo kimlik bilgileri eksik');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'e-Logo kullanıcı adı veya şifre eksik. Lütfen ayarlar sayfasından kontrol edin.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Login to e-Logo
    let loginResult;
    try {
      loginResult = await SoapClient.login(
        {
          username: elogoAuth.username,
          password: elogoAuth.password,
        },
        elogoAuth.webservice_url
      );
    } catch (loginError: any) {
      console.error('❌ e-Logo login exception:', loginError);
      return new Response(JSON.stringify({ 
        success: false,
        error: `e-Logo giriş hatası: ${loginError.message || 'Bilinmeyen hata'}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!loginResult || !loginResult.success || !loginResult.sessionID) {
      console.error('❌ e-Logo login başarısız:', loginResult);
      return new Response(JSON.stringify({ 
        success: false,
        error: loginResult?.error || 'e-Logo giriş başarısız'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sessionID = loginResult.sessionID;
    const invoices: any[] = [];
    let logoutAttempted = false;
    let allDocuments: any[] = [];

    try {
      // Her tarih aralığı için GetDocumentList çağır
      for (let rangeIndex = 0; rangeIndex < dateRanges.length; rangeIndex++) {
        const range = dateRanges[rangeIndex];
        const startDateElogo = formatDateForElogo(range.start);
        const endDateElogo = formatDateForElogo(range.end);
        
        console.log(`📋 Tarih aralığı ${rangeIndex + 1}/${dateRanges.length}: ${startDateElogo} - ${endDateElogo}`);
        
        const paramList = [
          `DOCUMENTTYPE=EINVOICE`,
          `BEGINDATE=${startDateElogo}`,
          `ENDDATE=${endDateElogo}`,
          `OPTYPE=2`, // 2 = Gelen faturalar
          `DATEBY=0`, // 0 = Oluşturma tarihi
        ];
        
        console.log('📋 GetDocumentList parametreleri:', paramList);

        const listResult = await SoapClient.getDocumentList(
          sessionID,
          paramList,
          elogoAuth.webservice_url
        );

        console.log('📊 GetDocumentList sonucu:', {
          success: listResult.success,
          documentCount: listResult.data?.documents?.length || 0
        });

        if (listResult.success && listResult.data?.documents) {
          allDocuments = allDocuments.concat(listResult.data.documents);
          console.log(`✅ Bu aralıkta ${listResult.data.documents.length} fatura bulundu`);
        } else {
          console.log('ℹ️ Bu tarih aralığında fatura bulunamadı');
        }
      }

      console.log(`✅ Toplam ${allDocuments.length} adet fatura UUID'si bulundu`);

      if (allDocuments.length === 0) {
        return new Response(JSON.stringify({ 
          success: true,
          invoices: [],
          message: 'Seçili tarih aralığında fatura bulunamadı'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Kaynak limitini aşmamak için maksimum fatura sayısı kadar işle
      const documentList = allDocuments.slice(0, MAX_INVOICES_PER_REQUEST);
      
      if (allDocuments.length > MAX_INVOICES_PER_REQUEST) {
        console.log(`⚠️ Toplam ${allDocuments.length} fatura var, kaynak limiti nedeniyle ilk ${MAX_INVOICES_PER_REQUEST} tanesi işlenecek`);
      }

      // Fetch and parse each invoice
      console.log(`🔄 ${documentList.length} adet fatura detayı çekiliyor...`);
      
      for (let i = 0; i < documentList.length; i++) {
        const doc = documentList[i];
        const invoiceUuid = doc.documentUuid;
        
        console.log(`📄 Fatura ${i + 1}/${documentList.length} çekiliyor (UUID: ${invoiceUuid?.substring(0, 8)}...)`);

        // Get document data with correct parameters
        let docResult;
        try {
          // KRITIK: DOCUMENTTYPE ve DATAFORMAT parametreleri zorunlu!
          const docParamList = [
            'DOCUMENTTYPE=EINVOICE',
            'DATAFORMAT=UBL'
          ];
          
          console.log(`📥 GetDocumentData çağrılıyor - UUID: ${invoiceUuid}, Params:`, docParamList);
          
          docResult = await SoapClient.getDocumentData(
            sessionID,
            invoiceUuid,
            docParamList,
            elogoAuth.webservice_url
          );
          
          // Debug log
          console.log(`📥 GetDocumentData response:`, {
            success: docResult?.success,
            resultCode: docResult?.resultCode,
            resultMsg: docResult?.resultMsg,
            hasBinaryData: !!docResult?.data?.binaryData,
            binaryDataLength: docResult?.data?.binaryData?.length || 0
          });
          
        } catch (docError: any) {
          console.error(`❌ GetDocumentData hatası (fatura ${i + 1}):`, {
            error: docError.message,
            stack: docError.stack
          });
          continue; // Skip this invoice and continue with next
        }

        if (!docResult || !docResult.success || !docResult.data?.binaryData) {
          console.error(`❌ Fatura verisi alınamadı: ${invoiceUuid}`, {
            success: docResult?.success,
            resultCode: docResult?.resultCode,
            resultMsg: docResult?.resultMsg,
            error: docResult?.error
          });
          continue;
        }

        // Decode ZIP and extract XML
        let xmlContent = '';
        try {
          xmlContent = await decodeZIPAndExtractXML(docResult.data.binaryData);
        } catch (decodeError: any) {
          console.error(`❌ ZIP decode hatası: ${decodeError.message}`);
          continue;
        }

        // Parse UBL-TR XML
        let parsedInvoice = null;
        try {
          parsedInvoice = parseUBLTRXML(xmlContent);
        } catch (parseError: any) {
          console.error(`❌ XML parse hatası: ${parseError.message}`);
        }

        // Extract envelopeId from GetDocumentData response
        const envelopeId = docResult.data.envelopeUUID || invoiceUuid;

        // Create invoice object (Nilvera formatına benzer)
        const invoice = parsedInvoice ? {
          id: parsedInvoice.ettn || invoiceUuid,
          invoiceNumber: parsedInvoice.invoiceNumber || `INV-${i + 1}`,
          supplierName: parsedInvoice.supplierInfo.name || 'e-Logo Fatura',
          supplierTaxNumber: parsedInvoice.supplierInfo.taxNumber || '',
          invoiceDate: parsedInvoice.invoiceDate || new Date().toISOString(),
          dueDate: parsedInvoice.dueDate || null,
          totalAmount: parsedInvoice.payableAmount || 0,
          paidAmount: 0,
          currency: parsedInvoice.currency || 'TRY',
          taxAmount: parsedInvoice.taxTotalAmount || 0,
          status: 'pending',
          responseStatus: 'pending',
          isAnswered: false,
          pdfUrl: null,
          xmlData: {
            raw: xmlContent,
            envelopeId,
          },
          // Additional fields
          invoiceType: parsedInvoice.invoiceType || 'SATIS',
          invoiceProfile: parsedInvoice.invoiceProfile || 'TEMELFATURA',
          items: parsedInvoice.items || [],
          ettn: parsedInvoice.ettn || invoiceUuid,
          envelopeId: envelopeId,
        } : {
          id: invoiceUuid,
          invoiceNumber: docResult.data.fileName || `INV-${i + 1}`,
          supplierName: 'e-Logo Fatura',
          supplierTaxNumber: '',
          invoiceDate: docResult.data.currentDate || new Date().toISOString(),
          dueDate: null,
          totalAmount: 0,
          paidAmount: 0,
          currency: 'TRY',
          taxAmount: 0,
          status: 'pending',
          responseStatus: 'pending',
          isAnswered: false,
          pdfUrl: null,
          xmlData: {
            ...docResult.data,
            envelopeId,
          },
          invoiceType: 'SATIS',
          invoiceProfile: 'TEMELFATURA',
          items: [],
          ettn: invoiceUuid,
          envelopeId: envelopeId,
        };

        invoices.push(invoice);
        console.log(`✅ Fatura ${i + 1}/${documentList.length} işlendi: ${invoice.invoiceNumber}`);
        
        // Fatura başarıyla işlendikten sonra GetDocumentDone çağır (alındı olarak işaretle)
        try {
          await SoapClient.getDocumentDone(
            sessionID,
            invoiceUuid,
            'EINVOICE',
            elogoAuth.webservice_url
          );
          console.log(`✅ Fatura alındı olarak işaretlendi: ${invoiceUuid.substring(0, 8)}...`);
        } catch (doneError: any) {
          console.warn(`⚠️ GetDocumentDone hatası (kritik değil): ${doneError.message}`);
        }
      }

      console.log(`✅ ${invoices.length} adet e-Logo fatura alındı ve işlendi`);

    } finally {
      // Always logout if we have a session ID
      if (sessionID && !logoutAttempted) {
        try {
          logoutAttempted = true;
          await SoapClient.logout(sessionID, elogoAuth.webservice_url);
          console.log('✅ e-Logo oturumu kapatıldı');
        } catch (logoutError: any) {
          console.error('⚠️ Logout hatası (kritik değil):', logoutError.message);
        }
      }
    }

    const hasMore = allDocuments.length > MAX_INVOICES_PER_REQUEST;
    
    return new Response(JSON.stringify({ 
      success: true,
      invoices,
      message: hasMore 
        ? `${invoices.length} adet fatura alındı (toplam ${allDocuments.length} faturadan)`
        : `${invoices.length} adet fatura alındı`,
      totalCount: allDocuments.length,
      hasMore
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ e-Logo incoming invoices function hatası:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    // Return more detailed error information
    const errorMessage = error.message || 'Bilinmeyen hata oluştu';
    const statusCode = error.status || error.statusCode || 500;
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      errorType: error.name || 'UnknownError',
      timestamp: new Date().toISOString()
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
