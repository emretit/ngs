import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Search, MoreHorizontal, Info, CheckCircle2, User, ArrowRight, Settings as SettingsIcon, X } from "lucide-react";
import { Loader2 } from "lucide-react";
import LeaveTypeDetailSheet from "@/components/leaves/LeaveTypeDetailSheet";

interface LeaveType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  color?: string;
  rules_count: number; // Her izin türüne ait kural sayısı
}

interface LeaveTypeRule {
  id: string;
  leave_type_id: string;
  name: string;
  min_years_of_service?: number; // null = sınırsız
  max_years_of_service?: number; // null = sınırsız
  days_entitled: number;
  description?: string;
  priority: number;
}

interface ApprovalProcess {
  id: string;
  name: string;
  valid_units?: string;
  approvers: Array<{
    id: string;
    name: string;
    avatar?: string;
    order: number;
  }>;
  is_default?: boolean;
}

interface LeaveSettings {
  // Onay Süreci
  requires_approval: boolean;
  approval_model: "single_manager" | "department_manager" | "specific_user";
  default_approver_id?: string | null;
  employee_cannot_approve_own: boolean;

  // Kurallar
  max_concurrent_leaves_per_department: number | null;
  rejection_reason_required: boolean;
  exclude_holidays: boolean;
}

const DEFAULT_SETTINGS: LeaveSettings = {
  requires_approval: true,
  approval_model: "single_manager",
  default_approver_id: null,
  employee_cannot_approve_own: true,
  max_concurrent_leaves_per_department: null,
  rejection_reason_required: true,
  exclude_holidays: false,
};

// Mock data for leave types (İzin Türleri)
const MOCK_LEAVE_TYPES: LeaveType[] = [
  {
    id: "annual",
    name: "Yıllık İzin",
    description: "Yıllık ücretli izin hakları",
    is_active: true,
    color: "#3b82f6",
    rules_count: 3,
  },
  {
    id: "sick",
    name: "Mazeret İzni",
    description: "Mazerete dayalı izinler",
    is_active: true,
    color: "#f59e0b",
    rules_count: 1,
  },
  {
    id: "medical",
    name: "Raporlu İzin",
    description: "Sağlık raporu ile kullanılan izinler",
    is_active: true,
    color: "#ef4444",
    rules_count: 1,
  },
  {
    id: "unpaid",
    name: "Ücretsiz İzin",
    description: "Ücretsiz izinler",
    is_active: true,
    color: "#6b7280",
    rules_count: 1,
  },
  {
    id: "official",
    name: "Resmî İzin",
    description: "Resmi tatiller ve özel günler",
    is_active: true,
    color: "#8b5cf6",
    rules_count: 0,
  },
  {
    id: "other",
    name: "Diğer",
    description: "Diğer izin türleri",
    is_active: true,
    color: "#10b981",
    rules_count: 0,
  },
];

// Mock data for leave type rules (İzin Türü Kuralları)
const MOCK_LEAVE_TYPE_RULES: LeaveTypeRule[] = [
  // Yıllık İzin kuralları
  {
    id: "annual-rule-1",
    leave_type_id: "annual",
    name: "1-5 yıl arası",
    min_years_of_service: 1,
    max_years_of_service: 5,
    days_entitled: 14,
    description: "Türk İş Kanunu'na göre 1-5 yıl arası çalışanlar",
    priority: 1,
  },
  {
    id: "annual-rule-2",
    leave_type_id: "annual",
    name: "5-15 yıl arası",
    min_years_of_service: 5,
    max_years_of_service: 15,
    days_entitled: 20,
    description: "Türk İş Kanunu'na göre 5-15 yıl arası çalışanlar",
    priority: 2,
  },
  {
    id: "annual-rule-3",
    leave_type_id: "annual",
    name: "15 yıl ve üzeri",
    min_years_of_service: 15,
    max_years_of_service: undefined,
    days_entitled: 26,
    description: "Türk İş Kanunu'na göre 15 yıl ve üzeri çalışanlar",
    priority: 3,
  },
  // Mazeret İzni kuralları
  {
    id: "sick-rule-1",
    leave_type_id: "sick",
    name: "Standart Mazeret",
    min_years_of_service: undefined,
    max_years_of_service: undefined,
    days_entitled: 5,
    description: "Tüm çalışanlar için geçerli",
    priority: 1,
  },
  // Raporlu İzin kuralları
  {
    id: "medical-rule-1",
    leave_type_id: "medical",
    name: "Sağlık Raporu",
    min_years_of_service: undefined,
    max_years_of_service: undefined,
    days_entitled: 0,
    description: "Rapor süresi kadar izin kullanılabilir",
    priority: 1,
  },
  // Ücretsiz İzin kuralları
  {
    id: "unpaid-rule-1",
    leave_type_id: "unpaid",
    name: "Standart Ücretsiz",
    min_years_of_service: undefined,
    max_years_of_service: undefined,
    days_entitled: 0,
    description: "Talep edilen süre kadar",
    priority: 1,
  },
];

