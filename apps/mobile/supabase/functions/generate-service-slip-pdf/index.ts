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
    console.log('🚀 Generate Service Slip PDF function started');
    
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
    const { 
      serviceRequestId, 
      templateId, 
      preview = false,
      technicianSignature,
      customerSignature 
    } = requestBody;

    if (!serviceRequestId) {
      throw new Error('serviceRequestId is required');
    }

    // Get service request data
    console.log('🔍 Fetching service request:', serviceRequestId);
    
    const { data: serviceRequest, error: serviceError } = await supabase
      .from('service_requests')
      .select(`
        *,
        customers (
          id,
          name,
          company,
          email,
          mobile_phone,
          office_phone,
          address
        )
      `)
      .eq('id', serviceRequestId)
      .single();

    if (serviceError) {
      console.error('❌ Service request query error:', serviceError);
      throw new Error(`Service request query failed: ${serviceError.message}`);
    }

    if (!serviceRequest) {
      console.error('❌ Service request not found:', serviceRequestId);
      throw new Error(`Service request not found: ${serviceRequestId}`);
    }

    // Get technician data separately if assigned_technician exists
    let technician = null;
    if (serviceRequest.assigned_technician) {
      const { data: technicianData, error: techError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, mobile_phone')
        .eq('id', serviceRequest.assigned_technician)
        .single();
      
      if (!techError && technicianData) {
        technician = technicianData;
      }
    }

    console.log('✅ Service request found:', {
      id: serviceRequest.id,
      title: serviceRequest.service_title,
      hasCustomer: !!serviceRequest.customers,
      hasTechnician: !!technician,
      assignedTechnicianId: serviceRequest.assigned_technician,
    });

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

    // Transform service request to PDF data format
    const pdfData = {
      id: serviceRequest.id,
      serviceNumber: serviceRequest.service_number || serviceRequest.slip_number || `SR-${serviceRequest.id.slice(-6).toUpperCase()}`,
      serviceTitle: serviceRequest.service_title || '',
      serviceDescription: serviceRequest.service_request_description || '',
      serviceType: serviceRequest.service_type || '',
      priority: serviceRequest.service_priority || 'medium',
      status: serviceRequest.service_status || '',
      location: serviceRequest.service_location || '',
      reportedDate: serviceRequest.created_at || serviceRequest.issue_date || new Date().toISOString(),
      dueDate: serviceRequest.service_due_date || null,
      completedDate: serviceRequest.completion_date || null,
      customer: serviceRequest.customers ? {
        name: serviceRequest.customers.name || '',
        company: serviceRequest.customers.company || undefined,
        email: serviceRequest.customers.email || undefined,
        phone: serviceRequest.customers.mobile_phone || serviceRequest.customers.office_phone || undefined,
        address: serviceRequest.customers.address || undefined,
      } : {
        name: serviceRequest.customer_name || 'Müşteri',
        company: undefined,
        email: undefined,
        phone: serviceRequest.contact_phone || undefined,
        address: serviceRequest.service_location || serviceRequest.location || undefined,
      },
      technician: technician ? {
        name: `${technician.first_name || ''} ${technician.last_name || ''}`.trim(),
        email: technician.email || undefined,
        phone: technician.mobile_phone || undefined,
      } : serviceRequest.technician_name ? {
        name: serviceRequest.technician_name,
      } : undefined,
      company: company ? {
        name: company.name || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || undefined,
        logo_url: company.logo_url || undefined,
        tax_number: company.tax_number || undefined,
      } : undefined,
      parts: (serviceRequest.service_details?.used_products || serviceRequest.service_details?.parts || []).map((part: any, index: number) => ({
        id: part.id || `part-${index}`,
        name: part.name || part.product_name || '',
        quantity: Number(part.quantity) || 1,
        unit: part.unit || 'adet',
        unitPrice: Number(part.unit_price || part.price) || 0,
        total: Number(part.total) || (Number(part.quantity || 1) * Number(part.unit_price || part.price || 0)),
      })),
      instructions: serviceRequest.service_details?.instructions || [],
      notes: serviceRequest.service_details?.notes || serviceRequest.notes || undefined,
      createdAt: serviceRequest.created_at || new Date().toISOString(),
    };

    // Call web app's PDF generation endpoint
    // Note: You'll need to set WEB_APP_URL environment variable
    const WEB_APP_URL = Deno.env.get('WEB_APP_URL') || 'https://your-web-app-url.com';
    
    console.log('📄 Calling web app PDF generation endpoint...', {
      preview,
      templateId,
      hasTechnicianSignature: !!technicianSignature,
      hasCustomerSignature: !!customerSignature,
    });
    
    const pdfResponse = await fetch(`${WEB_APP_URL}/api/generate-service-slip-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        serviceData: pdfData,
        templateId: templateId || undefined,
        preview: preview,
        signatures: {
          technician: technicianSignature || undefined,
          customer: customerSignature || undefined,
        },
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
    console.error('❌ Error in generate-service-slip-pdf function:', error);
    
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
