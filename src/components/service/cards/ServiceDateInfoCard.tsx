import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface ServiceDateInfoCardProps {
  formData: {
    service_reported_date: Date;
    service_due_date: Date | null;
    service_start_date: Date | null;
    service_end_date: Date | null;
  };
  handleInputChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const ServiceDateInfoCard: React.FC<ServiceDateInfoCardProps> = ({
  formData,
  handleInputChange,
  errors = {}
}) => {
  // service_due_date'den saat bilgisini çıkar (HH:mm formatında)
  const dueDateTime = useMemo(() => {
    if (!formData.service_due_date) return "";
    return format(formData.service_due_date, "HH:mm");
  }, [formData.service_due_date]);

  // service_start_date'den saat bilgisini çıkar (HH:mm formatında)
  const startDateTime = useMemo(() => {
    if (!formData.service_start_date) return "";
    return format(formData.service_start_date, "HH:mm");
  }, [formData.service_start_date]);

  // service_end_date'den saat bilgisini çıkar (HH:mm formatında)
  const endDateTime = useMemo(() => {
    if (!formData.service_end_date) return "";
    return format(formData.service_end_date, "HH:mm");
  }, [formData.service_end_date]);

  // Tarih ve saati birleştir
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      handleInputChange('service_due_date', null);
      return;
    }

    // Eğer mevcut service_due_date'de saat bilgisi varsa koru, yoksa sadece tarih kaydet (00:00:00)
    if (formData.service_due_date && dueDateTime) {
      // Mevcut saat bilgisini koru
      const [hours, minutes] = dueDateTime.split(":");
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      handleInputChange('service_due_date', newDate);
    } else {
      // Sadece tarih kaydet, saat 00:00:00
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      handleInputChange('service_due_date', newDate);
    }
  };

  const handleTimeSelect = (time: string) => {
    if (!time) {
      // Saat seçimi temizlendi, sadece tarih bilgisini koru
      if (formData.service_due_date) {
        const dateOnly = new Date(formData.service_due_date);
        dateOnly.setHours(0, 0, 0, 0);
        handleInputChange('service_due_date', dateOnly);
      }
      return;
    }

    if (!formData.service_due_date) {
      // Eğer tarih yoksa, bugünün tarihini kullan
      const today = new Date();
      const [hours, minutes] = time.split(":");
      today.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      handleInputChange('service_due_date', today);
      return;
    }

    // Mevcut tarihi koru, sadece saati güncelle
    const [hours, minutes] = time.split(":");
    const newDate = new Date(formData.service_due_date);
    newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    
    handleInputChange('service_due_date', newDate);
  };

  // Servis başlama tarihi ve saati için handler'lar
  const handleStartDateSelect = (date: Date | undefined) => {
    if (!date) {
      handleInputChange('service_start_date', null);
      return;
    }

    if (formData.service_start_date && startDateTime) {
      const [hours, minutes] = startDateTime.split(":");
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      handleInputChange('service_start_date', newDate);
    } else {
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      handleInputChange('service_start_date', newDate);
    }
  };

  const handleStartTimeSelect = (time: string) => {
    if (!time) {
      if (formData.service_start_date) {
        const dateOnly = new Date(formData.service_start_date);
        dateOnly.setHours(0, 0, 0, 0);
        handleInputChange('service_start_date', dateOnly);
      }
      return;
    }

    if (!formData.service_start_date) {
      const today = new Date();
      const [hours, minutes] = time.split(":");
      today.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      handleInputChange('service_start_date', today);
      return;
    }

    const [hours, minutes] = time.split(":");
    const newDate = new Date(formData.service_start_date);
    newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    handleInputChange('service_start_date', newDate);
  };

  // Servis bitiş tarihi ve saati için handler'lar
  const handleEndDateSelect = (date: Date | undefined) => {
    if (!date) {
      handleInputChange('service_end_date', null);
      return;
    }

    if (formData.service_end_date && endDateTime) {
      const [hours, minutes] = endDateTime.split(":");
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      handleInputChange('service_end_date', newDate);
    } else {
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      handleInputChange('service_end_date', newDate);
    }
  };

  const handleEndTimeSelect = (time: string) => {
    if (!time) {
      if (formData.service_end_date) {
        const dateOnly = new Date(formData.service_end_date);
        dateOnly.setHours(0, 0, 0, 0);
        handleInputChange('service_end_date', dateOnly);
      }
      return;
    }

    if (!formData.service_end_date) {
      const today = new Date();
      const [hours, minutes] = time.split(":");
      today.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      handleInputChange('service_end_date', today);
      return;
    }

    const [hours, minutes] = time.split(":");
    const newDate = new Date(formData.service_end_date);
    newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    handleInputChange('service_end_date', newDate);
  };

  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
            <Calendar className="h-4 w-4 text-purple-600" />
          </div>
          Tarih Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-3 pb-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Bildirim Tarihi
            </Label>
            <DatePicker
              date={formData.service_reported_date}
              onSelect={(date) => handleInputChange('service_reported_date', date || new Date())}
              placeholder="Bildirim tarihi seçin"
              className="h-10 text-sm w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Hedef Teslim Tarihi <span className="text-gray-500 font-normal">(İsteğe bağlı)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <DatePicker
                date={formData.service_due_date}
                onSelect={handleDateSelect}
                placeholder="Tarih seçin"
                className="h-10 text-sm"
              />
              <TimePicker
                time={dueDateTime}
                onSelect={handleTimeSelect}
                placeholder="Saat (opsiyonel)"
                className="h-10"
                disabled={!formData.service_due_date}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-200">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Servis Başlama Tarihi <span className="text-gray-500 font-normal">(İsteğe bağlı)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <DatePicker
                date={formData.service_start_date}
                onSelect={handleStartDateSelect}
                placeholder="Tarih seçin"
                className="h-10 text-sm"
              />
              <TimePicker
                time={startDateTime}
                onSelect={handleStartTimeSelect}
                placeholder="Saat (opsiyonel)"
                className="h-10"
                disabled={!formData.service_start_date}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Servis Bitirme Tarihi <span className="text-gray-500 font-normal">(İsteğe bağlı)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <DatePicker
                date={formData.service_end_date}
                onSelect={handleEndDateSelect}
                placeholder="Tarih seçin"
                className="h-10 text-sm"
              />
              <TimePicker
                time={endDateTime}
                onSelect={handleEndTimeSelect}
                placeholder="Saat (opsiyonel)"
                className="h-10"
                disabled={!formData.service_end_date}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceDateInfoCard;

