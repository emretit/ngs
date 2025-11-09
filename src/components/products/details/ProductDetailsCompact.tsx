import { Product } from "@/types/product";
import ProductGeneralInfo from "@/components/products/details/ProductGeneralInfo";
import ProductInventory from "@/components/products/details/ProductInventory";
import ProductPricing from "@/components/products/details/ProductPricing";
import ProductRelated from "@/components/products/details/ProductRelated";
import ProductMeta from "@/components/products/details/ProductMeta";

interface ProductDetailsCompactProps {
	product: Product;
	onUpdate: (updates: Partial<Product>) => void;
}

const ProductDetailsCompact = ({ product, onUpdate }: ProductDetailsCompactProps) => {
	return (
		<div className="space-y-4">
			{/* Row 1: General + Inventory */}
			<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
				<ProductGeneralInfo product={product} onUpdate={onUpdate as any} />
				<ProductInventory
					productId={product.id}
					stockQuantity={product.stock_quantity}
					minStockLevel={product.min_stock_level}
					stockThreshold={product.stock_threshold}
					unit={product.unit}
					supplier={product.suppliers || null}
					lastPurchaseDate={product.last_purchase_date || null}
					onUpdate={onUpdate as any}
				/>
			</div>

			{/* Row 2: Pricing + Meta */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<ProductPricing
					price={product.price}
					currency={product.currency}
					taxRate={product.tax_rate}
					purchasePrice={product.purchase_price}
					exchangeRate={product.exchange_rate}
					onUpdate={onUpdate as any}
				/>
				<ProductMeta 
					createdAt={product.created_at}
					updatedAt={product.updated_at}
					isActive={product.is_active}
				/>
			</div>

			{/* Row 3: Related */}
			<div>
				<ProductRelated 
					categoryId={product.category_id}
					currentProductId={product.id}
					relatedProducts={product.related_products || []}
					onUpdate={onUpdate as any}
				/>
			</div>
		</div>
	);
};

export default ProductDetailsCompact;
