import React, { useState, useCallback, useEffect } from "react";
import { logger } from '@/utils/logger';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, Save } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Form } from "@/components/ui/form";
import { useProductForm } from "@/components/products/form/hooks/useProductForm";
import { useProductFormActions } from "@/components/products/form/hooks/useProductFormActions";
import ProductCompactForm from "@/components/products/form/ProductCompactForm";
import { showError } from "@/utils/toastUtils";
import { useTabs } from "@/components/tabs/TabContext";

interface ProductFormProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const ProductForm = ({ isCollapsed, setIsCollapsed }: ProductFormProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { updateTabTitle } = useTabs();
  const title = id ? "Ürün Düzenle" : "Yeni Ürün Ekle";
  
  const { form, isEditing, isSubmitting, setIsSubmitting, productId } = useProductForm();
  const { onSubmit, handleDuplicate } = useProductFormActions(
    isEditing, 
    productId, 
    setIsSubmitting
  );
  
  // Watch product name and update tab title
  const productName = form.watch("name");
  
  useEffect(() => {
    if (productName && productName.trim() !== "") {
      updateTabTitle(location.pathname, productName);
    } else if (id) {
      updateTabTitle(location.pathname, "Ürün Düzenle");
    } else {
      updateTabTitle(location.pathname, "Yeni Ürün Ekle");
    }
  }, [productName, id, location.pathname, updateTabTitle]);

  // Watch for form errors and display them via toast
  useEffect(() => {
    const subscription = form.watch(() => {
      if (Object.keys(form.formState.errors).length > 0) {
        // Only log errors to console, not display toast on every keystroke
        logger.debug("Form has errors:", form.formState.errors);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = useCallback(async (values: any, addAnother = false): Promise<{ resetForm: boolean }> => {
    logger.debug("🟢 handleSubmit çağrıldı, values:", values);
    // Ensure currency is properly set before submission
    if (!values.currency || values.currency.trim() === "") {
      values.currency = "TRY";
      logger.debug("🟡 Currency değeri TRY olarak ayarlandı");
    }

    try {
      logger.debug("🟢 onSubmit çağrılıyor...");
      const result = await onSubmit(values, addAnother);
      logger.debug("🟢 onSubmit tamamlandı, sonuç:", result);
      if (result?.resetForm) {
        form.reset();
      }
      return result || { resetForm: false };
    } catch (error) {
      logger.error("❌ Submit error:", error);
      // Error handling zaten onSubmit içinde yapılıyor
      return { resetForm: false };
    }
  }, [form, onSubmit]);

  const handleSaveClick = () => {
    logger.debug("🔵 Kaydet butonuna tıklandı");
    const submitForm = async () => {
      // Ensure status is set based on is_active before validation
      const currentIsActive = form.getValues("is_active");
      const currentStatus = form.getValues("status");
      const currentUnit = form.getValues("unit");

      logger.debug("🔵 Mevcut is_active:", currentIsActive, "status:", currentStatus, "unit:", currentUnit);

      // If status is not set or invalid, set it based on is_active
      if (!currentStatus || !["active", "inactive", "discontinued"].includes(currentStatus)) {
        const newStatus = currentIsActive ? "active" : "inactive";
        logger.debug("🟡 Status geçersiz, yeni değer:", newStatus);
        form.setValue("status", newStatus);
      }

      // If unit is not set or empty, set default value
      if (!currentUnit || currentUnit.trim() === "") {
        logger.debug("🟡 Unit boş, varsayılan değer (piece) ayarlanıyor");
        form.setValue("unit", "piece");
      }

      // company_id form validasyonundan önce null yap (onSubmit'te zaten alınacak)
      const currentCompanyId = form.getValues("company_id");
      if (!currentCompanyId || currentCompanyId.trim() === "") {
        form.setValue("company_id", null, { shouldValidate: false });
      }

      // image_url boş string ise null yap
      const currentImageUrl = form.getValues("image_url");
      if (currentImageUrl === "" || (typeof currentImageUrl === "string" && currentImageUrl.trim() === "")) {
        form.setValue("image_url", null, { shouldValidate: false });
      }

      logger.debug("🔵 Form validasyonu başlatılıyor...");
      const isValid = await form.trigger();
      logger.debug("🔵 Form validasyonu sonucu:", isValid);

      if (!isValid) {
        logger.debug("❌ Form geçersiz, hatalar:", form.formState.errors);
        logger.debug("❌ Status hatası detayı:", form.formState.errors.status);
        logger.debug("❌ Mevcut form değerleri:", form.getValues());
        showError("Lütfen form hatalarını düzeltin");
        return;
      }

      logger.debug("✅ Form geçerli, submit ediliyor...");
      form.handleSubmit(async (values) => {
        logger.debug("🔵 Submit fonksiyonu çağrıldı, values:", values);
        await handleSubmit(values, false);
      })();
    };
    submitForm();
  };
  
  return (
    <div>
      {/* Enhanced Sticky Header */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center justify-between p-3 pl-12">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <Button
              onClick={() => navigate("/products")}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Ürünler
            </Button>
            
            {/* Title Section */}
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  {title}
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  {id ? "Ürün bilgilerini düzenle" : "Yeni ürün ekle"}
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSaveClick}
              disabled={isSubmitting}
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? "Kaydediliyor..." : id ? "Değişiklikleri Kaydet" : "Kaydet"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        <div className="w-full">
          <Form {...form}>
            <form 
              id="product-form" 
              noValidate 
              onSubmit={form.handleSubmit(async (values) => {
                await handleSubmit(values, false);
              })}
            >
              <ProductCompactForm 
                form={form} 
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                isEditing={isEditing}
                productId={productId}
              />
            </form>
          </Form>
        </div>
      </div>
      
      <Toaster />
    </div>
  );
};

export default ProductForm;
