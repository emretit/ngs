
import { Badge } from "@/components/ui/badge";
import { PurchaseOrderStatus } from "@/types/purchase";
import { capitalizeFirstLetter } from "@/utils/formatters";

interface OrderStatusBadgeProps {
  status: PurchaseOrderStatus;
}

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'draft':
        return 'Taslak';
      case 'sent':
        return 'Gönderildi';
      case 'confirmed':
        return 'Onaylandı';
      case 'partially_received':
        return 'Kısmen Teslim Alındı';
      case 'received':
        return 'Teslim Alındı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return capitalizeFirstLetter(status);
    }
  };

  const getStatusVariant = () => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'sent':
        return 'secondary';
      case 'confirmed':
        return 'secondary';
      case 'partially_received':
        return 'warning';
      case 'received':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Badge variant={getStatusVariant()}>{getStatusDisplay()}</Badge>
  );
};
