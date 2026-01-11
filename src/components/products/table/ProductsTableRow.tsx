import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Edit, Trash, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface ProductsTableRowProps {
  product: Product;
  formatPrice: (price: number, currency: string) => string;
  onSelect?: (product: Product) => void;
  onSelectToggle?: (product: Product) => void;
  onEdit: (productId: string, e: React.MouseEvent) => void;
  onDelete: (product: Product, e: React.MouseEvent) => void;
  isSelected?: boolean;
}

const ProductsTableRow = ({ 
  product, 
  formatPrice, 
  onSelect, 
  onSelectToggle,
  onEdit,
  onDelete,
  isSelected = false
}: ProductsTableRowProps) => {
  const navigate = useNavigate();

  return (
    <TableRow 
      className={`cursor-pointer hover:bg-blue-50 h-8 ${isSelected ? 'bg-blue-50' : ''}`}
      onClick={() => navigate(`/product-details/${product.id}`)}
    >
      {/* Checkbox */}
      {onSelectToggle && (
        <TableCell className="py-2 px-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelectToggle(product)}
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>
      )}

      {/* Ürün Adı */}
      <TableCell className="py-2 px-3">
        <div className="text-xs font-medium text-gray-900">
          {product.name}
        </div>
      </TableCell>

      {/* SKU */}
      <TableCell className="py-2 px-3 text-xs text-gray-600">
        {product.sku || "-"}
      </TableCell>

      {/* Kategori */}
      <TableCell className="py-2 px-3 text-xs text-gray-600">
        {product.product_categories?.name || "Kategorisiz"}
      </TableCell>

      {/* Fiyat */}
      <TableCell className="py-2 px-3 text-right text-xs font-medium text-gray-900">
        {formatPrice(product.price, product.currency)}
      </TableCell>

      {/* Stok */}
      <TableCell className="py-2 px-3 text-right">
        <div className="flex flex-col items-end gap-1">
          {/* Toplam Stok */}
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs font-medium text-gray-900">
              {product.stock_quantity}
            </span>
            <span className="text-xs text-gray-500">{product.unit}</span>
          </div>
          
          {/* Rezerve Stok (varsa göster) */}
          {product.reserved_quantity && product.reserved_quantity > 0 && (
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-orange-600">
                -{product.reserved_quantity}
              </span>
              <span className="text-xs text-gray-400">rezerve</span>
            </div>
          )}
          
          {/* Kullanılabilir Stok */}
          {product.reserved_quantity && product.reserved_quantity > 0 && (
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs font-semibold text-green-600">
                {(product.stock_quantity || 0) - (product.reserved_quantity || 0)}
              </span>
              <span className="text-xs text-gray-400">müsait</span>
            </div>
          )}
          
          {/* Stok Durumu Badge */}
          {(() => {
            const availableStock = (product.stock_quantity || 0) - (product.reserved_quantity || 0);
            
            if (availableStock <= 0) {
              return (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-800 border-red-200">
                  Stokta Yok
                </Badge>
              );
            }
            
            if (availableStock > 0 && availableStock <= product.min_stock_level) {
              return (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-800 border-yellow-200">
                  Az Stok
                </Badge>
              );
            }
            
            return null;
          })()}
        </div>
      </TableCell>

      {/* Durum */}
      <TableCell className="py-2 px-3 text-center">
        <div className="flex items-center justify-center gap-1">
          {product.is_active ? (
            <CheckCircle2 className="h-3 w-3 text-green-600" />
          ) : (
            <XCircle className="h-3 w-3 text-gray-600" />
          )}
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${
            product.is_active 
              ? 'bg-green-100 text-green-800 border-green-200' 
              : 'bg-gray-100 text-gray-800 border-gray-200'
          }`}>
            {product.is_active ? "Aktif" : "Pasif"}
          </span>
        </div>
      </TableCell>

      {/* İşlemler */}
      <TableCell className="py-2 px-3">
        <div className="flex justify-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => onEdit(product.id, e)}
            className="h-8 w-8"
            title="Düzenle"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={(e) => onDelete(product, e)}
            title="Sil"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default React.memo(ProductsTableRow, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.updated_at === nextProps.product.updated_at &&
    prevProps.isSelected === nextProps.isSelected
  );
});


