import { useEffect } from 'react';
import { useEinvoiceMukellefCheck } from './useEinvoiceMukellefCheck';
import { toast } from 'sonner';

interface UseAutoMukellefCheckProps {
  customerId?: string;
  taxNumber?: string;
  apiKey?: string;
  enabled?: boolean;
}

export const useAutoMukellefCheck = ({
  customerId,
  taxNumber,
  apiKey,
  enabled = true
}: UseAutoMukellefCheckProps) => {
  const { checkEinvoiceMukellef } = useEinvoiceMukellefCheck();

  useEffect(() => {
    if (!enabled || !customerId || !taxNumber || !apiKey) {
      return;
    }

    const checkMukellef = async () => {
      try {
        // Gerçek API çağrısı yerine mock data - test için
        await new Promise(resolve => setTimeout(resolve, 1000));
        const isMukellef = Math.random() > 0.5; // Mock result
        
        await checkEinvoiceMukellef(taxNumber);
        
        console.log(`Auto check completed for customer ${customerId}: ${isMukellef ? 'Mükellef' : 'Değil'}`);
      } catch (error) {
        console.error('Auto mukellef check failed:', error);
      }
    };

    // VKN 10 haneli ve sadece rakam ise kontrol et
    if (taxNumber.length === 10 && /^\d+$/.test(taxNumber)) {
      checkMukellef();
    }
  }, [customerId, taxNumber, apiKey, enabled, checkEinvoiceMukellef]);

  return null;
};