import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import {
  Clock,
  MapPin,
  User,
  Calendar,
  AlertCircle,
  Phone,
  FileText,
  Edit,
  ExternalLink,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface ServiceDetailModalProps {
  service: ServiceRequest | null;
  open: boolean;
  onClose: () => void;
}

const priorityConfig = {
  urgent: {
    label: "Acil",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  high: {
    label: "Yüksek",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  medium: {
    label: "Orta",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  low: {
    label: "Düşük",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
};

const statusConfig = {
  pending: { label: "Bekliyor", className: "bg-gray-100 text-gray-800" },
  assigned: { label: "Atandı", className: "bg-blue-100 text-blue-800" },
  in_progress: { label: "Devam Ediyor", className: "bg-yellow-100 text-yellow-800" },
  completed: { label: "Tamamlandı", className: "bg-green-100 text-green-800" },
  cancelled: { label: "İptal", className: "bg-red-100 text-red-800" },
};

export const ServiceDetailModal = ({
  service,
  open,
  onClose,
}: ServiceDetailModalProps) => {
  const navigate = useNavigate();

  if (!service) return null;

  const priority = (service.service_priority || "medium") as keyof typeof priorityConfig;
  const status = (service.service_status || "pending") as keyof typeof statusConfig;
  const customerData = service.customer_data as any;

  const issueDate = service.issue_date
    ? format(parseISO(service.issue_date), "d MMMM yyyy HH:mm", { locale: tr })
    : "Belirtilmemiş";

  const dueDate = service.service_due_date
    ? format(parseISO(service.service_due_date), "d MMMM yyyy HH:mm", { locale: tr })
    : "Belirtilmemiş";

  const handleViewDetail = () => {
    onClose();
    navigate(`/service/detail/${service.id}`);
  };

  const handleEdit = () => {
    onClose();
    navigate(`/service/edit/${service.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl truncate">
                {service.service_title || "İsimsiz Servis"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                #{service.service_number}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className={priorityConfig[priority].className}>
                {priorityConfig[priority].label}
              </Badge>
              <Badge className={statusConfig[status].className}>
                {statusConfig[status].label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Müşteri Bilgileri */}
          {customerData && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Müşteri
              </h4>
              <div className="pl-6 space-y-1 text-sm">
                <p className="font-medium">{customerData.name || "Bilinmiyor"}</p>
                {customerData.phone && (
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    {customerData.phone}
                  </p>
                )}
                {(customerData.address || service.service_location) && (
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    {customerData.address || service.service_location}
                  </p>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Tarih Bilgileri */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Başlangıç
              </p>
              <p className="text-sm font-medium">{issueDate}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Bitiş
              </p>
              <p className="text-sm font-medium">{dueDate}</p>
            </div>
          </div>

          {/* Açıklama */}
          {service.service_request_description && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Açıklama
                </h4>
                <p className="text-sm text-muted-foreground pl-6">
                  {service.service_request_description}
                </p>
              </div>
            </>
          )}

          {/* Teknisyen Bilgisi */}
          {service.technician_name && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Atanan Teknisyen</p>
                <p className="text-sm font-medium">{service.technician_name}</p>
              </div>
            </>
          )}
        </div>

        {/* Aksiyonlar */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
          <Button size="sm" onClick={handleViewDetail}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Detaya Git
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
