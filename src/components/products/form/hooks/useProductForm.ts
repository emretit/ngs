
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
      discount_rate: 0,
      stock_quantity: 0,
      min_stock_level: 0,
      stock_threshold: 0,
      tax_rate: 20,
      unit: "piece",
      is_active: true,
      currency: "TL",
      category_type: "product",
      product_type: "physical",
      status: "active",
      image_url: null,
      category_id: "",
      supplier_id: "",
      company_id: "5a9c24d2-876e-4eb6-aea5-19328bc38a3a",
      // Ek bilgiler - yeni kolonlar
      max_stock_level: null,
      weight: null,
      dimensions: null,
      warranty_period: null,
      tags: null,
      attachments: [],
      vat_included: null,
    },
  });

  // Watch price and discount_rate for automatic discount calculation
  const watchedPrice = form.watch("price");
  const watchedDiscountRate = form.watch("discount_rate");

  // Calculate discount price when price or discount rate changes
  useEffect(() => {
    if (watchedPrice && watchedDiscountRate > 0) {
      const discountAmount = (watchedPrice * watchedDiscountRate) / 100;
      const discountedPrice = watchedPrice - discountAmount;
      // Use discount_rate field instead of discount_price
    } else {
      // Use discount_rate field instead of discount_price
    }
  }, [watchedPrice, watchedDiscountRate, form]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        // Önce kullanıcının company_id'sini al
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user?.id)
          .single();

        const companyId = profile?.company_id;

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          // Warehouse_stock tablosundan toplam stok miktarını çek
          let stockQuantity = 0;
          if (companyId) {
            const { data: stockData } = await supabase
              .from("warehouse_stock")
              .select("quantity")
              .eq("product_id", id)
              .eq("company_id", companyId);

            if (stockData && stockData.length > 0) {
              stockQuantity = stockData.reduce((sum, stock) => sum + (Number(stock.quantity) || 0), 0);
            }
          }

          // Sadece veritabanında mevcut olan kolonları kullan
          form.reset({
            name: data.name || "",
            description: data.description || "",
            sku: data.sku || "",
            barcode: data.barcode || "",
            price: data.price || 0,
            discount_rate: data.discount_rate || 0,
            stock_quantity: stockQuantity, // Warehouse_stock'tan gelen toplam stok
            min_stock_level: data.min_stock_level || 0,
            stock_threshold: data.stock_threshold || data.min_stock_level || 0,
            tax_rate: data.tax_rate || 20,
            unit: data.unit || "piece",
            is_active: data.is_active ?? true,
            currency: data.currency || "TL",
            category_type: data.category_type || "product",
            product_type: data.product_type || "physical",
            status: data.status || "active",
            image_url: data.image_url || null,
            category_id: data.category_id || "",
            supplier_id: data.supplier_id || "",
            company_id: data.company_id || "5a9c24d2-876e-4eb6-aea5-19328bc38a3a",
            vat_included: data.vat_included ?? null,
            // Veritabanında olmayan kolonlar için default değerler
            max_stock_level: null,
            weight: null,
            dimensions: null,
            warranty_period: null,
            tags: null,
            attachments: [],
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
