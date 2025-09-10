import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { supabase } from '@/integrations/supabase/client';
import { ServiceSlipData, ServiceSlipPdfOptions } from '@/types/service-slip';
import ServiceSlipRenderer from '@/components/pdf/ServiceSlipRenderer';

export class ServiceSlipPdfService {
  /**
   * Generate PDF blob from service slip data
   */
  static async generatePdf(slipData: ServiceSlipData): Promise<Blob> {
    try {
      const pdfElement = React.createElement(ServiceSlipRenderer, { data: slipData });
      const blob = await pdf(pdfElement).toBlob();
      return blob;
    } catch (error) {
      console.error('Error generating service slip PDF:', error);
      throw new Error('Servis fişi PDF oluşturulamadı: ' + (error as Error).message);
    }
  }

  /**
   * Download service slip PDF
   */
  static async downloadPdf(
    slipData: ServiceSlipData,
    options: ServiceSlipPdfOptions = {}
  ) {
    try {
      const blob = await this.generatePdf(slipData);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = options.filename || `servis-fisi-${slipData.slip_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Error downloading service slip PDF:', error);
      throw error;
    }
  }

  /**
   * Open PDF in new tab
   */
  static async openPdfInNewTab(slipData: ServiceSlipData) {
    try {
      const blob = await this.generatePdf(slipData);
      
      // Create blob URL and open in new tab
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        // Fallback to download if popup blocked
        const link = document.createElement('a');
        link.href = url;
        link.download = `servis-fisi-${slipData.slip_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Clean up blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('Error opening service slip PDF:', error);
      throw new Error('Servis fişi PDF açılırken hata oluştu: ' + (error as Error).message);
    }
  }

  /**
   * Upload PDF to Supabase Storage
   */
  static async uploadPdfToStorage(
    slipData: ServiceSlipData,
    options: ServiceSlipPdfOptions = {}
  ) {
    try {
      const blob = await this.generatePdf(slipData);
      
      // Generate file path
      const fileName = options.filename || `servis-fisi-${slipData.slip_number}.pdf`;
      const storagePath = options.storagePath || `service-slips/${fileName}`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(storagePath, blob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (error) {
        console.error('Error uploading service slip PDF:', error);
        throw new Error('Servis fişi PDF yüklenirken hata oluştu: ' + error.message);
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
      console.error('Error uploading service slip PDF to storage:', error);
      throw error;
    }
  }
}