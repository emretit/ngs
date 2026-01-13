import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VeribanSoapClient } from '../_shared/veriban-soap-helper.ts';

/**
 * Veriban E-Arşiv Müşteri Bazlı Fatura ETTN Listesi Edge Function
 * 
 * Belirli bir müşterinin VKN/TCKN'si ile tarih aralığında kesilen
 * E-Arşiv faturalarının UUID (ETTN) listesini getirir.
 * 
 * Bu fonksiyon "müşteri geçmiş e-faturalar" gibi ekranlar için kullanılır.
 * 
 * Veriban Metodu: GetSalesInvoiceUUIDListWithCustomerRegisterNumber
 * 
 * @param customerRegisterNumber - Müşteri VKN veya TCKN (zorunlu)
 * @param startDate - Başlangıç tarihi (YYYY-MM-DD formatında, zorunlu)
 * @param endDate - Bitiş tarihi (YYYY-MM-DD formatında, zorunlu)
 * 
 * @returns {
 *   success: boolean,
 *   data?: {
 *     uuids: string[],  // ETTN/UUID listesi
 *     count: number,    // Toplam fatura sayısı
 *     customerRegisterNumber: string,
 *     startDate: string,
 *     endDate: string
 *   },
 *   error?: string
 * }
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    console.log('🔐 Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.error('❌ Authorization header missing');
      return new Response(JSON.stringify({
        success: false,
        error: 'Authorization header gerekli'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Token length:', token.length);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    console.log('👤 User auth result:', { 
      userFound: !!user, 
      userId: user?.id, 
      error: userError?.message 
    });

    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Geçersiz kullanıcı token',
        details: userError?.message
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile
    console.log('📋 Fetching profile for user:', user.id);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    console.log('🏢 Profile result:', { 
      profileFound: !!profile, 
      companyId: profile?.company_id, 
      error: profileError?.message 
    });

    if (profileError || !profile) {
      console.error('❌ Profile fetch failed:', profileError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Kullanıcı profili bulunamadı',
        details: profileError?.message || 'Profile is null'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { customerRegisterNumber, startDate, endDate } = await req.json();

    // Validate required parameters
    if (!customerRegisterNumber) {
      return new Response(JSON.stringify({
        success: false,
        error: 'customerRegisterNumber parametresi zorunludur (Müşteri VKN/TCKN)'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!startDate || !endDate) {
      return new Response(JSON.stringify({
        success: false,
        error: 'startDate ve endDate parametreleri zorunludur (YYYY-MM-DD formatında)'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Tarih formatı hatalı. YYYY-MM-DD formatında olmalıdır (örn: 2026-01-13)'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 E-Arşiv müşteri fatura ETTN listesi sorgulanıyor:', {
      customerRegisterNumber,
      startDate,
      endDate
    });

    // Get Veriban auth
    const { data: veribanAuth, error: authError } = await supabase
      .from('veriban_auth')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .single();

    if (authError || !veribanAuth) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Veriban kimlik doğrulama bilgileri bulunamadı.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // E-Arşiv için özel webservice URL
    const isTestMode = veribanAuth.webservice_url?.includes('test') || false;
    const earchiveWebserviceUrl = (veribanAuth as any).earchive_webservice_url || 
      (isTestMode 
        ? 'http://earsivtransfertest.veriban.com.tr/IntegrationService.svc'
        : 'http://earsivtransfer.veriban.com.tr/IntegrationService.svc'
      );
    
    console.log('🌐 E-Arşiv Webservice URL:', earchiveWebserviceUrl);

    // Login to Veriban
    const loginResult = await VeribanSoapClient.login(
      {
        username: veribanAuth.username,
        password: veribanAuth.password,
      },
      earchiveWebserviceUrl
    );

    if (!loginResult.success || !loginResult.sessionCode) {
      return new Response(JSON.stringify({
        success: false,
        error: loginResult.error || 'Veriban giriş başarısız'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sessionCode = loginResult.sessionCode;

    try {
      // Get Sales Invoice UUID List With Customer Register Number
      console.log('📋 Müşteri bazlı fatura UUID listesi getiriliyor...');
      const uuidListResult = await VeribanSoapClient.getSalesInvoiceUUIDListWithCustomerRegisterNumber(
        sessionCode,
        customerRegisterNumber,
        startDate,
        endDate,
        earchiveWebserviceUrl
      );

      if (!uuidListResult.success) {
        return new Response(JSON.stringify({
          success: false,
          error: uuidListResult.error || 'Fatura UUID listesi getirilemedi'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const uuids = uuidListResult.data || [];
      console.log(`✅ ${uuids.length} adet fatura UUID bulundu`);

      // Opsiyonel: UUID'leri veritabanındaki faturalarla eşleştir
      let matchedInvoices = [];
      if (uuids.length > 0) {
        const { data: invoices } = await supabase
          .from('sales_invoices')
          .select('id, fatura_no, fatura_tarihi, toplam_tutar, xml_data')
          .eq('company_id', profile.company_id)
          .eq('invoice_profile', 'EARSIVFATURA')
          .in('xml_data->>ettn', uuids);

        if (invoices && invoices.length > 0) {
          matchedInvoices = invoices.map(inv => ({
            id: inv.id,
            invoiceNumber: inv.fatura_no,
            invoiceDate: inv.fatura_tarihi,
            totalAmount: inv.toplam_tutar,
            ettn: (inv.xml_data as any)?.ettn
          }));
          console.log(`📊 ${matchedInvoices.length} fatura sistemde eşleşti`);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        data: {
          uuids,
          count: uuids.length,
          customerRegisterNumber,
          startDate,
          endDate,
          matchedInvoices: matchedInvoices.length > 0 ? matchedInvoices : undefined,
        },
        message: `${uuids.length} adet E-Arşiv fatura UUID'si başarıyla getirildi`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } finally {
      // Logout from Veriban
      try {
        await VeribanSoapClient.logout(sessionCode, earchiveWebserviceUrl);
      } catch (logoutError: any) {
        console.error('⚠️ Logout hatası:', logoutError.message);
      }
    }

  } catch (error: any) {
    console.error('❌ Veriban E-Arşiv müşteri fatura listesi hatası:', error);
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
