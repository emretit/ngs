import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OrdersTable from "./OrdersTable";
import { ViewType } from "./header/OrdersViewToggle";
import { useOrders } from "@/hooks/useOrders";
import { Order } from "@/types/orders";

interface OrdersContentProps {
  searchQuery: string;
  selectedStatus: string;
  selectedCustomer: string;
  onSelectOrder: (order: Order) => void;
  activeView: ViewType;
}

const OrdersContent = ({
  searchQuery,
  selectedStatus,
  selectedCustomer,
  onSelectOrder,
  activeView
}: OrdersContentProps) => {
  const navigate = useNavigate();
  const { orders, isLoading, error, filters, setFilters } = useOrders();

  // Local filters'ı hook filters ile senkronize et
  const handleFilterChange = (key: string, value: string) => {
    if (key === 'status') {
      setFilters(prev => ({ ...prev, status: value === 'all' ? 'all' : value as any }));
    } else if (key === 'customer_id') {
      setFilters(prev => ({ ...prev, customer_id: value === 'all' ? 'all' : value }));
    }
  };

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  // Search ve filter değişikliklerini hook'a yansıt
  if (searchQuery !== filters.search) {
    handleSearchChange(searchQuery);
  }

  if (selectedStatus !== filters.status) {
    handleFilterChange('status', selectedStatus);
  }

  if (selectedCustomer !== filters.customer_id) {
    handleFilterChange('customer_id', selectedCustomer);
  }

  const handleSelectOrder = (order: Order) => {
    if (onSelectOrder) {
      onSelectOrder(order);
    }
  };

  const handleEditOrder = (order: Order) => {
    // TODO: Navigate to edit page
    console.log("Edit order:", order);
  };

  const handleDeleteOrder = (orderId: string) => {
    // TODO: Show confirmation dialog and delete
    console.log("Delete order:", orderId);
  };

  const handleConvertToInvoice = (order: Order) => {
    // Navigate to invoice creation page with order data
    navigate(`/sales-invoices/create?orderId=${order.id}`);
  };

  const handleConvertToService = (order: Order) => {
    // TODO: Navigate to service creation
    console.log("Convert to service:", order);
  };

  const handlePrintOrder = (order: Order) => {
    // TODO: Open print dialog/PDF
    console.log("Print order:", order);
  };

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        <p>Hata oluştu: {error.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
        >
          Sayfayı Yenile
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-card via-muted/20 to-background rounded-2xl shadow-2xl border border-border/10 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-50"></div>
      <div className="relative z-10 p-8">
        {activeView === "table" ? (
          <OrdersTable
            orders={orders}
            isLoading={isLoading}
            onSelectOrder={handleSelectOrder}
            searchQuery={searchQuery}
            selectedStatus={selectedStatus}
            selectedCustomer={selectedCustomer}
            onEditOrder={handleEditOrder}
            onDeleteOrder={handleDeleteOrder}
            onConvertToInvoice={handleConvertToInvoice}
            onConvertToService={handleConvertToService}
            onPrintOrder={handlePrintOrder}
          />
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            <p>Kart görünümü yakında eklenecek...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersContent;