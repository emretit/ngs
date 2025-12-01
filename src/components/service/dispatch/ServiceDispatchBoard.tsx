import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { TechnicianSidebar } from "./TechnicianSidebar";
import { DispatchTechnician, Technician, ViewMode } from "./types";
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

        {/* Orta: Timeline Grid (Placeholder) */}
        <Card className="flex-1 p-6">
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <Calendar className="h-12 w-12 mx-auto opacity-50" />
              <p className="text-lg font-medium">Zaman Çizelgesi</p>
              <p className="text-sm">
                Timeline grid bileşeni bir sonraki adımda eklenecek
              </p>
            </div>
          </div>
        </Card>

        {/* Sağ: Detay Paneli */}
        <Card className="w-80 p-4">
          {selectedTechnician ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-bold text-primary">
                    {selectedTechnician.first_name[0]}
                    {selectedTechnician.last_name[0]}
                  </span>
                </div>
                <h3 className="font-semibold text-lg">
                  {selectedTechnician.first_name} {selectedTechnician.last_name}
                </h3>
                {selectedTechnician.position && (
                  <p className="text-sm text-muted-foreground">
                    {selectedTechnician.position}
                  </p>
                )}
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bugün:</span>
                  <span className="font-medium">
                    {selectedTechnician.todayServiceCount} servis
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bu Hafta:</span>
                  <span className="font-medium">
                    {selectedTechnician.weekServiceCount} servis
                  </span>
                </div>
              </div>

              <Button className="w-full" size="sm">
                Servis Ata
              </Button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-center">
              <p className="text-sm">
                Detayları görmek için bir teknisyen seçin
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Alt: Atanmamış Servisler (Placeholder) */}
      {unassignedServices.length > 0 && (
        <Card className="mt-4 p-4">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold">Atanmamış Servisler</h3>
            <Badge variant="secondary">{unassignedServices.length}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Backlog bileşeni bir sonraki adımda eklenecek
          </div>
        </Card>
      )}
    </div>
  );
};
