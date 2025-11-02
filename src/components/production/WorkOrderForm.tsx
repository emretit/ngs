import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton, UnifiedDatePicker } from "@/components/ui/unified-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductSelector from "@/components/proposals/form/ProductSelector";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import { useProduction } from "@/hooks/useProduction";
import { CreateWorkOrderData, WorkOrderStatus } from "@/types/production";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WorkOrderFormProps {
  workOrderId?: string;
  onClose: () => void;
}

const WorkOrderForm: React.FC<WorkOrderFormProps> = ({ workOrderId, onClose }) => {
  const navigate = useNavigate();
  const { createWorkOrder, isLoading } = useProduction();

  // Form state
  const [productId, setProductId] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [bomId, setBomId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>("adet");
  const [status, setStatus] = useState<WorkOrderStatus>("planned");
  const [plannedStartDate, setPlannedStartDate] = useState<Date | undefined>(undefined);
  const [plannedEndDate, setPlannedEndDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState<string>("");

  // Fetch BOMs for selection
  const { data: boms = [] } = useQuery({
    queryKey: ["boms"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      // TODO: boms tablosu hazır olduğunda aktifleştir
      return [];
      
      // const { data, error } = await supabase
      //   .from("boms")
      //   .select("id, name, main_product_id, main_product_name")
      //   .eq("company_id", profile?.company_id)
      //   .eq("is_active", true)
      //   .order("name");
      
      // if (error) throw error;
      // return data || [];
    },
  });

  // Fetch existing work order if editing
  const { data: existingWorkOrder } = useQuery({
    queryKey: ["work_order", workOrderId],
    queryFn: async () => {
      if (!workOrderId) return null;
      // TODO: Implement when table is ready
      return null;
    },
    enabled: !!workOrderId,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingWorkOrder) {
      setProductId(existingWorkOrder.product_id);
      setProductName(existingWorkOrder.product_name);
      setBomId(existingWorkOrder.bom_id || "");
      setQuantity(existingWorkOrder.quantity);
      setUnit(existingWorkOrder.unit);
      setStatus(existingWorkOrder.status);
      if (existingWorkOrder.planned_start_date) {
        setPlannedStartDate(new Date(existingWorkOrder.planned_start_date));
      }
      if (existingWorkOrder.planned_end_date) {
        setPlannedEndDate(new Date(existingWorkOrder.planned_end_date));
      }
      setNotes(existingWorkOrder.notes || "");
    }
  }, [existingWorkOrder]);

  const handleProductSelect = (name: string, product: any) => {
    if (product) {
      setProductId(product.id);
      setProductName(product.name);
      setUnit(product.unit || "adet");
    } else {
      setProductName(name);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!productId || !productName) {
      toast.error("Lütfen ürün seçin");
      return;
    }

    if (quantity <= 0) {
      toast.error("Miktar 0'dan büyük olmalıdır");
      return;
    }

    try {
      const workOrderData: CreateWorkOrderData = {
        bom_id: bomId || undefined,
        product_id: productId,
        product_name: productName,
        quantity,
        unit,
        planned_start_date: plannedStartDate 
          ? plannedStartDate.toISOString().split("T")[0] 
          : undefined,
        planned_end_date: plannedEndDate 
          ? plannedEndDate.toISOString().split("T")[0] 
          : undefined,
        notes: notes || undefined,
      };

      await createWorkOrder(workOrderData);
      toast.success("İş emri başarıyla oluşturuldu");
      onClose();
      navigate("/production");
    } catch (error: any) {
      console.error("Error creating work order:", error);
      toast.error(error.message || "İş emri oluşturulurken hata oluştu");
    }
  };

  return (
    <UnifiedDialog
      isOpen={true}
      onClose={onClose}
      title={workOrderId ? "İş Emri Düzenle" : "Yeni İş Emri"}
      maxWidth="lg"
      headerColor="purple"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto scrollbar-hide pr-1 -mr-1">
          <div className="space-y-3">
            {/* Ürün ve Ürün Reçetesi */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="product" className="text-sm font-medium text-gray-700">
                  Ürün *
                </Label>
                <ProductSelector
                  value={productName}
                  onChange={handleProductSelect}
                  onProductSelect={(product) => handleProductSelect(product.name, product)}
                  placeholder="Ürün seçin..."
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">
                  Ürün Reçetesi (Opsiyonel)
                </Label>
                <Select value={bomId} onValueChange={setBomId}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Ürün reçetesi seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ürün Reçetesi Yok</SelectItem>
                    {boms.map((bom: any) => (
                      <SelectItem key={bom.id} value={bom.id}>
                        {bom.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Miktar, Birim ve Durum */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                  Miktar *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity || ""}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min="0.01"
                  step="0.01"
                  placeholder="Miktar"
                  className="h-8"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="unit" className="text-sm font-medium text-gray-700">
                  Birim *
                </Label>
                <Input
                  id="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="adet"
                  className="h-8"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">Durum</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as WorkOrderStatus)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">📅 Planlandı</SelectItem>
                    <SelectItem value="in_progress">⚙️ Üretimde</SelectItem>
                    <SelectItem value="completed">✔️ Tamamlandı</SelectItem>
                    <SelectItem value="cancelled">❌ İptal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Planlanan Tarihler */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <UnifiedDatePicker
                  label="Planlanan Başlangıç Tarihi"
                  date={plannedStartDate}
                  onSelect={setPlannedStartDate}
                  placeholder="Başlangıç tarihi"
                />
              </div>
              <div className="space-y-1">
                <UnifiedDatePicker
                  label="Planlanan Bitiş Tarihi"
                  date={plannedEndDate}
                  onSelect={setPlannedEndDate}
                  placeholder="Bitiş tarihi"
                />
              </div>
            </div>

            {/* Notlar */}
            <div className="space-y-1">
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Notlar
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="İş emri notlarını girin"
                rows={2}
                className="resize-none h-8"
              />
            </div>
          </div>
        </div>

        <UnifiedDialogFooter>
          <UnifiedDialogCancelButton onClick={onClose}>
            İptal
          </UnifiedDialogCancelButton>
          <UnifiedDialogActionButton onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Oluşturuluyor..." : workOrderId ? "Güncelle" : "Oluştur"}
          </UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </form>
    </UnifiedDialog>
  );
};

export default WorkOrderForm;

