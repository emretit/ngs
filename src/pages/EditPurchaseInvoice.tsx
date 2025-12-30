import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Save,
  X,
  Calendar,
  Building2,
  Package,
  Loader2,
  AlertCircle,
  AlertTriangle
} from "lucide-react";
import { usePurchaseInvoices } from "@/hooks/usePurchaseInvoices";
import { usePurchaseInvoiceEdit } from "@/hooks/usePurchaseInvoiceEdit";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";
import PurchaseInvoiceLineItems from "@/components/purchase-invoices/PurchaseInvoiceLineItems";
import { ModernCategorySelect } from "@/components/budget/ModernCategorySelect";

interface InvoiceItem {
  id: string;
  product_id: string | null;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  line_total: number;
  product?: {
    id: string;
    name: string;
    sku: string | null;
  };
}

interface FormData {
  category_id: string;
  notes: string;
}

const EditPurchaseInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { fetchInvoiceById } = usePurchaseInvoices();
  const { updatePurchaseInvoice, saving: hookSaving } = usePurchaseInvoiceEdit();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [originalInvoice, setOriginalInvoice] = useState<any>(null);
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([]);
  const [originalLineItems, setOriginalLineItems] = useState<InvoiceItem[]>([]);
  const [formData, setFormData] = useState<FormData>({
    category_id: "",
    notes: "",
  });

  // Dirty state tracking
  const isDirty = useMemo(() => {
    if (!originalInvoice) return false;

    // Check if form data changed
    if (formData.category_id !== (originalInvoice.category_id || "")) return true;
    if (formData.notes !== (originalInvoice.notes || "")) return true;

    // Check if line items changed
    if (lineItems.length !== originalLineItems.length) return true;

    for (let i = 0; i < lineItems.length; i++) {
      const current = lineItems[i];
      const original = originalLineItems.find(item => item.id === current.id);

      if (!original) return true; // New item

      if (current.product_id !== original.product_id) return true;
      if (current.quantity !== original.quantity) return true;
      if (current.unit_price !== original.unit_price) return true;
      if (current.tax_rate !== original.tax_rate) return true;
      if (current.discount_rate !== original.discount_rate) return true;
    }

    return false;
  }, [formData, lineItems, originalInvoice, originalLineItems]);

  // Calculate financial totals
  const financials = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => {
      const itemSubtotal = item.unit_price * item.quantity;
      const discountAmount = itemSubtotal * (item.discount_rate / 100);
      return sum + (itemSubtotal - discountAmount);
    }, 0);

    const taxTotal = lineItems.reduce((sum, item) => {
      const itemSubtotal = item.unit_price * item.quantity;
      const discountAmount = itemSubtotal * (item.discount_rate / 100);
      const afterDiscount = itemSubtotal - discountAmount;
      return sum + (afterDiscount * (item.tax_rate / 100));
    }, 0);

    const total = subtotal + taxTotal;

    return { subtotal, taxTotal, total };
  }, [lineItems]);

  // Load invoice data
  useEffect(() => {
    if (id) {
      loadInvoiceData();
    }
  }, [id]);

  const loadInvoiceData = async () => {
    try {
      setLoading(true);

      // Load invoice
      const invoiceData = await fetchInvoiceById(id!);

      // Load supplier
      if (invoiceData.supplier_id) {
        const { data: supplier } = await supabase
          .from("suppliers")
          .select("id, name, company, tax_number")
          .eq("id", invoiceData.supplier_id)
          .single();
        (invoiceData as any).supplier = supplier;
      }

      setInvoice(invoiceData);
      setOriginalInvoice(invoiceData);

      // Load invoice items
      const { data: items, error: itemsError } = await supabase
        .from("purchase_invoice_items")
        .select(`
          *,
          product:products (
            id,
            name,
            sku
          )
        `)
        .eq("purchase_invoice_id", id)
        .order("created_at", { ascending: true });

      if (itemsError) {
        console.error("Error loading invoice items:", itemsError);
        toast.error("Fatura kalemleri yüklenemedi");
      } else {
        setLineItems(items || []);
        setOriginalLineItems(JSON.parse(JSON.stringify(items || []))); // Deep copy
      }

      // Initialize form data
      setFormData({
        category_id: invoiceData.category_id || "",
        notes: invoiceData.notes || "",
      });

    } catch (error) {
      console.error("Error loading invoice:", error);
      toast.error("Fatura yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (lineItems.length === 0) {
      toast.error("En az bir ürün kalemi olmalı");
      return;
    }

    for (const item of lineItems) {
      if (!item.product_id) {
        toast.error("Tüm ürünlerin geçerli bir ürün seçimi olmalı");
        return;
      }
      if (item.quantity <= 0) {
        toast.error("Ürün miktarları 0'dan büyük olmalı");
        return;
      }
    }

    if (financials.total <= 0) {
      toast.error("Toplam tutar 0'dan büyük olmalı");
      return;
    }

    try {
      setSaving(true);

      await updatePurchaseInvoice({
        invoiceId: id!,
        category_id: formData.category_id,
        notes: formData.notes,
        lineItems,
        originalLineItems,
        subtotal: financials.subtotal,
        taxTotal: financials.taxTotal,
        total: financials.total,
        originalTotal: originalInvoice?.total_amount || 0,
        currency
      });

      navigate(`/purchase-invoices/${id}`);

    } catch (error: any) {
      console.error("Error saving invoice:", error);
      // Error handling is done in the hook
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm("Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?")) {
        navigate(`/purchase-invoices/${id}`);
      }
    } else {
      navigate(`/purchase-invoices/${id}`);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    const currencyCode = currency === 'TL' ? 'TRY' : currency;
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">Beklemede</Badge>;
      case 'paid':
        return <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">Ödendi</Badge>;
      case 'partially_paid':
        return <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">Kısmi Ödendi</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">Gecikmiş</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Fatura yükleniyor...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Fatura Bulunamadı</h3>
              <p className="text-gray-600 mb-4">Aradığınız fatura mevcut değil veya silinmiş olabilir.</p>
              <Button onClick={() => navigate('/purchase-invoices')} variant="outline">
                Faturalara Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currency = invoice.currency || 'TRY';
  const totalAmount = invoice.total_amount || 0;
  const originalTotal = originalInvoice?.total_amount || 0;
  const totalDelta = financials.total - originalTotal;

  return (
    <div className="space-y-2">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-2">
        <div className="flex items-center justify-between p-3 pl-12">
          <div className="flex items-center gap-3">
            <BackButton
              onClick={handleCancel}
              variant="ghost"
              size="sm"
            >
              Fatura Detayı
            </BackButton>

            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Alış Faturası Düzenle
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  {invoice.invoice_number || 'Henüz atanmadı'}
                  {isDirty && <span className="text-orange-600 ml-2">• Kaydedilmemiş değişiklikler</span>}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Vazgeç
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || hookSaving || !isDirty}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {(saving || hookSaving) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Kaydet
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Warning if total changed significantly */}
      {Math.abs(totalDelta) > originalTotal * 0.2 && isDirty && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900">Önemli Tutar Değişikliği</AlertTitle>
          <AlertDescription className="text-orange-800">
            Toplam tutar {formatCurrency(Math.abs(totalDelta), currency)} {totalDelta > 0 ? 'artacak' : 'azalacak'}.
            Bu değişiklik tedarikçi bakiyesini etkileyecektir.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Invoice Info & Category */}
        <div className="lg:col-span-1 space-y-4">
          {/* Fatura Bilgileri (Read-only) */}
          <Card className="border-2 border-gray-300 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b-2 border-gray-300 p-3">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Fatura Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Fatura No:</span>
                  <span className="font-semibold text-xs text-blue-600">
                    {invoice.invoice_number || 'Henüz atanmadı'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Tarih:</span>
                  <span className="text-xs">
                    {invoice.invoice_date ? format(new Date(invoice.invoice_date), 'dd.MM.yyyy', { locale: tr }) : 'Belirtilmemiş'}
                  </span>
                </div>
                {invoice.due_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Vade:</span>
                    <span className="text-xs">{format(new Date(invoice.due_date), 'dd.MM.yyyy', { locale: tr })}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Para Birimi:</span>
                  <span className="text-xs font-medium">{currency === 'TL' ? 'TRY' : currency}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Durum:</span>
                  {getStatusBadge(invoice.status)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tedarikçi Bilgileri (Read-only) */}
          <Card className="border-2 border-gray-300 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50 border-b-2 border-gray-300 p-3">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-green-600" />
                Tedarikçi Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 text-xs">
                <div className="font-semibold text-gray-900 text-sm">
                  {invoice.supplier?.name || 'Bilinmiyor'}
                </div>
                {invoice.supplier?.company && (
                  <div className="text-gray-600">
                    {invoice.supplier.company}
                  </div>
                )}
                {invoice.supplier?.tax_number && (
                  <div className="text-gray-500">
                    VKN: {invoice.supplier.tax_number}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gider Kategorisi (Editable) */}
          <Card className="border-2 border-blue-300 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50 border-b-2 border-blue-300 p-3">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-600" />
                Gider Kategorisi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ModernCategorySelect
                value={formData.category_id}
                onChange={(value) => setFormData({ ...formData, category_id: value || '' })}
                placeholder="Kategori seçiniz"
                className="text-sm"
              />
            </CardContent>
          </Card>

          {/* Notlar (Editable) */}
          <Card className="border-2 border-blue-300 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100/50 border-b-2 border-blue-300 p-3">
              <CardTitle className="text-sm font-semibold text-gray-900">
                Notlar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Fatura notlarını buraya yazabilirsiniz..."
                className="min-h-[100px] text-sm"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Line Items & Financial Summary */}
        <div className="lg:col-span-3 space-y-4">
          {/* Line Items */}
          <Card className="border-2 border-gray-300 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-b-2 border-gray-300 p-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-4 w-4 text-orange-600" />
                  Fatura Kalemleri
                </CardTitle>
                <Badge variant="outline" className="px-3 py-1">
                  {lineItems.length} Kalem
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <PurchaseInvoiceLineItems
                items={lineItems}
                originalItems={originalLineItems}
                onItemsChange={setLineItems}
                currency={currency}
              />
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card className="border-2 border-gray-300 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 border-b-2 border-gray-300 p-3">
              <CardTitle className="text-sm font-semibold text-gray-900">
                Mali Özet
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ara Toplam:</span>
                  <span className="font-medium">{formatCurrency(financials.subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">KDV:</span>
                  <span className="font-medium">{formatCurrency(financials.taxTotal, currency)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Toplam:</span>
                  <span className="text-blue-600">{formatCurrency(financials.total, currency)}</span>
                </div>
                {isDirty && Math.abs(totalDelta) > 0.01 && (
                  <>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Eski Toplam:</span>
                      <span className="font-medium text-gray-500">{formatCurrency(originalTotal, currency)}</span>
                    </div>
                    <div className={`flex justify-between text-sm font-semibold ${totalDelta > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      <span>Fark:</span>
                      <span>{totalDelta > 0 ? '+' : ''}{formatCurrency(totalDelta, currency)}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EditPurchaseInvoice;
