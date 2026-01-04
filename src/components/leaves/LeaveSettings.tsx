import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Settings2, AlertCircle, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LeaveTypesManagement } from "@/components/settings/leaves/LeaveTypesManagement";

interface LeaveSettingsData {
  id?: string;
  tenant_id: string;
  requires_approval: boolean;
  approval_model: string;
  default_approver_id?: string;
  employee_cannot_approve_own: boolean;
  max_concurrent_leaves_per_department?: number;
  rejection_reason_required: boolean;
  exclude_holidays: boolean;
}

interface LeaveSettingsProps {
  onSaveReady?: (handleSave: () => void, isSaving: boolean) => void;
}

const LeaveSettings: React.FC<LeaveSettingsProps> = ({ onSaveReady }) => {
  const { userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSettingsTab, setActiveSettingsTab] = useState(() => 
    searchParams.get("settingsTab") || "policies"
  );

  // Update settings tab when URL changes
  useEffect(() => {
    const settingsTab = searchParams.get("settingsTab") || "policies";
    setActiveSettingsTab(settingsTab);
  }, [searchParams]);

  // Update URL when settings tab changes
  const handleSettingsTabChange = (value: string) => {
    setActiveSettingsTab(value);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("settingsTab", value);
    setSearchParams(newParams);
  };

  const [formData, setFormData] = useState<LeaveSettingsData>({
    tenant_id: userData?.company_id || "",
    requires_approval: true,
    approval_model: "single_manager",
    employee_cannot_approve_own: true,
    rejection_reason_required: true,
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
        .eq("tenant_id", userData.company_id)
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
        tenant_id: settings.tenant_id,
        requires_approval: settings.requires_approval ?? true,
        approval_model: settings.approval_model ?? "single_manager",
        default_approver_id: settings.default_approver_id,
        employee_cannot_approve_own: settings.employee_cannot_approve_own ?? true,
        max_concurrent_leaves_per_department: settings.max_concurrent_leaves_per_department,
        rejection_reason_required: settings.rejection_reason_required ?? true,
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
            employee_cannot_approve_own: data.employee_cannot_approve_own,
            max_concurrent_leaves_per_department: data.max_concurrent_leaves_per_department || null,
            rejection_reason_required: data.rejection_reason_required,
            exclude_holidays: data.exclude_holidays,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase.from("leave_settings").insert({
          tenant_id: data.tenant_id,
          requires_approval: data.requires_approval,
          approval_model: data.approval_model,
          default_approver_id: data.default_approver_id || null,
          employee_cannot_approve_own: data.employee_cannot_approve_own,
          max_concurrent_leaves_per_department: data.max_concurrent_leaves_per_department || null,
          rejection_reason_required: data.rejection_reason_required,
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

  const handleSave = useCallback(() => {
    if (!userData?.company_id) {
      toast.error("Şirket bilgisi bulunamadı");
      return;
    }
    saveMutation.mutate(formData);
  }, [userData?.company_id, saveMutation, formData]);

  const handleChange = (field: keyof LeaveSettingsData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Expose handleSave to parent via callback
  React.useEffect(() => {
    if (onSaveReady) {
      onSaveReady(handleSave, saveMutation.isPending);
    }
  }, [onSaveReady, saveMutation.isPending, handleSave]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeSettingsTab} onValueChange={handleSettingsTabChange} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Politikalar
          </TabsTrigger>
          <TabsTrigger value="leave-types" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            İzin Türleri
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Politikalar (Mevcut içerik) */}
        <TabsContent value="policies" className="space-y-6">

      {/* Onay Süreci Ayarları */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            <CardTitle>Onay Süreci</CardTitle>
          </div>
          <CardDescription>
            İzin taleplerinin nasıl onaylanacağını belirleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Onay Gerekliliği */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Onay Gerekli</Label>
              <p className="text-sm text-muted-foreground">
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
              <Separator />

              {/* Onay Modeli */}
              <div className="space-y-2">
                <Label>Onay Modeli</Label>
                <Select
                  value={formData.approval_model}
                  onValueChange={(value) => handleChange("approval_model", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Onay modeli seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_manager">Tek Yönetici</SelectItem>
                    <SelectItem value="hierarchical">Hiyerarşik</SelectItem>
                    <SelectItem value="department_head">Departman Başkanı</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {formData.approval_model === "single_manager" &&
                    "Sadece doğrudan yönetici onaylar"}
                  {formData.approval_model === "hierarchical" &&
                    "Hiyerarşik sırayla birden fazla onay gerekir"}
                  {formData.approval_model === "department_head" &&
                    "Departman başkanı onaylar"}
                </p>
              </div>

              {/* Çalışan Kendi Talebini Onaylamaz */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Çalışan Kendi Talebini Onaylayamaz</Label>
                  <p className="text-sm text-muted-foreground">
                    Yönetici konumundaki çalışanlar kendi izin taleplerini onaylayamasın
                  </p>
                </div>
                <Switch
                  checked={formData.employee_cannot_approve_own}
                  onCheckedChange={(checked) =>
                    handleChange("employee_cannot_approve_own", checked)
                  }
                />
              </div>

              {/* Red Nedeni Zorunlu */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Red Nedeni Zorunlu</Label>
                  <p className="text-sm text-muted-foreground">
                    İzin talebi reddedilirken neden belirtilmesi zorunlu olsun
                  </p>
                </div>
                <Switch
                  checked={formData.rejection_reason_required}
                  onCheckedChange={(checked) =>
                    handleChange("rejection_reason_required", checked)
                  }
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Departman Kotası */}
      <Card>
        <CardHeader>
          <CardTitle>Departman İzin Kotası</CardTitle>
          <CardDescription>
            Aynı anda izinde olabilecek maksimum çalışan sayısı
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max_concurrent">
              Departman Başına Maksimum Eşzamanlı İzin
            </Label>
            <Input
              id="max_concurrent"
              type="number"
              min="0"
              placeholder="Sınırsız (boş bırak)"
              value={formData.max_concurrent_leaves_per_department || ""}
              onChange={(e) =>
                handleChange(
                  "max_concurrent_leaves_per_department",
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
            />
            <p className="text-sm text-muted-foreground">
              Boş bırakılırsa sınırsız izin alınabilir
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tatil Günleri */}
      <Card>
        <CardHeader>
          <CardTitle>Tatil Günleri Hesaplaması</CardTitle>
          <CardDescription>
            İzin günlerinin hesaplanmasında tatil günleri dahil edilsin mi?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Resmi Tatilleri Hariç Tut</Label>
              <p className="text-sm text-muted-foreground">
                İzin hesaplamasında resmi tatiller sayılmasın
              </p>
            </div>
            <Switch
              checked={formData.exclude_holidays}
              onCheckedChange={(checked) => handleChange("exclude_holidays", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          İzin ayarları değişiklikleri yalnızca yeni izin talepleri için geçerli olacaktır.
          Mevcut bekleyen izin talepleri eski kurallara göre işlenecektir.
        </AlertDescription>
      </Alert>
        </TabsContent>

        {/* Tab 2: İzin Türleri */}
        <TabsContent value="leave-types" className="space-y-6">
          <LeaveTypesManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeaveSettings;
