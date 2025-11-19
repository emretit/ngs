import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CalendarIcon, MoreHorizontal, Edit, Trash2, Factory, FileText, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { WorkOrder, WorkOrderPriority } from "@/types/production";

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
  const shortenText = (text: string, maxLength: number = 35) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  const getPriorityColor = (priority: WorkOrderPriority) => {
    switch (priority) {
      case 'high': return "bg-red-50 text-red-700 border-red-200";
      case 'medium': return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case 'low': return "bg-green-50 text-green-700 border-green-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getPriorityLabel = (priority: WorkOrderPriority) => {
    switch (priority) {
      case 'high': return "Yüksek";
      case 'medium': return "Orta";
      case 'low': return "Düşük";
      default: return priority;
    }
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
            className="border-gray-200 hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer bg-white group"
            onClick={onClick}
          >
            <CardContent className="p-3">
              {/* Header: No ve Menü */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs bg-gray-50 text-gray-600 border-gray-200 px-1.5 h-5">
                    #{workOrder.order_number}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] px-1.5 h-5 border ${getPriorityColor(workOrder.priority)}`}>
                    {getPriorityLabel(workOrder.priority)}
                  </Badge>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
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

              {/* Başlık */}
              <h3 className="font-medium text-gray-900 line-clamp-2 text-sm mb-2 leading-snug">
                {workOrder.title}
              </h3>

              {/* Reçete Bilgisi */}
              {workOrder.bom_name && (
                <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-500 bg-gray-50/50 p-1.5 rounded border border-gray-100">
                  <FileText className="h-3 w-3 text-purple-500" />
                  <span className="truncate">{shortenText(workOrder.bom_name, 25)}</span>
                </div>
              )}

              {/* Footer: Miktar ve Tarih */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                  <Factory className="h-3 w-3 text-gray-400" />
                  <span>{workOrder.quantity} Adet</span>
                </div>

                {workOrder.planned_start_date && (
                  <div className="flex items-center gap-1 text-[10px] text-gray-500" title="Planlanan Başlangıç">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{format(new Date(workOrder.planned_start_date), 'd MMM', { locale: tr })}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default WorkOrderCard;
