import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Nilvera incoming invoices function started');
    console.log('📋 Request method:', req.method);
    
    const SUPABASE_URL = 'https://vwhwufnckpqirxptwncw.supabase.co';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log('✅ Supabase client created');

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header');
      throw new Error('Missing or invalid authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ Invalid user token:', userError);
      throw new Error('Invalid user token');
    }

    console.log('📨 Parsing request body...');
    const requestBody = await req.json();
    console.log('📨 Raw request body:', requestBody);
    
    const { filters } = requestBody;
    console.log('📨 Parsed request body:', { filters });
    console.log('👤 User ID:', user.id);

    // Get user's company_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    console.log('🏢 Profile query result:', { profile, profileError });

    if (profileError || !profile?.company_id) {
      console.error('❌ User profile or company not found');
      throw new Error('User profile or company not found');
    }

    console.log('🏢 Company ID:', profile.company_id);

    // Get the company's Nilvera authentication data
    const { data: nilveraAuth, error: authError } = await supabase
      .from('nilvera_auth')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .single();

    console.log('🔐 Nilvera auth query result:', { 
      hasAuth: !!nilveraAuth, 
      authError, 
      companyId: profile.company_id 
    });

    if (authError || !nilveraAuth) {
      console.error('❌ Nilvera auth bulunamadı:', authError);
      throw new Error('Nilvera kimlik doğrulama bilgileri bulunamadı. Lütfen ayarlar sayfasından Nilvera bilgilerinizi girin.');
    }

    // Fetch incoming invoices from Nilvera API
    try {
      console.log('🔄 Starting Nilvera API call for incoming invoices...');
      console.log('🔑 Using API key:', nilveraAuth.api_key ? `${nilveraAuth.api_key.substring(0, 8)}...` : 'MISSING');
      
      // Build query parameters - increase PageSize to get more invoices
      const queryParams = new URLSearchParams({
        Page: '1',
        PageSize: '100', // Increased from 50 to 100
        SortColumn: 'IssueDate',
        SortType: 'DESC',
        IsArchive: 'false',
        IsTransfer: 'false' // Sadece aktarılmamış (işlenmemiş) faturaları getir
      });
      
      // Add date filters - default to current month if not provided (max 6 months per Nilvera API)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const startDate = filters?.startDate || startOfMonth.toISOString().split('T')[0] + 'T00:00:00.000Z';
      const endDate = filters?.endDate || endOfMonth.toISOString().split('T')[0] + 'T23:59:59.999Z';
      
      queryParams.append('StartDate', startDate);
      queryParams.append('EndDate', endDate);
      
      console.log('📅 Date filter (current month):', { startDate, endDate });
      console.log('⚠️  Sadece aktarılmamış (işlenmemiş) faturalar getiriliyor (IsTransfer=false)');
      
      const apiUrl = `https://apitest.nilvera.com/einvoice/Purchase?${queryParams.toString()}`;
      console.log('🌐 Endpoint:', apiUrl);
      console.log('🔑 Full API Key (first 10 chars):', nilveraAuth.api_key?.substring(0, 10) + '...');
      
      const nilveraResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${nilveraAuth.api_key}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('📡 API Response Status:', nilveraResponse.status);
      console.log('📡 API Response Headers:', Object.fromEntries(nilveraResponse.headers.entries()));

      if (!nilveraResponse.ok) {
        const errorText = await nilveraResponse.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`Nilvera API error: ${nilveraResponse.status} - ${errorText}`);
      }

      const nilveraData = await nilveraResponse.json();
      console.log('✅ Nilvera API Response received');
      console.log('📊 Pagination info:', {
        Page: nilveraData.Page,
        PageSize: nilveraData.PageSize,
        TotalCount: nilveraData.TotalCount,
        TotalPages: nilveraData.TotalPages,
        ContentLength: nilveraData.Content?.length || 0
      });
      
      // Log all unique sender names to see variety
      const uniqueSenders = [...new Set(nilveraData.Content?.map(inv => inv.SenderName) || [])];
      console.log('🏢 Unique sender companies found:', uniqueSenders);
      console.log('📊 Total unique senders:', uniqueSenders.length);
      
      // Only log first invoice to avoid huge console output
      if (nilveraData.Content?.length > 0) {
        console.log('📄 First invoice sample:', nilveraData.Content[0]);
        console.log('🔍 IsTransfer field:', nilveraData.Content[0].IsTransfer);
        console.log('🔍 Available fields:', Object.keys(nilveraData.Content[0]));
      }

      // Transform Nilvera data to our format
      // Nilvera API returns { Page, PageSize, TotalCount, TotalPages, Content: [...] }
      const invoices = nilveraData.Content || [];
      console.log('📊 Raw invoices from API:', invoices.length);
      
      const transformedInvoices = invoices.map((invoice: any) => ({
        id: invoice.UUID,
        invoiceNumber: invoice.InvoiceNumber,
        supplierName: invoice.SenderName,
        supplierTaxNumber: invoice.SenderTaxNumber,
        invoiceDate: invoice.IssueDate,
        dueDate: null, // Nilvera API doesn't provide due date
        totalAmount: parseFloat(invoice.PayableAmount || 0),
        paidAmount: 0, // Not provided by Nilvera API
        currency: invoice.CurrencyCode || 'TRY',
        taxAmount: parseFloat(invoice.TaxTotalAmount || 0),
        status: invoice.StatusCode || 'pending',
        responseStatus: invoice.AnswerCode || 'pending',
        isAnswered: invoice.AnswerCode ? true : false,
        pdfUrl: null, // Would need separate API call
        xmlData: null, // Would need separate API call
        // Additional fields from Nilvera
        taxNumber: invoice.TaxNumber,
        invoiceProfile: invoice.InvoiceProfile,
        invoiceType: invoice.InvoiceType,
        taxExclusiveAmount: invoice.TaxExclusiveAmount,
        envelopeUUID: invoice.EnvelopeUUID,
        envelopeDate: invoice.EnvelopeDate,
        isRead: invoice.IsRead,
        isPrint: invoice.IsPrint,
        isArchive: invoice.IsArchive,
        isTransfer: invoice.IsTransfer,
        statusDetail: invoice.StatusDetail,
        createdDate: invoice.CreatedDate,
        tags: invoice.Tags || [],
        specialCode: invoice.SpecialCode,
        zirveStatus: invoice.ZirveStatus,
        luca: invoice.Luca
      }));

      return new Response(JSON.stringify({ 
        success: true,
        invoices: transformedInvoices,
        pagination: {
          page: nilveraData.Page,
          pageSize: nilveraData.PageSize,
          totalCount: nilveraData.TotalCount,
          totalPages: nilveraData.TotalPages
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (apiError) {
      console.error('❌ Nilvera API call failed:', apiError);
      console.error('❌ Error details:', {
        message: apiError.message,
        stack: apiError.stack,
        name: apiError.name
      });
      
      // Fallback to database data if API fails
      console.log('🔄 Falling back to database data...');
      const { data: invoices } = await supabase
        .from('einvoices_received')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Database fallback invoices:', invoices?.length || 0);

      const transformedInvoices = (invoices || []).map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoice_id || invoice.invoice_uuid,
        supplierName: invoice.supplier_name,
        supplierTaxNumber: invoice.supplier_vkn,
        invoiceDate: invoice.invoice_date,
        dueDate: null,
        totalAmount: invoice.total_amount || 0,
        paidAmount: 0,
        currency: invoice.currency || 'TRY',
        taxAmount: invoice.tax_amount || 0,
        status: invoice.invoice_state === 1 ? 'approved' : 'pending',
        responseStatus: invoice.response_sent ? 'sent' : 'pending',
        isAnswered: invoice.response_sent || false,
        pdfUrl: null,
        xmlData: invoice.xml_content ? JSON.parse(invoice.xml_content) : null
      }));

      return new Response(JSON.stringify({ 
        success: true,
        invoices: transformedInvoices,
        source: 'database_fallback',
        apiError: apiError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('❌ Error in nilvera-incoming-invoices function:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'An unknown error occurred',
      errorType: error.name || 'UnknownError',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
