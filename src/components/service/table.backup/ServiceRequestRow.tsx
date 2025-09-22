
import { ServiceRequest, ServiceStatus, ServicePriority } from "@/hooks/useServiceRequests";
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

interface ServiceRequestRowProps {
  request: ServiceRequest;
  technicianName: string;
  onSelectRequest: (request: ServiceRequest) => void;
  onDeleteRequest: (id: string) => void;
}

const ServiceRequestRow = ({ 
  request, 
  technicianName, 
  onSelectRequest, 
  onDeleteRequest 
}: ServiceRequestRowProps) => {
  // Render status badge with appropriate color
  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case "new":
        return <Badge className="bg-purple-500">Yeni</Badge>;
      case "assigned":
        return <Badge className="bg-blue-500">Atandı</Badge>;
      case "in_progress":
        return <Badge className="bg-orange-500">Devam Ediyor</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Tamamlandı</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">İptal</Badge>;
      case "on_hold":
        return <Badge className="bg-yellow-500">Beklemede</Badge>;
      default:
        return <Badge>Bilinmiyor</Badge>;
    }
  };

  // Render priority badge
  const getPriorityBadge = (priority: ServicePriority) => {
    switch (priority) {
      case "high":
        return <Badge variant="outline" className="border-red-500 text-red-800 bg-red-50">Yüksek</Badge>;
      case "medium":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-800 bg-yellow-50">Orta</Badge>;
      case "low":
        return <Badge variant="outline" className="border-blue-500 text-blue-800 bg-blue-50">Düşük</Badge>;
      case "urgent":
        return <Badge variant="outline" className="border-purple-500 text-purple-800 bg-purple-50">Acil</Badge>;
      default:
        return <Badge variant="outline">Bilinmiyor</Badge>;
    }
  };

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
        {request.customer_id ? request.customer_id.substring(0, 8) : "-"}
      </TableCell>
      <TableCell>
        {request.due_date
          ? format(parseISO(request.due_date), "dd MMM yyyy", { locale: tr })
          : "-"}
      </TableCell>
      <TableCell>{technicianName}</TableCell>
      <TableCell>{getStatusBadge(request.status as any)}</TableCell>
      <TableCell>{getPriorityBadge(request.priority as any)}</TableCell>
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

export default ServiceRequestRow;
