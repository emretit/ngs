import { useState, useCallback } from 'react';
import { DraggedService } from '../types';

export const useDispatchDragDrop = () => {
  const [draggedService, setDraggedService] = useState<DraggedService | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((service: DraggedService) => {
    setDraggedService(service);
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedService(null);
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((
    technicianId: string,
    startTime: Date,
    onDropComplete: (serviceId: string, technicianId: string, startTime: Date) => void
  ) => {
    if (draggedService) {
      onDropComplete(draggedService.service.id, technicianId, startTime);
      handleDragEnd();
    }
  }, [draggedService, handleDragEnd]);

  return {
    draggedService,
    isDragging,
    handleDragStart,
    handleDragEnd,
    handleDrop,
  };
};
