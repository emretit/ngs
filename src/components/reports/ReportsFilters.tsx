import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Filter, X, ChevronDown, Building2, Users, Banknote, RotateCcw } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReportsFiltersProps {
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams) => void;
}

type DatePreset = {
  label: string;
  value: string;
  getRange: () => { start: Date; end: Date };
};

const datePresets: DatePreset[] = [
  {
    label: "Bugün",
    value: "today",
    getRange: () => ({ start: new Date(), end: new Date() })
  },
  {
    label: "Dün",
    value: "yesterday",
    getRange: () => ({ start: subDays(new Date(), 1), end: subDays(new Date(), 1) })
  },
  {
    label: "Son 7 Gün",
    value: "last7days",
    getRange: () => ({ start: subDays(new Date(), 7), end: new Date() })
  },
  {
    label: "Son 30 Gün",
    value: "last30days",
    getRange: () => ({ start: subDays(new Date(), 30), end: new Date() })
  },
  {
    label: "Bu Ay",
    value: "thisMonth",
    getRange: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) })
  },
  {
    label: "Geçen Ay",
    value: "lastMonth",
    getRange: () => ({ 
      start: startOfMonth(subMonths(new Date(), 1)), 
      end: endOfMonth(subMonths(new Date(), 1)) 
    })
  },
  {
    label: "Bu Çeyrek",
    value: "thisQuarter",
    getRange: () => ({ start: startOfQuarter(new Date()), end: endOfQuarter(new Date()) })
  },
  {
    label: "Bu Yıl",
    value: "thisYear",
    getRange: () => ({ start: startOfYear(new Date()), end: endOfYear(new Date()) })
  },
];

const currencies = [
  { value: "TRY", label: "₺ TRY", flag: "🇹🇷" },
  { value: "USD", label: "$ USD", flag: "🇺🇸" },
  { value: "EUR", label: "€ EUR", flag: "🇪🇺" },
];

export default function ReportsFilters({ searchParams, setSearchParams }: ReportsFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
  );
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Fetch departments
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await supabase.from('departments').select('id, name').eq('is_active', true);
      return data || [];
    }
  });

  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ['employees-filter'],
    queryFn: async () => {
      const { data } = await supabase.from('employees').select('id, first_name, last_name').eq('is_active', true).limit(50);
      return data || [];
    }
  });

  const currency = searchParams.get('currency') || 'TRY';
  const department = searchParams.get('department') || '';
  const employee = searchParams.get('employee') || '';
  const compareMode = searchParams.get('compare') === 'true';

  const updateParams = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handlePresetSelect = (preset: DatePreset) => {
    const { start, end } = preset.getRange();
    setStartDate(start);
    setEndDate(end);
    setSelectedPreset(preset.value);
    
    const newParams = new URLSearchParams(searchParams);
    newParams.set('startDate', format(start, 'yyyy-MM-dd'));
    newParams.set('endDate', format(end, 'yyyy-MM-dd'));
    setSearchParams(newParams);
  };

  const handleCustomDateChange = (type: 'start' | 'end', date: Date | undefined) => {
    if (type === 'start') {
      setStartDate(date);
      if (date) updateParams('startDate', format(date, 'yyyy-MM-dd'));
    } else {
      setEndDate(date);
      if (date) updateParams('endDate', format(date, 'yyyy-MM-dd'));
    }
    setSelectedPreset(null);
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedPreset(null);
    setSearchParams(new URLSearchParams());
  };

  const activeFiltersCount = [
    startDate, endDate, department, employee, compareMode
  ].filter(Boolean).length;

  return (
    <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
      {/* Main Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {datePresets.slice(0, 4).map((preset) => (
            <Button
              key={preset.value}
              variant={selectedPreset === preset.value ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetSelect(preset)}
              className="h-8 text-xs"
            >
              {preset.label}
            </Button>
          ))}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                Daha Fazla
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              <div className="flex flex-col gap-1">
                {datePresets.slice(4).map((preset) => (
                  <Button
                    key={preset.value}
                    variant={selectedPreset === preset.value ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handlePresetSelect(preset)}
                    className="justify-start h-8 text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-border hidden sm:block" />

        {/* Custom Date Range */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 text-xs gap-1.5 min-w-[120px] justify-start",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {startDate ? format(startDate, "dd MMM yyyy", { locale: tr }) : "Başlangıç"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => handleCustomDateChange('start', date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground text-xs">—</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 text-xs gap-1.5 min-w-[120px] justify-start",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {endDate ? format(endDate, "dd MMM yyyy", { locale: tr }) : "Bitiş"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => handleCustomDateChange('end', date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-border hidden lg:block" />

        {/* Currency Selector */}
        <Select value={currency} onValueChange={(val) => updateParams('currency', val)}>
          <SelectTrigger className="h-8 w-[100px] text-xs">
            <Banknote className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((c) => (
              <SelectItem key={c.value} value={c.value} className="text-xs">
                <span className="mr-1.5">{c.flag}</span>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* More Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "h-8 text-xs gap-1.5 ml-auto",
            isExpanded && "bg-primary/10"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Filtreler
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="h-5 w-5 p-0 text-[10px] rounded-full">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Temizle
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Department Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Departman
            </label>
            <Select value={department} onValueChange={(val) => updateParams('department', val === 'all' ? null : val)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tümü</SelectItem>
                {departments?.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id} className="text-xs">
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employee Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Çalışan
            </label>
            <Select value={employee} onValueChange={(val) => updateParams('employee', val === 'all' ? null : val)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tümü</SelectItem>
                {employees?.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id} className="text-xs">
                    {emp.first_name} {emp.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Compare Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Karşılaştırma Modu
            </label>
            <Button
              variant={compareMode ? "default" : "outline"}
              size="sm"
              className="w-full h-9 text-xs"
              onClick={() => updateParams('compare', compareMode ? null : 'true')}
            >
              {compareMode ? "✓ Önceki Dönem ile Karşılaştır" : "Önceki Dönem ile Karşılaştır"}
            </Button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Aktif Filtreler:</span>
          
          {startDate && endDate && (
            <Badge variant="secondary" className="text-xs gap-1 pr-1">
              {format(startDate, "dd MMM", { locale: tr })} - {format(endDate, "dd MMM yyyy", { locale: tr })}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-destructive/20"
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                  updateParams('startDate', null);
                  updateParams('endDate', null);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {department && (
            <Badge variant="secondary" className="text-xs gap-1 pr-1">
              Departman: {departments?.find(d => d.id === department)?.name}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-destructive/20"
                onClick={() => updateParams('department', null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {compareMode && (
            <Badge variant="secondary" className="text-xs gap-1 pr-1">
              Karşılaştırma Aktif
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-destructive/20"
                onClick={() => updateParams('compare', null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
}
