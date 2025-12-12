import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Wrench, Clock, CheckCircle, AlertTriangle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from "recharts";

interface ReportsServiceSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  searchParams: URLSearchParams;
}

const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
const STATUS_COLORS = { new: '#3b82f6', in_progress: '#f59e0b', assigned: '#8b5cf6', completed: '#22c55e' };

export default function ReportsServiceSection({ isExpanded, onToggle, searchParams }: ReportsServiceSectionProps) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // SLA Metrics with gauge data
  const { data: slaMetrics } = useQuery({
    queryKey: ['slaMetrics', startDate, endDate],
    queryFn: async () => {
      let query = supabase.from('service_requests').select('service_status, created_at, completed_at, service_priority');
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      const { data } = await query;
      
      if (!data) return { onTime: 0, total: 0, percentage: 0, gaugeData: [] };
      
      const completed = data.filter(r => r.service_status === 'completed');
      const onTime = completed.filter(r => {
        if (!r.completed_at) return false;
        const hours = (new Date(r.completed_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60);
        const sla = r.service_priority === 'high' ? 24 : r.service_priority === 'medium' ? 48 : 72;
        return hours <= sla;
      }).length;
      
      const percentage = completed.length > 0 ? (onTime / completed.length) * 100 : 0;
      return { 
        onTime, 
        total: completed.length, 
        percentage,
        gaugeData: [{ name: 'SLA', value: percentage, fill: percentage >= 80 ? '#22c55e' : percentage >= 60 ? '#f59e0b' : '#ef4444' }]
      };
    },
    enabled: isExpanded
  });

  // Average Close Time
  const { data: avgCloseTime } = useQuery({
    queryKey: ['avgCloseTime', startDate, endDate],
    queryFn: async () => {
      let query = supabase.from('service_requests').select('created_at, completed_at').eq('service_status', 'completed');
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      const { data } = await query;
      
      if (!data?.length) return 0;
      const totalHours = data.reduce((sum, r) => {
        if (!r.completed_at) return sum;
        return sum + (new Date(r.completed_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60);
      }, 0);
      return totalHours / data.length;
    },
    enabled: isExpanded
  });

  // Priority Distribution
  const { data: priorityDist } = useQuery({
    queryKey: ['priorityDist', startDate, endDate],
    queryFn: async () => {
      let query = supabase.from('service_requests').select('service_priority');
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      const { data } = await query;
      
      const counts = (data || []).reduce((acc: Record<string, number>, r) => {
        acc[r.service_priority || 'low'] = (acc[r.service_priority || 'low'] || 0) + 1;
        return acc;
      }, {});
      
      return [
        { name: 'Yüksek', value: counts.high || 0, fill: '#ef4444' },
        { name: 'Orta', value: counts.medium || 0, fill: '#f59e0b' },
        { name: 'Düşük', value: counts.low || 0, fill: '#22c55e' }
      ];
    },
    enabled: isExpanded
  });

  // Open Service Requests
  const { data: openRequests } = useQuery({
    queryKey: ['openServiceRequests'],
    queryFn: async () => {
      const { data, count } = await supabase
        .from('service_requests')
        .select('service_number, service_title, service_priority, created_at, service_status', { count: 'exact' })
        .in('service_status', ['new', 'in_progress', 'assigned'])
        .order('created_at', { ascending: false })
        .limit(5);
      return { items: data || [], count: count || 0 };
    },
    enabled: isExpanded
  });

  // Technician Performance
  const { data: techPerformance } = useQuery({
    queryKey: ['techPerformance', startDate, endDate],
    queryFn: async () => {
      let query = supabase.from('service_requests').select('assigned_to, service_status, employees(first_name, last_name)').eq('service_status', 'completed');
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      const { data } = await query;
      
      const techData = (data || []).reduce((acc: Record<string, { name: string; count: number }>, r) => {
        if (!r.assigned_to) return acc;
        const name = `${(r.employees as any)?.first_name || ''} ${(r.employees as any)?.last_name || ''}`.trim() || 'Bilinmiyor';
        if (!acc[r.assigned_to]) acc[r.assigned_to] = { name, count: 0 };
        acc[r.assigned_to].count++;
        return acc;
      }, {});
      
      return (Object.values(techData) as Array<{ name: string; count: number }>).sort((a, b) => b.count - a.count).slice(0, 5);
    },
    enabled: isExpanded
  });

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Wrench className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <span className="text-base font-semibold">Saha Servisi</span>
              {isExpanded && (
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={cn("text-xs", (slaMetrics?.percentage || 0) >= 80 ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600")}>
                    SLA: %{(slaMetrics?.percentage || 0).toFixed(0)}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-rose-500/10 text-rose-600 border-rose-500/20">
                    {openRequests?.count || 0} Açık
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* SLA Gauge + Avg Time */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                SLA Performansı
              </h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" barSize={12} data={slaMetrics?.gaugeData} startAngle={180} endAngle={0}>
                    <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'hsl(var(--muted))' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center -mt-8">
                <div className="text-2xl font-bold">{(slaMetrics?.percentage || 0).toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">{slaMetrics?.onTime || 0} / {slaMetrics?.total || 0} zamanında</div>
              </div>
              <div className="mt-4 p-3 bg-muted/30 rounded-lg text-center">
                <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <div className="text-lg font-bold">{(avgCloseTime || 0).toFixed(1)} saat</div>
                <div className="text-xs text-muted-foreground">Ort. Kapanma Süresi</div>
              </div>
            </div>

            {/* Priority Pie */}
            <div>
              <h4 className="font-medium text-sm mb-3 text-muted-foreground">Öncelik Dağılımı</h4>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={priorityDist} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                      {priorityDist?.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" />Yüksek</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Orta</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Düşük</span>
              </div>
            </div>

            {/* Technician Performance */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                Teknisyen Performansı
              </h4>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={techPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={60} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Open Requests List */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                Açık Talepler
              </h4>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {openRequests?.items.map((req, i) => (
                  <div key={i} className="p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{req.service_number}</div>
                        <div className="text-xs text-muted-foreground truncate">{req.service_title}</div>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px] shrink-0",
                        req.service_priority === 'high' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                        req.service_priority === 'medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      )}>
                        {req.service_priority === 'high' ? 'Yüksek' : req.service_priority === 'medium' ? 'Orta' : 'Düşük'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {!openRequests?.items.length && (
                  <div className="text-center py-8 text-emerald-600">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Açık talep yok</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
