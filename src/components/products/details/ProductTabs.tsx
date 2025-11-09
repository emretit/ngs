import { Archive, ShoppingCart, Receipt, Grid, Settings, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CustomTabs, 
  CustomTabsContent, 
  CustomTabsList, 
  CustomTabsTrigger 
} from "@/components/ui/custom-tabs";
import { Product } from "@/types/product";
import ProductInventory from "./ProductInventory";
import ProductWarehouseStock from "./ProductWarehouseStock";
import { ProductStockMovements } from "./ProductStockMovements";
import ProductRelated from "./ProductRelated";
import { ProductOrdersTab } from "./ProductOrdersTab";
import { ProductInvoicesTab } from "./ProductInvoicesTab";
import { ProductTechnicalSpecs } from "./ProductTechnicalSpecs";
import { ProductSuppliersTab } from "./ProductSuppliersTab";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProductTabsProps {
  product: Product;
  onUpdate: (updates: Partial<Product>) => void;
}

export const ProductTabs = ({ product, onUpdate }: ProductTabsProps) => {
  // Fetch counts for each tab
  const { data: tabCounts } = useQuery({
    queryKey: ['product-tab-counts', product.id],
    queryFn: async () => {
      const [ordersRes, invoicesRes] = await Promise.all([
        supabase
          .from('order_items')
          .select('id', { count: 'exact' })
          .eq('product_id', product.id),
        supabase
          .from('sales_invoice_items')
          .select('id', { count: 'exact' })
          .eq('product_id', product.id),
      ]);

      return {
        orders: ordersRes.count || 0,
        invoices: invoicesRes.count || 0,
      };
    },
  });

  const TabTrigger = ({ 
    value, 
    icon, 
    label, 
    count 
  }: { 
    value: string; 
    icon: React.ReactNode; 
    label: string; 
    count?: number; 
  }) => (
    <CustomTabsTrigger 
      value={value} 
      className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200 relative"
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        {icon}
        <span className="text-xs sm:text-sm">{label}</span>
        {count !== undefined && count > 0 && (
          <Badge variant="secondary" className="ml-0.5 sm:ml-1 h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
            {count}
          </Badge>
        )}
      </div>
    </CustomTabsTrigger>
  );

  const EmptyState = ({ icon, title, description }: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }) => (
    <Card className="p-8">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </Card>
  );

  return (
    <CustomTabs defaultValue="stock" className="space-y-4">
      <CustomTabsList className="w-full bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-1 shadow-sm flex flex-nowrap justify-start sm:justify-center overflow-x-auto">
        <TabTrigger 
          value="stock" 
          icon={<Archive className="h-4 w-4" />} 
          label="Stok" 
        />
        <TabTrigger 
          value="orders" 
          icon={<ShoppingCart className="h-4 w-4" />} 
          label="Siparişler" 
          count={tabCounts?.orders}
        />
        <TabTrigger 
          value="invoices" 
          icon={<Receipt className="h-4 w-4" />} 
          label="Faturalar" 
          count={tabCounts?.invoices}
        />
        <TabTrigger 
          value="technical" 
          icon={<Settings className="h-4 w-4" />} 
          label="Teknik" 
        />
        <TabTrigger 
          value="suppliers" 
          icon={<Truck className="h-4 w-4" />} 
          label="Tedarikçiler" 
        />
        <TabTrigger 
          value="related" 
          icon={<Grid className="h-4 w-4" />} 
          label="Benzer" 
        />
      </CustomTabsList>

      <CustomTabsContent value="stock">
        <div className="space-y-4">
          <ProductInventory
            stockQuantity={product.stock_quantity}
            minStockLevel={product.min_stock_level}
            stockThreshold={product.stock_threshold}
            unit={product.unit}
            supplier={product.suppliers || null}
            lastPurchaseDate={product.last_purchase_date || null}
            onUpdate={onUpdate}
          />
          <ProductWarehouseStock
            productId={product.id}
            totalStock={product.stock_quantity}
            unit={product.unit}
          />
          <ProductStockMovements productId={product.id} />
        </div>
      </CustomTabsContent>

      <CustomTabsContent value="orders">
        <ProductOrdersTab productId={product.id} />
      </CustomTabsContent>

      <CustomTabsContent value="invoices">
        <ProductInvoicesTab productId={product.id} />
      </CustomTabsContent>

      <CustomTabsContent value="technical">
        <ProductTechnicalSpecs product={product} onUpdate={onUpdate} />
      </CustomTabsContent>

      <CustomTabsContent value="suppliers">
        <ProductSuppliersTab product={product} onUpdate={onUpdate} />
      </CustomTabsContent>

      <CustomTabsContent value="related">
        <ProductRelated 
          categoryId={product.category_id}
          currentProductId={product.id}
          relatedProducts={product.related_products || []}
          onUpdate={onUpdate}
        />
      </CustomTabsContent>
    </CustomTabs>
  );
};

