import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TimePickerProps {
  time?: string; // HH:mm formatında
  onSelect?: (time: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TimePicker({ 
  time, 
  onSelect, 
  placeholder = "Saat seçin", 
  className,
  disabled = false 
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedHour, setSelectedHour] = React.useState<string>("");
  const [selectedMinute, setSelectedMinute] = React.useState<string>("");

  // Time değerini parse et
  React.useEffect(() => {
    if (time) {
      const [hour, minute] = time.split(":");
      setSelectedHour(hour || "");
      setSelectedMinute(minute || "");
    } else {
      setSelectedHour("");
      setSelectedMinute("");
    }
  }, [time]);

  // Saat ve dakika seçildiğinde onSelect'i çağır
  // Sadece selectedHour veya selectedMinute değiştiğinde çağır (onSelect dependency'sini kaldırdık)
  React.useEffect(() => {
    if (selectedHour && selectedMinute && onSelect) {
      const formattedTime = `${selectedHour.padStart(2, '0')}:${selectedMinute.padStart(2, '0')}`;
      // Sadece değer gerçekten değiştiyse çağır
      if (formattedTime !== time) {
        onSelect(formattedTime);
      }
    }
  }, [selectedHour, selectedMinute]); // onSelect'i dependency'den çıkardık

  // Saat seçenekleri (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  // Dakika seçenekleri (00, 15, 30, 45 veya 00-59)
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return placeholder;
    const [hour, minute] = timeStr.split(":");
    if (hour && minute) {
      return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    }
    return placeholder;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full h-8 justify-between text-left font-normal text-sm",
            !time && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          type="button"
        >
          <span className="truncate text-left flex-1">
            {formatDisplayTime(time || "")}
          </span>
          <Clock className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex gap-3">
          {/* Saat Seçimi */}
          <div className="flex flex-col">
            <div className="text-xs font-medium text-gray-500 mb-2 text-center">Saat</div>
            <div className="max-h-[200px] overflow-y-auto border rounded-md p-1.5 space-y-0.5">
              {hours.map((hour) => (
                <button
                  key={hour}
                  onClick={() => {
                    setSelectedHour(hour);
                  }}
                  className={cn(
                    "w-12 px-2 py-1.5 text-sm rounded-md transition-all font-medium block text-center",
                    selectedHour === hour
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {hour}
                </button>
              ))}
            </div>
          </div>

          {/* Dakika Seçimi */}
          <div className="flex flex-col">
            <div className="text-xs font-medium text-gray-500 mb-2 text-center">Dakika</div>
            <div className="max-h-[200px] overflow-y-auto border rounded-md p-1.5 space-y-0.5">
              {minutes.map((minute) => (
                <button
                  key={minute}
                  onClick={() => {
                    setSelectedMinute(minute);
                  }}
                  className={cn(
                    "w-12 px-2 py-1.5 text-sm rounded-md transition-all font-medium block text-center",
                    selectedMinute === minute
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {minute}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Seçilen Saat Gösterimi ve Kapat Butonu */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between gap-2">
          <div className="text-sm font-medium text-gray-700">
            {selectedHour && selectedMinute 
              ? `${selectedHour.padStart(2, '0')}:${selectedMinute.padStart(2, '0')}`
              : "Saat seçin"
            }
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-7 text-xs px-3"
          >
            Tamam
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

TimePicker.displayName = "TimePicker";

