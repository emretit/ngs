
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";
import { Package, Save, Plus, Copy } from "lucide-react";
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
    <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-4">
      <div className="flex items-center justify-between p-2 pl-10">
        <div className="flex items-center gap-3">
          <BackButton 
            onClick={() => navigate(productId ? `/product-details/${productId}` : "/products")}
            variant="ghost"
            size="sm"
          >
            Ürünler
          </BackButton>
          
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-lg font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              {isEditing ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing && (
            <Button 
              variant="outline" 
              onClick={onDuplicate} 
              disabled={isSubmitting}
              size="sm"
              className="gap-1.5 px-3 rounded-lg hover:bg-gray-50 transition-all"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="text-sm">Kopyala</span>
            </Button>
          )}
          <Button 
            onClick={handleSaveAndNew}
            variant="outline"
            disabled={isSubmitting}
            size="sm"
            className="gap-1.5 px-3 rounded-lg hover:bg-gray-50 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-sm">Kaydet ve Yeni</span>
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSubmitting}
            size="sm"
            className="gap-1.5 px-4 rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow transition-all"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="text-sm">{isSubmitting ? "Kaydediliyor..." : isEditing ? "Güncelle" : "Kaydet"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductFormHeader;
