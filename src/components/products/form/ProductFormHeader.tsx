
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Plus, Copy } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { ProductFormSchema } from "./ProductFormSchema";
import { useNavigate } from "react-router-dom";

interface ProductFormHeaderProps {
  isEditing: boolean;
  isSubmitting: boolean;
  productId: string | undefined;
  form: UseFormReturn<ProductFormSchema>;
  onSubmit: (values: ProductFormSchema, addAnother: boolean) => Promise<{ resetForm: boolean }>;
  onDuplicate: () => Promise<void>;
}

const ProductFormHeader = ({
  isEditing,
  isSubmitting,
  productId,
  form,
  onSubmit,
  onDuplicate,
}: ProductFormHeaderProps) => {
  const navigate = useNavigate();

  const handleSave = async () => {
    console.log("Save button clicked");
    console.log("Form is valid?", form.formState.isValid);
    console.log("Form errors:", form.formState.errors);
    
    // Trigger validation manually
    const isValid = await form.trigger();
    if (!isValid) {
      console.log("Form validation failed:", form.formState.errors);
      return;
    }
    
    return form.handleSubmit((values) => {
      console.log("Form submitted with values:", values);
      return onSubmit(values, false);
    })();
  };

  const handleSaveAndNew = async () => {
    console.log("Save and Add New button clicked");
    
    // Trigger validation manually
    const isValid = await form.trigger();
    if (!isValid) {
      console.log("Form validation failed:", form.formState.errors);
      return;
    }
    
    return form.handleSubmit((values) => onSubmit(values, true))();
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(productId ? `/product-details/${productId}` : "/products")}
          className="h-10 w-10 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-primary-dark">
          {isEditing ? "Ürünü Düzenle" : "Yeni Ürün"}
        </h1>
      </div>
      
      <div className="flex space-x-3">
        {isEditing && (
          <Button variant="outline" onClick={onDuplicate} className="font-medium" disabled={isSubmitting}>
            <Copy className="h-4 w-4 mr-2" />
            Ürünü Kopyala
          </Button>
        )}
        <Button 
          onClick={handleSaveAndNew}
          variant="secondary"
          disabled={isSubmitting}
          className="font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          Kaydet ve Yeni Ekle
        </Button>
        <Button 
          onClick={handleSave}
          disabled={isSubmitting}
          className="font-medium"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? "Kaydediliyor..." : isEditing ? "Güncelle" : "Kaydet"}
        </Button>
      </div>
    </div>
  );
};

export default ProductFormHeader;
