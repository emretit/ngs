
import { Card } from "@/components/ui/card";
import { useProductForm } from "./hooks/useProductForm";
import { useProductFormActions } from "./hooks/useProductFormActions";
import ProductCompactForm from "./ProductCompactForm";
import { Form } from "@/components/ui/form";
import { useEffect } from "react";
import { showError, showWarning } from "@/utils/toastUtils";

const ProductFormWrapper = () => {
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

  const handleSubmit = async (values: any, addAnother = false) => {
    console.group("[ProductFormWrapper] Form submit");
    console.log("isEditing:", isEditing, "productId:", productId);
    console.log("Incoming values:", values);
    try {
      // Validate form before submission
      const isValid = await form.trigger(undefined, { shouldFocus: true });
      if (!isValid) {
        const errors = form.formState.errors as Record<string, any>;
        const errorEntries = Object.entries(errors).map(([key, value]) => ({ field: key, message: value?.message }));
        showError("Lütfen formdaki hataları düzeltin");
        console.group("[ProductFormWrapper] Validation errors");
        console.table(errorEntries);
        console.log("Raw errors:", errors);
        console.groupEnd();
        return { resetForm: false };
      }
      
      // Ensure currency is properly set before submission
      if (!values.currency || values.currency.trim() === "") {
        values.currency = "TRY"; // Default to TRY if no currency is specified
      }
      
      console.log("Submitting to actions. addAnother:", addAnother);
      const result = await onSubmit(values, addAnother);
      console.log("Action result:", result);
      if (result.resetForm) {
        console.log("Resetting form after successful submission");
        form.reset();
      }
      return result;
    } catch (error) {
      console.error("[ProductFormWrapper] Submit handler error:", error);
      showError("Form işlenirken beklenmeyen bir hata oluştu");
      return { resetForm: false };
    }
    finally {
      console.groupEnd();
    }
  };


  return (
    <div className="w-full">
      <Form {...form}>
        <form id="product-form" noValidate onSubmit={form.handleSubmit((values) => handleSubmit(values, false))}>
          <ProductCompactForm 
            form={form} 
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isEditing={isEditing}
            productId={productId}
            onDuplicate={handleDuplicate}
          />
        </form>
      </Form>
    </div>
  );
};

export default ProductFormWrapper;
