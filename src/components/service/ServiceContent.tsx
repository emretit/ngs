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
  onSelectService?: (service: ServiceRequest) => void;
  technicians?: Array<{ id: string; first_name: string; last_name: string }>;
  onDeleteService?: (service: ServiceRequest) => void;
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
  onSelectAll,
  onSelectService,
  technicians = [],
  onDeleteService
}: ServiceContentProps) => {
  const navigate = useNavigate();

  const handleSelectService = (service: ServiceRequest) => {
    if (onSelectService) {
      onSelectService(service);
    } else {
      navigate(`/service/edit/${service.id}`);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
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
          technicians={technicians}
          onDeleteService={onDeleteService}
        />
      </div>
    </div>
  );
};

export default ServiceContent;

