
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

  // Çalışma yılını hesapla (ondalıklı)
  const calculateYearsOfService = (hireDate: string | null): number => {
    if (!hireDate) return 0;
    const hire = new Date(hireDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hire.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(diffYears); // Tam yıl olarak hesapla
  };

  // Çalışma süresini okunabilir formatta göster
  const formatYearsOfService = (hireDate: string | null): string => {
    if (!hireDate) return '0 yıl';
    const hire = new Date(hireDate);
    const now = new Date();
    
    let years = now.getFullYear() - hire.getFullYear();
    let months = now.getMonth() - hire.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years === 0) {
      return `${months} ay`;
    } else if (months === 0) {
      return `${years} yıl`;
    } else {
      return `${years} yıl ${months} ay`;
    }
  };

  // Bir sonraki yıl dönümü (izin hak ediş tarihi)
  const getNextAnniversary = (hireDate: string | null): string => {
    if (!hireDate) return '-';
    const hire = new Date(hireDate);
    const now = new Date();
    
    // Bir sonraki yıl dönümünü hesapla
    const nextAnniversary = new Date(hire);
    nextAnniversary.setFullYear(now.getFullYear());
    
    // Eğer bu yılın yıl dönümü geçtiyse, gelecek yılınkini al
    if (nextAnniversary < now) {
      nextAnniversary.setFullYear(now.getFullYear() + 1);
    }
    
    return nextAnniversary.toLocaleDateString('tr-TR');
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
          // Yıllık izin için: Toplam birikmiş izin hesaplama
          // Her yıl için hangi kural geçerliyse o kural üzerinden hesaplama yap
          if (leaveType.name === 'Yıllık İzin' && yearsOfService > 0) {
            // Tüm kuralları sırala
            const sortedRules = (rules || []).sort((a, b) => (a.min_years_of_service || 0) - (b.min_years_of_service || 0));
            
            let totalDays = 0;
            let yearsCalculated = 0;
            
            // Her kural için kaç yıl geçerli olduğunu hesapla
            for (const rule of sortedRules) {
              const minYears = rule.min_years_of_service ?? 0;
              const maxYears = rule.max_years_of_service ?? Infinity;
              
              if (yearsCalculated >= yearsOfService) break;
              
              // Bu kural altında kaç yıl çalışıldı?
              const yearsInThisRule = Math.min(
                yearsOfService - yearsCalculated,
                maxYears - minYears
              );
              
              if (yearsInThisRule > 0) {
                totalDays += yearsInThisRule * rule.days_entitled;
                yearsCalculated += yearsInThisRule;
              }
            }
            
            daysEntitled = totalDays;
            ruleName = `Toplam birikmiş: ${yearsOfService} yıl`;
          } else {
            // Diğer izin türleri için: sadece yıllık hak
            daysEntitled = applicableRule.days_entitled;
            ruleName = applicableRule.name;
          }
        }

        // Kullanılan izinleri hesapla (tüm zamanlar için - toplam birikmiş kullanım)
        const currentYear = new Date().getFullYear();
        
        // Toplam hak için tüm yılları kontrol et
        const { data: allLeaves, error: usedLeavesError } = await supabase
          .from('employee_leaves')
          .select('*')
          .eq('employee_id', employee.id)
          .in('status', ['approved', 'pending']);

        if (usedLeavesError) {
          console.error('Error fetching used leaves:', usedLeavesError);
        }

        // İzin türü eşleştirmesi için mapping
        const leaveTypeMapping: { [key: string]: string } = {
          'annual': 'Yıllık İzin',
          'sick': 'Raporlu İzin',
          'parental': 'Mazeret İzni',
          'unpaid': 'Ücretsiz İzin',
          'other': 'Diğer'
        };

        // Bu izin türüne ait kayıtları filtrele
        const usedLeaves = (allLeaves || []).filter(leave => {
          // leave_type text ise direkt eşleştir
          if (leave.leave_type === leaveType.name) return true;
          // Mapping ile eşleştir
          const mappedType = leaveTypeMapping[leave.leave_type];
          return mappedType === leaveType.name;
        });

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

  const getLeaveTypeDisplayName = (leaveType: string): string => {
    const leaveTypeMapping: { [key: string]: string } = {
      'annual': 'Yıllık İzin',
      'sick': 'Raporlu İzin',
      'parental': 'Mazeret İzni',
      'unpaid': 'Ücretsiz İzin',
      'other': 'Diğer'
    };
    return leaveTypeMapping[leaveType] || leaveType;
  };

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
      <div className="space-y-3">
        <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* İzin Hakları - Kompakt Tablo */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              İzin Hakları
            </CardTitle>
            <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
              <span>Çalışma: {formatYearsOfService(employee.hire_date)}</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Sonraki Hak: {getNextAnniversary(employee.hire_date)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {leaveEntitlements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">İzin Türü</th>
                    <th className="text-center py-2 px-2 font-medium">Hak</th>
                    <th className="text-center py-2 px-2 font-medium">Kullanılan</th>
                    <th className="text-center py-2 px-2 font-medium">Kalan</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveEntitlements.map((entitlement) => (
                    <tr key={entitlement.leave_type.id} className="border-b last:border-0">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          {entitlement.leave_type.color && (
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: entitlement.leave_type.color }}
                            />
                          )}
                          <span className="text-sm">{entitlement.leave_type.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-2 px-2 font-medium">{entitlement.days_entitled}</td>
                      <td className="text-center py-2 px-2 text-orange-600">{entitlement.days_used}</td>
                      <td className="text-center py-2 px-2 font-semibold text-green-600">{entitlement.days_remaining}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Bu çalışan için henüz izin türü tanımlanmamış.</p>
          )}
        </CardContent>
      </Card>

      {/* İzin Geçmişi - Kompakt Liste */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              İzin Geçmişi
            </CardTitle>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <PlusCircle className="h-3 w-3" />
              Yeni İzin
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {leaves.length > 0 ? (
            <div className="space-y-2">
              {leaves.slice(0, 5).map((leave) => (
                <div key={leave.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{getLeaveTypeDisplayName(leave.leave_type)}</span>
                      <Badge variant="secondary" className={`h-5 text-xs ${getStatusColor(leave.status)}`}>
                        {leave.status === 'approved' ? 'Onaylandı' : leave.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(leave.start_date).toLocaleDateString('tr-TR')} - {new Date(leave.end_date).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))}
              {leaves.length > 5 && (
                <p className="text-xs text-center text-muted-foreground pt-2">
                  +{leaves.length - 5} izin daha
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-3">Henüz izin kaydı bulunmuyor.</p>
              <Button variant="outline" size="sm" className="text-xs">
                <PlusCircle className="h-3 w-3 mr-1" />
                İlk İzni Oluştur
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
