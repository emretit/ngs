import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useCreatePurchaseOrderNew } from "@/hooks/usePurchaseOrdersNew";
import { supabase } from "@/integrations/supabase/client";
import type { PurchaseOrderFormData } from "@/types/purchaseOrders";

export default function NewPurchaseOrder() {
  const navigate = useNavigate();
  const createOrder = useCreatePurchaseOrderNew();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    supplier_id: "",
    order_date: new Date().toISOString().split('T')[0],
    priority: "normal",
    items: [
      {
        product_id: "",
        description: "",
        quantity: 1,
        unit_price: 0,
        tax_rate: 18,
        discount_rate: 0,
        uom: "Adet",
      },
    ],
  });

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from('customers')
      .select('id, name')
      .eq('type', 'supplier')
      .order('name');
    if (data) setSuppliers(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, sku, price, tax_rate, unit, currency')
      .eq('is_active', true)
      .order('name');
    if (data) setProducts(data);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          product_id: "",
          description: "",
          quantity: 1,
          unit_price: 0,
          tax_rate: 18,
          discount_rate: 0,
          uom: "Adet",
        },
      ],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const items = [...formData.items];
    items[index] = { ...items[index], [field]: value };
    
    // Auto-fill product details when product is selected
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        items[index] = {
          ...items[index],
          description: product.name,
          unit_price: product.price || 0,
          tax_rate: product.tax_rate || 18,
          uom: product.unit || 'Adet',
        };
      }
    }
    
    setFormData({ ...formData, items });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrder.mutateAsync(formData);
      navigate("/purchasing/orders");
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Yeni Satın Alma Siparişi</h1>
        <p className="text-muted-foreground">Tedarikçiye sipariş oluşturun</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Tedarikçi *</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tedarikçi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Öncelik</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Düşük</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Yüksek</SelectItem>
                  <SelectItem value="urgent">Acil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_date">Sipariş Tarihi *</Label>
              <Input
                id="order_date"
                type="date"
                value={formData.order_date}
                onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_delivery_date">Teslim Tarihi</Label>
              <Input
                id="expected_delivery_date"
                type="date"
                value={formData.expected_delivery_date || ''}
                onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_address">Teslimat Adresi</Label>
            <Textarea
              id="delivery_address"
              value={formData.delivery_address || ''}
              onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Ürünler</h3>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Ürün Ekle
            </Button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Ürün {index + 1}</span>
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-6 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label>Ürün</Label>
                    <Select
                      value={item.product_id || ""}
                      onValueChange={(value) => updateItem(index, 'product_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ürün seçin (opsiyonel)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Manuel Giriş</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} {product.sku && `(${product.sku})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Açıklama *</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Ürün açıklaması"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Miktar *</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                      required
                      min="0.001"
                      step="0.001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Birim Fiyat *</Label>
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>KDV %</Label>
                    <Input
                      type="number"
                      value={item.tax_rate}
                      onChange={(e) => updateItem(index, 'tax_rate', parseFloat(e.target.value))}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/purchasing/orders")}>
            İptal
          </Button>
          <Button type="submit" disabled={createOrder.isPending}>
            {createOrder.isPending ? "Oluşturuluyor..." : "Sipariş Oluştur"}
          </Button>
        </div>
      </form>
    </div>
  );
}
