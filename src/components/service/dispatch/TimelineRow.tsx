import { useRef, useState, useEffect } from "react";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { ServiceBlock } from "./ServiceBlock";
import { DispatchTechnician } from "./types";
import { cn } from "@/lib/utils";
import { useTimelineCalculations } from "./hooks/useTimelineCalculations";
import { isSameDay, parseISO } from "date-fns";

interface TimelineRowProps {
  technician: DispatchTechnician;
  services: ServiceRequest[];
  selectedDate: Date;
  onSelectService: (service: ServiceRequest) => void;
  onDropService?: (technicianId: string, time: Date) => void;
  isDragOver?: boolean;
}

export const TimelineRow = ({
  technician,
  services,
  selectedDate,
  onSelectService,
  onDropService,
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
  const technicianServices = services.filter((s) => {
    if (s.assigned_technician !== technician.id) return false;
    if (!s.issue_date) return false;
    
    const issueDate = parseISO(s.issue_date);
    return isSameDay(issueDate, selectedDate);
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
    
    // 08:00 - 20:00 arası (12 saat = 720 dakika)
    const totalMinutes = 12 * 60;
    const minutesFromStart = percentage * totalMinutes;
    
    const dropTime = new Date(selectedDate);
    dropTime.setHours(8 + Math.floor(minutesFromStart / 60));
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
        "relative h-20 border-b hover:bg-accent/5 transition-colors",
        isDragOver && "bg-accent/10 border-primary"
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
                width: `${position.width}px`,
                top: `${rowIndex * 20 + 2}px`,
              }}
              onClick={() => onSelectService(service)}
            />
          );
        })
      )}

      {/* Boş durum */}
      {technicianServices.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
          Servis yok
        </div>
      )}
    </div>
  );
};
