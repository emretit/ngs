
import { Badge } from "@/components/ui/badge";
import type { EmployeeStatus } from "@/types/employee";

interface StatusBadgeProps {
  status: EmployeeStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusConfig = (status: EmployeeStatus) => {
    switch (status) {
      case 'aktif':
        return {
          className: "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-200/50 shadow-sm",
          label: "🟢 Aktif"
        };
      case 'pasif':
        return {
          className: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200/50 shadow-sm",
          label: "⚪ Pasif"
        };
      default:
        return {
          className: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200/50 shadow-sm",
          label: status
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant="outline" className={`px-3 py-1.5 text-sm font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
};
