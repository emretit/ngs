import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OrdersPageHeader from "@/components/orders/header/OrdersPageHeader";
import OrdersFilterBar from "@/components/orders/filters/OrdersFilterBar";
import OrdersContent from "@/components/orders/OrdersContent";
import { ViewType } from "@/components/orders/header/OrdersViewToggle";
import { Order, OrderStatus } from "@/types/orders";
import { useOrdersInfiniteScroll } from "@/hooks/useOrders";
interface OrdersListProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}
const OrdersList = ({ isCollapsed, setIsCollapsed }: OrdersListProps) => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ViewType>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState("all");

  // Table view için infinite scroll hook
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
      status: (selectedStatus === "" ? "all" : selectedStatus) as OrderStatus | "all",
      customer_id: selectedCustomer,
      search: searchQuery,
      dateRange: { from: null, to: null },
      page: 1,
      pageSize: 20,
    },
    20
  );

  const handleCreateOrder = () => {
    navigate("/orders/new");
  };
  const handleSelectOrder = (order: Order) => {
    // TODO: Navigate to order detail page
    navigate(`/orders/${order.id}`);
  };
  return (
    <div className="space-y-2">
        {/* Header */}
        <OrdersPageHeader
          onCreateOrder={handleCreateOrder}
          activeView={activeView}
          setActiveView={setActiveView}
        />
        {/* Filters */}
        <OrdersFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
        />
        {/* Content */}
        {activeView === "table" && (
          isLoading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center space-y-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-muted-foreground">Siparişler yükleniyor...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-red-500">Siparişler yüklenirken bir hata oluştu</div>
            </div>
          ) : (
            <OrdersContent
              orders={orders}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              hasNextPage={hasNextPage}
              loadMore={loadMore}
              totalCount={totalCount}
              error={error}
              searchQuery={searchQuery}
              selectedStatus={selectedStatus}
              selectedCustomer={selectedCustomer}
              onSelectOrder={handleSelectOrder}
              activeView={activeView}
            />
          )
        )}
        {activeView === "kanban" && (
          <OrdersContent
            orders={[]}
            isLoading={false}
            isLoadingMore={false}
            hasNextPage={false}
            totalCount={0}
            error={null}
            searchQuery={searchQuery}
            selectedStatus={selectedStatus}
            selectedCustomer={selectedCustomer}
            onSelectOrder={handleSelectOrder}
            activeView={activeView}
          />
        )}
      </div>
  );
};
export default OrdersList;
