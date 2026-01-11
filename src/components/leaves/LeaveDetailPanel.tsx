import { useState } from "react";
import { logger } from '@/utils/logger';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, X, Loader2, Calendar, User, Building, FileText, Clock } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { LeaveRequest } from "./types";

// İzin türü Türkçe karşılıkları
const getLeaveTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    annual: "Yıllık İzin",
    sick: "Mazeret İzni",
    medical: "Raporlu İzin",
    unpaid: "Ücretsiz İzin",
    official: "Resmî İzin",
    other: "Diğer",
  };
  return typeMap[type] || type;
};

// Durum badge renkleri
const getStatusBadge = (
  status: string
): { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string } => {
  const statusMap: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
  > = {
    pending: {
      label: "Beklemede",
      variant: "secondary",
      className: "bg-amber-100 text-amber-900 hover:bg-amber-100",
    },
    approved: { label: "Onaylandı", variant: "default" },
    rejected: { label: "Reddedildi", variant: "destructive" },
    cancelled: { label: "İptal Edildi", variant: "outline" },
  };
  return statusMap[status] || { label: status, variant: "outline" };
};

// Durum açıklaması
const getStatusDescription = (status: string): string => {
  const descriptions: Record<string, string> = {
    pending: "Yönetici onayı bekleniyor",
    approved: "Onaylandı",
    rejected: "Reddedildi",
    cancelled: "İptal Edildi",
  };
  return descriptions[status] || status;
};

