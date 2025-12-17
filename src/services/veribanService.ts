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
        },
        body: payload,
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
    console.log('🔍 [VeribanService] Mükellef sorgulama başlatılıyor...');
    console.log('📋 [VeribanService] Vergi Numarası:', taxNumber);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ [VeribanService] Oturum bulunamadı');
        throw new Error('Oturum bulunamadı');
      }

      console.log('📤 [VeribanService] Edge function çağrılıyor: veriban-check-mukellef');
      console.log('📦 [VeribanService] Request body:', { taxNumber });

      const { data, error } = await supabase.functions.invoke('veriban-check-mukellef', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          taxNumber
        }
      });

      console.log('📥 [VeribanService] Edge function response alındı');
      console.log('📊 [VeribanService] Response data:', JSON.stringify(data, null, 2));
      console.log('⚠️ [VeribanService] Response error:', error);

      if (error) {
        console.error('❌ [VeribanService] Edge function error:', error);
        throw error;
      }

      const result = {
        success: data?.success || false,
        data: data?.data,
        error: data?.error,
        message: data?.message,
      };

      console.log('✅ [VeribanService] Mükellef sorgulama sonucu:', {
        success: result.success,
        isEinvoiceMukellef: result.data ? true : false,
        aliasName: result.data?.aliasName,
        companyName: result.data?.companyName,
        message: result.message
      });

      return result;
    } catch (err) {
      console.error('❌ [VeribanService] Mükellef sorgulama hatası:', err);
      const errorResult = {
        success: false,
        error: err instanceof Error ? err.message : 'Mükellef sorgulaması yapılamadı',
      };
      console.error('❌ [VeribanService] Error result:', errorResult);
      return errorResult;
    }
  }

  /**
   * Gelen faturaları al
   */
  static async getPurchaseInvoices(filters: {
    startDate?: string;
    endDate?: string;
  }): Promise<VeribanResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      const { data, error } = await supabase.functions.invoke('veriban-incoming-invoices', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          startDate: filters.startDate,
          endDate: filters.endDate,
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
        .maybeSingle();

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
  static async getTransferStatus(params: {
    transferFileUniqueId?: string;
    integrationCode?: string;
  }): Promise<VeribanResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      if (!params.transferFileUniqueId && !params.integrationCode) {
        return {
          success: false,
          error: 'transferFileUniqueId veya integrationCode parametrelerinden biri zorunludur',
        };
      }

      const { data, error } = await supabase.functions.invoke('veriban-transfer-status', {
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
        error: err instanceof Error ? err.message : 'Transfer durumu sorgulanamadı',
      };
    }
  }

  /**
   * Gelen fatura durum sorgula
   */
  static async getPurchaseInvoiceStatus(params: {
    invoiceUUID?: string;
    invoiceNumber?: string;
  }): Promise<VeribanResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      if (!params.invoiceUUID && !params.invoiceNumber) {
        return {
          success: false,
          error: 'invoiceUUID veya invoiceNumber parametrelerinden biri zorunludur',
        };
      }

      const { data, error } = await supabase.functions.invoke('veriban-purchase-invoice-status', {
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
        error: err instanceof Error ? err.message : 'Gelen fatura durumu sorgulanamadı',
      };
    }
  }

  /**
   * Fatura detaylarını çek (Fatura kalemleri ile birlikte - parse edilmiş)
   */
  static async getInvoiceDetails(params: {
    invoiceUUID: string;
  }): Promise<VeribanResponse> {
    try {
      console.log('🔍 [VeribanService] Getting invoice details for UUID:', params.invoiceUUID);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      const { data, error } = await supabase.functions.invoke('veriban-invoice-details', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          invoiceUUID: params.invoiceUUID
        }
      });

      console.log('📥 [VeribanService] Invoice details response:', { data, error });

      if (error) throw error;

      return {
        success: data?.success || false,
        data: data?.invoiceDetails,
        error: data?.error,
        message: data?.message,
      };
    } catch (err) {
      console.error('❌ [VeribanService] Get invoice details error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Fatura detayları alınamadı',
      };
    }
  }

  /**
   * Transfer edildi işaretle
   */
  static async markAsTransferred(invoiceUUID: string): Promise<VeribanResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      const { data, error } = await supabase.functions.invoke('veriban-purchase-invoice-transfer', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          invoiceUUID
        }
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
        error: err instanceof Error ? err.message : 'Transfer işareti yapılamadı',
      };
    }
  }
}

