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
        error: 'e-Logo kimlik doğrulama bilgileri bulunamadı'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const requestBody = await req.json();
    const {
      documentType = 'EINVOICE',
      beginDate: rawBeginDate,
      endDate: rawEndDate,
      opType = '1', // 1: Giden, 2: Gelen
      dateBy = '0', // 0: Oluşturma tarihi, 1: Belge tarihi
    } = requestBody;

    // Validate required parameters
    if (!rawBeginDate || !rawEndDate) {
      return new Response(JSON.stringify({
        success: false,
        error: 'beginDate ve endDate parametreleri zorunludur (format: yyyy-MM-dd veya ISO 8601)'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate and format dates
    let beginDate: string;
    let endDate: string;

    try {
      // Parse and validate begin date
      const parsedBegin = new Date(rawBeginDate);
      if (isNaN(parsedBegin.getTime())) {
        throw new Error('Invalid beginDate format');
      }
      beginDate = parsedBegin.toISOString().split('T')[0];

      // Parse and validate end date
      const parsedEnd = new Date(rawEndDate);
      if (isNaN(parsedEnd.getTime())) {
        throw new Error('Invalid endDate format');
      }
      endDate = parsedEnd.toISOString().split('T')[0];

      // Validate date range
      if (parsedBegin > parsedEnd) {
        throw new Error('beginDate cannot be after endDate');
      }

      // Validate max range (1 year)
      const daysDiff = (parsedEnd.getTime() - parsedBegin.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 365) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Tarih aralığı maksimum 1 yıl olabilir'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

    } catch (dateError: any) {
      console.error('❌ Tarih validasyon hatası:', dateError.message);
      return new Response(JSON.stringify({
        success: false,
        error: `Geçersiz tarih formatı: ${dateError.message}. Format: YYYY-MM-DD veya ISO 8601`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📋 e-Logo belge listesi sorgulanıyor...');
    console.log('📄 Document Type:', documentType);
    console.log('📅 Date Range:', beginDate, '-', endDate);
    console.log('🔄 Op Type:', opType === '1' ? 'Giden' : 'Gelen');

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
    console.log('✅ e-Logo login başarılı');

    try {
      // Prepare parameters
      const paramList = [
        `DOCUMENTTYPE=${documentType}`,
        `BEGINDATE=${beginDate}`,
        `ENDDATE=${endDate}`,
        `OPTYPE=${opType}`,
        `DATEBY=${dateBy}`,
      ];

      console.log('📊 GetDocumentList çağrılıyor...');
      console.log('📋 Parameters:', paramList);

      // Query document list
      const listResult = await SoapClient.getDocumentList(
        sessionID,
        paramList,
        elogoAuth.webservice_url
      );

      if (!listResult.success) {
        console.error('❌ GetDocumentList başarısız:', listResult.error);
        return new Response(JSON.stringify({
          success: false,
          error: listResult.error || 'Belge listesi alınamadı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const documents = listResult.data?.documents || [];
      console.log('✅ Belge listesi alındı');
      console.log('📊 Toplam belge sayısı:', documents.length);

      // Format documents for response
      const formattedDocuments = documents.map((doc: any) => ({
        uuid: doc.documentUuid,
        documentId: doc.documentId,
        info: doc.docInfo,
        // Extract common fields from docInfo
        invoiceNumber: doc.docInfo?.INVOICENUMBER || doc.docInfo?.DOCUMENTNUMBER,
        invoiceDate: doc.docInfo?.INVOICEDATE || doc.docInfo?.DOCUMENTDATE,
        totalAmount: doc.docInfo?.PAYABLEAMOUNT || doc.docInfo?.TOTALAMOUNT,
        currency: doc.docInfo?.CURRENCY || 'TRY',
        supplierName: doc.docInfo?.SUPPLIERNAME,
        customerName: doc.docInfo?.CUSTOMERNAME,
        status: doc.docInfo?.STATUS,
        statusCode: doc.docInfo?.STATUSCODE,
      }));

      return new Response(JSON.stringify({
        success: true,
        documents: formattedDocuments,
        totalCount: documents.length,
        message: `${documents.length} adet belge listelendi`
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
    console.error('❌ e-Logo document list function hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

