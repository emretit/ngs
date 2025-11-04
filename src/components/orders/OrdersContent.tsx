import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import OrdersTable from "./OrdersTable";
import OrdersKanbanBoard from "./kanban/OrdersKanbanBoard";
import { ViewType } from "./header/OrdersViewToggle";
import { useOrders, useOrdersInfiniteScroll } from "@/hooks/useOrders";
import { Order, OrderStatus } from "@/types/orders";
import { Loader2 } from "lucide-react";

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
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const pageSize = 20;
  
  // For table view, use infinite scroll
  const {
    data: orders,
    isLoading,
    isLoadingMore,
    hasNextPage,
    error,
    loadMore,
    refresh,
    totalCount,
  } = useOrdersInfiniteScroll(
    {
      status: selectedStatus,
      customer_id: selectedCustomer,
      search: searchQuery,
      dateRange: { from: null, to: null },
      page: 1,
      pageSize,
    },
    pageSize
  );

  // For kanban view, use the original hook
  const { orders: kanbanOrders, isLoading: kanbanLoading, error: kanbanError, updateStatusMutation } = useOrders();

  // Intersection Observer for infinite scroll (only for table view)
  useEffect(() => {
    if (activeView !== "table" || !loadMore || !hasNextPage || isLoadingMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasNextPage, isLoadingMore, isLoading, activeView]);

  // Refresh when filters change
  useEffect(() => {
    refresh();
  }, [searchQuery, selectedStatus, selectedCustomer]);

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

  if (error || kanbanError) {
    return (
      <div className="text-center p-8 text-red-600">
        <p>Hata oluştu: {(error || kanbanError)?.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
        >
          Sayfayı Yenile
        </button>
      </div>
    );
  }

  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      refresh(); // Refresh after status update
    } catch (error) {
      console.error("Sipariş durumu güncellenirken hata:", error);
      throw error;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        {activeView === "table" ? (
          <>
            <div className="-mx-4">
              <div className="px-4">
                <OrdersTable
                  orders={orders}
                  isLoading={isLoading}
                  onSelectOrder={onSelectOrder}
                  searchQuery={searchQuery}
                  selectedStatus={selectedStatus}
                  selectedCustomer={selectedCustomer}
                  onEditOrder={handleEditOrder}
                  onDeleteOrder={handleDeleteOrder}
                  onConvertToInvoice={handleConvertToInvoice}
                  onConvertToService={handleConvertToService}
                  onPrintOrder={handlePrintOrder}
                />
              </div>
            </div>
            
            {/* Infinite scroll trigger */}
            {hasNextPage && !isLoading && (
              <div ref={loadMoreRef} className="flex justify-center py-4">
                {isLoadingMore && (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">Daha fazla sipariş yükleniyor...</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Tüm siparişler yüklendi mesajı */}
            {!hasNextPage && orders.length > 0 && (
              <div className="text-center py-4 text-sm text-gray-500">
                Tüm siparişler yüklendi ({totalCount || orders.length} sipariş)
              </div>
            )}
          </>
        ) : (
          <OrdersKanbanBoard
            orders={kanbanOrders}
            onOrderClick={onSelectOrder}
            onEdit={handleEditOrder}
            onDelete={handleDeleteOrder}
            onConvertToInvoice={handleConvertToInvoice}
            onConvertToService={handleConvertToService}
            onPrint={handlePrintOrder}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}
      </div>
    </div>
  );
};

export default OrdersContent;