import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CustomTabs, CustomTabsList, CustomTabsTrigger, CustomTabsContent } from '@/components/ui/custom-tabs';
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
  Mail,
  Search,
  Building2,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import BackButton from '@/components/ui/back-button';
import { useCustomerSelect } from '@/hooks/useCustomerSelect';
import { ServiceRecurrenceForm } from '@/components/service/ServiceRecurrenceForm';
import { RecurrenceConfig } from '@/utils/serviceRecurrenceUtils';

interface ServiceRequestFormData {
  service_title: string;
  service_request_description: string;
  service_location: string;
  service_priority: 'low' | 'medium' | 'high' | 'urgent';
  service_type: string;
  customer_id: string | null;
  supplier_id: string | null;
  service_due_date: Date | null;
  service_reported_date: Date;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
}

const NewServiceRequest = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ServiceRequestFormData>({
    service_title: '',
    service_request_description: '',
    service_location: '',
    service_priority: 'medium',
    service_type: '',
    customer_id: null,
    supplier_id: null,
    service_due_date: null,
    service_reported_date: new Date(),
    contact_person: '',
    contact_phone: '',
    contact_email: '',
  });

  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig>({ type: 'none' });

  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [partnerPopoverOpen, setPartnerPopoverOpen] = useState(false);
  const [partnerType, setPartnerType] = useState<'customer' | 'supplier'>('customer');
  const { userData } = useCurrentUser();
  const { customers, suppliers, isLoading: partnersLoading } = useCustomerSelect();

  // Müşteri arama filtresi
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!partnerSearchQuery.trim()) return customers;
    
    const query = partnerSearchQuery.toLowerCase();
    return customers.filter(customer => {
      const searchableText = [
        customer.name,
        customer.company,
        customer.email,
        customer.mobile_phone,
        customer.office_phone
      ].filter(Boolean).join(' ').toLowerCase();
      return searchableText.includes(query);
    });
  }, [customers, partnerSearchQuery]);

  // Tedarikçi arama filtresi
  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    if (!partnerSearchQuery.trim()) return suppliers;
    
    const query = partnerSearchQuery.toLowerCase();
    return suppliers.filter(supplier => {
      const searchableText = [
        supplier.name,
        supplier.company,
        supplier.email,
        supplier.mobile_phone,
        supplier.office_phone
      ].filter(Boolean).join(' ').toLowerCase();
      return searchableText.includes(query);
    });
  }, [suppliers, partnerSearchQuery]);

  // Servis oluşturma mutation
  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceRequestFormData) => {
      const companyId = userData?.company_id;
      
      if (!companyId) {
        throw new Error('Şirket bilgisi bulunamadı');
      }

      const serviceData = {
        service_title: data.service_title,
        service_request_description: data.service_request_description,
        service_location: data.service_location,
        service_priority: data.service_priority,
        service_type: data.service_type || null,
        customer_id: data.customer_id || null,
        supplier_id: data.supplier_id || null,
        service_due_date: data.service_due_date?.toISOString() || null,
        service_reported_date: data.service_reported_date.toISOString(),
        service_status: 'new' as const,
        company_id: companyId,
        // İletişim bilgilerini customer_data JSONB'ye kaydet
        customer_data: {
          contact_person: data.contact_person || null,
          contact_phone: data.contact_phone || null,
          contact_email: data.contact_email || null,
        },
        // Tekrarlama ayarları
        is_recurring: recurrenceConfig.type !== 'none',
        recurrence_type: recurrenceConfig.type !== 'none' ? recurrenceConfig.type : null,
        recurrence_interval: recurrenceConfig.interval || 1,
        recurrence_end_date: recurrenceConfig.endDate?.toISOString().split('T')[0] || null,
        recurrence_days: recurrenceConfig.days || null,
        recurrence_day_of_month: recurrenceConfig.dayOfMonth || null,
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
      toast.success('Servis talebi başarıyla oluşturuldu!', {
        description: `"${data.service_title}" servisi kaydedildi.`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      });
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      navigate('/service');
    },
    onError: (error: any) => {
      console.error('Servis oluşturma hatası:', error);
      toast.error('Servis talebi oluşturulurken bir hata oluştu', {
        description: error.message || 'Lütfen tekrar deneyin.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.service_title.trim()) {
      toast.error('Servis başlığı gereklidir', {
        description: 'Lütfen servis başlığını girin.',
      });
      return;
    }

    if (!formData.service_request_description.trim()) {
      toast.error('Servis açıklaması gereklidir', {
        description: 'Lütfen servis açıklamasını girin.',
      });
      return;
    }

    createServiceMutation.mutate(formData);
  };

  const isFormValid = formData.service_title.trim() && formData.service_request_description.trim();

  const handleInputChange = (field: keyof ServiceRequestFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Müşteri/Tedarikçi seçildiğinde iletişim bilgilerini otomatik doldur
  const handlePartnerSelect = (partnerId: string, type: 'customer' | 'supplier') => {
    if (type === 'customer') {
      const selectedCustomer = customers?.find(c => c.id === partnerId);
      if (selectedCustomer) {
        setFormData(prev => ({
          ...prev,
          customer_id: partnerId,
          supplier_id: null, // Müşteri seçildiğinde tedarikçiyi temizle
          contact_person: selectedCustomer.name || prev.contact_person,
          contact_phone: selectedCustomer.mobile_phone || selectedCustomer.office_phone || prev.contact_phone,
          contact_email: selectedCustomer.email || prev.contact_email,
        }));
      }
    } else {
      const selectedSupplier = suppliers?.find(s => s.id === partnerId);
      if (selectedSupplier) {
        setFormData(prev => ({
          ...prev,
          supplier_id: partnerId,
          customer_id: null, // Tedarikçi seçildiğinde müşteriyi temizle
          contact_person: selectedSupplier.name || prev.contact_person,
          contact_phone: selectedSupplier.mobile_phone || selectedSupplier.office_phone || prev.contact_phone,
          contact_email: selectedSupplier.email || prev.contact_email,
        }));
      }
    }
    setPartnerSearchQuery('');
    setPartnerPopoverOpen(false);
  };

  const selectedCustomer = customers?.find(c => c.id === formData.customer_id);
  const selectedSupplier = suppliers?.find(s => s.id === formData.supplier_id);
  const selectedPartner = formData.customer_id ? selectedCustomer : selectedSupplier;

  const priorityConfig = {
    low: { 
      label: 'Düşük', 
      color: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
      icon: '🟢'
    },
    medium: { 
      label: 'Orta', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200',
      icon: '🟡'
    },
    high: { 
      label: 'Yüksek', 
      color: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200',
      icon: '🟠'
    },
    urgent: { 
      label: 'Acil', 
      color: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200',
      icon: '🔴'
    }
  };

  return (
    <div>
      {/* Enhanced Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm rounded-lg border border-border shadow-md mb-6">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <BackButton 
              onClick={() => navigate("/service")}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Servisler
            </BackButton>
            
            <div className="h-6 w-px bg-border" />
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Yeni Servis Talebi
                </h1>
                <p className="text-sm text-muted-foreground">
                  Hızlı ve kolay servis talebi oluşturma
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => navigate("/service")}
              disabled={createServiceMutation.isPending}
              className="gap-2"
            >
              İptal
            </Button>
            <Button 
              type="submit"
              form="service-form"
              disabled={createServiceMutation.isPending || !isFormValid}
              className="gap-2 shadow-md"
            >
              {createServiceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Kaydet
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto space-y-4">

        <form id="service-form" onSubmit={handleSubmit} className="space-y-4">
          {/* İlk Satır - Temel Bilgiler ve Müşteri Bilgileri Yan Yana */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Ana Bilgiler */}
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
                  <Label htmlFor="service_title" className="text-xs font-medium text-gray-700 mb-1.5 block">
                    Servis Başlığı <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="service_title"
                    value={formData.service_title}
                    onChange={(e) => handleInputChange('service_title', e.target.value)}
                    placeholder="Örn: Klima bakımı, Elektrik arızası..."
                    className="h-7 text-xs"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="service_type" className="text-xs font-medium text-gray-700 mb-1.5 block">
                    Servis Türü
                  </Label>
                  <Select
                    value={formData.service_type}
                    onValueChange={(value) => handleInputChange('service_type', value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
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
                  <Label htmlFor="service_request_description" className="text-xs font-medium text-gray-700 mb-1.5 block">
                    Servis Açıklaması <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="service_request_description"
                    value={formData.service_request_description}
                    onChange={(e) => handleInputChange('service_request_description', e.target.value)}
                    placeholder="Servisin detaylarını, yapılması gereken işlemleri ve özel notları açıklayın..."
                    rows={4}
                    className="resize-none text-xs min-h-[80px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
                      Lokasyon
                    </Label>
                    <Input
                      value={formData.service_location}
                      onChange={(e) => handleInputChange('service_location', e.target.value)}
                      placeholder="Örn: İstanbul, Şişli..."
                      className="h-7 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
                      Öncelik
                    </Label>
                    <Select
                      value={formData.service_priority}
                      onValueChange={(value) => handleInputChange('service_priority', value as any)}
                    >
                      <SelectTrigger className={`h-7 text-xs ${priorityConfig[formData.service_priority].color} border font-medium`}>
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

            {/* Müşteri ve İletişim */}
            <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
              <CardHeader className="pb-2 pt-2.5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                  Müşteri / Tedarikçi ve İletişim
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 px-3 pb-3">
                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
                    Müşteri / Tedarikçi
                  </Label>
                  <Popover open={partnerPopoverOpen} onOpenChange={setPartnerPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={partnerPopoverOpen}
                        className="w-full h-7 text-xs justify-between"
                      >
                        <div className="flex items-center">
                          {formData.customer_id ? (
                            <User className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          ) : formData.supplier_id ? (
                            <Building2 className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          ) : (
                            <User className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          )}
                          {selectedPartner 
                            ? selectedPartner.name || selectedPartner.company || 'İsimsiz'
                            : 'Müşteri veya Tedarikçi seçin...'}
                        </div>
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] max-w-[90vw] p-0" align="start">
                      <div className="p-4 border-b">
                        <Input
                          placeholder="Arama..."
                          value={partnerSearchQuery}
                          onChange={(e) => setPartnerSearchQuery(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      
                      <CustomTabs defaultValue={partnerType} onValueChange={(value) => setPartnerType(value as "customer" | "supplier")}>
                        <div className="px-4 pt-3 pb-1">
                          <CustomTabsList className="w-full">
                            <CustomTabsTrigger value="customer" className="flex-1 text-xs">
                              <User className="h-4 w-4 mr-2" />
                              Müşteriler
                            </CustomTabsTrigger>
                            <CustomTabsTrigger value="supplier" className="flex-1 text-xs">
                              <Building2 className="h-4 w-4 mr-2" />
                              Tedarikçiler
                            </CustomTabsTrigger>
                          </CustomTabsList>
                        </div>
                        
                        <CustomTabsContent value="customer" className="p-0 focus-visible:outline-none focus-visible:ring-0">
                          <ScrollArea className="h-[300px]">
                            {partnersLoading ? (
                              <div className="p-4 text-center text-xs text-muted-foreground">
                                Yükleniyor...
                              </div>
                            ) : filteredCustomers && filteredCustomers.length > 0 ? (
                              <div className="grid gap-1 p-2">
                                {filteredCustomers.map((customer) => (
                                  <div
                                    key={customer.id}
                                    className={`flex items-start p-2 cursor-pointer rounded-md hover:bg-muted/50 ${
                                      customer.id === formData.customer_id ? "bg-muted" : ""
                                    }`}
                                    onClick={() => handlePartnerSelect(customer.id, 'customer')}
                                  >
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3 mt-1">
                                      {customer.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between">
                                        <p className="font-medium text-xs truncate">
                                          {customer.name || customer.company || 'İsimsiz Müşteri'}
                                        </p>
                                      </div>
                                      {customer.company && customer.name && (
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                          {customer.company}
                                        </p>
                                      )}
                                      {customer.email && (
                                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                                          <Mail className="h-3 w-3 mr-1" />
                                          <span className="truncate">{customer.email}</span>
                                        </div>
                                      )}
                                      {(customer.mobile_phone || customer.office_phone) && (
                                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                                          <Phone className="h-3 w-3 mr-1" />
                                          <span>{customer.mobile_phone || customer.office_phone}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 text-center text-xs text-muted-foreground">
                                Müşteri bulunamadı
                              </div>
                            )}
                          </ScrollArea>
                          <div className="p-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => {
                                setPartnerPopoverOpen(false);
                                navigate('/contacts/new');
                              }}
                            >
                              <Building2 className="h-3 w-3 mr-2" />
                              Yeni Müşteri Ekle
                            </Button>
                          </div>
                        </CustomTabsContent>
                        
                        <CustomTabsContent value="supplier" className="p-0 focus-visible:outline-none focus-visible:ring-0">
                          <ScrollArea className="h-[300px]">
                            {partnersLoading ? (
                              <div className="p-4 text-center text-xs text-muted-foreground">
                                Yükleniyor...
                              </div>
                            ) : filteredSuppliers && filteredSuppliers.length > 0 ? (
                              <div className="grid gap-1 p-2">
                                {filteredSuppliers.map((supplier) => (
                                  <div
                                    key={supplier.id}
                                    className={`flex items-start p-2 cursor-pointer rounded-md hover:bg-muted/50 ${
                                      supplier.id === formData.supplier_id ? "bg-muted" : ""
                                    }`}
                                    onClick={() => handlePartnerSelect(supplier.id, 'supplier')}
                                  >
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3 mt-1">
                                      <Building2 className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between">
                                        <p className="font-medium text-xs truncate">
                                          {supplier.name || supplier.company || 'İsimsiz Tedarikçi'}
                                        </p>
                                      </div>
                                      {supplier.company && supplier.name && (
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                          {supplier.company}
                                        </p>
                                      )}
                                      {supplier.email && (
                                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                                          <Mail className="h-3 w-3 mr-1" />
                                          <span className="truncate">{supplier.email}</span>
                                        </div>
                                      )}
                                      {(supplier.mobile_phone || supplier.office_phone) && (
                                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                                          <Phone className="h-3 w-3 mr-1" />
                                          <span>{supplier.mobile_phone || supplier.office_phone}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 text-center text-xs text-muted-foreground">
                                Tedarikçi bulunamadı
                              </div>
                            )}
                          </ScrollArea>
                          <div className="p-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => {
                                setPartnerPopoverOpen(false);
                                navigate('/suppliers/new');
                              }}
                            >
                              <Building2 className="h-3 w-3 mr-2" />
                              Yeni Tedarikçi Ekle
                            </Button>
                          </div>
                        </CustomTabsContent>
                      </CustomTabs>
                    </PopoverContent>
                  </Popover>
                  {(formData.customer_id || formData.supplier_id) && selectedPartner && (
                    <Badge variant="secondary" className="mt-1.5 text-xs py-0.5">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {selectedPartner.name || selectedPartner.company || 'Seçildi'}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
                      İletişim Kişisi
                    </Label>
                    <Input
                      value={formData.contact_person}
                      onChange={(e) => handleInputChange('contact_person', e.target.value)}
                      placeholder="Ad Soyad"
                      className="h-7 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
                        Telefon
                      </Label>
                      <Input
                        value={formData.contact_phone}
                        onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                        placeholder="0(555) 123 45 67"
                        className="h-7 text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
                        E-posta
                      </Label>
                      <Input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => handleInputChange('contact_email', e.target.value)}
                        placeholder="email@ornek.com"
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* İkinci Satır - Tarih Bilgileri */}
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
                  <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
                    Bildirim Tarihi
                  </Label>
                  <DatePicker
                    date={formData.service_reported_date}
                    onSelect={(date) => handleInputChange('service_reported_date', date || new Date())}
                    placeholder="Bildirim tarihi seçin"
                    className="h-7 text-xs w-full"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
                    Hedef Teslim Tarihi <span className="text-gray-500 font-normal">(İsteğe bağlı)</span>
                  </Label>
                  <DatePicker
                    date={formData.service_due_date}
                    onSelect={(date) => handleInputChange('service_due_date', date)}
                    placeholder="Hedef tarih seçin"
                    className="h-7 text-xs w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tekrarlama Ayarları */}
          <ServiceRecurrenceForm
            value={recurrenceConfig}
            onChange={setRecurrenceConfig}
          />

        </form>
      </div>
    </div>
  );
};

export default NewServiceRequest;