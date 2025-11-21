import { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { WorkOrder, WorkOrderStatus } from '@/types/production';
import { formatDate } from '@/utils/dateUtils';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import WorkOrderDetailPanel from './WorkOrderDetailPanel';

interface WorkOrdersCalendarProps {
  workOrders: WorkOrder[];
  searchQuery?: string;
  statusFilter?: string;
  onSelectWorkOrder?: (workOrder: WorkOrder) => void;
  onEditWorkOrder?: (workOrder: WorkOrder) => void;
}

// Setup the localizer for react-big-calendar
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1, locale: tr }),
  getDay,
  locales: { 'tr': tr },
});

const statusColors: Record<WorkOrderStatus, string> = {
  draft: '#9ca3af', // gray-400
  planned: '#3b82f6', // blue-500
  in_progress: '#f97316', // orange-500
  completed: '#22c55e', // green-500
  cancelled: '#ef4444', // red-500
};

const WorkOrdersCalendar = ({
  workOrders,
  searchQuery,
  statusFilter,
  onSelectWorkOrder,
  onEditWorkOrder
}: WorkOrdersCalendarProps) => {
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filter work orders based on search and filters
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter(wo => {
      const matchesSearch = !searchQuery || 
        wo.order_number?.toString().includes(searchQuery.toLowerCase()) ||
        wo.bom_name?.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesStatus = statusFilter === "all" || !statusFilter || wo.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [workOrders, searchQuery, statusFilter]);

  // Convert work orders to Calendar events
  const calendarEvents = useMemo(() => {
    return filteredWorkOrders
      .filter(wo => wo.planned_start_date || wo.planned_end_date) // Only show work orders with planned dates
      .map(wo => {
        // Eğer başlangıç tarihi varsa onu kullan, yoksa bitiş tarihini kullan
        const startDate = wo.planned_start_date 
          ? new Date(wo.planned_start_date) 
          : (wo.planned_end_date ? new Date(wo.planned_end_date) : new Date());
        
        // Eğer bitiş tarihi varsa onu kullan, yoksa başlangıç tarihinden 1 gün sonra
        const endDate = wo.planned_end_date 
          ? new Date(wo.planned_end_date) 
          : new Date(new Date(startDate).getTime() + 24 * 60 * 60 * 1000);

        return {
          id: wo.id,
          title: `${wo.order_number || 'N/A'}: ${wo.bom_name || 'Ürün'}`,
          start: startDate,
          end: endDate,
          resource: {
            workOrder: wo,
            status: wo.status,
            color: statusColors[wo.status] || statusColors.planned
          }
        };
      });
  }, [filteredWorkOrders]);

  const handleSelectEvent = (event: any) => {
    const workOrder = event.resource.workOrder as WorkOrder;
    setSelectedWorkOrder(workOrder);
    setIsDetailOpen(true);
    
    if (onSelectWorkOrder) {
      onSelectWorkOrder(workOrder);
    }
  };

  const eventStyleGetter = (event: any) => {
    return {
      style: {
        backgroundColor: event.resource.color,
        borderColor: event.resource.color,
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '2px 4px',
        fontSize: '12px'
      }
    };
  };

  const handleCloseDetail = () => {
    setSelectedWorkOrder(null);
    setIsDetailOpen(false);
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="month"
          step={60}
          showMultiDayTimes
          messages={{
            today: 'Bugün',
            previous: 'Geri',
            next: 'İleri',
            month: 'Ay',
            week: 'Hafta',
            day: 'Gün',
            agenda: 'Ajanda',
          }}
          formats={{
            dayRangeHeaderFormat: ({ start, end }) =>
              `${formatDate(start, 'dd/MM')} - ${formatDate(end, 'dd/MM')}`
          }}
        />
      </div>

      <WorkOrderDetailPanel
        workOrder={selectedWorkOrder}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onEdit={onEditWorkOrder}
      />
    </div>
  );
};

export default WorkOrdersCalendar;

