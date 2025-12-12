import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Users, Calendar, Clock, UserPlus, UserMinus, Building2 } from "lucide-react";
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
  Cell
} from "recharts";

interface ReportsHRSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  searchParams: URLSearchParams;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ReportsHRSection({ isExpanded, onToggle, searchParams }: ReportsHRSectionProps) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // Headcount by Department
  const { data: departmentData } = useQuery({
    queryKey: ['departmentHeadcount'],
    queryFn: async () => {
      const { data } = await supabase.from('employees').select('department_id, is_active, departments(name)').eq('is_active', true);
      
      const deptCounts = (data || []).reduce((acc: Record<string, { name: string; count: number }>, emp: any) => {
        const deptName = emp.departments?.name || 'Tanımsız';
        if (!acc[deptName]) acc[deptName] = { name: deptName, count: 0 };
        acc[deptName].count++;
        return acc;
      }, {} as Record<string, { name: string; count: number }>);
      
      const chartData = (Object.values(deptCounts) as Array<{ name: string; count: number }>).sort((a, b) => b.count - a.count);
      return { 
        chartData: chartData.map((d, i) => ({ ...d, fill: COLORS[i % COLORS.length] })),
        total: chartData.reduce((sum, d) => sum + d.count, 0)
      };
    },
    enabled: isExpanded
  });

  // Leave Statistics
  const { data: leaveStats } = useQuery({
    queryKey: ['leaveStats', startDate, endDate],
    queryFn: async () => {
      let query = supabase.from('employee_leaves').select('leave_type, status, start_date, end_date');
      if (startDate) query = query.gte('start_date', startDate);
      if (endDate) query = query.lte('end_date', endDate);
      const { data } = await query;
      
      const approved = (data || []).filter(l => l.status === 'approved');
      const totalDays = approved.reduce((sum, l) => {
        const days = Math.ceil((new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return sum + days;
      }, 0);
      
      const byType = approved.reduce((acc: Record<string, number>, l) => {
        acc[l.leave_type || 'Diğer'] = (acc[l.leave_type || 'Diğer'] || 0) + 1;
        return acc;
      }, {});
      
      return {
        totalDays,
        pending: (data || []).filter(l => l.status === 'pending').length,
        chartData: Object.entries(byType).map(([name, value], i) => ({ name, value, fill: COLORS[i % COLORS.length] }))
      };
    },
    enabled: isExpanded
  });

  // Recent Hires & Departures
  const { data: hiresData } = useQuery({
    queryKey: ['recentHires', startDate, endDate],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: hires } = await supabase
        .from('employees')
        .select('first_name, last_name, hire_date')
        .gte('hire_date', sixMonthsAgo.toISOString().split('T')[0])
        .order('hire_date', { ascending: false })
        .limit(5);
      
      const { data: departures } = await supabase
        .from('employees')
        .select('first_name, last_name, termination_date')
        .not('termination_date', 'is', null)
        .gte('termination_date', sixMonthsAgo.toISOString().split('T')[0])
        .order('termination_date', { ascending: false })
        .limit(5);
      
      return { hires: hires || [], departures: departures || [] };
    },
    enabled: isExpanded
  });

  // Recent Leaves
  const { data: recentLeaves } = useQuery({
    queryKey: ['recentLeaves'],
    queryFn: async () => {
      const { data } = await supabase
        .from('employee_leaves')
        .select('*, employees(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: isExpanded
  });

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Users className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <span className="text-base font-semibold">İK & PDKS</span>
              {isExpanded && (
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs">{departmentData?.total || 0} Aktif Personel</Badge>
                  {(leaveStats?.pending || 0) > 0 && (
                    <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600">
                      {leaveStats?.pending} Bekleyen İzin
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
            {/* Department Distribution */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Departman Dağılımı
              </h4>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData?.chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={70} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {departmentData?.chartData?.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Leave Types Pie */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                İzin Türleri
              </h4>
              <div className="text-center mb-2">
                <div className="text-2xl font-bold">{leaveStats?.totalDays || 0}</div>
                <div className="text-xs text-muted-foreground">Toplam İzin Günü</div>
              </div>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={leaveStats?.chartData || []} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value">
                      {leaveStats?.chartData?.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                {leaveStats?.chartData?.slice(0, 3).map((item: any, i: number) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                    {item.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Hires & Departures */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <UserPlus className="h-4 w-4" />
                İşe Giriş / Çıkış
              </h4>
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-emerald-600 mb-1.5 flex items-center gap-1">
                    <UserPlus className="h-3 w-3" /> Yeni İşe Alımlar
                  </div>
                  <div className="space-y-1">
                    {hiresData?.hires.slice(0, 3).map((emp, i) => (
                      <div key={i} className="text-xs flex justify-between p-1.5 bg-emerald-500/10 rounded">
                        <span>{emp.first_name} {emp.last_name}</span>
                        <span className="text-muted-foreground">{new Date(emp.hire_date).toLocaleDateString('tr-TR')}</span>
                      </div>
                    ))}
                    {!hiresData?.hires.length && <p className="text-xs text-muted-foreground">Yeni alım yok</p>}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-rose-600 mb-1.5 flex items-center gap-1">
                    <UserMinus className="h-3 w-3" /> Ayrılanlar
                  </div>
                  <div className="space-y-1">
                    {hiresData?.departures.slice(0, 2).map((emp, i) => (
                      <div key={i} className="text-xs flex justify-between p-1.5 bg-rose-500/10 rounded">
                        <span>{emp.first_name} {emp.last_name}</span>
                        <span className="text-muted-foreground">{new Date(emp.termination_date).toLocaleDateString('tr-TR')}</span>
                      </div>
                    ))}
                    {!hiresData?.departures.length && <p className="text-xs text-muted-foreground">Ayrılan yok</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Leaves */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                Son İzin Talepleri
              </h4>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {recentLeaves?.map((leave, i) => (
                  <div key={i} className="p-2 bg-muted/30 rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {(leave.employees as any)?.first_name} {(leave.employees as any)?.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {leave.leave_type} • {new Date(leave.start_date).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px] shrink-0",
                        leave.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' :
                        leave.status === 'rejected' ? 'bg-rose-500/10 text-rose-600' :
                        'bg-amber-500/10 text-amber-600'
                      )}>
                        {leave.status === 'approved' ? 'Onaylı' : leave.status === 'rejected' ? 'Reddedildi' : 'Beklemede'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {!recentLeaves?.length && (
                  <p className="text-sm text-muted-foreground text-center py-4">İzin talebi yok</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
