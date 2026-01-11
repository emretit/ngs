import { supabase } from '../integrations/supabase/client';

export interface ElogoAuthData {
  username: string;
  password: string;
  testMode: boolean;
}

export interface ElogoResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * e-Logo Service
 * Frontend'den e-Logo edge functions'larını çağırmak için servis katmanı
 */
export class ElogoService {
  /**
   * e-Logo kimlik doğrulama
   */
  static async authenticate(authData: ElogoAuthData): Promise<ElogoResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      const { data, error } = await supabase.functions.invoke('elogo-auth', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          action: 'authenticate',
          ...authData
        }
      });

      if (error) throw error;

      return {
        success: data?.success || false,
        message: data?.message,
        error: data?.error,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'e-Logo bağlantısı başarısız',
      };
    }
  }

  /**
   * Mükellef sorgulama
   */
  static async checkMukellef(taxNumber: string): Promise<ElogoResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('elogo-check-mukellef', {
        body: {
          action: 'search_mukellef',
          taxNumber
        }
      });

      if (error) throw error;

      return {
        success: data?.success || false,
        data: data?.data,
        error: data?.error,
        message: data?.message,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Mükellef sorgulaması yapılamadı',
      };
    }
  }

  /**
   * Gelen faturaları al
   */
  static async getIncomingInvoices(filters: {
    startDate?: string;
    endDate?: string;
  }): Promise<ElogoResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('elogo-incoming-invoices', {
        body: { filters }
      });

      if (error) throw error;

      return {
        success: data?.success || false,
        data: data?.invoices,
        error: data?.error,
        message: data?.message,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Faturalar alınamadı',
      };
    }
  }

  /**
   * e-Logo bağlantı durumunu kontrol et
   */
  static async checkConnectionStatus(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return false;

      const { data: elogoAuth } = await supabase
        .from('elogo_auth')
        .select('is_active')
        
        .single();

      return elogoAuth?.is_active || false;
    } catch {
      return false;
    }
  }

  /**
   * Fatura gönder
   */
  static async sendInvoice(params: {
    invoiceId: string;
    xmlContent: string;
    documentType?: string;
    customerAlias?: string;
    signed?: number;
  }): Promise<ElogoResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      const { data, error } = await supabase.functions.invoke('elogo-send-invoice', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: params
      });

      if (error) throw error;

      return {
        success: data?.success || false,
        data: data,
        error: data?.error,
        message: data?.message,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Fatura gönderilemedi',
      };
    }
  }

  /**
   * Fatura durum sorgula
   */
  static async getInvoiceStatus(params: {
    invoiceId?: string;
    ettn?: string;
    documentType?: string;
  }): Promise<ElogoResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      const { data, error } = await supabase.functions.invoke('elogo-invoice-status', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: params
      });

      if (error) throw error;

      return {
        success: data?.success || false,
        data: data?.status,
        error: data?.error,
        message: data?.message,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Fatura durumu sorgulanamadı',
      };
    }
  }

  /**
   * Belge listesi al
   */
  static async getDocumentList(params: {
    documentType?: string;
    beginDate: string; // yyyy-MM-dd
    endDate: string; // yyyy-MM-dd
    opType?: string; // '1': Giden, '2': Gelen
    dateBy?: string; // '0': Oluşturma, '1': Belge tarihi
  }): Promise<ElogoResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      const { data, error } = await supabase.functions.invoke('elogo-document-list', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: params
      });

      if (error) throw error;

      return {
        success: data?.success || false,
        data: data?.documents,
        error: data?.error,
        message: data?.message,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Belge listesi alınamadı',
      };
    }
  }

  /**
   * Belge verisini formatında al (HTML, PDF, XML)
   */
  static async getDocumentData(params: {
    ettn: string;
    documentType?: string;
    dataFormat?: 'UBL' | 'HTML' | 'PDF'; // Default: PDF
  }): Promise<ElogoResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      const { data, error } = await supabase.functions.invoke('elogo-document-data', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: params
      });

      if (error) throw error;

      return {
        success: data?.success || false,
        data: data?.data,
        error: data?.error,
        message: data?.message,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Belge verisi alınamadı',
      };
    }
  }

  /**
   * 2FA kodu al (e-Arşiv Type 2 için)
   */
  static async get2FACode(): Promise<ElogoResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      // Note: This would require a new Edge Function: elogo-get-2fa-code
      // For now, return error
      return {
        success: false,
        error: '2FA kodu alma özelliği henüz implement edilmedi',
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '2FA kodu alınamadı',
      };
    }
  }
}
