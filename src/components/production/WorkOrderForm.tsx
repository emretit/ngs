import React, { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { useNavigate } from "react-router-dom";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton, UnifiedDatePicker } from "@/components/ui/unified-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductSelector from "@/components/proposals/form/ProductSelector";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import { useProduction } from "@/hooks/useProduction";
import { CreateWorkOrderData, WorkOrderStatus, WorkOrderPriority } from "@/types/production";
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
  const [title, setTitle] = useState<string>("");
  const [productId, setProductId] = useState<string>(""); // Opsiyonel olabilir ama UI'da ürün seçimi var
  const [bomId, setBomId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [status, setStatus] = useState<WorkOrderStatus>("draft");
  const [priority, setPriority] = useState<WorkOrderPriority>("medium");
  const [plannedStartDate, setPlannedStartDate] = useState<Date | undefined>(undefined);
  const [plannedEndDate, setPlannedEndDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState<string>("");
  const [assignedTo, setAssignedTo] = useState<string>("");

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

      if (!profile?.company_id) return [];
      
      const { data, error } = await supabase
        .from("boms")
        .select("id, name, product_name")
        
        .order("name");
      
      if (error) {
        logger.error("BOM fetch error:", error);
        return [];
      }
      return data || [];
    },
  });

  // Fetch existing work order if editing
  const { data: existingWorkOrder } = useQuery({
    queryKey: ["work_order", workOrderId],
    queryFn: async () => {
      if (!workOrderId) return null;
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("id", workOrderId)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!workOrderId,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingWorkOrder) {
      setTitle(existingWorkOrder.title);
      setBomId(existingWorkOrder.bom_id || "");
      setQuantity(existingWorkOrder.quantity);
      setStatus(existingWorkOrder.status as WorkOrderStatus);
      setPriority(existingWorkOrder.priority as WorkOrderPriority);
      if (existingWorkOrder.planned_start_date) {
        setPlannedStartDate(new Date(existingWorkOrder.planned_start_date));
      }
      if (existingWorkOrder.planned_end_date) {
        setPlannedEndDate(new Date(existingWorkOrder.planned_end_date));
      }
      setDescription(existingWorkOrder.description || "");
      setAssignedTo(existingWorkOrder.assigned_to || "");
      
      // Ürün ID varsa set et (geriye dönük uyumluluk veya join ile gelecekse)
      // Şimdilik title'dan anlıyoruz
    }
  }, [existingWorkOrder]);

  const handleProductSelect = (name: string, product: any) => {
    // Ürün seçildiğinde başlığı otomatik doldur (eğer boşsa)
    if (!title) {
      setTitle(`${name} Üretimi`);
    }
    
    if (product) {
      setProductId(product.id);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!title) {
      toast.error("Lütfen iş emri başlığı girin");
      return;
    }

    if (quantity <= 0) {
      toast.error("Miktar 0'dan büyük olmalıdır");
      return;
    }

    try {
      const workOrderData: CreateWorkOrderData = {
        title,
        bom_id: bomId || undefined,
        quantity,
        status,
        priority,
        planned_start_date: plannedStartDate 
          ? plannedStartDate.toISOString()
          : undefined,
        planned_end_date: plannedEndDate 
          ? plannedEndDate.toISOString()
          : undefined,
        description: description || undefined,
        assigned_to: assignedTo || undefined,
      };

      await createWorkOrder(workOrderData);
      toast.success(workOrderId ? "İş emri güncellendi" : "İş emri başarıyla oluşturuldu");
      onClose();
      navigate("/production");
    } catch (error: any) {
      logger.error("Error creating work order:", error);
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
            
            {/* Başlık */}
            <div className="space-y-1">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                İş Emri Başlığı *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Masa Üretimi"
                className="h-8"
                required
              />
            </div>

            {/* Ürün Seçimi (Opsiyonel, referans için) */}
            <div className="space-y-1">
              <Label htmlFor="product" className="text-sm font-medium text-gray-700">
                Ürün (Referans)
              </Label>
              <ProductSelector
                value={""} // Kontrollü değil, sadece seçim için
                onChange={handleProductSelect}
                onProductSelect={(product) => handleProductSelect(product.name, product)}
                placeholder="Ürün seçerek başlığı doldur..."
                className="h-8"
              />
            </div>

            {/* Reçete ve Miktar */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">
                  Ürün Reçetesi
                </Label>
                <Select value={bomId} onValueChange={setBomId}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Ürün reçetesi seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Reçetesiz Üretim</SelectItem>
                    {boms.map((bom: any) => (
                      <SelectItem key={bom.id} value={bom.id}>
                        {bom.name} {bom.product_name ? `(${bom.product_name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
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
                  placeholder="Üretim adedi"
                  className="h-8"
                  required
                />
              </div>
            </div>

            {/* Durum, Öncelik ve Personel */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">Durum</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as WorkOrderStatus)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">📝 Taslak</SelectItem>
                    <SelectItem value="planned">📅 Planlandı</SelectItem>
                    <SelectItem value="in_progress">⚙️ Üretimde</SelectItem>
                    <SelectItem value="completed">✔️ Tamamlandı</SelectItem>
                    <SelectItem value="cancelled">❌ İptal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">Öncelik</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as WorkOrderPriority)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Düşük</SelectItem>
                    <SelectItem value="medium">🟡 Orta</SelectItem>
                    <SelectItem value="high">🔴 Yüksek</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">Sorumlu Personel</Label>
                <EmployeeSelector
                  value={assignedTo}
                  onChange={setAssignedTo}
                  placeholder="Personel seçin"
                  className="h-8"
                />
              </div>
            </div>

            {/* Planlanan Tarihler */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <UnifiedDatePicker
                  label="Planlanan Başlangıç"
                  date={plannedStartDate}
                  onSelect={setPlannedStartDate}
                  placeholder="Başlangıç tarihi"
                />
              </div>
              <div className="space-y-1">
                <UnifiedDatePicker
                  label="Planlanan Bitiş"
                  date={plannedEndDate}
                  onSelect={setPlannedEndDate}
                  placeholder="Bitiş tarihi"
                />
              </div>
            </div>

            {/* Açıklama */}
            <div className="space-y-1">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Açıklama
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="İş emri detayları..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </div>

        <UnifiedDialogFooter>
          <UnifiedDialogCancelButton onClick={onClose}>
            İptal
          </UnifiedDialogCancelButton>
          <UnifiedDialogActionButton type="submit" disabled={isLoading}>
            {isLoading ? "Kaydediliyor..." : workOrderId ? "Güncelle" : "Oluştur"}
          </UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </form>
    </UnifiedDialog>
  );
};

export default WorkOrderForm;
