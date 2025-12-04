import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  MapPin,
  Users,
  AlertCircle,
} from "lucide-react";
import { ViewMode } from "./types";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TimelineHeaderProps {
  selectedDate: Date;
  viewMode: ViewMode;
  technicianCount: number;
  unassignedCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onMapClick?: () => void;
}

export const TimelineHeader = ({
  selectedDate,
  viewMode,
  technicianCount,
  unassignedCount,
  searchTerm,
  onSearchChange,
  onPreviousDay,
  onNextDay,
  onToday,
  onViewModeChange,
  onMapClick,
}: TimelineHeaderProps) => {
  const formattedDate = format(selectedDate, "d MMMM yyyy EEEE", { locale: tr });
  const isToday = format(new Date(), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");

  return (
    <div className="border-b border-border bg-card">
      {/* Main Row */}
      <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        {/* Left: Date Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-background p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onPreviousDay}
              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant={isToday ? "default" : "ghost"}
              size="sm" 
              onClick={onToday}
              className={cn(
                "h-8 px-3",
                isToday && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              Bugün
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onNextDay}
              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/20 rounded-lg">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">{formattedDate}</span>
          </div>
        </div>

        {/* Center: View Mode Toggle */}
        <div className="flex items-center rounded-lg border border-border bg-muted/30 p-1">
          <Button
            variant={viewMode === "day" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("day")}
            className={cn(
              "h-8 px-4 transition-all",
              viewMode === "day" 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "hover:bg-primary/10 hover:text-primary"
            )}
          >
            Gün
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("week")}
            className={cn(
              "h-8 px-4 transition-all",
              viewMode === "week" 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "hover:bg-primary/10 hover:text-primary"
            )}
          >
            Hafta
          </Button>
        </div>

        {/* Right: Stats + Actions */}
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className="gap-1.5 py-1.5 px-3 bg-muted text-foreground border-0"
          >
            <Users className="h-3.5 w-3.5" />
            <span className="font-bold">{technicianCount}</span>
            <span className="text-muted-foreground font-normal">Teknisyen</span>
          </Badge>
          
          {unassignedCount > 0 && (
            <Badge 
              variant="outline" 
              className="gap-1.5 py-1.5 px-3 border-warning/50 bg-warning/10 text-warning"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="font-bold">{unassignedCount}</span>
              <span className="font-normal">Bekliyor</span>
            </Badge>
          )}
          
          {onMapClick && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onMapClick}
              className="h-9 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Harita
            </Button>
          )}
        </div>
      </div>

      {/* Search Row */}
      <div className="px-4 pb-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Teknisyen veya servis ara..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9 bg-background border-border focus:border-primary focus:ring-primary/20"
          />
        </div>
      </div>
    </div>
  );
};
