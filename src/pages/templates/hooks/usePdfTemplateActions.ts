import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { TemplateSchema, PdfTemplate, QuoteData } from '@/types/pdf-template';
import { PdfExportService } from '@/services/pdf/pdfExportService';

export const usePdfTemplateActions = (
  form: UseFormReturn<TemplateSchema>,
  isNewTemplate: boolean,
  templateName: string,
  selectedTemplate: PdfTemplate | null,
  setSelectedTemplate: React.Dispatch<React.SetStateAction<PdfTemplate | null>>,
  previewData: QuoteData | null
) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = useCallback(async (data: TemplateSchema) => {
    setIsLoading(true);
    try {
      // Get current form values to ensure logo URL is included
      const currentFormData = form.getValues();
      const currentLogoUrl = currentFormData.header?.logoUrl;
      
      // Merge current form data with submitted data to ensure logo URL is preserved
      const mergedData = {
        ...data,
        header: {
          ...data.header,
          logoUrl: currentLogoUrl || data.header?.logoUrl
        }
      };

      if (isNewTemplate) {
        // Create new template
        const newTemplate: Omit<PdfTemplate, 'id' | 'created_at' | 'updated_at'> = {
          name: templateName || 'Yeni Şablon',
          type: 'quote',
          locale: 'tr',
          schema_json: mergedData,
          version: 1,
          is_default: false,
          created_by: null,
        };
        
        const savedTemplate = await PdfExportService.saveTemplate(newTemplate);
        toast.success('Şablon başarıyla oluşturuldu');
        
        // Navigate to edit mode
        navigate(`/pdf-templates/edit/${savedTemplate.id}`);
      } else if (selectedTemplate) {
        // Update existing template
        const updatedTemplate: Omit<PdfTemplate, 'id' | 'created_at' | 'updated_at'> = {
          name: templateName || selectedTemplate.name,
          type: selectedTemplate.type,
          locale: selectedTemplate.locale,
          schema_json: mergedData,
          version: selectedTemplate.version + 1,
          is_default: selectedTemplate.is_default,
          created_by: selectedTemplate.created_by,
        };
        
        // Pass the template ID for update
        await PdfExportService.saveTemplate(updatedTemplate, selectedTemplate.id);
        toast.success('Şablon başarıyla kaydedildi');
        
        // Update the selected template with the new schema to prevent reload issues
        setSelectedTemplate(prev => prev ? { 
          ...prev, 
          name: templateName || prev.name,
          schema_json: mergedData, 
          version: prev.version + 1 
        } : null);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Şablon kaydedilirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [form, isNewTemplate, templateName, selectedTemplate, setSelectedTemplate, navigate]);

  const handleDownloadPdf = useCallback(async () => {
    if (!previewData || !selectedTemplate) return;
    
    setIsLoading(true);
    try {
      await PdfExportService.downloadPdf(previewData, { templateId: selectedTemplate.id });
      toast.success('PDF başarıyla indirildi');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('PDF indirilirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [previewData, selectedTemplate]);

  return {
    handleSave,
    handleDownloadPdf,
    isLoading
  };
};

