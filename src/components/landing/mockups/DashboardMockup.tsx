import { TrendingUp, TrendingDown, Users, FileText, Package, DollarSign } from "lucide-react";

interface StatCardMiniProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  color: "violet" | "cyan" | "rose" | "emerald";
}

const StatCardMini = ({ title, value, trend, trendUp = true, color }: StatCardMiniProps) => {
  const colorClasses = {
    violet: "from-violet-500/20 to-purple-500/20 border-violet-500/30",
    cyan: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30",
    rose: "from-rose-500/20 to-pink-500/20 border-rose-500/30",
    emerald: "from-emerald-500/20 to-green-500/20 border-emerald-500/30",
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-2 sm:p-3`}>
      <p className="text-[8px] sm:text-[10px] text-muted-foreground truncate">{title}</p>
      <p className="text-xs sm:text-sm font-bold text-foreground">{value}</p>
      {trend && (
        <div className={`flex items-center gap-0.5 text-[8px] ${trendUp ? "text-emerald-500" : "text-rose-500"}`}>
          {trendUp ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

const MiniChartMockup = () => {
  const bars = [35, 52, 48, 65, 58, 72, 68, 85, 78, 92, 88, 95];
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-medium text-foreground">Aylık Gelir Trendi</span>
        <span className="text-[8px] text-muted-foreground">Son 12 Ay</span>
      </div>
      <div className="flex-1 flex items-end gap-1">
        {bars.map((height, i) => (
          <div
            key={i}
            className="flex-1 bg-gradient-to-t from-primary to-primary/50 rounded-t transition-all"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
};

interface TaskItemMiniProps {
  title: string;
  time?: string;
  badge?: string;
}

const TaskItemMini = ({ title, time, badge }: TaskItemMiniProps) => (
  <div className="flex items-center justify-between bg-muted/50 rounded-lg px-2 py-1.5">
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
      <span className="text-[10px] text-foreground truncate max-w-[120px] sm:max-w-[180px]">{title}</span>
    </div>
    {time && <span className="text-[8px] text-muted-foreground">{time}</span>}
    {badge && (
      <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{badge}</span>
    )}
  </div>
);

interface DashboardMockupProps {
  variant?: "default" | "large";
  className?: string;
}

export const DashboardMockup = ({ variant = "default", className = "" }: DashboardMockupProps) => {
  const isLarge = variant === "large";
  
  return (
    <div className={`bg-card rounded-2xl shadow-2xl border overflow-hidden ${className}`}>
      {/* Browser Chrome */}
      <div className="bg-muted/80 px-3 sm:px-4 py-2 flex items-center gap-2 border-b">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-background/50 rounded-md px-3 py-1">
            <span className="text-[10px] sm:text-xs text-muted-foreground">pafta.app/dashboard</span>
          </div>
        </div>
      </div>
      
      {/* Dashboard Content */}
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 bg-background">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <StatCardMini title="Aylık Ciro" value="₺2.4M" trend="+12%" trendUp color="violet" />
          <StatCardMini title="Toplam Alacak" value="₺890K" trend="-5%" trendUp={false} color="cyan" />
          <StatCardMini title="Aylık Gider" value="₺1.2M" color="rose" />
          <StatCardMini title="Net Kar" value="₺1.2M" trend="+8%" trendUp color="emerald" />
        </div>
        
        {/* Main Content Grid */}
        <div className={`grid gap-3 ${isLarge ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
          {/* Chart */}
          <div className={`bg-muted/30 rounded-xl p-3 ${isLarge ? "lg:col-span-2 h-32 sm:h-40" : "h-24 sm:h-32"}`}>
            <MiniChartMockup />
          </div>
          
          {/* Tasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-foreground">Bugünkü Görevler</span>
              <span className="text-[8px] text-primary">Tümü →</span>
            </div>
            <TaskItemMini title="Müşteri toplantısı" time="14:00" />
            <TaskItemMini title="Fatura onayı bekliyor" badge="3" />
            {isLarge && <TaskItemMini title="Stok sayımı" time="16:30" />}
          </div>
        </div>
        
        {/* Quick Stats Row */}
        {isLarge && (
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2">
              <Users className="w-4 h-4 text-primary" />
              <div>
                <p className="text-[8px] text-muted-foreground">Aktif Müşteri</p>
                <p className="text-xs font-semibold text-foreground">1,248</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2">
              <FileText className="w-4 h-4 text-primary" />
              <div>
                <p className="text-[8px] text-muted-foreground">Bu Ay Fatura</p>
                <p className="text-xs font-semibold text-foreground">324</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2">
              <Package className="w-4 h-4 text-primary" />
              <div>
                <p className="text-[8px] text-muted-foreground">Stok Ürün</p>
                <p className="text-xs font-semibold text-foreground">5,892</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardMockup;
