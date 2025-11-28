import { Table, TableBody } from "@/components/ui/table";
import { Order, OrderStatus } from "@/types/orders";
import { useState } from "react";
import { OrdersTableHeader } from "./table/OrdersTableHeader";
import { OrdersTableRow } from "./table/OrdersTableRow";
import OrdersTableEmpty from "./table/OrdersTableEmpty";

interface Column {
  id: string;
  label: string;
  sortable: boolean;
  visible: boolean;
}

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  onSelectOrder: (order: Order) => void;
  searchQuery: string;
  selectedStatus: string;
  selectedCustomer: string;
  onEditOrder?: (order: Order) => void;
  onDeleteOrder?: (orderId: string) => void;
  onConvertToInvoice?: (order: Order) => void;
  onConvertToService?: (order: Order) => void;
  onPrintOrder?: (order: Order) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const OrdersTable = ({
  orders,
  isLoading,
  onSelectOrder,
  searchQuery,
  selectedStatus,
  selectedCustomer,
  onEditOrder,
  onDeleteOrder,
  onConvertToInvoice,
  onConvertToService,
  onPrintOrder,
  sortField: externalSortField,
  sortDirection: externalSortDirection,
  onSort: externalOnSort
}: OrdersTableProps) => {
  // Fallback için internal state (eğer dışarıdan prop geçilmezse)
  const [internalSortField, setInternalSortField] = useState<string>("order_date");
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Dışarıdan prop geçilmişse onu kullan, yoksa internal state kullan
  const sortField = externalSortField ?? internalSortField;
  const sortDirection = externalSortDirection ?? internalSortDirection;

  const columns: Column[] = [
    { id: 'order_number', label: 'Sipariş No', sortable: true, visible: true },
    { id: 'customer', label: 'Müşteri', sortable: true, visible: true },
    { id: 'status', label: 'Durum', sortable: true, visible: true },
    { id: 'total_amount', label: 'Tutar', sortable: true, visible: true },
    { id: 'order_date', label: 'Sipariş Tarihi', sortable: true, visible: true },
    { id: 'delivery_date', label: 'Teslimat Tarihi', sortable: true, visible: true },
    { id: 'actions', label: 'İşlemler', sortable: false, visible: true },
  ];

  const handleSort = (fieldId: string) => {
    // Eğer dışarıdan onSort prop'u geçilmişse onu kullan (veritabanı seviyesinde sıralama)
    if (externalOnSort) {
      externalOnSort(fieldId);
    } else {
      // Fallback: client-side sıralama
      if (fieldId === internalSortField) {
        setInternalSortDirection(internalSortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setInternalSortField(fieldId);
        setInternalSortDirection('asc');
      }
    }
  };

  // Filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery || 
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !selectedStatus || selectedStatus === 'all' || order.status === selectedStatus;
    const matchesCustomer = !selectedCustomer || selectedCustomer === 'all' || order.customer_id === selectedCustomer;
    
    return matchesSearch && matchesStatus && matchesCustomer;
  });

  // Eğer dışarıdan sıralama geçilmişse (veritabanı seviyesinde sıralama), 
  // client-side sıralama YAPMA çünkü veriler zaten sıralı geliyor.
  // Aksi halde fallback olarak client-side sıralama yap.
  const sortedOrders = externalOnSort 
    ? filteredOrders // Veritabanından sıralı geliyor, tekrar sıralama
    : [...filteredOrders].sort((a, b) => {
    let aValue: any = a[sortField as keyof Order];
    let bValue: any = b[sortField as keyof Order];
    let isNullA = false;
    let isNullB = false;
    
    // Özel alanlar için değer çıkarımı
    if (sortField === 'customer') {
      aValue = a.customer?.name || '';
      bValue = b.customer?.name || '';
      isNullA = !a.customer?.name;
      isNullB = !b.customer?.name;
    } else if (sortField === 'order_date' || sortField === 'delivery_date') {
      // Tarih alanları için Date objesi kontrolü
      aValue = aValue ? new Date(aValue).getTime() : null;
      bValue = bValue ? new Date(bValue).getTime() : null;
      isNullA = !a[sortField as keyof Order];
      isNullB = !b[sortField as keyof Order];
    } else if (sortField === 'total_amount') {
      aValue = aValue ?? 0;
      bValue = bValue ?? 0;
      isNullA = a[sortField as keyof Order] == null;
      isNullB = b[sortField as keyof Order] == null;
    } else {
      isNullA = aValue == null;
      isNullB = bValue == null;
    }
    
    // Null değerleri en sona gönder
    if (isNullA && isNullB) return 0;
    if (isNullA) return 1; // A null ise B'den sonra
    if (isNullB) return -1; // B null ise A'dan sonra
    
    // Number karşılaştırması
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // String karşılaştırması - Türkçe karakter desteği ile
    const aString = String(aValue).toLowerCase();
    const bString = String(bValue).toLowerCase();
    const comparison = aString.localeCompare(bString, 'tr', { numeric: true, sensitivity: 'base' });
    
    return sortDirection === 'asc' ? comparison : -comparison;
      });

  return (
    <div className="overflow-x-auto">
      <Table className="border-collapse">
        <OrdersTableHeader 
          columns={columns} 
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
        <TableBody>
          {sortedOrders.length === 0 ? (
            <OrdersTableEmpty />
          ) : (
            sortedOrders.map((order, index) => (
              <OrdersTableRow
                key={order.id}
                order={order}
                index={index}
                onSelect={onSelectOrder}
                onEdit={onEditOrder}
                onDelete={onDeleteOrder}
                onConvertToInvoice={onConvertToInvoice}
                onConvertToService={onConvertToService}
                onPrint={onPrintOrder}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersTable;