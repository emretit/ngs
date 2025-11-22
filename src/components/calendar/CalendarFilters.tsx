import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { EventType, EventTypeFilter } from './types';

interface CalendarFiltersProps {
  eventFilters: Record<EventType, EventTypeFilter>;
  onFilterChange: (filters: Record<EventType, EventTypeFilter>) => void;
}

export const CalendarFilters = ({ eventFilters, onFilterChange }: CalendarFiltersProps) => {
  const handleToggleAll = () => {
    const allEnabled = Object.values(eventFilters).every(f => f.enabled);
    const newFilters = { ...eventFilters };
    Object.keys(newFilters).forEach(key => {
      newFilters[key as EventType].enabled = !allEnabled;
    });
    onFilterChange(newFilters);
  };

  const handleToggleFilter = (key: EventType, enabled: boolean) => {
    onFilterChange({
      ...eventFilters,
      [key]: { ...eventFilters[key], enabled }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Gösterilecek Etkinlik Türleri</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleAll}
          >
            {Object.values(eventFilters).every(f => f.enabled) ? 'Tümünü Gizle' : 'Tümünü Göster'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(eventFilters).map(([key, filter]) => {
            const Icon = filter.icon;
            return (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={filter.enabled}
                  onCheckedChange={(checked) => handleToggleFilter(key as EventType, checked as boolean)}
                />
                <Label
                  htmlFor={key}
                  className="text-sm font-normal cursor-pointer flex items-center gap-2"
                >
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: filter.color }}
                  />
                  <Icon className="h-4 w-4" />
                  {filter.label}
                </Label>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

