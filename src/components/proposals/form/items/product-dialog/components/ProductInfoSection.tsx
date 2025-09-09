
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import { 
  getStockStatusClass, 
  getStockStatusIcon, 
  getStockStatusText,
  getStockWarning 
} from "../utils/stockStatusUtils";

interface ProductInfoSectionProps {
  product: Product;
  stockStatus?: string;
  availableStock?: number;
  originalCurrency?: string;
  originalPrice?: number;
  formatCurrency?: (amount: number, currency?: string) => string;
}

const ProductInfoSection: React.FC<ProductInfoSectionProps> = ({
  product,
  stockStatus = 'in_stock',
  availableStock = 0,
  originalCurrency,
  originalPrice,
  formatCurrency
}) => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{product.name}</h3>
        <Badge variant="outline" className={getStockStatusClass(stockStatus)}>
          <span className="flex items-center space-x-1">
            {getStockStatusIcon(stockStatus)}
            <span>{getStockStatusText(stockStatus)}</span>
          </span>
        </Badge>
      </div>
      {product.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {product.description}
        </p>
      )}
      <div className="flex items-center mt-2 text-sm">
        <span className="mr-4">SKU: {product.sku || "-"}</span>
        <span>Stok: {availableStock} {product.unit}</span>
      </div>
      {getStockWarning(stockStatus)}
      
      {/* Display original currency and price if provided */}
      {originalCurrency && originalPrice && formatCurrency && (
        <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
          <span>Orijinal Fiyat: {formatCurrency(originalPrice, originalCurrency)}</span>
        </div>
      )}
    </div>
  );
};

export default ProductInfoSection;
