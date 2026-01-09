
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Employee, EmployeeLeave } from "@/types/employee";
import { Button } from "@/components/ui/button";
import { Calendar, PlusCircle, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useQuery } from "@tanstack/react-query";

interface EmployeeLeaveTabProps {
  employee: Employee;
}

interface LeaveType {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
}

interface LeaveTypeRule {
  id: string;
  leave_type_id: string;
  name: string;
  min_years_of_service?: number;
  max_years_of_service?: number;
  days_entitled: number;
  description?: string;
  priority: number;
}

interface LeaveEntitlement {
  leave_type: LeaveType;
  days_entitled: number;
  days_used: number;
  days_remaining: number;
  rule_name: string;
}

export const EmployeeLeaveTab = ({ employee }: EmployeeLeaveTabProps) => {
  const [leaves, setLeaves] = useState<EmployeeLeave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { userData } = useCurrentUser();

  // Çalışma yılını hesapla
  const calculateYearsOfService = (hireDate: string | null): number => {
    if (!hireDate) return 0;
    const hire = new Date(hireDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hire.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(diffYears);
  };

  // İzin haklarını hesapla
  const { data: leaveEntitlements = [], isLoading: isLoadingEntitlements } = useQuery({
    queryKey: ['leave-entitlements', employee.id, userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];

      // 1. Tüm aktif izin türlerini al
      const { data: leaveTypes, error: leaveTypesError } = await supabase
        .from('leave_types')
        .select('*')
        .eq('company_id', userData.company_id)
        .eq('is_active', true)
        .order('name');

      if (leaveTypesError) throw leaveTypesError;

      // 2. Çalışma yılını hesapla
      const yearsOfService = calculateYearsOfService(employee.hire_date);

      // 3. Her izin türü için kuralları kontrol et
      const entitlements: LeaveEntitlement[] = [];

      for (const leaveType of (leaveTypes || [])) {
        // Kural tablosundan bu izin türü için geçerli kuralı bul
        const { data: rules, error: rulesError } = await supabase
          .from('leave_type_rules')
          .select('*')
          .eq('leave_type_id', leaveType.id)
          .order('priority', { ascending: true });

        if (rulesError) {
          console.error('Error fetching rules for', leaveType.name, rulesError);
          continue;
        }

        // Çalışma yılına göre uygun kuralı bul
        let applicableRule: LeaveTypeRule | null = null;
        
        for (const rule of (rules || [])) {
          const minYears = rule.min_years_of_service ?? 0;
          const maxYears = rule.max_years_of_service ?? Infinity;
          
          if (yearsOfService >= minYears && yearsOfService < maxYears) {
            applicableRule = rule;
            break;
          }
        }

        // Eğer kural varsa, hak edilen izni hesapla
        let daysEntitled = 0;
        let ruleName = 'Kural tanımlı değil';

        if (applicableRule) {
          daysEntitled = applicableRule.days_entitled;
          ruleName = applicableRule.name;
        }

        // Kullanılan izinleri hesapla (bu yıl için)
        const currentYear = new Date().getFullYear();
        const { data: usedLeaves, error: usedLeavesError } = await supabase
          .from('employee_leaves')
          .select('*')
          .eq('employee_id', employee.id)
          .eq('leave_type', leaveType.name)
          .gte('start_date', `${currentYear}-01-01`)
          .lte('start_date', `${currentYear}-12-31`)
          .in('status', ['approved', 'pending']);

        if (usedLeavesError) {
          console.error('Error fetching used leaves:', usedLeavesError);
        }

        // Kullanılan gün sayısını hesapla
        let daysUsed = 0;
        if (usedLeaves) {
          for (const leave of usedLeaves) {
            const start = new Date(leave.start_date);
            const end = new Date(leave.end_date);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            daysUsed += diffDays;
          }
        }

        entitlements.push({
          leave_type: leaveType,
          days_entitled: daysEntitled,
          days_used: daysUsed,
          days_remaining: Math.max(0, daysEntitled - daysUsed),
          rule_name: ruleName,
        });
      }

      return entitlements;
    },
    enabled: !!userData?.company_id && !!employee.id,
  });

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('employee_leaves')
          .select('*')
          .eq('employee_id', employee.id)
          .order('start_date', { ascending: false });

        if (error) throw error;
        setLeaves(data as EmployeeLeave[]);
      } catch (error) {
        console.error('Error fetching leave data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load leave information",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaves();
  }, [employee.id, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const yearsOfService = calculateYearsOfService(employee.hire_date);

  if (isLoading || isLoadingEntitlements) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            Leave Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* İzin Hakları Kartları */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Hak Edilen İzinler
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Çalışma Süresi: <strong>{yearsOfService} yıl</strong>
              {employee.hire_date && (
                <span className="ml-2">
                  (Başlangıç: {new Date(employee.hire_date).toLocaleDateString('tr-TR')})
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leaveEntitlements.length > 0 ? (
            leaveEntitlements.map((entitlement) => (
              <Card key={entitlement.leave_type.id} className="border-l-4" style={{ borderLeftColor: entitlement.leave_type.color || '#3b82f6' }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {entitlement.leave_type.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entitlement.leave_type.color }}
                        />
                      )}
                      {entitlement.leave_type.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Hak Edilen:</span>
                      <span className="text-sm font-semibold">{entitlement.days_entitled} gün</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Kullanılan:</span>
                      <span className="text-sm font-medium text-orange-600">{entitlement.days_used} gün</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-xs text-muted-foreground">Kalan:</span>
                      <span className="text-lg font-bold text-green-600">{entitlement.days_remaining} gün</span>
                    </div>
                    <div className="pt-2">
                      <Badge variant="outline" className="text-xs">
                        {entitlement.rule_name}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="text-center py-8 text-muted-foreground">
                <p>Bu çalışan için henüz izin türü tanımlanmamış.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* İzin Geçmişi */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            İzin Geçmişi
          </CardTitle>
          <Button size="sm" variant="outline" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            Yeni İzin Talebi
          </Button>
        </CardHeader>
        <CardContent>
          {leaves.length > 0 ? (
            <div className="divide-y">
              {leaves.map((leave) => (
                <div key={leave.id} className="py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{leave.leave_type}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(leave.start_date).toLocaleDateString('tr-TR')} - {new Date(leave.end_date).toLocaleDateString('tr-TR')}
                      </p>
                      {leave.reason && (
                        <p className="text-sm mt-1">{leave.reason}</p>
                      )}
                    </div>
                    <Badge className={getStatusColor(leave.status)}>
                      {leave.status === 'approved' ? 'Onaylandı' : leave.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Bu çalışan için henüz izin kaydı bulunmuyor.</p>
              <Button variant="outline" className="mt-4">
                <PlusCircle className="h-4 w-4 mr-2" />
                İlk İzni Oluştur
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
