import React, { useState, useMemo } from "react";
import { logger } from '@/utils/logger';
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { boms, isLoading } = useProduction();
  const [bomsView, setBomsView] = useState<BOMsViewType>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedBOMs, setSelectedBOMs] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bomToDelete, setBomToDelete] = useState<BOM | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
        
        .order("name");
      
      if (error) {
        logger.error("Products fetch error:", error);
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

  const handleDeleteBOM = (bomId: string) => {
    const bom = boms.find(b => b.id === bomId);
    if (bom) {
      setBomToDelete(bom);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!bomToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("boms")
        .delete()
        .eq("id", bomToDelete.id);
      
      if (error) throw error;
      
      toast.success("Ürün reçetesi silindi");
      queryClient.invalidateQueries({ queryKey: ["boms"] });
      queryClient.invalidateQueries({ queryKey: ["production_stats"] });
      setIsDeleteDialogOpen(false);
      setBomToDelete(null);
    } catch (error) {
      logger.error("Delete error:", error);
      toast.error("Silme işlemi başarısız oldu");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setBomToDelete(null);
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
          logger.error('Error deleting BOM:', err);
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
      logger.error('Bulk delete error:', error);
      toast.error(error.message || "Reçeteler silinirken hata oluştu");
    }
  };

  const handleBulkDeleteCancel = () => {
    setBulkDeleteDialogOpen(false);
  };

  // Note: error handling removed - useProduction doesn't expose error state

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
        ) : (
          <BOMsContent
            boms={filteredBOMs}
            isLoading={isLoading}
            totalCount={filteredBOMs.length}
            error={null}
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

        {/* Tekli Silme Onay Dialog */}
        <ConfirmationDialogComponent
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Ürün Reçetesini Sil"
          description={
            bomToDelete
              ? `"${bomToDelete.name || bomToDelete.product_name || 'Bu reçete'}" ürün reçetesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
              : "Bu ürün reçetesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          }
          confirmText={t("common.delete")}
          cancelText={t("common.cancel")}
          variant="destructive"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isLoading={isDeleting}
        />
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
