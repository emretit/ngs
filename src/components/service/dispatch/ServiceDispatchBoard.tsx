import { useState, useMemo } from "react";
import { UnassignedServicesPanel } from "./UnassignedServicesPanel";
import { FSMTimelineGrid } from "./FSMTimelineGrid";
import { WeeklyTimelineGrid } from "./WeeklyTimelineGrid";
import { TimelineHeader } from "./TimelineHeader";
import { ServiceDetailModal } from "./ServiceDetailModal";
import { useDispatchDragDrop } from "./hooks/useDispatchDragDrop";
import { DispatchTechnician, Technician, ViewMode, DraggedService } from "./types";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { startOfDay, endOfDay, isWithinInterval, startOfWeek, endOfWeek, parseISO, isSameDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

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
  const { draggedService, isDragging, handleDragStart, handleDragEnd, handleDrop, handleUnassignDrop } = useDispatchDragDrop();

  // Teknisyenlere günlük ve haftalık servis sayılarını ekle
  const dispatchTechnicians = useMemo<DispatchTechnician[]>(() => {
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

    return technicians.map((tech) => {
      const techServices = serviceRequests.filter(
        (s) => s.assigned_technician === tech.id
      );

      const todayServices = techServices.filter((s) => {
        // Önce service_due_date, yoksa issue_date kullan
        const dateToCheck = s.service_due_date || s.issue_date;
        if (!dateToCheck) return false;
        const serviceDate = parseISO(dateToCheck);
        return isSameDay(serviceDate, selectedDate);
      });

      const weekServices = techServices.filter((s) => {
        const dateToCheck = s.service_due_date || s.issue_date;
        if (!dateToCheck) return false;
        const serviceDate = parseISO(dateToCheck);
        return isWithinInterval(serviceDate, { start: weekStart, end: weekEnd });
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
  }, [technicians, serviceRequests, selectedDate]);

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

  // Drag start handler - atanmamış servis
  const handleServiceDragStart = (service: ServiceRequest) => {
    const dragData: DraggedService = {
      service,
      type: 'unassigned',
    };
    handleDragStart(dragData);
  };

  // Drag start handler - atanmış servis (timeline'dan)
  const handleAssignedServiceDragStart = (service: ServiceRequest) => {
    const dragData: DraggedService = {
      service,
      type: 'assigned',
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

  // Unassign handler - servisi atanmamışlara geri taşı
  const handleServiceUnassign = async (serviceId: string) => {
    // technicianId'yi boş string olarak geçirerek atamayı kaldır
    await onUpdateAssignment(
      serviceId,
      '', // boş string = atama kaldır
      new Date(),
      new Date()
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
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-background rounded-xl border border-border shadow-sm overflow-hidden">
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

      {/* Ana Layout: 2 Kolon (Timeline + Atanmamış) - Resizable */}
      <PanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* Sol: Timeline Grid (Günlük veya Haftalık) */}
        <Panel defaultSize={75} minSize={40} className="min-w-0">
          {viewMode === "day" ? (
            <FSMTimelineGrid
              technicians={dispatchTechnicians}
              services={serviceRequests}
              selectedDate={selectedDate}
              searchTerm={searchTerm}
              onSelectService={handleSelectService}
              onDropService={(technicianId, time) => {
                handleDrop(technicianId, time, handleServiceDrop);
              }}
              onDragStartService={handleAssignedServiceDragStart}
            />
          ) : (
            <WeeklyTimelineGrid
              technicians={dispatchTechnicians}
              services={serviceRequests}
              selectedDate={selectedDate}
              searchTerm={searchTerm}
              onSelectService={handleSelectService}
            />
          )}
        </Panel>

        {/* Resizable Handle */}
        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors relative group">
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-border group-hover:bg-primary transition-colors" />
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 cursor-col-resize" />
        </PanelResizeHandle>

        {/* Sağ: Atanmamış Servisler Paneli */}
        <Panel defaultSize={25} minSize={20} maxSize={50} className="min-w-0">
          <UnassignedServicesPanel
            services={unassignedServices}
            onSelectService={handleSelectService}
            onDragStart={handleServiceDragStart}
            onDropUnassign={() => handleUnassignDrop(handleServiceUnassign)}
            isDraggingAssigned={isDragging && draggedService?.type === 'assigned'}
          />
        </Panel>
      </PanelGroup>

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
