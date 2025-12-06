import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Phone,
  FileText,
  Edit,
  ExternalLink,
  Wrench,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ServiceDetailModalProps {
  service: ServiceRequest | null;
  open: boolean;
  onClose: () => void;
}

const priorityConfig = {
  urgent: {
    label: "Acil",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
  },
  high: {
    label: "Yüksek",
    className: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
  },
  medium: {
    label: "Orta",
    className: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
  },
  low: {
    label: "Düşük",
    className: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
  },
};

const statusConfig = {
  new: { 
    label: "Yeni", 
    className: "bg-muted text-muted-foreground",
    icon: Clock
  },
  assigned: { 
    label: "Atandı", 
    className: "bg-primary/10 text-primary",
    icon: User
  },
  in_progress: { 
    label: "Devam Ediyor", 
    className: "bg-warning/10 text-warning",
    icon: Wrench
  },
  completed: { 
    label: "Tamamlandı", 
    className: "bg-success/10 text-success",
    icon: Clock
  },
  cancelled: { 
    label: "İptal", 
    className: "bg-destructive/10 text-destructive",
    icon: Clock
  },
};

export const ServiceDetailModal = ({
  service,
  open,
  onClose,
}: ServiceDetailModalProps) => {
  const navigate = useNavigate();

  if (!service) return null;

  const priority = (service.service_priority || "medium") as keyof typeof priorityConfig;
  const status = (service.service_status || "new") as keyof typeof statusConfig;
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
      <DialogContent className="sm:max-w-lg border-border bg-card">
        <DialogHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold text-foreground truncate">
                {service.service_title || "İsimsiz Servis"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                #{service.service_number}
              </DialogDescription>
            </div>
          </div>
          
          {/* Badges */}
          <div className="flex items-center gap-2 mt-3">
            <Badge className={cn("border gap-1.5", priorityConfig[priority].className)}>
              <div className={cn("w-2 h-2 rounded-full", priorityConfig[priority].dot)} />
              {priorityConfig[priority].label}
            </Badge>
            <Badge className={cn("border-0", statusConfig[status].className)}>
              {statusConfig[status].label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Müşteri Bilgileri */}
          {customerData && (
            <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                Müşteri Bilgileri
              </h4>
              <div className="space-y-2">
                <p className="font-medium text-foreground">{customerData.name || "Bilinmiyor"}</p>
                {customerData.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-primary/60" />
                    {customerData.phone}
                  </p>
                )}
                {(customerData.address || service.service_location) && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary/60" />
                    {customerData.address || service.service_location}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tarih Bilgileri */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                <Calendar className="h-3 w-3" />
                Başlangıç
              </p>
              <p className="text-sm font-medium text-foreground">{issueDate}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                <Clock className="h-3 w-3" />
                Bitiş
              </p>
              <p className="text-sm font-medium text-foreground">{dueDate}</p>
            </div>
          </div>

          {/* Açıklama */}
          {service.service_request_description && (
            <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                </div>
                Açıklama
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {service.service_request_description}
              </p>
            </div>
          )}

          {/* Teknisyen Bilgisi */}
          {service.technician_name && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <Wrench className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Atanan Teknisyen</span>
              </div>
              <span className="text-sm font-medium text-foreground">{service.technician_name}</span>
            </div>
          )}
        </div>

        {/* Aksiyonlar */}
        <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-border">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleEdit}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
          >
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
          <Button 
            size="sm" 
            onClick={handleViewDetail}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Detaya Git
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
