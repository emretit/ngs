
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
        <CustomTabsList className="grid grid-cols-4 w-full bg-white rounded-xl border p-1 h-12">
          <CustomTabsTrigger value="general" className="h-10 text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-white">Genel</CustomTabsTrigger>
          <CustomTabsTrigger value="pricing" className="h-10 text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-white">Fiyatlandırma</CustomTabsTrigger>
          <CustomTabsTrigger value="stock" className="h-10 text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-white">Stok</CustomTabsTrigger>
          <CustomTabsTrigger value="related" className="h-10 text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-white">Benzer Ürünler</CustomTabsTrigger>
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
            productId={product.id}
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
