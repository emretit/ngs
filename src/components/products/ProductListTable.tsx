import { memo, useCallback, useState } from "react";
import { logger } from '@/utils/logger';
import { useTranslation } from "react-i18next";
import { Table, TableBody } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "@/utils/toastUtils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import ProductsTableHeader from "./table/ProductsTableHeader";
import ProductsTableRow from "./table/ProductsTableRow";
import ProductsTableSkeleton from "./table/ProductsTableSkeleton";
import InfiniteScroll from "@/components/ui/infinite-scroll";
import { TableRow, TableCell } from "@/components/ui/table";
import { Product } from "@/types/product";

interface ProductListTableProps {
  products: Product[] | undefined;
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  sortField: "name" | "price" | "stock_quantity" | "category";
  sortDirection: "asc" | "desc";
  onSortFieldChange: (field: "name" | "price" | "stock_quantity" | "category") => void;
  onProductClick?: (product: Product) => void;
  onProductSelect?: (product: Product) => void;
  onSelectAll?: (checked: boolean) => void;
  selectedProducts?: Product[];
}

const ProductListTable = ({
  products,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  totalCount = 0,
  sortField,
  sortDirection,
  onSortFieldChange,
  onProductSelect,
  onSelectAll,
  selectedProducts = []
}: ProductListTableProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Confirmation dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/product-form/${id}`);
  }, [navigate]);

  const handleDeleteClick = useCallback((product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;

      // Ürün listesini yenile
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      
      showSuccess("Ürün başarıyla silindi", { duration: 1000 });
    } catch (error) {
      logger.error('Error deleting product:', error);
      showError("Ürün silinirken bir hata oluştu");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  }, [productToDelete, queryClient]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setProductToDelete(null);
  }, []);

  const formatPrice = useCallback((price: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency
    }).format(price);
  }, []);

  const handleProductSelectToggle = useCallback((product: Product) => {
    const isSelected = selectedProducts.some(p => p.id === product.id);
    if (isSelected) {
      // Seçimi kaldır
      onProductSelect?.(product);
    } else {
      // Seç
      onProductSelect?.(product);
    }
  }, [selectedProducts, onProductSelect]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (onSelectAll) {
      // Tüm ürünleri seçmek için parent'tan gelen fonksiyonu kullan
      onSelectAll(checked);
    } else {
      // Fallback: Sadece görünen ürünleri seç
      if (checked) {
        products?.forEach(p => {
          if (!selectedProducts.some(sp => sp.id === p.id)) {
            onProductSelect?.(p);
          }
        });
      } else {
        products?.forEach(p => onProductSelect?.(p));
      }
    }
  }, [products, selectedProducts, onProductSelect, onSelectAll]);

  if (isLoading && (!products || products.length === 0)) {
    return <ProductsTableSkeleton />;
  }

  return (
    <div className="-mx-4">
      <div className="px-4">
        <Table>
        <ProductsTableHeader 
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSortFieldChange}
          hasSelection={true}
          onSelectAll={handleSelectAll}
          isAllSelected={totalCount > 0 && selectedProducts.length === totalCount}
          totalProducts={totalCount}
        />
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                Yükleniyor...
              </TableCell>
            </TableRow>
          ) : products?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                Ürün bulunamadı
              </TableCell>
            </TableRow>
          ) : (
            // Duplicate'leri filtrele
            Array.from(new Map(products?.map(p => [p.id, p]) || []).values()).map((product) => {
              const isSelected = selectedProducts.some(p => p.id === product.id);
              return (
                <ProductsTableRow
                  key={product.id}
                  product={product}
                  formatPrice={formatPrice}
                  onSelect={onProductSelect}
                  onSelectToggle={handleProductSelectToggle}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  isSelected={isSelected}
                />
              );
            })
          )}
        </TableBody>
        </Table>
      </div>

      {/* Infinite Scroll Trigger */}
      {hasNextPage && (
        <div className="px-4">
          <InfiniteScroll
            hasNextPage={hasNextPage}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMore}
            className="mt-4"
          >
            <div />
          </InfiniteScroll>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Ürünü Sil"
        description={`"${productToDelete?.name || 'Bu ürün'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default memo(ProductListTable);
