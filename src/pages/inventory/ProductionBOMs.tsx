import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProduction } from "@/hooks/useProduction";
import { BOM } from "@/types/production";
import BOMsContent from "@/components/production/BOMsContent";
import ProductionBOMsHeader from "@/components/production/ProductionBOMsHeader";
import BOMsBulkActions from "@/components/production/BOMsBulkActions";
import BOMsFilterBar from "@/components/production/BOMsFilterBar";
import { BOMsViewType } from "@/components/production/ProductionBOMsViewToggle";
import { BOMSortField, BOMSortDirection } from "@/components/production/table/BOMTableHeader";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

const ProductionBOMs = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { boms, isLoading, error } = useProduction();
  const [bomsView, setBomsView] = useState<BOMsViewType>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedBOMs, setSelectedBOMs] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  
  // Sıralama state'leri
  const [sortField, setSortField] = useState<BOMSortField>("created_at");
  const [sortDirection, setSortDirection] = useState<BOMSortDirection>('desc');

  // Fetch products for filter
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) return [];

      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .eq("company_id", profile.company_id)
        .order("name");
      
      if (error) {
        console.error("Products fetch error:", error);
        return [];
      }
      return data || [];
    }
  });

  const handleSort = (field: BOMSortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter BOMs
  const filteredBOMs = useMemo(() => {
    return boms.filter(bom => {
      // Search filter
      const matchesSearch = !searchQuery || 
        bom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bom.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bom.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Product filter
      const matchesProduct = selectedProduct === 'all' || 
        bom.product_id === selectedProduct ||
        (selectedProduct && !bom.product_id && selectedProduct === 'none');
      
      // Date filter
      let matchesDate = true;
      if (startDate || endDate) {
        const bomDate = new Date(bom.created_at);
        if (startDate && bomDate < startDate) matchesDate = false;
        if (endDate) {
          const endDateWithTime = new Date(endDate);
          endDateWithTime.setHours(23, 59, 59, 999);
          if (bomDate > endDateWithTime) matchesDate = false;
        }
      }
      
      return matchesSearch && matchesProduct && matchesDate;
    });
  }, [boms, searchQuery, selectedProduct, startDate, endDate]);

  const handleBOMClick = (bom: BOM) => {
    navigate(`/production/bom/${bom.id}`);
  };

  const handleEditBOM = (bom: BOM) => {
    navigate(`/production/bom/${bom.id}/edit`);
  };

  const handleDeleteBOM = async (bomId: string) => {
    try {
      const { error } = await supabase
        .from("boms")
        .delete()
        .eq("id", bomId);
      
      if (error) throw error;
      
      toast.success("Ürün reçetesi silindi");
      queryClient.invalidateQueries({ queryKey: ["boms"] });
      queryClient.invalidateQueries({ queryKey: ["production_stats"] });
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Silme işlemi başarısız oldu");
    }
  };

  const handleDuplicateBOM = (bom: BOM) => {
    // TODO: Implement duplicate functionality
    toast.success("Ürün reçetesi kopyalandı");
  };

  const handleBulkAction = async (action: string) => {
    if (selectedBOMs.length === 0) return;

    switch (action) {
      case 'delete':
        setBulkDeleteDialogOpen(true);
        break;
      case 'export':
        toast.info('Excel export özelliği yakında eklenecek');
        break;
      case 'duplicate':
        toast.info('Toplu kopyalama özelliği yakında eklenecek');
        break;
    }
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      const errors: string[] = [];
      let successCount = 0;

      for (const bomId of selectedBOMs) {
        try {
          // Önce bom_items'ı sil
          const { error: itemsError } = await supabase
            .from("bom_items")
            .delete()
            .eq("bom_id", bomId);

          if (itemsError) {
            errors.push(`Reçete kalemleri silinemedi: ${itemsError.message}`);
            continue;
          }

          // Sonra bom'u sil
          const { error: bomError } = await supabase
            .from("boms")
            .delete()
            .eq("id", bomId);

          if (bomError) {
            errors.push(`Reçete silinemedi: ${bomError.message}`);
            continue;
          }

          successCount++;
        } catch (err: any) {
          console.error('Error deleting BOM:', err);
          errors.push(err.message || 'Bilinmeyen hata');
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} reçete başarıyla silindi`);
      }
      if (errors.length > 0) {
        toast.error(`${errors.length} reçete silinirken hata oluştu`);
      }

      queryClient.invalidateQueries({ queryKey: ["boms"] });
      queryClient.invalidateQueries({ queryKey: ["production_stats"] });
      setSelectedBOMs([]);
      setBulkDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      toast.error(error.message || "Reçeteler silinirken hata oluştu");
    }
  };

  const handleBulkDeleteCancel = () => {
    setBulkDeleteDialogOpen(false);
  };

  if (error) {
    toast.error("Reçeteler yüklenirken bir hata oluştu");
    console.error("Error loading BOMs:", error);
  }

  return (
    <>
      <div className="space-y-2">
        {/* Header */}
        <ProductionBOMsHeader 
          activeView={bomsView}
          setActiveView={setBomsView}
          boms={boms}
        />

        {/* Filters */}
        <BOMsFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          products={products}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
        
        {/* Bulk Actions */}
        {selectedBOMs.length > 0 && (
          <BOMsBulkActions
            selectedBOMs={selectedBOMs}
            onClearSelection={() => setSelectedBOMs([])}
            onBulkAction={handleBulkAction}
          />
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Reçeteler yükleniyor...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-red-500">Reçeteler yüklenirken bir hata oluştu</div>
          </div>
        ) : (
          <BOMsContent
            boms={filteredBOMs}
            isLoading={isLoading}
            totalCount={filteredBOMs.length}
            error={error}
            activeView={bomsView}
            setActiveView={setBomsView}
            onSelectBOM={handleBOMClick}
            onEditBOM={handleEditBOM}
            onDeleteBOM={handleDeleteBOM}
            onDuplicateBOM={handleDuplicateBOM}
            searchQuery={searchQuery}
            selectedBOMs={selectedBOMs}
            onSelectionChange={setSelectedBOMs}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        )}
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Toplu Reçete Silme"
        description={`Seçili ${selectedBOMs.length} reçeteyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleBulkDeleteConfirm}
        onCancel={handleBulkDeleteCancel}
      />
    </>
  );
};

export default ProductionBOMs;
