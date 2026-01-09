import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Settings2, AlertCircle, Plus, Loader2, Receipt, Users2, FileCheck, ShoppingCart, ArrowRight, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useApprovalWorkflows } from "@/hooks/useApprovalWorkflows";
import { WorkflowForm } from "@/components/settings/workflows/WorkflowForm";
import { WorkflowCard } from "@/components/settings/workflows/WorkflowCard";
import { ApprovalWorkflow } from "@/types/approval";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LeaveSettingsData {
  id?: string;
  company_id: string;
  requires_approval: boolean;
  approval_model: string;
  default_approver_id?: string;
  exclude_holidays: boolean;
}

interface LeavePoliciesCardProps {
  onSaveReady?: (handleSave: () => void, isSaving: boolean) => void;
}

export const LeavePoliciesCard: React.FC<LeavePoliciesCardProps> = ({ onSaveReady }) => {
  const { userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Use ref to track initial mount
  const isInitialMount = useRef(true);
  
  // Workflow dialog state
  const [showWorkflowForm, setShowWorkflowForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflow | undefined>();
  const { workflows: approvalWorkflows, isLoading: isLoadingWorkflows } = useApprovalWorkflows();

  const [formData, setFormData] = useState<LeaveSettingsData>({
    company_id: userData?.company_id || "",
    requires_approval: true,
    approval_model: "single_manager",
    exclude_holidays: false,
  });

  // Fetch existing settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["leave-settings", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return null;
      
      const { data, error } = await supabase
        .from("leave_settings")
        .select("*")
        .eq("company_id", userData.company_id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userData?.company_id,
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData({
        id: settings.id,
        company_id: settings.company_id,
        requires_approval: settings.requires_approval ?? true,
        approval_model: settings.approval_model ?? "single_manager",
        default_approver_id: settings.default_approver_id,
        exclude_holidays: settings.exclude_holidays ?? false,
      });
    }
  }, [settings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: LeaveSettingsData) => {
      if (data.id) {
        // Update existing settings
        const { error } = await supabase
          .from("leave_settings")
          .update({
            requires_approval: data.requires_approval,
            approval_model: data.approval_model,
            default_approver_id: data.default_approver_id || null,
            exclude_holidays: data.exclude_holidays,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase.from("leave_settings").insert({
          company_id: data.company_id,
          requires_approval: data.requires_approval,
          approval_model: data.approval_model,
          default_approver_id: data.default_approver_id || null,
          exclude_holidays: data.exclude_holidays,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-settings"] });
      toast.success("İzin ayarları başarıyla kaydedildi");
    },
    onError: (error: any) => {
      console.error("Error saving leave settings:", error);
      toast.error("Ayarlar kaydedilirken hata oluştu: " + error.message);
    },
  });

  // Use ref to store formData for save function to avoid stale closure
  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  
  const handleSave = useCallback(() => {
    if (!userData?.company_id) {
      toast.error("Şirket bilgisi bulunamadı");
      return;
    }
    saveMutation.mutate(formDataRef.current);
  }, [userData?.company_id, saveMutation]);

  const handleChange = useCallback((field: keyof LeaveSettingsData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);
  
  const handleEditWorkflow = (workflow: ApprovalWorkflow) => {
    setEditingWorkflow(workflow);
    setShowWorkflowForm(true);
  };

  const handleCloseWorkflowForm = () => {
    setShowWorkflowForm(false);
    setEditingWorkflow(undefined);
  };

  // Expose handleSave to parent via callback - use ref to prevent infinite loop
  const onSaveReadyRef = useRef(onSaveReady);
  onSaveReadyRef.current = onSaveReady;
  const isPendingRef = useRef(saveMutation.isPending);
  
  React.useEffect(() => {
    // Only call if pending state changed or on mount
    if (isPendingRef.current !== saveMutation.isPending || isInitialMount.current) {
      isPendingRef.current = saveMutation.isPending;
      if (onSaveReadyRef.current) {
        onSaveReadyRef.current(handleSave, saveMutation.isPending);
      }
    }
    isInitialMount.current = false;
  }, [saveMutation.isPending, handleSave]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <CardTitle className="text-lg">İzin Politikaları</CardTitle>
        </div>
        <CardDescription className="text-xs">
          İzin taleplerinin onay süreçleri ve kuralları
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* İki Sütunlu Grid Yapısı */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Sol Sütun */}
          <div className="space-y-3">
            {/* Onay Gerekliliği */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="space-y-0.5 flex-1">
                <Label className="text-sm font-semibold">Onay Gerekli</Label>
                <p className="text-xs text-muted-foreground">
                  İzin talepleri için onay süreci zorunlu olsun mu?
                </p>
              </div>
              <Switch
                checked={formData.requires_approval}
                onCheckedChange={(checked) => handleChange("requires_approval", checked)}
              />
            </div>

            {formData.requires_approval && (
              <>
                {/* Onay Modeli */}
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-sm font-semibold">Onay Modeli</Label>
                  <Select
                    value={formData.approval_model}
                    onValueChange={(value) => handleChange("approval_model", value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Onay modeli seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_manager">Tek Yönetici</SelectItem>
                      <SelectItem value="hierarchical">Hiyerarşik</SelectItem>
                      <SelectItem value="department_head">Departman Başkanı</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {formData.approval_model === "single_manager" &&
                      "Sadece doğrudan yönetici onaylar"}
                    {formData.approval_model === "hierarchical" &&
                      "Hiyerarşik sırayla birden fazla onay gerekir"}
                    {formData.approval_model === "department_head" &&
                      "Departman başkanı onaylar"}
                  </p>
                </div>

              </>
            )}
          </div>

          {/* Sağ Sütun */}
          <div className="space-y-3">
            {/* Tatil Günleri */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="space-y-0.5 flex-1">
                <Label className="text-sm font-semibold">Resmi Tatilleri Hariç Tut</Label>
                <p className="text-xs text-muted-foreground">
                  İzin hesaplamasında resmi tatiller sayılmasın
                </p>
              </div>
              <Switch
                checked={formData.exclude_holidays}
                onCheckedChange={(checked) => handleChange("exclude_holidays", checked)}
              />
            </div>
          </div>
        </div>

        {/* Info Alert - Tam Genişlik */}
        <Alert className="border-blue-200 bg-blue-50 py-2">
          <AlertCircle className="h-3.5 w-3.5 text-blue-600" />
          <AlertDescription className="text-xs text-blue-800">
            İzin ayarları değişiklikleri yalnızca yeni izin talepleri için geçerli olacaktır.
          </AlertDescription>
        </Alert>

        {/* Onay Süreçleri Bölümü */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold">Onay Süreçleri</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hiyerarşik onay süreçlerini yapılandırın
              </p>
            </div>
            <Button size="sm" onClick={() => setShowWorkflowForm(true)} className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Yeni Süreç
            </Button>
          </div>

          {/* Quick Links */}
          <div className="mb-3">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Hızlı Erişim</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                {
                  title: "Harcama",
                  icon: Receipt,
                  path: "/expense-requests",
                  color: "bg-amber-50 text-amber-600 border-amber-200",
                },
                {
                  title: "Organizasyon",
                  icon: Users2,
                  path: "/organization-chart",
                  color: "bg-blue-50 text-blue-600 border-blue-200",
                },
                {
                  title: "Bekleyen",
                  icon: FileCheck,
                  path: "/dashboard",
                  color: "bg-purple-50 text-purple-600 border-purple-200",
                },
                {
                  title: "Satın Alma",
                  icon: ShoppingCart,
                  path: "/purchasing/requests",
                  color: "bg-green-50 text-green-600 border-green-200",
                },
                {
                  title: "İzinler",
                  icon: Calendar,
                  path: "/employees/leaves",
                  color: "bg-teal-50 text-teal-600 border-teal-200",
                },
              ].map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`p-2 rounded-lg border hover:shadow-sm transition-all text-left group ${link.color}`}
                >
                  <div className="flex items-center gap-2">
                    <link.icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="text-xs font-medium truncate">{link.title}</span>
                    <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Workflows */}
          {isLoadingWorkflows ? (
            <div className="text-center py-6">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : approvalWorkflows && approvalWorkflows.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {approvalWorkflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onEdit={handleEditWorkflow}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-3">
                Henüz onay süreci tanımlanmamış
              </p>
              <Button size="sm" onClick={() => setShowWorkflowForm(true)} className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                İlk Süreci Oluştur
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Workflow Form Dialog */}
      <Dialog open={showWorkflowForm} onOpenChange={handleCloseWorkflowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWorkflow ? "Onay Sürecini Düzenle" : "Yeni Onay Süreci"}
            </DialogTitle>
          </DialogHeader>
          <WorkflowForm
            workflow={editingWorkflow}
            onSuccess={handleCloseWorkflowForm}
            onCancel={handleCloseWorkflowForm}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

