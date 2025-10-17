
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "@/utils/toastUtils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
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

interface ProductTableProps {
  products: Product[];
  isLoading?: boolean;
}

const ProductTable = ({ products, isLoading }: ProductTableProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Confirmation dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/product-form/${id}`);
  };

  const handleDeleteClick = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
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
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (<>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ürün Adı</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead className="text-right">Fiyat</TableHead>
          <TableHead className="text-right">Stok</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead className="text-right">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow 
            key={product.id} 
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => navigate(`/product-details/${product.id}`)}
          >
            <TableCell>{product.name}</TableCell>
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
        ))}
      </TableBody>
    </Table>

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
  </> );
};

export default ProductTable;
