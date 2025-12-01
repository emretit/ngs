import { useState } from 'react';
import { generateNumber, generatePreviewNumber } from '@/utils/numberFormat';
import { useAuth } from '@/hooks/useAuth';

export const useNumberGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const generateProposalNumber = async (): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      return await generateNumber('proposal_number_format', user?.user_metadata?.company_id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Numara üretilirken hata oluştu';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNumber = async (): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      return await generateNumber('invoice_number_format', user?.user_metadata?.company_id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Numara üretilirken hata oluştu';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateServiceNumber = async (): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      return await generateNumber('service_number_format', user?.user_metadata?.company_id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Numara üretilirken hata oluştu';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateOrderNumber = async (): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      return await generateNumber('order_number_format', user?.user_metadata?.company_id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Numara üretilirken hata oluştu';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateCustomerNumber = async (): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      return await generateNumber('customer_number_format', user?.user_metadata?.company_id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Numara üretilirken hata oluştu';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateSupplierNumber = async (): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      return await generateNumber('supplier_number_format', user?.user_metadata?.company_id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Numara üretilirken hata oluştu';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const previewFormat = (format: string, sampleNumber: number = 1): string => {
    return generatePreviewNumber(format, sampleNumber);
  };

  return {
    loading,
    error,
    generateProposalNumber,
    generateInvoiceNumber,
    generateServiceNumber,
    generateOrderNumber,
    generateCustomerNumber,
    generateSupplierNumber,
    previewFormat,
  };
};
