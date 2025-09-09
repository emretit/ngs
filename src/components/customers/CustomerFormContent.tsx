
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CustomerFormFields from "./CustomerFormFields";
import { CustomerFormData } from "@/types/customer";

interface CustomerFormContentProps {
  formData: CustomerFormData;
  setFormData: (data: CustomerFormData) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isPending: boolean;
  isEdit: boolean;
  onCancel: () => void;
}

const CustomerFormContent = ({
  formData,
  setFormData,
  handleSubmit,
  isPending,
  isEdit,
  onCancel
}: CustomerFormContentProps) => {
  return (
    <div className="w-full">
      <Card className="w-full bg-gradient-to-br from-background to-muted/20 border-0 shadow-lg">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 sm:space-y-8">
          <CustomerFormFields formData={formData} setFormData={setFormData} />

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

export default CustomerFormContent;
