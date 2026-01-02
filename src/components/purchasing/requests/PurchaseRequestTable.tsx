import React from "react";
import { Table, TableBody, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Building2, AlertCircle, User, DollarSign, Calendar, Settings, Edit2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/utils/dateUtils";

interface PurchaseRequestTableProps {
  requests: any[];
  isLoading: boolean;
  onRequestSelect: (request: any) => void;
  onStatusChange?: () => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const statusConfig = {
  draft: { label: "Taslak", variant: "secondary" as const, color: "bg-gray-100 text-gray-800" },
  submitted: { label: "Onay Bekliyor", variant: "default" as const, color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Onaylandı", variant: "default" as const, color: "bg-green-100 text-green-800" },
  rejected: { label: "Reddedildi", variant: "destructive" as const, color: "bg-red-100 text-red-800" },
  converted: { label: "Dönüştürüldü", variant: "default" as const, color: "bg-blue-100 text-blue-800" },
};

const priorityConfig = {
  low: { label: "Düşük", variant: "secondary" as const, color: "bg-green-100 text-green-800" },
  normal: { label: "Normal", variant: "default" as const, color: "bg-blue-100 text-blue-800" },
  high: { label: "Yüksek", variant: "default" as const, color: "bg-orange-100 text-orange-800" },
  urgent: { label: "Acil", variant: "destructive" as const, color: "bg-red-100 text-red-800" },
};

const PurchaseRequestTable = ({ requests, isLoading, onRequestSelect, onStatusChange }: PurchaseRequestTableProps) => {
  const navigate = useNavigate();

  if (isLoading && requests.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-left">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Talep No</span>
              </div>
            </TableHead>
            <TableHead className="w-[12%] font-bold text-foreground/80 text-sm tracking-wide text-center">
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>Durum</span>
              </div>
            </TableHead>
            <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-left">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Talep Eden</span>
              </div>
            </TableHead>
            <TableHead className="w-[12%] font-bold text-foreground/80 text-sm tracking-wide text-left">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>Departman</span>
              </div>
            </TableHead>
            <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>Öncelik</span>
              </div>
            </TableHead>
            <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>İhtiyaç Tarihi</span>
              </div>
            </TableHead>
            <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-center">
              <span>Kalem Sayısı</span>
            </TableHead>
            <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">
              <div className="flex items-center justify-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>Tahmini Tutar</span>
              </div>
            </TableHead>
            <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-center">
              <div className="flex items-center justify-center gap-2">
                <Settings className="h-4 w-4" />
                <span>İşlemler</span>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index} className="h-8">
              <TableCell className="py-2 px-3"><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-3"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-3"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-2"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-2"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-2"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-2"><div className="h-4 w-12 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-2"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-2"><div className="h-6 w-6 bg-gray-200 rounded animate-pulse" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (!requests || requests.length === 0) {
    return <div className="p-4 text-center text-gray-500">Henüz talep bulunmamaktadır.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-left">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Talep No</span>
            </div>
          </TableHead>
          <TableHead className="w-[12%] font-bold text-foreground/80 text-sm tracking-wide text-center">
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Durum</span>
            </div>
          </TableHead>
          <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-left">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Talep Eden</span>
            </div>
          </TableHead>
          <TableHead className="w-[12%] font-bold text-foreground/80 text-sm tracking-wide text-left">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Departman</span>
            </div>
          </TableHead>
          <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Öncelik</span>
            </div>
          </TableHead>
          <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>İhtiyaç Tarihi</span>
            </div>
          </TableHead>
          <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-center">
            <span>Kalem Sayısı</span>
          </TableHead>
          <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Tahmini Tutar</span>
            </div>
          </TableHead>
          <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-center">
            <div className="flex items-center justify-center gap-2">
              <Settings className="h-4 w-4" />
              <span>İşlemler</span>
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((req, index) => {
          const estimatedTotal = req.items?.reduce(
            (sum: number, item: any) => sum + ((item.estimated_price || 0) * item.quantity),
            0
          ) || 0;

          return (
            <TableRow
              key={req.id}
              className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
              }`}
              onClick={() => navigate(`/purchase-requests/${req.id}`)}
            >
              <TableCell className="font-medium text-sm py-3 px-3">
                <div className="flex flex-col">
                  <span className="font-semibold text-primary">{req.request_number || "-"}</span>
                  {req.title && (
                    <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {req.title}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center py-3 px-2">
                <Badge 
                  variant={statusConfig[req.status as keyof typeof statusConfig]?.variant}
                  className={`${statusConfig[req.status as keyof typeof statusConfig]?.color} text-xs`}
                >
                  {statusConfig[req.status as keyof typeof statusConfig]?.label}
                </Badge>
              </TableCell>
              <TableCell className="text-sm py-3 px-3">
                {req.requester ? `${req.requester.first_name} ${req.requester.last_name}` : "-"}
              </TableCell>
              <TableCell className="text-sm py-3 px-2">
                {req.department?.name || "-"}
              </TableCell>
              <TableCell className="text-center py-3 px-2">
                <Badge 
                  variant={priorityConfig[req.priority as keyof typeof priorityConfig]?.variant}
                  className={`${priorityConfig[req.priority as keyof typeof priorityConfig]?.color} text-xs`}
                >
                  {priorityConfig[req.priority as keyof typeof priorityConfig]?.label}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-center py-3 px-2">
                {req.need_by_date ? formatDate(req.need_by_date) : "-"}
              </TableCell>
              <TableCell className="text-sm text-center font-semibold py-3 px-2">
                {req.items?.length || 0}
              </TableCell>
              <TableCell className="text-sm text-center font-semibold py-3 px-2">
                ₺{estimatedTotal.toFixed(2)}
              </TableCell>
              <TableCell className="text-center py-3 px-2">
                <div className="flex justify-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/purchase-requests/${req.id}`);
                    }}
                    className="h-8 w-8"
                    title="Düzenle"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: onDelete eklenmeli
                    }}
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default React.memo(PurchaseRequestTable);

