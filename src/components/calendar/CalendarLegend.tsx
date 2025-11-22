import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_EVENT_FILTERS } from './types';

export const CalendarLegend = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Renk Açıklamaları</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Object.entries(DEFAULT_EVENT_FILTERS).map(([key, filter]) => {
            const Icon = filter.icon;
            return (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded flex-shrink-0"
                  style={{ backgroundColor: filter.color }}
                />
                <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{filter.label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

