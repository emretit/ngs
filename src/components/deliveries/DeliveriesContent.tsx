import React from "react";
import DeliveriesTable from "./DeliveriesTable";
import { Delivery } from "@/types/deliveries";

interface DeliveriesContentProps {
  deliveries: Delivery[];
  isLoading: boolean;
  error: any;
  onSelectDelivery: (delivery: Delivery) => void;
  searchQuery?: string;
  statusFilter?: string;
}

const DeliveriesContent = ({
  deliveries,
  isLoading,
  error,
  onSelectDelivery,
  searchQuery,
  statusFilter
}: DeliveriesContentProps) => {
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">Teslimatlar yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 bg-white rounded-xl relative overflow-hidden">
        <div className="relative z-10">
          <DeliveriesTable
            deliveries={deliveries}
            isLoading={isLoading}
            onSelectDelivery={onSelectDelivery}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
          />
        </div>
      </div>
    </div>
  );
};

export default DeliveriesContent;
