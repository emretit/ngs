import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OrdersPageHeader from "@/components/orders/header/OrdersPageHeader";
import OrdersFilterBar from "@/components/orders/filters/OrdersFilterBar";
import OrdersContent from "@/components/orders/OrdersContent";
import { ViewType } from "@/components/orders/header/OrdersViewToggle";
import { Order } from "@/types/orders";
interface OrdersListProps {
  
  
}
const OrdersList = ({ isCollapsed, setIsCollapsed }: OrdersListProps) => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ViewType>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState("all");
  const handleCreateOrder = () => {
    navigate("/orders/create");
  };
  const handleSelectOrder = (order: Order) => {
    // TODO: Navigate to order detail page
    navigate(`/orders/${order.id}`);
  };
  return (
    <div className="space-y-6">
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
        {activeView === "table" ? (
          <OrdersContent
            searchQuery={searchQuery}
            selectedStatus={selectedStatus}
            selectedCustomer={selectedCustomer}
            onSelectOrder={handleSelectOrder}
            activeView={activeView}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-card via-muted/20 to-background rounded-2xl shadow-2xl border border-border/10">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <span className="text-2xl">🚧</span>
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground">
                Bu görünüm yakında gelecek
              </h3>
              <p className="text-muted-foreground">
                {activeView} görünümü henüz hazır değil.
              </p>
            </div>
          </div>
        )}
      </div>
  );
};
export default OrdersList;
