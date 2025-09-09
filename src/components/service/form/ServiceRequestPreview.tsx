
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceRequestFormData } from "@/hooks/service/types";
import { format } from "date-fns";
import { CheckCircle, FileText, Info, MapPin, Calendar, UserCircle } from "lucide-react";

type ServiceRequestPreviewProps = {
  formData: ServiceRequestFormData;
  files: File[];
  customerName?: string;
};

export const ServiceRequestPreview: React.FC<ServiceRequestPreviewProps> = ({
  formData,
  files,
  customerName,
}) => {
  // Map priority levels to human-readable labels
  const priorityLabels: Record<string, string> = {
    low: "Düşük",
    medium: "Orta",
    high: "Yüksek",
    urgent: "Acil",
  };

  // Map service types to human-readable labels
  const serviceTypeLabels: Record<string, string> = {
    installation: "Kurulum",
    repair: "Onarım",
    maintenance: "Bakım",
    inspection: "Kontrol",
    consultation: "Danışmanlık",
  };

  return (
    <Card className="border-2 border-dashed border-gray-200 bg-gray-50">
      <CardHeader className="bg-gray-100 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Servis Talebi Önizleme
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-medium flex items-center gap-1">
              <Info className="h-4 w-4 text-primary" />
              Temel Bilgiler
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm pl-5">
              <div>
                <span className="text-muted-foreground">Başlık:</span>{" "}
                <span className="font-medium">{formData.title}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Öncelik:</span>{" "}
                <span className="font-medium">{priorityLabels[formData.priority] || formData.priority}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Servis Türü:</span>{" "}
                <span className="font-medium">{serviceTypeLabels[formData.service_type] || formData.service_type}</span>
              </div>
              {customerName && (
                <div>
                  <span className="text-muted-foreground">Müşteri:</span>{" "}
                  <span className="font-medium">{customerName}</span>
                </div>
              )}
            </div>
          </div>

          {formData.description && (
            <div className="space-y-1">
              <h3 className="font-medium flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-primary" />
                Açıklama
              </h3>
              <p className="text-sm pl-5">{formData.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.location && (
              <div className="space-y-1">
                <h3 className="font-medium flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  Konum
                </h3>
                <p className="text-sm pl-5">{formData.location}</p>
              </div>
            )}

            {formData.due_date && (
              <div className="space-y-1">
                <h3 className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-primary" />
                  Son Tarih
                </h3>
                <p className="text-sm pl-5">{format(formData.due_date, "PPP")}</p>
              </div>
            )}
          </div>

          {files.length > 0 && (
            <div className="space-y-1">
              <h3 className="font-medium">Ekler</h3>
              <ul className="text-sm pl-5">
                {files.map((file, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
