import { useState, memo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import SuppliersHeader from "@/components/suppliers/SuppliersHeader";
import SuppliersFilterBar from "@/components/suppliers/SuppliersFilterBar";
import SuppliersContent from "@/components/suppliers/SuppliersContent";
import SuppliersBulkActions from "@/components/suppliers/SuppliersBulkActions";
import { Supplier } from "@/types/supplier";
import { toast } from "sonner";
import { useSuppliersInfiniteScroll } from "@/hooks/useSuppliersInfiniteScroll";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface SuppliersProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const Suppliers = ({ isCollapsed, setIsCollapsed }: SuppliersProps) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: suppliers,
    isLoading,
    isLoadingMore,
    hasNextPage,
    loadMore,
    totalCount,
    error
  } = useSuppliersInfiniteScroll({
    search: searchQuery,
    status: selectedStatus,
    type: selectedType
  });

  // Tüm tedarikçiler için istatistikleri çek (filtre olmadan)
  const { data: supplierStatistics } = useQuery({
    queryKey: ["supplier_statistics"],
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

      // Tüm tedarikçileri çek (filtre olmadan)
      const { data: allSuppliers, error: suppliersError } = await supabase
        .from("suppliers")
        .select("balance")
        .eq("company_id", companyId);

      if (suppliersError) throw suppliersError;
      if (!allSuppliers || allSuppliers.length === 0) {
        return {
          totalCount: 0,
          totalBalance: 0,
          overdueBalance: 0
        };
      }

      // Toplam bakiye ve vadesi geçen bakiyeleri hesapla
      const totalBalance = allSuppliers.reduce((sum, supplier) => sum + (supplier.balance || 0), 0);
      const overdueBalance = allSuppliers.reduce((sum, supplier) => {
        return (supplier.balance || 0) < 0 ? sum + Math.abs(supplier.balance || 0) : sum;
      }, 0);

      return {
        totalCount: allSuppliers.length,
        totalBalance,
        overdueBalance
      };
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
  });

  if (error) {
    toast.error("Tedarikçiler yüklenirken bir hata oluştu");
    console.error("Error loading suppliers:", error);
  }
  const handleSupplierSelect = useCallback((supplier: Supplier) => {
    setSelectedSuppliers(prev => {
      const isSelected = prev.some(s => s.id === supplier.id);
      return isSelected 
        ? prev.filter(s => s.id !== supplier.id) 
        : [...prev, supplier];
    });
  }, []);
  
  const handleClearSelection = useCallback(() => {
    setSelectedSuppliers([]);
  }, []);

  const handleBulkAction = useCallback(async (action: string) => {
    if (action === 'delete') {
      if (selectedSuppliers.length === 0) {
        toast.error('Lütfen silmek için en az bir tedarikçi seçin', { duration: 1000 });
        return;
      }
      setIsDeleteDialogOpen(true);
    }
  }, [selectedSuppliers]);

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (selectedSuppliers.length === 0) return;

    setIsDeleting(true);
    try {
      const supplierIds = selectedSuppliers.map(s => s.id);
      
      // Önce hangi tedarikçilerin referansları olduğunu kontrol et
      const { data: purchaseInvoices } = await supabase
        .from('purchase_invoices')
        .select('supplier_id')
        .in('supplier_id', supplierIds)
        .limit(1);
      
      const { data: purchaseOrders } = await supabase
        .from('purchase_orders')
        .select('supplier_id')
        .in('supplier_id', supplierIds)
        .limit(1);
      
      const { data: products } = await supabase
        .from('products')
        .select('supplier_id')
        .in('supplier_id', supplierIds)
        .limit(1);

      if (purchaseInvoices && purchaseInvoices.length > 0) {
        toast.error('Bu tedarikçiler alış faturalarında kullanıldığı için silinemez', { duration: 1000 });
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        return;
      }

      if (purchaseOrders && purchaseOrders.length > 0) {
        toast.error('Bu tedarikçiler satın alma siparişlerinde kullanıldığı için silinemez', { duration: 1000 });
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        return;
      }

      if (products && products.length > 0) {
        toast.error('Bu tedarikçiler ürünlerde kullanıldığı için silinemez', { duration: 1000 });
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        return;
      }

      const { error } = await supabase
        .from('suppliers')
        .delete()
        .in('id', supplierIds);

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
          toast.error('Bu tedarikçiler başka kayıtlarda kullanıldığı için silinemez (fatura, sipariş, ürün vb.)', { duration: 1000 });
        } else {
          throw error;
        }
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        return;
      }

      toast.success(`${selectedSuppliers.length} tedarikçi başarıyla silindi`, { duration: 1000 });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier_statistics'] });
      setSelectedSuppliers([]);
    } catch (error: any) {
      console.error('Error deleting suppliers:', error);
      toast.error(`Tedarikçiler silinirken bir hata oluştu: ${error?.message || 'Bilinmeyen hata'}`, { duration: 1000 });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }, [selectedSuppliers, queryClient]);

  const handleBulkDeleteCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
  }, []);

  return (
    <div className="space-y-2">
        {/* Header */}
        <SuppliersHeader 
          suppliers={suppliers || []}
          totalCount={totalCount}
          statistics={supplierStatistics}
        />
        {/* Filters */}
        <SuppliersFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
        />
        <SuppliersBulkActions 
          selectedSuppliers={selectedSuppliers}
          onClearSelection={handleClearSelection}
          onBulkAction={handleBulkAction}
        />
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Tedarikçiler yükleniyor...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-red-500">Tedarikçiler yüklenirken bir hata oluştu</div>
          </div>
        ) : (
          <SuppliersContent
            suppliers={suppliers || []}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasNextPage={hasNextPage}
            loadMore={loadMore}
            totalCount={totalCount}
            error={error}
            onSupplierSelect={() => {}}
            onSupplierSelectToggle={handleSupplierSelect}
            selectedSuppliers={selectedSuppliers}
            setSelectedSuppliers={setSelectedSuppliers}
            searchQuery={searchQuery}
            statusFilter={selectedStatus}
            typeFilter={selectedType}
          />
        )}

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Tedarikçileri Sil"
        description={`Seçili ${selectedSuppliers.length} tedarikçiyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
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

export default memo(Suppliers);
