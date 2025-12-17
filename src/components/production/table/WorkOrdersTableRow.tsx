import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { WorkOrder, WorkOrderStatus, WorkOrderPriority } from "@/types/production";
import { Edit2, MoreHorizontal, Trash2, PlayCircle, CheckCircle, XCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface WorkOrdersTableRowProps {
  workOrder: WorkOrder;
  index: number;
  onSelect: (workOrder: WorkOrder) => void;
  onEdit?: (workOrder: WorkOrder) => void;
  onDelete?: (workOrderId: string) => void;
  onStatusChange?: (workOrderId: string, status: WorkOrderStatus) => void;
  isLoading?: boolean;
}

export const WorkOrdersTableRow: React.FC<WorkOrdersTableRowProps> = ({
  workOrder,
  index,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  isLoading = false
}) => {
  // Loading state için skeleton göster
  if (isLoading) {
    return (
      <TableRow className="h-8">
        <TableCell className="py-2 px-3"><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-40 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-12 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
      </TableRow>
    );
  }

  const getStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-500 text-gray-700 bg-gray-50">📝 Taslak</Badge>;
      case 'planned':
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500 text-blue-700 bg-blue-50">📅 Planlandı</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-orange-500 text-orange-700 bg-orange-50">⚙️ Üretimde</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500 text-green-700 bg-green-50">✔️ Tamamlandı</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-500 text-red-700 bg-red-50">❌ İptal</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: WorkOrderPriority) => {
    switch (priority) {
      case 'high':
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-red-100 text-red-800 hover:bg-red-100">Yüksek</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Orta</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-800 hover:bg-green-100">Düşük</Badge>;
      default:
        return null;
    }
  };

  const shortenText = (text: string, maxLength: number = 30) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(workOrder);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(workOrder.id);
  };

  return (
    <TableRow
      key={workOrder.id}
      className="h-8 cursor-pointer transition-colors hover:bg-gray-50"
      onClick={() => onSelect(workOrder)}
    >
      <TableCell className="py-2 px-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-xs">#{workOrder.order_number}</span>
          {workOrder.bom?.name && (
            <Badge 
              variant="outline" 
              className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-600 border-purple-200"
              title={workOrder.bom.name}
            >
              📋 {shortenText(workOrder.bom.name, 15)}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="py-2 px-3">
        <div className="flex flex-col space-y-0">
          <span className="text-xs font-medium" title={workOrder.title}>
            {shortenText(workOrder.title, 30)}
          </span>
          {workOrder.description && (
            <span className="text-xs text-muted-foreground" title={workOrder.description}>
              {shortenText(workOrder.description, 25)}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center py-2 px-3 text-xs font-medium">
        {workOrder.quantity || '-'}
      </TableCell>
      <TableCell className="text-center py-2 px-3">
        {getPriorityBadge(workOrder.priority)}
      </TableCell>
      <TableCell className="text-center py-2 px-3">
        {getStatusBadge(workOrder.status)}
      </TableCell>
      <TableCell className="text-center py-2 px-3 text-xs font-medium">
        {workOrder.planned_start_date 
          ? format(new Date(workOrder.planned_start_date), "dd.MM.yyyy", { locale: tr })
          : <span className="text-muted-foreground">-</span>}
      </TableCell>
      <TableCell className="py-2 px-3 text-center">
        <div className="flex justify-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-8 w-8"
            title="Düzenle"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
              title="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          
          {onStatusChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8"
                  title="İşlemler"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {workOrder.status !== 'planned' && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(workOrder.id, 'planned');
                  }}>
                    <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                    Planlandı İşaretle
                  </DropdownMenuItem>
                )}
                {workOrder.status !== 'in_progress' && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(workOrder.id, 'in_progress');
                  }}>
                    <PlayCircle className="h-4 w-4 mr-2 text-orange-500" />
                    Üretime Başla
                  </DropdownMenuItem>
                )}
                {workOrder.status !== 'completed' && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(workOrder.id, 'completed');
                  }}>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Tamamlandı İşaretle
                  </DropdownMenuItem>
                )}
                {workOrder.status !== 'cancelled' && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(workOrder.id, 'cancelled');
                  }}>
                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                    İptal Et
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
