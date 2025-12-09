import { useMemo } from 'react';
import { TimeSlot } from '../types';
import { startOfDay, addHours, format, parseISO, differenceInMinutes } from 'date-fns';
import { ServiceRequest } from '@/hooks/useServiceRequests';

export const useTimelineCalculations = (selectedDate: Date) => {
  // Saatlik zaman dilimleri (00:00 - 23:00) - Tam 24 saat
  const timeSlots = useMemo<TimeSlot[]>(() => {
    const slots: TimeSlot[] = [];
    const dayStart = startOfDay(selectedDate);
    
    for (let hour = 0; hour <= 23; hour++) {
      const time = addHours(dayStart, hour);
      slots.push({
        hour,
        minute: 0,
        label: format(time, 'HH'),
      });
    }
    
    return slots;
  }, [selectedDate]);

  // Servis bloğunun pozisyonunu hesapla
  const calculateServicePosition = (
    service: ServiceRequest,
    rowWidth: number
  ): { left: number; width: number } | null => {
    // service_due_date ana tarih olarak kullanılıyor
    const serviceDateStr = service.service_due_date || service.issue_date;
    if (!serviceDateStr) return null;

    const serviceDate = parseISO(serviceDateStr);
    
    // Servis süresi: varsayılan 2 saat
    const estimatedDuration = service.estimated_duration || 120; // dakika

    const dayStart = startOfDay(selectedDate); // 00:00
    const dayEnd = addHours(startOfDay(selectedDate), 24);   // 24:00 (ertesi gün 00:00)
    const totalMinutes = 24 * 60; // 1440 dakika (24 saat)

    // Başlangıç pozisyonu
    const startMinutes = differenceInMinutes(serviceDate, dayStart);
    
    // Gün dışındaki servisleri gösterme
    if (startMinutes < 0 || startMinutes >= totalMinutes) return null;

    // Süre hesaplama
    const duration = Math.min(estimatedDuration, totalMinutes - startMinutes);

    // Piksel hesaplama
    const left = (startMinutes / totalMinutes) * rowWidth;
    const width = (duration / totalMinutes) * rowWidth;

    return {
      left: Math.max(0, left),
      width: Math.max(Math.min(width, rowWidth - left), 40), // Minimum 40px genişlik
    };
  };

  // Çakışan servisleri tespit et ve satırları düzenle
  const calculateServiceRows = (services: ServiceRequest[]) => {
    const rows: ServiceRequest[][] = [];
    
    // Servisleri başlangıç saatine göre sırala
    const sortedServices = [...services].sort((a, b) => {
      const dateA = a.service_due_date || a.issue_date;
      const dateB = b.service_due_date || b.issue_date;
      if (!dateA || !dateB) return 0;
      return parseISO(dateA).getTime() - parseISO(dateB).getTime();
    });
    
    sortedServices.forEach((service) => {
      const serviceDateStr = service.service_due_date || service.issue_date;
      if (!serviceDateStr) return;
      
      const serviceStart = parseISO(serviceDateStr);
      const estimatedDuration = service.estimated_duration || 120;
      const serviceEnd = addHours(serviceStart, estimatedDuration / 60);

      // Çakışmayan ilk satırı bul
      let placed = false;
      for (const row of rows) {
        const hasOverlap = row.some((s) => {
          const sDateStr = s.service_due_date || s.issue_date;
          if (!sDateStr) return false;
          
          const sStart = parseISO(sDateStr);
          const sDuration = s.estimated_duration || 120;
          const sEnd = addHours(sStart, sDuration / 60);
          
          // Çakışma kontrolü
          return !(serviceEnd <= sStart || serviceStart >= sEnd);
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
