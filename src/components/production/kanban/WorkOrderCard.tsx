import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CalendarIcon, MoreHorizontal, Edit, Trash2, Factory, Package } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { WorkOrder } from "@/types/production";

interface WorkOrderCardProps {
  workOrder: WorkOrder;
  index: number;
  onClick: () => void;
  onEdit?: (workOrder: WorkOrder) => void;
  onDelete?: (workOrderId: string) => void;
}

const WorkOrderCard = ({ 
  workOrder, 
  index, 
  onClick,
  onEdit,
  onDelete
}: WorkOrderCardProps) => {
  const shortenText = (text: string, maxLength: number = 25) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  return (
    <Draggable draggableId={workOrder.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-3 ${snapshot.isDragging ? "opacity-75" : ""}`}
        >
          <Card 
            className="border-gray-200 hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
            onClick={onClick}
          >
            <CardContent className="p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Factory className="h-3 w-3 text-muted-foreground" />
                    <span className="font-semibold text-sm text-gray-900">
                      #{workOrder.work_order_number || 'N/A'}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 line-clamp-1 text-sm">
                    {shortenText(workOrder.product_name || workOrder.product?.name || 'Ürün Adı Yok', 30)}
                  </h3>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {onEdit && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onEdit(workOrder);
                      }}>
                        <Edit className="mr-2 h-3 w-3" />
                        Düzenle
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("İş emrini silmek istediğinize emin misiniz?")) {
                            onDelete(workOrder.id);
                          }
                        }}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-3 w-3" />
                        Sil
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Miktar ve Birim */}
              <div className="flex items-center gap-1 mb-2 text-xs text-gray-600">
                <Package className="h-3 w-3" />
                <span>{workOrder.quantity} {workOrder.unit}</span>
              </div>

              {/* Planlanan Tarihler */}
              {(workOrder.planned_start_date || workOrder.planned_end_date) && (
                <div className="mb-2 p-2 bg-gray-50 rounded-md border border-gray-100">
                  <div className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    Planlanan Tarihler
                  </div>
                  <div className="space-y-1">
                    {workOrder.planned_start_date && (
                      <div className="flex items-center text-xs text-blue-600">
                        <CalendarIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span>Başlangıç: {format(new Date(workOrder.planned_start_date), 'dd MMM yyyy', { locale: tr })}</span>
                      </div>
                    )}
                    {workOrder.planned_end_date && (
                      <div className="flex items-center text-xs text-orange-600">
                        <CalendarIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span>Bitiş: {format(new Date(workOrder.planned_end_date), 'dd MMM yyyy', { locale: tr })}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Gerçekleşen Tarihler */}
              {(workOrder.actual_start_date || workOrder.actual_end_date) && (
                <div className="mb-2 p-2 bg-green-50 rounded-md border border-green-100">
                  <div className="text-xs font-medium text-green-700 mb-1.5 flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    Gerçekleşen Tarihler
                  </div>
                  <div className="space-y-1">
                    {workOrder.actual_start_date && (
                      <div className="flex items-center text-xs text-green-600">
                        <CalendarIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span>Başlangıç: {format(new Date(workOrder.actual_start_date), 'dd MMM yyyy', { locale: tr })}</span>
                      </div>
                    )}
                    {workOrder.actual_end_date && (
                      <div className="flex items-center text-xs text-green-600">
                        <CalendarIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span>Bitiş: {format(new Date(workOrder.actual_end_date), 'dd MMM yyyy', { locale: tr })}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ürün Reçetesi */}
              {workOrder.bom_name && (
                <div className="flex items-center text-xs text-purple-600 mb-2">
                  <Package className="h-3 w-3 mr-1" />
                  <span>Reçete: {shortenText(workOrder.bom_name, 25)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    workOrder.status === 'planned' ? 'border-blue-500 text-blue-700' :
                    workOrder.status === 'in_progress' ? 'border-orange-500 text-orange-700' :
                    workOrder.status === 'completed' ? 'border-green-500 text-green-700' :
                    'border-red-500 text-red-700'
                  }`}
                >
                  {workOrder.status === 'planned' ? '📅 Planlandı' :
                   workOrder.status === 'in_progress' ? '⚙️ Üretimde' :
                   workOrder.status === 'completed' ? '✔️ Tamamlandı' :
                   '❌ İptal'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default WorkOrderCard;

