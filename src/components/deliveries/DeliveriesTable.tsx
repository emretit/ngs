import { useState } from "react";
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
import { Edit2, Trash2, Package, MoreHorizontal, Truck, MapPin } from "lucide-react";
import { Delivery, DeliveryStatus, ShippingMethod } from "@/types/deliveries";
import DeliveriesTableHeader from "./table/DeliveriesTableHeader";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface DeliveriesTableProps {
  deliveries: Delivery[];
  isLoading: boolean;
  onSelectDelivery: (delivery: Delivery) => void;
  searchQuery?: string;
  statusFilter?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const DeliveriesTable = ({
  deliveries,
  isLoading,
  onSelectDelivery,
  searchQuery,
  statusFilter,
  sortField: externalSortField,
  sortDirection: externalSortDirection,
  onSort: externalOnSort
}: DeliveriesTableProps) => {
  // Fallback için internal state (eğer dışarıdan prop geçilmezse)
  const [internalSortField, setInternalSortField] = useState<string>('planlanan_tarih');
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Dışarıdan prop geçilmişse onu kullan, yoksa internal state kullan
  const sortField = externalSortField ?? internalSortField;
  const sortDirection = externalSortDirection ?? internalSortDirection;

  // Columns definition
  const columns = [
    { id: 'teslimat_no', label: 'Teslimat No', visible: true, sortable: true },
    { id: 'musteri', label: 'Müşteri', visible: true, sortable: true },
    { id: 'planlanan_tarih', label: 'Planlanan Tarih', visible: true, sortable: true },
    { id: 'teslim_tarihi', label: 'Teslim Tarihi', visible: true, sortable: true },
    { id: 'sevkiyat', label: 'Sevkiyat', visible: true, sortable: false },
    { id: 'durum', label: 'Durum', visible: true, sortable: false },
    { id: 'actions', label: 'İşlemler', visible: true, sortable: false }
  ];

  // Handle sort
  const handleSort = (field: string) => {
    // Eğer dışarıdan onSort prop'u geçilmişse onu kullan (veritabanı seviyesinde sıralama)
    if (externalOnSort) {
      externalOnSort(field);
    } else {
      // Fallback: client-side sıralama
      if (field === internalSortField) {
        setInternalSortDirection(internalSortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setInternalSortField(field);
        setInternalSortDirection('asc');
      }
    }
  };

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

  // Filter deliveries
  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = !searchQuery ||
      delivery.delivery_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (delivery.customer?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (delivery.customer?.company?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (delivery.tracking_number?.toLowerCase() || "").includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Eğer dışarıdan sıralama geçilmişse (veritabanı seviyesinde sıralama), 
  // client-side sıralama YAPMA çünkü veriler zaten sıralı geliyor.
  // Aksi halde fallback olarak client-side sıralama yap.
  const sortedDeliveries = externalOnSort 
    ? filteredDeliveries // Veritabanından sıralı geliyor, tekrar sıralama
    : [...filteredDeliveries].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'teslimat_no':
          aValue = a.delivery_number || '';
          bValue = b.delivery_number || '';
          break;
        case 'musteri':
          aValue = a.customer?.company || a.customer?.name || '';
          bValue = b.customer?.company || b.customer?.name || '';
          break;
        case 'planlanan_tarih':
          aValue = a.planned_delivery_date ? new Date(a.planned_delivery_date).getTime() : 0;
          bValue = b.planned_delivery_date ? new Date(b.planned_delivery_date).getTime() : 0;
          break;
        case 'teslim_tarihi':
          aValue = a.actual_delivery_date ? new Date(a.actual_delivery_date).getTime() : 0;
          bValue = b.actual_delivery_date ? new Date(b.actual_delivery_date).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
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
        <DeliveriesTableHeader
          columns={columns}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          hasSelection={false}
        />
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <DeliveriesTableHeader
        columns={columns}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        hasSelection={false}
      />
      <TableBody>
        {sortedDeliveries.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
              Bu kriterlere uygun teslimat bulunamadı
            </TableCell>
          </TableRow>
        ) : (
          sortedDeliveries.map((delivery) => (
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
              <TableCell className="py-1 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDelivery(delivery);
                    }}
                    className="h-8 w-8"
                    title="Düzenle"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: onDelete eklenmeli
                    }}
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 w-8"
                        title="Daha Fazla"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Dropdown içeriği eklenecek */}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
