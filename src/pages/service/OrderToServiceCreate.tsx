import React, { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderToServiceForm from "@/components/service/OrderToServiceForm";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Order } from "@/types/orders";

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
  const [activeTab, setActiveTab] = useState("service");
  
  // Get order ID from query parameters
  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get("orderId");
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

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
      } catch (e: any) {
        logger.error("Error fetching order:", e);
        setError(e.message || "Sipariş bilgileri yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  const handleBack = () => {
    if (orderId) {
      navigate(`/orders`);
    } else {
      navigate("/orders");
    }
  };

  const pageTitle = "Siparişten Servis Talebi Oluştur";
  const pageSubtitle = "Sipariş bilgileri otomatik olarak yüklenmiştir";

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
    <>
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
      </div>
      <Card className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="service">Servis Bilgileri</TabsTrigger>
            <TabsTrigger value="preview">Önizleme</TabsTrigger>
          </TabsList>
          <TabsContent value="service">
            <OrderToServiceForm orderId={orderId} order={order} />
          </TabsContent>
          <TabsContent value="preview">
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Önizleme özelliği yakında eklenecek
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </>
  );
};

export default OrderToServiceCreate;
