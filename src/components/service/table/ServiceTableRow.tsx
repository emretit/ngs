
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, FileText, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ServiceRequest, ServiceStatus } from "@/hooks/service/types";
import { getStatusBadge } from "@/components/service/utils/statusUtils";
import { useCustomerNames } from "@/hooks/useCustomerNames";

interface ServiceTableRowProps {
  request: ServiceRequest;
  onSelectRequest: (request: ServiceRequest) => void;
  onDeleteRequest: (id: string) => void;
  getTechnicianName: (technicianId?: string) => string;
}

const ServiceTableRow: React.FC<ServiceTableRowProps> = ({ 
  request, 
  onSelectRequest, 
  onDeleteRequest,
  getTechnicianName
}) => {
  const { getCustomerName } = useCustomerNames();
  
  return (
    <TableRow 
      key={request.id}
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => onSelectRequest(request)}
    >
      <TableCell className="font-medium">
        {request.id.substring(0, 8)}
      </TableCell>
      <TableCell>{request.title}</TableCell>
      <TableCell>
        {getCustomerName(request.customer_id)}
      </TableCell>
      <TableCell>
        {request.due_date
          ? format(parseISO(request.due_date), "dd MMM yyyy", { locale: tr })
          : "-"}
      </TableCell>
      <TableCell>{getTechnicianName(request.assigned_to)}</TableCell>
      <TableCell>{getStatusBadge(request.status)}</TableCell>
      <TableCell>
        <Badge variant="outline" className={
          request.priority === "high" 
            ? "border-red-500 text-red-800 bg-red-50" 
            : request.priority === "medium"
            ? "border-yellow-500 text-yellow-800 bg-yellow-50"
            : "border-blue-500 text-blue-800 bg-blue-50"
        }>
          {request.priority === "high" 
            ? "Yüksek" 
            : request.priority === "medium" 
            ? "Orta" 
            : "Düşük"}
        </Badge>
      </TableCell>
      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Menüyü aç</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onSelectRequest(request)}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>Detaylar</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => {
                if (confirm('Bu servis talebini silmek istediğinizden emin misiniz?')) {
                  onDeleteRequest(request.id);
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Sil</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default ServiceTableRow;
