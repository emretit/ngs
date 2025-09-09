
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
          className: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
          label: "Active"
        };
      case 'pasif':
        return {
          className: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
          label: "Inactive"
        };
      default:
        return {
          className: "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200",
          label: status
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};
