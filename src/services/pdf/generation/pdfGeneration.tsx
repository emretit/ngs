import { Document, pdf } from '@react-pdf/renderer';
import { QuoteData, PdfTemplate, TemplateSchema } from '@/types/pdf-template';
import { ServicePdfData, ServicePdfTemplate, ServiceTemplateSchema, defaultServiceTemplateSchema } from '@/types/service-template';
import PdfRenderer from '@/components/pdf/PdfRenderer';
import ServicePdfRenderer from '@/components/pdf/ServicePdfRenderer';
import { validatePdfData } from '@/utils/pdfHelpers';
import { logger } from '@/utils/logger';
import { getTemplate } from '../operations/templateOperations';

/**
 * Generate PDF blob from quote data and template
 */
export async function generatePdf(
  quoteData: QuoteData,
  options?: { templateId?: string; template?: PdfTemplate }
): Promise<Blob> {
  try {
    // Validate data before PDF generation
    const validation = validatePdfData(quoteData);
    if (!validation.isValid) {
      throw new Error(`PDF oluşturulamıyor. Eksik veriler: ${validation.missingFields.join(', ')}`);
    }

    // Get template if not provided
    let activeTemplate = options?.template;
    if (!activeTemplate && options?.templateId) {
      activeTemplate = await getTemplate(options.templateId);
    }
    if (!activeTemplate) {
      throw new Error('Şablon bulunamadı. Lütfen bir şablon belirtin.');
    }

    // Validate schema_json
    if (!activeTemplate.schema_json) {
      throw new Error('Template şeması bulunamadı');
    }

    // Parse schema if string
    let schema = activeTemplate.schema_json;
    if (typeof schema === 'string') {
      try {
        schema = JSON.parse(schema);
      } catch (parseError) {
        throw new Error('Template şeması geçersiz JSON formatında');
      }
    }

    // Ensure product_image column exists (backward compatibility)
    if (schema.lineTable && schema.lineTable.columns) {
      const hasProductImageColumn = schema.lineTable.columns.some((col: any) => col.key === 'product_image');
      if (!hasProductImageColumn) {
        const descriptionIndex = schema.lineTable.columns.findIndex((col: any) => col.key === 'description');
        if (descriptionIndex !== -1) {
          schema.lineTable.columns.splice(descriptionIndex, 0, {
            key: 'product_image',
            show: true,
            label: 'Görsel',
            align: 'center'
          });
        } else {
          schema.lineTable.columns.unshift({
            key: 'product_image',
            show: true,
            label: 'Görsel',
            align: 'center'
          });
        }
        logger.debug("Added product_image column to template schema for backward compatibility");
      }
    }

    logger.debug("Generating PDF with data", {
      dataKeys: Object.keys(quoteData),
      customerName: quoteData.customer?.name,
      itemsCount: quoteData.items?.length,
      itemsWithImages: quoteData.items?.filter((item: any) => item.image_url).length || 0,
    });

    const pdfElement = (
      <PdfRenderer
        data={quoteData}
        schema={schema}
      />
    );

    const blob = await pdf(pdfElement).toBlob();
    return blob;
  } catch (error) {
    logger.error("Error generating PDF", error);
    throw new Error('PDF oluşturulurken hata oluştu: ' + (error as Error).message);
  }
}

/**
 * Generate service PDF blob
 */
export async function generateServicePdf(
  serviceData: ServicePdfData,
  options?: { templateId?: string; template?: ServicePdfTemplate }
): Promise<Blob> {
  try {
    let activeTemplate = options?.template;
    
    if (!activeTemplate && options?.templateId) {
      // Get template from service_templates table
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('service_templates')
        .select('*')
        .eq('id', options.templateId)
        .single();

      if (error) {
        throw new Error('Şablon bulunamadı: ' + error.message);
      }

      // Parse schema from service_details.pdf_schema
      let pdfSchema: ServiceTemplateSchema = defaultServiceTemplateSchema;
      if (data.service_details?.pdf_schema) {
        pdfSchema = { ...defaultServiceTemplateSchema, ...data.service_details.pdf_schema };
      } else if (data.service_details && typeof data.service_details === 'object') {
        pdfSchema = { ...defaultServiceTemplateSchema, ...data.service_details };
      }

      activeTemplate = {
        id: data.id,
        name: data.name,
        description: data.description,
        schema_json: pdfSchema,
        is_active: data.is_active !== false,
        company_id: data.company_id,
        created_by: data.created_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }

    if (!activeTemplate) {
      throw new Error('Servis şablonu bulunamadı');
    }

    // Parse schema if string
    let schema = activeTemplate.schema_json;
    if (typeof schema === 'string') {
      try {
        schema = JSON.parse(schema);
      } catch (parseError) {
        throw new Error('Şablon şeması geçersiz JSON formatında');
      }
    }

    const pdfElement = (
      <ServicePdfRenderer
        data={serviceData}
        schema={schema as ServiceTemplateSchema}
      />
    );

    const blob = await pdf(pdfElement).toBlob();
    return blob;
  } catch (error) {
    logger.error("Error generating service PDF", error);
    throw new Error('Servis PDF oluşturulamadı: ' + (error as Error).message);
  }
}

/**
 * Open PDF in new tab
 */
export async function openPdfInNewTab(
  blob: Blob,
  filename: string
) {
  try {
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    
    if (!newWindow) {
      // Fallback to download if popup blocked
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    // Clean up blob URL after delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    logger.error("Error opening PDF", error);
    throw new Error('PDF açılırken hata oluştu: ' + (error as Error).message);
  }
}

/**
 * Download PDF file
 */
export async function downloadPdf(
  blob: Blob,
  filename: string
) {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    logger.error("Error downloading PDF", error);
    throw error;
  }
}

/**
 * Upload PDF to Supabase Storage
 */
export async function uploadPdfToStorage(
  blob: Blob,
  storagePath: string
) {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(storagePath, blob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) {
      logger.error("Error uploading PDF", error);
      throw new Error('PDF yüklenirken hata oluştu: ' + error.message);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);

    return { 
      success: true, 
      path: data.path,
      url: urlData.publicUrl
    };
  } catch (error) {
    logger.error("Error uploading PDF to storage", error);
    throw error;
  }
}

