import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  Target,
  Award,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  completedTasks: number;
  totalTasks: number;
  efficiency: number;
  trend: 'up' | 'down' | 'stable';
  performance: 'excellent' | 'good' | 'average' | 'needs_improvement';
}

interface TeamPerformanceProps {
  data?: {
    members: TeamMember[];
  };
  isLoading?: boolean;
}

export const TeamPerformance = memo(({ data, isLoading }: TeamPerformanceProps) => {
  // Mock data
  const teamMembers: TeamMember[] = data?.members || [
    {
      id: '1',
      name: 'Ahmet Yılmaz',
      role: 'Satış Müdürü',
      initials: 'AY',
      completedTasks: 28,
      totalTasks: 32,
      efficiency: 95,
      trend: 'up',
      performance: 'excellent'
    },
    {
      id: '2',
      name: 'Ayşe Demir',
      role: 'Finans Uzmanı',
      initials: 'AD',
      completedTasks: 24,
      totalTasks: 28,
      efficiency: 88,
      trend: 'up',
      performance: 'excellent'
    },
    {
      id: '3',
      name: 'Mehmet Kaya',
      role: 'Operasyon Şefi',
      initials: 'MK',
      completedTasks: 19,
      totalTasks: 25,
      efficiency: 82,
      trend: 'stable',
      performance: 'good'
    },
    {
      id: '4',
      name: 'Fatma Şahin',
      role: 'İK Müdürü',
      initials: 'FŞ',
      completedTasks: 22,
      totalTasks: 30,
      efficiency: 76,
      trend: 'up',
      performance: 'good'
    },
    {
      id: '5',
      name: 'Can Arslan',
      role: 'Satın Alma Uzmanı',
      initials: 'CA',
      completedTasks: 15,
      totalTasks: 24,
      efficiency: 68,
      trend: 'down',
      performance: 'average'
    },
    {
      id: '6',
      name: 'Elif Yıldız',
      role: 'IT Destek',
      initials: 'EY',
      completedTasks: 18,
      totalTasks: 22,
      efficiency: 85,
      trend: 'up',
      performance: 'good'
    }
  ];

  const performanceConfig = {
    excellent: { 
      label: 'Mükemmel', 
      color: 'bg-emerald-500', 
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      icon: '⭐'
    },
    good: { 
      label: 'İyi', 
      color: 'bg-blue-500', 
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      icon: '👍'
    },
    average: { 
      label: 'Orta', 
      color: 'bg-amber-500', 
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      icon: '📊'
    },
    needs_improvement: { 
      label: 'Gelişmeli', 
      color: 'bg-red-500', 
      textColor: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      icon: '⚠️'
    }
  };

  const trendIcons = {
    up: { icon: TrendingUp, color: 'text-emerald-500' },
    down: { icon: TrendingUp, color: 'text-red-500 rotate-180' },
    stable: { icon: Target, color: 'text-gray-400' }
  };

  const totalCompleted = teamMembers.reduce((sum, m) => sum + m.completedTasks, 0);
  const totalTasks = teamMembers.reduce((sum, m) => sum + m.totalTasks, 0);
  const avgEfficiency = Math.round(teamMembers.reduce((sum, m) => sum + m.efficiency, 0) / teamMembers.length);
  const topPerformer = teamMembers.reduce((prev, current) => 
    (current.efficiency > prev.efficiency) ? current : prev
  );

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Users className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Ekip Performansı</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                {teamMembers.length} ekip üyesi • Ortalama verimlilik: {avgEfficiency}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs gap-1">
              <Award className="h-3 w-3" />
              En İyi: {topPerformer.name}
            </Badge>
          </div>
        </div>

        {/* Team Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <p className="text-[10px] uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">
                Tamamlanan
              </p>
            </div>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{totalCompleted}</p>
            <p className="text-[9px] text-blue-600/70 dark:text-blue-400/70">
              Toplam {totalTasks} görev
            </p>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-emerald-600" />
              <p className="text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold">
                Verimlilik
              </p>
            </div>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{avgEfficiency}%</p>
            <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70">
              Ortalama
            </p>
          </div>

          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-4 w-4 text-purple-600" />
              <p className="text-[10px] uppercase tracking-wide text-purple-600 dark:text-purple-400 font-semibold">
                Mükemmel
              </p>
            </div>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
              {teamMembers.filter(m => m.performance === 'excellent').length}
            </p>
            <p className="text-[9px] text-purple-600/70 dark:text-purple-400/70">
              Üye
            </p>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <p className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400 font-semibold">
                Yükseliş
              </p>
            </div>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
              {teamMembers.filter(m => m.trend === 'up').length}
            </p>
            <p className="text-[9px] text-amber-600/70 dark:text-amber-400/70">
              Üye
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {teamMembers.map((member) => {
            const performance = performanceConfig[member.performance];
            const TrendIcon = trendIcons[member.trend].icon;
            const completionRate = Math.round((member.completedTasks / member.totalTasks) * 100);

            return (
              <div
                key={member.id}
                className={cn(
                  "p-4 rounded-xl border-2 border-border hover:border-primary/30 transition-all duration-200 cursor-pointer hover:shadow-lg group",
                  performance.bgColor
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                    <AvatarFallback className={cn("text-sm font-bold", performance.color, "text-white")}>
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold truncate">{member.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                      </div>
                      <TrendIcon className={cn("h-4 w-4 shrink-0", trendIcons[member.trend].color)} />
                    </div>

                    {/* Performance Badge */}
                    <Badge className={cn("text-[10px] px-2 py-0.5", performance.textColor, "bg-background/80 border")}>
                      {performance.icon} {performance.label}
                    </Badge>

                    {/* Stats */}
                    <div className="space-y-1.5 pt-2">
                      {/* Tasks Completion */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Görevler</span>
                          <span className="font-semibold">
                            {member.completedTasks}/{member.totalTasks} ({completionRate}%)
                          </span>
                        </div>
                        <Progress value={completionRate} className="h-1.5" />
                      </div>

                      {/* Efficiency */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Verimlilik</span>
                          <span className="font-semibold">{member.efficiency}%</span>
                        </div>
                        <Progress 
                          value={member.efficiency} 
                          className={cn(
                            "h-1.5",
                            member.efficiency >= 90 && "[&>div]:bg-emerald-500",
                            member.efficiency >= 75 && member.efficiency < 90 && "[&>div]:bg-blue-500",
                            member.efficiency >= 60 && member.efficiency < 75 && "[&>div]:bg-amber-500",
                            member.efficiency < 60 && "[&>div]:bg-red-500"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

TeamPerformance.displayName = "TeamPerformance";

