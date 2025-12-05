import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  MapPin,
  Users,
  AlertCircle,
  Filter,
  RefreshCw,
  Plus,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from "lucide-react";
import { ViewMode } from "./types";
import { format, addDays, subDays } from "date-fns";
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
  onDateChange?: (date: Date) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onMapClick?: () => void;
  onRefresh?: () => void;
  onNewService?: () => void;
  priorityFilter?: string[];
  onPriorityFilterChange?: (priorities: string[]) => void;
  statusFilter?: string[];
  onStatusFilterChange?: (statuses: string[]) => void;
}

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Acil", color: "bg-red-500" },
  { value: "high", label: "Yüksek", color: "bg-orange-500" },
  { value: "medium", label: "Orta", color: "bg-blue-500" },
  { value: "low", label: "Düşük", color: "bg-green-500" },
];

const STATUS_OPTIONS = [
  { value: "new", label: "Yeni", color: "bg-blue-500" },
  { value: "assigned", label: "Atandı", color: "bg-purple-500" },
  { value: "in_progress", label: "Devam Ediyor", color: "bg-yellow-500" },
  { value: "completed", label: "Tamamlandı", color: "bg-green-500" },
];

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
  onDateChange,
  onViewModeChange,
  onMapClick,
  onRefresh,
  onNewService,
  priorityFilter = [],
  onPriorityFilterChange,
  statusFilter = [],
  onStatusFilterChange,
}: TimelineHeaderProps) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const formattedDate = format(selectedDate, "d MMMM yyyy", { locale: tr });
  const dayName = format(selectedDate, "EEEE", { locale: tr });
  const isToday = format(new Date(), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
  const isTomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
  const isYesterday = format(subDays(new Date(), 1), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");

  const getDateLabel = () => {
    if (isToday) return "Bugün";
    if (isTomorrow) return "Yarın";
    if (isYesterday) return "Dün";
    return dayName;
  };

  const hasActiveFilters = priorityFilter.length > 0 || statusFilter.length > 0;

  const handlePriorityToggle = (priority: string) => {
    if (!onPriorityFilterChange) return;
    const newFilters = priorityFilter.includes(priority)
      ? priorityFilter.filter(p => p !== priority)
      : [...priorityFilter, priority];
    onPriorityFilterChange(newFilters);
  };

  const handleStatusToggle = (status: string) => {
    if (!onStatusFilterChange) return;
    const newFilters = statusFilter.includes(status)
      ? statusFilter.filter(s => s !== status)
      : [...statusFilter, status];
    onStatusFilterChange(newFilters);
  };

  return (
    <div className="border-b border-border bg-gradient-to-r from-card via-card to-muted/20">
      {/* Main Row */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        {/* Left: Date Navigation + Calendar Picker */}
        <div className="flex items-center gap-3">
          {/* Navigation Buttons */}
          <div className="flex items-center rounded-xl border border-border bg-background/80 backdrop-blur-sm p-1 shadow-sm">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onPreviousDay}
              className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
              title="Önceki gün"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant={isToday ? "default" : "ghost"}
              size="sm" 
              onClick={onToday}
              className={cn(
                "h-9 px-4 rounded-lg font-medium transition-all",
                isToday 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
                  : "hover:bg-primary/10 hover:text-primary"
              )}
            >
              Bugün
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onNextDay}
              className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
              title="Sonraki gün"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Date Display with Picker */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all cursor-pointer",
                "hover:border-primary/50 hover:shadow-md",
                isToday 
                  ? "bg-primary/5 border-primary/30" 
                  : "bg-background/80 border-border"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg",
                isToday ? "bg-primary/10" : "bg-muted"
              )}>
                <Calendar className={cn(
                  "h-4 w-4",
                  isToday ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div className="text-left">
                <p className={cn(
                  "text-xs font-medium",
                  isToday ? "text-primary" : "text-muted-foreground"
                )}>
                  {getDateLabel()}
                </p>
                <p className="text-sm font-semibold text-foreground">{formattedDate}</p>
              </div>
            </button>
            
            {showDatePicker && onDateChange && (
              <div className="absolute top-full left-0 mt-2 z-50">
                <DatePicker
                  date={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      onDateChange(date);
                      setShowDatePicker(false);
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Search - Inline */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ara..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-10 w-56 bg-background/80 border-border rounded-xl focus:border-primary focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Center: View Mode + Filters */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-border bg-muted/30 p-1">
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("day")}
              className={cn(
                "h-8 px-4 rounded-lg gap-2 transition-all",
                viewMode === "day" 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
                  : "hover:bg-primary/10 hover:text-primary"
              )}
            >
              <List className="h-3.5 w-3.5" />
              Gün
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("week")}
              className={cn(
                "h-8 px-4 rounded-lg gap-2 transition-all",
                viewMode === "week" 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
                  : "hover:bg-primary/10 hover:text-primary"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Hafta
            </Button>
          </div>

          {/* Filters Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className={cn(
                  "h-9 rounded-xl gap-2",
                  hasActiveFilters && "border-primary/50 bg-primary/5 text-primary"
                )}
              >
                <Filter className="h-4 w-4" />
                Filtrele
                {hasActiveFilters && (
                  <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                    {priorityFilter.length + statusFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filtreler
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel className="text-xs text-muted-foreground">Öncelik</DropdownMenuLabel>
              {PRIORITY_OPTIONS.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={priorityFilter.includes(option.value)}
                  onCheckedChange={() => handlePriorityToggle(option.value)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", option.color)} />
                    {option.label}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel className="text-xs text-muted-foreground">Durum</DropdownMenuLabel>
              {STATUS_OPTIONS.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={statusFilter.includes(option.value)}
                  onCheckedChange={() => handleStatusToggle(option.value)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", option.color)} />
                    {option.label}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
              
              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      onPriorityFilterChange?.([]);
                      onStatusFilterChange?.([]);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    Filtreleri Temizle
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: Stats + Actions */}
        <div className="flex items-center gap-2">
          {/* Stats */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50">
            <Badge 
              variant="secondary" 
              className="gap-1.5 py-1 px-2.5 bg-background text-foreground border shadow-sm"
            >
              <Users className="h-3.5 w-3.5 text-primary" />
              <span className="font-bold">{technicianCount}</span>
            </Badge>
            
            {unassignedCount > 0 && (
              <Badge 
                variant="outline" 
                className="gap-1.5 py-1 px-2.5 border-warning/50 bg-warning/10 text-warning animate-pulse"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="font-bold">{unassignedCount}</span>
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onRefresh}
              className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary"
              title="Yenile"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          
          {onMapClick && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onMapClick}
              className="h-9 rounded-xl border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Harita
            </Button>
          )}

          {onNewService && (
            <Button 
              size="sm" 
              onClick={onNewService}
              className="h-9 rounded-xl gap-2 shadow-md shadow-primary/25"
            >
              <Plus className="h-4 w-4" />
              Yeni Servis
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
