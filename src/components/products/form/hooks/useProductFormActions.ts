
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showWarning } from "@/utils/toastUtils";
import { ProductFormSchema } from "../ProductFormSchema";

export const useProductFormActions = (
  isEditing: boolean, 
  productId: string | undefined,
  setIsSubmitting: (value: boolean) => void
) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
        // Sadece veritabanında mevcut olan kolonları gönder
        // Stock artık warehouse_stock tablosunda tutulduğu için products tablosunda güncellenmiyor
        const updateData: any = {
          name: preparedData.name,
          description: preparedData.description || null,
          sku: preparedData.sku || null,
          barcode: preparedData.barcode || null,
          price: preparedData.price,
          discount_rate: preparedData.discount_rate || 0,
          stock_quantity: 0, // Products tablosunda stok artık kullanılmıyor
          min_stock_level: preparedData.min_stock_level || 0,
          stock_threshold: preparedData.stock_threshold || preparedData.min_stock_level || 0,
          tax_rate: preparedData.tax_rate,
          unit: preparedData.unit,
          is_active: preparedData.is_active,
          currency: preparedData.currency,
          category_type: preparedData.category_type,
          product_type: preparedData.product_type,
          status: preparedData.status,
          image_url: preparedData.image_url || null,
          category_id: preparedData.category_id,
          supplier_id: preparedData.supplier_id,
          company_id: preparedData.company_id,
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
          } else if (error.message) {
            errorMessage = `${errorMessage}: ${error.message}`;
          }
          
          showError(errorMessage);
          throw error;
        }

        showSuccess("Ürün başarıyla güncellendi", { duration: 900 });
        
        // Invalidate products queries to refresh the table
        await queryClient.invalidateQueries({ queryKey: ["products"] });
        // Also invalidate the specific product query
        if (productId) {
          await queryClient.invalidateQueries({ queryKey: ["product", productId] });
        }
        
        navigate(`/products`);
        return { resetForm: false };
      } else {
        // Create a new product with explicit fields that match the database schema
        // Sadece veritabanında mevcut olan kolonları gönder
        const insertData: any = {
          name: preparedData.name,
          description: preparedData.description || null,
          sku: preparedData.sku || null,
          barcode: preparedData.barcode || null,
          price: preparedData.price,
          discount_rate: preparedData.discount_rate || 0,
          stock_quantity: preparedData.stock_quantity || 0,
          min_stock_level: preparedData.min_stock_level || 0,
          stock_threshold: preparedData.stock_threshold || preparedData.min_stock_level || 0,
          tax_rate: preparedData.tax_rate,
          unit: preparedData.unit,
          is_active: preparedData.is_active,
          currency: preparedData.currency,
          category_type: preparedData.category_type,
          product_type: preparedData.product_type,
          status: preparedData.status,
          image_url: preparedData.image_url || null,
          category_id: preparedData.category_id,
          supplier_id: preparedData.supplier_id,
          company_id: preparedData.company_id,
          vat_included: preparedData.vat_included ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Stock artık warehouse_stock tablosunda tutulduğu için products tablosuna 0 olarak kaydediyoruz
        const insertDataWithoutStock = {
          ...insertData,
          stock_quantity: 0 // Products tablosunda stok artık kullanılmıyor
        };

        const { data, error } = await supabase
          .from("products")
          .insert(insertDataWithoutStock)
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
          } else if (error.message) {
            errorMessage = `${errorMessage}: ${error.message}`;
          }
          
          showError(errorMessage);
          throw error;
        }

        // Eğer stok miktarı varsa, warehouse_stock tablosuna ekle
        if (data && data.length > 0 && preparedData.stock_quantity > 0 && preparedData.company_id) {
          const productId = data[0].id;
          
          // Company'nin Ana Depo'sunu bul
          const { data: warehouses, error: warehouseError } = await supabase
            .from("warehouses")
            .select("id")
            .eq("company_id", preparedData.company_id)
            .eq("warehouse_type", "main")
            .eq("is_active", true)
            .limit(1)
            .maybeSingle();

          if (!warehouseError && warehouses) {
            // Ana Depo'ya stok ekle
            const { error: stockError } = await supabase
              .from("warehouse_stock")
              .insert({
                company_id: preparedData.company_id,
                product_id: productId,
                warehouse_id: warehouses.id,
                quantity: preparedData.stock_quantity || 0,
                reserved_quantity: 0,
                last_transaction_date: new Date().toISOString()
              });

            if (stockError) {
              console.error("Error adding stock to warehouse:", stockError);
              // Hata olsa bile ürün oluşturuldu, sadece stok eklenemedi
              showWarning("Ürün oluşturuldu ancak stok eklenirken bir hata oluştu. Lütfen stok girişi yapın.");
            }
          } else {
            // Ana Depo bulunamadı, uyarı ver
            console.warn("Ana Depo bulunamadı, stok eklenemedi");
            showWarning("Ürün oluşturuldu ancak stok eklenemedi. Lütfen stok girişi yapın.");
          }
        }

        showSuccess("Ürün başarıyla oluşturuldu", { duration: 900 });
        
        // Invalidate products queries to refresh the table
        await queryClient.invalidateQueries({ queryKey: ["products"] });
        
        if (addAnother) {
          // We'll handle form reset in the component
          return { resetForm: true };
        } else {
          navigate(`/products`);
          return { resetForm: false };
        }
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      let errorMessage = "Ürün kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.";
      
      // Daha detaylı hata mesajı göster
      if (error?.message) {
        errorMessage = `${errorMessage} (${error.message})`;
      } else if (error?.code) {
        errorMessage = `${errorMessage} (Hata kodu: ${error.code})`;
      }
      
      showError(errorMessage);
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

        // Invalidate products queries to refresh the table
        await queryClient.invalidateQueries({ queryKey: ["products"] });

        showSuccess("Ürün başarıyla kopyalandı", { duration: 1000 });
        if (data) {
          navigate(`/product-form/${data.id}`);
        }
      }
    } catch (error: any) {
      console.error("Error duplicating product:", error);
      let errorMessage = "Ürün kopyalanırken bir hata oluştu. Lütfen tekrar deneyin.";
      
      if (error?.message) {
        errorMessage = `${errorMessage} (${error.message})`;
      }
      
      showError(errorMessage);
    }
  };

  return {
    onSubmit,
    handleDuplicate
  };
};
