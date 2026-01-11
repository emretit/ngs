import React, { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Factory, Save, MoreHorizontal, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import { useProduction } from "@/hooks/useProduction";
import { CreateWorkOrderData, WorkOrderStatus, WorkOrderPriority } from "@/types/production";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import WorkOrderInfoCard from "@/components/production/cards/WorkOrderInfoCard";
import WorkOrderDetailsCard from "@/components/production/cards/WorkOrderDetailsCard";
import WorkOrderBOMCard from "@/components/production/cards/WorkOrderBOMCard";

interface WorkOrderFormData {
  title: string;
  description?: string;
  bom_id?: string;
  quantity: number;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  planned_start_date?: Date;
  planned_end_date?: Date;
  assigned_to?: string;
}

const NewWorkOrderCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { createWorkOrder, updateWorkOrder, isLoading } = useProduction();
  const [saving, setSaving] = useState(false);
  const isEditMode = !!id;

  const [formData, setFormData] = useState<WorkOrderFormData>({
    title: "",
    description: "",
    bom_id: undefined,
    quantity: 1,
    status: "draft",
    priority: "medium",
    planned_start_date: undefined,
    planned_end_date: undefined,
    assigned_to: undefined,
  });

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
        .select("id, name, product_name, description")
        
        .order("name");
      
      if (error) {
        logger.error("BOM fetch error:", error);
        return [];
      }
      return data || [];
    },
  });

  // Fetch existing work order if editing
  const { data: existingWorkOrder, isLoading: isLoadingWorkOrder } = useQuery({
    queryKey: ["work_order", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!id,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingWorkOrder) {
      setFormData({
        title: existingWorkOrder.title || "",
        description: existingWorkOrder.description || "",
        bom_id: existingWorkOrder.bom_id || undefined,
        quantity: existingWorkOrder.quantity || 1,
        status: (existingWorkOrder.status as WorkOrderStatus) || "draft",
        priority: (existingWorkOrder.priority as WorkOrderPriority) || "medium",
        planned_start_date: existingWorkOrder.planned_start_date 
          ? new Date(existingWorkOrder.planned_start_date)
          : undefined,
        planned_end_date: existingWorkOrder.planned_end_date 
          ? new Date(existingWorkOrder.planned_end_date)
          : undefined,
        assigned_to: existingWorkOrder.assigned_to || undefined,
      });
    }
  }, [existingWorkOrder]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.title.trim()) {
      errors.push("İş emri başlığı gereklidir");
    }
    
    if (formData.quantity <= 0) {
      errors.push("Miktar 0'dan büyük olmalıdır");
    }
    
    return errors;
  };

  const handleSave = async (status?: WorkOrderStatus) => {
    try {
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => toast.error(error));
        return;
      }

      setSaving(true);
      const finalStatus = status || formData.status;

      const workOrderData: CreateWorkOrderData = {
        title: formData.title,
        description: formData.description || undefined,
        bom_id: formData.bom_id || undefined,
        quantity: formData.quantity,
        status: finalStatus,
        priority: formData.priority,
        planned_start_date: formData.planned_start_date 
          ? formData.planned_start_date.toISOString()
          : undefined,
        planned_end_date: formData.planned_end_date 
          ? formData.planned_end_date.toISOString()
          : undefined,
        assigned_to: formData.assigned_to || undefined,
      };

      if (isEditMode && id) {
        await updateWorkOrder({ 
          id, 
          data: workOrderData as any
        });
        // Toast is already shown in the mutation
      } else {
        await createWorkOrder(workOrderData);
        toast.success("İş emri başarıyla oluşturuldu");
      }

      queryClient.invalidateQueries({ queryKey: ["work_orders"] });
      queryClient.invalidateQueries({ queryKey: ["production_stats"] });
      
      navigate("/production");
    } catch (error: any) {
      logger.error("Error saving work order:", error);
      toast.error(error.message || "İş emri kaydedilirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = () => {
    handleSave("draft");
  };

  const handlePreview = () => {
    toast.info("Önizleme özelliği yakında eklenecek");
  };

  if (isLoadingWorkOrder && isEditMode) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">İş emri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-2">
        <div className="flex items-center justify-between p-3 pl-12">
          <div className="flex items-center gap-3">
            <BackButton 
              onClick={() => navigate("/production")}
              variant="ghost"
              size="sm"
            >
              Üretim
            </BackButton>
            
            <div className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  {isEditMode ? "İş Emri Düzenle" : "Yeni İş Emri Oluştur"}
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  Üretim planlaması ve iş emri yönetimi
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSaveDraft}
              disabled={saving || isLoading}
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Kaydediliyor..." : "Kaydet"}</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50/50 hover:text-gray-700 hover:border-gray-200 transition-all duration-200 hover:shadow-sm"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="font-medium">İşlemler</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handlePreview} className="gap-2 cursor-pointer">
                  <Eye className="h-4 w-4 text-slate-500" />
                  <span>Önizle</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Durum</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => handleSave("planned")} 
                  className="gap-2 cursor-pointer"
                >
                  <span>📅 Planlandı Olarak Kaydet</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleSave("in_progress")} 
                  className="gap-2 cursor-pointer"
                >
                  <span>⚙️ Üretimde Olarak Kaydet</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content - Card-based layout */}
      <div className="space-y-4">
        {/* Top Row - Info & Details */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <WorkOrderInfoCard
            formData={formData}
            onFieldChange={handleFieldChange}
            errors={{}}
          />

          <WorkOrderDetailsCard
            formData={formData}
            onFieldChange={handleFieldChange}
            errors={{}}
          />
        </div>

        {/* BOM and Quantity - Full Width */}
        <WorkOrderBOMCard
          formData={formData}
          boms={boms}
          onFieldChange={handleFieldChange}
          errors={{}}
        />
      </div>
    </div>
  );
};

export default NewWorkOrderCreate;
