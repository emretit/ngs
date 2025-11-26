import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Status configurations for all modules
const STATUS_CONFIGS = {
  // Purchase Requests
  draft: { label: "Taslak", className: "bg-gray-100 text-gray-800 border-gray-300" },
  submitted: { label: "Onayda", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  approved: { label: "Onaylandı", className: "bg-green-100 text-green-800 border-green-300" },
  rejected: { label: "Reddedildi", className: "bg-red-100 text-red-800 border-red-300" },
  converted: { label: "Dönüştürüldü", className: "bg-blue-100 text-blue-800 border-blue-300" },

  // Purchase Orders
  confirmed: { label: "Onaylandı", className: "bg-green-100 text-green-800 border-green-300" },
  partial_received: { label: "Kısmi Teslim", className: "bg-blue-100 text-blue-800 border-blue-300" },
  received: { label: "Teslim Alındı", className: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  cancelled: { label: "İptal", className: "bg-red-100 text-red-800 border-red-300" },

  // Purchase Invoices
  pending: { label: "Beklemede", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  paid: { label: "Ödendi", className: "bg-green-100 text-green-800 border-green-300" },
  partially_paid: { label: "Kısmi Ödendi", className: "bg-blue-100 text-blue-800 border-blue-300" },
  overdue: { label: "Vadesi Geçti", className: "bg-red-100 text-red-800 border-red-300" },

  // RFQ
  sent: { label: "Gönderildi", className: "bg-blue-100 text-blue-800 border-blue-300" },
  quoted: { label: "Teklif Alındı", className: "bg-purple-100 text-purple-800 border-purple-300" },
  closed: { label: "Kapatıldı", className: "bg-gray-100 text-gray-800 border-gray-300" },

  // GRN
  putaway: { label: "Raflandı", className: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  returned: { label: "İade Edildi", className: "bg-orange-100 text-orange-800 border-orange-300" },

  // Vendor Invoice
  matched: { label: "Eşleşti", className: "bg-green-100 text-green-800 border-green-300" },
  posted: { label: "Kaydedildi", className: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  void: { label: "İptal", className: "bg-red-100 text-red-800 border-red-300" },

  // Service Requests
  new: { label: "Yeni", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  in_progress: { label: "Devam Ediyor", className: "bg-blue-100 text-blue-800 border-blue-300" },
  service_status_completed: { label: "Tamamlandı", className: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  service_status_cancelled: { label: "İptal Edildi", className: "bg-red-100 text-red-800 border-red-300" },

  // General
  active: { label: "Aktif", className: "bg-green-100 text-green-800 border-green-300" },
  inactive: { label: "Pasif", className: "bg-gray-100 text-gray-800 border-gray-300" },
  completed: { label: "Tamamlandı", className: "bg-emerald-100 text-emerald-800 border-emerald-300" },
} as const;

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, size = "md" }) => {
  const config = STATUS_CONFIGS[status as keyof typeof STATUS_CONFIGS] || {
    label: status,
    className: "bg-gray-100 text-gray-800 border-gray-300"
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };

  return (
    <Badge
      variant="outline"
      className={cn(config.className, sizeClasses[size], "font-medium", className)}
    >
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
