
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { InvoiceStatus, PurchaseOrderStatus, PurchaseRequestStatus } from "@/types/purchase";

type BadgeSize = "default" | "sm";

// Status configuration for different badge types
const invoiceStatusConfig: Record<InvoiceStatus, { color: string, label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Ödeme Bekliyor" },
  paid: { color: "bg-green-100 text-green-800", label: "Ödendi" },
  partially_paid: { color: "bg-blue-100 text-blue-800", label: "Kısmen Ödendi" },
  overdue: { color: "bg-red-100 text-red-800", label: "Gecikmiş" },
  cancelled: { color: "bg-gray-100 text-gray-800", label: "İptal Edildi" }
};

const orderStatusConfig: Record<PurchaseOrderStatus, { color: string, label: string }> = {
  draft: { color: "bg-gray-100 text-gray-800", label: "Taslak" },
  sent: { color: "bg-blue-100 text-blue-800", label: "Gönderildi" },
  confirmed: { color: "bg-green-100 text-green-800", label: "Onaylandı" },
  received: { color: "bg-purple-100 text-purple-800", label: "Teslim Alındı" },
  partially_received: { color: "bg-yellow-100 text-yellow-800", label: "Kısmen Teslim Alındı" },
  cancelled: { color: "bg-red-100 text-red-800", label: "İptal Edildi" }
};

const requestStatusConfig: Record<PurchaseRequestStatus, { color: string, label: string }> = {
  draft: { color: "bg-gray-100 text-gray-800", label: "Taslak" },
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Beklemede" },
  approved: { color: "bg-green-100 text-green-800", label: "Onaylandı" },
  rejected: { color: "bg-red-100 text-red-800", label: "Reddedildi" },
  converted: { color: "bg-blue-100 text-blue-800", label: "Siparişe Dönüştürüldü" }
};

// Invoice Status Badge
interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  size?: BadgeSize;
  className?: string;
}

export const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ 
  status, 
  size = "default",
  className 
}) => {
  const config = invoiceStatusConfig[status];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.color,
        size === "sm" ? "text-xs py-0 px-2" : "",
        className
      )}
    >
      {config.label}
    </Badge>
  );
};

// Purchase Order Status Badge
interface OrderStatusBadgeProps {
  status: PurchaseOrderStatus;
  size?: BadgeSize;
  className?: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ 
  status, 
  size = "default",
  className 
}) => {
  const config = orderStatusConfig[status];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.color,
        size === "sm" ? "text-xs py-0 px-2" : "",
        className
      )}
    >
      {config.label}
    </Badge>
  );
};

// Purchase Request Status Badge
interface RequestStatusBadgeProps {
  status: PurchaseRequestStatus;
  size?: BadgeSize;
  className?: string;
}

export const RequestStatusBadge: React.FC<RequestStatusBadgeProps> = ({ 
  status, 
  size = "default",
  className 
}) => {
  const config = requestStatusConfig[status];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.color,
        size === "sm" ? "text-xs py-0 px-2" : "",
        className
      )}
    >
      {config.label}
    </Badge>
  );
};
