import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Save,
  Wrench,
  MoreHorizontal,
  Eye,
  FileDown,
  Send,
  CheckCircle2
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import BackButton from '@/components/ui/back-button';
import { useCustomerSelect } from '@/hooks/useCustomerSelect';
import { ServiceRecurrenceForm } from '@/components/service/ServiceRecurrenceForm';
import { RecurrenceConfig } from '@/utils/serviceRecurrenceUtils';
import ServiceBasicInfoCard from '@/components/service/cards/ServiceBasicInfoCard';
import ServiceCustomerInfoCard from '@/components/service/cards/ServiceCustomerInfoCard';
import ServiceDateInfoCard from '@/components/service/cards/ServiceDateInfoCard';
import ServiceEquipmentCard from '@/components/service/cards/ServiceEquipmentCard';
import ServiceAttachmentsNotesCard from '@/components/service/cards/ServiceAttachmentsNotesCard';
import ServiceAdditionalInfoCard from '@/components/service/cards/ServiceAdditionalInfoCard';

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
  equipment_id: string | null;
  warranty_info: {
    is_under_warranty: boolean;
    warranty_start?: string;
    warranty_end?: string;
    warranty_notes?: string;
  } | null;
  attachments: Array<{
    name: string;
    path: string;
    type: string;
    size: number;
  }>;
  notes: string[];
  slip_number: string;
  service_result: string;
  sla_target_hours: number | null;
}

