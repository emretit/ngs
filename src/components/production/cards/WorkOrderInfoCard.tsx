import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Factory } from "lucide-react";

interface WorkOrderInfoCardProps {
  formData: {
    title: string;
    description?: string;
  };
  onFieldChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const WorkOrderInfoCard: React.FC<WorkOrderInfoCardProps> = ({
  formData,
  onFieldChange,
  errors = {}
}) => {
  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
            <Factory className="h-4 w-4 text-blue-600" />
          </div>
          İş Emri Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-4 pb-4">
        <div>
          <Label htmlFor="title" className="text-sm font-medium text-gray-700">
            İş Emri Başlığı <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title || ""}
            onChange={(e) => onFieldChange('title', e.target.value)}
            placeholder="Örn: Masa Üretimi"
            className="mt-1 h-8 text-sm"
            required
          />
          {errors.title && (
            <p className="text-xs text-red-500 mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            Açıklama
          </Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => onFieldChange('description', e.target.value)}
            placeholder="İş emri detayları..."
            rows={3}
            className="mt-1 text-sm resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkOrderInfoCard;
