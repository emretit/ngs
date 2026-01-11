import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { loadOutgoingInvoiceDetails as loadInvoiceDetailsUtil } from '../utils/outgoingInvoiceDetailsLoader';

export const useOutgoingEInvoiceData = (invoiceId: string | undefined) => {
  // React Query ile ürünleri yükle
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-for-einvoice'],
    queryFn: async () => {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, price, unit, tax_rate, category_type')
        .eq('is_active', true)
        .order('name')
        .limit(1000);
      if (productsError) throw productsError;
      return productsData || [];
    },
    staleTime: 10 * 60 * 1000, // 10 dakika cache
    gcTime: 20 * 60 * 1000, // 20 dakika cache'de tut
    refetchOnWindowFocus: false,
  });

  // Kullanıcının company_id'sini al
  const { data: userCompanyId } = useQuery({
    queryKey: ['user-company-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı oturumu bulunamadı');
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return profile?.company_id;
    },
    staleTime: Infinity, // Company ID değişmez
  });

  // React Query ile müşterileri yükle - company_id filtresi ile
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers-for-einvoice', userCompanyId],
    queryFn: async () => {
      if (!userCompanyId) return [];
      
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name, company, tax_number, email, company_id')
        .eq('status', 'aktif')
        .order('name')
        .limit(500);
      if (customersError) throw customersError;
      return customersData || [];
    },
    enabled: !!userCompanyId, // company_id yoksa sorguyu çalıştırma
    staleTime: 10 * 60 * 1000, // 10 dakika cache
    gcTime: 20 * 60 * 1000, // 20 dakika cache'de tut
    refetchOnWindowFocus: false,
  });

  // Load invoice details - wrapper function
  // useCallback ile sarmalayarak her render'da yeni referans oluşturulmasını önle
  const loadInvoiceDetails = useCallback(async () => {
    if (!invoiceId) {
      throw new Error('Invoice ID is required');
    }
    return loadInvoiceDetailsUtil(invoiceId);
  }, [invoiceId]);

  return {
    products,
    isLoadingProducts,
    userCompanyId,
    customers,
    isLoadingCustomers,
    loadInvoiceDetails
  };
};

