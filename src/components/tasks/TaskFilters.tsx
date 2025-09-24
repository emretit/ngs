import React, { useState } from 'react';
import { Filter, X, Calendar, User, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { TaskFilters as ITaskFilters, TaskStatus, TaskPriority } from '@/types/task';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TaskFiltersProps {
  filters: ITaskFilters;
  onFiltersChange: (filters: ITaskFilters) => void;
}

const statusOptions = [
  { value: 'todo', label: 'Yapılacak' },
  { value: 'in_progress', label: 'Devam Ediyor' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'postponed', label: 'Ertelendi' }
];

const priorityOptions = [
  { value: 'low', label: 'Düşük' },
  { value: 'medium', label: 'Orta' },
  { value: 'high', label: 'Yüksek' },
  { value: 'urgent', label: 'Acil' }
];

const TaskFilters: React.FC<TaskFiltersProps> = ({ filters, onFiltersChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch employees for assignee filter
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('status', 'aktif')
        .order('first_name');

      if (error) throw error;
      return data || [];
    }
  });

  const updateFilters = (newFilters: Partial<ITaskFilters>) => {
    onFiltersChange({ ...filters, ...newFilters });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = [
    filters.status?.length,
    filters.priority?.length,
    filters.assigneeId?.length,
    filters.dueDateRange ? 1 : 0,
    filters.onlyMine ? 1 : 0
  ].filter(Boolean).length;

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filtreler
            {activeFilterCount > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filtreler</h4>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  Temizle
                </Button>
              )}
            </div>

            {/* Only Mine Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="onlyMine"
                checked={filters.onlyMine || false}
                onCheckedChange={(checked) => 
                  updateFilters({ onlyMine: checked as boolean })
                }
              />
              <Label htmlFor="onlyMine" className="text-sm">
                Sadece benim görevlerim
              </Label>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Durum</Label>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={filters.status?.includes(option.value as TaskStatus) || false}
                      onCheckedChange={(checked) => {
                        const current = filters.status || [];
                        const updated = checked
                          ? [...current, option.value as TaskStatus]
                          : current.filter(s => s !== option.value);
                        updateFilters({ status: updated.length > 0 ? updated : undefined });
                      }}
                    />
                    <Label htmlFor={`status-${option.value}`} className="text-xs">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Öncelik</Label>
              <div className="grid grid-cols-2 gap-2">
                {priorityOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${option.value}`}
                      checked={filters.priority?.includes(option.value as TaskPriority) || false}
                      onCheckedChange={(checked) => {
                        const current = filters.priority || [];
                        const updated = checked
                          ? [...current, option.value as TaskPriority]
                          : current.filter(p => p !== option.value);
                        updateFilters({ priority: updated.length > 0 ? updated : undefined });
                      }}
                    />
                    <Label htmlFor={`priority-${option.value}`} className="text-xs">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Assignee Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Atanan Kişi</Label>
              <Select
                value={filters.assigneeId?.[0] || ''}
                onValueChange={(value) => 
                  updateFilters({ 
                    assigneeId: value ? [value] : undefined 
                  })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Kişi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tümü</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Bitiş Tarihi Aralığı</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-8",
                      !filters.dueDateRange && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.dueDateRange ? (
                      `${format(filters.dueDateRange.start, 'dd/MM/yyyy', { locale: tr })} - ${format(filters.dueDateRange.end, 'dd/MM/yyyy', { locale: tr })}`
                    ) : (
                      "Tarih aralığı seçin"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    mode="range"
                    selected={filters.dueDateRange ? {
                      from: filters.dueDateRange.start,
                      to: filters.dueDateRange.end
                    } : undefined}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        updateFilters({
                          dueDateRange: {
                            start: range.from,
                            end: range.to
                          }
                        });
                      } else {
                        updateFilters({ dueDateRange: undefined });
                      }
                    }}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {filters.onlyMine && (
            <Badge variant="secondary" className="text-xs">
              Sadece Benim
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => updateFilters({ onlyMine: false })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.status?.map((status) => (
            <Badge key={status} variant="secondary" className="text-xs">
              {statusOptions.find(s => s.value === status)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => {
                  const updated = filters.status?.filter(s => s !== status);
                  updateFilters({ status: updated?.length ? updated : undefined });
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}

          {filters.priority?.map((priority) => (
            <Badge key={priority} variant="secondary" className="text-xs">
              {priorityOptions.find(p => p.value === priority)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => {
                  const updated = filters.priority?.filter(p => p !== priority);
                  updateFilters({ priority: updated?.length ? updated : undefined });
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskFilters;