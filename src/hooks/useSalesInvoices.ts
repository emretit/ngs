
import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SalesInvoice {
  id: string;
  fatura_no: string;
  customer_id: string;
  order_id?: string;
  service_request_id?: string;
  employee_id?: string;
  company_id?: string;
  fatura_tarihi: string;
  vade_tarihi?: string;
  aciklama?: string;
  notlar?: string;
  para_birimi: string;
  ara_toplam: number;
  kdv_tutari: number;
  indirim_tutari: number;
  toplam_tutar: number;
  odenen_tutar: number;
  odeme_durumu: 'odendi' | 'kismi_odendi' | 'odenmedi' | 'gecikti' | 'iptal';
  document_type?: 'e_fatura' | 'e_arsiv' | 'fatura' | 'irsaliye' | 'makbuz' | 'serbest_meslek_makbuzu';
  durum: 'taslak' | 'gonderildi' | 'onaylandi' | 'iptal';
  odeme_sekli?: string;
  banka_bilgileri?: string;
  pdf_url?: string;
  xml_data?: any;
  ek_belgeler?: any;
  // E-fatura kolonları
  einvoice_status?: 'draft' | 'sending' | 'sent' | 'delivered' | 'accepted' | 'rejected' | 'cancelled' | 'error';
  nilvera_invoice_id?: string;
  einvoice_sent_at?: string;
  einvoice_error_message?: string;
  // Veriban E-Fatura Durum Bilgileri
  elogo_status?: number | null;
  answer_type?: string | null;
  elogo_code?: number | null;
  elogo_description?: string | null;
  customer?: {
    name: string;
    tax_number?: string;
    company?: string;
  };
  supplier?: {
    name: string;
    tax_number?: string;
    company?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SalesInvoiceItem {
  id: string;
  sales_invoice_id: string;
  product_id?: string;
  company_id?: string;
  urun_adi: string;
  aciklama?: string;
  miktar: number;
  birim: string;
  birim_fiyat: number;
  kdv_orani: number;
  indirim_orani?: number;
  satir_toplami: number;
  kdv_tutari: number;
  para_birimi: string;
  sira_no?: number;
  product?: {
    name: string;
    sku?: string;
  };
}

export const useSalesInvoices = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    dateRange: { from: null, to: null } as { from: Date | null, to: Date | null }
  });

  const fetchInvoices = async (): Promise<SalesInvoice[]> => {
    let query = supabase
      .from("sales_invoices")
      .select(`
        *,
        customer:customers(name, tax_number, company),
        supplier:suppliers(name, tax_number, company),
        einvoice_status,
        nilvera_invoice_id,
        einvoice_sent_at,
        einvoice_error_message
      `)
      .order("created_at", { ascending: false });

    if (filters.status) {
      query = query.eq("odeme_durumu", filters.status);
    }

    if (filters.search) {
      query = query.or(`fatura_no.ilike.%${filters.search}%,customer.name.ilike.%${filters.search}%,supplier.name.ilike.%${filters.search}%`);
    }

    if (filters.dateRange.from) {
      query = query.gte("fatura_tarihi", filters.dateRange.from.toISOString().split('T')[0]);
    }

    if (filters.dateRange.to) {
      query = query.lte("fatura_tarihi", filters.dateRange.to.toISOString().split('T')[0]);
    }

    const { data, error } = await query;
    
    if (error) {
      toast.error("Faturalar yüklenirken hata oluştu");
      throw error;
    }
    
    return data as unknown as SalesInvoice[];
  };

  const fetchInvoiceById = async (id: string): Promise<SalesInvoice> => {
    const { data, error } = await supabase
      .from("sales_invoices")
      .select(`
        *,
        customer:customers(name, tax_number, company),
        supplier:suppliers(name, tax_number, company)
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Fatura yüklenirken hata oluştu");
      throw error;
    }

    return data as unknown as SalesInvoice;
  };
  
  const fetchInvoiceItems = async (invoiceId: string): Promise<SalesInvoiceItem[]> => {
    const { data, error } = await supabase
      .from("sales_invoice_items")
      .select(`
        *,
        product:products(name, sku)
      `)
      .eq("sales_invoice_id", invoiceId);

    if (error) {
      toast.error("Fatura kalemleri yüklenirken hata oluştu");
      throw error;
    }

    return data as unknown as SalesInvoiceItem[];
  };

  const createInvoice = async (invoiceData: Partial<SalesInvoice>, items: Partial<SalesInvoiceItem>[]) => {
    // Get current user's company_id
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user?.id)
      .single();

    // Add company_id to invoice data
    const invoiceWithCompany = {
      ...invoiceData,
      company_id: profile?.company_id
    };

    // First create the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("sales_invoices")
      .insert([invoiceWithCompany])
      .select()
      .single();

    if (invoiceError) {
      toast.error("Fatura oluşturulurken hata oluştu");
      throw invoiceError;
    }

    // Then create the invoice items
    if (items.length > 0) {
      const itemsWithInvoiceId = items.map(item => ({
        ...item,
        sales_invoice_id: (invoice as any).id,
        company_id: profile?.company_id
      }));

      const { error: itemsError } = await supabase
        .from("sales_invoice_items")
        .insert(itemsWithInvoiceId);

      if (itemsError) {
        toast.error("Fatura kalemleri oluşturulurken hata oluştu");
        throw itemsError;
      }
    }

    // Müşteri bakiyesini güncelle (satış faturası = müşteriye borç = bakiye artar/pozitif yönde artar)
    // Pozitif bakiye = müşteri bize borçlu, Negatif bakiye = biz müşteriye borçluyuz
    if (invoiceData.customer_id && invoiceData.toplam_tutar) {
      const { data: customerData, error: customerFetchError } = await supabase
        .from('customers')
        .select('balance')
        .eq('id', invoiceData.customer_id)
        .single();
      
      if (customerFetchError) {
        logger.error('❌ Error fetching customer balance:', customerFetchError);
        // Hata olsa bile devam et, sadece logla
      } else if (customerData) {
        const newCustomerBalance = (customerData.balance || 0) + (invoiceData.toplam_tutar as number);
        const { error: customerUpdateError } = await supabase
          .from('customers')
          .update({ balance: newCustomerBalance })
          .eq('id', invoiceData.customer_id);
        
        if (customerUpdateError) {
          logger.error('❌ Error updating customer balance:', customerUpdateError);
          // Hata olsa bile devam et, sadece logla
        } else {
          logger.debug('✅ Customer balance updated:', newCustomerBalance);
        }
      }
    }

    toast.success("Fatura başarıyla oluşturuldu");
    return invoice;
  };

  const updateInvoice = async ({ id, data }: { id: string, data: Partial<SalesInvoice> }) => {
    const { error } = await supabase
      .from("sales_invoices")
      .update(data)
      .eq("id", id);

    if (error) {
      toast.error("Fatura güncellenirken hata oluştu");
      throw error;
    }

    toast.success("Fatura başarıyla güncellendi");
    return { id };
  };

  const recordPayment = async ({ id, amount }: { id: string, amount: number }) => {
    // Get current invoice
    const { data: invoice, error: fetchError } = await supabase
      .from("sales_invoices")
      .select("*")
      .eq("id", id)
      .single();
    
    if (fetchError) {
      toast.error("Fatura bilgisi alınamadı");
      throw fetchError;
    }
    
    // Calculate new paid amount and status
    const typedInvoice = invoice as unknown as SalesInvoice;
    const newPaidAmount = parseFloat(String(typedInvoice.odenen_tutar || 0)) + amount;
    let newStatus: 'odendi' | 'kismi_odendi' | 'odenmedi' = 'odenmedi';
    
    if (newPaidAmount >= parseFloat(String(typedInvoice.toplam_tutar))) {
      newStatus = 'odendi';
    } else if (newPaidAmount > 0) {
      newStatus = 'kismi_odendi';
    }
    
    // Update invoice
    const { error: updateError } = await supabase
      .from("sales_invoices")
      .update({
        odenen_tutar: newPaidAmount,
        odeme_durumu: newStatus
      })
      .eq("id", id);
    
    if (updateError) {
      toast.error("Ödeme kaydedilirken hata oluştu");
      throw updateError;
    }
    
    toast.success("Ödeme başarıyla kaydedildi");
    return { id };
  };

  const deleteInvoice = async (id: string) => {
    const { error } = await supabase
      .from("sales_invoices")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Fatura silinirken hata oluştu");
      throw error;
    }

    toast.success("Fatura başarıyla silindi");
    return { id };
  };

  const { data: invoices, isLoading, error, refetch } = useQuery({
    queryKey: ['salesInvoices', filters],
    queryFn: fetchInvoices,
    refetchOnWindowFocus: true, // Pencere odaklandığında yenile
    refetchOnMount: true, // Component mount olduğunda yenile
    staleTime: 30 * 1000, // 30 saniye boyunca fresh kabul et
  });

  // Supabase Realtime subscription - veritabanı değişikliklerinde tabloyu otomatik yenile
  useEffect(() => {
    // Get current user's company_id for filtering
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      // Subscribe to sales_invoices table changes
      const channel = supabase
        .channel('sales_invoices_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'sales_invoices',
            filter: `company_id=eq.${profile.company_id}`
          },
          (payload) => {
            logger.debug('🔄 Sales invoice changed:', payload.eventType, payload.new || payload.old);
            // Invalidate queries to refetch data
            queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeSubscription();

    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [queryClient]);

  const createInvoiceMutation = useMutation({
    mutationFn: ({ invoice, items }: { invoice: Partial<SalesInvoice>, items: Partial<SalesInvoiceItem>[] }) => 
      createInvoice(invoice, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: updateInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: recordPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
    },
  });

  return {
    invoices,
    isLoading,
    error,
    filters,
    setFilters,
    refetch,
    fetchInvoiceById,
    fetchInvoiceItems,
    createInvoiceMutation,
    updateInvoiceMutation,
    recordPaymentMutation,
    deleteInvoiceMutation,
  };
};
