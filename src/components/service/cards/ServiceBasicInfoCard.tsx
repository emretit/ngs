import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText } from "lucide-react";

interface ServiceBasicInfoCardProps {
  formData: {
    service_title: string;
    service_type: string;
    service_request_description: string;
    service_location: string;
    service_priority: 'low' | 'medium' | 'high' | 'urgent';
  };
  handleInputChange: (field: string, value: any) => void;
  priorityConfig: {
    [key: string]: {
      label: string;
      color: string;
      icon: string;
    };
  };
  errors?: Record<string, string>;
}

const ServiceBasicInfoCard: React.FC<ServiceBasicInfoCardProps> = ({
  formData,
  handleInputChange,
  priorityConfig,
  errors = {}
}) => {
  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          Temel Bilgiler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-3 pb-3">
        <div>
          <Label htmlFor="service_title" className="text-sm font-medium text-gray-700 mb-1.5 block">
            Servis Başlığı <span className="text-red-500">*</span>
          </Label>
          <Input
            id="service_title"
            value={formData.service_title}
            onChange={(e) => handleInputChange('service_title', e.target.value)}
            placeholder="Örn: Klima bakımı, Elektrik arızası..."
            className="h-10 text-sm"
            required
          />
        </div>

        <div>
          <Label htmlFor="service_type" className="text-sm font-medium text-gray-700 mb-1.5 block">
            Servis Türü
          </Label>
          <Select
            value={formData.service_type}
            onValueChange={(value) => handleInputChange('service_type', value)}
          >
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="Servis türü seçin..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bakım">Bakım</SelectItem>
              <SelectItem value="onarım">Onarım</SelectItem>
              <SelectItem value="kurulum">Kurulum</SelectItem>
              <SelectItem value="yazılım">Yazılım</SelectItem>
              <SelectItem value="donanım">Donanım</SelectItem>
              <SelectItem value="ağ">Ağ</SelectItem>
              <SelectItem value="güvenlik">Güvenlik</SelectItem>
              <SelectItem value="diğer">Diğer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="service_request_description" className="text-sm font-medium text-gray-700 mb-1.5 block">
            Servis Açıklaması <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="service_request_description"
            value={formData.service_request_description}
            onChange={(e) => handleInputChange('service_request_description', e.target.value)}
            placeholder="Servisin detaylarını, yapılması gereken işlemleri ve özel notları açıklayın..."
            rows={4}
            className="resize-none text-sm min-h-[100px]"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Lokasyon
            </Label>
            <Input
              value={formData.service_location}
              onChange={(e) => handleInputChange('service_location', e.target.value)}
              placeholder="Örn: İstanbul, Şişli..."
              className="h-10 text-sm"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Öncelik
            </Label>
            <Select
              value={formData.service_priority}
              onValueChange={(value) => handleInputChange('service_priority', value as any)}
            >
              <SelectTrigger className={`h-10 text-sm ${priorityConfig[formData.service_priority].color} border font-medium`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceBasicInfoCard;

