import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton, UnifiedDatePicker } from "@/components/ui/unified-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CustomerSelector from "@/components/proposals/form/CustomerSelector";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import OrderSelector from "@/components/deliveries/OrderSelector";
import { useDeliveries } from "@/hooks/useDeliveries";
import { CreateDeliveryData, CreateDeliveryItemData, DeliveryStatus, ShippingMethod } from "@/types/deliveries";
import { toast } from "sonner";
import { Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductSelector from "@/components/proposals/form/ProductSelector";

interface DeliveryFormProps {
  orderId?: string;
  salesInvoiceId?: string;
  onClose: () => void;
}

const DeliveryForm: React.FC<DeliveryFormProps> = ({ orderId, salesInvoiceId, onClose }) => {
  const navigate = useNavigate();
  const { createDelivery, isLoading } = useDeliveries();

  // Form state
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orderId || "");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(salesInvoiceId || "");
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [status, setStatus] = useState<DeliveryStatus>("pending");
  const [plannedDeliveryDate, setPlannedDeliveryDate] = useState<Date | undefined>(undefined);
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [deliveryContactName, setDeliveryContactName] = useState<string>("");
  const [deliveryContactPhone, setDeliveryContactPhone] = useState<string>("");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("kargo");
  const [carrierName, setCarrierName] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [items, setItems] = useState<CreateDeliveryItemData[]>([]);

  // Fetch order details if orderId is provided
  const { data: orderData } = useQuery({
    queryKey: ["order", selectedOrderId],
    queryFn: async () => {
      if (!selectedOrderId) return null;
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customers(*),
          items:order_items(*)
        `)
        .eq("id", selectedOrderId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedOrderId,
  });

  // When order is selected, populate form
  useEffect(() => {
    if (orderData) {
      if (orderData.customer_id) {
        setCustomerId(orderData.customer_id);
        setCustomerName(orderData.customer?.name || "");
        setCompanyName(orderData.customer?.company || orderData.customer?.name || "");
      }
      if (orderData.delivery_address) {
        setDeliveryAddress(orderData.delivery_address);
      }
      if (orderData.delivery_contact_name) {
        setDeliveryContactName(orderData.delivery_contact_name);
      }
      if (orderData.delivery_contact_phone) {
        setDeliveryContactPhone(orderData.delivery_contact_phone);
      }
      if (orderData.expected_delivery_date) {
        setPlannedDeliveryDate(new Date(orderData.expected_delivery_date));
      }
      
      // Populate items from order
      if (orderData.items && orderData.items.length > 0) {
        const deliveryItems: CreateDeliveryItemData[] = orderData.items.map((item: any) => ({
          order_item_id: item.id,
          product_id: item.product_id,
          product_name: item.name,
          quantity: Number(item.quantity),
          unit: item.unit || "adet",
        }));
        setItems(deliveryItems);
      }
    }
  }, [orderData]);

  const handleCustomerChange = (id: string, name: string, company: string) => {
    setCustomerId(id);
    setCustomerName(name);
    setCompanyName(company);
  };

  const handleOrderSelect = (orderId: string, order: any) => {
    setSelectedOrderId(orderId);
    // Order data will be populated via useEffect
  };

  const handleAddItem = () => {
    setItems([...items, {
      product_name: "",
      quantity: 1,
      unit: "adet",
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof CreateDeliveryItemData, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    setItems(updatedItems);
  };

  const handleProductSelect = (index: number, product: any) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      product_id: product.id,
      product_name: product.name,
      unit: product.unit || "adet",
    };
    setItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      toast.error("Lütfen müşteri seçin");
      return;
    }

    if (items.length === 0) {
      toast.error("Lütfen en az bir ürün ekleyin");
      return;
    }

    // Validate items
    const invalidItems = items.some(item => !item.product_name || item.quantity <= 0);
    if (invalidItems) {
      toast.error("Lütfen tüm ürün bilgilerini eksiksiz doldurun");
      return;
    }

    try {
      const deliveryData: CreateDeliveryData = {
        order_id: selectedOrderId || undefined,
        sales_invoice_id: selectedInvoiceId || undefined,
        customer_id: customerId,
        employee_id: employeeId || undefined,
        status,
        planned_delivery_date: plannedDeliveryDate 
          ? plannedDeliveryDate.toISOString().split("T")[0] 
          : undefined,
        delivery_address: deliveryAddress || undefined,
        delivery_contact_name: deliveryContactName || undefined,
        delivery_contact_phone: deliveryContactPhone || undefined,
        shipping_method: shippingMethod,
        carrier_name: carrierName || undefined,
        tracking_number: trackingNumber || undefined,
        notes: notes || undefined,
        items,
      };

      await createDelivery(deliveryData);
      toast.success("Teslimat başarıyla oluşturuldu");
      onClose();
      // Navigate sadece route değişikliği gerekiyorsa yapılır, onClose zaten handle ediyor
    } catch (error: any) {
      console.error("Error creating delivery:", error);
      toast.error(error.message || "Teslimat oluşturulurken hata oluştu");
    }
  };

  return (
    <UnifiedDialog
      isOpen={true}
      onClose={onClose}
      title="Yeni Teslimat"
      maxWidth="lg"
      headerColor="blue"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto scrollbar-hide pr-1 -mr-1">
          <div className="space-y-3">
            {/* Sipariş Seçimi */}
            <div className="space-y-1">
              <OrderSelector
                value={selectedOrderId}
                onChange={handleOrderSelect}
                label="Sipariş (Opsiyonel)"
                placeholder="Sipariş seçin..."
                showLabel={true}
              />
            </div>

            {/* Müşteri ve Görevli */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <CustomerSelector
                  value={customerId}
                  onChange={handleCustomerChange}
                  error=""
                />
              </div>
              <div className="space-y-1">
                <EmployeeSelector
                  value={employeeId}
                  onChange={setEmployeeId}
                  label="Görevli"
                  placeholder="Görevli seçin..."
                  showLabel={true}
                />
              </div>
            </div>

            {/* Planlanan Tarih ve Durum */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <UnifiedDatePicker
                  label="Planlanan Teslimat Tarihi"
                  date={plannedDeliveryDate}
                  onSelect={setPlannedDeliveryDate}
                  placeholder="Tarih seçin"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">Durum</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as DeliveryStatus)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">⏳ Bekleyen</SelectItem>
                    <SelectItem value="prepared">📦 Hazırlanan</SelectItem>
                    <SelectItem value="shipped">🚚 Kargoda</SelectItem>
                    <SelectItem value="delivered">✅ Teslim Edildi</SelectItem>
                    <SelectItem value="cancelled">❌ İptal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Teslimat Adresi */}
            <div className="space-y-1">
              <Label htmlFor="deliveryAddress" className="text-sm font-medium text-gray-700">
                Teslimat Adresi
              </Label>
              <Textarea
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Teslimat adresini girin"
                rows={2}
                className="resize-none h-8"
              />
            </div>

            {/* İletişim Bilgileri */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="deliveryContactName" className="text-sm font-medium text-gray-700">
                  Teslimat Kişisi
                </Label>
                <Input
                  id="deliveryContactName"
                  value={deliveryContactName}
                  onChange={(e) => setDeliveryContactName(e.target.value)}
                  placeholder="İsim soyisim"
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="deliveryContactPhone" className="text-sm font-medium text-gray-700">
                  İletişim Telefonu
                </Label>
                <Input
                  id="deliveryContactPhone"
                  value={deliveryContactPhone}
                  onChange={(e) => setDeliveryContactPhone(e.target.value)}
                  placeholder="Telefon numarası"
                  className="h-8"
                />
              </div>
            </div>

            {/* Sevkiyat Bilgileri */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">Sevkiyat Yöntemi</Label>
                <Select value={shippingMethod} onValueChange={(value) => setShippingMethod(value as ShippingMethod)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kargo">🚚 Kargo</SelectItem>
                    <SelectItem value="sirket_araci">🚗 Şirket Aracı</SelectItem>
                    <SelectItem value="musteri_alacak">👤 Müşteri Alacak</SelectItem>
                    <SelectItem value="diger">📦 Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="carrierName" className="text-sm font-medium text-gray-700">
                  Kargo Firması
                </Label>
                <Input
                  id="carrierName"
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  placeholder="Kargo firması adı"
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="trackingNumber" className="text-sm font-medium text-gray-700">
                  Takip No
                </Label>
                <Input
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Kargo takip numarası"
                  className="h-8"
                />
              </div>
            </div>

            {/* Teslimat Kalemleri */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Teslimat Kalemleri *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Ürün Ekle
                </Button>
              </div>
              
              {items.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500 border rounded-lg">
                  Henüz ürün eklenmedi
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="h-8">
                        <TableHead className="w-[40%] text-xs">Ürün Adı *</TableHead>
                        <TableHead className="w-[20%] text-xs">Miktar *</TableHead>
                        <TableHead className="w-[20%] text-xs">Birim</TableHead>
                        <TableHead className="w-[20%] text-xs">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index} className="h-8">
                          <TableCell className="p-1">
                            <ProductSelector
                              value={item.product_name || ""}
                              onChange={(name, product) => {
                                handleItemChange(index, "product_name", name);
                                if (product) {
                                  handleProductSelect(index, product);
                                }
                              }}
                              onProductSelect={(product) => handleProductSelect(index, product)}
                              placeholder="Ürün seçin..."
                              className="h-7 text-xs"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              type="number"
                              value={item.quantity || ""}
                              onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                              min="0.01"
                              step="0.01"
                              className="h-7 text-xs"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              value={item.unit || "adet"}
                              onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                              className="h-7 text-xs"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Notlar */}
            <div className="space-y-1">
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Notlar
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Teslimat notlarını girin"
                rows={2}
                className="resize-none h-8"
              />
            </div>
          </div>
        </div>

        <UnifiedDialogFooter>
          <UnifiedDialogCancelButton onClick={onClose}>
            İptal
          </UnifiedDialogCancelButton>
          <UnifiedDialogActionButton type="submit" disabled={isLoading}>
            {isLoading ? "Oluşturuluyor..." : "Oluştur"}
          </UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </form>
    </UnifiedDialog>
  );
};

export default DeliveryForm;
