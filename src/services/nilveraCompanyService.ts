import { supabase } from '../integrations/supabase/client';

export interface NilveraCompanyData {
  [key: string]: any;
}

export interface NilveraCompanyResponse {
  success: boolean;
  data: NilveraCompanyData;
  timestamp: string;
}

export interface NilveraCompanyError {
  error: string;
  message?: string;
  status?: number;
  timestamp: string;
}

export class NilveraCompanyService {
  /**
   * Nilvera API'sinden firma bilgilerini getirir
   * @param apiKey - Nilvera API anahtarı
   * @returns Promise<NilveraCompanyResponse | NilveraCompanyError>
   */
  static async getCompanyInfo(apiKey: string): Promise<NilveraCompanyResponse | NilveraCompanyError> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'nilvera-company-info',
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (error) {
        return {
          error: 'Supabase function error',
          message: error.message,
          timestamp: new Date().toISOString()
        };
      }

      return data as NilveraCompanyResponse | NilveraCompanyError;
    } catch (err) {
      return {
        error: 'Network error',
        message: err instanceof Error ? err.message : 'Bilinmeyen hata',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Firma bilgilerini test eder (API key geçerliliği kontrolü)
   * @param apiKey - Nilvera API anahtarı
   * @returns Promise<boolean> - API key geçerli mi?
   */
  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const result = await this.getCompanyInfo(apiKey);
      return 'success' in result && result.success;
    } catch {
      return false;
    }
  }
}
