import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  CheckCircle2,
  ArrowLeft,
  FileText
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import BackButton from '@/components/ui/back-button';
import { useCustomerSelect } from '@/hooks/useCustomerSelect';
import { ServiceRecurrenceForm } from '@/components/service/ServiceRecurrenceForm';
import { RecurrenceConfig } from '@/utils/serviceRecurrenceUtils';
import ServiceBasicInfoCard from '@/components/service/cards/ServiceBasicInfoCard';
import ServiceCustomerInfoCard from '@/components/service/cards/ServiceCustomerInfoCard';
import ServiceDateInfoCard from '@/components/service/cards/ServiceDateInfoCard';
import ProductServiceCard from '@/components/proposals/cards/ProductServiceCard';
import ServiceAttachmentsNotesCard from '@/components/service/cards/ServiceAttachmentsNotesCard';
import ProductDetailsModal from '@/components/proposals/form/ProductDetailsModal';
import { ServiceSlipTemplateSelector } from '@/components/service/ServiceSlipTemplateSelector';
import { PdfExportService } from '@/services/pdf/pdfExportService';
import { logger } from '@/utils/logger';

interface ServiceRequestFormData {
  service_title: string;
  service_request_description: string;
  service_location: string;
  service_priority: 'low' | 'medium' | 'high' | 'urgent';
  service_status: 'new' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  service_type: string;
  customer_id: string | null;
  supplier_id: string | null;
  service_due_date: Date | null;
  service_reported_date: Date;
  service_start_date: Date | null;
  service_end_date: Date | null;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  product_items: Array<{
    id: string;
    row_number: number;
    product_id: string | null;
    name: string;
    description?: string;
    quantity: number;
    unit?: string;
    unit_price: number;
    tax_rate?: number;
    discount_rate?: number;
    total_price: number;
    currency?: string;
    image_url?: string;
  }>;
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
  service_number: string;
  service_result: string;
  received_by: string | null;
  assigned_technician: string | null;
}

