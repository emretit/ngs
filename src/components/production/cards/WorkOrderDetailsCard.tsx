import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { CalendarDays, AlertCircle } from "lucide-react";
import { WorkOrderStatus, WorkOrderPriority } from "@/types/production";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";

interface WorkOrderDetailsCardProps {
  formData: {
    status: WorkOrderStatus;
    priority: WorkOrderPriority;
    planned_start_date?: Date;
    planned_end_date?: Date;
    assigned_to?: string;
  };
  onFieldChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const WorkOrderDetailsCard: React.FC<WorkOrderDetailsCardProps> = ({
  formData,
  onFieldChange,
  errors = {}
}) => {
  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
            <CalendarDays className="h-4 w-4 text-green-600" />
          </div>
          İş Emri Detayları
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium text-gray-700">Durum</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => onFieldChange('status', value)}
            >
              <SelectTrigger className="mt-1 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">📝 Taslak</SelectItem>
                <SelectItem value="planned">📅 Planlandı</SelectItem>
                <SelectItem value="in_progress">⚙️ Üretimde</SelectItem>
                <SelectItem value="completed">✔️ Tamamlandı</SelectItem>
                <SelectItem value="cancelled">❌ İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Öncelik</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value) => onFieldChange('priority', value)}
            >
              <SelectTrigger className="mt-1 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Düşük</SelectItem>
                <SelectItem value="medium">🟡 Orta</SelectItem>
                <SelectItem value="high">🔴 Yüksek</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">Sorumlu Personel</Label>
          <EmployeeSelector
            value={formData.assigned_to || ""}
            onChange={(value) => onFieldChange('assigned_to', value)}
            placeholder="Personel seçin..."
            className="mt-1 h-8"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium text-gray-700">Planlanan Başlangıç</Label>
            <DatePicker
              date={formData.planned_start_date}
              onSelect={(date) => onFieldChange('planned_start_date', date)}
              placeholder="Başlangıç tarihi"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Planlanan Bitiş</Label>
            <DatePicker
              date={formData.planned_end_date}
              onSelect={(date) => onFieldChange('planned_end_date', date)}
              placeholder="Bitiş tarihi"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkOrderDetailsCard;
