import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { invoiceId } = await req.json();
    
    if (!invoiceId) {
      throw new Error('invoiceId is required');
    }

    // Get user's company_id from profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      throw new Error('User profile or company not found');
    }

    // Get the company's Nilvera authentication data
    const { data: nilveraAuth, error: authError } = await supabaseClient
      .from('nilvera_auth')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .single();

    if (authError || !nilveraAuth) {
      throw new Error('Nilvera kimlik doğrulama bilgileri bulunamadı. Lütfen ayarlar sayfasından Nilvera bilgilerinizi girin.');
    }

    // Get the sales invoice to find the Nilvera invoice ID
    const { data: salesInvoice, error: invoiceError } = await supabaseClient
      .from('sales_invoices')
      .select('nilvera_invoice_id')
      .eq('id', invoiceId)
      .eq('company_id', profile.company_id)
      .single();

    if (invoiceError || !salesInvoice) {
      throw new Error('Fatura bulunamadı');
    }

    if (!salesInvoice.nilvera_invoice_id) {
      throw new Error('Bu faturanın Nilvera ID\'si bulunamadı. Fatura henüz Nilvera\'ya gönderilmemiş olabilir.');
    }

    // Call Nilvera API to get invoice tags
    const nilveraApiUrl = nilveraAuth.test_mode 
      ? `https://apitest.nilvera.com/einvoice/Sale/${salesInvoice.nilvera_invoice_id}/Tags`
      : `https://api.nilvera.com/einvoice/Sale/${salesInvoice.nilvera_invoice_id}/Tags`;

    console.log('🌐 Calling Nilvera API for invoice tags:', nilveraApiUrl);

    const nilveraResponse = await fetch(nilveraApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${nilveraAuth.api_key}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('📡 Nilvera API response status:', nilveraResponse.status);

    if (!nilveraResponse.ok) {
      const errorText = await nilveraResponse.text();
      console.error('❌ Nilvera API error:', errorText);
      throw new Error(`Nilvera API error: ${nilveraResponse.status} - ${errorText}`);
    }

    const tags = await nilveraResponse.json();
    console.log('✅ Invoice tags retrieved:', tags);

    return new Response(JSON.stringify({
      success: true,
      tags: tags,
      invoiceId: invoiceId,
      nilveraInvoiceId: salesInvoice.nilvera_invoice_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error getting invoice tags:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Fatura etiketleri alınırken hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
