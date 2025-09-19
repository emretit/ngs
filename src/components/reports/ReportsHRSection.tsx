import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Users, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReportsHRSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  searchParams: URLSearchParams;
}

export default function ReportsHRSection({ isExpanded, onToggle, searchParams }: ReportsHRSectionProps) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const { data: headcount } = useQuery({
    queryKey: ['headcount'],
    queryFn: async () => {
      const { data } = await supabase
        .from('employees')
        .select('status, department')
        .eq('status', 'aktif');
      
      if (!data) return { total: 0, byDepartment: {} };
      
      const byDepartment = data.reduce((acc: Record<string, number>, emp) => {
        acc[emp.department] = (acc[emp.department] || 0) + 1;
        return acc;
      }, {});
      
      return { total: data.length, byDepartment };
    },
    enabled: isExpanded
  });

  const { data: absenteeism } = useQuery({
    queryKey: ['absenteeism', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('employee_leaves')
        .select('employee_id, start_date, end_date, status');
        
      if (startDate) query = query.gte('start_date', startDate);
      if (endDate) query = query.lte('end_date', endDate);
      
      const { data } = await query;
      
      if (!data) return { totalDays: 0, employeesAffected: 0 };
      
      const approvedLeaves = data.filter(leave => leave.status === 'approved');
      const totalDays = approvedLeaves.reduce((sum, leave) => {
        const start = new Date(leave.start_date);
        const end = new Date(leave.end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return sum + days;
      }, 0);
      
      const employeesAffected = new Set(approvedLeaves.map(leave => leave.employee_id)).size;
      
      return { totalDays, employeesAffected };
    },
    enabled: isExpanded
  });

  const { data: overtime } = useQuery({
    queryKey: ['overtime', startDate, endDate],
    queryFn: async () => {
      // Note: This would need actual time tracking data
      // For now, returning placeholder data with a comment
      return {
        hours: 0,
        comment: "Mesai saatleri için time_tracking tablosu veya employee_attendance tablosu gerekli"
      };
    },
    enabled: isExpanded
  });

  const { data: recentLeaves } = useQuery({
    queryKey: ['recentLeaves'],
    queryFn: async () => {
      const { data } = await supabase
        .from('employee_leaves')
        .select(`
          *,
          employees (first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: isExpanded
  });

  const { data: departmentStats } = useQuery({
    queryKey: ['departmentStats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('employees')
        .select('department')
        .eq('status', 'aktif');
      
      if (!data) return [];
      
      const stats = data.reduce((acc: Record<string, number>, emp) => {
        acc[emp.department] = (acc[emp.department] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(stats).map(([dept, count]) => ({ department: dept, count }));
    },
    enabled: isExpanded
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            İK & PDKS Raporları
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Headcount */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Personel Sayısı
              </h4>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {headcount?.total || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Aktif Personel</div>
                </div>
                <div className="space-y-1">
                  {departmentStats?.slice(0, 4).map((dept, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{dept.department}</span>
                      <span className="font-medium">{dept.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Absenteeism */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Devamsızlık
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 rounded">
                  <div className="text-sm text-yellow-700">Toplam İzin Günü</div>
                  <div className="text-2xl font-bold text-yellow-800">
                    {absenteeism?.totalDays || 0}
                  </div>
                </div>
                <div className="p-3 bg-orange-50 rounded">
                  <div className="text-sm text-orange-700">Etkilenen Personel</div>
                  <div className="text-2xl font-bold text-orange-800">
                    {absenteeism?.employeesAffected || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Overtime */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Mesai Saatleri
              </h4>
              <div className="space-y-3">
                {overtime?.comment ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs text-blue-800">{overtime.comment}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {overtime?.hours || 0} saat
                    </div>
                    <div className="text-sm text-muted-foreground">Bu dönem</div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Leaves */}
            <div>
              <h4 className="font-semibold mb-3">Son İzin Talepleri</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {recentLeaves?.map((leave, index) => (
                  <div key={index} className="p-2 bg-muted/50 rounded">
                    <div className="text-sm font-medium">
                      {leave.employees?.first_name || ''} {leave.employees?.last_name || ''}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {leave.leave_type} - {new Date(leave.start_date).toLocaleDateString('tr-TR')} 
                      {' '} ile {new Date(leave.end_date).toLocaleDateString('tr-TR')}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                      leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {String(leave.status)}
                    </span>
                  </div>
                ))}
                {!recentLeaves?.length && (
                  <p className="text-sm text-muted-foreground">İzin talebi bulunamadı</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}