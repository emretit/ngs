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
        error: 'Veriban kimlik doğrulama bilgileri bulunamadı'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const requestBody = await req.json();
    const {
      action = 'getSalesInvoices', // getSalesInvoices or getPurchaseInvoices
      startDate,
      endDate,
      pageIndex = 1,
      pageSize = 100,
    } = requestBody;

    // Validate dates if provided
    let formattedStartDate: string | undefined;
    let formattedEndDate: string | undefined;

    if (startDate || endDate) {
      try {
        if (startDate) {
          const parsedStart = new Date(startDate);
          if (isNaN(parsedStart.getTime())) {
            throw new Error('Invalid startDate format');
          }
          formattedStartDate = parsedStart.toISOString().split('T')[0];
        }

        if (endDate) {
          const parsedEnd = new Date(endDate);
          if (isNaN(parsedEnd.getTime())) {
            throw new Error('Invalid endDate format');
          }
          formattedEndDate = parsedEnd.toISOString().split('T')[0];
        }

        if (formattedStartDate && formattedEndDate && formattedStartDate > formattedEndDate) {
          throw new Error('startDate cannot be after endDate');
        }
      } catch (dateError: any) {
        return new Response(JSON.stringify({
          success: false,
          error: `Geçersiz tarih formatı: ${dateError.message}. Format: YYYY-MM-DD veya ISO 8601`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log('📋 Veriban belge listesi sorgulanıyor...');
    console.log('📄 Action:', action);
    console.log('📅 Date Range:', formattedStartDate, '-', formattedEndDate);
    console.log('📊 Page:', pageIndex, 'Size:', pageSize);

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
    console.log('✅ Veriban login başarılı');

    try {
      // Call appropriate method based on action
      let listResult;
      
      if (action === 'getSalesInvoices') {
        console.log('📊 GetSalesInvoiceList çağrılıyor...');
        listResult = await VeribanSoapClient.getSalesInvoiceList(
          sessionCode,
          {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            pageIndex,
            pageSize,
          },
          veribanAuth.webservice_url
        );
      } else if (action === 'getPurchaseInvoices') {
        console.log('📊 GetPurchaseInvoiceList çağrılıyor...');
        listResult = await VeribanSoapClient.getPurchaseInvoiceList(
          sessionCode,
          {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            pageIndex,
            pageSize,
          },
          veribanAuth.webservice_url
        );
      } else {
        throw new Error(`Geçersiz action: ${action}. Geçerli değerler: getSalesInvoices, getPurchaseInvoices`);
      }

      if (!listResult.success) {
        console.error('❌ Invoice list başarısız:', listResult.error);
        return new Response(JSON.stringify({
          success: false,
          error: listResult.error || 'Fatura listesi alınamadı'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const invoices = listResult.data?.invoices || [];
      console.log('✅ Fatura listesi alındı');
      console.log('📊 Toplam fatura sayısı:', invoices.length);

      // Format invoices for response
      const formattedInvoices = invoices.map((inv: any) => ({
        invoiceUUID: inv.invoiceUUID,
        invoiceId: inv.invoiceId || inv.invoiceUUID,
      }));

      return new Response(JSON.stringify({
        success: true,
        invoices: formattedInvoices,
        totalCount: invoices.length,
        pageIndex,
        pageSize,
        message: `${invoices.length} adet fatura listelendi`
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
    console.error('❌ Veriban document list function hatası:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Bilinmeyen hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

