import { supabase } from '../integrations/supabase/client';

export interface VeribanAuthData {
  username: string;
  password: string;
  testMode: boolean;
}

export interface VeribanResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * Veriban Service
 * Frontend'den Veriban edge functions'larını çağırmak için servis katmanı
 */
export class VeribanService {
  /**
   * Veriban kimlik doğrulama
   */
  static async authenticate(authData: VeribanAuthData): Promise<VeribanResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      const payload = {
        action: 'authenticate',
        ...authData,
      };

      const { data, error } = await supabase.functions.invoke('veriban-auth', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (error) throw error;

      return {
        success: data?.success || false,
        message: data?.message,
        error: data?.error,
        data: data,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Veriban bağlantısı başarısız',
      };
    }
  }

  /**
   * Mükellef sorgulama
   */
  static async checkMukellef(taxNumber: string): Promise<VeribanResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      const { data, error } = await supabase.functions.invoke('veriban-check-mukellef', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
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
  static async getPurchaseInvoices(filters: {
    startDate?: string;
    endDate?: string;
    pageIndex?: number;
    pageSize?: number;
  }): Promise<VeribanResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      const { data, error } = await supabase.functions.invoke('veriban-document-list', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          action: 'getPurchaseInvoices',
          ...filters
        }
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
   * Giden faturaları al
   */
  static async getSalesInvoices(filters: {
    startDate?: string;
    endDate?: string;
    pageIndex?: number;
    pageSize?: number;
  }): Promise<VeribanResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      const { data, error } = await supabase.functions.invoke('veriban-document-list', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          action: 'getSalesInvoices',
          ...filters
        }
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
   * Veriban bağlantı durumunu kontrol et
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

      const { data: veribanAuth } = await supabase
        .from('veriban_auth')
        .select('is_active')
        .eq('company_id', profile.company_id)
        .single();

      return veribanAuth?.is_active || false;
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
    customerAlias?: string;
    isDirectSend?: boolean;
    integrationCode?: string;
  }): Promise<VeribanResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      const { data, error } = await supabase.functions.invoke('veriban-send-invoice', {
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
    invoiceUUID?: string;
  }): Promise<VeribanResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      const { data, error } = await supabase.functions.invoke('veriban-invoice-status', {
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
   * Fatura indir
   */
  static async downloadInvoice(params: {
    invoiceUUID: string;
    invoiceType?: 'sales' | 'purchase';
  }): Promise<VeribanResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      const { data, error } = await supabase.functions.invoke('veriban-document-data', {
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
        error: err instanceof Error ? err.message : 'Fatura indirilemedi',
      };
    }
  }

  /**
   * Gelen faturaya cevap ver
   */
  static async answerInvoice(params: {
    invoiceUUID: string;
    answerType: 'KABUL' | 'RED';
    description?: string;
  }): Promise<VeribanResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      const { data, error } = await supabase.functions.invoke('veriban-answer-invoice', {
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
        error: err instanceof Error ? err.message : 'Fatura cevabı gönderilemedi',
      };
    }
  }

  /**
   * Transfer durum sorgula
   */
  static async getTransferStatus(transferFileUniqueId: string): Promise<VeribanResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      // Note: This would require a new Edge Function: veriban-transfer-status
      // For now, return error
      return {
        success: false,
        error: 'Transfer durum sorgulama özelliği henüz implement edilmedi',
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Transfer durumu sorgulanamadı',
      };
    }
  }
}

