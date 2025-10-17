import { useState, memo, useCallback } from "react";
import SuppliersHeader from "@/components/suppliers/SuppliersHeader";
import SuppliersFilterBar from "@/components/suppliers/SuppliersFilterBar";
import SuppliersContent from "@/components/suppliers/SuppliersContent";
import SuppliersBulkActions from "@/components/suppliers/SuppliersBulkActions";
import { Supplier } from "@/types/supplier";
import { toast } from "sonner";
import { useSuppliersInfiniteScroll } from "@/hooks/useSuppliersInfiniteScroll";

interface SuppliersProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const Suppliers = ({ isCollapsed, setIsCollapsed }: SuppliersProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([]);

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
  return (
    <div className="space-y-2">
        {/* Header */}
        <SuppliersHeader 
          suppliers={suppliers || []}
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
        {selectedSuppliers.length > 0 && (
          <SuppliersBulkActions 
            selectedSuppliers={selectedSuppliers}
            onClearSelection={handleClearSelection}
          />
        )}
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
      </div>
  );
};

export default memo(Suppliers);
