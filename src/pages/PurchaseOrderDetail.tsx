import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Save, Send, Printer, Download, Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatMoney } from "@/components/purchase/constants";
import { useToast } from "@/components/ui/use-toast";
import { PurchaseOrderStatus } from "@/types/purchase";
import PurchaseOrderInfo from "@/components/purchase/orders/PurchaseOrderInfo";
import PurchaseOrderItems from "@/components/purchase/orders/PurchaseOrderItems";
import PurchaseInvoicesList from "@/components/purchase/invoices/PurchaseInvoicesList";
import PurchaseInvoiceForm from "@/components/purchase/invoices/PurchaseInvoiceForm";
import { OrderStatusBadge } from "@/components/purchase/OrderStatusBadge";
interface PurchaseOrderDetailProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}
const PurchaseOrderDetail = ({ isCollapsed, setIsCollapsed }: PurchaseOrderDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("order-details");
  const [isEditing, setIsEditing] = useState(false);
  const { getOrderWithItems, updateStatusMutation, receiveItemsMutation } = usePurchaseOrders();
  const { data: order, isLoading, error } = getOrderWithItems(id || "");
  useEffect(() => {
    if (error) {
      toast({
        title: "Hata",
        description: "Sipariş bilgileri yüklenemedi",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  const handleBack = () => {
    navigate("/orders/purchase");
  };
  const handleStatusChange = (status: PurchaseOrderStatus) => {
    if (id) {
      updateStatusMutation.mutate({
        id,
        status,
      });
    }
  };
  const handleItemsReceived = (items: { id: string, received_quantity: number }[]) => {
    if (id) {
      receiveItemsMutation.mutate({
        orderId: id,
        items,
      });
    }
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!order) {
    return (
      <>
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
        </div>
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Sipariş Bulunamadı</h2>
          <p className="text-muted-foreground mb-4">
            Belirtilen ID ile bir sipariş bulunamadı. Lütfen satın alma siparişleri sayfasına dönün.
          </p>
          <Button onClick={handleBack}>Siparişlere Dön</Button>
        </Card>
      </>
    );
  }
  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Siparişlere Dön
        </Button>
        <div className="flex items-center gap-3">
          <Badge className="px-3 py-1 text-sm">
            <OrderStatusBadge status={order.status} />
          </Badge>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Yazdır
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              PDF Yazdır
            </Button>
          </div>
        </div>
      </div>
      <Card className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="order-details" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Sipariş Detayı
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center">
              <Receipt className="h-4 w-4 mr-2" />
              Faturalar
            </TabsTrigger>
          </TabsList>
          <TabsContent value="order-details" className="space-y-6">
            <PurchaseOrderInfo
              order={order}
              onStatusChange={handleStatusChange}
            />
            <Separator />
            <PurchaseOrderItems
              items={order.items || []}
              currency={order.currency || "TRY"}
              orderStatus={order.status}
              onItemsReceived={handleItemsReceived}
            />
            <div className="mt-6 flex justify-end">
              {order.status === 'draft' && (
                <Button onClick={() => handleStatusChange('sent')}>
                  <Send className="h-4 w-4 mr-2" />
                  Tedarikçiye Gönder
                </Button>
              )}
            </div>
          </TabsContent>
          <TabsContent value="invoices">
            <div className="space-y-6">
              <PurchaseInvoicesList poId={id || ""} />
              <Separator />
              <PurchaseInvoiceForm poId={id || ""} supplierId={order.supplier_id} />
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </>
  );
};
export default PurchaseOrderDetail;
