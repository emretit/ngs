import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';

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
    const { serviceRequestId, templateId } = requestBody;

    if (!serviceRequestId) {
      throw new Error('serviceRequestId is required');
    }

    // Get service request data with service_items
    const { data: serviceRequest, error: serviceError } = await supabase
      .from('service_requests')
      .select(`
        *,
        customer:customers(*),
        technician:employees(id, first_name, last_name, email, mobile_phone)
      `)
      .eq('id', serviceRequestId)
      .single();

    if (serviceError || !serviceRequest) {
      throw new Error('Service request not found');
    }

    // Get service_items
    const { data: serviceItems } = await supabase
      .from('service_items')
      .select('*')
      .eq('service_request_id', serviceRequestId)
      .order('row_number', { ascending: true });

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

    // Get PDF template if provided (from pdf_templates table, type='service_slip')
    let template = null;
    if (templateId) {
      const { data: templateData } = await supabase
        .from('pdf_templates')
        .select('*')
        .eq('id', templateId)
        .eq('type', 'service_slip')
        .single();
      template = templateData;
    }

    // Transform service request to PDF data format
    const pdfData = {
      id: serviceRequest.id,
      serviceNumber: serviceRequest.service_number || serviceRequest.slip_number || `SR-${serviceRequest.id.slice(-6).toUpperCase()}`,
      serviceTitle: serviceRequest.title || serviceRequest.service_title || '',
      serviceDescription: serviceRequest.description || serviceRequest.service_request_description || '',
      serviceType: serviceRequest.service_type || '',
      priority: serviceRequest.priority || 'medium',
      status: serviceRequest.status || '',
      location: serviceRequest.location || serviceRequest.service_location || '',
      reportedDate: serviceRequest.created_at || serviceRequest.issue_date || new Date().toISOString(),
      dueDate: serviceRequest.due_date || serviceRequest.service_due_date || null,
      completedDate: serviceRequest.completion_date || null,
      customer: serviceRequest.customer ? {
        name: serviceRequest.customer.name || '',
        company: serviceRequest.customer.company || undefined,
        email: serviceRequest.customer.email || undefined,
        phone: serviceRequest.customer.mobile_phone || serviceRequest.customer.phone || undefined,
        address: serviceRequest.customer.address || undefined,
      } : {
        name: serviceRequest.customer_name || 'Müşteri',
        company: undefined,
        email: undefined,
        phone: serviceRequest.contact_phone || undefined,
        address: serviceRequest.location || undefined,
      },
      technician: serviceRequest.technician ? {
        name: `${serviceRequest.technician.first_name || ''} ${serviceRequest.technician.last_name || ''}`.trim(),
        email: serviceRequest.technician.email || undefined,
        phone: serviceRequest.technician.mobile_phone || undefined,
      } : serviceRequest.assigned_technician ? {
        name: serviceRequest.assigned_technician,
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
      parts: (serviceItems && serviceItems.length > 0 
        ? serviceItems.map((item: any) => ({
            id: item.id,
            name: item.name || '',
            quantity: Number(item.quantity) || 1,
            unit: item.unit || 'adet',
            unitPrice: Number(item.unit_price) || 0,
            total: Number(item.total_price) || (Number(item.quantity || 1) * Number(item.unit_price || 0)),
          }))
        : (serviceRequest.service_details?.used_products || serviceRequest.service_details?.parts || []).map((part: any, index: number) => ({
            id: part.id || `part-${index}`,
            name: part.name || part.product_name || '',
            quantity: Number(part.quantity) || 1,
            unit: part.unit || 'adet',
            unitPrice: Number(part.unit_price || part.price) || 0,
            total: Number(part.total) || (Number(part.quantity || 1) * Number(part.unit_price || part.price || 0)),
          }))),
      instructions: serviceRequest.service_details?.instructions || [],
      notes: serviceRequest.service_details?.notes || serviceRequest.notes || undefined,
      technicianSignature: serviceRequest.technician_signature || undefined,
      customerSignature: serviceRequest.customer_signature || undefined,
      createdAt: serviceRequest.created_at || new Date().toISOString(),
    };

    // Generate PDF using pdf-lib
    console.log('📄 Generating PDF with pdf-lib...');
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let yPosition = height - 40;
    const margin = 40;
    const lineHeight = 14;
    
    // Helper function to add text with word wrap
    const addText = (text: string, x: number, y: number, size: number, isBold: boolean = false, maxWidth?: number) => {
      const currentFont = isBold ? boldFont : font;
      if (maxWidth) {
        // Simple word wrap
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        for (const word of words) {
          const testLine = line + word + ' ';
          const testWidth = currentFont.widthOfTextAtSize(testLine, size);
          if (testWidth > maxWidth && line.length > 0) {
            page.drawText(line, { x, y: currentY, size, font: currentFont });
            line = word + ' ';
            currentY -= lineHeight;
          } else {
            line = testLine;
          }
        }
        if (line.length > 0) {
          page.drawText(line, { x, y: currentY, size, font: currentFont });
        }
        return currentY;
      } else {
        page.drawText(text, { x, y, size, font: currentFont });
        return y;
      }
    };
    
    // Header
    yPosition = addText('SERVİS FORMU', margin, yPosition, 18, true);
    yPosition -= 20;
    
    // Company info (right side)
    if (pdfData.company) {
      let companyY = height - 40;
      if (pdfData.company.name) {
        companyY = addText(pdfData.company.name, width - margin - 200, companyY, 12, true);
        companyY -= lineHeight;
      }
      if (pdfData.company.address) {
        companyY = addText(pdfData.company.address, width - margin - 200, companyY, 10);
        companyY -= lineHeight;
      }
      if (pdfData.company.phone) {
        companyY = addText(pdfData.company.phone, width - margin - 200, companyY, 10);
        companyY -= lineHeight;
      }
      if (pdfData.company.email) {
        companyY = addText(pdfData.company.email, width - margin - 200, companyY, 10);
      }
    }
    
    yPosition -= 20;
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.9),
    });
    yPosition -= 20;
    
    // Service Info
    yPosition = addText('Servis Bilgileri', margin, yPosition, 14, true);
    yPosition -= lineHeight;
    
    yPosition = addText(`Servis No: ${pdfData.serviceNumber}`, margin, yPosition, 10);
    yPosition -= lineHeight;
    
    yPosition = addText(`Servis Başlığı: ${pdfData.serviceTitle}`, margin, yPosition, 10);
    yPosition -= lineHeight;
    
    if (pdfData.serviceType) {
      yPosition = addText(`Servis Tipi: ${pdfData.serviceType}`, margin, yPosition, 10);
      yPosition -= lineHeight;
    }
    
    if (pdfData.location) {
      yPosition = addText(`Konum: ${pdfData.location}`, margin, yPosition, 10);
      yPosition -= lineHeight;
    }
    
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '-';
      try {
        const date = new Date(dateStr);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      } catch {
        return dateStr;
      }
    };
    
    yPosition = addText(`Bildirim Tarihi: ${formatDate(pdfData.reportedDate)}`, margin, yPosition, 10);
    yPosition -= lineHeight;
    
    // Customer Info (right column)
    if (pdfData.customer) {
      let customerY = height - 200;
      customerY = addText('Müşteri Bilgileri', width - margin - 200, customerY, 14, true);
      customerY -= lineHeight;
      
      if (pdfData.customer.company) {
        customerY = addText(pdfData.customer.company, width - margin - 200, customerY, 11, true);
        customerY -= lineHeight;
      }
      
      if (pdfData.customer.name) {
        customerY = addText(pdfData.customer.name, width - margin - 200, customerY, 10);
        customerY -= lineHeight;
      }
      
      if (pdfData.customer.phone) {
        customerY = addText(pdfData.customer.phone, width - margin - 200, customerY, 10);
        customerY -= lineHeight;
      }
      
      if (pdfData.customer.email) {
        customerY = addText(pdfData.customer.email, width - margin - 200, customerY, 10);
        customerY -= lineHeight;
      }
      
      if (pdfData.customer.address) {
        customerY = addText(pdfData.customer.address, width - margin - 200, customerY, 10, false, 200);
      }
    }
    
    yPosition -= 20;
    
    // Parts Table
    if (pdfData.parts && pdfData.parts.length > 0) {
      yPosition = addText('Kullanılan Ürünler', margin, yPosition, 14, true);
      yPosition -= lineHeight;
      
      // Table header
      const tableY = yPosition;
      addText('Ürün Adı', margin, tableY, 10, true);
      addText('Miktar', margin + 200, tableY, 10, true);
      addText('Birim', margin + 250, tableY, 10, true);
      addText('Birim Fiyat', margin + 300, tableY, 10, true);
      addText('Toplam', margin + 400, tableY, 10, true);
      
      yPosition -= lineHeight;
      page.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: width - margin, y: yPosition },
        thickness: 0.5,
        color: rgb(0.9, 0.9, 0.9),
      });
      yPosition -= lineHeight;
      
      // Table rows
      for (const part of pdfData.parts) {
        addText(part.name, margin, yPosition, 9, false, 180);
        addText(String(part.quantity), margin + 200, yPosition, 9);
        addText(part.unit || '-', margin + 250, yPosition, 9);
        addText(`${part.unitPrice?.toFixed(2) || '0.00'} TL`, margin + 300, yPosition, 9);
        addText(`${part.total?.toFixed(2) || '0.00'} TL`, margin + 400, yPosition, 9);
        yPosition -= lineHeight;
      }
    }
    
    yPosition -= 20;
    
    // Instructions
    if (pdfData.instructions && pdfData.instructions.length > 0) {
      yPosition = addText('Yapılacak İşlemler', margin, yPosition, 12, true);
      yPosition -= lineHeight;
      
      pdfData.instructions.forEach((instruction: string, index: number) => {
        yPosition = addText(`${index + 1}. ${instruction}`, margin + 10, yPosition, 10, false, width - margin * 2 - 10);
        yPosition -= lineHeight;
      });
    }
    
    yPosition -= 20;
    
    // Notes
    if (pdfData.notes) {
      yPosition = addText('Notlar', margin, yPosition, 12, true);
      yPosition -= lineHeight;
      yPosition = addText(pdfData.notes, margin, yPosition, 10, false, width - margin * 2);
      yPosition -= lineHeight;
    }
    
    // Signatures
    yPosition -= 20;
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.9),
    });
    yPosition -= 30;
    
    // Technician signature
    addText('Teknisyen', margin + 50, yPosition, 10, true);
    yPosition -= 60;
    page.drawRectangle({
      x: margin + 50,
      y: yPosition,
      width: 150,
      height: 60,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });
    
    // Customer signature
    addText('Müşteri', width - margin - 200, yPosition + 60, 10, true);
    page.drawRectangle({
      x: width - margin - 200,
      y: yPosition,
      width: 150,
      height: 60,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });
    
    // Footer
    const footerY = 40;
    addText('Servis hizmeti için teşekkür ederiz.', width / 2 - 100, footerY, 10);
    
    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

    console.log('✅ PDF generated successfully, size:', pdfBytes.length, 'bytes');

    return new Response(JSON.stringify({ 
      success: true,
      pdfData: pdfBase64,
      mimeType: 'application/pdf',
      size: pdfBytes.length,
      message: 'PDF başarıyla oluşturuldu'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
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
