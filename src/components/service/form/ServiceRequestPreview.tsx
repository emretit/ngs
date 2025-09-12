
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceRequestFormData } from "@/hooks/service/types";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CheckCircle, FileText, Info, MapPin, Calendar, UserCircle, User, Clock, Wrench } from "lucide-react";

type ServiceRequestPreviewProps = {
  formData: ServiceRequestFormData;
  files: File[];
  customerName?: string;
  technicianName?: string;
};

export const ServiceRequestPreview: React.FC<ServiceRequestPreviewProps> = ({
  formData,
  files,
  customerName,
  technicianName,
}) => {
  // Map priority levels to human-readable labels
  const priorityLabels: Record<string, string> = {
    low: "Düşük",
    medium: "Orta",
    high: "Yüksek",
    urgent: "Acil",
  };

  // Map service status to human-readable labels
  const statusLabels: Record<string, string> = {
    new: "Yeni",
    assigned: "Atanmış",
    in_progress: "Devam Ediyor",
    completed: "Tamamlandı",
    cancelled: "İptal",
    on_hold: "Beklemede",
  };

  return (
    <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
          <FileText className="h-5 w-5" />
          Servis Talebi Önizleme
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Temel Bilgiler */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2 text-blue-700 border-b border-blue-200 pb-1">
            <Info className="h-4 w-4" />
            Temel Bilgiler
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs font-medium">Başlık</span>
              <span className="font-medium text-gray-900">{formData.title || 'Belirtilmemiş'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs font-medium">Öncelik</span>
              <span className="font-medium text-gray-900">{priorityLabels[formData.priority] || formData.priority || 'Belirtilmemiş'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs font-medium">Servis Durumu</span>
              <span className="font-medium text-gray-900">{statusLabels[formData.status] || formData.status || 'Belirtilmemiş'}</span>
            </div>
            {customerName && (
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Müşteri</span>
                <span className="font-medium text-gray-900">{customerName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Açıklama */}
        {formData.description && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2 text-blue-700 border-b border-blue-200 pb-1">
              <FileText className="h-4 w-4" />
              Açıklama
            </h3>
            <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border">{formData.description}</p>
          </div>
        )}

        {/* Servis Sonucu */}
        {formData.service_result && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2 text-green-700 border-b border-green-200 pb-1">
              <CheckCircle className="h-4 w-4" />
              Servis Sonucu
            </h3>
            <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg border border-green-200">{formData.service_result}</p>
          </div>
        )}

        {/* Konum ve Tarih Bilgileri */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formData.location && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2 text-blue-700 border-b border-blue-200 pb-1">
                <MapPin className="h-4 w-4" />
                Konum
              </h3>
              <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border">{formData.location}</p>
            </div>
          )}

          {formData.scheduled_date && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2 text-blue-700 border-b border-blue-200 pb-1">
                <Calendar className="h-4 w-4" />
                Planlanan Tarih
              </h3>
              <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border">
                {format(new Date(formData.scheduled_date), "dd MMMM yyyy, EEEE", { locale: tr })}
              </p>
            </div>
          )}
        </div>

        {/* Atama Bilgileri */}
        {(technicianName || formData.assigned_technician_id) && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2 text-blue-700 border-b border-blue-200 pb-1">
              <User className="h-4 w-4" />
              Atama Bilgileri
            </h3>
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {technicianName || 'Teknisyen atanmamış'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Ekler */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2 text-blue-700 border-b border-blue-200 pb-1">
              <FileText className="h-4 w-4" />
              Ek Dosyalar
            </h3>
            <div className="bg-white p-3 rounded-lg border">
              <ul className="space-y-1">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <FileText className="h-3 w-3 text-gray-400" />
                    <span>{file.name}</span>
                    <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Boş durum mesajı */}
        {!formData.title && !formData.description && !formData.location && !formData.scheduled_date && files.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Henüz bilgi girilmedi</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
