import { QuoteData, PdfTemplate, PdfExportOptions } from '@/types/pdf-template';
import { ServicePdfData, ServicePdfTemplate } from '@/types/service-template';
import type { ServiceRequest } from '@/hooks/service/types';
import { logger } from '@/utils/logger';

// Import utilities
import { transformProposalForPdf, transformProposalToQuoteData } from './utils/proposalTransformation';
import { 
  transformServiceForPdf, 
  transformServiceSlipForPdf, 
  getCompanySettingsForPdf 
} from './utils/serviceTransformation';

// Import generation functions
import { 
  generatePdf, 
  generateServicePdf, 
  openPdfInNewTab, 
  downloadPdf, 
  uploadPdfToStorage 
} from './generation/pdfGeneration';

// Import template operations
import {
  createDefaultTemplates,
  ensureDefaultTemplates,
  getTemplates,
  getDefaultTemplate,
  getTemplate,
  saveTemplate,
  deleteTemplate,
  getServiceTemplates,
  getCompanySettings
} from './operations/templateOperations';

/**
 * PDF Export Service
 * Main service class for PDF generation and template management
 */
export class PdfExportService {
  /**
   * Create default templates for a company
   */
  static async createDefaultTemplates(companyId: string) {
    return createDefaultTemplates(companyId);
  }

  /**
   * Ensure default templates exist for current company
   */
  static async ensureDefaultTemplates() {
    return ensureDefaultTemplates();
  }

  /**
   * Transform Proposal to QuoteData format for PDF generation (with async operations)
   */
  static async transformProposalForPdf(proposal: any): Promise<QuoteData> {
    return transformProposalForPdf(proposal);
  }

  /**
   * Transform proposal data to QuoteData format (sync version)
   */
  static transformProposalToQuoteData(proposal: any, companySettings?: any): QuoteData {
    return transformProposalToQuoteData(proposal, companySettings);
  }

  /**
   * Get all PDF templates (optionally filtered by type and company)
   */
  static async getTemplates(companyId?: string, type?: 'quote' | 'invoice' | 'proposal') {
    return getTemplates(companyId, type);
  }

  /**
   * Get first available template for a type
   */
  static async getDefaultTemplate(type: 'quote' | 'invoice' | 'proposal' = 'quote') {
    return getDefaultTemplate(type);
  }

  /**
   * Get template by ID
   */
  static async getTemplate(id: string) {
    return getTemplate(id);
  }

  /**
   * Save or update a template
   */
  static async saveTemplate(template: Omit<PdfTemplate, 'id' | 'created_at' | 'updated_at'>, templateId?: string) {
    return saveTemplate(template, templateId);
  }

  /**
   * Delete a template
   */
  static async deleteTemplate(templateId: string) {
    return deleteTemplate(templateId);
  }

  /**
   * Generate PDF blob from quote data and template
   */
  static async generatePdf(quoteData: QuoteData, options?: { templateId?: string; template?: PdfTemplate }) {
    return generatePdf(quoteData, options);
  }

  /**
   * Open PDF in new tab
   */
  static async openPdfInNewTab(
    quoteData: QuoteData,
    options: PdfExportOptions = {}
  ) {
    try {
      const template = options.templateId 
        ? await getTemplate(options.templateId)
        : await getDefaultTemplate('quote');

      const blob = await generatePdf(quoteData, { template });
      const filename = options.filename || `teklif-${quoteData.number}.pdf`;
      
      await openPdfInNewTab(blob, filename);
    } catch (error) {
      logger.error("Error opening PDF", error);
      throw new Error('PDF açılırken hata oluştu: ' + (error as Error).message);
    }
  }

  /**
   * Download PDF file
   */
  static async downloadPdf(
    quoteData: QuoteData,
    options: PdfExportOptions = {}
  ) {
    try {
      const template = options.templateId 
        ? await getTemplate(options.templateId)
        : await getDefaultTemplate('quote');

      const blob = await generatePdf(quoteData, { template });
      const filename = options.filename || `teklif-${quoteData.number}.pdf`;

      return await downloadPdf(blob, filename);
    } catch (error) {
      logger.error("Error downloading PDF", error);
      throw error;
    }
  }

  /**
   * Upload PDF to Supabase Storage
   */
  static async uploadPdfToStorage(
    quoteData: QuoteData,
    options: PdfExportOptions = {}
  ) {
    try {
      const template = options.templateId 
        ? await getTemplate(options.templateId)
        : await getDefaultTemplate('quote');

      const blob = await generatePdf(quoteData, { template });
      
      const fileName = options.filename || `teklif-${quoteData.number}.pdf`;
      const storagePath = options.storagePath || `quotes/${fileName}`;

      return await uploadPdfToStorage(blob, storagePath);
    } catch (error) {
      logger.error("Error uploading PDF to storage", error);
      throw error;
    }
  }

  /**
   * Get company settings for PDF header from companies table
   */
  static async getCompanySettings() {
    return getCompanySettings();
  }

  /**
   * Transform service request to ServicePdfData format
   */
  static async transformServiceForPdf(service: ServiceRequest): Promise<ServicePdfData> {
    return transformServiceForPdf(service);
  }

  /**
   * Get service PDF templates from pdf_templates table (type='service_slip')
   */
  static async getServiceTemplates(): Promise<ServicePdfTemplate[]> {
    return getServiceTemplates();
  }

  /**
   * Generate service PDF
   */
  static async generateServicePdf(
    serviceData: ServicePdfData,
    options?: { templateId?: string; template?: ServicePdfTemplate }
  ) {
    return generateServicePdf(serviceData, options);
  }

  /**
   * Open service PDF in new tab
   */
  static async openServicePdfInNewTab(
    serviceData: ServicePdfData,
    options: { templateId?: string; filename?: string } = {}
  ) {
    try {
      const blob = await generateServicePdf(serviceData, { templateId: options.templateId });
      const filename = options.filename || `servis-${serviceData.serviceNumber}.pdf`;
      
      await openPdfInNewTab(blob, filename);
    } catch (error) {
      logger.error("Error opening service PDF", error);
      throw new Error('Servis PDF açılırken hata oluştu: ' + (error as Error).message);
    }
  }

  /**
   * Transform service slip to ServicePdfData format
   * This is used for completed services with signatures
   */
  static async transformServiceSlipForPdf(service: ServiceRequest): Promise<ServicePdfData> {
    return transformServiceSlipForPdf(service);
  }
}
