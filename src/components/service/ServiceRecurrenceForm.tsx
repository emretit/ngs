import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { RecurrenceConfig, RecurrenceType, getRecurrenceDescription } from '@/utils/serviceRecurrenceUtils';
import { Repeat, Calendar, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface ServiceRecurrenceFormProps {
  value?: RecurrenceConfig;
  onChange: (config: RecurrenceConfig) => void;
}

const dayOptions = [
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
  { value: 6, label: 'Cumartesi' },
  { value: 7, label: 'Pazar' },
];

export const ServiceRecurrenceForm: React.FC<ServiceRecurrenceFormProps> = ({
  value,
  onChange,
}) => {
  const [isRecurring, setIsRecurring] = useState(value?.type !== 'none' && value?.type !== undefined);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(value?.type || 'none');
  const [interval, setInterval] = useState(value?.interval || 1);
  const [endDate, setEndDate] = useState<Date | undefined>(value?.endDate);
  const [selectedDays, setSelectedDays] = useState<number[]>(value?.days || []);
  const [dayOfMonth, setDayOfMonth] = useState(value?.dayOfMonth);

  useEffect(() => {
    if (!isRecurring) {
      onChange({ type: 'none' });
      return;
    }

    const config: RecurrenceConfig = {
      type: recurrenceType,
      interval: interval > 0 ? interval : 1,
      endDate,
      days: recurrenceType === 'weekly' ? selectedDays : undefined,
      dayOfMonth: recurrenceType === 'monthly' ? dayOfMonth : undefined,
    };

    onChange(config);
  }, [isRecurring, recurrenceType, interval, endDate, selectedDays, dayOfMonth, onChange]);

  const handleDayToggle = (day: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day].sort();
      }
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            Tekrarlama Ayarları
          </CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
            <Label className="text-xs">Tekrarlansın</Label>
          </div>
        </div>
      </CardHeader>
      {isRecurring && (
        <CardContent className="space-y-4">
          {/* Recurrence Type */}
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Tekrarlama Tipi</Label>
            <Select
              value={recurrenceType}
              onValueChange={(value) => setRecurrenceType(value as RecurrenceType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Günlük</SelectItem>
                <SelectItem value="weekly">Haftalık</SelectItem>
                <SelectItem value="monthly">Aylık</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Interval */}
          {recurrenceType !== 'none' && (
            <div>
              <Label className="text-xs font-medium mb-1.5 block">
                {recurrenceType === 'daily' && 'Her kaç günde bir?'}
                {recurrenceType === 'weekly' && 'Her kaç haftada bir?'}
                {recurrenceType === 'monthly' && 'Her kaç ayda bir?'}
              </Label>
              <Input
                type="number"
                min="1"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                className="h-8 text-xs"
              />
            </div>
          )}

          {/* Weekly: Day Selection */}
          {recurrenceType === 'weekly' && (
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Haftanın Günleri</Label>
              <div className="grid grid-cols-2 gap-2">
                {dayOptions.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={selectedDays.includes(day.value)}
                      onCheckedChange={() => handleDayToggle(day.value)}
                    />
                    <Label
                      htmlFor={`day-${day.value}`}
                      className="text-xs font-normal cursor-pointer"
                    >
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedDays.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  En az bir gün seçmelisiniz
                </p>
              )}
            </div>
          )}

          {/* Monthly: Day of Month */}
          {recurrenceType === 'monthly' && (
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Ayın Kaçında?</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth || ''}
                onChange={(e) => setDayOfMonth(parseInt(e.target.value) || undefined)}
                className="h-8 text-xs"
                placeholder="1-31"
              />
            </div>
          )}

          {/* End Date */}
          <div>
            <Label className="text-xs font-medium mb-1.5 block">
              Bitiş Tarihi <span className="text-muted-foreground font-normal">(İsteğe bağlı)</span>
            </Label>
            <DatePicker
              date={endDate}
              onSelect={setEndDate}
              placeholder="Sınırsız"
              className="h-8 text-xs w-full"
            />
          </div>

          {/* Preview */}
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {getRecurrenceDescription({
                  type: recurrenceType,
                  interval,
                  endDate,
                  days: selectedDays.length > 0 ? selectedDays : undefined,
                  dayOfMonth,
                })}
              </Badge>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

