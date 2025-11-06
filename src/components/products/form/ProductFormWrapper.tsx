
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

  const handleSubmit = async (values: any, addAnother = false): Promise<{ resetForm: boolean }> => {
    try {
      // Validate form before submission
      const isValid = await form.trigger(undefined, { shouldFocus: true });
      if (!isValid) {
        showError("Lütfen formdaki hataları düzeltin");
        return { resetForm: false };
      }
      
      // Ensure currency is properly set before submission
      if (!values.currency || values.currency.trim() === "") {
        values.currency = "TRY";
      }
      
      const result = await onSubmit(values, addAnother);
      if (result.resetForm) {
        form.reset();
      }
      return result;
    } catch (error) {
      console.error("Submit error:", error);
      showError("Form işlenirken beklenmeyen bir hata oluştu");
      return { resetForm: false };
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
