
import { 
  CustomTabs, 
  CustomTabsContent, 
  CustomTabsList, 
  CustomTabsTrigger 
} from "@/components/ui/custom-tabs";
import ProductGeneralInfo from "@/components/products/details/ProductGeneralInfo";
import ProductPricing from "@/components/products/details/ProductPricing";
import ProductInventory from "@/components/products/details/ProductInventory";
import ProductRelated from "@/components/products/details/ProductRelated";
import { Product } from "@/types/product";

interface ProductDetailsTabsProps {
  product: Product;
  onUpdate: (updates: Partial<Product>) => void;
}

const ProductDetailsTabs = ({ product, onUpdate }: ProductDetailsTabsProps) => {
  return (
    <div className="container">
      <CustomTabs defaultValue="general" className="w-full">
        <CustomTabsList className="grid grid-cols-4 w-full bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-1 shadow-sm">
          <CustomTabsTrigger value="general" className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">Genel</CustomTabsTrigger>
          <CustomTabsTrigger value="pricing" className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">Fiyatlandırma</CustomTabsTrigger>
          <CustomTabsTrigger value="stock" className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">Stok</CustomTabsTrigger>
          <CustomTabsTrigger value="related" className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">Benzer Ürünler</CustomTabsTrigger>
        </CustomTabsList>
        
        <CustomTabsContent value="general" className="mt-6">
          <ProductGeneralInfo
            product={product}
            onUpdate={onUpdate}
          />
        </CustomTabsContent>
        
        <CustomTabsContent value="pricing" className="mt-6">
          <ProductPricing
            price={product.price}
            currency={product.currency}
            taxRate={product.tax_rate}
            purchasePrice={product.purchase_price}
            exchangeRate={product.exchange_rate}
            onUpdate={onUpdate}
          />
        </CustomTabsContent>
        
        <CustomTabsContent value="stock" className="mt-6">
          <ProductInventory
            stockQuantity={product.stock_quantity}
            minStockLevel={product.min_stock_level}
            unit={product.unit}
            supplier={product.suppliers}
            lastPurchaseDate={product.last_purchase_date}
            onUpdate={onUpdate}
          />
        </CustomTabsContent>
        
        <CustomTabsContent value="related" className="mt-6">
          <ProductRelated 
            categoryId={product.category_id} 
            currentProductId={product.id}
            relatedProducts={product.related_products}
            onUpdate={onUpdate}
          />
        </CustomTabsContent>
      </CustomTabs>
    </div>
  );
};

export default ProductDetailsTabs;
