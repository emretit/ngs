import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Wrench, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReportsServiceSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  searchParams: URLSearchParams;
}

export default function ReportsServiceSection({ isExpanded, onToggle, searchParams }: ReportsServiceSectionProps) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const { data: slaMetrics } = useQuery({
    queryKey: ['slaMetrics', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('service_requests')
        .select('service_status, created_at, completed_at, service_priority');
        
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      
      const { data } = await query;
      
      if (!data) return { onTime: 0, total: 0, percentage: 0 };
      
      const completed = data.filter(req => req.service_status === 'completed');
      // Assuming SLA is 24 hours for high priority, 48 for medium, 72 for low
      const onTime = completed.filter(req => {
        if (!req.completed_at) return false;
        const createdAt = new Date(req.created_at);
        const completedAt = new Date(req.completed_at);
        const hoursSpent = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        const slaHours = req.service_priority === 'high' ? 24 : 
                        req.service_priority === 'medium' ? 48 : 72;
        return hoursSpent <= slaHours;
      }).length;
      
      return {
        onTime,
        total: completed.length,
        percentage: completed.length > 0 ? (onTime / completed.length) * 100 : 0
      };
    },
    enabled: isExpanded
  });

  const { data: avgCloseTime } = useQuery({
    queryKey: ['avgCloseTime', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('service_requests')
        .select('created_at, completed_at')
        .eq('service_status', 'completed');
        
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      
      const { data } = await query;
      
      if (!data || data.length === 0) return 0;
      
      const totalHours = data.reduce((sum, req) => {
        if (!req.completed_at) return sum;
        const createdAt = new Date(req.created_at);
        const completedAt = new Date(req.completed_at);
        return sum + (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      }, 0);
      
      return totalHours / data.length;
    },
    enabled: isExpanded
  });

  const { data: partsVsLabor } = useQuery({
    queryKey: ['partsVsLabor', startDate, endDate],
    queryFn: async () => {
      // Note: This would need parts and labor cost fields in service_requests
      // For now, returning placeholder data
      return {
        parts: 60,
        labor: 40,
        comment: "Parça ve işçilik maliyet ayrımı için service_requests tablosuna parts_cost ve labor_cost alanları gerekli"
      };
    },
    enabled: isExpanded
  });

  const { data: openServiceRequests } = useQuery({
    queryKey: ['openServiceRequests'],
    queryFn: async () => {
      const { data } = await supabase
        .from('service_requests')
        .select('service_number, service_title, service_priority, created_at')
        .in('service_status', ['new', 'in_progress', 'assigned'])
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: isExpanded
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Saha Servisi Raporları
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* SLA Performance */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                SLA Performansı
              </h4>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {slaMetrics?.percentage.toFixed(1) || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {slaMetrics?.onTime || 0} / {slaMetrics?.total || 0} zamanında
                  </div>
                </div>
              </div>
            </div>

            {/* Average Close Time */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Ort. Kapanma Süresi
              </h4>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {(avgCloseTime || 0).toFixed(1)} saat
                </div>
              </div>
            </div>

            {/* Parts vs Labor */}
            <div>
              <h4 className="font-semibold mb-3">Parça vs İşçilik</h4>
              <div className="space-y-3">
                {partsVsLabor?.comment ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-800">{partsVsLabor.comment}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm">Parça</span>
                      <span className="font-medium">{partsVsLabor?.parts || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">İşçilik</span>
                      <span className="font-medium">{partsVsLabor?.labor || 0}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Open Service Requests */}
            <div>
              <h4 className="font-semibold mb-3">Açık Servis Talepleri</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {openServiceRequests?.map((request, index) => (
                  <div key={index} className="p-2 bg-muted/50 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium">{request.service_number}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {request.service_title}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        request.service_priority === 'high' ? 'bg-red-100 text-red-800' :
                        request.service_priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {request.service_priority}
                      </span>
                    </div>
                  </div>
                ))}
                {!openServiceRequests?.length && (
                  <p className="text-sm text-muted-foreground">Açık servis talebi yok</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}