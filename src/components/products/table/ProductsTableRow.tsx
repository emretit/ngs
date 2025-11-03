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
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-gray-600">{product.stock_quantity}</span>
          {product.stock_quantity <= 0 ? (
            <Badge variant="destructive" className="text-xs">Stokta Yok</Badge>
          ) : product.stock_quantity <= product.min_stock_level ? (
            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-800 border-yellow-200">Az Stok</Badge>
          ) : null}
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
        <div className="flex justify-end space-x-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => onEdit(product.id, e)}
            className="h-4 w-4 hover:bg-blue-100"
          >
            <Edit className="h-2.5 w-2.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={(e) => onDelete(product, e)}
          >
            <Trash className="h-2.5 w-2.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ProductsTableRow;

