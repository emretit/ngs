import { memo, useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ChevronUp, ChevronDown, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "@/utils/toastUtils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import InfiniteScroll from "@/components/ui/infinite-scroll";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  currency: string;
  stock_quantity: number;
  min_stock_level: number;
  status: string;
  is_active: boolean;
  product_categories: {
    id: string;
    name: string;
  } | null;
}

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
  onProductClick,
  onProductSelect,
  selectedProducts = []
}: ProductListTableProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Confirmation dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getSortIcon = (field: string) => {
    if (field !== sortField) return null;
    
    return sortDirection === "asc" 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

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
      
      showSuccess("Ürün başarıyla silindi");
    } catch (error) {
      console.error('Error deleting product:', error);
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

  return (
    <div className="bg-gradient-to-br from-card via-muted/20 to-background rounded-2xl shadow-2xl border border-border/10 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-50"></div>
      <div className="relative z-10 p-6">
        <div className="overflow-x-auto">
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                <TableHead 
                  className={cn(
                    "h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => onSortFieldChange("name")}
                >
                  <div className="flex items-center">
                    <span>📦 Ürün Adı</span>
                    {getSortIcon("name")}
                  </div>
                </TableHead>
                <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  🏷️ SKU
                </TableHead>
                <TableHead 
                  className={cn(
                    "h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => onSortFieldChange("category")}
                >
                  <div className="flex items-center">
                    <span>📂 Kategori</span>
                    {getSortIcon("category")}
                  </div>
                </TableHead>
                <TableHead 
                  className={cn(
                    "h-12 px-4 text-right align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => onSortFieldChange("price")}
                >
                  <div className="flex items-center justify-end">
                    <span>💰 Fiyat</span>
                    {getSortIcon("price")}
                  </div>
                </TableHead>
                <TableHead 
                  className={cn(
                    "h-12 px-4 text-right align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => onSortFieldChange("stock_quantity")}
                >
                  <div className="flex items-center justify-end">
                    <span>📊 Stok</span>
                    {getSortIcon("stock_quantity")}
                  </div>
                </TableHead>
                <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  🟢 Durum
                </TableHead>
                <TableHead className="h-12 px-4 text-right align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  ⚙️ İşlemler
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : products?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Ürün bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                products?.map((product) => (
                  <TableRow 
                    key={product.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/product-details/${product.id}`)}
                  >
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku || "-"}</TableCell>
                    <TableCell>
                      {product.product_categories?.name || "Kategorisiz"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(product.price, product.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>{product.stock_quantity}</span>
                        {product.stock_quantity <= 0 ? (
                          <Badge variant="destructive">Stokta Yok</Badge>
                        ) : product.stock_quantity <= product.min_stock_level ? (
                          <Badge variant="warning">Az Stok</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleEdit(product.id, e)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => handleDeleteClick(product, e)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Infinite Scroll Trigger */}
        <InfiniteScroll
          hasNextPage={hasNextPage}
          isLoadingMore={isLoadingMore}
          onLoadMore={loadMore}
          className="mt-4"
        >
          <div />
        </InfiniteScroll>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Ürünü Sil"
        description={`"${productToDelete?.name || 'Bu ürün'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default memo(ProductListTable);
