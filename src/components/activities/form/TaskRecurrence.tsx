import React, { useEffect, useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Repeat, Calendar } from "lucide-react";
import { FormValues, RecurrenceType } from "./types";
import { UseFormSetValue, UseFormWatch } from "react-hook-form";

interface TaskRecurrenceProps {
  watch: UseFormWatch<FormValues>;
  setValue: UseFormSetValue<FormValues>;
}

const weekDays = [
  { value: 'monday', label: 'Pazartesi' },
  { value: 'tuesday', label: 'Salı' },
  { value: 'wednesday', label: 'Çarşamba' },
  { value: 'thursday', label: 'Perşembe' },
  { value: 'friday', label: 'Cuma' },
  { value: 'saturday', label: 'Cumartesi' },
  { value: 'sunday', label: 'Pazar' },
];

const TaskRecurrence = ({ watch, setValue }: TaskRecurrenceProps) => {
  const isRecurring = watch("is_recurring") || false;
  const recurrenceType = watch("recurrence_type") || 'none';
  const recurrenceInterval = watch("recurrence_interval") || 1;
  const recurrenceEndDate = watch("recurrence_end_date");
  const recurrenceDays = watch("recurrence_days") || [];
  const recurrenceDayOfMonth = watch("recurrence_day_of_month") || 1;

  // Stabilize setValue to prevent infinite loops
  const setValueRef = useRef(setValue);
  useEffect(() => {
    setValueRef.current = setValue;
  }, [setValue]);

  const handleRecurrenceToggle = (checked: boolean) => {
    setValue("is_recurring", checked);
    if (!checked) {
      setValue("recurrence_type", 'none');
      setValue("recurrence_interval", 1);
      setValue("recurrence_end_date", undefined);
      setValue("recurrence_days", []);
      setValue("recurrence_day_of_month", 1);
    } else {
      setValue("recurrence_type", 'daily');
    }
  };

  const handleRecurrenceTypeChange = (type: RecurrenceType) => {
    setValue("recurrence_type", type);
    // Reset type-specific fields
    setValue("recurrence_days", []);
    setValue("recurrence_day_of_month", 1);
    setValue("recurrence_interval", 1);
  };

  const handleWeekDayToggle = (day: string, checked: boolean) => {
    const currentDays = recurrenceDays || [];
    if (checked) {
      setValue("recurrence_days", [...currentDays, day]);
    } else {
      setValue("recurrence_days", currentDays.filter(d => d !== day));
    }
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
              onCheckedChange={handleRecurrenceToggle}
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
            <Select value={recurrenceType} onValueChange={handleRecurrenceTypeChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Sıklık seçin" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[9999]">
                <SelectItem value="daily">Günlük</SelectItem>
                <SelectItem value="weekly">Haftalık</SelectItem>
                <SelectItem value="monthly">Aylık</SelectItem>
                <SelectItem value="custom">Özel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Interval */}
          {recurrenceType === 'custom' && (
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Her kaç günde bir?</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={recurrenceInterval}
                onChange={(e) => setValue("recurrence_interval", parseInt(e.target.value) || 1)}
                className="h-8 text-xs"
              />
            </div>
          )}

          {/* Weekly Days Selection */}
          {recurrenceType === 'weekly' && (
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Haftanın Günleri</Label>
              <div className="grid grid-cols-2 gap-2">
                {weekDays.map(day => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.value}
                      checked={recurrenceDays.includes(day.value)}
                      onCheckedChange={(checked) => handleWeekDayToggle(day.value, !!checked)}
                    />
                    <Label htmlFor={day.value} className="text-xs font-normal cursor-pointer">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
              {recurrenceDays.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  En az bir gün seçmelisiniz
                </p>
              )}
            </div>
          )}

          {/* Monthly Day Selection */}
          {recurrenceType === 'monthly' && (
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Ayın Kaçında?</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={recurrenceDayOfMonth || ''}
                onChange={(e) => setValue("recurrence_day_of_month", parseInt(e.target.value) || undefined)}
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
            <EnhancedDatePicker
              date={recurrenceEndDate}
              onSelect={(date) => setValue("recurrence_end_date", date)}
              placeholder="Sınırsız"
              className="h-8 text-xs w-full"
            />
          </div>

          {/* Preview */}
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {recurrenceType === 'daily' ? 'Her gün' :
                 recurrenceType === 'weekly' ?
                   (recurrenceDays.length > 0 ?
                     `Her hafta ${recurrenceDays.map(d => weekDays.find(wd => wd.value === d)?.label).join(', ')}`
                     : 'Haftalık'
                   ) :
                 recurrenceType === 'monthly' ? `Her ayın ${recurrenceDayOfMonth}. günü` :
                 recurrenceType === 'custom' ? `${recurrenceInterval} günde bir` : 'Tekrarlanmaz'}
                {recurrenceEndDate ? ` (${format(recurrenceEndDate, "dd/MM/yyyy", { locale: tr })} tarihine kadar)` : ' (süresiz)'}
              </Badge>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default TaskRecurrence;