
import React, { useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, AlertCircle, Info } from "lucide-react";
import { ProposalItem } from "@/types/proposal";
import { Product } from "@/types/product";
import ProposalItemsHeader from "./ProposalItemsHeader";
import ProposalItemsTable from "./ProposalItemsTable";
import ProductSearchDialog from "./product-dialog/ProductSearchDialog";
import { useProposalItems } from "./useProposalItems";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PROPOSAL_ITEM_GROUPS } from "./proposalItemsConstants";
import { useExchangeRates } from "@/hooks/useExchangeRates";

interface ProposalItemsProps {
  items: ProposalItem[];
  onItemsChange: (items: ProposalItem[]) => void;
  globalCurrency?: string; // Global para birimi
}

const ProposalItems: React.FC<ProposalItemsProps> = ({ 
  items, 
  onItemsChange,
  globalCurrency = "TRY"
}) => {
  // Get dashboard exchange rates
  const { exchangeRates: dashboardRates, convertCurrency: dashboardConvert } = useExchangeRates();
  
  const {
    selectedCurrency,
    setSelectedCurrency,
    productDialogOpen,
    setProductDialogOpen,
    exchangeRates,
    formatCurrency,
    currencyOptions,
    handleCurrencyChange,
    handleAddItem,
    handleSelectProduct,
    handleRemoveItem,
    handleItemChange,
    products,
    isLoading,
    updateAllItemsCurrency
  } = useProposalItems();

  // Tax rate options
  const taxRateOptions = [
    { value: 0, label: "%0" },
    { value: 1, label: "%1" },
    { value: 8, label: "%8" },
    { value: 18, label: "%18" },
    { value: 20, label: "%20" }
  ];

  // Global para birimi değiştiğinde tüm kalemleri güncelle
  useEffect(() => {
    if (globalCurrency && globalCurrency !== selectedCurrency) {
      console.log(`Global currency changed to ${globalCurrency}, updating items...`);
      setSelectedCurrency(globalCurrency);
      
      // Tüm kalemlerin para birimini güncelle
      if (items.length > 0) {
        const updatedItems = updateAllItemsCurrency(globalCurrency);
        if (updatedItems) {
          onItemsChange(updatedItems);
          toast.success(`Tüm kalemler ${globalCurrency} para birimine dönüştürüldü`);
        }
      }
    }
  }, [globalCurrency, selectedCurrency, setSelectedCurrency, updateAllItemsCurrency, items, onItemsChange]);

  // Calculate totals
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      // Item para birimi ile teklif para birimi farklı ise dönüştür
      if (item.currency && item.currency !== globalCurrency) {
        const convertedPrice = dashboardConvert(Number(item.total_price || 0), item.currency, globalCurrency);
        return sum + convertedPrice;
      }
      return sum + Number(item.total_price || 0);
    }, 0);
  };

  // Calculate tax total
  const calculateTaxTotal = () => {
    return items.reduce((sum, item) => {
      const unitPrice = item.unit_price || 0;
      const quantity = item.quantity || 0;
      const taxRate = item.tax_rate || 0;
      const discountRate = item.discount_rate || 0;
      
      // Apply discount to unit price
      const discountedUnitPrice = unitPrice * (1 - discountRate / 100);
      
      // Calculate tax amount
      const itemSubtotal = discountedUnitPrice * quantity;
      const taxAmount = itemSubtotal * (taxRate / 100);
      
      // Eğer para birimi farklı ise dönüştür
      if (item.currency && item.currency !== globalCurrency) {
        return sum + dashboardConvert(taxAmount, item.currency, globalCurrency);
      }
      
      return sum + taxAmount;
    }, 0);
  };

  // Calculate discount total
  const calculateDiscountTotal = () => {
    return items.reduce((sum, item) => {
      const unitPrice = item.unit_price || 0;
      const quantity = item.quantity || 0;
      const discountRate = item.discount_rate || 0;
      
      // Calculate discount amount
      const itemFullPrice = unitPrice * quantity;
      const discountAmount = itemFullPrice * (discountRate / 100);
      
      // Eğer para birimi farklı ise dönüştür
      if (item.currency && item.currency !== globalCurrency) {
        return sum + dashboardConvert(discountAmount, item.currency, globalCurrency);
      }
      
      return sum + discountAmount;
    }, 0);
  };

  // Gruplar bazında toplam hesaplama
  const groupTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    
    PROPOSAL_ITEM_GROUPS.forEach(group => {
      totals[group.value] = 0;
    });

    items.forEach(item => {
      const group = item.group || 'diger';
      let itemTotal = item.total_price || 0;
      
      // Eğer para birimi farklı ise dönüştür
      if (item.currency && item.currency !== globalCurrency) {
        itemTotal = dashboardConvert(itemTotal, item.currency, globalCurrency);
      }
      
      totals[group] = (totals[group] || 0) + itemTotal;
    });
    
    return totals;
  }, [items, globalCurrency, dashboardConvert]);

  const handleProductSelect = (product: Product) => {
    // Ürünün kendi para birimini koruyacak şekilde teklife ekleme
    // Product will be added with its original currency
    const updatedItems = handleSelectProduct(product);
    if (updatedItems) {
      onItemsChange(updatedItems);
      toast.success(`${product.name} teklif kalemine ${product.currency || "TRY"} para birimi ile eklendi`);
    }
  };

  // Handle adding a new item
  const onAddItem = () => {
    const updatedItems = handleAddItem();
    if (updatedItems) {
      onItemsChange(updatedItems);
    }
  };

  // Handle removing an item
  const onRemoveItem = (index: number) => {
    const itemId = items[index].id;
    const updatedItems = handleRemoveItem(itemId);
    if (updatedItems) {
      onItemsChange(updatedItems);
    }
  };

  // Handle item changes
  const onItemChange = (index: number, field: keyof ProposalItem, value: any) => {
    const itemId = items[index].id;
    const updatedItems = handleItemChange(itemId, field, value);
    if (updatedItems) {
      onItemsChange(updatedItems);
    }
  };

  // Özellikle para birimi değişikliğini ele alma
  const onItemCurrencyChange = (index: number, newCurrency: string) => {
    const item = items[index];
    const itemId = item.id;
    
    // Ürünün orijinal para birimi ve fiyatını kullan (daha doğru dönüşüm için)
    const sourceCurrency = item.original_currency || item.currency || globalCurrency;
    const sourcePrice = 
      sourceCurrency === item.original_currency && item.original_price !== undefined
        ? item.original_price
        : item.unit_price || 0;
    
    // Dashboard exchange rates ile dönüştür
    const convertedPrice = dashboardConvert(sourcePrice, sourceCurrency, newCurrency);
    
    // Önce currency'yi güncelle
    let updatedItems = handleItemChange(itemId, "currency", newCurrency);
    if (updatedItems) {
      // Sonra dönüştürülmüş fiyatı güncelle
      updatedItems = updatedItems.map(updatedItem => {
        if (updatedItem.id === itemId) {
          return { ...updatedItem, unit_price: convertedPrice };
        }
        return updatedItem;
      });
      
      // Total price'ı yeniden hesapla
      updatedItems = updatedItems.map(updatedItem => {
        if (updatedItem.id === itemId) {
          const quantity = Number(updatedItem.quantity);
          const discountRate = Number(updatedItem.discount_rate || 0);
          const taxRate = Number(updatedItem.tax_rate || 0);
          
          const discountedPrice = convertedPrice * (1 - discountRate / 100);
          const totalPrice = quantity * discountedPrice * (1 + taxRate / 100);
          
          return { ...updatedItem, total_price: totalPrice };
        }
        return updatedItem;
      });
      
      onItemsChange(updatedItems);
      toast.success(`Kalem para birimi ${newCurrency} olarak güncellendi`);
    }
  };

  // Check for stock warnings
  const hasLowStockItems = items.some(item => item.stock_status === 'low_stock');
  const hasOutOfStockItems = items.some(item => item.stock_status === 'out_of_stock');

  // Gruplara göre ürün sayısı
  const itemCountByGroup = useMemo(() => {
    const counts: Record<string, number> = {};
    
    items.forEach(item => {
      const group = item.group || 'diger';
      counts[group] = (counts[group] || 0) + 1;
    });
    
    return counts;
  }, [items]);

  // Para birimi değişikliğini ele alma
  const handleGlobalCurrencyChange = (currency: string) => {
    // Para birimi değişikliği için handleCurrencyChange fonksiyonunu çağır
    handleCurrencyChange(currency);
    
    // Tüm kalemlerin para birimini güncelle
    if (items.length > 0) {
      const updatedItems = updateAllItemsCurrency(currency);
      if (updatedItems) {
        onItemsChange(updatedItems);
        toast.success(`Tüm kalemler ${currency} para birimine dönüştürüldü`);
      }
    }
  };

  return (
    <div className="space-y-4">
      {items.length === 0 && (
        <Alert variant="default" className="border-blue-500 text-blue-800 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
          <Info className="h-4 w-4" />
          <AlertTitle>Teklif Kalemleri Ekleme</AlertTitle>
          <AlertDescription>
            "Ürün Ekle" butonu ile mevcut ürünlerden seçim yapabilir veya "Manuel Ekle" ile yeni kalemler oluşturabilirsiniz. Eklenen ürünler aşağıda listelenecektir.
          </AlertDescription>
        </Alert>
      )}

      <ProposalItemsHeader
        selectedCurrency={globalCurrency || "TRY"}
        onCurrencyChange={handleGlobalCurrencyChange}
        onAddItem={onAddItem}
        onOpenProductDialog={() => setProductDialogOpen(true)}
        currencyOptions={currencyOptions}
        isGlobalCurrencyEnabled={false} // Artık global para birimi kullanıyoruz
      />
      
      {/* Stock warnings */}
      {(hasLowStockItems || hasOutOfStockItems) && (
        <Alert variant={hasOutOfStockItems ? "destructive" : "default"} className={!hasOutOfStockItems ? "border-yellow-500 text-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800" : ""}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {hasOutOfStockItems ? "Stokta olmayan ürünler" : "Düşük stoklu ürünler"}
          </AlertTitle>
          <AlertDescription>
            {hasOutOfStockItems 
              ? "Teklifinizde stokta olmayan ürünler bulunmaktadır. Lütfen stok durumunu kontrol edin."
              : "Teklifinizde düşük stok seviyesinde ürünler bulunmaktadır. Stok durumunu kontrol etmeniz önerilir."}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="border dark:border-gray-700 rounded-md overflow-hidden">
        <ProposalItemsTable
          items={items}
          handleItemChange={onItemChange}
          handleRemoveItem={onRemoveItem}
          selectedCurrency={globalCurrency || "TRY"}
          formatCurrency={formatCurrency}
          currencyOptions={currencyOptions}
          taxRateOptions={taxRateOptions}
          handleItemCurrencyChange={onItemCurrencyChange}
        />
      </div>

      {items.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between gap-4">
          {/* Grup bazlı dağılım */}
          <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-md flex-grow">
            <h3 className="text-sm font-medium mb-2">Teklif Kalemleri Dağılımı</h3>
            <div className="grid grid-cols-2 gap-2">
              {PROPOSAL_ITEM_GROUPS.map(group => (
                itemCountByGroup[group.value] ? (
                  <div key={group.value} className="flex justify-between text-xs">
                    <span className="flex items-center">
                      <Badge variant="outline" className="mr-2 py-0 h-5">
                        {itemCountByGroup[group.value]}
                      </Badge>
                      {group.label}:
                    </span>
                    <span>{formatCurrency(groupTotals[group.value], globalCurrency)}</span>
                  </div>
                ) : null
              ))}
            </div>
          </div>
          
          {/* Toplam özeti */}
          <div className="space-y-2 min-w-[300px] p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <div className="flex justify-between text-sm">
              <span>Ara Toplam:</span>
              <span>{formatCurrency(calculateSubtotal() - calculateTaxTotal(), globalCurrency)}</span>
            </div>
            {calculateDiscountTotal() > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>İndirim Tutarı:</span>
                <span>-{formatCurrency(calculateDiscountTotal(), globalCurrency)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>KDV Toplamı:</span>
              <span>{formatCurrency(calculateTaxTotal(), globalCurrency)}</span>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t dark:border-gray-700">
              <span>Genel Toplam:</span>
              <span>{formatCurrency(calculateSubtotal(), globalCurrency)}</span>
            </div>
          </div>
        </div>
      )}
      
      <ProductSearchDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        onSelectProduct={handleProductSelect}
        selectedCurrency={globalCurrency || "TRY"}
      />
    </div>
  );
};

export default ProposalItems;
