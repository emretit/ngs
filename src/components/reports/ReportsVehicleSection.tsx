import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Car, Fuel, Calendar, AlertTriangle, Gauge, Wrench } from "lucide-react";
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface ReportsVehicleSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  searchParams: URLSearchParams;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ReportsVehicleSection({ isExpanded, onToggle, searchParams }: ReportsVehicleSectionProps) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // Fleet Summary
  const { data: fleetSummary } = useQuery({
    queryKey: ['fleetSummary'],
    queryFn: async () => {
      const { data } = await supabase.from('vehicles').select('status');
      const statusCounts = (data || []).reduce((acc: Record<string, number>, v) => {
        acc[v.status || 'active'] = (acc[v.status || 'active'] || 0) + 1;
        return acc;
      }, {});
      
      return {
        total: data?.length || 0,
        active: statusCounts.active || statusCounts.aktif || 0,
        maintenance: statusCounts.maintenance || statusCounts.bakımda || 0,
        inactive: statusCounts.inactive || statusCounts.pasif || 0,
        pieData: [
          { name: 'Aktif', value: statusCounts.active || statusCounts.aktif || 0, fill: '#22c55e' },
          { name: 'Bakımda', value: statusCounts.maintenance || statusCounts.bakımda || 0, fill: '#f59e0b' },
          { name: 'Pasif', value: statusCounts.inactive || statusCounts.pasif || 0, fill: '#ef4444' }
        ].filter(d => d.value > 0)
      };
    },
    enabled: isExpanded
  });

  // Fuel Trend
  const { data: fuelTrend } = useQuery({
    queryKey: ['fuelTrend', startDate, endDate],
    queryFn: async () => {
      let query = supabase.from('vehicle_fuel').select('fuel_date, total_cost, liters');
      if (startDate) query = query.gte('fuel_date', startDate);
      if (endDate) query = query.lte('fuel_date', endDate);
      const { data } = await query;
      
      const monthly = (data || []).reduce((acc: Record<string, { cost: number; liters: number }>, r: any) => {
        const month = new Date(r.fuel_date).toLocaleDateString('tr-TR', { month: 'short' });
        if (!acc[month]) acc[month] = { cost: 0, liters: 0 };
        acc[month].cost += r.total_cost || 0;
        acc[month].liters += r.liters || 0;
        return acc;
      }, {} as Record<string, { cost: number; liters: number }>);
      
      const total = (data || []).reduce((sum: number, r: any) => sum + (r.total_cost || 0), 0);
      
      return {
        chartData: Object.entries(monthly).map(([month, d]: [string, { cost: number; liters: number }]) => ({ month, maliyet: d.cost, litre: d.liters })),
        total
      };
    },
    enabled: isExpanded
  });

  // Maintenance Costs by Vehicle
  const { data: maintenanceCosts } = useQuery({
    queryKey: ['maintenanceCosts', startDate, endDate],
    queryFn: async () => {
      let query = supabase.from('vehicle_maintenance').select('cost, vehicles(plate_number)');
      if (startDate) query = query.gte('maintenance_date', startDate);
      if (endDate) query = query.lte('maintenance_date', endDate);
      const { data } = await query;
      
      const vehicleCosts = (data || []).reduce((acc: Record<string, number>, m: any) => {
        const plate = m.vehicles?.plate_number || 'Bilinmiyor';
        acc[plate] = (acc[plate] || 0) + (m.cost || 0);
        return acc;
      }, {} as Record<string, number>);
      
      const total = (Object.values(vehicleCosts) as number[]).reduce((sum: number, c: number) => sum + c, 0);
      
      return {
        chartData: Object.entries(vehicleCosts)
          .map(([name, value]: [string, number]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5),
        total
      };
    },
    enabled: isExpanded
  });

  // Expiring Documents
  const { data: expiringDocs } = useQuery({
    queryKey: ['expiringDocs'],
    queryFn: async () => {
      const threeMonths = new Date();
      threeMonths.setMonth(threeMonths.getMonth() + 3);
      
      const { data } = await supabase
        .from('vehicles')
        .select('plate_number, brand, model, insurance_expiry, inspection_expiry')
        .or(`insurance_expiry.lte.${threeMonths.toISOString().split('T')[0]},inspection_expiry.lte.${threeMonths.toISOString().split('T')[0]}`);
      
      const today = new Date();
      const items: Array<{ vehicle: string; type: string; date: string; days: number; urgent: boolean }> = [];
      
      (data || []).forEach(v => {
        if (v.insurance_expiry && new Date(v.insurance_expiry) <= threeMonths) {
          const days = Math.ceil((new Date(v.insurance_expiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          items.push({ vehicle: v.plate_number, type: 'Sigorta', date: v.insurance_expiry, days, urgent: days <= 30 });
        }
        if (v.inspection_expiry && new Date(v.inspection_expiry) <= threeMonths) {
          const days = Math.ceil((new Date(v.inspection_expiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          items.push({ vehicle: v.plate_number, type: 'Muayene', date: v.inspection_expiry, days, urgent: days <= 30 });
        }
      });
      
      return items.sort((a, b) => a.days - b.days);
    },
    enabled: isExpanded
  });

  const totalCost = (fuelTrend?.total || 0) + (maintenanceCosts?.total || 0);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 rounded-lg">
              <Car className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <span className="text-base font-semibold">Araç Filo</span>
              {isExpanded && (
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs">{fleetSummary?.total || 0} Araç</Badge>
                  <Badge variant="outline" className="text-xs">Maliyet: ₺{totalCost.toLocaleString('tr-TR')}</Badge>
                  {(expiringDocs?.filter(d => d.urgent).length || 0) > 0 && (
                    <Badge variant="outline" className="text-xs bg-rose-500/10 text-rose-600">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {expiringDocs?.filter(d => d.urgent).length} Acil
                    </Badge>
                  )}
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
            {/* Fleet Status Pie */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <Gauge className="h-4 w-4" />
                Filo Durumu
              </h4>
              <div className="text-center mb-2">
                <div className="text-2xl font-bold">{fleetSummary?.total || 0}</div>
                <div className="text-xs text-muted-foreground">Toplam Araç</div>
              </div>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={fleetSummary?.pieData || []} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value">
                      {fleetSummary?.pieData?.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Aktif</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Bakımda</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" />Pasif</span>
              </div>
            </div>

            {/* Fuel Trend Line */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <Fuel className="h-4 w-4" />
                Yakıt Maliyeti Trendi
              </h4>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fuelTrend?.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: number) => [`₺${v.toLocaleString('tr-TR')}`, 'Maliyet']} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="maliyet" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Maintenance by Vehicle */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <Wrench className="h-4 w-4" />
                Bakım Maliyetleri
              </h4>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={maintenanceCosts?.chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={60} />
                    <Tooltip formatter={(v: number) => [`₺${v.toLocaleString('tr-TR')}`, 'Maliyet']} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expiring Documents */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-rose-600">
                <AlertTriangle className="h-4 w-4" />
                Süresi Dolan Belgeler
              </h4>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {expiringDocs?.map((doc, i) => (
                  <div key={i} className={cn(
                    "p-2 rounded-lg border",
                    doc.urgent ? "bg-rose-500/10 border-rose-500/20" : "bg-amber-500/10 border-amber-500/20"
                  )}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{doc.vehicle}</div>
                        <div className="text-xs text-muted-foreground">{doc.type}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-medium">{new Date(doc.date).toLocaleDateString('tr-TR')}</div>
                        <div className={cn("text-xs", doc.urgent ? "text-rose-600" : "text-amber-600")}>
                          {doc.days <= 0 ? 'Süresi doldu' : `${doc.days} gün`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {!expiringDocs?.length && (
                  <div className="text-center py-8 text-emerald-600">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Yakın tarihte belge yok</p>
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
