import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
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

  if (!isRecurring) {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-5 w-5 text-muted-foreground" />
          <Label htmlFor="recurring-toggle" className="text-base font-medium">
            Tekrar Eden Görev
          </Label>
          <Switch
            id="recurring-toggle"
            checked={isRecurring}
            onCheckedChange={handleRecurrenceToggle}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Bu görevi düzenli olarak tekrarlamak için aktif edin
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-primary/5">
      <div className="flex items-center space-x-3">
        <RefreshCw className="h-5 w-5 text-primary" />
        <Label htmlFor="recurring-toggle" className="text-base font-medium">
          Tekrar Eden Görev
        </Label>
        <Switch
          id="recurring-toggle"
          checked={isRecurring}
          onCheckedChange={handleRecurrenceToggle}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recurrence Type */}
        <div className="space-y-2">
          <Label>Tekrarlama Sıklığı</Label>
          <Select value={recurrenceType} onValueChange={handleRecurrenceTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sıklık seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">🗓️ Günlük</SelectItem>
              <SelectItem value="weekly">📅 Haftalık</SelectItem>
              <SelectItem value="monthly">📆 Aylık</SelectItem>
              <SelectItem value="custom">⚙️ Özel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Interval */}
        {recurrenceType === 'custom' && (
          <div className="space-y-2">
            <Label>Özel Aralık</Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                min="1"
                max="365"
                value={recurrenceInterval}
                onChange={(e) => setValue("recurrence_interval", parseInt(e.target.value) || 1)}
                className="w-20"
              />
              <span className="flex items-center text-sm text-muted-foreground">günde bir</span>
            </div>
          </div>
        )}
      </div>

      {/* Weekly Days Selection */}
      {recurrenceType === 'weekly' && (
        <div className="space-y-2">
          <Label>Hangi Günlerde?</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {weekDays.map(day => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={day.value}
                  checked={recurrenceDays.includes(day.value)}
                  onCheckedChange={(checked) => handleWeekDayToggle(day.value, !!checked)}
                />
                <Label htmlFor={day.value} className="text-sm">
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Day Selection */}
      {recurrenceType === 'monthly' && (
        <div className="space-y-2">
          <Label>Ayın Hangi Günü?</Label>
          <div className="flex space-x-2">
            <Input
              type="number"
              min="1"
              max="31"
              value={recurrenceDayOfMonth}
              onChange={(e) => setValue("recurrence_day_of_month", parseInt(e.target.value) || 1)}
              className="w-20"
            />
            <span className="flex items-center text-sm text-muted-foreground">. gün</span>
          </div>
        </div>
      )}

      {/* End Date */}
      <div className="space-y-2">
        <Label>Bitiş Tarihi (İsteğe Bağlı)</Label>
        <EnhancedDatePicker
          date={recurrenceEndDate}
          onSelect={(date) => setValue("recurrence_end_date", date)}
          placeholder="Bitiş tarihi yok (süresiz)"
          className="w-full"
        />
        {recurrenceEndDate && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setValue("recurrence_end_date", undefined)}
          >
            Tarihi Temizle
          </Button>
        )}
      </div>

      {/* Preview */}
      <div className="p-3 bg-muted/50 rounded-md">
        <Label className="text-sm font-medium">Önizleme:</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Bu görev {
            recurrenceType === 'daily' ? 'her gün' :
            recurrenceType === 'weekly' ?
              (recurrenceDays.length > 0 ?
                `her hafta ${recurrenceDays.map(d => weekDays.find(wd => wd.value === d)?.label).join(', ')}`
                : 'haftalık'
              ) :
            recurrenceType === 'monthly' ? `her ayın ${recurrenceDayOfMonth}. günü` :
            recurrenceType === 'custom' ? `${recurrenceInterval} günde bir` : 'tekrarlanacak'
          } tekrarlanacak{recurrenceEndDate ? ` (${format(recurrenceEndDate, "PPP", { locale: tr })} tarihine kadar)` : ' (süresiz)'}.
        </p>
      </div>
    </div>
  );
};

export default TaskRecurrence;