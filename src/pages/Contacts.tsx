import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CustomersHeader from "@/components/customers/CustomersHeader";
import CustomersFilterBar from "@/components/customers/CustomersFilterBar";
import CustomersContent from "@/components/customers/CustomersContent";
import CustomersBulkActions from "@/components/customers/CustomersBulkActions";
import { Customer } from "@/types/customer";
import { toast } from "sonner";
import { useCustomersInfiniteScroll } from "@/hooks/useCustomersInfiniteScroll";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

const Contacts = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: customers,
    isLoading,
    isLoadingMore,
    hasNextPage,
    loadMore,
    totalCount,
    error,
    refresh: refreshCustomers
  } = useCustomersInfiniteScroll({
    search: searchQuery,
    status: selectedStatus,
    type: selectedType
  });

  // Tüm müşteriler için istatistikleri çek (filtre olmadan)
  const { data: customerStatistics } = useQuery({
    queryKey: ["customer_statistics"],
    staleTime: 0, // Her zaman fresh data çek (cache'leme)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      const companyId = profile?.company_id;
      if (!companyId) {
        return {
          totalCount: 0,
          totalBalance: 0,
          overdueBalance: 0
        };
      }

      // Toplam müşteri sayısını count ile al (limit sorunu olmasın diye)
      const { count: totalCount, error: countError } = await supabase
        .from("customers")
        .select("*", { count: 'exact', head: true })
        .eq("company_id", companyId);

      if (countError) throw countError;

      // Bakiyeleri hesaplamak için tüm müşterileri çek (limit uygulanmadan)
      // Supabase'in varsayılan limiti 1000, bu yüzden pagination ile tüm verileri çekmeliyiz
      let allCustomers: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: customersPage, error: customersError } = await supabase
          .from("customers")
          .select("balance")
          .eq("company_id", companyId)
          .range(from, from + pageSize - 1);

        if (customersError) throw customersError;
        
        if (customersPage && customersPage.length > 0) {
          allCustomers = [...allCustomers, ...customersPage];
          from += pageSize;
          hasMore = customersPage.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      // Toplam bakiye ve vadesi geçen bakiyeleri hesapla
      const totalBalance = allCustomers.reduce((sum, customer) => sum + (customer.balance || 0), 0);
      const overdueBalance = allCustomers.reduce((sum, customer) => {
        return (customer.balance || 0) < 0 ? sum + Math.abs(customer.balance || 0) : sum;
      }, 0);

      return {
        totalCount: totalCount || 0,
        totalBalance,
        overdueBalance
      };
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
  });

  if (error) {
    toast.error("Müşteriler yüklenirken bir hata oluştu");
    console.error("Error loading customers:", error);
  }
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomers(prev => {
      const isSelected = prev.some(c => c.id === customer.id);
      return isSelected 
        ? prev.filter(c => c.id !== customer.id) 
        : [...prev, customer];
    });
  };
  const handleClearSelection = useCallback(() => {
    setSelectedCustomers([]);
  }, []);

  const handleBulkAction = useCallback(async (action: string) => {
    if (action === 'delete') {
      if (selectedCustomers.length === 0) {
        toast.error('Lütfen silmek için en az bir müşteri seçin', { duration: 2000 });
        return;
      }
      setIsDeleteDialogOpen(true);
    }
  }, [selectedCustomers]);

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (selectedCustomers.length === 0) {
      console.log('❌ No customers selected');
      return;
    }

    console.log('🗑️  Starting bulk delete...');
    console.log('📊 Total selected customers:', selectedCustomers.length);
    console.log('📋 Selected customer IDs:', selectedCustomers.map(c => c.id));
    console.log('🔍 First 3 customers:', selectedCustomers.slice(0, 3).map(c => ({ id: c.id, name: c.name, company: c.company })));
    console.log('🔍 Last 3 customers:', selectedCustomers.slice(-3).map(c => ({ id: c.id, name: c.name, company: c.company })));
    
    setIsDeleting(true);
    try {
      const customerIds = selectedCustomers.map(c => c.id);
      console.log('🆔 Customer IDs array length:', customerIds.length);
      console.log('🆔 First 5 IDs:', customerIds.slice(0, 5));
      console.log('🆔 Last 5 IDs:', customerIds.slice(-5));
      
      // Önce hangi müşterilerin referansları olduğunu kontrol et
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('customer_id')
        .in('customer_id', customerIds)
        .limit(1);
      
      if (ordersError) {
        console.error('Error checking orders:', ordersError);
      }
      
      const { data: salesInvoices, error: invoicesError } = await supabase
        .from('sales_invoices')
        .select('customer_id')
        .in('customer_id', customerIds)
        .limit(1);
      
      if (invoicesError) {
        console.error('Error checking sales_invoices:', invoicesError);
      }
      
      const { data: proposals, error: proposalsError } = await supabase
        .from('proposals')
        .select('customer_id')
        .in('customer_id', customerIds)
        .limit(1);

      if (proposalsError) {
        console.error('Error checking proposals:', proposalsError);
      }

      if (orders && orders.length > 0) {
        console.log('Customers have orders, cannot delete');
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        toast.error('Bu müşteriler siparişlerde kullanıldığı için silinemez', { duration: 2000 });
        return;
      }

      if (salesInvoices && salesInvoices.length > 0) {
        console.log('Customers have sales invoices, cannot delete');
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        toast.error('Bu müşteriler satış faturalarında kullanıldığı için silinemez', { duration: 2000 });
        return;
      }

      if (proposals && proposals.length > 0) {
        console.log('Customers have proposals, cannot delete');
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        toast.error('Bu müşteriler tekliflerde kullanıldığı için silinemez', { duration: 2000 });
        return;
      }

      console.log('🔄 Attempting to delete customers from Supabase...');
      console.log('🔄 Sending', customerIds.length, 'IDs to Supabase');
      
      const { error, count } = await supabase
        .from('customers')
        .delete()
        .in('id', customerIds);

      console.log('✅ Delete response - error:', error);
      console.log('✅ Delete response - count:', count);

      if (error) {
        console.error('Delete error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: (error as any)?.status
        });
        
        const httpStatus = (error as any)?.status;
        const isConflictError = 
          httpStatus === 409 || 
          error.code === '23503' || 
          error.code === 'PGRST204' ||
          error.message?.includes('foreign key') ||
          error.message?.includes('violates foreign key constraint') ||
          error.message?.includes('still referenced') ||
          error.message?.includes('permission denied') ||
          error.message?.includes('new row violates row-level security');

        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        if (isConflictError) {
          toast.error('Bu müşteriler başka kayıtlarda kullanıldığı için silinemez (sipariş, fatura, teklif vb.)', { duration: 2000 });
        } else {
          toast.error(`Silme hatası: ${error.message || 'Bilinmeyen hata'}`, { duration: 2000 });
        }
        if (!isConflictError) {
          throw error;
        }
        return;
      }

      console.log('Customers deleted successfully');
      const deletedCount = selectedCustomers.length;
      
      // Toast mesajını göster
      toast.success(`${deletedCount} müşteri başarıyla silindi`, { duration: 3000 });
      
      // ÖNCE seçimi temizle
      setSelectedCustomers([]);
      
      // Query'leri invalidate et ve refetch yap (fresh data çek)
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      await queryClient.refetchQueries({ queryKey: ['customer_statistics'] });
      
      // Tabloyu yenile
      refreshCustomers();
    } catch (error: any) {
      console.error('Error deleting customers:', error);
      toast.error(`Müşteriler silinirken bir hata oluştu: ${error?.message || 'Bilinmeyen hata'}`, { duration: 2000 });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }, [selectedCustomers, queryClient, refreshCustomers]);

  const handleBulkDeleteCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
  }, []);

  return (
    <div className="space-y-2">
        {/* Header */}
        <CustomersHeader 
          customers={customers || []}
          totalCount={totalCount}
          statistics={customerStatistics}
        />
        {/* Filters */}
        <CustomersFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
        />
        <CustomersBulkActions 
          selectedCustomers={selectedCustomers}
          onClearSelection={handleClearSelection}
          onBulkAction={handleBulkAction}
          onImportSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customer_statistics'] });
          }}
        />
        {isLoading && (!customers || customers.length === 0) ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Müşteriler yükleniyor...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-red-500">Müşteriler yüklenirken bir hata oluştu</div>
          </div>
        ) : (
          <CustomersContent
            customers={customers || []}
            isLoading={isLoading && (!customers || customers.length === 0)}
            isLoadingMore={isLoadingMore}
            hasNextPage={hasNextPage}
            loadMore={loadMore}
            totalCount={totalCount}
            error={error}
            onCustomerSelect={() => {}}
            onCustomerSelectToggle={handleCustomerSelect}
            selectedCustomers={selectedCustomers}
            setSelectedCustomers={setSelectedCustomers}
          />
        )}

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Müşterileri Sil"
        description={`Seçili ${selectedCustomers.length} müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleBulkDeleteConfirm}
        onCancel={handleBulkDeleteCancel}
        isLoading={isDeleting}
      />
    </div>
  );
};
export default Contacts;
