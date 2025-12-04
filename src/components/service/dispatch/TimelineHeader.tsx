import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  MapPin,
  Filter,
} from "lucide-react";
import { ViewMode } from "./types";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

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

  return (
    <div className="p-4 border-b bg-card space-y-3">
      {/* Top Row: Navigation + View Mode + Stats */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Left: Date Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onToday}>
            Bugün
          </Button>
          <Button variant="outline" size="icon" onClick={onNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2 ml-2 px-3 py-1.5 bg-muted/50 rounded-md">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">{formattedDate}</span>
          </div>
        </div>

        {/* Center: View Mode Toggle */}
        <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/30">
          <Button
            variant={viewMode === "day" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("day")}
            className="h-7"
          >
            Gün
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("week")}
            className="h-7"
          >
            Hafta
          </Button>
        </div>

        {/* Right: Stats + Map */}
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <span className="font-bold">{technicianCount}</span> Teknisyen
          </Badge>
          {unassignedCount > 0 && (
            <Badge variant="outline" className="gap-1 border-orange-300 text-orange-700 dark:text-orange-400">
              <span className="font-bold">{unassignedCount}</span> Atanmamış
            </Badge>
          )}
          {onMapClick && (
            <Button variant="outline" size="sm" onClick={onMapClick}>
              <MapPin className="h-4 w-4 mr-2" />
              Harita
            </Button>
          )}
        </div>
      </div>

      {/* Bottom Row: Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Teknisyen veya servis ara..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>
    </div>
  );
};
