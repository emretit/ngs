import { useState } from "react";
import { logger } from '@/utils/logger';
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreHorizontal, Loader2 } from "lucide-react";
import LeaveTypeDetailSheet from "@/components/leaves/LeaveTypeDetailSheet";
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

export const LeaveTypesManagement = () => {
  const { userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateLeaveTypeDialogOpen, setIsCreateLeaveTypeDialogOpen] = useState(false);
  const [isCreateRuleDialogOpen, setIsCreateRuleDialogOpen] = useState(false);
  const [isLeaveTypeDetailSheetOpen, setIsLeaveTypeDetailSheetOpen] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [leaveTypeToDelete, setLeaveTypeToDelete] = useState<LeaveType | null>(null);
  const [newLeaveTypeData, setNewLeaveTypeData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    is_active: true,
  });
  const [newRuleData, setNewRuleData] = useState({
    name: "",
    description: "",
    min_years_of_service: "",
    max_years_of_service: "",
    days_entitled: "",
  });

  // Fetch leave types with rule counts
  const { data: leaveTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ["leave-types", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];

      const { data: types, error: typesError } = await supabase
        .from("leave_types")
        .select("*")
        .eq("company_id", userData.company_id)
        .order("created_at", { ascending: false });

      if (typesError) throw typesError;

      // Get rule counts for each type
      const typesWithCounts = await Promise.all(
        (types || []).map(async (type) => {
          const { count, error: countError } = await supabase
            .from("leave_type_rules")
            .select("*", { count: "exact", head: true })
            .eq("leave_type_id", type.id);

          if (countError) {
            logger.error("Error counting rules:", countError);
            return { ...type, rules_count: 0 };
          }

          return { ...type, rules_count: count || 0 };
        })
      );

      return typesWithCounts as LeaveType[];
    },
    enabled: !!userData?.company_id,
  });

  // Fetch rules for selected leave type
  const { data: selectedLeaveTypeRules = [] } = useQuery({
    queryKey: ["leave-type-rules", selectedLeaveType?.id],
    queryFn: async () => {
      if (!selectedLeaveType?.id) return [];

      const { data, error } = await supabase
        .from("leave_type_rules")
        .select("*")
        .eq("leave_type_id", selectedLeaveType.id)
        .order("priority", { ascending: true });

      if (error) throw error;
      return data as LeaveTypeRule[];
    },
    enabled: !!selectedLeaveType?.id,
  });

  // Create leave type mutation
  const createLeaveTypeMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; color?: string; is_active: boolean }) => {
      if (!userData?.company_id) throw new Error("Company not found");

      const { data: newType, error } = await supabase
        .from("leave_types")
        .insert({
          company_id: userData.company_id,
          name: data.name,
          description: data.description || null,
          color: data.color || "#3b82f6",
          is_active: data.is_active,
        })
        .select()
        .single();

      if (error) throw error;
      return newType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-types"] });
      toast.success("İzin türü başarıyla oluşturuldu");
      setIsCreateLeaveTypeDialogOpen(false);
      setNewLeaveTypeData({ name: "", description: "", color: "#3b82f6", is_active: true });
    },
    onError: (error: any) => {
      toast.error("İzin türü oluşturulamadı: " + (error.message || "Bilinmeyen hata"));
    },
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (data: {
      leave_type_id: string;
      name: string;
      min_years_of_service?: number;
      max_years_of_service?: number;
      days_entitled: number;
      description?: string;
      priority: number;
    }) => {
      if (!userData?.company_id) throw new Error("Company not found");

      const { data: newRule, error } = await supabase
        .from("leave_type_rules")
        .insert({
          company_id: userData.company_id,
          leave_type_id: data.leave_type_id,
          name: data.name,
          min_years_of_service: data.min_years_of_service || null,
          max_years_of_service: data.max_years_of_service || null,
          days_entitled: data.days_entitled,
          description: data.description || null,
          priority: data.priority,
        })
        .select()
        .single();

      if (error) throw error;
      return newRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-type-rules"] });
      queryClient.invalidateQueries({ queryKey: ["leave-types"] });
      toast.success("Kural başarıyla oluşturuldu");
      setIsCreateRuleDialogOpen(false);
      setNewRuleData({
        name: "",
        description: "",
        min_years_of_service: "",
        max_years_of_service: "",
        days_entitled: "",
      });
    },
    onError: (error: any) => {
      toast.error("Kural oluşturulamadı: " + (error.message || "Bilinmeyen hata"));
    },
  });

  // Delete leave type mutation
  const deleteLeaveTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leave_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-types"] });
      toast.success("İzin türü silindi");
      setIsDeleteDialogOpen(false);
      setLeaveTypeToDelete(null);
    },
    onError: (error: any) => {
      toast.error("İzin türü silinemedi: " + (error.message || "Bilinmeyen hata"));
      setIsDeleteDialogOpen(false);
      setLeaveTypeToDelete(null);
    },
  });

  const handleDeleteClick = (leaveType: LeaveType) => {
    setLeaveTypeToDelete(leaveType);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (leaveTypeToDelete) {
      deleteLeaveTypeMutation.mutate(leaveTypeToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setLeaveTypeToDelete(null);
  };

  // Filter leave types by search
  const filteredLeaveTypes = leaveTypes.filter((leaveType) =>
    leaveType.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle leave type click to open detail sheet
  const handleLeaveTypeClick = (leaveType: LeaveType) => {
    setSelectedLeaveType(leaveType);
    setIsLeaveTypeDetailSheetOpen(true);
  };

  // Handle add rule from sheet
  const handleAddRuleFromSheet = () => {
    setIsLeaveTypeDetailSheetOpen(false);
    setIsCreateRuleDialogOpen(true);
  };

  // Handle create new leave type
  const handleCreateLeaveType = () => {
    if (!newLeaveTypeData.name.trim()) {
      toast.error("İzin türü adı zorunludur");
      return;
    }

    createLeaveTypeMutation.mutate(newLeaveTypeData);
  };

  // Handle create new rule
  const handleCreateRule = () => {
    if (!selectedLeaveType) {
      toast.error("İzin türü seçilmedi");
      return;
    }

    if (!newRuleData.name.trim()) {
      toast.error("Kural adı zorunludur");
      return;
    }

    if (!newRuleData.days_entitled || parseInt(newRuleData.days_entitled) < 0) {
      toast.error("Geçerli bir gün sayısı giriniz");
      return;
    }

    // Get current max priority for this leave type
    const maxPriority = selectedLeaveTypeRules.length > 0
      ? Math.max(...selectedLeaveTypeRules.map((r) => r.priority))
      : 0;

    createRuleMutation.mutate({
      leave_type_id: selectedLeaveType.id,
      name: newRuleData.name,
      min_years_of_service: newRuleData.min_years_of_service
        ? parseInt(newRuleData.min_years_of_service)
        : undefined,
      max_years_of_service: newRuleData.max_years_of_service
        ? parseInt(newRuleData.max_years_of_service)
        : undefined,
      days_entitled: parseInt(newRuleData.days_entitled),
      description: newRuleData.description || undefined,
      priority: maxPriority + 1,
    });
  };

  if (isLoadingTypes) {
    return (
      <div className="text-center py-6">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <Button
          size="sm"
          onClick={() => setIsCreateLeaveTypeDialogOpen(true)}
          className="gap-2 ml-auto h-8 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Yeni Tür Ekle
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
        <Input
          placeholder="İzin türü ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white text-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-9 text-xs">İzin Türü</TableHead>
                  <TableHead className="h-9 text-xs">Kurallar</TableHead>
                  <TableHead className="h-9 text-xs">Durum</TableHead>
                  <TableHead className="w-[40px] h-9"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeaveTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-xs">
                      Henüz izin türü tanımlanmamış
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeaveTypes.map((leaveType) => (
                    <TableRow
                      key={leaveType.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleLeaveTypeClick(leaveType)}
                    >
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          {leaveType.color && (
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: leaveType.color }}
                            />
                          )}
                          <span className="text-sm font-medium">{leaveType.name}</span>
                        </div>
                        {leaveType.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {leaveType.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-xs">{leaveType.rules_count} kural</TableCell>
                      <TableCell className="py-2">
                        <Badge variant={leaveType.is_active ? "default" : "secondary"} className="text-xs px-2 py-0">
                          {leaveType.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLeaveTypeClick(leaveType);
                              }}
                            >
                              Detayları Gör
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(leaveType);
                              }}
                            >
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

      {/* Create Leave Type Dialog */}
      <Dialog open={isCreateLeaveTypeDialogOpen} onOpenChange={setIsCreateLeaveTypeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Yeni İzin Türü Ekle</DialogTitle>
            <DialogDescription>
              Yeni bir izin türü oluşturun. Kuralları daha sonra ekleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="leave-type-name">
                İzin Türü Adı <span className="text-red-500">*</span>
              </Label>
              <Input
                id="leave-type-name"
                placeholder="Örn: Yıllık İzin, Mazeret İzni"
                value={newLeaveTypeData.name}
                onChange={(e) =>
                  setNewLeaveTypeData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leave-type-description">Açıklama</Label>
              <Textarea
                id="leave-type-description"
                placeholder="İzin türü açıklaması (opsiyonel)"
                value={newLeaveTypeData.description}
                onChange={(e) =>
                  setNewLeaveTypeData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leave-type-color">Renk</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="leave-type-color"
                  type="color"
                  value={newLeaveTypeData.color}
                  onChange={(e) =>
                    setNewLeaveTypeData((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="h-10 w-20 cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: newLeaveTypeData.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    Listede görünecek renk
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateLeaveTypeDialogOpen(false);
                setNewLeaveTypeData({ name: "", description: "", color: "#3b82f6", is_active: true });
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleCreateLeaveType}
              disabled={createLeaveTypeMutation.isPending}
            >
              {createLeaveTypeMutation.isPending ? "Oluşturuluyor..." : "İzin Türü Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Type Detail Sheet */}
      <LeaveTypeDetailSheet
        leaveType={selectedLeaveType}
        rules={selectedLeaveTypeRules}
        isOpen={isLeaveTypeDetailSheetOpen}
        onClose={() => setIsLeaveTypeDetailSheetOpen(false)}
        onAddRule={handleAddRuleFromSheet}
      />

      {/* Create Rule Dialog */}
      <Dialog open={isCreateRuleDialogOpen} onOpenChange={setIsCreateRuleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedLeaveType && (
                <div className="flex items-center gap-2">
                  {selectedLeaveType.color && (
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedLeaveType.color }}
                    />
                  )}
                  {selectedLeaveType.name} - Yeni Kural Ekle
                </div>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedLeaveType
                ? `${selectedLeaveType.name} izin türü için yeni bir kural tanımlayın.`
                : "Bir izin türü seçin."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name">
                Kural Adı <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rule-name"
                placeholder="Örn: 1-5 yıl arası, 5-15 yıl arası"
                value={newRuleData.name}
                onChange={(e) =>
                  setNewRuleData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-years">Minimum Yıl</Label>
                <Input
                  id="min-years"
                  type="number"
                  min="0"
                  placeholder="Örn: 1"
                  value={newRuleData.min_years_of_service}
                  onChange={(e) =>
                    setNewRuleData((prev) => ({ ...prev, min_years_of_service: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">Boş bırakılırsa sınırsız</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-years">Maksimum Yıl</Label>
                <Input
                  id="max-years"
                  type="number"
                  min="0"
                  placeholder="Örn: 5"
                  value={newRuleData.max_years_of_service}
                  onChange={(e) =>
                    setNewRuleData((prev) => ({ ...prev, max_years_of_service: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">Boş bırakılırsa sınırsız</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="days-entitled">
                Hak Edilen Gün Sayısı <span className="text-red-500">*</span>
              </Label>
              <Input
                id="days-entitled"
                type="number"
                min="0"
                placeholder="Örn: 14"
                value={newRuleData.days_entitled}
                onChange={(e) =>
                  setNewRuleData((prev) => ({ ...prev, days_entitled: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-description">Açıklama</Label>
              <Textarea
                id="rule-description"
                placeholder="Kural açıklaması (opsiyonel)"
                value={newRuleData.description}
                onChange={(e) =>
                  setNewRuleData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateRuleDialogOpen(false);
                setNewRuleData({
                  name: "",
                  description: "",
                  min_years_of_service: "",
                  max_years_of_service: "",
                  days_entitled: "",
                });
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleCreateRule}
              disabled={createRuleMutation.isPending || !selectedLeaveType}
            >
              {createRuleMutation.isPending ? "Oluşturuluyor..." : "Kural Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="İzin Türünü Sil"
        description={
          leaveTypeToDelete
            ? `"${leaveTypeToDelete.name}" izin türünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
            : "Bu izin türünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        }
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={deleteLeaveTypeMutation.isPending}
      />
    </div>
  );
};

