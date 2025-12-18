import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IntegratorService } from '@/services/integratorService';

interface CompanyInfoData {
  name: string;
  taxNumber: string;
  taxOffice: string;
  address: string;
  district: string;
  city: string;
  country: string;
  postalCode: string;
  phoneNumber: string;
  fax: string;
  email: string;
  website: string;
  isActive: boolean;
  aliases: Array<{
    Alias: string;
    AliasType: number;
    Type: number;
  }>;
  payeeFinancialAccountID: string;
  paymentMeansChannelCode: string;
  paymentMeansCode: string;
}

interface MukellefData {
  aliasName: string;
  companyName: string;
  taxNumber: string;
  taxOffice: string;
  address: string;
  city: string;
  district: string;
  country: string;
  postalCode: string;
  phoneNumber: string;
  fax: string;
  email: string;
  website: string;
  isActive: boolean;
  isDeleted: boolean;
  mersisNo: string;
  sicilNo: string;
  accountType: string;
  type: string;
  documentType?: string; // E-Belge Tipi (Invoice, ArchiveInvoice, Waybill, etc.)
  aliases: Array<{
    Alias: string;
    AliasType: number;
    Type: number;
  }>;
  payeeFinancialAccountID: string;
  paymentMeansChannelCode: string;
  paymentMeansCode: string;
}

interface CompanyInfoResult {
  success: boolean;
  data?: CompanyInfoData;
  message?: string;
  error?: string;
}

interface MukellefCheckResult {
  success: boolean;
  isEinvoiceMukellef: boolean;
  data?: MukellefData;
  message?: string;
  error?: string;
}

export const useNilveraCompanyInfo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfoData | null>(null);
  const [mukellefInfo, setMukellefInfo] = useState<MukellefData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Firma bilgilerini getir (kendi firma bilgileri)
  const getCompanyInfo = useCallback(async (): Promise<CompanyInfoResult> => {
    setIsLoading(true);
    setError(null);
    setCompanyInfo(null);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      // Call Nilvera edge function - kendi firma bilgileri için taxNumber'a gerek yok
      const { data, error } = await supabase.functions.invoke('nilvera-company-info', {
        body: {
          action: 'get_company_info'
          // taxNumber parametresini kaldırdık çünkü kendi firma bilgilerini getiriyoruz
        }
      });

      if (error) {
        console.error('Firma bilgileri alma hatası:', error);
        throw new Error(error.message || 'Firma bilgileri alınamadı');
      }

      if (!data.success) {
        throw new Error(data.error || 'Firma bilgileri alma işlemi başarısız');
      }

      setCompanyInfo(data.data);
      return {
        success: true,
        data: data.data,
        message: data.message
      };

    } catch (error) {
      console.error('Firma bilgileri alma hatası:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mükellef sorgulama (vergi numarasına göre) - IntegratorService kullanarak
  const searchMukellef = useCallback(async (taxNumber: string): Promise<MukellefCheckResult> => {
    if (!taxNumber || taxNumber.length < 10) {
      const result = {
        success: false,
        isEinvoiceMukellef: false,
        error: 'Geçerli bir vergi numarası giriniz (10-11 haneli)'
      };
      setError(result.error);
      return result;
    }

    setIsLoading(true);
    setError(null);
    setMukellefInfo(null);

    try {
      // Use IntegratorService which automatically routes to correct integrator
      const result = await IntegratorService.checkMukellef(taxNumber);

      if (!result.success) {
        throw new Error(result.error || 'Mükellef sorgulama işlemi başarısız');
      }

      if (result.data) {
        setMukellefInfo(result.data as MukellefData);
      }

      // Determine if mukellef based on response
      const isEinvoiceMukellef = result.data?.aliasName ? true : false;

      return {
        success: true,
        isEinvoiceMukellef,
        data: result.data as MukellefData,
        message: result.message
      };

    } catch (error) {
      console.error('Mükellef sorgulama hatası:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setError(errorMessage);
      return {
        success: false,
        isEinvoiceMukellef: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setCompanyInfo(null);
    setMukellefInfo(null);
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    companyInfo,
    mukellefInfo,
    error,
    
    // Actions
    getCompanyInfo,
    searchMukellef,
    clearData
  };
};
