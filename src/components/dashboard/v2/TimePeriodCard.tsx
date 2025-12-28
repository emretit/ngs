import { memo } from "react";
import { Calendar, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimePeriodCardProps {
  selectedPeriod: "today" | "week" | "month" | "quarter";
  onPeriodChange: (period: "today" | "week" | "month" | "quarter") => void;
}

const PERIOD_CONFIG = {
  today: {
    label: "Bugün",
    icon: Clock,
    activeClass: "bg-cyan-500 text-white hover:bg-cyan-600",
  },
  week: {
    label: "Bu Hafta",
    icon: Calendar,
    activeClass: "bg-emerald-500 text-white hover:bg-emerald-600",
  },
  month: {
    label: "Bu Ay",
    icon: TrendingUp,
    activeClass: "bg-indigo-500 text-white hover:bg-indigo-600",
  },
  quarter: {
    label: "Bu Çeyrek",
    icon: TrendingUp,
    activeClass: "bg-violet-500 text-white hover:bg-violet-600",
  },
};

export const TimePeriodCard = memo(
  ({ selectedPeriod, onPeriodChange }: TimePeriodCardProps) => {
    return (
      <div className="flex flex-col gap-3 p-4 rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm shadow-sm">
        {/* Label ve Period Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Label */}
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground whitespace-nowrap">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Zaman Periyodu:</span>
          </div>

          {/* Period Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {(Object.keys(PERIOD_CONFIG) as Array<keyof typeof PERIOD_CONFIG>).map(
              (period) => {
                const config = PERIOD_CONFIG[period];
                const Icon = config.icon;
                const isActive = selectedPeriod === period;

                return (
                  <button
                    key={period}
                    onClick={() => onPeriodChange(period)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                      "text-sm font-medium border shadow-sm",
                      isActive
                        ? config.activeClass
                        : "bg-background text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground hover:border-border"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{config.label}</span>
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>
    );
  }
);

TimePeriodCard.displayName = "TimePeriodCard";

