import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import InfiniteScroll from "@/components/ui/infinite-scroll";
import { Warehouse } from "@/types/warehouse";
import { Warehouse as WarehouseIcon, MapPin, Phone, Mail } from "lucide-react";

interface WarehousesGridProps {
  warehouses: Warehouse[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  onWarehouseClick?: (warehouse: Warehouse) => void;
  onWarehouseSelect?: (warehouse: Warehouse) => void;
  selectedWarehouses?: Warehouse[];
}

const WarehousesGrid = ({
  warehouses,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  onWarehouseClick,
  onWarehouseSelect,
  selectedWarehouses = []
}: WarehousesGridProps) => {
  const navigate = useNavigate();

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'main':
        return 'Ana Depo';
      case 'sub':
        return 'Alt Depo';
      case 'virtual':
        return 'Sanal Depo';
      case 'transit':
        return 'Geçici Depo';
      default:
        return 'Depo';
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'main':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'sub':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'virtual':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'transit':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-[200px] w-full rounded-md mb-4" />
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (warehouses.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        Depo bulunamadı
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {warehouses.map((warehouse) => (
        <Card 
          key={warehouse.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onWarehouseClick?.(warehouse)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <WarehouseIcon className="h-5 w-5 text-green-600" />
                <h3 className="font-medium text-sm">{warehouse.name}</h3>
              </div>
              <Badge className={warehouse.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {warehouse.is_active ? "Aktif" : "Pasif"}
              </Badge>
            </div>
            <div className="space-y-2">
              {warehouse.code && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Kod:</span> {warehouse.code}
                </div>
              )}
              {warehouse.warehouse_type && (
                <div>
                  <Badge variant="outline" className={getTypeColor(warehouse.warehouse_type)}>
                    {getTypeLabel(warehouse.warehouse_type)}
                  </Badge>
                </div>
              )}
              {warehouse.address && (
                <div className="text-xs text-gray-600 flex items-start gap-1">
                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{warehouse.address}</span>
                </div>
              )}
              {warehouse.city && (
                <div className="text-xs text-gray-600">
                  {warehouse.city}{warehouse.district ? `, ${warehouse.district}` : ''}
                </div>
              )}
              {warehouse.manager_name && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Sorumlu:</span> {warehouse.manager_name}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Infinite Scroll Trigger */}
      <InfiniteScroll
        hasNextPage={hasNextPage}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        className="col-span-full mt-4"
      >
        <div />
      </InfiniteScroll>
    </div>
  );
};

export default WarehousesGrid;

