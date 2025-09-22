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
      <Card className="w-full bg-white border border-border/50 shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <SupplierFormFields formData={formData} setFormData={setFormData} />

          <div className="flex justify-end space-x-3 pt-6 border-t border-border/30">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-6 py-2 h-10 text-sm"
            >
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={isPending}
              className="px-6 py-2 h-10 text-sm bg-primary hover:bg-primary/90"
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
