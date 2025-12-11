import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CalendarIcon, MoreHorizontal, Edit, Trash2, Factory, FileText } from "lucide-react";
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
    <div className="w-full relative" onClick={onClick}>
      {/* Header: No ve Menü */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="font-mono text-xs bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-gray-300 px-2 h-6 shadow-sm font-semibold">
            #{workOrder.order_number}
          </Badge>
          <Badge variant="outline" className={`text-[10px] px-2 h-6 border-2 font-semibold shadow-sm ${getPriorityColor(workOrder.priority)}`}>
            {getPriorityLabel(workOrder.priority)}
          </Badge>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-gray-100/80 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full hover:scale-110"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 shadow-lg border-2">
            {onEdit && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit(workOrder);
              }} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
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
                className="text-red-600 focus:text-red-600 cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Sil
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Başlık */}
      <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm mb-3 leading-snug hover:text-primary transition-colors">
        {workOrder.title}
      </h3>

      {/* Reçete Bilgisi */}
      {workOrder.bom_name && (
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-600 bg-gradient-to-r from-purple-50 to-purple-100/50 p-2 rounded-lg border border-purple-200 shadow-sm">
          <div className="p-1 bg-purple-100 rounded">
            <FileText className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <span className="truncate font-medium">{shortenText(workOrder.bom_name, 25)}</span>
        </div>
      )}

      {/* Footer: Miktar ve Tarih */}
      <div className="flex items-center justify-between pt-3 border-t-2 border-gray-100 mt-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-gray-50 px-2 py-1 rounded-md">
          <div className="p-0.5 bg-blue-100 rounded">
            <Factory className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <span>{workOrder.quantity} Adet</span>
        </div>

        {workOrder.planned_start_date && (
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600 bg-gray-50 px-2 py-1 rounded-md font-medium" title="Planlanan Başlangıç">
            <CalendarIcon className="h-3.5 w-3.5 text-gray-500" />
            <span>{format(new Date(workOrder.planned_start_date), 'd MMM', { locale: tr })}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkOrderCard;
