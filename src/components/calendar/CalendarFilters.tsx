import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { EventType, EventTypeFilter } from './types';

interface CalendarFiltersProps {
  eventFilters: Record<EventType, EventTypeFilter>;
  onFilterChange: (filters: Record<EventType, EventTypeFilter>) => void;
}

// Etkinlik türlerini gruplara ayır
const EVENT_GROUPS = [
  {
    id: 'sales',
    label: 'Satış İşlemleri',
    types: ['order', 'proposal', 'sales_invoice', 'opportunity', 'delivery'] as EventType[]
  },
  {
    id: 'purchase',
    label: 'Satın Alma İşlemleri',
    types: ['purchase_invoice', 'purchase_order', 'purchase_request', 'vendor_invoice', 'grn', 'rfq'] as EventType[]
  },
  {
    id: 'service',
    label: 'Hizmet İşlemleri',
    types: ['work_order', 'service_request', 'service_slip'] as EventType[]
  },
  {
    id: 'finance',
    label: 'Finansal İşlemler',
    types: ['payment', 'expense', 'check'] as EventType[]
  },
  {
    id: 'inventory',
    label: 'Stok/Depo',
    types: ['inventory_transaction'] as EventType[]
  },
  {
    id: 'hr',
    label: 'İnsan Kaynakları',
    types: ['employee_leave'] as EventType[]
  },
  {
    id: 'vehicle',
    label: 'Araç İşlemleri',
    types: ['vehicle_maintenance', 'vehicle_document', 'vehicle_incident'] as EventType[]
  },
  {
    id: 'other',
    label: 'Diğer',
    types: ['activity', 'event'] as EventType[]
  }
];

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

  const handleToggleGroup = (groupTypes: EventType[], enabled: boolean) => {
    const newFilters = { ...eventFilters };
    groupTypes.forEach(key => {
      newFilters[key].enabled = enabled;
    });
    onFilterChange(newFilters);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {EVENT_GROUPS.map((group) => {
            const groupFilters = group.types.map(type => eventFilters[type]);
            const allGroupEnabled = groupFilters.every(f => f.enabled);

            return (
              <div key={group.id} className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h3 className="text-sm font-semibold">{group.label}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleToggleGroup(group.types, !allGroupEnabled)}
                  >
                    {allGroupEnabled ? 'Gizle' : 'Göster'}
                  </Button>
                </div>
                <div className="space-y-2">
                  {group.types.map((key) => {
                    const filter = eventFilters[key];
                    const Icon = filter.icon;
                    return (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={filter.enabled}
                          onCheckedChange={(checked) => handleToggleFilter(key, checked as boolean)}
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
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

