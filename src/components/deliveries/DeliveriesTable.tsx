import React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Package, MoreHorizontal, Truck, MapPin } from "lucide-react";
import { Delivery, DeliveryStatus, ShippingMethod } from "@/types/deliveries";

interface DeliveriesTableProps {
  deliveries: Delivery[];
  isLoading: boolean;
  onSelectDelivery: (delivery: Delivery) => void;
  searchQuery?: string;
  statusFilter?: string;
}

const DeliveriesTable = ({
  deliveries,
  isLoading,
  onSelectDelivery,
  searchQuery,
  statusFilter
}: DeliveriesTableProps) => {
  // Metinleri kısalt
  const shortenText = (text: string, maxLength: number = 25) => {
    if (!text) return "";
    
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength - 3) + "...";
  };

  // Müşteri ismini kısalt
  const getShortenedCustomerName = (customerName: string) => {
    return shortenText(customerName, 35);
  };

  // Filter deliveries based on criteria
  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = !searchQuery || 
      delivery.delivery_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (delivery.customer?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (delivery.customer?.company?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (delivery.tracking_number?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-orange-500 text-orange-700">⏳ Bekleyen</Badge>;
      case 'prepared':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">📦 Hazırlanan</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="border-purple-500 text-purple-700">🚚 Kargoda</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="border-green-500 text-green-700">✅ Teslim Edildi</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-red-500 text-red-700">❌ İptal</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getShippingMethodBadge = (method?: ShippingMethod) => {
    if (!method) return <span className="text-gray-500 text-xs">-</span>;
    
    switch (method) {
      case 'kargo':
        return <Badge variant="outline" className="border-purple-500 text-purple-700 text-xs">🚚 Kargo</Badge>;
      case 'sirket_araci':
        return <Badge variant="outline" className="border-blue-500 text-blue-700 text-xs">🚗 Şirket Aracı</Badge>;
      case 'musteri_alacak':
        return <Badge variant="outline" className="border-green-500 text-green-700 text-xs">👤 Müşteri Alacak</Badge>;
      case 'diger':
        return <Badge variant="outline" className="border-gray-500 text-gray-700 text-xs">📦 Diğer</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{method}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">📦 Teslimat No</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">🏢 Müşteri</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">📅 Planlanan Tarih</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">📅 Teslim Tarihi</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">🚚 Sevkiyat</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">📊 Durum</TableHead>
            <TableHead className="w-[50px] font-bold text-foreground/80 text-sm tracking-wide text-right">⚙️ İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-left">📦 Teslimat No</TableHead>
          <TableHead className="w-[25%] font-bold text-foreground/80 text-sm tracking-wide text-left">🏢 Müşteri</TableHead>
          <TableHead className="w-[12%] font-bold text-foreground/80 text-sm tracking-wide text-center">📅 Planlanan Tarih</TableHead>
          <TableHead className="w-[12%] font-bold text-foreground/80 text-sm tracking-wide text-center">📅 Teslim Tarihi</TableHead>
          <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-center">🚚 Sevkiyat</TableHead>
          <TableHead className="w-[12%] font-bold text-foreground/80 text-sm tracking-wide text-center">📊 Durum</TableHead>
          <TableHead className="w-[9%] font-bold text-foreground/80 text-sm tracking-wide text-right">⚙️ İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredDeliveries.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
              Bu kriterlere uygun teslimat bulunamadı
            </TableCell>
          </TableRow>
        ) : (
          filteredDeliveries.map((delivery) => (
            <TableRow 
              key={delivery.id} 
              onClick={() => onSelectDelivery(delivery)} 
              className="cursor-pointer hover:bg-blue-50 h-8"
            >
              <TableCell className="font-medium py-1 px-2 text-xs">
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3 text-blue-600" />
                  <span className="text-blue-600 font-semibold">
                    {delivery.delivery_number}
                  </span>
                </div>
                {delivery.order && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    Sipariş: {delivery.order.order_number}
                  </div>
                )}
              </TableCell>
              <TableCell className="py-1 px-2">
                {delivery.customer ? (
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-xs font-medium" title={delivery.customer.company || delivery.customer.name}>
                      {getShortenedCustomerName(delivery.customer.company || delivery.customer.name)}
                    </span>
                    {delivery.delivery_address && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{shortenText(delivery.delivery_address, 30)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-500 text-xs">-</span>
                )}
              </TableCell>
              <TableCell className="text-center py-1 px-1 text-xs">
                {delivery.planned_delivery_date ? (
                  format(new Date(delivery.planned_delivery_date), "dd MMM yyyy", { locale: tr })
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-center py-1 px-1 text-xs">
                {delivery.actual_delivery_date ? (
                  <span className="text-green-600 font-medium">
                    {format(new Date(delivery.actual_delivery_date), "dd MMM yyyy", { locale: tr })}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-center py-1 px-1">
                <div className="flex flex-col items-center gap-1">
                  {getShippingMethodBadge(delivery.shipping_method)}
                  {delivery.tracking_number && (
                    <span className="text-xs text-purple-600 font-mono" title={delivery.tracking_number}>
                      {shortenText(delivery.tracking_number, 15)}
                    </span>
                  )}
                  {delivery.carrier_name && (
                    <span className="text-xs text-gray-500">
                      {shortenText(delivery.carrier_name, 15)}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center py-1 px-1">
                {getStatusBadge(delivery.status)}
              </TableCell>
              <TableCell className="py-1 px-1">
                <div className="flex justify-end space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDelivery(delivery);
                    }}
                    className="h-6 w-6 hover:bg-blue-100"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 w-6 hover:bg-gray-100"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default DeliveriesTable;
