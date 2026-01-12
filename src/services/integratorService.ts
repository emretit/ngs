import { supabase } from '../integrations/supabase/client';
import { logger } from '@/utils/logger';

export type IntegratorType = 'nilvera' | 'elogo' | 'veriban';

export interface InvoiceFilters {
  startDate?: string;
  endDate?: string;
  forceRefresh?: boolean;
  customerTaxNumber?: string; // Müşteri VKN filtresi (sadece giden faturalar için)
}

export interface IntegratorServiceResponse {
  success: boolean;
  invoices?: any[];
  data?: any;
  error?: string;
  message?: string;
}

/**
 * Merkezi Entegratör Servisi
 * Nilvera, e-Logo ve Veriban entegrasyonlarını yöneten merkezi servis
 */
export class IntegratorService {
  /**
   * Şirketin seçili entegratörünü getir
   */
  static async getSelectedIntegrator(): Promise<IntegratorType> {
    try {
      // Get current user's company_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.debug('Kullanıcı oturumu bulunamadı, varsayılan olarak Nilvera kullanılıyor');
        return 'nilvera';
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        logger.debug('Company ID bulunamadı, varsayılan olarak Nilvera kullanılıyor');
        return 'nilvera';
      }

      const { data, error } = await supabase
        .from('integrator_settings')
        .select('selected_integrator')
        .eq('company_id', profile.company_id)
        .single();

      if (error) {
        logger.debug('Integrator settings bulunamadı, varsayılan olarak Nilvera kullanılıyor');
        return 'nilvera';
      }

      return (data?.selected_integrator as IntegratorType) || 'nilvera';
    } catch (error) {
      logger.error('getSelectedIntegrator error:', error);
      return 'nilvera'; // Default to Nilvera
    }
  }

  /**
   * Entegratör seçimini kaydet
   */
  static async setSelectedIntegrator(integrator: IntegratorType): Promise<boolean> {
    try {
      // Get current user's company_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        throw new Error('Company ID bulunamadı');
      }

      const { error } = await supabase
        .from('integrator_settings')
        .upsert({
          company_id: profile.company_id,
          selected_integrator: integrator,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('setSelectedIntegrator error:', error);
      return false;
    }
  }

  /**
   * Gelen faturaları al (seçili entegratöre göre)
   */
  static async getIncomingInvoices(
    filters: InvoiceFilters
  ): Promise<IntegratorServiceResponse> {
    try {
      const integrator = await this.getSelectedIntegrator();

      logger.debug('📊 Gelen faturalar alınıyor, entegratör:', integrator);

      if (integrator === 'nilvera') {
        return this.getNilveraInvoices(filters);
      } else if (integrator === 'elogo') {
        return this.getElogoInvoices(filters);
      } else if (integrator === 'veriban') {
        return this.getVeribanInvoices(filters);
      } else {
        return this.getNilveraInvoices(filters); // Default fallback
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Faturalar alınamadı',
      };
    }
  }

  /**
   * Giden faturaları al (seçili entegratöre göre)
   */
  static async getOutgoingInvoices(
    filters: InvoiceFilters
  ): Promise<IntegratorServiceResponse> {
    try {
      const integrator = await this.getSelectedIntegrator();

      logger.debug('📊 Giden faturalar alınıyor, entegratör:', integrator);
      logger.debug('📅 Filtreler:', filters);

      if (integrator === 'veriban') {
        const result = await this.getVeribanOutgoingInvoices(filters);
        logger.debug('✅ Veriban giden faturalar sonucu:', result);
        return result;
      } else {
        // Diğer entegratörler için henüz desteklenmiyor
        logger.debug('⚠️ Giden faturalar için sadece Veriban destekleniyor. Seçili entegratör:', integrator);
        return {
          success: false,
          error: 'Giden faturalar için sadece Veriban destekleniyor',
        };
      }
    } catch (error: any) {
      logger.error('❌ getOutgoingInvoices hatası:', error);
      return {
        success: false,
        error: error.message || 'Giden faturalar alınamadı',
      };
    }
  }

  /**
   * Nilvera'dan fatura al
   */
  private static async getNilveraInvoices(
    filters: InvoiceFilters
  ): Promise<IntegratorServiceResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('nilvera-incoming-invoices', {
        body: { filters }
      });

      if (error) throw error;

      return {
        success: data?.success || false,
        invoices: data?.invoices || [],
        error: data?.error,
        message: data?.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Nilvera faturalar alınamadı',
      };
    }
  }

  /**
   * e-Logo'dan fatura al
   */
  private static async getElogoInvoices(
    filters: InvoiceFilters
  ): Promise<IntegratorServiceResponse> {
    try {
      logger.debug('📊 e-Logo faturalar alınıyor, filtreler:', filters);
      
      const { data, error } = await supabase.functions.invoke('elogo-incoming-invoices', {
        body: { filters }
      });

      if (error) {
        logger.error('❌ e-Logo Edge Function hatası:', error);
        throw error;
      }

      // Check if the response indicates an error
      if (data && !data.success) {
        logger.error('❌ e-Logo function başarısız:', data.error);
        return {
          success: false,
          invoices: [],
          error: data.error || 'e-Logo faturalar alınamadı',
          message: data.message,
        };
      }

      return {
        success: data?.success || false,
        invoices: data?.invoices || [],
        error: data?.error,
        message: data?.message,
      };
    } catch (error: any) {
      logger.error('❌ e-Logo faturalar alınırken hata:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        error
      });
      
      // Extract error message from different error formats
      let errorMessage = 'e-Logo faturalar alınamadı';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Mükellef sorgula (seçili entegratöre göre)
   */
  static async checkMukellef(taxNumber: string): Promise<IntegratorServiceResponse> {
    try {
      const integrator = await this.getSelectedIntegrator();


      if (integrator === 'nilvera') {
        return this.checkNilveraMukellef(taxNumber);
      } else if (integrator === 'elogo') {
        return this.checkElogoMukellef(taxNumber);
      } else if (integrator === 'veriban') {
        return this.checkVeribanMukellef(taxNumber);
      } else {
        return this.checkNilveraMukellef(taxNumber); // Default fallback
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Mükellef sorgulaması yapılamadı',
      };
    }
  }

  /**
   * Nilvera mükellef sorgula
   */
  private static async checkNilveraMukellef(
    taxNumber: string
  ): Promise<IntegratorServiceResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('nilvera-company-info', {
        body: {
          action: 'search_mukellef',
          taxNumber,
        }
      });

      if (error) throw error;

      return {
        success: data?.success || false,
        data: data?.data,
        error: data?.error,
        message: data?.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Nilvera mükellef sorgulaması yapılamadı',
      };
    }
  }

  /**
   * e-Logo mükellef sorgula
   */
  private static async checkElogoMukellef(
    taxNumber: string
  ): Promise<IntegratorServiceResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('elogo-check-mukellef', {
        body: {
          action: 'search_mukellef',
          taxNumber,
        }
      });

      if (error) throw error;

      return {
        success: data?.success || false,
        data: data?.data,
        error: data?.error,
        message: data?.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'e-Logo mükellef sorgulaması yapılamadı',
      };
    }
  }

  /**
   * Veriban'dan fatura al
   */
  private static async getVeribanInvoices(
    filters: InvoiceFilters
  ): Promise<IntegratorServiceResponse> {
    try {
      // Extract date strings from ISO format
      const startDate = filters.startDate ? filters.startDate.split('T')[0] : undefined;
      const endDate = filters.endDate ? filters.endDate.split('T')[0] : undefined;

      const { data, error } = await supabase.functions.invoke('veriban-incoming-invoices', {
        body: {
          startDate,
          endDate,
          forceRefresh: filters.forceRefresh || false,
        }
      });

      if (error) {
        logger.error('Veriban error:', error);

        // Try to extract error message from response body
        if (error.context instanceof Response) {
          try {
            const responseText = await error.context.text();
            const responseJson = JSON.parse(responseText);
            if (responseJson.error) {
              throw new Error(responseJson.error);
            }
          } catch (e) {
            logger.error('Could not parse error response:', e);
          }
        }

        throw error;
      }

      // Transform Veriban invoice format to standard format
      const transformedInvoices = (data?.invoices || []).map((inv: any) => ({
        id: inv.einvoice_id || inv.invoiceUUID || '',
        invoiceNumber: inv.invoiceNumber || '',
        supplierName: inv.supplierName || '',
        supplierTaxNumber: inv.supplierTaxNumber || inv.supplierVkn || '',
        invoiceDate: inv.invoiceDate || new Date().toISOString(),
        dueDate: inv.dueDate || undefined,
        totalAmount: inv.totalAmount || 0,
        currency: inv.currency || 'TRY',
        taxAmount: inv.taxAmount || 0,
        paidAmount: 0, // Default - will be updated when payment is recorded
        status: 'pending',
        isAnswered: false,
        xmlData: inv.rawData || {},
        invoiceType: inv.invoiceType || 'TEMEL',
        invoiceProfile: inv.invoiceProfile || 'TEMELFATURA',
        xmlContent: inv.xmlContent,
      }));

      return {
        success: data?.success || false,
        invoices: transformedInvoices,
        error: data?.error,
        message: data?.message,
      };
    } catch (error: any) {
      logger.error('❌ getVeribanInvoices error:', error);
      return {
        success: false,
        error: error.message || 'Veriban faturalar alınamadı',
      };
    }
  }

  /**
   * Veriban'dan giden faturaları al
   */
  private static async getVeribanOutgoingInvoices(
    filters: InvoiceFilters
  ): Promise<IntegratorServiceResponse> {
    try {
      // Veriban API customerRegisterNumber parametresini zorunlu tutuyor
      if (!filters.customerTaxNumber || filters.customerTaxNumber.length < 10) {
        return {
          success: false,
          error: 'Veriban API için müşteri VKN zorunludur. Lütfen dropdown\'dan bir müşteri seçin.',
          invoices: [],
        };
      }

      // Extract date strings from ISO format
      const startDate = filters.startDate ? filters.startDate.split('T')[0] : undefined;
      const endDate = filters.endDate ? filters.endDate.split('T')[0] : undefined;

      logger.debug('🔍 Veriban giden faturalar çağırılıyor:', { 
        startDate, 
        endDate, 
        customerTaxNumber: filters.customerTaxNumber,
        forceRefresh: filters.forceRefresh 
      });

      const { data, error } = await supabase.functions.invoke('veriban-outgoing-invoices2', {
        body: {
          startDate,
          endDate,
          forceRefresh: filters.forceRefresh || false,
          customerTaxNumber: filters.customerTaxNumber, // Opsiyonel - müşteri VKN filtresi
          includeStatus: true, // Durum bilgilerini de çek
          limit: 100,
          offset: 0
        }
      });

      logger.debug('📦 Veriban API yanıtı DATA:', JSON.stringify(data, null, 2));
      logger.debug('❌ Veriban API yanıtı ERROR:', JSON.stringify(error, null, 2));

      if (error) {
        logger.error('Veriban outgoing invoices error:', error);

        // Try to extract error message from response body
        if (error.context instanceof Response) {
          try {
            const responseText = await error.context.text();
            const responseJson = JSON.parse(responseText);
            if (responseJson.error) {
              throw new Error(responseJson.error);
            }
          } catch (e) {
            logger.error('Could not parse error response:', e);
          }
        }

        throw error;
      }

      // Transform Veriban outgoing invoice format to standard format
      const transformedInvoices = (data?.invoices || []).map((inv: any) => ({
        id: inv.id || inv.invoiceUUID || '',
        invoiceNumber: inv.invoiceNumber || '',
        customerName: inv.customerName || '',
        customerTaxNumber: inv.customerTaxNumber || '',
        invoiceDate: inv.invoiceDate || new Date().toISOString(),
        dueDate: inv.dueDate || undefined,
        totalAmount: inv.totalAmount || 0,
        currency: inv.currency || 'TRY',
        taxAmount: inv.taxAmount || 0,
        taxExclusiveAmount: inv.taxExclusiveAmount || 0,
        status: inv.status || 'sent',
        sentAt: inv.sentAt || null,
        deliveredAt: inv.deliveredAt || null,
        invoiceType: inv.invoiceType || 'TEMEL',
        invoiceProfile: inv.invoiceProfile || 'TEMELFATURA',
        invoiceUUID: inv.invoiceUUID || inv.id,
        // Veriban durum bilgileri - XML'den gelen bilgiler
        elogoStatus: inv.stateCode || inv.elogoStatus || null,
        elogoCode: inv.answerStateCode || inv.elogoCode || null,
        elogoDescription: inv.statusDescription || inv.stateDescription || inv.elogoDescription || null,
        answerType: inv.answerType || null,
        isAnswered: inv.isAnswered || false,
        xmlContent: inv.xmlContent || null,
      }));

      return {
        success: data?.success || false,
        invoices: transformedInvoices,
        error: data?.error,
        message: data?.message,
      };
    } catch (error: any) {
      logger.error('❌ getVeribanOutgoingInvoices error:', error);
      return {
        success: false,
        error: error.message || 'Veriban giden faturalar alınamadı',
      };
    }
  }

  /**
   * Veriban mükellef sorgula
   */
  private static async checkVeribanMukellef(
    taxNumber: string
  ): Promise<IntegratorServiceResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('veriban-check-mukellef', {
        body: {
          taxNumber,
        }
      });

      if (error) {
        logger.error('Veriban edge function error:', error);
        throw error;
      }

      return {
        success: data?.success || false,
        data: data?.data,
        error: data?.error,
        message: data?.message,
      };
    } catch (error: any) {
      logger.error('Veriban mükellef sorgulama hatası:', error);
      return {
        success: false,
        error: error.message || 'Veriban mükellef sorgulaması yapılamadı',
      };
    }
  }

  /**
   * Entegratör durumunu kontrol et
   */
  static async checkIntegratorStatus(): Promise<{
    nilvera: boolean;
    elogo: boolean;
    veriban: boolean;
    selected: IntegratorType;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { nilvera: false, elogo: false, veriban: false, selected: 'nilvera' };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        return { nilvera: false, elogo: false, veriban: false, selected: 'nilvera' };
      }

      // Check Nilvera
      const { data: nilveraAuth } = await supabase
        .from('nilvera_auth')
        .select('is_active')
        
        .maybeSingle();

      // Check e-Logo
      const { data: elogoAuth } = await supabase
        .from('elogo_auth')
        .select('is_active')
        
        .maybeSingle();

      // Check Veriban
      const { data: veribanAuth } = await supabase
        .from('veriban_auth')
        .select('is_active')
        
        .maybeSingle();

      // Get selected integrator
      const selected = await this.getSelectedIntegrator();

      return {
        nilvera: nilveraAuth?.is_active || false,
        elogo: elogoAuth?.is_active || false,
        veriban: veribanAuth?.is_active || false,
        selected,
      };
    } catch (error) {
      logger.error('checkIntegratorStatus error:', error);
      return { nilvera: false, elogo: false, veriban: false, selected: 'nilvera' };
    }
  }
}
