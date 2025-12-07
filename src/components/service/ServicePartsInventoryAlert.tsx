import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { ServicePartsInventoryService, LowStockAlert } from '@/services/servicePartsInventoryService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { AlertTriangle, Package, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ServicePartsInventoryAlert: React.FC = () => {
  const { userData } = useCurrentUser();
  const navigate = useNavigate();

  const { data: lowStockAlerts, isLoading } = useQuery({
    queryKey: ['low-stock-alerts', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      return ServicePartsInventoryService.getLowStockAlerts(userData.company_id);
    },
    enabled: !!userData?.company_id,
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  if (isLoading || !lowStockAlerts || lowStockAlerts.length === 0) {
    return null;
  }

  return (
    <Alert className="border-orange-500 bg-orange-50 mb-4">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="flex items-center justify-between">
        <span>Düşük Stok Uyarısı ({lowStockAlerts.length})</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/products?filter=low_stock')}
        >
          Görüntüle
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-1 mt-2">
          {lowStockAlerts.slice(0, 5).map((alert) => (
            <div
              key={alert.productId}
              className="flex items-center justify-between p-2 bg-orange-50 rounded text-sm"
            >
              <div className="flex items-center gap-2">
                <Package className="h-3 w-3 text-orange-600" />
                <span className="font-medium">{alert.productName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-orange-500 text-orange-700 bg-orange-50">
                  Stok: {alert.currentStock}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Min: {alert.minStockLevel}
                </span>
              </div>
            </div>
          ))}
          {lowStockAlerts.length > 5 && (
            <div className="text-xs text-muted-foreground mt-1">
              +{lowStockAlerts.length - 5} ürün daha
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};
















