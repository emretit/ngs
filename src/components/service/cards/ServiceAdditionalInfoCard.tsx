import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Hash, Target } from "lucide-react";

interface ServiceAdditionalInfoCardProps {
  formData: {
    service_result: string;
  };
  handleInputChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const ServiceAdditionalInfoCard: React.FC<ServiceAdditionalInfoCardProps> = ({
  formData,
  handleInputChange,
  errors = {}
}) => {
  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-teal-50 to-teal-50/50 border border-teal-200/50">
            <FileText className="h-4 w-4 text-teal-600" />
          </div>
          Ek Bilgiler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-3 pb-3">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Servis Sonucu
          </Label>
          <Textarea
            value={formData.service_result}
            onChange={(e) => handleInputChange('service_result', e.target.value)}
            placeholder="Servis sonucu veya ön görüş (opsiyonel)"
            rows={3}
            className="resize-none text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceAdditionalInfoCard;

