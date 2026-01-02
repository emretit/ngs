import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OrdersTable from "./OrdersTable";
import OrdersKanbanBoard from "./kanban/OrdersKanbanBoard";
import { ViewType } from "./header/OrdersViewToggle";
import { useOrders } from "@/hooks/useOrders";
import { Order, OrderStatus } from "@/types/orders";
import { Loader2 } from "lucide-react";
import InfiniteScroll from "@/components/ui/infinite-scroll";

interface OrdersContentProps {
  orders: Order[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  error?: any;
  searchQuery: string;
  selectedStatus: string | OrderStatus | "all";
  selectedCustomer: string;
  onSelectOrder: (order: Order) => void;
  activeView: ViewType;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const OrdersContent = ({
  orders,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  totalCount,
  error,
  searchQuery,
  selectedStatus,
  selectedCustomer,
  onSelectOrder,
  activeView,
  sortField,
  sortDirection,
  onSort
}: OrdersContentProps) => {
  const navigate = useNavigate();

  // For kanban view, use the original hook
  const { orders: kanbanOrders, isLoading: kanbanLoading, error: kanbanError, updateStatusMutation, refetch: refetchKanban } = useOrders();

  const handleSelectOrder = (order: Order) => {
    if (onSelectOrder) {
      onSelectOrder(order);
    }
  };

  const handleEditOrder = (order: Order) => {
    navigate(`/orders/edit/${order.id}`);
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

  if ((error || kanbanError) && activeView === "kanban") {
    const errorObj = error || kanbanError;
    const errorMessage = typeof errorObj === 'string' 
      ? errorObj 
      : errorObj instanceof Error 
      ? errorObj.message 
      : 'Bilinmeyen bir hata oluştu';
      
    return (
      <div className="text-center p-8 text-red-600">
        <p>Hata oluştu: {errorMessage}</p>
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
      // Mutation already invalidates queries, but we can manually refetch kanban if needed
      if (activeView === "kanban" && refetchKanban) {
        refetchKanban();
      }
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
                  isLoading={false}
                  onSelectOrder={onSelectOrder}
                  searchQuery={searchQuery}
                  selectedStatus={selectedStatus}
                  selectedCustomer={selectedCustomer}
                  onEditOrder={handleEditOrder}
                  onDeleteOrder={handleDeleteOrder}
                  onConvertToInvoice={handleConvertToInvoice}
                  onConvertToService={handleConvertToService}
                  onPrintOrder={handlePrintOrder}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              </div>
            </div>
            
            {/* Infinite scroll trigger - OrdersTable InfiniteScroll kullanmıyor, bu yüzden burada gösteriyoruz */}
            {hasNextPage && !isLoading && (
              <div className="px-4">
                <InfiniteScroll
                  hasNextPage={hasNextPage}
                  isLoadingMore={isLoadingMore}
                  onLoadMore={loadMore || (() => {})}
                  className="mt-4"
                >
                  <div />
                </InfiniteScroll>
              </div>
            )}
            
            {/* Tüm siparişler yüklendi mesajı */}
            {!hasNextPage && orders.length > 0 && !isLoading && (
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