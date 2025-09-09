import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TechnicianCard } from './TechnicianCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useServiceRequests, ServiceRequest } from '@/hooks/useServiceRequests';
import { 
  User, 
  Calendar,
  Activity
} from 'lucide-react';
import moment from 'moment';
import 'moment/locale/tr';

interface Technician {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department: string;
  skills?: string[];
  location?: string;
  shift_start?: string;
  shift_end?: string;
  availability_status?: 'available' | 'busy' | 'offline' | 'break';
}

interface ResourceViewProps {
  onAssignTask?: (technicianId: string, serviceRequest: ServiceRequest) => void;
  compact?: boolean;
}

export const ResourceView: React.FC<ResourceViewProps> = ({ onAssignTask, compact = false }) => {
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const { data: serviceRequests } = useServiceRequests();

  // Teknisyenleri getir
  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('department', 'Teknik');
      
      if (error) throw error;
      return data as Technician[];
    },
  });

  // Her teknisyen için gün bazlı iş yükü hesapla
  const technicianWorkload = useMemo(() => {
    if (!technicians || !serviceRequests) return [];

    return technicians.map(technician => {
      const assignedTasks = serviceRequests.filter(
        req => req.assigned_to === technician.id && 
               req.due_date && 
               moment(req.due_date).format('YYYY-MM-DD') === selectedDate
      );

      const completedTasks = assignedTasks.filter(task => task.status === 'completed');
      const pendingTasks = assignedTasks.filter(task => ['new', 'assigned', 'in_progress'].includes(task.status));
      const urgentTasks = assignedTasks.filter(task => task.priority === 'urgent');

      // Kapasiteyi hesapla (8 saatlik vardiya varsayımı)
      const totalHours = 8;
      const estimatedHours = assignedTasks.length * 2; // Her görev için 2 saat varsayımı
      const utilizationRate = Math.min((estimatedHours / totalHours) * 100, 100);

      return {
        ...technician,
        assignedTasks,
        completedTasks,
        pendingTasks,
        urgentTasks,
        utilizationRate,
        status: getAvailabilityStatus(utilizationRate, assignedTasks),
      };
    });
  }, [technicians, serviceRequests, selectedDate]);

  function getAvailabilityStatus(utilization: number, tasks: ServiceRequest[]) {
    const hasUrgentTasks = tasks.some(task => task.priority === 'urgent');
    
    if (hasUrgentTasks) return 'urgent';
    if (utilization >= 90) return 'overloaded';
    if (utilization >= 70) return 'busy';
    if (utilization >= 30) return 'moderate';
    return 'available';
  }

  if (!technicians) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-spin" />
            <p className="text-gray-500">Teknisyenler yükleniyor...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Header */}
        <div className="text-sm font-semibold text-gray-700 mb-2">
          Teknisyenler
        </div>
        <div className="text-xs text-gray-500 mb-3">
          İş Saatleri: 08:00 - 18:00
        </div>
        
        {/* Compact Technician List */}
        <div className="space-y-2">
          {technicianWorkload.slice(0, 5).map((technician) => (
            <div key={technician.id} className="bg-white rounded-lg p-3 border">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {technician.first_name[0]}{technician.last_name[0]}
                </div>
                
                {/* Info */}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {technician.first_name} {technician.last_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {technician.assignedTasks.length} servis
                    {technician.completedTasks.length > 0 && (
                      <span> • {technician.completedTasks.length} tamamlandı</span>
                    )}
                  </div>
                </div>
                
                {/* Status indicator */}
                <div className={`w-2 h-2 rounded-full ${
                  technician.status === 'available' ? 'bg-green-500' :
                  technician.status === 'busy' ? 'bg-orange-500' :
                  'bg-red-500'
                }`} />
              </div>
            </div>
          ))}
        </div>
        
        {technicianWorkload.length > 5 && (
          <div className="text-center text-xs text-gray-500">
            +{technicianWorkload.length - 5} teknisyen daha...
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Teknisyen Kaynakları</h3>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            />
            <Badge variant="outline" className="text-xs">
              {moment(selectedDate).format('DD MMM YYYY')}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Teknisyen Listesi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {technicianWorkload.map((technician) => (
          <TechnicianCard
            key={technician.id}
            technician={technician}
            onAssignTask={(technicianId) => {
              onAssignTask?.(technicianId, technician.assignedTasks[0]); // Example usage
            }}
            onViewDetails={(technicianId) => {
              console.log('View details for technician:', technicianId);
            }}
          />
        ))}
      </div>

      {/* Özet İstatistikler */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {technicianWorkload.filter(t => t.status === 'available').length}
            </div>
            <div className="text-sm text-gray-600">Müsait</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {technicianWorkload.filter(t => t.status === 'moderate').length}
            </div>
            <div className="text-sm text-gray-600">Orta Yük</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {technicianWorkload.filter(t => t.status === 'busy').length}
            </div>
            <div className="text-sm text-gray-600">Meşgul</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {technicianWorkload.filter(t => t.status === 'overloaded').length}
            </div>
            <div className="text-sm text-gray-600">Aşırı Yük</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-700">
              {technicianWorkload.reduce((sum, t) => sum + t.urgentTasks.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Acil Görev</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
