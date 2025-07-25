
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProductFormSchema, productSchema } from "../ProductFormSchema";

export const useProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProductFormSchema>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      barcode: "",
      price: 0,
      discount_price: null,
      stock_quantity: 0,
      min_stock_level: 0,
      stock_threshold: 0,
      tax_rate: 18,
      unit: "piece",
      is_active: true,
      currency: "TRY",
      category_type: "product",
      product_type: "physical",
      status: "active",
      image_url: null,
      category_id: "",
      supplier_id: "",
    },
  });

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            ...data,
            description: data.description || "",
            sku: data.sku || "",
            barcode: data.barcode || "",
            image_url: data.image_url || null,
            category_id: data.category_id || "",
            supplier_id: data.supplier_id || "",
            discount_price: data.discount_price || null,
            stock_threshold: data.stock_threshold || data.min_stock_level, // Default to min_stock_level if not set
          });
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Ürün bilgileri yüklenirken bir hata oluştu.");
      }
    };

    fetchProduct();
  }, [id, form]);

  return {
    form,
    isEditing,
    isSubmitting,
    setIsSubmitting,
    productId: id,
  };
};
