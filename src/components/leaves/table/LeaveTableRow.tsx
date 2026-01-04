import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LeaveRequest } from "../types";
import { Eye, Check, X, MoreHorizontal, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface LeaveTableRowProps {
  leave: LeaveRequest | null;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onSelect?: (id: string) => void;
  isLoading?: boolean;
}

// Status badge renkleri ve ikonları
const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; className: string; icon: string }> = {
    pending: {
      label: "Beklemede",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: "⏳",
    },
    approved: {
      label: "Onaylandı",
      className: "bg-green-100 text-green-800 border-green-200",
      icon: "✅",
    },
    rejected: {
      label: "Reddedildi",
      className: "bg-red-100 text-red-800 border-red-200",
      icon: "❌",
    },
    cancelled: {
      label: "İptal Edildi",
      className: "bg-gray-100 text-gray-800 border-gray-200",
      icon: "🚫",
    },
  };
  return statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800 border-gray-200", icon: "📋" };
};

// İzin türü label ve ikonları
const getLeaveTypeLabel = (type: string) => {
  const typeMap: Record<string, { label: string; icon: string }> = {
    annual: { label: "Yıllık İzin", icon: "🏖️" },
    sick: { label: "Hastalık İzni", icon: "🤒" },
    medical: { label: "Raporlu İzin", icon: "🏥" },
    unpaid: { label: "Ücretsiz İzin", icon: "💼" },
    maternity: { label: "Doğum İzni", icon: "👶" },
    paternity: { label: "Babalık İzni", icon: "👨‍👶" },
    compassionate: { label: "Ölüm İzni", icon: "🙏" },
    official: { label: "Resmî İzin", icon: "🏛️" },
    other: { label: "Diğer", icon: "📝" },
  };
  return typeMap[type] || { label: type, icon: "📋" };
};

// Kısaltma fonksiyonu
const shortenText = (text: string, maxLength: number = 25) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
};

// Avatar için initialler
const getInitials = (name: string) => {
  if (!name) return "??";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const LeaveTableRow = ({
  leave,
  onApprove,
  onReject,
  onSelect,
  isLoading = false,
}: LeaveTableRowProps) => {
  // Loading skeleton
  if (isLoading || !leave) {
    return (
      <TableRow className="h-12">
        <TableCell className="py-2 px-3"><div className="h-3 w-32 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-40 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></TableCell>
      </TableRow>
    );
  }

  const employee = leave.employee;
  const employeeName = employee?.full_name || `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim() || "Bilinmeyen";
  const employeeDepartment = employee?.department || "";
  
  const approver = leave.approver;
  const approverName = approver?.full_name || `${approver?.first_name || ""} ${approver?.last_name || ""}`.trim() || "-";

  const statusBadge = getStatusBadge(leave.status);
  const leaveType = getLeaveTypeLabel(leave.leave_type);

  const handleRowClick = () => {
    if (onSelect) {
      onSelect(leave.id);
    }
  };

  const handleApprove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onApprove) {
      onApprove(leave.id);
    }
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReject) {
      onReject(leave.id);
    }
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(leave.id);
    }
  };

  return (
    <TableRow
      className="h-12 cursor-pointer transition-colors hover:bg-gray-50"
      onClick={handleRowClick}
    >
      {/* Çalışan */}
      <TableCell className="py-2 px-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold">
              {getInitials(employeeName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-xs font-medium" title={employeeName}>
              {shortenText(employeeName, 20)}
            </span>
            {employeeDepartment && (
              <span className="text-[10px] text-muted-foreground" title={employeeDepartment}>
                {shortenText(employeeDepartment, 18)}
              </span>
            )}
          </div>
        </div>
      </TableCell>

      {/* İzin Türü */}
      <TableCell className="py-2 px-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{leaveType.icon}</span>
          <span className="text-xs font-medium">{leaveType.label}</span>
        </div>
      </TableCell>

      {/* Tarih Aralığı */}
      <TableCell className="py-2 px-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium">
            {format(new Date(leave.start_date), "dd MMM yyyy", { locale: tr })} - {format(new Date(leave.end_date), "dd MMM yyyy", { locale: tr })}
          </span>
        </div>
      </TableCell>

      {/* Gün Sayısı */}
      <TableCell className="py-2 px-3">
        <Badge variant="outline" className="text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200">
          {leave.days} gün
        </Badge>
      </TableCell>

      {/* Durum */}
      <TableCell className="py-2 px-3">
        <Badge variant="outline" className={`text-xs font-medium border ${statusBadge.className}`}>
          <span className="mr-1">{statusBadge.icon}</span>
          {statusBadge.label}
        </Badge>
      </TableCell>

      {/* Onaylayan */}
      <TableCell className="py-2 px-3">
        {leave.status === "approved" && approverName !== "-" ? (
          <div className="flex items-center gap-1.5">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-[10px] font-semibold">
                {getInitials(approverName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{shortenText(approverName, 15)}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* İşlemler */}
      <TableCell className="py-2 px-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleView}>
              <Eye className="h-4 w-4 mr-2 text-blue-500" />
              Detayları Görüntüle
            </DropdownMenuItem>
            
            {leave.status === "pending" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleApprove} className="text-green-600">
                  <Check className="h-4 w-4 mr-2" />
                  Onayla
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReject} className="text-red-600">
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
};

