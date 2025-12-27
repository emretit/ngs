import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Users,
  UserPlus,
  Calendar,
  GraduationCap,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface HrSummaryProps {
  data?: {
    totalEmployees: number;
    activeEmployees: number;
    attendanceRate: number; // percentage
    onLeaveCount: number;
    pendingLeaveRequests: number;
    newHiresThisMonth: number;
    upcomingTrainings: number;
    averageTenure: number; // months
    recentHires: Array<{
      id: string;
      name: string;
      position: string;
      hireDate: string;
      department: string;
    }>;
    upcomingLeaves: Array<{
      id: string;
      employee: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      days: number;
    }>;
  };
  isLoading?: boolean;
}

export const HrSummary = memo(({ data, isLoading }: HrSummaryProps) => {
  const navigate = useNavigate();

  // Mock data
  const mockData = data || {
    totalEmployees: 45,
    activeEmployees: 42,
    attendanceRate: 94.5,
    onLeaveCount: 3,
    pendingLeaveRequests: 5,
    newHiresThisMonth: 3,
    upcomingTrainings: 2,
    averageTenure: 18.5,
    recentHires: [
      {
        id: '1',
        name: 'Ahmet Yılmaz',
        position: 'Satış Temsilcisi',
        hireDate: '2024-01-05',
        department: 'Satış'
      },
      {
        id: '2',
        name: 'Ayşe Demir',
        position: 'Mühendis',
        hireDate: '2024-01-10',
        department: 'Teknik'
      },
      {
        id: '3',
        name: 'Mehmet Kaya',
        position: 'Operasyon Uzmanı',
        hireDate: '2024-01-12',
        department: 'Operasyon'
      }
    ],
    upcomingLeaves: [
      {
        id: '1',
        employee: 'Fatma Şahin',
        leaveType: 'Yıllık İzin',
        startDate: '2024-01-20',
        endDate: '2024-01-25',
        days: 5
      },
      {
        id: '2',
        employee: 'Can Arslan',
        leaveType: 'Hastalık İzni',
        startDate: '2024-01-18',
        endDate: '2024-01-19',
        days: 2
      }
    ]
  };

  const { totalEmployees, activeEmployees, attendanceRate, onLeaveCount, pendingLeaveRequests, newHiresThisMonth, upcomingTrainings, averageTenure, recentHires, upcomingLeaves } = mockData;
  const inactiveCount = totalEmployees - activeEmployees;

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-border/40 shadow-sm bg-card/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
          <div className="h-20 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-sm">
              <Users className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">İK Özeti</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Devam oranı, izinler, yeni işe alımlar
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="h-3 w-3 text-purple-600" />
              <p className="text-[9px] uppercase tracking-wide text-purple-600 dark:text-purple-400 font-semibold">
                Toplam
              </p>
            </div>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{totalEmployees}</p>
            <p className="text-[9px] text-purple-600/70 dark:text-purple-400/70">
              {activeEmployees} aktif
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <p className="text-[9px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold">
                Devam
              </p>
            </div>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{attendanceRate.toFixed(1)}%</p>
            <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70">
              Bu ay
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-3 w-3 text-blue-600" />
              <p className="text-[9px] uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">
                İzin
              </p>
            </div>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{onLeaveCount}</p>
            <p className="text-[9px] text-blue-600/70 dark:text-blue-400/70">
              {pendingLeaveRequests} bekliyor
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-1.5 mb-1">
              <UserPlus className="h-3 w-3 text-orange-600" />
              <p className="text-[9px] uppercase tracking-wide text-orange-600 dark:text-orange-400 font-semibold">
                Yeni
              </p>
            </div>
            <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{newHiresThisMonth}</p>
            <p className="text-[9px] text-orange-600/70 dark:text-orange-400/70">
              Bu ay
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Attendance Rate */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-foreground">Devam Oranı</h4>
            <Badge className={cn(
              "h-5 px-2 text-[10px]",
              attendanceRate >= 95 
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : attendanceRate >= 90
                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
            )}>
              {attendanceRate >= 95 ? 'Mükemmel' : attendanceRate >= 90 ? 'İyi' : 'Orta'}
            </Badge>
          </div>
          <Progress 
            value={attendanceRate} 
            className={cn(
              "h-3",
              attendanceRate >= 95 && "[&>div]:bg-emerald-500",
              attendanceRate >= 90 && attendanceRate < 95 && "[&>div]:bg-blue-500",
              attendanceRate < 90 && "[&>div]:bg-amber-500"
            )}
          />
          <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
            <span>{activeEmployees} aktif çalışan</span>
            <span>Ortalama kıdem: {Math.floor(averageTenure / 12)}y {averageTenure % 12}ay</span>
          </div>
        </div>

        {/* Recent Hires */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground">Yeni İşe Alımlar</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/employees?filter=new')}
              className="gap-1.5 h-7 text-xs"
            >
              Tümü
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {recentHires.length > 0 ? (
              recentHires.map((hire) => (
                <div
                  key={hire.id}
                  onClick={() => navigate(`/employees/${hire.id}`)}
                  className="group p-2.5 rounded-lg border border-border hover:border-primary/30 transition-all duration-200 cursor-pointer hover:shadow-sm bg-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <UserPlus className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <p className="text-xs font-semibold text-foreground truncate">
                          {hire.name}
                        </p>
                        <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
                          Yeni
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{hire.position}</span>
                        <span>•</span>
                        <span>{hire.department}</span>
                        <span>•</span>
                        <span>{format(new Date(hire.hireDate), 'd MMM yyyy', { locale: tr })}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center border border-border/50 rounded-lg bg-muted/30">
                <UserPlus className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Yeni işe alım yok</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Leaves & Trainings */}
        <div className="grid grid-cols-2 gap-4">
          {/* Upcoming Leaves */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-foreground">Yaklaşan İzinler</h4>
              {pendingLeaveRequests > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
                  {pendingLeaveRequests} bekliyor
                </Badge>
              )}
            </div>
            <div className="space-y-1.5">
              {upcomingLeaves.length > 0 ? (
                upcomingLeaves.slice(0, 2).map((leave) => (
                  <div
                    key={leave.id}
                    onClick={() => navigate('/employees/leaves')}
                    className="p-2 rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-200 cursor-pointer bg-card/50"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Calendar className="h-3 w-3 text-blue-600" />
                      <p className="text-[10px] font-semibold text-foreground truncate">
                        {leave.employee}
                      </p>
                    </div>
                    <p className="text-[9px] text-muted-foreground">
                      {leave.leaveType} • {leave.days} gün
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {format(new Date(leave.startDate), 'd MMM', { locale: tr })} - {format(new Date(leave.endDate), 'd MMM', { locale: tr })}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-2 text-center border border-border/50 rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground">Yaklaşan izin yok</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Trainings */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-foreground">Yaklaşan Eğitimler</h4>
              {upcomingTrainings > 0 && (
                <Badge className="h-4 px-1.5 text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                  {upcomingTrainings}
                </Badge>
              )}
            </div>
            <div className="space-y-1.5">
              {upcomingTrainings > 0 ? (
                Array.from({ length: Math.min(upcomingTrainings, 2) }).map((_, i) => (
                  <div
                    key={i}
                    onClick={() => navigate('/employees/trainings')}
                    className="p-2 rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-200 cursor-pointer bg-card/50"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <GraduationCap className="h-3 w-3 text-purple-600" />
                      <p className="text-[10px] font-semibold text-foreground">
                        Eğitim {i + 1}
                      </p>
                    </div>
                    <p className="text-[9px] text-muted-foreground">
                      Planlanmış eğitim
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-2 text-center border border-border/50 rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground">Yaklaşan eğitim yok</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {pendingLeaveRequests > 0 && (
              <span className="text-amber-600 font-semibold">{pendingLeaveRequests} izin talebi bekliyor!</span>
            )}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/employees')}
            className="gap-1.5 h-7 text-xs"
          >
            Tüm Çalışanlar
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

HrSummary.displayName = "HrSummary";

