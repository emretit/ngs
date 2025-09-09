import { Table, TableBody } from "@/components/ui/table";
import { Order, OrderStatus } from "@/types/orders";
import { useState } from "react";
import { OrdersTableHeader } from "./table/OrdersTableHeader";
import { OrdersTableRow } from "./table/OrdersTableRow";

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
  onPrintOrder
}: OrdersTableProps) => {
  const [sortField, setSortField] = useState<string>("order_date");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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
    if (sortField === fieldId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(fieldId);
      setSortDirection('asc');
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

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue: any = a[sortField as keyof Order];
    let bValue: any = b[sortField as keyof Order];
    
    if (sortField === 'customer') {
      aValue = a.customer?.name || '';
      bValue = b.customer?.name || '';
    }
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-muted-foreground">Siparişler yükleniyor...</div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Henüz sipariş bulunmamaktadır.
      </div>
    );
  }

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
          {sortedOrders.map((order, index) => (
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersTable;