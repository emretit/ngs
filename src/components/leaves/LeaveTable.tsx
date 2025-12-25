import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeaveRequest } from "./types";
import { Eye, Check, X, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface LeaveTableProps {
  leaves: LeaveRequest[];
  isLoading?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onSelectLeave?: (id: string) => void;
}

// Utility: Gün sayısını hesapla
const calcDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  return diffDays;
};

// Status badge renkleri
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

// İzin türü Türkçe karşılıkları
const getLeaveTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    annual: "Yıllık İzin",
    sick: "Hastalık İzni",
    unpaid: "Ücretsiz İzin",
    maternity: "Doğum İzni",
    paternity: "Babalık İzni",
    compassionate: "Ölüm İzni",
    other: "Diğer",
  };
  return typeMap[type] || type;
};

export const LeaveTable = ({ 
  leaves, 
  isLoading = false,
  onApprove,
  onReject,
  onSelectLeave,
}: LeaveTableProps) => {
  const navigate = useNavigate();

  const handleRowClick = (id: string) => {
    if (onSelectLeave) {
      onSelectLeave(id);
    } else {
      navigate(`/employees/leaves/${id}`);
    }
  };

  const handleApprove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onApprove) {
      onApprove(id);
    } else {
      toast.success("İzin talebi onaylandı (UI - DB güncellemesi sonraki adımda eklenecek)");
    }
  };

  const handleReject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onReject) {
      onReject(id);
    } else {
      toast.error("İzin talebi reddedildi (UI - DB güncellemesi sonraki adımda eklenecek)");
    }
  };

  const handleView = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onSelectLeave) {
      onSelectLeave(id);
    } else {
      navigate(`/employees/leaves/${id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (leaves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground mb-2">
            İzin talebi bulunamadı
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Filtre sonuçlarına uygun izin talebi yok.
          </p>
          <Button onClick={() => navigate("/employees/leaves/new")}>
            Yeni İzin Talebi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Çalışan</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead>Tarih Aralığı</TableHead>
            <TableHead>Gün</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Onaylayan</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaves.map((leave) => {
            const statusBadge = getStatusBadge(leave.status);
            const days = leave.days || calcDays(leave.start_date, leave.end_date);
            const employeeName = leave.employee
              ? ("full_name" in leave.employee && leave.employee.full_name
                  ? leave.employee.full_name
                  : `${(leave.employee as any).first_name ?? ""} ${(leave.employee as any).last_name ?? ""}`.trim()) || "Bilinmiyor"
              : "Bilinmiyor";
            const department = leave.employee?.department || "-";
            const approverName = leave.approver
              ? ("full_name" in leave.approver && leave.approver.full_name
                  ? leave.approver.full_name
                  : `${(leave.approver as any).first_name ?? ""} ${(leave.approver as any).last_name ?? ""}`.trim()) || "-"
              : "-";

            return (
              <TableRow
                key={leave.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(leave.id)}
              >
                <TableCell>
                  <div>
                    <div className="font-medium">{employeeName}</div>
                    {department && department !== "-" && (
                      <div className="text-xs text-muted-foreground">
                        {department}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getLeaveTypeLabel(leave.leave_type)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(leave.start_date), "dd MMM yyyy", { locale: tr })} -{" "}
                    {format(new Date(leave.end_date), "dd MMM yyyy", { locale: tr })}
                  </div>
                </TableCell>
                <TableCell>{days} gün</TableCell>
                <TableCell>
                  <Badge variant={statusBadge.variant} className={statusBadge.className}>
                    {statusBadge.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {approverName}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleView(e, leave.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Detay
                      </DropdownMenuItem>
                      {leave.status === "pending" && (
                        <>
                          <DropdownMenuItem
                            onClick={(e) => handleApprove(e, leave.id)}
                            className="text-green-600"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Onayla
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleReject(e, leave.id)}
                            className="text-red-600"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reddet
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