// Priority config
const priorityConfig = {
  low: { label: 'Düşük', color: 'bg-gray-100 text-gray-800', icon: '🟢' },
  medium: { label: 'Orta', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
  high: { label: 'Yüksek', color: 'bg-orange-100 text-orange-800', icon: '🟠' },
  urgent: { label: 'Acil', color: 'bg-red-100 text-red-800', icon: '🔴' },
};

const ServiceEdit = () => {
  logger.debug('[ServiceEdit] Component render started');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();
  logger.debug('[ServiceEdit] User data loaded', { userId: userData?.id });
  
  const { customers, suppliers, isLoading: partnersLoading } = useCustomerSelect();
  logger.debug('[ServiceEdit] Partners loaded', {
    customersCount: customers?.length,
    suppliersCount: suppliers?.length
  });

  // Teknisyenleri getir
  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians-for-service", userData?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .eq("status", "aktif")
        .eq("is_technical", true)
        .order("first_name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id,
  });

  // Servis verisini çek
  const { data: serviceRequest, isLoading: loading } = useQuery({
    queryKey: ['service-request', id],
    queryFn: async () => {
      logger.debug('[ServiceEdit] serviceRequest queryFn çalışıyor, id:', id);
      if (!id) throw new Error('Servis ID bulunamadı');
      
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error('[ServiceEdit] serviceRequest query error:', error);
        throw error;
      }
      logger.debug('[ServiceEdit] serviceRequest data alındı:', data?.id);
      return data;
    },
    enabled: !!id,
  });

  // Service items'ı çek (order_items gibi ayrı tablo)
  const { data: serviceItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['service-items', id],
    queryFn: async () => {
      logger.debug('[ServiceEdit] serviceItems queryFn çalışıyor, id:', id);
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('service_items')
        .select('*')
        .eq('service_request_id', id)
        .order('row_number', { ascending: true });

      if (error) {
        logger.error('[ServiceEdit] serviceItems query error:', error);
        throw error;
      }
      logger.debug('[ServiceEdit] serviceItems data alındı, count:', data?.length);
      return data || [];
    },
    enabled: !!id,
  });

  // Form state
  const [formData, setFormData] = useState<ServiceRequestFormData>({
    service_title: '',
    service_request_description: '',
    service_location: '',
    service_priority: 'medium',
    service_status: 'new',
    service_type: '',
    customer_id: null,
    supplier_id: null,
    service_due_date: null,
    service_reported_date: new Date(),
    service_start_date: null,
    service_end_date: null,
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    product_items: [{
      id: "1",
      row_number: 1,
      product_id: null,
      name: '',
      description: '',
      quantity: 1,
      unit: 'adet',
      unit_price: 0,
      tax_rate: 20,
      discount_rate: 0,
      total_price: 0,
      currency: 'TRY'
    }],
    warranty_info: null,
    attachments: [],
    notes: [],
    service_number: '',
    service_result: '',
    received_by: null,
    assigned_technician: null,
  });

  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig>({ type: 'none' });
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // ProposalEdit'teki gibi: proposalLoaded flag'i yerine isInitialized kullanıyoruz
  
  // Product modal state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | undefined>(undefined);
  const [editingItemData, setEditingItemData] = useState<any>(null);

  // Service slip PDF state
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // ID değiştiğinde initialize flag'ini sıfırla (ProposalEdit'te yok ama biz ekliyoruz)
  useEffect(() => {
    logger.debug('[ServiceEdit] ID değişti, initialize sıfırlanıyor, id:', id);
    setIsInitialized(false);
    setHasChanges(false);
  }, [id]);

  // Servis verisi yüklendiğinde form state'i initialize et (ProposalEdit'teki gibi)
  useEffect(() => {
    logger.debug('[ServiceEdit] Initialize useEffect çalışıyor', {
      hasServiceRequest: !!serviceRequest,
      isInitialized,
      serviceRequestId: serviceRequest?.id,
      currentId: id,
      serviceItemsLength: serviceItems?.length,
      itemsLoading
    });
    
    // ProposalEdit'teki gibi: sadece serviceRequest varsa ve henüz initialize edilmemişse çalış
    // serviceRequest ve serviceItems'ın ID'lerini kullanarak gereksiz re-render'ları önle
    // serviceItems yüklenene kadar bekle
    if (serviceRequest && !isInitialized && serviceRequest.id === id && !itemsLoading) {
      logger.debug('[ServiceEdit] Form initialize başlıyor...');
      // Service items'ı service_items tablosundan çek (order_items gibi)
      let productItems = [{
        id: "1",
        row_number: 1,
        product_id: null,
        name: '',
        description: '',
        quantity: 1,
        unit: 'adet',
        unit_price: 0,
        tax_rate: 20,
        discount_rate: 0,
        total_price: 0,
        currency: 'TRY'
      }];

      // Önce service_items tablosundan çek
      logger.debug('[ServiceEdit] serviceItems:', serviceItems);
      if (serviceItems && serviceItems.length > 0) {
        productItems = serviceItems.map((item: any) => ({
          id: item.id || Date.now().toString(),
          row_number: item.row_number || 1,
          product_id: item.product_id || null,
          name: item.name || '',
          description: item.description || '',
          quantity: item.quantity || 1,
          unit: item.unit || 'adet',
          unit_price: item.unit_price || 0,
          tax_rate: item.tax_rate || 20,
          discount_rate: item.discount_rate || 0,
          total_price: item.total_price || (item.quantity || 1) * (item.unit_price || 0),
          currency: item.currency || 'TRY'
        }));
        logger.debug('[ServiceEdit] productItems mapped:', productItems);
      } else if (serviceRequest.service_details && typeof serviceRequest.service_details === 'object') {
        // Fallback: Eski JSONB formatından oku (backward compatibility)
        const serviceDetails = serviceRequest.service_details as any;
        if (serviceDetails.equipment_items && Array.isArray(serviceDetails.equipment_items) && serviceDetails.equipment_items.length > 0) {
          productItems = serviceDetails.equipment_items.map((item: any, index: number) => ({
            id: item.id || `${index + 1}`,
            row_number: index + 1,
            product_id: item.product_id || item.equipment_id || null,
            name: item.name || '',
            description: item.description || '',
            quantity: item.quantity || 1,
            unit: item.unit || 'adet',
            unit_price: item.unit_price || 0,
            tax_rate: item.tax_rate || 20,
            discount_rate: item.discount_rate || 0,
            total_price: item.total_price || (item.quantity || 1) * (item.unit_price || 0),
            currency: item.currency || 'TRY'
          }));
        }
      }

      // Parse warranty_info
      let warrantyInfo = null;
      if (serviceRequest.warranty_info && typeof serviceRequest.warranty_info === 'object') {
        warrantyInfo = serviceRequest.warranty_info as any;
      }

      // Parse attachments
      let attachments: Array<{ name: string; path: string; type: string; size: number }> = [];
      if (serviceRequest.attachments && Array.isArray(serviceRequest.attachments)) {
        attachments = serviceRequest.attachments;
      }

      // Parse notes
      let notes: string[] = [];
      if (serviceRequest.notes && Array.isArray(serviceRequest.notes)) {
        notes = serviceRequest.notes;
      }

      setFormData({
        service_title: serviceRequest.service_title || '',
        service_request_description: serviceRequest.service_request_description || '',
        service_location: serviceRequest.service_location || '',
        service_priority: serviceRequest.service_priority || 'medium',
        service_status: serviceRequest.service_status || 'new',
        service_type: serviceRequest.service_type || '',
        customer_id: serviceRequest.customer_id || null,
        supplier_id: serviceRequest.supplier_id || null,
        service_due_date: serviceRequest.service_due_date ? new Date(serviceRequest.service_due_date) : null,
        service_reported_date: serviceRequest.service_reported_date ? new Date(serviceRequest.service_reported_date) : new Date(),
        service_start_date: serviceRequest.service_start_date ? new Date(serviceRequest.service_start_date) : null,
        service_end_date: serviceRequest.service_end_date ? new Date(serviceRequest.service_end_date) : null,
        contact_person: serviceRequest.contact_person || '',
        contact_phone: serviceRequest.contact_phone || '',
        contact_email: serviceRequest.contact_email || '',
        product_items: productItems,
        warranty_info: warrantyInfo,
        attachments: attachments,
        notes: notes,
        service_number: serviceRequest.service_number || '',
        service_result: serviceRequest.service_result || '',
        received_by: serviceRequest.received_by || null,
        assigned_technician: serviceRequest.assigned_technician || null,
      });

      // Parse recurrence config if exists
      if (serviceRequest.is_recurring) {
        setRecurrenceConfig({
          type: serviceRequest.recurrence_type || 'none',
          interval: serviceRequest.recurrence_interval || 1,
          endDate: serviceRequest.recurrence_end_date ? new Date(serviceRequest.recurrence_end_date) : undefined,
          days: serviceRequest.recurrence_days || [],
          dayOfMonth: serviceRequest.recurrence_day_of_month || undefined,
        });
      }
        
      logger.debug('[ServiceEdit] Form initialize tamamlandı', {
        productItemsCount: productItems.length,
        productItems: productItems
      });
      setIsInitialized(true);
      setHasChanges(false);
    } else {
      logger.debug('[ServiceEdit] Initialize koşulları sağlanmadı, atlanıyor', {
        hasServiceRequest: !!serviceRequest,
        isInitialized,
        serviceRequestId: serviceRequest?.id,
        currentId: id,
        itemsLoading
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceRequest?.id, serviceItems, isInitialized, id, itemsLoading]);

  // Ürün item yönetimi
  const addProductItem = () => {
    setFormData(prev => ({
      ...prev,
      product_items: [
        ...prev.product_items,
        {
          id: Date.now().toString(),
          row_number: prev.product_items.length + 1,
          product_id: null,
          name: '',
          description: '',
          quantity: 1,
          unit: 'adet',
          unit_price: 0,
          tax_rate: 20,
          discount_rate: 0,
          total_price: 0,
          currency: 'TRY'
        }
      ]
    }));
    setHasChanges(true);
  };

  const removeProductItem = (index: number) => {
    setFormData(prev => {
      if (prev.product_items.length > 1) {
        const updatedItems = prev.product_items.filter((_, i) => i !== index);
        return {
          ...prev,
          product_items: updatedItems.map((item, i) => ({
            ...item,
            row_number: i + 1
          }))
        };
      }
      return prev;
    });
    setHasChanges(true);
  };

  const handleProductItemChange = (index: number, field: keyof ServiceRequestFormData['product_items'][0], value: any) => {
    setFormData(prev => {
      const updatedItems = [...prev.product_items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
        total_price: field === 'quantity' || field === 'unit_price' 
          ? (field === 'quantity' ? value : updatedItems[index].quantity) * 
            (field === 'unit_price' ? value : updatedItems[index].unit_price)
          : updatedItems[index].total_price
      };
      return {
        ...prev,
        product_items: updatedItems
      };
    });
    setHasChanges(true);
  };

  const handleProductModalSelect = (product: any, itemIndex?: number) => {
    if (itemIndex !== undefined) {
      setSelectedProduct(product);
      setEditingItemIndex(itemIndex);
      setEditingItemData(product);
      setProductModalOpen(true);
    } else {
      setSelectedProduct(product);
      setEditingItemIndex(undefined);
      setEditingItemData(null);
      setProductModalOpen(true);
    }
  };

  const handleAddProductToItems = (productData: any, itemIndex?: number) => {
    if (itemIndex !== undefined) {
      setFormData(prev => {
        const updatedItems = [...prev.product_items];
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          product_id: productData.id || productData.product_id || null,
          name: productData.name,
          description: productData.description,
          quantity: productData.quantity,
          unit: productData.unit,
          unit_price: productData.unit_price,
          tax_rate: productData.vat_rate,
          discount_rate: productData.discount_rate,
          total_price: productData.total_price,
          currency: productData.currency || 'TRY'
        };
        return {
          ...prev,
          product_items: updatedItems
        };
      });
    } else {
      setFormData(prev => {
        const newItem = {
          id: Date.now().toString(),
          row_number: prev.product_items.length + 1,
          product_id: productData.id || productData.product_id || null,
          name: productData.name,
          description: productData.description,
          quantity: productData.quantity,
          unit: productData.unit,
          unit_price: productData.unit_price,
          tax_rate: productData.vat_rate,
          discount_rate: productData.discount_rate,
          total_price: productData.total_price,
          currency: productData.currency || 'TRY'
        };
        return {
          ...prev,
          product_items: [...prev.product_items, newItem]
        };
      });
    }
    
    setProductModalOpen(false);
    setEditingItemIndex(undefined);
    setSelectedProduct(null);
    setEditingItemData(null);
    setHasChanges(true);
  };


  // Seçili müşteri/tedarikçi bilgisi - sadece ID değiştiğinde yeniden hesapla
  const selectedPartner = React.useMemo(() => {
    logger.debug('[ServiceEdit] selectedPartner useMemo çalışıyor', {
      customer_id: formData.customer_id,
      supplier_id: formData.supplier_id,
      customersLength: customers?.length,
      suppliersLength: suppliers?.length
    });
    
    if (formData.customer_id && customers && customers.length > 0) {
      const found = customers.find(c => c.id === formData.customer_id);
      logger.debug('[ServiceEdit] Customer bulundu:', found?.name);
      return found;
    }
    if (formData.supplier_id && suppliers && suppliers.length > 0) {
      const found = suppliers.find(s => s.id === formData.supplier_id);
      logger.debug('[ServiceEdit] Supplier bulundu:', found?.name);
      return found;
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.customer_id, formData.supplier_id, customers?.length, suppliers?.length]);


  // Input change handler
  const handleInputChange = useCallback((field: keyof ServiceRequestFormData, value: any) => {
    logger.debug('[ServiceEdit] handleInputChange:', field, value);
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  }, []);

  // Recurrence config change handler - useCallback ile sarmalıyoruz sonsuz döngüyü önlemek için
  const handleRecurrenceChange = useCallback((config: RecurrenceConfig) => {
    logger.debug('[ServiceEdit] RecurrenceConfig değişti:', config);
    setRecurrenceConfig(config);
    setHasChanges(true);
  }, []);

  // onContactChange callback'ini useCallback ile sarmalıyoruz
  const handleContactChange = useCallback((contactInfo: { phone?: string; email?: string }) => {
    if (contactInfo.phone) {
      handleInputChange('contact_phone', contactInfo.phone);
    }
    if (contactInfo.email) {
      handleInputChange('contact_email', contactInfo.email);
    }
  }, [handleInputChange]);

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
          service_location: selectedCustomer.address || prev.service_location,
        }));
        setHasChanges(true);
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
          service_location: selectedSupplier.address || prev.service_location,
        }));
        setHasChanges(true);
      }
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
          logger.error('Upload error:', uploadError);
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
        setHasChanges(true);
      }
    } catch (error) {
      logger.error('File upload error:', error);
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
      setHasChanges(true);
    }
  };

  const handleRemoveNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes.filter((_, i) => i !== index),
    }));
    setHasChanges(true);
  };

  // Servis güncelleme mutation
  const updateServiceMutation = useMutation({
    mutationFn: async (data: ServiceRequestFormData) => {
      if (!id) throw new Error('Servis ID bulunamadı');
      
      // Company ID al
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.company_id) {
        throw new Error('Şirket bilgisi bulunamadı');
      }

      // received_by alanı employee ID'si olabilir, user_id'ye çevir
      let receivedByUserId: string | null = null;
      if (data.received_by) {
        try {
          const { data: employee } = await supabase
            .from('employees')
            .select('user_id')
            .eq('id', data.received_by)
            .single();
          
          if (employee?.user_id) {
            receivedByUserId = employee.user_id;
          } else {
            // Eğer employee bulunamazsa, değeri direkt kullan (belki zaten user_id'dir)
            receivedByUserId = data.received_by;
          }
        } catch (err) {
          logger.warn('Employee user_id bulunamadı:', err);
          // Eğer employee bulunamazsa, değeri direkt kullan (belki zaten user_id'dir)
          receivedByUserId = data.received_by;
        }
      }

      // Mevcut servis verisini al (teknisyen değişikliğini kontrol etmek için)
      const { data: currentRequest, error: currentError } = await supabase
        .from('service_requests')
        .select('assigned_technician, service_title')
        .eq('id', id)
        .single();

      if (currentError) {
        logger.error('Mevcut servis verisi alınamadı:', currentError);
      }

      // Teknisyen değişikliğini kontrol et
      const newAssignedTechnician = data.assigned_technician && 
        data.assigned_technician !== 'unassigned' ? data.assigned_technician : null;
      
      const isTechnicianChanged = newAssignedTechnician && 
        newAssignedTechnician !== currentRequest?.assigned_technician;

      // Durum otomatik güncelleme: Teknisyen atandıysa 'assigned' yap
      let finalStatus = data.service_status;
      if (newAssignedTechnician && !currentRequest?.assigned_technician) {
        // İlk kez teknisyen atanıyorsa
        finalStatus = 'assigned';
      } else if (newAssignedTechnician && isTechnicianChanged) {
        // Teknisyen değiştiyse
        finalStatus = 'assigned';
      } else if (!newAssignedTechnician && currentRequest?.assigned_technician) {
        // Teknisyen kaldırıldıysa
        finalStatus = 'new';
      }

      // Ana servis bilgilerini güncelle
      const { data: result, error } = await supabase
        .from('service_requests')
        .update({
          service_title: data.service_title,
          service_request_description: data.service_request_description,
          service_location: data.service_location,
          service_priority: data.service_priority,
          service_status: finalStatus,
          service_type: data.service_type,
          customer_id: data.customer_id,
          supplier_id: data.supplier_id,
          service_due_date: data.service_due_date?.toISOString(),
          service_reported_date: data.service_reported_date.toISOString(),
          service_start_date: data.service_start_date?.toISOString(),
          service_end_date: data.service_end_date?.toISOString(),
          contact_person: data.contact_person,
          contact_phone: data.contact_phone,
          contact_email: data.contact_email,
          warranty_info: data.warranty_info,
          attachments: data.attachments,
          notes: data.notes,
          service_number: data.service_number,
          service_result: data.service_result,
          received_by: receivedByUserId,
          assigned_technician: newAssignedTechnician,
          // Recurrence fields
          is_recurring: recurrenceConfig.type !== 'none',
          recurrence_type: recurrenceConfig.type !== 'none' ? recurrenceConfig.type : null,
          recurrence_interval: recurrenceConfig.type !== 'none' ? recurrenceConfig.interval : null,
          recurrence_end_date: recurrenceConfig.endDate ? recurrenceConfig.endDate.toISOString().split('T')[0] : null,
          recurrence_days: recurrenceConfig.days || null,
          recurrence_day_of_month: recurrenceConfig.dayOfMonth || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Eğer teknisyen değiştiyse ve yeni bir teknisyen atandıysa push notification gönder
      if (isTechnicianChanged && newAssignedTechnician) {
        try {
          // Teknisyenin user_id'sini bul
          const { data: technician, error: techError } = await supabase
            .from('employees')
            .select('user_id, first_name, last_name')
            .eq('id', newAssignedTechnician)
            .single();

          if (!techError && technician?.user_id) {
            const notificationTitle = 'Yeni Servis Ataması';
            const notificationBody = `${currentRequest?.service_title || result.service_title || 'Servis talebi'} size atandı.`;
            
            // Database'e bildirim kaydı ekle
            await supabase
              .from('notifications')
              .insert({
                user_id: technician.user_id,
                title: notificationTitle,
                body: notificationBody,
                type: 'service_assignment',
                service_request_id: id,
                technician_id: newAssignedTechnician,
                company_id: profile.company_id,
                is_read: false,
              });

            // Push notification gönder (mobil uygulamaya)
            try {
              const { data: pushData, error: pushError } = await supabase.functions.invoke('send-push-notification', {
                body: {
                  user_id: technician.user_id,
                  title: notificationTitle,
                  body: notificationBody,
                  data: {
                    type: 'service_assignment',
                    service_request_id: id,
                    action: 'open_service_request',
                  }
                }
              });

              if (pushError) {
                logger.error('Push notification gönderme hatası:', pushError);
              } else {
                logger.debug('Push notification başarıyla gönderildi:', pushData);
              }
            } catch (pushErr) {
              logger.error('Push notification çağrı hatası:', pushErr);
              // Push notification hatası kritik değil, devam et
            }
          }
        } catch (notifErr) {
          logger.error('Bildirim gönderme hatası:', notifErr);
          // Bildirim hatası kritik değil, devam et
        }
      }

      // Service items'ı güncelle (order_items gibi)
      if (data.product_items && data.product_items.length > 0) {
        // Mevcut items'ları sil
        const { error: deleteError } = await supabase
          .from('service_items')
          .delete()
          .eq('service_request_id', id);

        if (deleteError) {
          logger.error('Service items silinirken hata:', deleteError);
          // Devam et, yeni items eklemeye çalış
        }

        // Yeni items'ları ekle
        const serviceItemsToInsert = data.product_items
          .filter(item => item.name.trim() || item.description?.trim()) // Boş item'ları filtrele
          .map((item, index) => ({
            service_request_id: id,
            company_id: profile.company_id,
            product_id: item.product_id || null,
            name: item.name || '',
            description: item.description || '',
            quantity: item.quantity || 1,
            unit: item.unit || 'adet',
            unit_price: item.unit_price || 0,
            tax_rate: item.tax_rate || 20,
            discount_rate: item.discount_rate || 0,
            total_price: item.total_price || (item.quantity || 1) * (item.unit_price || 0),
            currency: item.currency || 'TRY',
            row_number: item.row_number || index + 1,
          }));

        if (serviceItemsToInsert.length > 0) {
          const { error: itemsError } = await supabase
            .from('service_items')
            .insert(serviceItemsToInsert);

          if (itemsError) {
            logger.error('Service items eklenirken hata:', itemsError);
            throw itemsError;
          }
        }
      } else {
        // Eğer items yoksa, mevcut items'ları sil
        const { error: deleteError } = await supabase
          .from('service_items')
          .delete()
          .eq('service_request_id', id);

        if (deleteError) {
          logger.error('Service items silinirken hata:', deleteError);
        }
      }

      return result;
    },
    onSuccess: (data) => {
      toast.success('Servis talebi başarıyla güncellendi!', {
        description: `"${data.service_title}" servisi kaydedildi.`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      });
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['service-request', id] });
      queryClient.invalidateQueries({ queryKey: ['service-items', id] });
      setHasChanges(false);
      // Kısa bir gecikme ile servis yönetimi sayfasına yönlendir
      setTimeout(() => {
        navigate('/service/management');
      }, 1500);
    },
    onError: (error: any) => {
      logger.error('Servis güncelleme hatası:', error);
      toast.error('Servis talebi güncellenirken bir hata oluştu', {
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

    updateServiceMutation.mutate(formData);
  };

  // Servis fişi PDF oluşturma
  const handleGenerateServiceSlipPdf = async (templateId: string) => {
    if (!serviceRequest || !id) {
      toast.error('Servis verisi bulunamadı');
      return;
    }

    setIsGeneratingPdf(true);
    try {
      // Servis verisini PDF formatına dönüştür
      const serviceData = await PdfExportService.transformServiceForPdf(serviceRequest);
      
      // PDF'i oluştur ve aç
      await PdfExportService.openServicePdfInNewTab(serviceData, {
        templateId,
        filename: `servis-fisi-${serviceData.serviceNumber}.pdf`
      });

      toast.success('Servis fişi PDF\'i oluşturuldu');
      setTemplateSelectorOpen(false);
    } catch (error) {
      logger.error('PDF oluşturma hatası:', error);
      toast.error('PDF oluşturulurken hata oluştu: ' + (error as Error).message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    handleGenerateServiceSlipPdf(templateId);
  };

  useEffect(() => {
    logger.debug('[ServiceEdit] Render kontrolü:', {
      loading,
      itemsLoading,
      hasServiceRequest: !!serviceRequest,
      isInitialized,
      formDataTitle: formData.service_title
    });
  }, [loading, itemsLoading, serviceRequest, isInitialized, formData.service_title]);

  if (loading || itemsLoading) {
    logger.debug('[ServiceEdit] Loading state, render ediliyor');
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="w-8 h-8 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!serviceRequest) {
    logger.debug('[ServiceEdit] ServiceRequest yok, hata sayfası render ediliyor');
    return (
      <div className="flex flex-col items-center justify-center h-[600px]">
        <h2 className="text-xl font-semibold mb-2">Servis Bulunamadı</h2>
        <p className="text-muted-foreground mb-6">İstediğiniz servis mevcut değil veya erişim izniniz yok.</p>
        <Button onClick={() => navigate('/service/management')}>Servisler Sayfasına Dön</Button>
      </div>
    );
  }

  logger.debug('[ServiceEdit] Ana render başlıyor');
  return (
    <div className="space-y-2">
      {/* Enhanced Sticky Header */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-2">
        <div className="flex items-center justify-between p-3 pl-12">
          <div className="flex items-center gap-3">
            <BackButton 
              onClick={() => navigate("/service/management")}
              variant="ghost"
              size="sm"
            >
              Servisler
            </BackButton>
            
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Servis Düzenle
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  {serviceRequest.service_number || `SR-${serviceRequest.id.slice(-6).toUpperCase()}`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSubmit}
              disabled={updateServiceMutation.isPending || !hasChanges}
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{updateServiceMutation.isPending ? "Kaydediliyor..." : hasChanges ? "Değişiklikleri Kaydet" : "Kaydedildi"}</span>
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
                <DropdownMenuItem onClick={() => navigate(`/service/detail/${id}`)} className="gap-2 cursor-pointer">
                  <Eye className="h-4 w-4" />
                  <span>Detayları Görüntüle</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setTemplateSelectorOpen(true)} 
                  className="gap-2 cursor-pointer"
                  disabled={isGeneratingPdf}
                >
                  <FileText className="h-4 w-4" />
                  <span>Servis Fişi Oluştur</span>
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
        {/* Row 1 - Tarih Bilgileri */}
        <ServiceDateInfoCard
          formData={formData}
          handleInputChange={handleInputChange}
        />

        {/* Row 2 - Müşteri ve Temel Bilgiler */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ServiceCustomerInfoCard
            formData={formData}
            handleInputChange={handleInputChange}
            handlePartnerSelect={handlePartnerSelect}
            customers={customers}
            suppliers={suppliers}
            partnersLoading={partnersLoading}
            selectedPartner={selectedPartner}
            onContactChange={handleContactChange}
          />

          <ServiceBasicInfoCard
            formData={formData}
            handleInputChange={handleInputChange}
            priorityConfig={priorityConfig}
            technicians={technicians}
          />
        </div>

        {/* Row 3 - Ürün/Hizmet Listesi (Full Width) */}
        <ProductServiceCard
          items={formData.product_items}
          onAddItem={addProductItem}
          onRemoveItem={removeProductItem}
          onItemChange={handleProductItemChange}
          onProductModalSelect={handleProductModalSelect}
          showMoveButtons={false}
          inputHeight="h-10"
        />

        {/* Row 4 - Ek Bilgiler, Dosya/Notlar */}
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

        {/* Tekrarlama Ayarları */}
        <ServiceRecurrenceForm
          value={recurrenceConfig}
          onChange={handleRecurrenceChange}
        />
      </div>

      {/* Product Details Modal */}
      <ProductDetailsModal
        open={productModalOpen}
        onOpenChange={(open) => {
          setProductModalOpen(open);
          if (!open) {
            setEditingItemIndex(undefined);
            setSelectedProduct(null);
            setEditingItemData(null);
          }
        }}
        product={selectedProduct}
        onAddToProposal={(productData) => handleAddProductToItems(productData, editingItemIndex)}
        currency="TRY"
        existingData={editingItemData}
      />

      {/* Service Slip Template Selector */}
      <ServiceSlipTemplateSelector
        isOpen={templateSelectorOpen}
        onClose={() => setTemplateSelectorOpen(false)}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
};

export default ServiceEdit;

