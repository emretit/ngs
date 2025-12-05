
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
      currency: "TRY",
      category_type: "product",
      product_type: "physical",
      status: "active", // is_active: true olduğu için status: "active"
      image_url: null,
      category_id: "",
      supplier_id: "",
      company_id: "",
      // Ek bilgiler - yeni kolonlar
      purchase_price: 0,
      price_includes_vat: false,
      purchase_price_includes_vat: false,
      max_stock_level: null,
      weight: null,
      dimensions: null,
      warranty_period: null,
      tags: null,
      attachments: [],
      vat_included: null,
    },
  });

  // is_active değiştiğinde status'u da güncelle
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "is_active") {
        form.setValue("status", value.is_active ? "active" : "inactive", { shouldValidate: false });
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

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
          // Para birimi değerini direkt kullan (TRY olarak)
          const displayCurrency = data.currency || "TRY";
          const isActive = data.is_active ?? true;

          // Validate and fix status value
          const validStatuses = ["active", "inactive", "discontinued"];
          let statusValue = data.status;
          if (!statusValue || !validStatuses.includes(statusValue)) {
            statusValue = isActive ? "active" : "inactive";
            console.log("🟡 Geçersiz status değeri düzeltildi:", data.status, "->", statusValue);
          }

          // Validate and fix unit value
          const unitValue = (data.unit && data.unit.trim() !== "") ? data.unit : "piece";

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
            unit: unitValue,
            is_active: isActive,
            currency: displayCurrency,
            category_type: data.category_type || "product",
            product_type: data.product_type || "physical",
            status: statusValue,
            image_url: data.image_url || null,
            category_id: data.category_id || "",
            supplier_id: data.supplier_id || "",
            company_id: data.company_id || "",
            vat_included: data.vat_included ?? null,
            // Yeni eklenen alanlar - veritabanından oku
            purchase_price: data.purchase_price ?? 0,
            price_includes_vat: data.price_includes_vat ?? false,
            purchase_price_includes_vat: data.purchase_price_includes_vat ?? false,
            max_stock_level: data.max_stock_level ?? null,
            weight: data.weight ?? null,
            dimensions: data.dimensions ?? null,
            warranty_period: data.warranty_period ?? null,
            tags: Array.isArray(data.tags) ? data.tags.join(", ") : (data.tags ?? null),
            attachments: data.attachments ?? [],
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
