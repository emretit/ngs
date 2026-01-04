import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useInvoicePaymentStatus } from "@/hooks/useInvoicePaymentStatus";
import { formatCurrency } from "@/utils/formatters";

interface InvoicePaymentStatusBadgeProps {
  invoiceId: string;
  invoiceType: "sales" | "purchase";
  showAmount?: boolean;
  className?: string;
}

export const InvoicePaymentStatusBadge = ({
  invoiceId,
  invoiceType,
  showAmount = false,
  className,
}: InvoicePaymentStatusBadgeProps) => {
  const { data: status, isLoading } = useInvoicePaymentStatus(invoiceId, invoiceType);

  if (isLoading || !status) {
    return (
      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${className || ""}`}>
        <Clock className="h-3 w-3 mr-1" />
        Yükleniyor...
      </Badge>
    );
  }

  const getStatusConfig = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = status.dueDate ? new Date(status.dueDate) : null;
    if (dueDate) {
      dueDate.setHours(0, 0, 0, 0);
    }
    const isOverdue = dueDate && dueDate < today;

    switch (status.status) {
      case "odendi":
        return {
          label: "Kapandı",
          variant: "default" as const,
          icon: CheckCircle2,
          className: "bg-green-500 hover:bg-green-600 text-white",
        };
      case "kismi_odendi":
        return {
          label: isOverdue ? "Kısmi Ödendi (Vadesi Geçti)" : "Kısmi Ödendi",
          variant: "secondary" as const,
          icon: Clock,
          className: isOverdue 
            ? "bg-red-500 hover:bg-red-600 text-white" 
            : "bg-orange-500 hover:bg-orange-600 text-white",
        };
      case "odenmedi":
        return {
          label: isOverdue ? "Vadesi Geçmiş" : "Açık",
          variant: isOverdue ? "destructive" as const : "secondary" as const,
          icon: isOverdue ? XCircle : Clock,
          className: isOverdue 
            ? "bg-red-500 hover:bg-red-600 text-white" 
            : "bg-blue-500 hover:bg-blue-600 text-white",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`text-[10px] px-1.5 py-0 ${config.className} ${className || ""}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
      {showAmount && status.status === "kismi_odendi" && (
        <span className="ml-1">
          ({formatCurrency(status.paidAmount)} / {formatCurrency(status.totalAmount)})
        </span>
      )}
    </Badge>
  );
};

