
import { Card } from "@/components/ui/card";
import { useProductForm } from "./hooks/useProductForm";
import { useProductFormActions } from "./hooks/useProductFormActions";
import ProductFormHeader from "./ProductFormHeader";
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
    console.log("Form submission handler called with values:", values);
    try {
      // Validate form before submission
      const isValid = await form.trigger();
      if (!isValid) {
        const errorKeys = Object.keys(form.formState.errors);
        if (errorKeys.length > 0) {
          showError("Lütfen formdaki hataları düzeltin");
          // More detailed error display in console
          const errorMessages = errorKeys.map(key => `${key}: ${form.formState.errors[key]?.message}`);
          console.error("Form validation errors:", errorMessages);
          return { resetForm: false };
        }
      }
      
      // Ensure currency is properly set before submission
      if (!values.currency || values.currency.trim() === "") {
        values.currency = "TRY"; // Default to TRY if no currency is specified
      }
      
      const result = await onSubmit(values, addAnother);
      if (result.resetForm) {
        console.log("Resetting form after successful submission");
        form.reset();
      }
      return result;
    } catch (error) {
      console.error("Error in form submission handler:", error);
      showError("Form işlenirken beklenmeyen bir hata oluştu");
      return { resetForm: false };
    }
  };

  console.log("Current form state:", { 
    isEditing, 
    productId, 
    isSubmitting, 
    values: form.getValues(),
    errors: form.formState.errors
  });

  return (
    <div className="w-full">
      <ProductFormHeader 
        isEditing={isEditing}
        isSubmitting={isSubmitting}
        productId={productId}
        form={form}
        onSubmit={handleSubmit}
        onDuplicate={handleDuplicate}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => handleSubmit(values, false))}>
          <ProductCompactForm form={form} />
        </form>
      </Form>
    </div>
  );
};

export default ProductFormWrapper;