// Mock data for approval processes
const MOCK_APPROVAL_PROCESSES: ApprovalProcess[] = [
  {
    id: "1",
    name: "Varsayılan Onay Süreci",
    approvers: [
      { id: "manager-1", name: "Yönetici", order: 1 },
    ],
    is_default: true,
  },
  {
    id: "2",
    name: "Ceyhun Burak Akgül İzin Onay Süreci",
    valid_units: "Customer Experience & Process Team +2",
    approvers: [
      { id: "user-1", name: "Ceyhun Burak Akgül", order: 1 },
    ],
  },
  {
    id: "3",
    name: "Avans Talep Onay Süreci",
    approvers: [
      { id: "user-2", name: "Eda Fatma Ünsal", order: 1 },
      { id: "user-3", name: "Sedat Mart Özzehir", order: 2 },
    ],
  },
];

const LeaveSettings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();

  const [settings, setSettings] = useState<LeaveSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateRuleDialogOpen, setIsCreateRuleDialogOpen] = useState(false);
  const [isCreateLeaveTypeDialogOpen, setIsCreateLeaveTypeDialogOpen] = useState(false);
  const [isLeaveTypeDetailSheetOpen, setIsLeaveTypeDetailSheetOpen] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(MOCK_LEAVE_TYPES);
  const [leaveTypeRules, setLeaveTypeRules] = useState<LeaveTypeRule[]>(MOCK_LEAVE_TYPE_RULES);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
  const [newRuleData, setNewRuleData] = useState({
    name: "",
    description: "",
    min_years_of_service: "",
    max_years_of_service: "",
    days_entitled: "",
  });
  const [newLeaveTypeData, setNewLeaveTypeData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    rules: [] as Array<{
      id: string;
      name: string;
      min_years_of_service: string;
      max_years_of_service: string;
      days_entitled: string;
      description: string;
    }>,
  });

  // Fetch settings
  const { isLoading } = useQuery({
    queryKey: ["leave-settings", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        return DEFAULT_SETTINGS;
      }

      try {
        const { data, error } = await supabase
          .from("leave_settings")
          .select("*")
          .eq("tenant_id", userData.company_id)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching leave settings:", error);
          throw error;
        }

        if (data) {
          const parsedSettings: LeaveSettings = {
            requires_approval: data.requires_approval ?? DEFAULT_SETTINGS.requires_approval,
            approval_model: data.approval_model || DEFAULT_SETTINGS.approval_model,
            default_approver_id: data.default_approver_id || null,
            employee_cannot_approve_own: data.employee_cannot_approve_own ?? DEFAULT_SETTINGS.employee_cannot_approve_own,
            max_concurrent_leaves_per_department: data.max_concurrent_leaves_per_department || null,
            rejection_reason_required: data.rejection_reason_required ?? DEFAULT_SETTINGS.rejection_reason_required,
            exclude_holidays: data.exclude_holidays ?? DEFAULT_SETTINGS.exclude_holidays,
          };
          setSettings(parsedSettings);
          return parsedSettings;
        }

        return DEFAULT_SETTINGS;
      } catch (err) {
        console.error("Error in fetch:", err);
        toast.error("Ayarlar yüklenirken hata oluştu");
        return DEFAULT_SETTINGS;
      }
    },
    enabled: !!userData?.company_id,
  });

  // Save settings
  const handleSave = async () => {
    if (!userData?.company_id) {
      toast.error("Şirket bilgisi bulunamadı");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("leave_settings")
        .upsert({
          tenant_id: userData.company_id,
          requires_approval: settings.requires_approval,
          approval_model: settings.approval_model,
          default_approver_id: settings.default_approver_id || null,
          employee_cannot_approve_own: settings.employee_cannot_approve_own,
          max_concurrent_leaves_per_department: settings.max_concurrent_leaves_per_department || null,
          rejection_reason_required: settings.rejection_reason_required,
          exclude_holidays: settings.exclude_holidays,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "tenant_id",
        });

      if (error) {
        console.error("Error saving settings:", error);
        toast.error("Ayarlar kaydedilemedi: " + error.message);
        return;
      }

      toast.success("Ayarlar kaydedildi");
      queryClient.invalidateQueries({ queryKey: ["leave-settings"] });
    } catch (err: any) {
      console.error("Error in save:", err);
      toast.error("Ayarlar kaydedilemedi: " + (err.message || "Bilinmeyen hata"));
    } finally {
      setIsSaving(false);
    }
  };

  // Filter leave types by search
  const filteredLeaveTypes = leaveTypes.filter((leaveType) =>
    leaveType.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter approval processes by search
  const filteredApprovalProcesses = MOCK_APPROVAL_PROCESSES.filter((process) =>
    process.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get rules for selected leave type
  const selectedLeaveTypeRules = selectedLeaveType
    ? leaveTypeRules.filter((rule) => rule.leave_type_id === selectedLeaveType.id).sort((a, b) => a.priority - b.priority)
    : [];

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

  // Add new rule to leave type being created
  const handleAddRuleToNewLeaveType = () => {
    const newRule = {
      id: `temp-rule-${Date.now()}`,
      name: "",
      min_years_of_service: "",
      max_years_of_service: "",
      days_entitled: "",
      description: "",
    };
    setNewLeaveTypeData((prev) => ({
      ...prev,
      rules: [...prev.rules, newRule],
    }));
  };

  // Remove rule from leave type being created
  const handleRemoveRuleFromNewLeaveType = (ruleId: string) => {
    setNewLeaveTypeData((prev) => ({
      ...prev,
      rules: prev.rules.filter((r) => r.id !== ruleId),
    }));
  };

  // Update rule in leave type being created
  const handleUpdateRuleInNewLeaveType = (ruleId: string, field: string, value: string) => {
    setNewLeaveTypeData((prev) => ({
      ...prev,
      rules: prev.rules.map((r) =>
        r.id === ruleId ? { ...r, [field]: value } : r
      ),
    }));
  };

  // Handle create new leave type
  const handleCreateLeaveType = async () => {
    if (!newLeaveTypeData.name.trim()) {
      toast.error("İzin türü adı zorunludur");
      return;
    }

    if (!userData?.company_id) {
      toast.error("Şirket bilgisi bulunamadı");
      return;
    }

    // Validate rules
    for (const rule of newLeaveTypeData.rules) {
      if (!rule.name.trim()) {
        toast.error("Tüm kuralların adı doldurulmalıdır");
        return;
      }
      if (!rule.days_entitled || parseInt(rule.days_entitled) < 0) {
        toast.error("Tüm kurallar için geçerli gün sayısı girilmelidir");
        return;
      }
    }

    try {
      // TODO: Supabase'e kaydet
      // Şimdilik state'e ekle
      const leaveTypeId = `leave-type-${Date.now()}`;
      const newLeaveType: LeaveType = {
        id: leaveTypeId,
        name: newLeaveTypeData.name,
        description: newLeaveTypeData.description || undefined,
        is_active: true,
        color: newLeaveTypeData.color,
        rules_count: newLeaveTypeData.rules.length,
      };

      // Create rules for the new leave type
      const newRules: LeaveTypeRule[] = newLeaveTypeData.rules.map((rule, index) => ({
        id: `rule-${Date.now()}-${index}`,
        leave_type_id: leaveTypeId,
        name: rule.name,
        min_years_of_service: rule.min_years_of_service ? parseInt(rule.min_years_of_service) : undefined,
        max_years_of_service: rule.max_years_of_service ? parseInt(rule.max_years_of_service) : undefined,
        days_entitled: parseInt(rule.days_entitled),
        description: rule.description || undefined,
        priority: index + 1,
      }));

      // State'e ekle (gerçek uygulamada Supabase'e kaydedilecek)
      setLeaveTypes((prev) => [...prev, newLeaveType]);
      setLeaveTypeRules((prev) => [...prev, ...newRules]);

      toast.success("İzin türü ve kuralları başarıyla oluşturuldu");
      setIsCreateLeaveTypeDialogOpen(false);
      setNewLeaveTypeData({
        name: "",
        description: "",
        color: "#3b82f6",
        rules: [],
      });

      // Query'yi yenile
      queryClient.invalidateQueries({ queryKey: ["leave-types"] });
      queryClient.invalidateQueries({ queryKey: ["leave-type-rules"] });
    } catch (error: any) {
      console.error("Error creating leave type:", error);
      toast.error("İzin türü oluşturulamadı: " + (error.message || "Bilinmeyen hata"));
    }
  };

  // Handle create new rule for a leave type
  const handleCreateRule = async () => {
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

    try {
      // TODO: Supabase'e kaydet
      // Şimdilik state'e ekle
      const newRule: LeaveTypeRule = {
        id: `rule-${Date.now()}`,
        leave_type_id: selectedLeaveType.id,
        name: newRuleData.name,
        min_years_of_service: newRuleData.min_years_of_service ? parseInt(newRuleData.min_years_of_service) : undefined,
        max_years_of_service: newRuleData.max_years_of_service ? parseInt(newRuleData.max_years_of_service) : undefined,
        days_entitled: parseInt(newRuleData.days_entitled),
        description: newRuleData.description || undefined,
        priority: selectedLeaveTypeRules.length + 1, // Son sıraya ekle
      };

      // State'e ekle (gerçek uygulamada Supabase'e kaydedilecek)
      setLeaveTypeRules((prev) => [...prev, newRule]);

      // Leave type'ın rules_count'unu güncelle
      setLeaveTypes((prev) =>
        prev.map((lt) =>
          lt.id === selectedLeaveType.id
            ? { ...lt, rules_count: lt.rules_count + 1 }
            : lt
        )
      );

      toast.success("Kural başarıyla oluşturuldu");
      setIsCreateRuleDialogOpen(false);
      setNewRuleData({
        name: "",
        description: "",
        min_years_of_service: "",
        max_years_of_service: "",
        days_entitled: "",
      });

      // Query'yi yenile
      queryClient.invalidateQueries({ queryKey: ["leave-type-rules"] });
    } catch (error: any) {
      console.error("Error creating rule:", error);
      toast.error("Kural oluşturulamadı: " + (error.message || "Bilinmeyen hata"));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/employees/leaves")} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">İzin Kuralları & Onay Süreçleri</h1>
          <p className="text-muted-foreground mt-1">
            İzin türleri, kurallar ve onay akışlarını yönetin.
          </p>
        </div>
      </div>

      {/* Two Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* İzin Türleri Kartı */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  İzin Türleri
                </CardTitle>
                <CardDescription className="mt-1">
                  İzin türlerini tanımlayın ve her bir tür için kurallar belirleyin.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setIsCreateLeaveTypeDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Yeni Tür Ekle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer hover:bg-muted/50">
                      İzin Türü <span className="ml-1">↑</span>
                    </TableHead>
                    <TableHead>Kurallar</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaveTypes.map((leaveType) => (
                    <TableRow
                      key={leaveType.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleLeaveTypeClick(leaveType)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {leaveType.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: leaveType.color }}
                            />
                          )}
                          {leaveType.name}
                        </div>
                        {leaveType.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {leaveType.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{leaveType.rules_count} kural</TableCell>
                      <TableCell>
                        <Badge variant={leaveType.is_active ? "default" : "secondary"} className="text-xs">
                          {leaveType.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
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
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              toast.info("Düzenleme özelliği yakında eklenecek");
                            }}>
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              toast.info("Silme özelliği yakında eklenecek");
                            }}>
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Onay Süreçleri Kartı */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Onay Süreçleri</CardTitle>
                <CardDescription className="mt-1">
                  İzin onay süreçlerini yönetin ve onaylayıcıları yapılandırın.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => toast.info("Yeni onay süreci oluşturma özelliği yakında eklenecek")}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Yeni Süreç
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Ara"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Approval Processes Cards */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredApprovalProcesses.map((process) => (
                <Card key={process.id} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-sm">{process.name}</h3>
                          <Info className="h-3 w-3 text-muted-foreground" />
                          {process.is_default && (
                            <Badge variant="default" className="text-xs">
                              Varsayılan
                            </Badge>
                          )}
                        </div>
                        {process.valid_units && (
                          <p className="text-xs text-muted-foreground mb-3">
                            Geçerli Birimler: {process.valid_units}
                          </p>
                        )}

                        {/* Flow Diagram */}
                        <div className="flex items-center gap-2 mt-3">
                          {/* Employee */}
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-xs text-muted-foreground">Çalışan</span>
                          </div>

                          <ArrowRight className="h-4 w-4 text-muted-foreground" />

                          {/* Approvers */}
                          {process.approvers.map((approver, index) => (
                            <div key={approver.id} className="flex items-center gap-2">
                              <div className="flex flex-col items-center gap-1">
                                <div className="relative">
                                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-500">
                                    {approver.avatar ? (
                                      <img
                                        src={approver.avatar}
                                        alt={approver.name}
                                        className="w-full h-full rounded-full object-cover"
                                      />
                                    ) : (
                                      <User className="h-4 w-4 text-green-600" />
                                    )}
                                  </div>
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                                    {approver.order}
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground max-w-[80px] truncate">
                                  {approver.name}
                                </span>
                              </div>
                              {index < process.approvers.length - 1 && (
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          ))}

                          <ArrowRight className="h-4 w-4 text-muted-foreground" />

                          {/* Approved */}
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xs text-muted-foreground">Onaylandı</span>
                          </div>
                        </div>
                      </div>

                      {/* Options Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.info("Düzenleme özelliği yakında eklenecek")}>
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Silme özelliği yakında eklenecek")}>
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Leave Type Dialog */}
      <Dialog open={isCreateLeaveTypeDialogOpen} onOpenChange={setIsCreateLeaveTypeDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni İzin Türü Ekle</DialogTitle>
            <DialogDescription>
              Yeni bir izin türü oluşturun ve kurallarını tanımlayın.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* İzin Türü Bilgileri */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">İzin Türü Bilgileri</h3>

              {/* İzin Türü Adı */}
              <div className="space-y-2">
                <Label htmlFor="leave-type-name">
                  İzin Türü Adı <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="leave-type-name"
                  placeholder="Örn: Evlilik İzni, Doğum İzni"
                  value={newLeaveTypeData.name}
                  onChange={(e) =>
                    setNewLeaveTypeData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              {/* Açıklama */}
              <div className="space-y-2">
                <Label htmlFor="leave-type-description">Açıklama</Label>
                <Textarea
                  id="leave-type-description"
                  placeholder="İzin türü açıklaması (opsiyonel)"
                  value={newLeaveTypeData.description}
                  onChange={(e) =>
                    setNewLeaveTypeData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={2}
                />
              </div>

              {/* Renk Seçimi */}
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

            {/* Kurallar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Kurallar (Opsiyonel)</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddRuleToNewLeaveType}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Kural Ekle
                </Button>
              </div>

              {newLeaveTypeData.rules.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border rounded-md bg-muted/20">
                  <p className="text-sm">Henüz kural eklenmedi.</p>
                  <p className="text-xs mt-1">Kuralları daha sonra da ekleyebilirsiniz.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {newLeaveTypeData.rules.map((rule, index) => (
                    <Card key={rule.id} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Kural {index + 1}</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveRuleFromNewLeaveType(rule.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Kural Adı */}
                          <div className="space-y-2">
                            <Label htmlFor={`rule-name-${rule.id}`} className="text-xs">
                              Kural Adı <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`rule-name-${rule.id}`}
                              placeholder="Örn: 1-5 yıl arası"
                              value={rule.name}
                              onChange={(e) =>
                                handleUpdateRuleInNewLeaveType(rule.id, "name", e.target.value)
                              }
                              className="text-sm"
                            />
                          </div>

                          {/* Çalışma Süresi */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-2">
                              <Label htmlFor={`min-years-${rule.id}`} className="text-xs">
                                Min. Yıl
                              </Label>
                              <Input
                                id={`min-years-${rule.id}`}
                                type="number"
                                min="0"
                                placeholder="0"
                                value={rule.min_years_of_service}
                                onChange={(e) =>
                                  handleUpdateRuleInNewLeaveType(rule.id, "min_years_of_service", e.target.value)
                                }
                                className="text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`max-years-${rule.id}`} className="text-xs">
                                Max. Yıl
                              </Label>
                              <Input
                                id={`max-years-${rule.id}`}
                                type="number"
                                min="0"
                                placeholder="∞"
                                value={rule.max_years_of_service}
                                onChange={(e) =>
                                  handleUpdateRuleInNewLeaveType(rule.id, "max_years_of_service", e.target.value)
                                }
                                className="text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`days-${rule.id}`} className="text-xs">
                                Gün <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id={`days-${rule.id}`}
                                type="number"
                                min="0"
                                placeholder="14"
                                value={rule.days_entitled}
                                onChange={(e) =>
                                  handleUpdateRuleInNewLeaveType(rule.id, "days_entitled", e.target.value)
                                }
                                className="text-sm"
                              />
                            </div>
                          </div>

                          {/* Açıklama */}
                          <div className="space-y-2">
                            <Label htmlFor={`rule-desc-${rule.id}`} className="text-xs">
                              Açıklama
                            </Label>
                            <Textarea
                              id={`rule-desc-${rule.id}`}
                              placeholder="Kural açıklaması (opsiyonel)"
                              value={rule.description}
                              onChange={(e) =>
                                handleUpdateRuleInNewLeaveType(rule.id, "description", e.target.value)
                              }
                              rows={2}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateLeaveTypeDialogOpen(false);
                setNewLeaveTypeData({
                  name: "",
                  description: "",
                  color: "#3b82f6",
                  rules: [],
                });
              }}
            >
              İptal
            </Button>
            <Button onClick={handleCreateLeaveType}>
              İzin Türü Oluştur
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
              {selectedLeaveType ? `${selectedLeaveType.name} izin türü için yeni bir kural tanımlayın.` : 'Bir izin türü seçin.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Kural Adı */}
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

            {/* Çalışma Süresi Aralığı */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-years">
                  Minimum Yıl
                </Label>
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
                <p className="text-xs text-muted-foreground">
                  Boş bırakılırsa sınırsız
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-years">
                  Maksimum Yıl
                </Label>
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
                <p className="text-xs text-muted-foreground">
                  Boş bırakılırsa sınırsız
                </p>
              </div>
            </div>

            {/* Hak Edilen Gün Sayısı */}
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

            {/* Açıklama */}
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
            <Button onClick={handleCreateRule}>
              Kural Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveSettings;
