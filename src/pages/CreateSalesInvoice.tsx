import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ArrowLeft, Plus, Trash2, Save, FileText } from "lucide-react";
import { toast } from "sonner";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { useEInvoice } from "@/hooks/useEInvoice";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface InvoiceItem {
  id: string;
  urun_adi: string;
  aciklama: string;
  miktar: number;
  birim: string;
  birim_fiyat: number;
  kdv_orani: number;
  indirim_orani: number;
  satir_toplami: number;
  kdv_tutari: number;
}

interface CreateSalesInvoiceProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const CreateSalesInvoice = ({ isCollapsed, setIsCollapsed }: CreateSalesInvoiceProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { customers: customerOptions, isLoading: isLoadingCustomers } = useCustomerSelect();
  const { sendInvoice, isSending } = useEInvoice();
  const orderId = searchParams.get("orderId");

  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(null);
  const [assignedInvoiceNumber, setAssignedInvoiceNumber] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    customer_id: "",
    fatura_no: "", // Boş bırakılacak, E-fatura gönderilirken otomatik atanacak
    fatura_tarihi: new Date(),
    vade_tarihi: null as Date | null,
    aciklama: "",
    notlar: "",
    para_birimi: "TRY",
    odeme_sekli: "",
    banka_bilgileri: "",
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "1",
      urun_adi: "",
      aciklama: "",
      miktar: 1,
      birim: "adet",
      birim_fiyat: 0,
      kdv_orani: 18,
      indirim_orani: 0,
      satir_toplami: 0,
      kdv_tutari: 0,
    }
  ]);

  // Load order data if orderId is provided
  useEffect(() => {
    if (orderId) {
      loadOrderData(orderId);
    }
  }, [orderId]);

  const loadOrderData = async (id: string) => {
    try {
      setLoading(true);
      const { data: order, error } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customers(*),
          items:order_items(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      if (order) {
        setOrderData(order);
        setFormData(prev => ({
          ...prev,
          customer_id: order.customer_id,
          aciklama: `Sipariş No: ${order.order_number} - ${order.title}`,
          para_birimi: order.currency || "TRY",
        }));

        // Convert order items to invoice items
        if (order.items && order.items.length > 0) {
          const invoiceItems = order.items.map((item: any, index: number) => ({
            id: (index + 1).toString(),
            urun_adi: item.name,
            aciklama: item.description || "",
            miktar: parseFloat(item.quantity),
            birim: item.unit || "adet",
            birim_fiyat: parseFloat(item.unit_price),
            kdv_orani: parseFloat(item.tax_rate) || 18,
            indirim_orani: parseFloat(item.discount_rate) || 0,
            satir_toplami: parseFloat(item.total_price),
            kdv_tutari: (parseFloat(item.total_price) * (parseFloat(item.tax_rate) || 18)) / 100,
          }));
          setItems(invoiceItems);
        }
      }
    } catch (error) {
      console.error("Error loading order:", error);
      toast.error("Sipariş verileri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const calculateItemTotals = (item: InvoiceItem) => {
    const subtotal = item.miktar * item.birim_fiyat;
    const discountAmount = (subtotal * item.indirim_orani) / 100;
    const discountedSubtotal = subtotal - discountAmount;
    const taxAmount = (discountedSubtotal * item.kdv_orani) / 100;
    
    return {
      ...item,
      satir_toplami: discountedSubtotal,
      kdv_tutari: taxAmount,
    };
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate totals
    updatedItems[index] = calculateItemTotals(updatedItems[index]);
    
    setItems(updatedItems);
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: (items.length + 1).toString(),
      urun_adi: "",
      aciklama: "",
      miktar: 1,
      birim: "adet",
      birim_fiyat: 0,
      kdv_orani: 18,
      indirim_orani: 0,
      satir_toplami: 0,
      kdv_tutari: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const ara_toplam = items.reduce((sum, item) => sum + item.satir_toplami, 0);
    const kdv_tutari = items.reduce((sum, item) => sum + item.kdv_tutari, 0);
    const toplam_tutar = ara_toplam + kdv_tutari;

    return { ara_toplam, kdv_tutari, toplam_tutar };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form submit başladı", { formData, items });
    
    if (!formData.customer_id) {
      console.log("Müşteri seçilmedi");
      toast.error("Lütfen müşteri seçiniz");
      return;
    }

    if (items.length === 0) {
      console.log("Fatura kalemi yok");
      toast.error("En az bir fatura kalemi ekleyiniz");
      return;
    }

    if (items.every(item => !item.urun_adi.trim())) {
      console.log("Fatura kalemlerinde ürün adı yok");
      toast.error("Tüm fatura kalemlerinde ürün/hizmet adı giriniz");
      return;
    }

    // Check for empty required fields in items
    const emptyItems = items.filter(item => !item.urun_adi.trim() || item.miktar <= 0 || item.birim_fiyat <= 0);
    if (emptyItems.length > 0) {
      console.log("Eksik bilgili kalemler var:", emptyItems);
      toast.error("Tüm kalemlerde ürün adı, miktar ve birim fiyat giriniz");
      return;
    }

    try {
      setLoading(true);
      console.log("Loading state true yapıldı");
      
      const totals = calculateTotals();
      console.log("Totals hesaplandı:", totals);

      // Get current user and company ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log("User data:", user, "User error:", userError);
      
      if (userError) throw userError;
      if (!user) throw new Error("Kullanıcı giriş yapmamış");

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      console.log("Profile data:", profile, "Profile error:", profileError);
      
      if (profileError) throw profileError;

      const invoiceData = {
        order_id: orderId || null,
        customer_id: formData.customer_id,
        fatura_no: null, // NULL olarak kaydedilecek, E-fatura gönderilirken otomatik atanacak
        fatura_tarihi: format(formData.fatura_tarihi, "yyyy-MM-dd"),
        vade_tarihi: formData.vade_tarihi ? format(formData.vade_tarihi, "yyyy-MM-dd") : null,
        aciklama: formData.aciklama,
        notlar: formData.notlar,
        para_birimi: formData.para_birimi,
        ara_toplam: totals.ara_toplam,
        kdv_tutari: totals.kdv_tutari,
        toplam_tutar: totals.toplam_tutar,
        odeme_sekli: formData.odeme_sekli,
        banka_bilgileri: formData.banka_bilgileri,
        durum: "taslak",
        odeme_durumu: "odenmedi",
        company_id: profile?.company_id,
      };

      console.log("Invoice data hazırlandı:", invoiceData);

      // Create sales invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("sales_invoices")
        .insert(invoiceData)
        .select()
        .single();

      console.log("Invoice insert sonucu:", { invoice, invoiceError });

      if (invoiceError) {
        console.error("Invoice insert hatası:", invoiceError);
        throw invoiceError;
      }

      if (!invoice) {
        throw new Error("Fatura oluşturulamadı");
      }

      // Create invoice items
      const invoiceItems = items.map(item => ({
        sales_invoice_id: invoice.id,
        urun_adi: item.urun_adi,
        aciklama: item.aciklama,
        miktar: item.miktar,
        birim: item.birim,
        birim_fiyat: item.birim_fiyat,
        kdv_orani: item.kdv_orani,
        indirim_orani: item.indirim_orani,
        satir_toplami: item.satir_toplami,
        kdv_tutari: item.kdv_tutari,
        para_birimi: formData.para_birimi,
        company_id: profile?.company_id,
      }));

      console.log("Invoice items hazırlandı:", invoiceItems);

      const { error: itemsError } = await supabase
        .from("sales_invoice_items")
        .insert(invoiceItems);

      console.log("Invoice items insert sonucu:", { itemsError });

      if (itemsError) {
        console.error("Invoice items insert hatası:", itemsError);
        throw itemsError;
      }

      // Save invoice ID for e-invoice operations
      setSavedInvoiceId(invoice.id);
      console.log("Saved invoice ID:", invoice.id);

      toast.success("Fatura başarıyla oluşturuldu. E-fatura göndermek için aşağıdaki butonları kullanabilirsiniz.");

      console.log("Fatura başarıyla oluşturuldu");
      // Don't navigate immediately to allow e-invoice operations
      // navigate("/sales-invoices");
    } catch (error) {
      console.error("Error creating invoice:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      toast.error(`Fatura oluşturulurken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    } finally {
      setLoading(false);
      console.log("Loading state false yapıldı");
    }
  };

  const totals = calculateTotals();

  // E-fatura işlevleri
  const handleSendEInvoice = () => {
    if (!savedInvoiceId) {
      toast.error("Önce faturayı kaydedin");
      return;
    }

    // Check if already sending
    if (isSending) {
      toast.info("E-fatura zaten gönderiliyor, lütfen bekleyin");
      return;
    }

    sendInvoice(savedInvoiceId);
    
    // E-fatura gönderildikten sonra fatura numarasını kontrol et
    setTimeout(async () => {
      const { data: updatedInvoice } = await supabase
        .from('sales_invoices')
        .select('fatura_no')
        .eq('id', savedInvoiceId)
        .single();
      
      if (updatedInvoice?.fatura_no) {
        setAssignedInvoiceNumber(updatedInvoice.fatura_no);
      }
    }, 3000); // 3 saniye bekle
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="sm" onClick={() => navigate("/sales-invoices")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                Yeni Satış Faturası
              </h1>
              <p className="text-gray-600">
                {orderId ? `Sipariş ${orderData?.order_number} için fatura oluşturun` : "Yeni satış faturası oluşturun"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Fatura Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="customer">Müşteri *</Label>
                    <Select
                      value={formData.customer_id}
                      onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Müşteri seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingCustomers ? (
                          <SelectItem value="loading" disabled>
                            Müşteriler yükleniyor...
                          </SelectItem>
                        ) : customerOptions?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} {customer.company && `- ${customer.company}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="fatura_no">Fatura Numarası</Label>
                    <Input
                      id="fatura_no"
                      value={assignedInvoiceNumber || "Henüz atanmadı"}
                      placeholder="E-fatura gönderilirken otomatik atanacak"
                      disabled
                      className={`bg-gray-50 ${assignedInvoiceNumber ? 'text-green-600 font-medium' : 'text-gray-500'}`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {assignedInvoiceNumber 
                        ? `Fatura numarası: ${assignedInvoiceNumber}` 
                        : "E-fatura gönderilirken Nilvera tarafından otomatik atanacak"
                      }
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="fatura_tarihi">Fatura Tarihi *</Label>
                    <DatePicker
                      date={formData.fatura_tarihi}
                      onSelect={(date) => date && setFormData({ ...formData, fatura_tarihi: date })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="vade_tarihi">Vade Tarihi</Label>
                    <DatePicker
                      date={formData.vade_tarihi}
                      onSelect={(date) => setFormData({ ...formData, vade_tarihi: date })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="para_birimi">Para Birimi</Label>
                    <Select
                      value={formData.para_birimi}
                      onValueChange={(value) => setFormData({ ...formData, para_birimi: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">TRY</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="odeme_sekli">Ödeme Şekli</Label>
                    <Input
                      id="odeme_sekli"
                      value={formData.odeme_sekli}
                      onChange={(e) => setFormData({ ...formData, odeme_sekli: e.target.value })}
                      placeholder="Nakit, Kredi Kartı, Havale..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="aciklama">Açıklama</Label>
                    <Textarea
                      id="aciklama"
                      value={formData.aciklama}
                      onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                      placeholder="Fatura açıklaması..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="notlar">Notlar</Label>
                    <Textarea
                      id="notlar"
                      value={formData.notlar}
                      onChange={(e) => setFormData({ ...formData, notlar: e.target.value })}
                      placeholder="Ek notlar..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="banka_bilgileri">Banka Bilgileri</Label>
                  <Textarea
                    id="banka_bilgileri"
                    value={formData.banka_bilgileri}
                    onChange={(e) => setFormData({ ...formData, banka_bilgileri: e.target.value })}
                    placeholder="Banka adı, IBAN, hesap bilgileri..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Fatura Kalemleri</CardTitle>
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Kalem Ekle
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Ürün/Hizmet</th>
                        <th className="text-left p-2">Açıklama</th>
                        <th className="text-left p-2">Miktar</th>
                        <th className="text-left p-2">Birim</th>
                        <th className="text-left p-2">Birim Fiyat</th>
                        <th className="text-left p-2">İndirim %</th>
                        <th className="text-left p-2">KDV %</th>
                        <th className="text-left p-2">Tutar</th>
                        <th className="text-left p-2">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-2">
                            <Input
                              value={item.urun_adi}
                              onChange={(e) => updateItem(index, "urun_adi", e.target.value)}
                              placeholder="Ürün/Hizmet adı"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={item.aciklama}
                              onChange={(e) => updateItem(index, "aciklama", e.target.value)}
                              placeholder="Açıklama"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              step="0.001"
                              value={item.miktar}
                              onChange={(e) => updateItem(index, "miktar", parseFloat(e.target.value) || 0)}
                              className="w-20"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={item.birim}
                              onChange={(e) => updateItem(index, "birim", e.target.value)}
                              className="w-16"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.birim_fiyat}
                              onChange={(e) => updateItem(index, "birim_fiyat", parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.indirim_orani}
                              onChange={(e) => updateItem(index, "indirim_orani", parseFloat(e.target.value) || 0)}
                              className="w-20"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.kdv_orani}
                              onChange={(e) => updateItem(index, "kdv_orani", parseFloat(e.target.value) || 0)}
                              className="w-20"
                            />
                          </td>
                          <td className="p-2 text-right">
                            {new Intl.NumberFormat('tr-TR', {
                              style: 'currency',
                              currency: formData.para_birimi
                            }).format(item.satir_toplami + item.kdv_tutari)}
                          </td>
                          <td className="p-2">
                            {items.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="mt-6 flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span>Ara Toplam:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: formData.para_birimi
                        }).format(totals.ara_toplam)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>KDV:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: formData.para_birimi
                        }).format(totals.kdv_tutari)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 text-lg font-bold">
                      <span>Toplam:</span>
                      <span>
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: formData.para_birimi
                        }).format(totals.toplam_tutar)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate("/sales-invoices")}>
                İptal
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Kaydediliyor..." : "Faturayı Kaydet"}
              </Button>
            </div>

            {/* E-Invoice Actions */}
            {savedInvoiceId && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">E-Fatura İşlemleri</h3>
                               <p className="text-gray-600 mb-4">
               Faturanız başarıyla kaydedildi. E-fatura olarak göndermek için aşağıdaki butona tıklayın.
             </p>
                  <div className="flex gap-4">
                                   <Button 
                 onClick={handleSendEInvoice}
                 disabled={isSending || !savedInvoiceId}
                 className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
               >
                 <FileText className="h-4 w-4 mr-2" />
                 {isSending ? "Gönderiliyor..." : "E-Fatura Gönder"}
               </Button>
                    
                    <Button 
                      onClick={() => navigate("/sales-invoices")}
                      variant="outline"
                    >
                      Faturalar Sayfasına Git
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </div>
  );
};

export default CreateSalesInvoice;
