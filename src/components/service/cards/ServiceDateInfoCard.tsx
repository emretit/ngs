import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Calendar } from "lucide-react";

interface ServiceDateInfoCardProps {
  formData: {
    service_reported_date: Date;
    service_due_date: Date | null;
  };
  handleInputChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const ServiceDateInfoCard: React.FC<ServiceDateInfoCardProps> = ({
  formData,
  handleInputChange,
  errors = {}
}) => {
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
      <CardContent className="space-y-2 pt-0 px-3 pb-3">
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

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Hedef Teslim Tarihi <span className="text-gray-500 font-normal">(İsteğe bağlı)</span>
            </Label>
            <DatePicker
              date={formData.service_due_date}
              onSelect={(date) => handleInputChange('service_due_date', date)}
              placeholder="Hedef tarih seçin"
              className="h-10 text-sm w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceDateInfoCard;

