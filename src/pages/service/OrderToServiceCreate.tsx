import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";
import { Settings, Save, Loader2, AlertCircle, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Order } from "@/types/orders";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ProductServiceCard from "@/components/proposals/cards/ProductServiceCard";

// Constants
const DEFAULT_VAT_PERCENTAGE = 20;
const DEFAULT_CURRENCY = "TRY";
const DEFAULT_QUANTITY = 1;
const DEFAULT_UNIT = "adet";

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
  service_status: 'new' | 'in_progress' | 'completed' | 'cancelled';
  assigned_technician?: string;
  service_due_date?: Date;
  service_location?: string;
  service_type?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  supplier_id?: string;
  received_by?: string;
  created_by?: string;
  service_start_date?: Date;
  service_end_date?: Date;
  notes?: string;
  order_id?: string;
  order_number?: string;
  product_items: LineItem[];
}

const OrderToServiceCreate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm();
  
  // Get order ID from query parameters
  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get("orderId");
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);
  
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
  });

  // Line items state
  const [items, setItems] = useState<LineItem[]>([]);

  // Load order data
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) {
        setError("Sipariş ID'si bulunamadı. Lütfen sipariş sayfasından servise çevirin.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch order with customer data and items
        const { data: orderData, error: fetchError } = await supabase
          .from("orders")
          .select(`
            *,
            customer:customers(id, name, company, email, mobile_phone, office_phone, address),
            order_items(*)
          `)
          .eq("id", orderId)
          .single();

        if (fetchError) {
          throw new Error("Sipariş bilgileri yüklenemedi: " + fetchError.message);
        }

        if (!orderData) {
          throw new Error("Sipariş bulunamadı");
        }

        setOrder(orderData);

        // Parse items from order_items
        const orderItems = orderData.order_items || [];
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
          currency: item.currency || orderData.currency || DEFAULT_CURRENCY,
          product_id: item.product_id,
          image_url: item.image_url,
        }));

        setItems(lineItems);

        // Pre-populate service request data from order
        const customer = orderData.customer;
        setFormData({
          service_title: orderData.subject || orderData.title || `${orderData.order_number} Servis Talebi`,
          service_request_description: orderData.description || orderData.notes || "",
          customer_id: orderData.customer_id || "",
          service_priority: 'medium',
          service_status: 'new',
          service_location: orderData.delivery_address || customer?.address || "",
          contact_person: orderData.delivery_contact_name || customer?.name || "",
          contact_phone: orderData.delivery_contact_phone || customer?.mobile_phone || customer?.office_phone || "",
          contact_email: customer?.email || "",
          order_id: orderData.id,
          order_number: orderData.order_number,
          product_items: lineItems,
          notes: orderData.notes || "",
        });

        toast.success("Sipariş bilgileri yüklendi");
      } catch (e: any) {
        console.error("Error fetching order:", e);
        setError(e.message || "Sipariş bilgileri yüklenirken bir hata oluştu");
        toast.error(e.message || "Sipariş bilgileri yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceRequestFormData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Kullanıcı bulunamadı");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) {
        throw new Error("Şirket bilgisi bulunamadı");
      }

      // Generate service number
      const serviceNumber = `SRV-${Date.now().toString().slice(-8)}`;

      // Create service request
      const serviceRequestData = {
        service_title: data.service_title,
        service_request_description: data.service_request_description,
        customer_id: data.customer_id,
        service_priority: data.service_priority,
        service_status: data.service_status,
        assigned_technician: data.assigned_technician,
        service_due_date: data.service_due_date?.toISOString(),
        service_location: data.service_location,
        service_type: data.service_type,
        contact_person: data.contact_person,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email,
        supplier_id: data.supplier_id,
        received_by: data.received_by,
        created_by: user.id,
        service_start_date: data.service_start_date?.toISOString(),
        service_end_date: data.service_end_date?.toISOString(),
        service_number: serviceNumber,
        company_id: profile.company_id,
        order_id: data.order_id,
        order_number: data.order_number,
        notes: data.notes ? [data.notes] : [],
      };

      const { data: serviceRequest, error: serviceError } = await supabase
        .from("service_requests")
        .insert(serviceRequestData)
        .select()
        .single();

      if (serviceError) {
        console.error("Service creation error:", serviceError);
        throw new Error(serviceError.message || "Servis talebi oluşturulamadı");
      }

      // Create service items if there are any
      if (data.product_items && data.product_items.length > 0) {
        const serviceItems = data.product_items.map((item, index) => ({
          service_request_id: serviceRequest.id,
          item_name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          discount_rate: item.discount_rate,
          total_price: item.total_price,
          currency: item.currency,
          product_id: item.product_id,
          row_number: index + 1,
          company_id: profile.company_id,
        }));

        const { error: itemsError } = await supabase
          .from("service_items")
          .insert(serviceItems);

        if (itemsError) {
          console.error("Service items creation error:", itemsError);
          throw new Error("Servis kalemleri oluşturulamadı");
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
          console.error("Order update error:", orderError);
          // Don't throw error here, service is already created
        }
      }

      return serviceRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Servis talebi başarıyla oluşturuldu!");
      setTimeout(() => {
        navigate("/service/management");
      }, 1500);
    },
    onError: (error: any) => {
      console.error("Service creation error:", error);
      toast.error("Servis talebi oluşturulurken bir hata oluştu", {
        description: error.message || "Bilinmeyen hata",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.service_title) {
      toast.error("Lütfen servis başlığını giriniz");
      return;
    }

    if (!formData.customer_id) {
      toast.error("Müşteri bilgisi eksik");
      return;
    }

    setSaving(true);
    try {
      await createServiceMutation.mutateAsync({
        ...formData,
        product_items: items,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: keyof ServiceRequestFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Sipariş bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{error || "Sipariş bulunamadı"}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate("/orders")} variant="outline">
            Siparişlere Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Settings className="h-8 w-8 text-primary" />
                Siparişten Servis Talebi Oluştur
              </h1>
              <p className="text-muted-foreground mt-1">
                Sipariş bilgileri otomatik olarak yüklenmiştir
              </p>
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            size="lg"
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Servis Talebi Oluştur
              </>
            )}
          </Button>
        </div>

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

        {/* Service Request Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Servis Talebi Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service_title">Servis Başlığı *</Label>
                  <Input
                    id="service_title"
                    value={formData.service_title}
                    onChange={(e) => handleFieldChange('service_title', e.target.value)}
                    placeholder="Servis başlığı giriniz"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_priority">Öncelik</Label>
                  <Select
                    value={formData.service_priority}
                    onValueChange={(value) => handleFieldChange('service_priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Düşük</SelectItem>
                      <SelectItem value="medium">Orta</SelectItem>
                      <SelectItem value="high">Yüksek</SelectItem>
                      <SelectItem value="urgent">Acil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_status">Durum</Label>
                  <Select
                    value={formData.service_status}
                    onValueChange={(value) => handleFieldChange('service_status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Yeni</SelectItem>
                      <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                      <SelectItem value="completed">Tamamlandı</SelectItem>
                      <SelectItem value="cancelled">İptal Edildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_location">Servis Yeri</Label>
                  <Input
                    id="service_location"
                    value={formData.service_location || ''}
                    onChange={(e) => handleFieldChange('service_location', e.target.value)}
                    placeholder="Servis yeri"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_person">İletişim Kişisi</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person || ''}
                    onChange={(e) => handleFieldChange('contact_person', e.target.value)}
                    placeholder="İletişim kişisi"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">İletişim Telefonu</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone || ''}
                    onChange={(e) => handleFieldChange('contact_phone', e.target.value)}
                    placeholder="Telefon numarası"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_request_description">Açıklama</Label>
                <Textarea
                  id="service_request_description"
                  value={formData.service_request_description}
                  onChange={(e) => handleFieldChange('service_request_description', e.target.value)}
                  placeholder="Servis talebi açıklaması"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Products/Services */}
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Servis Kalemleri</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductServiceCard
                  items={items}
                  setItems={setItems}
                  onAddItem={() => {}}
                  onEditItem={() => {}}
                  onDeleteItem={(id) => {
                    setItems(prev => prev.filter(item => item.id !== id));
                  }}
                  currency={order.currency || DEFAULT_CURRENCY}
                  readOnly={true}
                />
              </CardContent>
            </Card>
          )}

          {/* Submit Button - Mobile */}
          <div className="md:hidden">
            <Button
              type="submit"
              disabled={saving}
              size="lg"
              className="w-full gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Servis Talebi Oluştur
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
};

export default OrderToServiceCreate;

