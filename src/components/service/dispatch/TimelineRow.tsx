import { useRef, useState, useEffect } from "react";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { ServiceBlock } from "./ServiceBlock";
import { DispatchTechnician } from "./types";
import { cn } from "@/lib/utils";
import { useTimelineCalculations } from "./hooks/useTimelineCalculations";
import { isSameDay, parseISO } from "date-fns";
import { Calendar } from "lucide-react";

interface TimelineRowProps {
  technician: DispatchTechnician;
  services: ServiceRequest[];
  selectedDate: Date;
  onSelectService: (service: ServiceRequest) => void;
  onDropService?: (technicianId: string, time: Date) => void;
  onDragStartService?: (service: ServiceRequest) => void;
  isDragOver?: boolean;
}

export const TimelineRow = ({
  technician,
  services,
  selectedDate,
  onSelectService,
  onDropService,
  onDragStartService,
  isDragOver,
}: TimelineRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [rowWidth, setRowWidth] = useState(0);
  const { calculateServicePosition, calculateServiceRows } = useTimelineCalculations(selectedDate);

  // Row genişliğini ölç
  useEffect(() => {
    if (rowRef.current) {
      const updateWidth = () => {
        setRowWidth(rowRef.current?.offsetWidth || 0);
      };
      updateWidth();
      
      const resizeObserver = new ResizeObserver(updateWidth);
      resizeObserver.observe(rowRef.current);
      
      return () => resizeObserver.disconnect();
    }
  }, []);

  // Bu teknisyene atanmış ve seçilen tarihteki servisleri filtrele
  // service_due_date kullanıyoruz (zaman çizelgesinde gösterilecek tarih)
  const technicianServices = services.filter((s) => {
    if (s.assigned_technician !== technician.id) return false;
    
    // Önce service_due_date, yoksa issue_date kullan
    const dateToCheck = s.service_due_date || s.issue_date;
    if (!dateToCheck) return false;
    
    const serviceDate = parseISO(dateToCheck);
    return isSameDay(serviceDate, selectedDate);
  });

  // Servisleri çakışmaya göre satırlara böl
  const serviceRows = calculateServiceRows(technicianServices);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!onDropService || !rowRef.current) return;

    // Drop pozisyonundan zamanı hesapla
    const rect = rowRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    
    // 00:00 - 24:00 arası (24 saat = 1440 dakika)
    const totalMinutes = 24 * 60;
    const minutesFromStart = percentage * totalMinutes;
    
    const dropTime = new Date(selectedDate);
    dropTime.setHours(Math.floor(minutesFromStart / 60));
    dropTime.setMinutes(Math.floor(minutesFromStart % 60));
    
    onDropService(technician.id, dropTime);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      ref={rowRef}
      className={cn(
        "relative h-full min-h-[80px] transition-colors",
        isDragOver && "bg-primary/10 ring-2 ring-primary ring-inset"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Servis blokları */}
      {serviceRows.map((row, rowIndex) =>
        row.map((service) => {
          const position = calculateServicePosition(service, rowWidth);
          if (!position) return null;

            return (
              <ServiceBlock
                key={service.id}
                service={service}
                style={{
                  left: `${position.left}px`,
                  width: `${Math.max(position.width, 100)}px`,
                  top: `${rowIndex * 24 + 4}px`,
                }}
                onClick={() => onSelectService(service)}
                onDragStart={() => onDragStartService?.(service)}
              />
            );
        })
      )}

      {/* Boş durum */}
      {technicianServices.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground/40 text-xs">
            <Calendar className="h-4 w-4" />
            <span>Bugün servis yok</span>
          </div>
        </div>
      )}
    </div>
  );
};
