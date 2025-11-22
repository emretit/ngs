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
    console.log('🚀 Nilvera check status function started');
    console.log('📋 Request method:', req.method);
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL) {
      console.error('❌ SUPABASE_URL is not set');
      throw new Error('SUPABASE_URL environment variable is required');
    }
    
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
    
    const { salesInvoiceId } = requestBody;
    console.log('📨 Parsed request body:', { salesInvoiceId });
    console.log('👤 User ID:', user.id);

    // Validate required fields
    if (!salesInvoiceId) {
      console.error('❌ salesInvoiceId is required');
      throw new Error('salesInvoiceId is required');
    }

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

    // Check invoice status
    try {
      console.log('🔍 Checking invoice status...');
      
      // Get tracking record
      const { data: tracking, error: trackingError } = await supabase
        .from('einvoice_status_tracking')
        .select('*')
        .eq('sales_invoice_id', salesInvoiceId)
        .eq('company_id', profile.company_id)
        .single();

      if (trackingError || !tracking) {
        throw new Error('Tracking record not found');
      }

      if (!tracking.nilvera_invoice_id) {
        throw new Error('Nilvera invoice ID not found');
      }

      // Get Nilvera auth settings
      const { data: nilveraAuth, error: authError } = await supabase
        .from('nilvera_auth')
        .select('*')
        .eq('company_id', profile.company_id)
        .single();

      if (authError || !nilveraAuth) {
        throw new Error('Nilvera API ayarları bulunamadı. Lütfen önce API anahtarlarınızı ayarlayın.');
      }

      // Check status from Nilvera API
      const statusApiUrl = nilveraAuth.test_mode 
        ? `https://apitest.nilvera.com/einvoice/Status/${tracking.nilvera_invoice_id}`
        : `https://api.nilvera.com/einvoice/Status/${tracking.nilvera_invoice_id}`;

      console.log('🌐 Checking status at:', statusApiUrl);

      const statusResponse = await fetch(statusApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${nilveraAuth.api_key}`,
          'Content-Type': 'application/json'
        }
      });

      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      console.log('📊 Status check result:', statusData);

      // Update tracking record
      const { error: updateError } = await supabase
        .from('einvoice_status_tracking')
        .update({
          transfer_state: statusData.transferState,
          invoice_state: statusData.invoiceState,
          answer_type: statusData.answerType,
          status: statusData.status || tracking.status,
          delivered_at: statusData.deliveredAt ? new Date(statusData.deliveredAt).toISOString() : null,
          responded_at: statusData.respondedAt ? new Date(statusData.respondedAt).toISOString() : null,
          nilvera_response: statusData,
          updated_at: new Date().toISOString()
        })
        .eq('id', tracking.id);

      if (updateError) {
        console.error('❌ Error updating tracking:', updateError);
      }

      return new Response(JSON.stringify({ 
        success: true,
        status: statusData.status,
        data: statusData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error: any) {
      console.error('❌ Status check error:', error);
      
      return new Response(JSON.stringify({ 
        success: false,
        error: error.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('❌ Error in nilvera-check-status function:', error);
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