// Priority config
const priorityConfig = {
  low: { label: 'Düşük', color: 'bg-gray-100 text-gray-800', icon: '🟢' },
  medium: { label: 'Orta', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
  high: { label: 'Yüksek', color: 'bg-orange-100 text-orange-800', icon: '🟠' },
  urgent: { label: 'Acil', color: 'bg-red-100 text-red-800', icon: '🔴' },
};

const NewServiceRequest = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();
  const { customers, suppliers, isLoading: partnersLoading } = useCustomerSelect();

  // Form state
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
    equipment_id: null,
    warranty_info: null,
    attachments: [],
    notes: [],
    slip_number: '',
    service_result: '',
    sla_target_hours: null,
  });

  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig>({ type: 'none' });
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Ekipmanları getir
  const { data: equipmentList = [], isLoading: equipmentLoading } = useQuery({
    queryKey: ['equipment', userData?.company_id, formData.customer_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      
      let query = supabase
        .from('equipment')
        .select('*')
        .eq('company_id', userData.company_id);
      
      if (formData.customer_id) {
        query = query.eq('customer_id', formData.customer_id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id,
  });

  // Seçili müşteri/tedarikçi bilgisi
  const selectedPartner = React.useMemo(() => {
    if (formData.customer_id) {
      return customers?.find(c => c.id === formData.customer_id);
    }
    if (formData.supplier_id) {
      return suppliers?.find(s => s.id === formData.supplier_id);
    }
    return null;
  }, [formData.customer_id, formData.supplier_id, customers, suppliers]);

  // Müşteri değiştiğinde ekipman seçimini temizle
  React.useEffect(() => {
    if (formData.customer_id) {
      const selectedEquipment = equipmentList.find((eq: any) => eq.id === formData.equipment_id);
      if (selectedEquipment && selectedEquipment.customer_id !== formData.customer_id) {
        setFormData(prev => ({
          ...prev,
          equipment_id: null,
          warranty_info: null,
        }));
      }
    }
  }, [formData.customer_id, equipmentList]);

  // Input change handler
  const handleInputChange = (field: keyof ServiceRequestFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
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
          supplier_id: null,
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
          customer_id: null,
          contact_person: selectedSupplier.name || prev.contact_person,
          contact_phone: selectedSupplier.mobile_phone || selectedSupplier.office_phone || prev.contact_phone,
          contact_email: selectedSupplier.email || prev.contact_email,
        }));
      }
    }
  };

  // Ekipman seçimi handler
  const handleEquipmentSelect = (equipmentId: string) => {
    const selectedEquipment = equipmentList.find((eq: any) => eq.id === equipmentId);
    if (selectedEquipment) {
      setFormData(prev => ({
        ...prev,
        equipment_id: equipmentId,
        warranty_info: selectedEquipment.warranty_end ? {
          is_under_warranty: new Date(selectedEquipment.warranty_end) > new Date(),
          warranty_start: selectedEquipment.warranty_start || undefined,
          warranty_end: selectedEquipment.warranty_end || undefined,
          warranty_notes: undefined,
        } : null,
      }));
    }
  };

  // Dosya yükleme fonksiyonu
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    try {
      const uploadedFiles = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} dosyası 10MB'dan büyük`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `service-attachments/${userData?.company_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`${file.name} yüklenirken hata oluştu`);
          continue;
        }

        uploadedFiles.push({
          name: file.name,
          path: filePath,
          type: file.type,
          size: file.size,
        });
      }

      if (uploadedFiles.length > 0) {
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, ...uploadedFiles],
        }));
        toast.success(`${uploadedFiles.length} dosya yüklendi`);
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Dosya yüklenirken bir hata oluştu');
    } finally {
      setUploadingFiles(false);
    }
  };

  // Not ekleme/silme fonksiyonları
  const handleAddNote = () => {
    if (newNote.trim()) {
      setFormData(prev => ({
        ...prev,
        notes: [...prev.notes, newNote.trim()],
      }));
      setNewNote('');
    }
  };

  const handleRemoveNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes.filter((_, i) => i !== index),
    }));
  };

  // Servis oluşturma mutation
  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceRequestFormData) => {
      const companyId = userData?.company_id;
      
      if (!companyId) {
        throw new Error('Şirket bilgisi bulunamadı');
      }

      const { data: result, error } = await supabase
        .from('service_requests')
        .insert({
          company_id: companyId,
          service_title: data.service_title,
          service_request_description: data.service_request_description,
          service_location: data.service_location,
          service_priority: data.service_priority,
          service_type: data.service_type,
          customer_id: data.customer_id,
          supplier_id: data.supplier_id,
          service_due_date: data.service_due_date?.toISOString(),
          service_reported_date: data.service_reported_date.toISOString(),
          contact_person: data.contact_person,
          contact_phone: data.contact_phone,
          contact_email: data.contact_email,
          equipment_id: data.equipment_id,
          warranty_info: data.warranty_info,
          attachments: data.attachments,
          notes: data.notes,
          slip_number: data.slip_number,
          service_result: data.service_result,
          sla_target_hours: data.sla_target_hours,
          service_status: 'open',
          created_by: userData?.id,
        })
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
        description: error.message || 'Bilinmeyen hata',
      });
    },
  });

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.service_title.trim()) {
      toast.error('Servis başlığı zorunludur');
      return;
    }

    if (!formData.service_request_description.trim()) {
      toast.error('Servis açıklaması zorunludur');
      return;
    }

    createServiceMutation.mutate(formData);
  };

  return (
    <div className="space-y-2">
      {/* Enhanced Sticky Header */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-2">
        <div className="flex items-center justify-between p-3 pl-12">
          <div className="flex items-center gap-3">
            <BackButton 
              onClick={() => navigate("/service")}
              variant="ghost"
              size="sm"
            >
              Servisler
            </BackButton>
            
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Yeni Servis Talebi
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  Yeni servis kaydı oluşturun
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSubmit}
              disabled={createServiceMutation.isPending}
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{createServiceMutation.isPending ? "Kaydediliyor..." : "Kaydet"}</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50/50 hover:text-gray-700 hover:border-gray-200 transition-all duration-200 hover:shadow-sm"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="font-medium">İşlemler</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => toast.info("Önizleme özelliği yakında eklenecek")} className="gap-2 cursor-pointer">
                  <Eye className="h-4 w-4" />
                  <span>Önizle</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info("PDF export özelliği yakında eklenecek")} className="gap-2 cursor-pointer">
                  <FileDown className="h-4 w-4" />
                  <span>PDF İndir</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info("E-posta gönderimi özelliği yakında eklenecek")} className="gap-2 cursor-pointer">
                  <Send className="h-4 w-4" />
                  <span>E-posta Gönder</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content - Her kart bağımsız Card komponenti */}
      <div className="space-y-4">
        {/* Row 1 - Müşteri ve Temel Bilgiler */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ServiceCustomerInfoCard
            formData={formData}
            handleInputChange={handleInputChange}
            handlePartnerSelect={handlePartnerSelect}
            customers={customers}
            suppliers={suppliers}
            partnersLoading={partnersLoading}
            selectedPartner={selectedPartner}
          />

          <ServiceBasicInfoCard
            formData={formData}
            handleInputChange={handleInputChange}
            priorityConfig={priorityConfig}
          />
        </div>

        {/* Row 2 - Tarih Bilgileri */}
        <ServiceDateInfoCard
          formData={formData}
          handleInputChange={handleInputChange}
        />

        {/* Row 3 - Ekipman ve Dosya/Notlar */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ServiceEquipmentCard
            formData={formData}
            handleInputChange={handleInputChange}
            handleEquipmentSelect={handleEquipmentSelect}
            equipmentList={equipmentList}
            equipmentLoading={equipmentLoading}
            setFormData={setFormData}
          />

          <ServiceAttachmentsNotesCard
            formData={formData}
            handleInputChange={handleInputChange}
            handleFileUpload={handleFileUpload}
            handleAddNote={handleAddNote}
            handleRemoveNote={handleRemoveNote}
            newNote={newNote}
            setNewNote={setNewNote}
            uploadingFiles={uploadingFiles}
            setFormData={setFormData}
          />
        </div>

        {/* Row 4 - Ek Bilgiler */}
        <ServiceAdditionalInfoCard
          formData={formData}
          handleInputChange={handleInputChange}
        />

        {/* Tekrarlama Ayarları */}
        <ServiceRecurrenceForm
          value={recurrenceConfig}
          onChange={setRecurrenceConfig}
        />
      </div>
    </div>
  );
};

export default NewServiceRequest;
