
import React, { useMemo } from "react";
import { useServiceRequests, ServiceRequest } from "@/hooks/useServiceRequests";
import { useTechnicianNames } from "./hooks/useTechnicianNames";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ServiceRequestCalendarProps {
  searchQuery: string;
  statusFilter: string | null;
  technicianFilter: string | null;
  onSelectRequest: (request: ServiceRequest) => void;
}

export const ServiceRequestCalendar: React.FC<ServiceRequestCalendarProps> = ({
  searchQuery,
  statusFilter,
  technicianFilter,
  onSelectRequest
}) => {
  const { data: serviceRequests } = useServiceRequests();
  const { getTechnicianName } = useTechnicianNames();

  // Filter service requests
  const filteredRequests = useMemo(() => {
    if (!serviceRequests) return [];

    return serviceRequests.filter(request => {
      // Filter by search query
      const matchesSearch = !searchQuery || 
        request.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (request.description && request.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filter by status
      const matchesStatus = !statusFilter || request.status === statusFilter;
      
      // Filter by technician
      const matchesTechnician = !technicianFilter || request.assigned_to === technicianFilter;
      
      return matchesSearch && matchesStatus && matchesTechnician;
    });
  }, [serviceRequests, searchQuery, statusFilter, technicianFilter]);

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'assigned': return 'secondary';
      case 'in_progress': return 'outline';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      case 'on_hold': return 'secondary';
      default: return 'outline';
    }
  };

  // Get priority badge variant
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (!serviceRequests) {
    return (
      <Card className="p-6 flex items-center justify-center h-96">
        <p>Servis talepleri yükleniyor...</p>
      </Card>
    );
  }

  if (filteredRequests.length === 0) {
    return (
      <Card className="p-6 flex items-center justify-center h-96">
        <p>Servis talebi bulunamadı.</p>
      </Card>
    );
  }

  return (
    <div className="bg-white rounded-md border p-4 min-h-[600px] shadow-sm">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Servis Talepleri Listesi</h3>
        </div>
        
        <div className="space-y-3">
          {filteredRequests.map((request) => (
            <Card 
              key={request.id} 
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectRequest(request)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{request.title}</h4>
                    <Badge variant={getStatusBadgeVariant(request.status)}>
                      {request.status}
                    </Badge>
                    <Badge variant={getPriorityBadgeVariant(request.priority)}>
                      {request.priority}
                    </Badge>
                  </div>
                  
                  {request.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {request.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {request.due_date && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(request.due_date), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </span>
                      </div>
                    )}
                    
                    {request.assigned_to && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{getTechnicianName(request.assigned_to)}</span>
                      </div>
                    )}
                    
                    {request.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{request.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
