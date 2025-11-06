
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showWarning } from "@/utils/toastUtils";
import { ProductFormSchema } from "../ProductFormSchema";

export const useProductFormActions = (
  isEditing: boolean, 
  productId: string | undefined,
  setIsSubmitting: (value: boolean) => void
) => {
  const navigate = useNavigate();

  const onSubmit = async (values: ProductFormSchema, addAnother = false) => {
    setIsSubmitting(true);
    try {
        // Prepare data by ensuring null values for empty strings in UUID fields
        const preparedData = {
          ...values,
          category_id: values.category_id && values.category_id.trim() !== "" && values.category_id !== "none" ? values.category_id : null,
          supplier_id: values.supplier_id && values.supplier_id.trim() !== "" && values.supplier_id !== "none" ? values.supplier_id : null,
          // Make sure stock_threshold is explicitly included
          stock_threshold: values.stock_threshold !== undefined ? values.stock_threshold : values.min_stock_level,
          // Ensure company_id is included
            company_id: values.company_id || "5a9c24d2-876e-4eb6-aea5-19328bc38a3a"
        };
        
      
      if (isEditing && productId) {
        const updateData = {
          ...preparedData,
          // Ek bilgiler - yeni kolonlar
          max_stock_level: preparedData.max_stock_level || null,
          weight: preparedData.weight || null,
          dimensions: preparedData.dimensions || null,
          warranty_period: preparedData.warranty_period || null,
          tags: preparedData.tags || null,
          attachments: preparedData.attachments || [],
          vat_included: preparedData.vat_included ?? null,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from("products")
          .update(updateData)
          .eq("id", productId);

        if (error) {
          console.error("Supabase update error:", error);
          let errorMessage = "Ürün güncellenirken bir hata oluştu";
          
          // Provide more specific error message based on the error code
          if (error.code === "23505") {
            errorMessage = "Bu SKU veya barkod değeri zaten kullanılmaktadır";
          } else if (error.code === "23503") {
            errorMessage = "Belirtilen kategori veya tedarikçi bulunamadı";
          } else if (error.code === "42703") {
            errorMessage = "Veritabanı sütun ismi uyumsuzluğu. Lütfen sistem yöneticinize başvurun.";
          }
          
          showError(errorMessage);
          throw error;
        }

        showSuccess("Ürün başarıyla güncellendi", { duration: 900 });
        navigate(`/products`);
      } else {
        // Create a new product with explicit fields that match the database schema
        const { data, error } = await supabase
          .from("products")
          .insert({
            name: preparedData.name,
            description: preparedData.description,
            sku: preparedData.sku,
            barcode: preparedData.barcode,
            price: preparedData.price,
            discount_rate: preparedData.discount_rate,
            stock_quantity: preparedData.stock_quantity,
            min_stock_level: preparedData.min_stock_level,
            stock_threshold: preparedData.stock_threshold,
            tax_rate: preparedData.tax_rate,
            unit: preparedData.unit,
            is_active: preparedData.is_active,
            currency: preparedData.currency,
            category_type: preparedData.category_type,
            product_type: preparedData.product_type,
            status: preparedData.status,
            image_url: preparedData.image_url,
            category_id: preparedData.category_id,
            supplier_id: preparedData.supplier_id,
            company_id: preparedData.company_id,
            // Ek bilgiler - yeni kolonlar
            max_stock_level: preparedData.max_stock_level || null,
            weight: preparedData.weight || null,
            dimensions: preparedData.dimensions || null,
            warranty_period: preparedData.warranty_period || null,
            tags: preparedData.tags || null,
            attachments: preparedData.attachments || [],
            vat_included: preparedData.vat_included ?? null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();

        if (error) {
          console.error("Error saving product:", error);
          let errorMessage = "Ürün kaydedilirken bir hata oluştu";
          
          // Provide more specific error message based on the error code
          if (error.code === "23505") {
            errorMessage = "Bu SKU veya barkod değeri zaten kullanılmaktadır";
          } else if (error.code === "23503") {
            errorMessage = "Belirtilen kategori veya tedarikçi bulunamadı";
          } else if (error.code === "42703") {
            errorMessage = "Veritabanı sütun ismi uyumsuzluğu. Lütfen sistem yöneticinize başvurun.";
          }
          
          showError(errorMessage);
          throw error;
        }

        showSuccess("Ürün başarıyla oluşturuldu", { duration: 900 });
        
        if (addAnother) {
          // We'll handle form reset in the component
          return { resetForm: true };
        } else {
          navigate(`/products`);
        }
      }
      return { resetForm: false };
    } catch (error) {
      console.error("Submit error:", error);
      showError("Ürün kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.");
      return { resetForm: false };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!productId) return;

    try {
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (fetchError) throw fetchError;
      
      if (product) {
        const newProduct = {
          ...product,
          name: `${product.name} (Kopya)`,
          sku: product.sku ? `${product.sku}-copy` : null,
          barcode: null,
        };
        
        delete newProduct.id;
        delete newProduct.created_at;
        delete newProduct.updated_at;

        const { data, error } = await supabase
          .from("products")
          .insert(newProduct)
          .select()
          .single();

        if (error) throw error;

        showSuccess("Ürün başarıyla kopyalandı", { duration: 1000 });
        if (data) {
          navigate(`/product-form/${data.id}`);
        }
      }
    } catch (error) {
      console.error("Error duplicating product:", error);
      showError("Ürün kopyalanırken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  return {
    onSubmit,
    handleDuplicate
  };
};
