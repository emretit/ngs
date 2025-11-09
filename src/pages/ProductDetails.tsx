import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import ProductDetailsHeader from "@/components/products/details/ProductDetailsHeader";
import { ProductInfo } from "@/components/products/details/ProductInfo";
import { ProductTabs } from "@/components/products/details/ProductTabs";
import { showError } from "@/utils/toastUtils";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  
  const { data: fetchedProduct, isLoading, refetch } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) return null;
      
      // Önce kullanıcının company_id'sini al
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      const companyId = profile?.company_id;

      const { data: productData, error } = await supabase
        .from("products")
        .select(`
          *,
          product_categories (
            id,
            name
          )
        `)
        .eq("id", id)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching product:", error);
        throw error;
      }
      
      if (!productData) return null;

      // Warehouse_stock tablosundan toplam stok miktarını çek
      let stockQuantity = 0;
      if (companyId) {
        const { data: stockData } = await supabase
          .from("warehouse_stock")
          .select("quantity")
          .eq("product_id", id)
          .eq("company_id", companyId);

        if (stockData) {
          stockQuantity = stockData.reduce((sum, stock) => sum + Number(stock.quantity || 0), 0);
        }
      }
      
      const transformedData: Product = {
        ...productData,
        formatted_description: {},
        last_purchase_date: null,
        related_products: [],
        product_categories: productData.product_categories || null,
        suppliers: null,
        stock_threshold: productData.stock_threshold || productData.min_stock_level,
        stock_quantity: stockQuantity // Warehouse_stock'tan gelen toplam stok
      };
      return transformedData;
    },
    enabled: !!id,
  });

  const handleEdit = () => {
    navigate(`/product-form/${id}`);
  };

  const handleProductUpdate = (updatedProduct: Product) => {
    setProduct(updatedProduct);
  };

  const handleUpdate = async (updates: Partial<Product>) => {
    if (!id) return;
    
    try {
      const { error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id);
      
      if (error) throw error;
      
      await refetch();
    } catch (error) {
      console.error("Error updating product:", error);
      showError("Ürün güncellenirken bir hata oluştu");
    }
  };

  const currentProduct = product || fetchedProduct;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
          <span className="text-gray-600">Ürün bilgileri yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Ürün bulunamadı</h2>
        <p className="text-gray-600">Bu ürün mevcut değil veya silinmiş olabilir.</p>
      </div>
    );
  }

  return (
    <>
      <ProductDetailsHeader
        product={currentProduct}
        id={id || ''}
        onEdit={handleEdit}
        onUpdate={handleProductUpdate}
      />
      <div className="space-y-4 mt-4">
        <ProductInfo
          product={currentProduct}
          onUpdate={handleProductUpdate}
        />
        <ProductTabs 
          product={currentProduct} 
          onUpdate={handleUpdate}
        />
      </div>
    </>
  );
};

export default ProductDetails;
