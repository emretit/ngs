import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OrdersPageHeader from "@/components/orders/header/OrdersPageHeader";
import OrdersFilterBar from "@/components/orders/filters/OrdersFilterBar";
import OrdersContent from "@/components/orders/OrdersContent";
import { ViewType } from "@/components/orders/header/OrdersViewToggle";
import { Order } from "@/types/orders";
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
  const handleCreateOrder = () => {
    navigate("/orders/new");
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
        <OrdersContent
          searchQuery={searchQuery}
          selectedStatus={selectedStatus}
          selectedCustomer={selectedCustomer}
          onSelectOrder={handleSelectOrder}
          activeView={activeView}
        />
      </div>
  );
};
export default OrdersList;
