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
    console.log('🚀 Nilvera invoice details function started');
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

    const { invoiceId, envelopeUUID } = requestBody;
    console.log('📨 Invoice ID:', invoiceId);
    console.log('📨 Envelope UUID:', envelopeUUID);
    console.log('👤 User ID:', user.id);

    if (!invoiceId) {
      throw new Error('Invoice ID is required');
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

    // Fetch invoice details from Nilvera API
    try {
      console.log('🔄 Starting Nilvera API call for invoice details...');
      console.log('🔑 Using API key:', nilveraAuth.api_key ? `${nilveraAuth.api_key.substring(0, 8)}...` : 'MISSING');
      console.log('📄 Invoice ID:', invoiceId);

      // Get invoice details using the correct endpoint with ETTN (envelopeUUID)
      const apiUrl = `https://apitest.nilvera.com/api/e-fatura-api/gelen-faturalar/detaylari-getirir`;
      console.log('🌐 Detail Endpoint:', apiUrl);

      const nilveraResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${nilveraAuth.api_key}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ettn: envelopeUUID || invoiceId,
          uuid: invoiceId
        })
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
      console.log('📊 Response keys:', Object.keys(nilveraData));

      // Also try to get the XML content which should contain line items
      let xmlContent = null;
      try {
        const xmlUrl = `https://apitest.nilvera.com/einvoice/Purchase/${invoiceId}/Xml`;
        console.log('🌐 XML Endpoint:', xmlUrl);

        const xmlResponse = await fetch(xmlUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${nilveraAuth.api_key}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (xmlResponse.ok) {
          xmlContent = await xmlResponse.text();
          console.log('✅ XML content retrieved');
        } else {
          console.log('⚠️ Could not retrieve XML content:', xmlResponse.status);
        }
      } catch (xmlError) {
        console.log('⚠️ XML fetch error:', xmlError.message);
      }

      // Parse invoice line items from the response
      let invoiceItems = [];

      // First try to extract from the detail response
      if (nilveraData.Lines && Array.isArray(nilveraData.Lines)) {
        invoiceItems = nilveraData.Lines.map((line: any, index: number) => ({
          id: `line-${index}`,
          description: line.Description || line.Name || '',
          productCode: line.ProductCode || line.ItemCode || '',
          quantity: parseFloat(line.Quantity || 0),
          unit: line.Unit || line.UnitCode || 'Adet',
          unitPrice: parseFloat(line.UnitPrice || line.Price || 0),
          vatRate: parseFloat(line.VATRate || line.TaxRate || 18),
          vatAmount: parseFloat(line.VATAmount || line.TaxAmount || 0),
          totalAmount: parseFloat(line.TotalAmount || line.LineTotal || 0),
          discountRate: parseFloat(line.DiscountRate || 0),
          discountAmount: parseFloat(line.DiscountAmount || 0),
          // Additional fields that might be useful
          lineNumber: line.LineNumber || index + 1,
          category: line.Category || null,
          brand: line.Brand || null,
          specifications: line.Specifications || null
        }));
      }

      // If no lines found in detail response, try to parse from XML
      if (invoiceItems.length === 0 && xmlContent) {
        console.log('🔍 Trying to parse line items from XML...');

        // This is a basic XML parsing - in a real implementation you'd want to use a proper XML parser
        // For now, we'll try to extract some basic information
        try {
          // Look for invoice line patterns in XML
          const lineMatches = xmlContent.match(/<cac:InvoiceLine[\s\S]*?<\/cac:InvoiceLine>/g);
          if (lineMatches) {
            invoiceItems = lineMatches.map((lineXml: string, index: number) => {
              const getXmlValue = (tag: string) => {
                const match = lineXml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
                return match ? match[1] : '';
              };

              return {
                id: `xml-line-${index}`,
                description: getXmlValue('cbc:Name') || getXmlValue('cbc:Description') || `Ürün ${index + 1}`,
                productCode: getXmlValue('cbc:ID') || '',
                quantity: parseFloat(getXmlValue('cbc:InvoicedQuantity') || '0'),
                unit: getXmlValue('cbc:InvoicedQuantity')?.match(/unitCode="([^"]*)"/)?.at(1) || 'Adet',
                unitPrice: parseFloat(getXmlValue('cbc:PriceAmount') || '0'),
                vatRate: parseFloat(getXmlValue('cbc:Percent') || '18'),
                vatAmount: parseFloat(getXmlValue('cbc:TaxAmount') || '0'),
                totalAmount: parseFloat(getXmlValue('cbc:LineExtensionAmount') || '0'),
                discountRate: 0,
                discountAmount: 0,
                lineNumber: index + 1
              };
            });
          }
        } catch (xmlParseError) {
          console.log('⚠️ XML parsing error:', xmlParseError.message);
        }
      }

      // If still no items found, create a mock item based on invoice totals
      if (invoiceItems.length === 0) {
        console.log('⚠️ No line items found, creating mock item from invoice totals');
        invoiceItems = [{
          id: 'mock-item-1',
          description: 'Fatura Kalemi (Detay bulunamadı)',
          productCode: '',
          quantity: 1,
          unit: 'Adet',
          unitPrice: nilveraData.TaxExclusiveAmount || nilveraData.PayableAmount || 0,
          vatRate: 18,
          vatAmount: nilveraData.TaxTotalAmount || 0,
          totalAmount: nilveraData.PayableAmount || 0,
          discountRate: 0,
          discountAmount: 0,
          lineNumber: 1
        }];
      }

      console.log('📊 Parsed invoice items:', invoiceItems.length);
      console.log('📄 First item sample:', invoiceItems[0]);

      return new Response(JSON.stringify({
        success: true,
        invoiceDetails: {
          id: invoiceId,
          ...nilveraData,
          items: invoiceItems,
          xmlContent: xmlContent
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

      // Return error response
      return new Response(JSON.stringify({
        success: false,
        error: apiError.message,
        invoiceDetails: null
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('❌ Error in nilvera-invoice-details function:', error);
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