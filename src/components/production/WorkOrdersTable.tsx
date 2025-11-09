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
import { Edit2, Factory, MoreHorizontal, Trash2, PlayCircle } from "lucide-react";
import { WorkOrder, WorkOrderStatus } from "@/types/production";
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
      wo.work_order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.product_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || !statusFilter || wo.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
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

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">İş Emri No</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Ürün</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Miktar</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Durum</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Planlanan Başlangıç</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Planlanan Bitiş</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">İş Emri No</TableHead>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Ürün</TableHead>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Miktar</TableHead>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Durum</TableHead>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Planlanan Başlangıç</TableHead>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">Planlanan Bitiş</TableHead>
          <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredWorkOrders.map((workOrder) => (
          <TableRow 
            key={workOrder.id}
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => onSelectWorkOrder(workOrder)}
          >
            <TableCell className="font-medium">
              {workOrder.work_order_number || 'N/A'}
            </TableCell>
            <TableCell>
              {workOrder.product_name || workOrder.product?.name || '-'}
            </TableCell>
            <TableCell>
              {workOrder.quantity} {workOrder.unit}
            </TableCell>
            <TableCell>
              {getStatusBadge(workOrder.status)}
            </TableCell>
            <TableCell>
              {workOrder.planned_start_date 
                ? format(new Date(workOrder.planned_start_date), "dd MMM yyyy", { locale: tr })
                : '-'}
            </TableCell>
            <TableCell>
              {workOrder.planned_end_date 
                ? format(new Date(workOrder.planned_end_date), "dd MMM yyyy", { locale: tr })
                : '-'}
            </TableCell>
            <TableCell className="text-center">
              <div className="flex justify-center items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                {onEditWorkOrder && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditWorkOrder(workOrder)}
                    className="h-8 w-8"
                    title="Düzenle"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                
                {onDeleteWorkOrder && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('İş emrini silmek istediğinizden emin misiniz?')) {
                        onDeleteWorkOrder(workOrder.id);
                      }
                    }}
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
                        className="h-8 w-8"
                        title="Daha Fazla"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {workOrder.status !== 'planned' && (
                        <DropdownMenuItem onClick={() => onStatusChange(workOrder.id, 'planned')}>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Planlandı Yap
                        </DropdownMenuItem>
                      )}
                      {workOrder.status !== 'in_progress' && (
                        <DropdownMenuItem onClick={() => onStatusChange(workOrder.id, 'in_progress')}>
                          <Factory className="h-4 w-4 mr-2" />
                          Üretimde Yap
                        </DropdownMenuItem>
                      )}
                      {workOrder.status !== 'completed' && (
                        <DropdownMenuItem onClick={() => onStatusChange(workOrder.id, 'completed')}>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Tamamlandı Yap
                        </DropdownMenuItem>
                      )}
                      {workOrder.status !== 'cancelled' && (
                        <DropdownMenuItem onClick={() => onStatusChange(workOrder.id, 'cancelled')}>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          İptal Et
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
  );
};

export default WorkOrdersTable;

