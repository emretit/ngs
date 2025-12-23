import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the user from the auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's company_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const templateId = url.searchParams.get('template_id');
    const activeOnly = url.searchParams.get('active_only') !== 'false';

    console.log(`📋 Fetching templates for company: ${profile.company_id}, templateId: ${templateId}`);

    if (templateId) {
      // Get single template
      const { data: template, error: templateError } = await supabase
        .from('service_templates')
        .select('*')
        .eq('id', templateId)
        .eq('company_id', profile.company_id)
        .single();

      if (templateError) {
        console.error('Template fetch error:', templateError);
        return new Response(
          JSON.stringify({ error: 'Template not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get company info for the template
      const { data: company } = await supabase
        .from('companies')
        .select('name, address, phone, email, website, logo_url, tax_number')
        .eq('id', profile.company_id)
        .single();

      // Transform to Flutter-friendly format
      const flutterTemplate = transformTemplateForFlutter(template, company);

      console.log(`✅ Template found: ${template.name}`);
      return new Response(
        JSON.stringify({ success: true, template: flutterTemplate }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Get all templates for company
      let query = supabase
        .from('service_templates')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('usage_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data: templates, error: templatesError } = await query;

      if (templatesError) {
        console.error('Templates fetch error:', templatesError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch templates' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get company info
      const { data: company } = await supabase
        .from('companies')
        .select('name, address, phone, email, website, logo_url, tax_number')
        .eq('id', profile.company_id)
        .single();

      // Transform all templates
      const flutterTemplates = (templates || []).map(t => transformTemplateForFlutter(t, company));

      console.log(`✅ Found ${flutterTemplates.length} templates`);
      return new Response(
        JSON.stringify({ success: true, templates: flutterTemplates, count: flutterTemplates.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('❌ Error in get-service-template:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Transform template to Flutter-friendly format
 * This ensures consistent structure across platforms
 */
function transformTemplateForFlutter(template: any, company: any) {
  const serviceDetails = template.service_details || {};
  const pdfSchema = serviceDetails.pdf_schema || {};

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    is_active: template.is_active,
    usage_count: template.usage_count,
    created_at: template.created_at,
    updated_at: template.updated_at,
    
    // PDF Schema - for Flutter PDF generation
    pdf_schema: {
      page: {
        size: pdfSchema.page?.size || 'A4',
        padding: pdfSchema.page?.padding || { top: 40, right: 40, bottom: 40, left: 40 },
        fontSize: pdfSchema.page?.fontSize || 12,
        fontFamily: pdfSchema.page?.fontFamily || 'Roboto',
        fontColor: pdfSchema.page?.fontColor || '#000000',
        backgroundColor: pdfSchema.page?.backgroundColor || '#FFFFFF',
      },
      header: {
        showLogo: pdfSchema.header?.showLogo ?? true,
        logoUrl: pdfSchema.header?.logoUrl || company?.logo_url,
        logoPosition: pdfSchema.header?.logoPosition || 'left',
        logoSize: pdfSchema.header?.logoSize || 80,
        showTitle: pdfSchema.header?.showTitle ?? true,
        title: pdfSchema.header?.title || 'SERVİS FORMU',
        titleFontSize: pdfSchema.header?.titleFontSize || 18,
        showCompanyInfo: pdfSchema.header?.showCompanyInfo ?? true,
        companyName: pdfSchema.header?.companyName || company?.name || '',
        companyAddress: pdfSchema.header?.companyAddress || company?.address || '',
        companyPhone: pdfSchema.header?.companyPhone || company?.phone || '',
        companyEmail: pdfSchema.header?.companyEmail || company?.email || '',
        companyWebsite: pdfSchema.header?.companyWebsite || company?.website || '',
        companyTaxNumber: pdfSchema.header?.companyTaxNumber || company?.tax_number || '',
        companyInfoFontSize: pdfSchema.header?.companyInfoFontSize || 10,
      },
      serviceInfo: {
        titleFontSize: pdfSchema.serviceInfo?.titleFontSize || 14,
        infoFontSize: pdfSchema.serviceInfo?.infoFontSize || 10,
        showServiceNumber: pdfSchema.serviceInfo?.showServiceNumber ?? true,
        showServiceStatus: pdfSchema.serviceInfo?.showServiceStatus ?? true,
        showTechnician: pdfSchema.serviceInfo?.showTechnician ?? true,
        showServiceType: pdfSchema.serviceInfo?.showServiceType ?? true,
        showDates: pdfSchema.serviceInfo?.showDates ?? true,
      },
      partsTable: {
        show: pdfSchema.partsTable?.show ?? true,
        columns: pdfSchema.partsTable?.columns || [
          { key: 'name', label: 'Ürün Adı', show: true, align: 'left' },
          { key: 'quantity', label: 'Miktar', show: true, align: 'center' },
          { key: 'unit', label: 'Birim', show: true, align: 'center' },
          { key: 'unitPrice', label: 'Birim Fiyat', show: true, align: 'right' },
          { key: 'total', label: 'Toplam', show: true, align: 'right' },
        ],
        showRowNumber: pdfSchema.partsTable?.showRowNumber ?? true,
      },
      signatures: {
        show: pdfSchema.signatures?.show ?? true,
        showTechnician: pdfSchema.signatures?.showTechnician ?? true,
        showCustomer: pdfSchema.signatures?.showCustomer ?? true,
        technicianLabel: pdfSchema.signatures?.technicianLabel || 'Teknisyen',
        customerLabel: pdfSchema.signatures?.customerLabel || 'Müşteri',
        fontSize: pdfSchema.signatures?.fontSize || 10,
      },
      notes: {
        footer: pdfSchema.notes?.footer || 'Servis hizmeti için teşekkür ederiz.',
        footerFontSize: pdfSchema.notes?.footerFontSize || 10,
        showFooterLogo: pdfSchema.notes?.showFooterLogo ?? false,
      },
    },
    
    // Default values for service creation
    defaults: {
      estimated_duration: serviceDetails.estimated_duration,
      default_location: serviceDetails.default_location,
      default_technician_id: serviceDetails.default_technician_id,
      service_type: serviceDetails.service_type,
      service_priority: serviceDetails.service_priority || 'medium',
    },
    
    // Parts list template
    parts_list: serviceDetails.parts_list || [],
    
    // Company info (for convenience)
    company: company ? {
      name: company.name,
      address: company.address,
      phone: company.phone,
      email: company.email,
      website: company.website,
      logo_url: company.logo_url,
      tax_number: company.tax_number,
    } : null,
  };
}
