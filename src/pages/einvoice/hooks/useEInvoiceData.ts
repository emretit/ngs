import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { loadInvoiceDetails as loadInvoiceDetailsUtil } from '../utils/invoiceDetailsLoader';

export const useEInvoiceData = (invoiceId: string | undefined) => {
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

  // React Query ile tedarikçileri yükle - company_id filtresi ile
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers-for-einvoice', userCompanyId],
    queryFn: async () => {
      if (!userCompanyId) return [];
      
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id, name, tax_number, email, company_id')
        .eq('status', 'aktif')
        .eq('company_id', userCompanyId) // Sadece kullanıcının şirketinin tedarikçileri
        .order('name')
        .limit(500);
      if (suppliersError) throw suppliersError;
      return suppliersData || [];
    },
    enabled: !!userCompanyId, // company_id yoksa sorguyu çalıştırma
    staleTime: 10 * 60 * 1000, // 10 dakika cache
    gcTime: 20 * 60 * 1000, // 20 dakika cache'de tut
    refetchOnWindowFocus: false,
  });

  // Load invoice details - wrapper function
  const loadInvoiceDetails = async () => {
    if (!invoiceId) {
      throw new Error('Invoice ID is required');
    }
    return loadInvoiceDetailsUtil(invoiceId);
  };

  return {
    products,
    isLoadingProducts,
    userCompanyId,
    suppliers,
    isLoadingSuppliers,
    loadInvoiceDetails
  };
};

