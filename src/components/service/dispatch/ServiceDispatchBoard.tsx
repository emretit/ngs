import { useState, useMemo } from "react";
import { UnassignedServicesPanel } from "./UnassignedServicesPanel";
import { FSMTimelineGrid } from "./FSMTimelineGrid";
import { TimelineHeader } from "./TimelineHeader";
import { ServiceDetailModal } from "./ServiceDetailModal";
import { useDispatchDragDrop } from "./hooks/useDispatchDragDrop";
import { DispatchTechnician, Technician, ViewMode, DraggedService } from "./types";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { startOfDay, endOfDay, isWithinInterval, startOfWeek, endOfWeek } from "date-fns";
import { useNavigate } from "react-router-dom";

interface ServiceDispatchBoardProps {
  serviceRequests: ServiceRequest[];
  technicians: Technician[];
  onSelectService: (service: ServiceRequest) => void;
  onUpdateAssignment: (
    serviceId: string,
    technicianId: string,
    startTime: Date,
    endTime: Date
  ) => void;
}

export const ServiceDispatchBoard = ({
  serviceRequests,
  technicians,
  onSelectService,
  onUpdateAssignment,
}: ServiceDispatchBoardProps) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Drag & Drop hook
  const { draggedService, isDragging, handleDragStart, handleDragEnd, handleDrop } = useDispatchDragDrop();

  // Teknisyenlere günlük ve haftalık servis sayılarını ekle
  const dispatchTechnicians = useMemo<DispatchTechnician[]>(() => {
    const today = new Date();
    const dayStart = startOfDay(today);
    const dayEnd = endOfDay(today);
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    return technicians.map((tech) => {
      const techServices = serviceRequests.filter(
        (s) => s.assigned_technician === tech.id
      );

      const todayServices = techServices.filter((s) => {
        if (!s.issue_date) return false;
        const issueDate = new Date(s.issue_date);
        return isWithinInterval(issueDate, { start: dayStart, end: dayEnd });
      });

      const weekServices = techServices.filter((s) => {
        if (!s.issue_date) return false;
        const issueDate = new Date(s.issue_date);
        return isWithinInterval(issueDate, { start: weekStart, end: weekEnd });
      });

      // Durum hesaplama
      let status: DispatchTechnician['status'] = 'available';
      if (todayServices.length >= 3) status = 'busy';
      if (tech.status === 'pasif') status = 'offline';

      return {
        ...tech,
        todayServiceCount: todayServices.length,
        weekServiceCount: weekServices.length,
        status,
      };
    });
  }, [technicians, serviceRequests]);

  // Tarih navigasyonu
  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Atanmamış servisler
  const unassignedServices = useMemo(() => {
    return serviceRequests.filter(
      (s) => !s.assigned_technician && s.service_status !== 'completed' && s.service_status !== 'cancelled'
    );
  }, [serviceRequests]);

  // Drag start handler
  const handleServiceDragStart = (service: ServiceRequest) => {
    const dragData: DraggedService = {
      service,
      type: 'unassigned',
    };
    handleDragStart(dragData);
  };

  // Drop handler - teknisyene servis ata
  const handleServiceDrop = async (serviceId: string, technicianId: string, startTime: Date) => {
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 2);

    await onUpdateAssignment(
      serviceId,
      technicianId,
      startTime,
      endTime
    );
  };

  // Servis seçimi - modal aç
  const handleSelectService = (service: ServiceRequest) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  // Harita sayfasına git
  const handleMapClick = () => {
    navigate("/service/map");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header: Tarih, Görünüm, Arama */}
      <TimelineHeader
        selectedDate={selectedDate}
        viewMode={viewMode}
        technicianCount={dispatchTechnicians.length}
        unassignedCount={unassignedServices.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onPreviousDay={handlePreviousDay}
        onNextDay={handleNextDay}
        onToday={handleToday}
        onViewModeChange={setViewMode}
        onMapClick={handleMapClick}
      />

      {/* Ana Layout: 2 Kolon (Atanmamış + Timeline) */}
      <div className="flex-1 flex min-h-0">
        {/* Sol: Atanmamış Servisler Paneli */}
        <UnassignedServicesPanel
          services={unassignedServices}
          onSelectService={handleSelectService}
          onDragStart={handleServiceDragStart}
        />

        {/* Sağ: FSM Timeline Grid */}
        <div className="flex-1 min-w-0">
          <FSMTimelineGrid
            technicians={dispatchTechnicians}
            services={serviceRequests}
            selectedDate={selectedDate}
            searchTerm={searchTerm}
            onSelectService={handleSelectService}
            onDropService={(technicianId, time) => {
              handleDrop(technicianId, time, handleServiceDrop);
            }}
          />
        </div>
      </div>

      {/* Servis Detay Modal */}
      <ServiceDetailModal
        service={selectedService}
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedService(null);
        }}
      />
    </div>
  );
};
