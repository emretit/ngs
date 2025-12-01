import { useMemo } from 'react';
import { TimeSlot } from '../types';
import { startOfDay, addHours, format, parseISO, differenceInMinutes } from 'date-fns';
import { ServiceRequest } from '@/hooks/useServiceRequests';

export const useTimelineCalculations = (selectedDate: Date) => {
  // Saatlik zaman dilimleri (08:00 - 20:00)
  const timeSlots = useMemo<TimeSlot[]>(() => {
    const slots: TimeSlot[] = [];
    const dayStart = startOfDay(selectedDate);
    
    for (let hour = 8; hour <= 20; hour++) {
      const time = addHours(dayStart, hour);
      slots.push({
        hour,
        minute: 0,
        label: format(time, 'HH:mm'),
      });
    }
    
    return slots;
  }, [selectedDate]);

  // Servis bloğunun pozisyonunu hesapla
  const calculateServicePosition = (
    service: ServiceRequest,
    rowWidth: number
  ): { left: number; width: number } | null => {
    if (!service.issue_date) return null;

    const issueDate = parseISO(service.issue_date);
    const dueDate = service.service_due_date 
      ? parseISO(service.service_due_date)
      : addHours(issueDate, 2); // Varsayılan 2 saat

    const dayStart = addHours(startOfDay(selectedDate), 8); // 08:00
    const dayEnd = addHours(startOfDay(selectedDate), 20);   // 20:00
    const totalMinutes = differenceInMinutes(dayEnd, dayStart); // 720 dakika (12 saat)

    // Başlangıç pozisyonu
    const startMinutes = differenceInMinutes(issueDate, dayStart);
    if (startMinutes < 0 || startMinutes > totalMinutes) return null;

    // Süre
    const duration = differenceInMinutes(dueDate, issueDate);
    const endMinutes = startMinutes + duration;

    // Piksel hesaplama
    const left = (startMinutes / totalMinutes) * rowWidth;
    const width = (duration / totalMinutes) * rowWidth;

    return {
      left: Math.max(0, left),
      width: Math.min(width, rowWidth - left),
    };
  };

  // Çakışan servisleri tespit et ve satırları düzenle
  const calculateServiceRows = (services: ServiceRequest[]) => {
    const rows: ServiceRequest[][] = [];
    
    services.forEach((service) => {
      if (!service.issue_date) return;
      
      const issueDate = parseISO(service.issue_date);
      const dueDate = service.service_due_date 
        ? parseISO(service.service_due_date)
        : addHours(issueDate, 2);

      // Çakışmayan ilk satırı bul
      let placed = false;
      for (const row of rows) {
        const hasOverlap = row.some((s) => {
          if (!s.issue_date) return false;
          const sIssue = parseISO(s.issue_date);
          const sDue = s.service_due_date 
            ? parseISO(s.service_due_date)
            : addHours(sIssue, 2);
          
          return !(dueDate <= sIssue || issueDate >= sDue);
        });

        if (!hasOverlap) {
          row.push(service);
          placed = true;
          break;
        }
      }

      if (!placed) {
        rows.push([service]);
      }
    });

    return rows;
  };

  return {
    timeSlots,
    calculateServicePosition,
    calculateServiceRows,
  };
};
