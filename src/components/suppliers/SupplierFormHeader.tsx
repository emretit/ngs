
import { Truck, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";

interface SupplierFormHeaderProps {
  id?: string;
  isPending?: boolean;
  onSubmit?: () => void;
  onCancel?: () => void;
}

const SupplierFormHeader = ({ id, isPending, onSubmit, onCancel }: SupplierFormHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-6">
      <div className="flex items-center justify-between p-3 pl-12">
        <div className="flex items-center gap-3">
          <BackButton
            onClick={() => navigate("/suppliers")}
            variant="ghost"
            size="sm"
          >
            Tedarikçiler
          </BackButton>

          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                {id ? "Tedarikçiyi Düzenle" : "Yeni Tedarikçi Ekle"}
              </h1>
              <p className="text-xs text-muted-foreground/70">
                {id ? "Tedarikçi bilgilerini güncelleyin" : "Hızlı ve kolay tedarikçi kaydı"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            type="button"
            onClick={onCancel || (() => navigate("/suppliers"))}
            disabled={isPending}
            className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50/50 hover:text-gray-700 hover:border-gray-200 transition-all duration-200 hover:shadow-sm"
          >
            <span className="font-medium">İptal</span>
          </Button>
          <Button
            type="submit"
            form="supplier-form"
            disabled={isPending}
            onClick={onSubmit}
            className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
          >
            <Save className="h-4 w-4" />
            <span>{isPending ? "Kaydediliyor..." : id ? "Güncelle" : "Kaydet"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SupplierFormHeader;
