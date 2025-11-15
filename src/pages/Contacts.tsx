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
    error
  } = useCustomersInfiniteScroll({
    search: searchQuery,
    status: selectedStatus,
    type: selectedType
  });

  // Tüm müşteriler için istatistikleri çek (filtre olmadan)
  const { data: customerStatistics } = useQuery({
    queryKey: ["customer_statistics"],
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

      // Tüm müşterileri çek (filtre olmadan)
      const { data: allCustomers, error: customersError } = await supabase
        .from("customers")
        .select("balance")
        .eq("company_id", companyId);

      if (customersError) throw customersError;
      if (!allCustomers || allCustomers.length === 0) {
        return {
          totalCount: 0,
          totalBalance: 0,
          overdueBalance: 0
        };
      }

      // Toplam bakiye ve vadesi geçen bakiyeleri hesapla
      const totalBalance = allCustomers.reduce((sum, customer) => sum + (customer.balance || 0), 0);
      const overdueBalance = allCustomers.reduce((sum, customer) => {
        return (customer.balance || 0) < 0 ? sum + Math.abs(customer.balance || 0) : sum;
      }, 0);

      return {
        totalCount: allCustomers.length,
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
        toast.error('Lütfen silmek için en az bir müşteri seçin', { duration: 1000 });
        return;
      }
      setIsDeleteDialogOpen(true);
    }
  }, [selectedCustomers]);

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (selectedCustomers.length === 0) return;

    setIsDeleting(true);
    try {
      const customerIds = selectedCustomers.map(c => c.id);
      
      // Önce hangi müşterilerin referansları olduğunu kontrol et
      const { data: orders } = await supabase
        .from('orders')
        .select('customer_id')
        .in('customer_id', customerIds)
        .limit(1);
      
      const { data: salesInvoices } = await supabase
        .from('sales_invoices')
        .select('customer_id')
        .in('customer_id', customerIds)
        .limit(1);
      
      const { data: proposals } = await supabase
        .from('proposals')
        .select('customer_id')
        .in('customer_id', customerIds)
        .limit(1);

      if (orders && orders.length > 0) {
        toast.error('Bu müşteriler siparişlerde kullanıldığı için silinemez', { duration: 1000 });
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        return;
      }

      if (salesInvoices && salesInvoices.length > 0) {
        toast.error('Bu müşteriler satış faturalarında kullanıldığı için silinemez', { duration: 1000 });
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        return;
      }

      if (proposals && proposals.length > 0) {
        toast.error('Bu müşteriler tekliflerde kullanıldığı için silinemez', { duration: 1000 });
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        return;
      }

      const { error } = await supabase
        .from('customers')
        .delete()
        .in('id', customerIds);

      if (error) {
        const httpStatus = (error as any)?.status;
        const isConflictError = 
          httpStatus === 409 || 
          error.code === '23503' || 
          error.code === 'PGRST204' ||
          error.message?.includes('foreign key') ||
          error.message?.includes('violates foreign key constraint') ||
          error.message?.includes('still referenced');

        if (isConflictError) {
          toast.error('Bu müşteriler başka kayıtlarda kullanıldığı için silinemez (sipariş, fatura, teklif vb.)', { duration: 1000 });
        } else {
          throw error;
        }
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        return;
      }

      toast.success(`${selectedCustomers.length} müşteri başarıyla silindi`, { duration: 1000 });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer_statistics'] });
      setSelectedCustomers([]);
    } catch (error: any) {
      console.error('Error deleting customers:', error);
      toast.error(`Müşteriler silinirken bir hata oluştu: ${error?.message || 'Bilinmeyen hata'}`, { duration: 1000 });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }, [selectedCustomers, queryClient]);

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
        />
        {isLoading ? (
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
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasNextPage={hasNextPage}
            loadMore={loadMore}
            totalCount={totalCount}
            error={error}
            onCustomerSelect={() => {}}
            onCustomerSelectToggle={handleCustomerSelect}
            selectedCustomers={selectedCustomers}
            setSelectedCustomers={setSelectedCustomers}
            searchQuery={searchQuery}
            statusFilter={selectedStatus}
            typeFilter={selectedType}
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
