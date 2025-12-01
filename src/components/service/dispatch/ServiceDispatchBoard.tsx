import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { TechnicianSidebar } from "./TechnicianSidebar";
import { TimelineGrid } from "./TimelineGrid";
import { TechnicianDetailPanel } from "./TechnicianDetailPanel";
import { UnassignedServicesBacklog } from "./UnassignedServicesBacklog";
import { useDispatchDragDrop } from "./hooks/useDispatchDragDrop";
import { DispatchTechnician, Technician, ViewMode, DraggedService } from "./types";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { startOfDay, endOfDay, isWithinInterval, startOfWeek, endOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);

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

      // Durum hesaplama - basit mantık
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

  // Seçilen teknisyen
  const selectedTechnician = useMemo(() => {
    if (!selectedTechnicianId) return null;
    return dispatchTechnicians.find((t) => t.id === selectedTechnicianId) || null;
  }, [selectedTechnicianId, dispatchTechnicians]);

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
    // Bitiş zamanını hesapla (varsayılan 2 saat)
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 2);

    // Parent callback'i çağır
    await onUpdateAssignment(
      serviceId,
      technicianId,
      startTime,
      endTime
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Toolbar */}
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Sol: Tarih Navigasyonu */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Bugün
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 ml-4">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {selectedDate.toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Orta: Görünüm Modu */}
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("day")}
            >
              Gün
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("week")}
            >
              Hafta
            </Button>
          </div>

          {/* Sağ: İstatistikler */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              {dispatchTechnicians.length} Teknisyen
            </Badge>
            <Badge variant="outline">
              {unassignedServices.length} Atanmamış
            </Badge>
            <Button variant="outline" size="sm">
              <MapPin className="h-4 w-4 mr-2" />
              Harita
            </Button>
          </div>
        </div>
      </Card>

      {/* Ana Layout: 3 Kolon */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Sol: Teknisyen Listesi */}
        <TechnicianSidebar
          technicians={dispatchTechnicians}
          selectedTechnicianId={selectedTechnicianId}
          onSelectTechnician={setSelectedTechnicianId}
        />

        {/* Orta: Timeline Grid */}
        <div className="flex-1 min-w-0">
          <TimelineGrid
            technicians={dispatchTechnicians}
            services={serviceRequests}
            selectedDate={selectedDate}
            onSelectService={onSelectService}
            onDropService={(technicianId, time) => {
              handleDrop(technicianId, time, handleServiceDrop);
            }}
          />
        </div>

        {/* Sağ: Detay Paneli */}
        <TechnicianDetailPanel
          technician={selectedTechnician}
          services={serviceRequests}
          selectedDate={selectedDate}
          onSelectService={onSelectService}
        />
      </div>

      {/* Alt: Atanmamış Servisler */}
      {unassignedServices.length > 0 && (
        <UnassignedServicesBacklog
          services={unassignedServices}
          onSelectService={onSelectService}
          onDragStart={handleServiceDragStart}
        />
      )}
    </div>
  );
};
