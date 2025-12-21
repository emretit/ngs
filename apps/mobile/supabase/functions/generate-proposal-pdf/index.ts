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
    console.log('🚀 Generate Proposal PDF function started');
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://vwhwufnckpqirxptwncw.supabase.co';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const requestBody = await req.json();
    const { proposalId, templateId } = requestBody;

    if (!proposalId) {
      throw new Error('proposalId is required');
    }

    // Get proposal data with relations
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select(`
        *,
        customer:customers(*),
        employee:employees(id, first_name, last_name, email, phone, position)
      `)
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      throw new Error('Proposal not found');
    }

    // Get company settings
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    let company = null;
    if (profile?.company_id) {
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();
      company = companyData;
    }

    // Transform proposal to QuoteData format (web app format)
    const quoteData = {
      id: proposal.id,
      number: proposal.number || proposal.proposal_number || '',
      title: proposal.title || '',
      description: proposal.description || '',
      customer: proposal.customer ? {
        name: proposal.customer.name || '',
        company: proposal.customer.company || undefined,
        email: proposal.customer.email || undefined,
        mobile_phone: proposal.customer.mobile_phone || proposal.customer.phone || undefined,
        office_phone: proposal.customer.office_phone || undefined,
        address: proposal.customer.address || undefined,
        tax_number: proposal.customer.tax_number || undefined,
        tax_office: proposal.customer.tax_office || undefined,
      } : undefined,
      company: company ? {
        name: company.name || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || undefined,
        logo_url: company.logo_url || undefined,
        tax_number: company.tax_number || undefined,
        tax_office: company.tax_office || undefined,
      } : undefined,
      prepared_by: proposal.employee 
        ? `${proposal.employee.first_name || ''} ${proposal.employee.last_name || ''}`.trim()
        : undefined,
      items: (proposal.items || proposal.proposal_items || []).map((item: any) => ({
        id: item.id || item.product_id || Math.random().toString(),
        description: item.description || item.name || item.product_name || '',
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        unit: item.unit || 'adet',
        tax_rate: Number(item.tax_rate || item.tax_percentage) || 18,
        discount_rate: Number(item.discount_rate || item.discount_percentage) || 0,
        total: Number(item.total || item.total_amount || item.total_price) || (Number(item.quantity || 1) * Number(item.unit_price || 0)),
        image_url: item.image_url || item.product?.image_url || undefined,
      })),
      subtotal: Number(proposal.subtotal) || 0,
      total_discount: Number(proposal.total_discount) || 0,
      total_tax: Number(proposal.total_tax) || 0,
      total_amount: Number(proposal.total_amount) || proposal.totalAmount || 0,
      currency: proposal.currency || 'TRY',
      valid_until: proposal.valid_until || proposal.validUntil || undefined,
      payment_terms: proposal.payment_terms || proposal.paymentTerms || undefined,
      delivery_terms: proposal.delivery_terms || proposal.deliveryTerms || undefined,
      warranty_terms: proposal.warranty_terms || proposal.warrantyTerms || undefined,
      price_terms: proposal.price_terms || proposal.priceTerms || undefined,
      other_terms: proposal.other_terms || proposal.otherTerms || undefined,
      notes: proposal.notes || undefined,
      created_at: proposal.created_at || proposal.createdAt || new Date().toISOString(),
    };

    // Call web app's PDF generation endpoint
    const WEB_APP_URL = Deno.env.get('WEB_APP_URL') || 'https://your-web-app-url.com';
    
    console.log('📄 Calling web app PDF generation endpoint...');
    
    const pdfResponse = await fetch(`${WEB_APP_URL}/api/generate-proposal-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        quoteData: quoteData,
        templateId: templateId,
      }),
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error('❌ PDF generation error:', errorText);
      throw new Error(`PDF generation failed: ${pdfResponse.status} - ${errorText}`);
    }

    const pdfBlob = await pdfResponse.blob();
    const pdfArrayBuffer = await pdfBlob.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfArrayBuffer)));

    console.log('✅ PDF generated successfully, size:', pdfBlob.size, 'bytes');

    return new Response(JSON.stringify({ 
      success: true,
      pdfData: pdfBase64,
      mimeType: 'application/pdf',
      size: pdfBlob.size,
      message: 'PDF başarıyla oluşturuldu'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in generate-proposal-pdf function:', error);
    
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
