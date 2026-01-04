import { useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { TemplateSchema } from '@/types/pdf-template';
import { PdfExportService } from '@/services/pdf/pdfExportService';

export const usePdfCompanyInfo = (form: UseFormReturn<TemplateSchema>) => {
  const companyInfoLoadedRef = useRef(false);

  const loadCompanyInfo = async (showToast = false) => {
    // Prevent duplicate calls
    if (companyInfoLoadedRef.current && showToast) {
      return;
    }
    
    try {
      const companySettings = await PdfExportService.getCompanySettings();
      
      if (companySettings && Object.keys(companySettings).length > 0) {
        // Get current form values to preserve other fields
        const currentValues = form.getValues();
        const settings = companySettings as any;
        
        // Update header with company info using form.reset for reliable update
        const updatedValues = {
          ...currentValues,
          header: {
            ...currentValues.header,
            companyName: settings.company_name || '',
            companyAddress: settings.company_address || '',
            companyPhone: settings.company_phone || '',
            companyEmail: settings.company_email || '',
            companyWebsite: settings.company_website || '',
            companyTaxNumber: settings.company_tax_number || '',
            ...(settings.company_logo_url ? { logoUrl: settings.company_logo_url } : {})
          }
        };
        
        // Use form.reset to reliably update all values and trigger re-render
        form.reset(updatedValues, {
          keepDirty: false,
          keepErrors: false,
          keepIsSubmitted: false,
          keepTouched: false,
          keepIsValid: false,
          keepSubmitCount: false
        });
        
        if (showToast && !companyInfoLoadedRef.current) {
          companyInfoLoadedRef.current = true;
          toast.success('Şirket bilgileri sistem ayarlarından yüklendi');
        }
      } else {
        if (showToast) {
          toast.warning('Şirket bilgileri bulunamadı. Lütfen Sistem Ayarları sayfasından şirket bilgilerinizi kaydedin.');
        }
      }
    } catch (error) {
      console.error('Error loading company info:', error);
      if (showToast) {
        toast.error('Şirket bilgileri yüklenirken hata oluştu');
      }
    }
  };

  return {
    loadCompanyInfo,
    companyInfoLoadedRef
  };
};

