
import { Card } from "@/components/ui/card";
import { useProductForm } from "./hooks/useProductForm";
import { useProductFormActions } from "./hooks/useProductFormActions";
import ProductCompactForm from "./ProductCompactForm";
import { Form } from "@/components/ui/form";
import { useEffect, useCallback } from "react";
import { showError, showWarning } from "@/utils/toastUtils";

interface ProductFormWrapperProps {
  onFormReady?: (submitFn: () => void, isSubmitting: boolean) => void;
}

const ProductFormWrapper = ({ onFormReady }: ProductFormWrapperProps) => {
  const { form, isEditing, isSubmitting, setIsSubmitting, productId } = useProductForm();
  const { onSubmit, handleDuplicate } = useProductFormActions(
    isEditing, 
    productId, 
    setIsSubmitting
  );

  // Watch for form errors and display them via toast
  useEffect(() => {
    const subscription = form.watch(() => {
      if (Object.keys(form.formState.errors).length > 0) {
        // Only log errors to console, not display toast on every keystroke
        console.log("Form has errors:", form.formState.errors);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = useCallback(async (values: any, addAnother = false): Promise<{ resetForm: boolean }> => {
    // Ensure currency is properly set before submission
    // TL -> TRY dönüşümü (veritabanı için)
    if (!values.currency || values.currency.trim() === "") {
      values.currency = "TL";
    }
    // Görüntülemede TL kullanıyoruz, veritabanına TRY olarak kaydediyoruz
    if (values.currency === "TL") {
      values.currency = "TRY";
    }
    
    try {
      const result = await onSubmit(values, addAnother);
      if (result?.resetForm) {
        form.reset();
      }
      return result || { resetForm: false };
    } catch (error) {
      console.error("Submit error:", error);
      // Error handling zaten onSubmit içinde yapılıyor
      return { resetForm: false };
    }
  }, [form, onSubmit]);

  // Expose submit function to parent component
  useEffect(() => {
    if (onFormReady) {
      const submitForm = async () => {
        const isValid = await form.trigger();
        if (isValid) {
          form.handleSubmit(async (values) => {
            await handleSubmit(values, false);
          })();
        }
      };
      onFormReady(submitForm, isSubmitting);
    }
  }, [form, isSubmitting, onFormReady, handleSubmit]);


  return (
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
  );
};

export default ProductFormWrapper;
