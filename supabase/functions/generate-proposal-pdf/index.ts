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

    // Get template if provided
    let template = null;
    if (templateId) {
      const { data: templateData } = await supabase
        .from('pdf_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      template = templateData;
    }

    // Transform proposal to QuoteData format
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
    yPosition = addText('TEKLİF', margin, yPosition, 18, true);
    yPosition -= 20;
    
    // Company info (right side)
    if (quoteData.company) {
      let companyY = height - 40;
      if (quoteData.company.name) {
        companyY = addText(quoteData.company.name, width - margin - 200, companyY, 12, true);
        companyY -= lineHeight;
      }
      if (quoteData.company.address) {
        companyY = addText(quoteData.company.address, width - margin - 200, companyY, 10);
        companyY -= lineHeight;
      }
      if (quoteData.company.phone) {
        companyY = addText(quoteData.company.phone, width - margin - 200, companyY, 10);
        companyY -= lineHeight;
      }
      if (quoteData.company.email) {
        companyY = addText(quoteData.company.email, width - margin - 200, companyY, 10);
        companyY -= lineHeight;
      }
      if (quoteData.company.tax_number) {
        companyY = addText(`Vergi No: ${quoteData.company.tax_number}`, width - margin - 200, companyY, 10);
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
    
    // Proposal Info
    yPosition = addText(`Teklif No: ${quoteData.number}`, margin, yPosition, 12, true);
    yPosition -= lineHeight;
    
    if (quoteData.title) {
      yPosition = addText(`Başlık: ${quoteData.title}`, margin, yPosition, 12);
      yPosition -= lineHeight;
    }
    
    const formatDate = (dateStr: string | null | undefined) => {
      if (!dateStr) return '-';
      try {
        const date = new Date(dateStr);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      } catch {
        return dateStr;
      }
    };
    
    yPosition = addText(`Tarih: ${formatDate(quoteData.created_at)}`, margin, yPosition, 10);
    yPosition -= lineHeight;
    
    if (quoteData.valid_until) {
      yPosition = addText(`Geçerlilik: ${formatDate(quoteData.valid_until)}`, margin, yPosition, 10);
      yPosition -= lineHeight;
    }
    
    // Customer Info (right column)
    if (quoteData.customer) {
      let customerY = height - 200;
      customerY = addText('Müşteri Bilgileri', width - margin - 200, customerY, 14, true);
      customerY -= lineHeight;
      
      if (quoteData.customer.company) {
        customerY = addText(quoteData.customer.company, width - margin - 200, customerY, 11, true);
        customerY -= lineHeight;
      }
      
      if (quoteData.customer.name) {
        customerY = addText(quoteData.customer.name, width - margin - 200, customerY, 10);
        customerY -= lineHeight;
      }
      
      if (quoteData.customer.mobile_phone || quoteData.customer.office_phone) {
        customerY = addText(quoteData.customer.mobile_phone || quoteData.customer.office_phone || '', width - margin - 200, customerY, 10);
        customerY -= lineHeight;
      }
      
      if (quoteData.customer.email) {
        customerY = addText(quoteData.customer.email, width - margin - 200, customerY, 10);
        customerY -= lineHeight;
      }
      
      if (quoteData.customer.address) {
        customerY = addText(quoteData.customer.address, width - margin - 200, customerY, 10, false, 200);
      }
    }
    
    yPosition -= 20;
    
    // Items Table
    if (quoteData.items && quoteData.items.length > 0) {
      yPosition = addText('Ürünler / Hizmetler', margin, yPosition, 14, true);
      yPosition -= lineHeight;
      
      // Table header
      const tableY = yPosition;
      addText('Açıklama', margin, tableY, 10, true);
      addText('Miktar', margin + 250, tableY, 10, true);
      addText('Birim Fiyat', margin + 300, tableY, 10, true);
      addText('KDV %', margin + 380, tableY, 10, true);
      addText('Toplam', margin + 430, tableY, 10, true);
      
      yPosition -= lineHeight;
      page.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: width - margin, y: yPosition },
        thickness: 0.5,
        color: rgb(0.9, 0.9, 0.9),
      });
      yPosition -= lineHeight;
      
      // Table rows
      for (const item of quoteData.items) {
        addText(item.description, margin, yPosition, 9, false, 240);
        addText(String(item.quantity), margin + 250, yPosition, 9);
        addText(`${item.unit_price.toFixed(2)} ${quoteData.currency}`, margin + 300, yPosition, 9);
        addText(`${item.tax_rate || 18}%`, margin + 380, yPosition, 9);
        addText(`${item.total.toFixed(2)} ${quoteData.currency}`, margin + 430, yPosition, 9);
        yPosition -= lineHeight;
      }
    }
    
    yPosition -= 20;
    
    // Totals
    const totalsY = yPosition;
    let totalsStartY = totalsY;
    
    addText(`Ara Toplam: ${quoteData.subtotal.toFixed(2)} ${quoteData.currency}`, width - margin - 150, totalsStartY, 10);
    totalsStartY -= lineHeight;
    
    if (quoteData.total_discount && quoteData.total_discount > 0) {
      addText(`İndirim: -${quoteData.total_discount.toFixed(2)} ${quoteData.currency}`, width - margin - 150, totalsStartY, 10);
      totalsStartY -= lineHeight;
    }
    
    addText(`KDV: ${quoteData.total_tax.toFixed(2)} ${quoteData.currency}`, width - margin - 150, totalsStartY, 10);
    totalsStartY -= lineHeight;
    
    page.drawLine({
      start: { x: width - margin - 150, y: totalsStartY },
      end: { x: width - margin, y: totalsStartY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    totalsStartY -= lineHeight;
    
    addText(`GENEL TOPLAM: ${quoteData.total_amount.toFixed(2)} ${quoteData.currency}`, width - margin - 150, totalsStartY, 12, true);
    
    yPosition = totalsStartY - 30;
    
    // Terms
    if (quoteData.payment_terms || quoteData.delivery_terms || quoteData.warranty_terms) {
      yPosition = addText('Şartlar', margin, yPosition, 12, true);
      yPosition -= lineHeight;
      
      if (quoteData.payment_terms) {
        yPosition = addText(`Ödeme: ${quoteData.payment_terms}`, margin, yPosition, 10, false, width - margin * 2);
        yPosition -= lineHeight;
      }
      
      if (quoteData.delivery_terms) {
        yPosition = addText(`Teslimat: ${quoteData.delivery_terms}`, margin, yPosition, 10, false, width - margin * 2);
        yPosition -= lineHeight;
      }
      
      if (quoteData.warranty_terms) {
        yPosition = addText(`Garanti: ${quoteData.warranty_terms}`, margin, yPosition, 10, false, width - margin * 2);
        yPosition -= lineHeight;
      }
    }
    
    // Notes
    if (quoteData.notes) {
      yPosition -= 10;
      yPosition = addText('Notlar', margin, yPosition, 12, true);
      yPosition -= lineHeight;
      yPosition = addText(quoteData.notes, margin, yPosition, 10, false, width - margin * 2);
    }
    
    // Footer
    const footerY = 40;
    if (quoteData.prepared_by) {
      addText(`Hazırlayan: ${quoteData.prepared_by}`, margin, footerY, 9);
    }
    addText('Teşekkür ederiz.', width / 2 - 50, footerY, 10);
    
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
