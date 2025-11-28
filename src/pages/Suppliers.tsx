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
  
  // Sıralama state'leri - veritabanı seviyesinde sıralama için
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = useCallback((field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const {
    data: suppliers,
    isLoading,
    isLoadingMore,
    hasNextPage,
    loadMore,
    totalCount,
    error,
    refresh: refreshSuppliers
  } = useSuppliersInfiniteScroll({
    search: searchQuery,
    status: selectedStatus,
    type: selectedType,
    sortField,
    sortDirection
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

      // Toplam tedarikçi sayısını count ile al (limit sorunu olmasın diye)
      const { count: totalCount, error: countError } = await supabase
        .from("suppliers")
        .select("*", { count: 'exact', head: true })
        .eq("company_id", companyId);

      if (countError) throw countError;

      // Bakiyeleri hesaplamak için tüm tedarikçileri çek (limit uygulanmadan)
      // Supabase'in varsayılan limiti 1000, bu yüzden pagination ile tüm verileri çekmeliyiz
      let allSuppliers: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: suppliersPage, error: suppliersError } = await supabase
          .from("suppliers")
          .select("balance")
          .eq("company_id", companyId)
          .range(from, from + pageSize - 1);

        if (suppliersError) throw suppliersError;
        
        if (suppliersPage && suppliersPage.length > 0) {
          allSuppliers = [...allSuppliers, ...suppliersPage];
          from += pageSize;
          hasMore = suppliersPage.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      // Toplam bakiye ve vadesi geçen bakiyeleri hesapla
      const totalBalance = allSuppliers.reduce((sum, supplier) => sum + (supplier.balance || 0), 0);
      const overdueBalance = allSuppliers.reduce((sum, supplier) => {
        return (supplier.balance || 0) < 0 ? sum + Math.abs(supplier.balance || 0) : sum;
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
        toast.error('Lütfen silmek için en az bir tedarikçi seçin', { duration: 2000 });
        return;
      }
      setIsDeleteDialogOpen(true);
    }
  }, [selectedSuppliers]);

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (selectedSuppliers.length === 0) {
      console.log('No suppliers selected');
      return;
    }

    console.log('Starting bulk delete for suppliers:', selectedSuppliers.map(s => s.id));
    setIsDeleting(true);
    try {
      const supplierIds = selectedSuppliers.map(s => s.id);
      console.log('Supplier IDs to delete:', supplierIds);
      
      // Önce hangi tedarikçilerin referansları olduğunu kontrol et
      const { data: purchaseInvoices, error: invoicesError } = await supabase
        .from('purchase_invoices')
        .select('supplier_id')
        .in('supplier_id', supplierIds)
        .limit(1);
      
      if (invoicesError) {
        console.error('Error checking purchase_invoices:', invoicesError);
      }
      
      const { data: purchaseOrders, error: ordersError } = await supabase
        .from('purchase_orders')
        .select('supplier_id')
        .in('supplier_id', supplierIds)
        .limit(1);
      
      if (ordersError) {
        console.error('Error checking purchase_orders:', ordersError);
      }
      
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('supplier_id')
        .in('supplier_id', supplierIds)
        .limit(1);

      if (productsError) {
        console.error('Error checking products:', productsError);
      }

      if (purchaseInvoices && purchaseInvoices.length > 0) {
        console.log('Suppliers have purchase invoices, cannot delete');
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        toast.error('Bu tedarikçiler alış faturalarında kullanıldığı için silinemez', { duration: 2000 });
        return;
      }

      if (purchaseOrders && purchaseOrders.length > 0) {
        console.log('Suppliers have purchase orders, cannot delete');
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        toast.error('Bu tedarikçiler satın alma siparişlerinde kullanıldığı için silinemez', { duration: 2000 });
        return;
      }

      if (products && products.length > 0) {
        console.log('Suppliers have products, cannot delete');
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        toast.error('Bu tedarikçiler ürünlerde kullanıldığı için silinemez', { duration: 2000 });
        return;
      }

      console.log('Attempting to delete suppliers from Supabase...');
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .in('id', supplierIds);

      console.log('Delete response - error:', error);

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
          toast.error('Bu tedarikçiler başka kayıtlarda kullanıldığı için silinemez (fatura, sipariş, ürün vb.)', { duration: 2000 });
        } else {
          toast.error(`Silme hatası: ${error.message || 'Bilinmeyen hata'}`, { duration: 2000 });
        }
        if (!isConflictError) {
          throw error;
        }
        return;
      }

      console.log('Suppliers deleted successfully');
      toast.success(`${selectedSuppliers.length} tedarikçi başarıyla silindi`, { duration: 2000 });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier_statistics'] });
      setSelectedSuppliers([]);
      // Tabloyu yenile
      refreshSuppliers();
    } catch (error: any) {
      console.error('Error deleting suppliers:', error);
      toast.error(`Tedarikçiler silinirken bir hata oluştu: ${error?.message || 'Bilinmeyen hata'}`, { duration: 2000 });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }, [selectedSuppliers, queryClient, refreshSuppliers]);

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
          onImportSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            queryClient.invalidateQueries({ queryKey: ['supplier_statistics'] });
          }}
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
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
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
