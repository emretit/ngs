import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SupplierFormFields from "./SupplierFormFields";
import { SupplierFormData } from "@/types/supplier";

interface SupplierFormContentProps {
  formData: SupplierFormData;
  setFormData: (data: SupplierFormData) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isPending: boolean;
  isEdit: boolean;
  onCancel: () => void;
}

const SupplierFormContent = ({
  formData,
  setFormData,
  handleSubmit,
  isPending,
  isEdit,
  onCancel
}: SupplierFormContentProps) => {
  return (
    <div className="w-full">
      <Card className="w-full bg-gradient-to-br from-background to-muted/20 border-0 shadow-lg">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 sm:space-y-8">
          <SupplierFormFields formData={formData} setFormData={setFormData} />

          <div className="flex justify-end space-x-4 pt-6 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-6 sm:px-8 py-2 sm:py-3"
            >
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={isPending}
              className="px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isPending ? "Kaydediliyor..." : (isEdit ? "Güncelle" : "Kaydet")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SupplierFormContent;
