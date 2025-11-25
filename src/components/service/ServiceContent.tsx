import { useState } from "react";
import ServicesTable from "./table/ServicesTable";
import type { ServiceRequest } from "@/hooks/service/types";
import { useNavigate } from "react-router-dom";

interface ServiceContentProps {
  services: ServiceRequest[];
  isLoading: boolean;
  searchQuery: string;
  selectedStatus: string | null;
  selectedPriority: string | null;
  selectedTechnician: string | null;
  selectedServices?: ServiceRequest[];
  onToggleServiceSelection?: (service: ServiceRequest) => void;
  onSelectAll?: (checked: boolean) => void;
}

const ServiceContent = ({ 
  services,
  isLoading,
  searchQuery, 
  selectedStatus, 
  selectedPriority,
  selectedTechnician,
  selectedServices = [],
  onToggleServiceSelection,
  onSelectAll
}: ServiceContentProps) => {
  const navigate = useNavigate();

  const handleSelectService = (service: ServiceRequest) => {
    navigate(`/service/edit/${service.id}`);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        <div className="-mx-4">
          <div className="px-4">
            <ServicesTable
              services={services}
              isLoading={isLoading}
              onSelectService={handleSelectService}
              searchQuery={searchQuery}
              selectedStatus={selectedStatus}
              selectedPriority={selectedPriority}
              selectedTechnician={selectedTechnician}
              selectedServices={selectedServices}
              onToggleServiceSelection={onToggleServiceSelection}
              onSelectAll={onSelectAll}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceContent;

