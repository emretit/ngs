
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Product } from "@/types/product";
import Navbar from "@/components/Navbar";
import { TopBar } from "@/components/TopBar";
import ProductDetailsHeader from "@/components/products/details/ProductDetailsHeader";
import ProductDetailsTabs from "@/components/products/details/ProductDetailsTabs";
import ProductDetailsLoading from "@/components/products/details/ProductDetailsLoading";

interface ProductDetailsProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const ProductDetails = ({ isCollapsed, setIsCollapsed }: ProductDetailsProps) => {
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
        suppliers: null
      };

      return transformedData;
    },
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
      toast.success("Ürün başarıyla güncellendi");
    },
    onError: () => {
      toast.error("Ürün güncellenirken bir hata oluştu");
    },
  });

  if (isLoading) {
    return <ProductDetailsLoading isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
  }

  if (!product) {
    return <ProductDetailsLoading isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} isError />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-1 transition-all duration-300 ${
        isCollapsed ? "ml-[60px]" : "ml-[60px] sm:ml-64"
      }`}>
        <TopBar />
        <ProductDetailsHeader product={product} isLoading={isLoading} />
        <div className="container">
          <div className="flex flex-col">
            <ProductDetailsTabs 
              product={product} 
              onUpdate={updateProductMutation.mutate} 
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetails;