interface LeaveDetailPanelProps {
  leaveId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LeaveDetailPanel = ({ leaveId, isOpen, onClose }: LeaveDetailPanelProps) => {
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();

  // State
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch leave request
  const { data: leave, isLoading, error } = useQuery<LeaveRequest>({
    queryKey: ["leave-detail", leaveId],
    queryFn: async () => {
      if (!leaveId) throw new Error("ID bulunamadı");

      const { data, error: queryError } = await supabase
        .from("leave_requests")
        .select(`
          *,
          employee:employees(id, full_name, first_name, last_name, department),
          approver:profiles(id, full_name, first_name, last_name)
        `)
        .eq("id", leaveId)
        .single();

      if (queryError) {
        logger.error("Error fetching leave:", queryError);
        throw queryError;
      }

      // Process data
      const processedData: LeaveRequest = {
        ...data,
        employee: data.employee || null,
        approver: data.approver || null,
      };

      return processedData;
    },
    enabled: !!leaveId && isOpen,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Yetki kontrolü: Kendi iznini onaylayamaz
  const canApproveReject =
    leave?.status === "pending" && userData?.id && leave?.employee_id !== userData.id;

  // Onayla işlemi
  const handleApprove = async () => {
    if (!leave || !userData?.id) return;

    setIsActionLoading(true);
    try {
      const { error: updateError } = await supabase
        .from("leave_requests")
        .update({
          status: "approved",
          approver_id: userData.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", leave.id);

      if (updateError) {
        logger.error("Error approving leave:", updateError);
        toast.error("İzin talebi onaylanamadı: " + updateError.message);
        return;
      }

      toast.success("İzin talebi onaylandı");
      // Local state update
      queryClient.setQueryData<LeaveRequest>(["leave-detail", leaveId], (old) => {
        if (!old) return old;
        return {
          ...old,
          status: "approved",
          approver_id: userData.id,
          approver: {
            id: userData.id,
            full_name: userData.full_name || null,
            first_name: userData.full_name?.split(" ")[0] || null,
            last_name: userData.full_name?.split(" ").slice(1).join(" ") || null,
          },
        };
      });
      // Invalidate list query
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
    } catch (err: any) {
      logger.error("Error in approve:", err);
      toast.error("İzin talebi onaylanamadı: " + (err.message || "Bilinmeyen hata"));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Reddet işlemi
  const handleReject = async () => {
    if (!leave || !userData?.id || !rejectReason.trim()) {
      toast.error("Lütfen reddetme nedeni girin");
      return;
    }

    setIsActionLoading(true);
    try {
      const { error: updateError } = await supabase
        .from("leave_requests")
        .update({
          status: "rejected",
          approver_id: userData.id,
          rejected_reason: rejectReason.trim(),
          rejected_at: new Date().toISOString(),
        })
        .eq("id", leave.id);

      if (updateError) {
        logger.error("Error rejecting leave:", updateError);
        toast.error("İzin talebi reddedilemedi: " + updateError.message);
        return;
      }

      toast.success("İzin talebi reddedildi");
      // Local state update
      queryClient.setQueryData<LeaveRequest>(["leave-detail", leaveId], (old) => {
        if (!old) return old;
        return {
          ...old,
          status: "rejected",
          approver_id: userData.id,
          reason: rejectReason.trim(),
          approver: {
            id: userData.id,
            full_name: userData.full_name || null,
            first_name: userData.full_name?.split(" ")[0] || null,
            last_name: userData.full_name?.split(" ").slice(1).join(" ") || null,
          },
        };
      });
      // Invalidate list query
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      // Close dialog and reset
      setIsRejectDialogOpen(false);
      setRejectReason("");
    } catch (err: any) {
      logger.error("Error in reject:", err);
      toast.error("İzin talebi reddedilemedi: " + (err.message || "Bilinmeyen hata"));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Employee name helper
  const getEmployeeName = (employee: LeaveRequest["employee"]): string => {
    if (!employee) return "Bilinmiyor";
    if (employee.full_name) return employee.full_name;
    if (employee.first_name || employee.last_name) {
      return `${employee.first_name || ""} ${employee.last_name || ""}`.trim();
    }
    return "Bilinmiyor";
  };

  // Approver name helper
  const getApproverName = (approver: LeaveRequest["approver"]): string => {
    if (!approver) return "-";
    if (approver.full_name) return approver.full_name;
    if (approver.first_name || approver.last_name) {
      return `${approver.first_name || ""} ${approver.last_name || ""}`.trim();
    }
    return "-";
  };

  if (!leaveId) return null;

  const statusBadge = leave ? getStatusBadge(leave.status) : null;
  const employeeName = leave ? getEmployeeName(leave.employee) : "";
  const approverName = leave ? getApproverName(leave.approver) : "";

  return (
    <>
      {/* Custom Overlay for modal={false} */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
          style={{ pointerEvents: "auto" }}
          onClick={() => onClose()}
        />
      )}

      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
        <SheetContent className="sm:max-w-xl md:max-w-2xl overflow-hidden p-0 flex flex-col border-l border-gray-200 bg-white">
          {/* Header */}
          <SheetHeader className="text-left border-b pb-3 mb-0 px-4 pt-4 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <SheetTitle className="text-lg font-semibold text-gray-900">İzin Talebi Detayı</SheetTitle>
            </div>
          </SheetHeader>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">Yükleniyor...</p>
                </div>
              </div>
            ) : error || !leave ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <p className="text-lg text-muted-foreground">
                    {error ? "İzin talebi yüklenirken bir hata oluştu." : "İzin talebi bulunamadı."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* İzin Bilgileri */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <Calendar className="h-4 w-4" />
                    İzin Bilgileri
                  </div>

                  <div className="space-y-3 pl-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>Çalışan</span>
                      </div>
                      <p className="text-sm font-medium">{employeeName}</p>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Building className="h-3 w-3" />
                        <span>Departman</span>
                      </div>
                      <p className="text-sm font-medium">{leave.employee?.department || "-"}</p>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">İzin Türü</div>
                      <p className="text-sm font-medium">{getLeaveTypeLabel(leave.leave_type)}</p>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Tarih Aralığı</div>
                      <p className="text-sm font-medium">
                        {format(new Date(leave.start_date), "dd MMMM yyyy", { locale: tr })} -{" "}
                        {format(new Date(leave.end_date), "dd MMMM yyyy", { locale: tr })}
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Gün Sayısı</div>
                      <p className="text-sm font-medium">{leave.days} gün</p>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Durum</div>
                      {statusBadge && (
                        <Badge variant={statusBadge.variant} className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Açıklama & Belgeler */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <FileText className="h-4 w-4" />
                    Açıklama & Belgeler
                  </div>

                  <div className="space-y-3 pl-6">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Açıklama</div>
                      <p className="text-sm whitespace-pre-wrap">{leave.reason || "Açıklama eklenmemiş"}</p>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Belgeler</div>
                      <p className="text-sm text-muted-foreground">Belge eklenmemiş</p>
                    </div>
                  </div>
                </div>

                {/* Onay & Süreç Bilgisi */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <Clock className="h-4 w-4" />
                    Onay & Süreç Bilgisi
                  </div>

                  <div className="space-y-3 pl-6">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Oluşturulma Tarihi</div>
                      <p className="text-sm font-medium">
                        {format(new Date(leave.created_at), "dd MMMM yyyy, HH:mm", { locale: tr })}
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Onaylayan</div>
                      <p className="text-sm font-medium">{approverName}</p>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Mevcut Durum</div>
                      <p className="text-sm font-medium">{getStatusDescription(leave.status)}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {canApproveReject && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-end gap-3">
                      <Button
                        variant="destructive"
                        onClick={() => setIsRejectDialogOpen(true)}
                        disabled={isActionLoading}
                        size="sm"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reddet
                      </Button>
                      <Button onClick={handleApprove} disabled={isActionLoading} size="sm">
                        {isActionLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            İşleniyor...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Onayla
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Reject Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İzin Talebini Reddet</AlertDialogTitle>
            <AlertDialogDescription>
              Lütfen reddetme nedenini belirtin. Bu bilgi çalışana gösterilecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">
                Reddetme Nedeni <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reject-reason"
                placeholder="Reddetme nedenini açıklayın..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isActionLoading || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                "Reddet"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

