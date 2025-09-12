import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { ServiceSlipData } from "@/types/service-slip";
import { ServiceSlipService } from "@/services/serviceSlipService";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  FileText,
  Wrench,
  Building,
  Phone,
  Mail,
  CalendarDays,
  Target,
  Activity,
  Paperclip,
  MessageSquare,
  Save,
  X
} from "lucide-react";
import moment from "moment";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ModernDetailContentProps {
  serviceRequest: ServiceRequest;
  status: string;
  setStatus: (status: any) => void;
  priority: string;
  setPriority: (priority: any) => void;
  assignedTo: string | undefined;
  setAssignedTo: (id: string | undefined) => void;
  notes: string;
  setNotes: (notes: string) => void;
  handleSave: () => void;
  isPending: boolean;
  onClose: () => void;
}

export const ModernDetailContent: React.FC<ModernDetailContentProps> = ({
  serviceRequest,
  status,
  setStatus,
  priority,
  setPriority,
  assignedTo,
  setAssignedTo,
  notes,
  setNotes,
  handleSave,
  isPending,
  onClose
}) => {
  const [serviceSlip, setServiceSlip] = useState<ServiceSlipData | null>(null);
  const [loadingSlip, setLoadingSlip] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Müşteri bilgilerini getir
  const { data: customer } = useQuery({
    queryKey: ['customer', serviceRequest.customer_id],
    queryFn: async () => {
      if (!serviceRequest.customer_id) return null;
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', serviceRequest.customer_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!serviceRequest.customer_id
  });

  // Teknisyen bilgilerini getir
  const { data: technician } = useQuery({
    queryKey: ['technician', serviceRequest.assigned_technician],
    queryFn: async () => {
      if (!serviceRequest.assigned_technician) return null;
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', serviceRequest.assigned_technician)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!serviceRequest.assigned_technician
  });

  // Service slip'i yükle
  useEffect(() => {
    const loadServiceSlip = async () => {
      try {
        setLoadingSlip(true);
        const slip = await ServiceSlipService.getServiceSlipByRequestId(serviceRequest.id);
        setServiceSlip(slip);
      } catch (error) {
        console.error('Error loading service slip:', error);
      } finally {
        setLoadingSlip(false);
      }
    };

    if (serviceRequest.id) {
      loadServiceSlip();
    }
  }, [serviceRequest.id]);

  // Öncelik renkleri
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Durum renkleri
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assigned': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'on_hold': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header - Servis No ve Temel Bilgiler */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-900">
                {serviceRequest.service_number || 'SR-' + serviceRequest.id.slice(-6).toUpperCase()}
              </CardTitle>
              <h3 className="text-lg font-semibold text-gray-700">
                {serviceRequest.service_title}
              </h3>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2"
              >
                {isEditing ? <X className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                {isEditing ? 'İptal' : 'Düzenle'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Kapat
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Öncelik ve Durum */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Öncelik</span>
              </div>
              <Badge className={`${getPriorityColor(priority)} border`}>
                {priority === 'urgent' ? 'Acil' :
                 priority === 'high' ? 'Yüksek' :
                 priority === 'medium' ? 'Orta' : 'Düşük'}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Durum</span>
              </div>
              <Badge className={`${getStatusColor(status)} border`}>
                {status === 'new' ? 'Yeni' :
                 status === 'assigned' ? 'Atanmış' :
                 status === 'in_progress' ? 'Devam Ediyor' :
                 status === 'completed' ? 'Tamamlandı' :
                 status === 'cancelled' ? 'İptal' :
                 status === 'on_hold' ? 'Beklemede' : 'Bilinmeyen'}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Servis Durumu</span>
              </div>
              <Badge className={`${getStatusColor(status)} border`}>
                {status === 'new' ? 'Yeni' :
                 status === 'assigned' ? 'Atanmış' :
                 status === 'in_progress' ? 'Devam Ediyor' :
                 status === 'completed' ? 'Tamamlandı' :
                 status === 'cancelled' ? 'İptal' :
                 status === 'on_hold' ? 'Beklemede' : 'Bilinmeyen'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tarih Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Tarih Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Bildirilme Tarihi</span>
              </div>
              <p className="text-sm text-gray-700">
                {serviceRequest.service_reported_date 
                  ? moment(serviceRequest.service_reported_date).format('DD.MM.YYYY HH:mm')
                  : 'Bildirilmedi'
                }
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Planlanan Tarih</span>
              </div>
              <p className="text-sm text-gray-700">
                {serviceRequest.issue_date 
                  ? moment(serviceRequest.issue_date).format('DD.MM.YYYY')
                  : 'Planlanmamış'
                }
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Teslim Tarihi</span>
              </div>
              <p className="text-sm text-gray-700">
                {serviceRequest.service_due_date 
                  ? moment(serviceRequest.service_due_date).format('DD.MM.YYYY')
                  : 'Tarih belirtilmemiş'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lokasyon ve Müşteri Bilgileri */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lokasyon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" />
              Lokasyon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">
              {serviceRequest.service_location || 'Belirtilmemiş'}
            </p>
          </CardContent>
        </Card>

        {/* Müşteri Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="h-5 w-5" />
              Müşteri Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer ? (
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{customer.name}</p>
                {customer.company && (
                  <p className="text-sm text-gray-600">{customer.company}</p>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    {customer.email}
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    {customer.phone}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Müşteri bilgisi bulunamadı</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Teknisyen Ataması */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Teknisyen Ataması
          </CardTitle>
        </CardHeader>
        <CardContent>
          {technician ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {technician.first_name} {technician.last_name}
                </p>
                <p className="text-sm text-gray-600">{technician.department}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <XCircle className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-500">Atanmamış</p>
                <p className="text-sm text-gray-400">Henüz teknisyen atanmamış</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Servis Açıklaması */}
      {serviceRequest.service_request_description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Servis Açıklaması
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {serviceRequest.service_request_description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Service Slip */}
      {serviceSlip && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5" />
              Servis Fişi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Fiş No:</span> {serviceSlip.slip_number}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Durum:</span> {serviceSlip.status}
              </p>
              {serviceSlip.completion_date && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Tamamlanma:</span> {moment(serviceSlip.completion_date).format('DD.MM.YYYY')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notlar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Notlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={4}
              placeholder="Notlarınızı buraya yazın..."
            />
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {notes || 'Henüz not eklenmemiş'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Ekler */}
      {serviceRequest.attachments && Array.isArray(serviceRequest.attachments) && serviceRequest.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Paperclip className="h-5 w-5" />
              Ekler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(serviceRequest.attachments as any[]).map((attachment, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Paperclip className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{attachment.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kaydet Butonu */}
      {isEditing && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setIsEditing(false)}
            disabled={isPending}
          >
            İptal
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      )}
    </div>
  );
};
