import React, { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Save, Send, CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Package } from "lucide-react";
import { Order } from "@/types/orders";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { useNumberGenerator } from "@/hooks/useNumberGenerator";
import ServiceBasicInfoCard from "@/components/service/cards/ServiceBasicInfoCard";
import ServiceCustomerInfoCard from "@/components/service/cards/ServiceCustomerInfoCard";
import ServiceDateInfoCard from "@/components/service/cards/ServiceDateInfoCard";
import ProductServiceCard from "@/components/proposals/cards/ProductServiceCard";
import ServiceAttachmentsNotesCard from "@/components/service/cards/ServiceAttachmentsNotesCard";
import ProductDetailsModal from "@/components/proposals/form/ProductDetailsModal";
import { ServiceRecurrenceForm } from "@/components/service/ServiceRecurrenceForm";
import { RecurrenceConfig } from "@/utils/serviceRecurrenceUtils";

// Constants
const DEFAULT_VAT_PERCENTAGE = 20;
const DEFAULT_CURRENCY = "TRY";
const DEFAULT_QUANTITY = 1;
const DEFAULT_UNIT = "adet";

// Priority config
const priorityConfig = {
  low: { label: 'Düşük', color: 'bg-gray-100 text-gray-800', icon: '🟢' },
  medium: { label: 'Orta', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
  high: { label: 'Yüksek', color: 'bg-orange-100 text-orange-800', icon: '🟠' },
  urgent: { label: 'Acil', color: 'bg-red-100 text-red-800', icon: '🔴' },
};

interface LineItem {
  id: string;
  row_number: number;
  name?: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  tax_rate?: number;
  discount_rate?: number;
  total_price: number;
  currency?: string;
  product_id?: string;
  image_url?: string;
}

interface ServiceRequestFormData {
  service_title: string;
  service_request_description: string;
  customer_id?: string;
  service_priority: 'low' | 'medium' | 'high' | 'urgent';
  service_status: 'new' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  assigned_technician?: string;
  service_due_date?: Date | null;
  service_location?: string;
  service_type?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  supplier_id?: string;
  received_by?: string | null;
  created_by?: string;
  service_start_date?: Date | null;
  service_end_date?: Date | null;
  service_reported_date: Date;
  notes?: string;
  order_id?: string;
  order_number?: string;
  product_items: LineItem[];
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
  service_number: string;
  service_result: string;
}

interface OrderToServiceFormProps {
  orderId: string | null;
  order: Order;
}

const OrderToServiceForm: React.FC<OrderToServiceFormProps> = ({ orderId, order }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();
  const { customers, suppliers, isLoading: partnersLoading } = useCustomerSelect();
  const { generateServiceNumber } = useNumberGenerator();

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

  // Line items state
  const [items, setItems] = useState<LineItem[]>([]);
  
  // Form state
  const [formData, setFormData] = useState<ServiceRequestFormData>({
    service_title: '',
    service_request_description: '',
    service_priority: 'medium',
    service_status: 'new',
    product_items: [],
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    service_location: '',
    service_reported_date: new Date(),
    warranty_info: null,
    attachments: [],
    service_number: '',
    service_result: '',
    received_by: null,
  });

  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig>({ type: 'none' });
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [notesList, setNotesList] = useState<string[]>([]);

  // Product modal state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | undefined>(undefined);
  const [editingItemData, setEditingItemData] = useState<any>(null);

  // Initialize form from order data
  useEffect(() => {
    if (order) {
      // Parse items from order_items
      const orderItems = (order as any).order_items || order.items || [];
      const lineItems: LineItem[] = orderItems.map((item: any, index: number) => ({
        id: item.id || `item-${index}`,
        row_number: index + 1,
        name: item.item_name || item.name || "",
        description: item.description || "",
        quantity: Number(item.quantity) || DEFAULT_QUANTITY,
        unit: item.unit || DEFAULT_UNIT,
        unit_price: Number(item.unit_price) || 0,
        tax_rate: Number(item.tax_rate) || DEFAULT_VAT_PERCENTAGE,
        discount_rate: Number(item.discount_rate) || 0,
        total_price: Number(item.total_price) || (Number(item.quantity) * Number(item.unit_price)),
        currency: item.currency || order.currency || DEFAULT_CURRENCY,
        product_id: item.product_id,
        image_url: item.image_url,
      }));

      setItems(lineItems);

      // Pre-populate service request data from order
      const customer = order.customer;
      setFormData({
        service_title: (order as any).subject || order.title || `${order.order_number} Servis Talebi`,
        service_request_description: order.description || order.notes || "",
        customer_id: order.customer_id || "",
        service_priority: 'medium',
        service_status: 'new',
        service_location: order.delivery_address || customer?.address || "",
        contact_person: order.delivery_contact_name || customer?.name || "",
        contact_phone: order.delivery_contact_phone || customer?.mobile_phone || customer?.office_phone || "",
        contact_email: customer?.email || "",
        order_id: order.id,
        order_number: order.order_number,
        product_items: lineItems,
        notes: order.notes || "",
        service_reported_date: new Date(),
        warranty_info: null,
        attachments: [],
        service_number: '',
        service_result: '',
        received_by: null,
      });

      if (order.notes) {
        setNotesList([order.notes]);
      }
    }
  }, [order]);

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
          supplier_id: undefined,
          contact_person: selectedCustomer.name || prev.contact_person,
          contact_phone: selectedCustomer.mobile_phone || selectedCustomer.office_phone || prev.contact_phone,
          contact_email: selectedCustomer.email || prev.contact_email,
          service_location: selectedCustomer.address || prev.service_location,
        }));
      }
    } else {
      const selectedSupplier = suppliers?.find(s => s.id === partnerId);
      if (selectedSupplier) {
        setFormData(prev => ({
          ...prev,
          supplier_id: partnerId,
          customer_id: undefined,
          contact_person: selectedSupplier.name || prev.contact_person,
          contact_phone: selectedSupplier.mobile_phone || selectedSupplier.office_phone || prev.contact_phone,
          contact_email: selectedSupplier.email || prev.contact_email,
          service_location: selectedSupplier.address || prev.service_location,
        }));
      }
    }
  };

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
  };

  const handleProductItemChange = (index: number, field: keyof LineItem, value: any) => {
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
      setNotesList(prev => [...prev, newNote.trim()]);
      setNewNote('');
    }
  };

  const handleRemoveNote = (index: number) => {
    setNotesList(prev => prev.filter((_, i) => i !== index));
  };

  // Servis oluşturma mutation
  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceRequestFormData) => {
      const companyId = userData?.company_id;
      
      if (!companyId) {
        throw new Error('Şirket bilgisi bulunamadı');
      }

      // Kayıt anında servis numarası üret
      let serviceNumber = data.service_number?.trim() || '';
      let attempts = 0;
      const maxAttempts = 5;

      if (!serviceNumber) {
        while (attempts < maxAttempts) {
          try {
            serviceNumber = await generateServiceNumber();
            break;
          } catch (error) {
            attempts++;
            if (attempts >= maxAttempts) {
              throw new Error('Servis numarası üretilemedi. Lütfen tekrar deneyin.');
            }
            await new Promise(resolve => setTimeout(resolve, 100 * attempts));
          }
        }
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
          }
        } catch (err) {
          logger.warn('Employee user_id bulunamadı:', err);
          receivedByUserId = data.received_by;
        }
      }

      // Ana servis kaydını oluştur
      const insertData: any = {
        company_id: companyId,
        service_title: data.service_title,
        service_request_description: data.service_request_description || null,
        service_location: data.service_location || null,
        service_priority: data.service_priority || null,
        service_status: data.service_status || 'new',
        service_type: data.service_type || null,
        customer_id: data.customer_id || null,
        supplier_id: data.supplier_id || null,
        service_due_date: data.service_due_date ? data.service_due_date.toISOString() : null,
        service_reported_date: data.service_reported_date ? data.service_reported_date.toISOString() : new Date().toISOString(),
        service_start_date: data.service_start_date ? data.service_start_date.toISOString() : null,
        service_end_date: data.service_end_date ? data.service_end_date.toISOString() : null,
        contact_person: data.contact_person || null,
        contact_phone: data.contact_phone || null,
        contact_email: data.contact_email || null,
        warranty_info: data.warranty_info || null,
        attachments: data.attachments || [],
        notes: notesList || [],
        service_number: serviceNumber,
        service_result: data.service_result || null,
        received_by: receivedByUserId,
        created_by: userData?.id || null,
        assigned_technician: data.assigned_technician && data.assigned_technician !== 'unassigned' ? data.assigned_technician : null,
        order_id: data.order_id || null,
        order_number: data.order_number || null,
        // Recurrence fields
        is_recurring: recurrenceConfig.type !== 'none',
        recurrence_type: recurrenceConfig.type !== 'none' ? recurrenceConfig.type : null,
        recurrence_interval: recurrenceConfig.type !== 'none' ? recurrenceConfig.interval : null,
        recurrence_end_date: recurrenceConfig.endDate ? recurrenceConfig.endDate.toISOString().split('T')[0] : null,
        recurrence_days: recurrenceConfig.days || null,
        recurrence_day_of_month: recurrenceConfig.dayOfMonth || null,
      };

      // Undefined değerleri kaldır
      Object.keys(insertData).forEach(key => {
        if (insertData[key] === undefined) {
          delete insertData[key];
        }
      });

      const { data: serviceRequest, error: serviceError } = await supabase
        .from('service_requests')
        .insert(insertData)
        .select()
        .single();

      if (serviceError) {
        logger.error('Service creation error:', serviceError);
        throw new Error(serviceError.message || "Servis talebi oluşturulamadı");
      }

      // Service items'ı ayrı tabloya ekle
      if (data.product_items && data.product_items.length > 0) {
        const serviceItemsToInsert = data.product_items
          .filter(item => (item.name && item.name.trim()) || (item.description && item.description.trim()))
          .map((item, index) => ({
            service_request_id: serviceRequest.id,
            company_id: companyId,
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
      }

      // Update order status to indicate it has been serviced
      if (data.order_id) {
        const { error: orderError } = await supabase
          .from("orders")
          .update({ 
            status: 'serviced',
            updated_at: new Date().toISOString()
          })
          .eq("id", data.order_id);

        if (orderError) {
          logger.error("Order update error:", orderError);
        }
      }

      return serviceRequest;
    },
    onSuccess: (data) => {
      toast.success('Servis talebi başarıyla oluşturuldu!', {
        description: `"${data.service_title}" servisi kaydedildi.`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      });
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setTimeout(() => {
        navigate('/service/management');
      }, 1500);
    },
    onError: (error: any) => {
      logger.error('Servis oluşturma hatası:', error);
      toast.error('Servis talebi oluşturulurken bir hata oluştu', {
        description: error.message || 'Bilinmeyen hata',
      });
    },
  });

  const handleCreateService = async () => {
    if (!formData.service_title.trim()) {
      toast.error('Servis başlığı zorunludur');
      return;
    }

    if (!formData.service_request_description.trim()) {
      toast.error('Servis açıklaması zorunludur');
      return;
    }

    if (!formData.customer_id) {
      toast.error('Müşteri bilgisi eksik');
      return;
    }

    createServiceMutation.mutate({
      ...formData,
      product_items: items,
    });
  };

  const handleSaveDraft = async () => {
    toast.info("Taslak kaydetme özelliği yakında eklenecek");
  };

  return (
    <div className="space-y-6">
      {/* Order Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Kaynak Sipariş Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Sipariş No</Label>
              <p className="font-medium">{order.order_number}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Müşteri</Label>
              <p className="font-medium">{order.customer?.company || order.customer?.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Sipariş Durumu</Label>
              <Badge variant="outline">{order.status}</Badge>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Sipariş Tarihi</Label>
              <p className="font-medium">
                {order.order_date ? new Date(order.order_date).toLocaleDateString('tr-TR') : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Tarih Bilgileri */}
      <ServiceDateInfoCard
        formData={formData}
        handleInputChange={handleInputChange}
      />

      {/* Müşteri ve Temel Bilgiler */}
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
          technicians={technicians}
        />
      </div>

      {/* Ürün/Hizmet Listesi */}
      <ProductServiceCard
        items={items}
        onAddItem={addProductItem}
        onRemoveItem={removeProductItem}
        onItemChange={handleProductItemChange}
        onProductModalSelect={handleProductModalSelect}
        showMoveButtons={false}
        inputHeight="h-10"
      />

      {/* Servis Açıklaması, Garanti, Dosyalar ve Notlar */}
      <ServiceAttachmentsNotesCard
        formData={{
          ...formData,
          notes: notesList
        }}
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
        onChange={setRecurrenceConfig}
      />

      <Separator className="my-6" />

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-8">
        <Button 
          variant="outline" 
          onClick={handleSaveDraft}
          disabled={createServiceMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          Taslak Kaydet
        </Button>
        <Button 
          onClick={handleCreateService}
          disabled={createServiceMutation.isPending}
        >
          <Send className="h-4 w-4 mr-2" />
          {createServiceMutation.isPending ? "Oluşturuluyor..." : "Servis Talebi Oluştur"}
        </Button>
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
    </div>
  );
};

export default OrderToServiceForm;

