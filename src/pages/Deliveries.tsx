import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import DeliveriesHeader from "@/components/deliveries/DeliveriesHeader";
import DeliveriesFilterBar from "@/components/deliveries/DeliveriesFilterBar";
import DeliveriesContent from "@/components/deliveries/DeliveriesContent";
import DeliveryForm from "@/components/deliveries/DeliveryForm";
import { useDeliveries } from "@/hooks/useDeliveries";
import { Delivery } from "@/types/deliveries";

interface DeliveriesProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const Deliveries = ({ isCollapsed, setIsCollapsed }: DeliveriesProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    deliveries, 
    isLoading, 
    filters, 
    setFilters,
  } = useDeliveries();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [shippingMethodFilter, setShippingMethodFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | undefined>(undefined);

  // Route kontrolü: /deliveries/new ise dialog'u aç
  useEffect(() => {
    if (location.pathname === "/deliveries/new") {
      const orderId = searchParams.get("orderId");
      const invoiceId = searchParams.get("invoiceId");
      setSelectedOrderId(orderId || undefined);
      setSelectedInvoiceId(invoiceId || undefined);
      setShowDeliveryForm(true);
      // URL'i temizle ama history'de kalsın (geri butonu için)
    }
  }, [location.pathname, searchParams]);

  // URL parametrelerinden orderId veya invoiceId al (eski yöntem için)
  useEffect(() => {
    const orderId = searchParams.get("orderId");
    const invoiceId = searchParams.get("invoiceId");
    if ((orderId || invoiceId) && location.pathname === "/deliveries") {
      setSelectedOrderId(orderId || undefined);
      setSelectedInvoiceId(invoiceId || undefined);
      setShowDeliveryForm(true);
      // URL'den parametreleri temizle
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, location.pathname]);

  const handleDeliveryClick = (delivery: Delivery) => {
    navigate(`/deliveries/${delivery.id}`);
  };

  const handleCreateDelivery = () => {
    setSelectedOrderId(undefined);
    setSelectedInvoiceId(undefined);
    setShowDeliveryForm(true);
  };

  const handleCloseDeliveryForm = () => {
    setShowDeliveryForm(false);
    setSelectedOrderId(undefined);
    setSelectedInvoiceId(undefined);
    // Eğer /deliveries/new route'undaysak, ana sayfaya yönlendir
    if (location.pathname === "/deliveries/new") {
      navigate("/deliveries", { replace: true });
    }
  };

  // Filtreleri hook'a aktar
  useEffect(() => {
    setFilters({
      ...filters,
      status: statusFilter === "all" ? undefined : statusFilter as any,
      shipping_method: shippingMethodFilter === "all" ? undefined : shippingMethodFilter as any,
      customer_id: customerFilter === "all" ? undefined : customerFilter,
      search: searchQuery,
      dateRange: {
        from: startDate || null,
        to: endDate || null,
      },
    });
  }, [searchQuery, statusFilter, shippingMethodFilter, customerFilter, startDate, endDate]);

  return (
    <>
      <div className="space-y-2">
        <DeliveriesHeader 
          deliveries={deliveries}
          onCreateDelivery={handleCreateDelivery}
        />
        <DeliveriesFilterBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedStatus={statusFilter}
          setSelectedStatus={setStatusFilter}
          selectedShippingMethod={shippingMethodFilter}
          setSelectedShippingMethod={setShippingMethodFilter}
          selectedCustomer={customerFilter}
          setSelectedCustomer={setCustomerFilter}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
        <DeliveriesContent
          deliveries={deliveries}
          isLoading={isLoading}
          error={null}
          onSelectDelivery={handleDeliveryClick}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
        />
      </div>

      {showDeliveryForm && (
        <DeliveryForm
          orderId={selectedOrderId}
          salesInvoiceId={selectedInvoiceId}
          onClose={handleCloseDeliveryForm}
        />
      )}
    </>
  );
};

export default Deliveries;