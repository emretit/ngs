import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  Save,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  FileText,
  Wrench,
  Clock,
  Phone,
  Mail
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ServiceRequestFormData {
  service_title: string;
  service_request_description: string;
  service_location: string;
  service_priority: 'low' | 'medium' | 'high' | 'urgent';
  service_type: string;
  customer_id: string | null;
  service_due_date: Date | null;
  service_reported_date: Date;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
}

const NewServiceRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ServiceRequestFormData>({
    service_title: '',
    service_request_description: '',
    service_location: '',
    service_priority: 'medium',
    service_type: '',
    customer_id: null,
    service_due_date: null,
    service_reported_date: new Date(),
    contact_person: '',
    contact_phone: '',
    contact_email: '',
  });

  // Müşterileri getir
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, company, email, phone')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Teknisyenleri getir
  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('department', 'Teknik')
        .eq('status', 'aktif')
        .order('first_name');
      if (error) throw error;
      return data;
    },
  });

  // Servis oluşturma mutation
  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceRequestFormData) => {
      // Kullanıcının company_id'sini al
      let companyId = user?.user_metadata?.company_id;
      if (!companyId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user?.id)
          .single();
        companyId = profile?.company_id;
      }

      const serviceData = {
        service_title: data.service_title,
        service_request_description: data.service_request_description,
        service_location: data.service_location,
        service_priority: data.service_priority,
        service_type: data.service_type,
        customer_id: data.customer_id,
        service_due_date: data.service_due_date?.toISOString(),
        service_reported_date: data.service_reported_date.toISOString(),
        contact_person: data.contact_person,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email,
        service_status: 'new',
        company_id: companyId,
        created_by: user?.id,
      };

      const { data: result, error } = await supabase
        .from('service_requests')
        .insert([serviceData])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      toast.success('Servis talebi başarıyla oluşturuldu!');
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      navigate('/service');
    },
    onError: (error) => {
      console.error('Servis oluşturma hatası:', error);
      toast.error('Servis talebi oluşturulurken bir hata oluştu');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.service_title.trim()) {
      toast.error('Servis başlığı gereklidir');
      return;
    }

    if (!formData.service_request_description.trim()) {
      toast.error('Servis açıklaması gereklidir');
      return;
    }

    createServiceMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof ServiceRequestFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Müşteri seçildiğinde iletişim bilgilerini otomatik doldur
  const handleCustomerSelect = (customerId: string) => {
    const selectedCustomer = customers?.find(c => c.id === customerId);
    if (selectedCustomer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        contact_person: selectedCustomer.name || '',
        contact_phone: selectedCustomer.phone || '',
        contact_email: selectedCustomer.email || '',
      }));
    }
  };

  const priorityColors = {
    low: 'text-green-700 bg-green-50 border-green-200',
    medium: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    high: 'text-orange-700 bg-orange-50 border-orange-200',
    urgent: 'text-red-700 bg-red-50 border-red-200'
  };

  const priorityLabels = {
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
    urgent: 'Acil'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/service')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri Dön
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Yeni Servis Talebi</h1>
              <p className="text-sm text-slate-600">Yeni bir servis talebi oluşturun</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ana Bilgiler */}
          <Card className="shadow-md border-slate-200">
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                Temel Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="service_title" className="text-sm font-medium">
                    Servis Başlığı *
                  </Label>
                  <Input
                    id="service_title"
                    value={formData.service_title}
                    onChange={(e) => handleInputChange('service_title', e.target.value)}
                    placeholder="Örn: Klima bakımı, Elektrik arızası..."
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_type" className="text-sm font-medium">
                    Servis Türü
                  </Label>
                  <Input
                    id="service_type"
                    value={formData.service_type}
                    onChange={(e) => handleInputChange('service_type', e.target.value)}
                    placeholder="Örn: Bakım, Onarım, Kurulum..."
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_request_description" className="text-sm font-medium">
                  Servis Açıklaması *
                </Label>
                <Textarea
                  id="service_request_description"
                  value={formData.service_request_description}
                  onChange={(e) => handleInputChange('service_request_description', e.target.value)}
                  placeholder="Servisin detaylarını ve yapılması gereken işlemleri açıklayın..."
                  rows={4}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Lokasyon
                  </Label>
                  <Input
                    value={formData.service_location}
                    onChange={(e) => handleInputChange('service_location', e.target.value)}
                    placeholder="Servisin yapılacağı yer..."
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Öncelik
                  </Label>
                  <Select
                    value={formData.service_priority}
                    onValueChange={(value) => handleInputChange('service_priority', value as any)}
                  >
                    <SelectTrigger className={`transition-all duration-200 ${priorityColors[formData.service_priority]} border-2`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${priorityColors[key as keyof typeof priorityColors]}`}>
                            {label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Müşteri ve İletişim */}
          <Card className="shadow-md border-slate-200">
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-green-600" />
                Müşteri ve İletişim
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Müşteri</Label>
                <Select
                  value={formData.customer_id || ''}
                  onValueChange={handleCustomerSelect}
                >
                  <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-blue-500">
                    <SelectValue placeholder="Müşteri seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{customer.name || customer.company}</span>
                          {customer.email && (
                            <span className="text-xs text-slate-500">{customer.email}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    İletişim Kişisi
                  </Label>
                  <Input
                    value={formData.contact_person}
                    onChange={(e) => handleInputChange('contact_person', e.target.value)}
                    placeholder="Ad Soyad"
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefon
                  </Label>
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="0(555) 123 45 67"
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-posta
                  </Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="email@ornek.com"
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tarihler */}
          <Card className="shadow-md border-slate-200">
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
                Tarih Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Bildirim Tarihi
                  </Label>
                  <DatePicker
                    date={formData.service_reported_date}
                    onSelect={(date) => handleInputChange('service_reported_date', date || new Date())}
                    placeholder="Bildirim tarihi seçin"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Hedef Teslim Tarihi
                  </Label>
                  <DatePicker
                    date={formData.service_due_date}
                    onSelect={(date) => handleInputChange('service_due_date', date)}
                    placeholder="Hedef tarih seçin (isteğe bağlı)"
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/service')}
              disabled={createServiceMutation.isPending}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={createServiceMutation.isPending}
              className="min-w-[120px] bg-blue-600 hover:bg-blue-700"
            >
              {createServiceMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Oluşturuluyor...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Servis Oluştur
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewServiceRequest;