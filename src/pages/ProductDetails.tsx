import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import ProductDetailsHeader from "@/components/products/details/ProductDetailsHeader";
import ProductDetailsTabs from "@/components/products/details/ProductDetailsTabs";
import { showSuccess, showError } from "@/utils/toastUtils";

const ProductDetails = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
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
        .single();

      if (error) throw error;

      const transformedData: Product = {
        ...productData,
        formatted_description: {},
        last_purchase_date: null,
        related_products: [],
        product_categories: productData.product_categories || null,
        suppliers: null,
        // Make sure stock_threshold is available, default to min_stock_level if not set
        stock_threshold: productData.stock_threshold || productData.min_stock_level
      };

      return transformedData;
    },
    meta: {
      onError: (error: Error) => {
        console.error("Error fetching product:", error);
        showError("Ürün bilgilerini alırken bir hata oluştu");
      }
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async (updates: Partial<Product>) => {
      const { error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      showSuccess("Ürün başarıyla güncellendi");
    },
    onError: (error) => {
      console.error("Error updating product:", error);
      showError("Ürün güncellenirken bir hata oluştu");
    },
  });

  if (isLoading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DefaultLayout>
    );
  }

  if (!product) {
    return (
      <DefaultLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ürün bulunamadı</h2>
          <p className="text-gray-600">Bu ürün mevcut değil veya silinmiş olabilir.</p>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <ProductDetailsHeader product={product} isLoading={isLoading} />
      <div className="mt-4">
        <ProductDetailsTabs 
          product={product} 
          onUpdate={updateProductMutation.mutate} 
        />
      </div>
    </DefaultLayout>
  );
};

export default ProductDetails;
