import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CheckCircle2, X } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { Product } from '@/types/product';
import { EInvoiceDetails, ProductMatchingItem } from '../types';

// Lazy load heavy component
const EInvoiceProductSelector = React.lazy(() => import('@/components/einvoice/EInvoiceProductSelector'));

interface EInvoiceTableRowProps {
  item: ProductMatchingItem;
  index: number;
  invoice: EInvoiceDetails;
  getMatchedProduct: (productId?: string) => Product | undefined;
  handleProductSelect: (itemIndex: number, product: Product) => void;
  handleCreateNewProduct: (itemIndex: number) => void;
  handleRemoveMatch: (itemIndex: number) => void;
  formatUnit: (unit: string) => string;
}

export const EInvoiceTableRow = React.memo(({ 
  item, 
  index, 
  invoice, 
  getMatchedProduct, 
  handleProductSelect, 
  handleCreateNewProduct, 
  handleRemoveMatch,
  formatUnit
}: EInvoiceTableRowProps) => {
  const matchedProduct = getMatchedProduct(item.matched_product_id);
  
  return (
    <TableRow className="hover:bg-gray-50/50 transition-colors border-gray-100">
      <TableCell className="font-medium text-[10px] px-2 py-2">
        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-semibold text-gray-600">
          {item.invoice_item.line_number}
        </div>
      </TableCell>
      <TableCell className="px-3 py-2">
        <div className="min-w-80 max-w-none">
          <p className="font-medium text-gray-900 text-xs mb-1 break-words">
            {item.invoice_item.product_name}
          </p>
        </div>
      </TableCell>
      <TableCell className="text-right px-2 py-2">
        <div className="font-mono text-xs font-semibold text-gray-700">
          {item.invoice_item.quantity.toFixed(2)}
        </div>
      </TableCell>
      <TableCell className="text-center px-2 py-2">
        <div className="text-[10px] font-medium text-gray-600">
          {formatUnit(item.invoice_item.unit)}
        </div>
      </TableCell>
      <TableCell className="text-right text-xs font-medium px-2 py-2">
        {formatCurrency(item.invoice_item.unit_price, invoice.currency)}
      </TableCell>
      <TableCell className="px-3 py-2">
        <div className="space-y-1">
          {matchedProduct ? (
            <div className="p-1.5 bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200 rounded-md shadow-sm">
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                    <p className="font-semibold text-green-900 text-xs truncate">
                      {matchedProduct.name}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px] text-green-700">
                    {matchedProduct.sku && (
                      <span className="px-1.5 py-0.5 bg-green-200/50 rounded text-[10px]">SKU: {matchedProduct.sku}</span>
                    )}
                    <span>{formatCurrency(matchedProduct.price, invoice.currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
             <React.Suspense fallback={<div className="text-[10px] text-gray-500 p-1">Yükleniyor...</div>}>
               <EInvoiceProductSelector
                 value=""
                 onChange={() => {}}
                 onProductSelect={(product) => handleProductSelect(index, product)}
                 onNewProduct={() => handleCreateNewProduct(index)}
                 placeholder="Ürün ara..."
                 className="text-xs"
               />
             </React.Suspense>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center px-2 py-2">
        {item.matched_product_id && (
          <Button
            onClick={() => handleRemoveMatch(index)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
});

EInvoiceTableRow.displayName = 'EInvoiceTableRow';

