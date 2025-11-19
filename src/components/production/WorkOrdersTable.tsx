import React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, Factory, MoreHorizontal, Trash2, PlayCircle, FileText } from "lucide-react";
import { WorkOrder, WorkOrderStatus, WorkOrderPriority } from "@/types/production";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface WorkOrdersTableProps {
  workOrders: WorkOrder[];
  isLoading: boolean;
  onSelectWorkOrder: (workOrder: WorkOrder) => void;
  onEditWorkOrder?: (workOrder: WorkOrder) => void;
  onDeleteWorkOrder?: (workOrderId: string) => void;
  onStatusChange?: (workOrderId: string, status: WorkOrderStatus) => void;
  searchQuery?: string;
  statusFilter?: string;
}

const WorkOrdersTable = ({
  workOrders,
  isLoading,
  onSelectWorkOrder,
  onEditWorkOrder,
  onDeleteWorkOrder,
  onStatusChange,
  searchQuery,
  statusFilter
}: WorkOrdersTableProps) => {
  const filteredWorkOrders = workOrders.filter(wo => {
    const matchesSearch = !searchQuery || 
      wo.order_number.toString().includes(searchQuery) ||
      wo.title.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || !statusFilter || wo.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="border-gray-500 text-gray-700">📝 Taslak</Badge>;
      case 'planned':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">📅 Planlandı</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="border-orange-500 text-orange-700">⚙️ Üretimde</Badge>;
      case 'completed':
        return <Badge variant="outline" className="border-green-500 text-green-700">✔️ Tamamlandı</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-red-500 text-red-700">❌ İptal</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: WorkOrderPriority) => {
    switch (priority) {
      case 'high':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">Yüksek</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Orta</Badge>;
      case 'low':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Düşük</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">No</TableHead>
            <TableHead>Başlık</TableHead>
            <TableHead>Miktar</TableHead>
            <TableHead>Öncelik</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Planlanan</TableHead>
            <TableHead className="text-center">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-12" /></TableCell>
              <TableCell><Skeleton className="h-4 w-48" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (filteredWorkOrders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Factory className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Henüz iş emri kaydı bulunmuyor</p>
        <p className="text-sm mt-2">Yeni iş emri oluşturmak için üstteki butonu kullanın</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-gray-200">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="w-[80px] font-semibold">No</TableHead>
            <TableHead className="font-semibold">Başlık</TableHead>
            <TableHead className="font-semibold">Miktar</TableHead>
            <TableHead className="font-semibold">Öncelik</TableHead>
            <TableHead className="font-semibold">Durum</TableHead>
            <TableHead className="font-semibold">Planlanan Tarih</TableHead>
            <TableHead className="text-center font-semibold">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredWorkOrders.map((workOrder) => (
            <TableRow 
              key={workOrder.id}
              className="cursor-pointer hover:bg-gray-50/80 transition-colors"
              onClick={() => onSelectWorkOrder(workOrder)}
            >
              <TableCell className="font-medium text-gray-600">
                #{workOrder.order_number}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{workOrder.title}</span>
                  {workOrder.bom_name && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {workOrder.bom_name}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {workOrder.quantity}
              </TableCell>
              <TableCell>
                {getPriorityBadge(workOrder.priority)}
              </TableCell>
              <TableCell>
                {getStatusBadge(workOrder.status)}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {workOrder.planned_start_date 
                  ? format(new Date(workOrder.planned_start_date), "dd MMM yyyy", { locale: tr })
                  : '-'}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {onEditWorkOrder && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditWorkOrder(workOrder)}
                      className="h-8 w-8 text-gray-500 hover:text-primary hover:bg-primary/10"
                      title="Düzenle"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {onStatusChange && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {workOrder.status !== 'planned' && (
                          <DropdownMenuItem onClick={() => onStatusChange(workOrder.id, 'planned')}>
                            Planlandı İşaretle
                          </DropdownMenuItem>
                        )}
                        {workOrder.status !== 'in_progress' && (
                          <DropdownMenuItem onClick={() => onStatusChange(workOrder.id, 'in_progress')}>
                            Üretime Başla
                          </DropdownMenuItem>
                        )}
                        {workOrder.status !== 'completed' && (
                          <DropdownMenuItem onClick={() => onStatusChange(workOrder.id, 'completed')}>
                            Tamamlandı İşaretle
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {onDeleteWorkOrder && (
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm('Silmek istediğinize emin misiniz?')) {
                                onDeleteWorkOrder(workOrder.id);
                              }
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default WorkOrdersTable;
