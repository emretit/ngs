import { useState } from 'react';
import { logger } from '@/utils/logger';
import { IntegratorService } from '../services/integratorService';

interface EinvoiceData {
  companyName?: string;
  aliasName?: string;
  taxOffice?: string;
  address?: string;
  city?: string;
  district?: string;
  mersisNo?: string;
  sicilNo?: string;
}

interface EinvoiceResult {
  isEinvoiceMukellef: boolean;
  data?: EinvoiceData;
}

export const useEinvoiceMukellefCheck = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<EinvoiceResult | null>(null);

  const checkEinvoiceMukellef = async (taxNumber: string): Promise<EinvoiceResult> => {
    logger.debug('🔍 [useEinvoiceMukellefCheck] E-invoice mükellef check başlatılıyor...');
    logger.debug('📋 [useEinvoiceMukellefCheck] Vergi Numarası:', taxNumber);
    
    setIsChecking(true);
    try {
      // Use IntegratorService which automatically routes to correct integrator
      logger.debug('📤 [useEinvoiceMukellefCheck] IntegratorService.checkMukellef çağrılıyor...');
      const apiResult = await IntegratorService.checkMukellef(taxNumber);

      logger.debug('📥 [useEinvoiceMukellefCheck] IntegratorService sonucu alındı');
      logger.debug('📊 [useEinvoiceMukellefCheck] API Result:', JSON.stringify(apiResult, null, 2));

      if (!apiResult.success) {
        logger.error('❌ [useEinvoiceMukellefCheck] API başarısız:', apiResult.error);
        throw new Error(apiResult.error || 'Mükellef sorgulama başarısız');
      }

      const checkResult: EinvoiceResult = {
        isEinvoiceMukellef: apiResult.data?.aliasName ? true : false,
        data: apiResult.data as EinvoiceData
      };

      logger.debug('✅ [useEinvoiceMukellefCheck] Mükellef check sonucu:', {
        isEinvoiceMukellef: checkResult.isEinvoiceMukellef,
        hasData: !!checkResult.data,
        aliasName: checkResult.data?.aliasName,
        companyName: checkResult.data?.companyName
      });

      setResult(checkResult);
      return checkResult;
    } catch (error) {
      logger.error('❌ [useEinvoiceMukellefCheck] E-invoice check error:', error);
      const errorResult: EinvoiceResult = {
        isEinvoiceMukellef: false,
        data: undefined
      };
      logger.error('❌ [useEinvoiceMukellefCheck] Error result:', errorResult);
      setResult(errorResult);
      return errorResult;
    } finally {
      setIsChecking(false);
      logger.debug('🏁 [useEinvoiceMukellefCheck] Check işlemi tamamlandı');
    }
  };

  const clearResult = () => {
    setResult(null);
  };

  return {
    checkEinvoiceMukellef,
    isChecking,
    result,
    clearResult
  };
};