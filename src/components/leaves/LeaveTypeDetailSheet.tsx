import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface LeaveType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  color?: string;
  rules_count: number;
}

interface LeaveTypeRule {
  id: string;
  leave_type_id: string;
  name: string;
  min_years_of_service?: number;
  max_years_of_service?: number;
  days_entitled: number;
  description?: string;
  priority: number;
}

interface LeaveTypeDetailSheetProps {
  leaveType: LeaveType | null;
  rules: LeaveTypeRule[];
  isOpen: boolean;
  onClose: () => void;
  onAddRule: () => void;
}

const LeaveTypeDetailSheet = ({
  leaveType,
  rules,
  isOpen,
  onClose,
  onAddRule
}: LeaveTypeDetailSheetProps) => {
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<LeaveTypeRule | null>(null);
  const [editRuleData, setEditRuleData] = useState({
    name: "",
    description: "",
    min_years_of_service: "",
    max_years_of_service: "",
    days_entitled: "",
  });

  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      min_years_of_service?: number;
      max_years_of_service?: number;
      days_entitled: number;
      description?: string;
    }) => {
      const updateData = {
        name: data.name,
        min_years_of_service: data.min_years_of_service !== undefined ? data.min_years_of_service : null,
        max_years_of_service: data.max_years_of_service !== undefined ? data.max_years_of_service : null,
        days_entitled: data.days_entitled,
        description: data.description || null,
      };
      
      const { data: result, error } = await supabase
        .from("leave_type_rules")
        .update(updateData)
        .eq("id", data.id)
        .select("*");

      if (error) {
        throw error;
      }
      
      if (!result || result.length === 0) {
        throw new Error("Güncelleme yapılamadı - yetki hatası olabilir");
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-type-rules"] });
      queryClient.invalidateQueries({ queryKey: ["leave-types"] });
      toast.success("Kural başarıyla güncellendi");
      setIsEditDialogOpen(false);
      setSelectedRule(null);
    },
    onError: (error: any) => {
      toast.error("Kural güncellenemedi: " + (error.message || "Bilinmeyen hata"));
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leave_type_rules")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-type-rules"] });
      queryClient.invalidateQueries({ queryKey: ["leave-types"] });
      toast.success("Kural başarıyla silindi");
      setIsDeleteDialogOpen(false);
      setSelectedRule(null);
    },
    onError: (error: any) => {
      toast.error("Kural silinemedi: " + (error.message || "Bilinmeyen hata"));
      setIsDeleteDialogOpen(false);
    },
  });

  const handleEditClick = (rule: LeaveTypeRule) => {
    setSelectedRule(rule);
    setEditRuleData({
      name: rule.name,
      description: rule.description || "",
      min_years_of_service: rule.min_years_of_service !== undefined ? rule.min_years_of_service.toString() : "",
      max_years_of_service: rule.max_years_of_service !== undefined ? rule.max_years_of_service.toString() : "",
      days_entitled: rule.days_entitled.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (rule: LeaveTypeRule) => {
    setSelectedRule(rule);
    setIsDeleteDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!selectedRule) {
      toast.error("Kural seçilmedi");
      return;
    }

    if (!editRuleData.name.trim()) {
      toast.error("Kural adı zorunludur");
      return;
    }

    if (!editRuleData.days_entitled || parseInt(editRuleData.days_entitled) < 0) {
      toast.error("Geçerli bir gün sayısı giriniz");
      return;
    }

    updateRuleMutation.mutate({
      id: selectedRule.id,
      name: editRuleData.name,
      min_years_of_service: editRuleData.min_years_of_service
        ? parseInt(editRuleData.min_years_of_service)
        : undefined,
      max_years_of_service: editRuleData.max_years_of_service
        ? parseInt(editRuleData.max_years_of_service)
        : undefined,
      days_entitled: parseInt(editRuleData.days_entitled),
      description: editRuleData.description || undefined,
    });
  };

  const handleDeleteConfirm = () => {
    if (selectedRule) {
      deleteRuleMutation.mutate(selectedRule.id);
    }
  };

  if (!leaveType) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {leaveType.color && (
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: leaveType.color }}
              />
            )}
            {leaveType.name}
          </SheetTitle>
          <SheetDescription>
            {leaveType.description || "Bu izin türüne ait kuralları görüntüleyin ve yönetin."}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* İzin Türü Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Bilgiler</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Durum:</span>
                <div className="mt-1">
                  <Badge variant={leaveType.is_active ? "default" : "secondary"}>
                    {leaveType.is_active ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Kural Sayısı:</span>
                <div className="mt-1 font-medium">{leaveType.rules_count} kural</div>
              </div>
            </div>
          </div>

          {/* Kurallar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Kurallar</h3>
              <Button size="sm" onClick={onAddRule} className="gap-2">
                <Plus className="h-4 w-4" />
                Yeni Kural
              </Button>
            </div>

            {rules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border rounded-md bg-muted/20">
                <p className="text-sm">Bu izin türü için henüz kural tanımlanmamış.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddRule}
                  className="mt-4 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  İlk Kuralı Ekle
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <Card key={rule.id} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{rule.name}</h4>
                          {rule.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {rule.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            {(rule.min_years_of_service !== undefined || rule.max_years_of_service !== undefined) && (
                              <span className="text-muted-foreground">
                                <strong>Çalışma Süresi:</strong>{" "}
                                {rule.min_years_of_service !== undefined ? `${rule.min_years_of_service}` : "0"}
                                {" - "}
                                {rule.max_years_of_service !== undefined ? `${rule.max_years_of_service}` : "∞"} yıl
                              </span>
                            )}
                            <span className="text-muted-foreground">
                              <strong>Hak:</strong> {rule.days_entitled} gün
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(rule)}>
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(rule)}
                              className="text-red-600"
                            >
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit Rule Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Kuralı Düzenle</DialogTitle>
              <DialogDescription>
                {selectedRule ? `"${selectedRule.name}" kuralını düzenleyin.` : "Kural düzenleme"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-rule-name">
                  Kural Adı <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-rule-name"
                  placeholder="Örn: 1-5 yıl arası, 5-15 yıl arası"
                  value={editRuleData.name}
                  onChange={(e) =>
                    setEditRuleData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-min-years">Minimum Yıl</Label>
                  <Input
                    id="edit-min-years"
                    type="number"
                    min="0"
                    placeholder="Örn: 1"
                    value={editRuleData.min_years_of_service}
                    onChange={(e) =>
                      setEditRuleData((prev) => ({ ...prev, min_years_of_service: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">Boş bırakılırsa sınırsız</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-max-years">Maksimum Yıl</Label>
                  <Input
                    id="edit-max-years"
                    type="number"
                    min="0"
                    placeholder="Örn: 5"
                    value={editRuleData.max_years_of_service}
                    onChange={(e) =>
                      setEditRuleData((prev) => ({ ...prev, max_years_of_service: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">Boş bırakılırsa sınırsız</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-days-entitled">
                  Hak Edilen Gün Sayısı <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-days-entitled"
                  type="number"
                  min="0"
                  placeholder="Örn: 14"
                  value={editRuleData.days_entitled}
                  onChange={(e) =>
                    setEditRuleData((prev) => ({ ...prev, days_entitled: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-rule-description">Açıklama</Label>
                <Textarea
                  id="edit-rule-description"
                  placeholder="Kural açıklaması (opsiyonel)"
                  value={editRuleData.description}
                  onChange={(e) =>
                    setEditRuleData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedRule(null);
                }}
                disabled={updateRuleMutation.isPending}
              >
                İptal
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={updateRuleMutation.isPending}
              >
                {updateRuleMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialogComponent
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Kuralı Sil"
          description={
            selectedRule
              ? `"${selectedRule.name}" kuralını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
              : "Bu kuralı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          }
          confirmText="Sil"
          cancelText="İptal"
          variant="destructive"
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setIsDeleteDialogOpen(false);
            setSelectedRule(null);
          }}
          isLoading={deleteRuleMutation.isPending}
        />
      </SheetContent>
    </Sheet>
  );
};

export default LeaveTypeDetailSheet;
