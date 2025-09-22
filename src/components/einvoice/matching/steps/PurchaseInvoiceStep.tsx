import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  ArrowRight, 
  Package, 
  Save,
  Loader2,
  Building,
  Calendar,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EInvoiceDetails, ProductMatchingItem } from '@/types/einvoice';

interface Supplier {
  id: string;
  name: string;
  tax_number?: string;
  email?: string;
}

interface PurchaseInvoiceItem {
  product_id?: string;
  product_name: string;
  sku?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  line_total: number;
}

interface PurchaseInvoiceStepProps {
  invoiceId?: string;
  onNext: () => void;
  onBack: () => void;
}

export default function PurchaseInvoiceStep({ invoiceId, onNext, onBack }: PurchaseInvoiceStepProps) {
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<EInvoiceDetails | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseInvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    invoice_date: '',
    due_date: '',
    payment_terms: '',
    notes: '',
    project_id: '',
    expense_category_id: ''
  });

  useEffect(() => {
    loadData();
  }, [invoiceId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load invoice details
      const invoiceData = sessionStorage.getItem(`einvoice_details_${invoiceId}`);
      if (!invoiceData) {
        throw new Error('Fatura detayları bulunamadı');
      }
      const parsedInvoice: EInvoiceDetails = JSON.parse(invoiceData);
      setInvoice(parsedInvoice);

      // Load matching results
      const matchingData = sessionStorage.getItem(`product_matching_${invoiceId}`);
      if (!matchingData) {
        throw new Error('Eşleştirme sonuçları bulunamadı');
      }
      const matchingItems: ProductMatchingItem[] = JSON.parse(matchingData);

      // Filter only matched items
      const validItems = matchingItems.filter(item => 
        item.match_type !== 'unmatched'
      );

      const items: PurchaseInvoiceItem[] = validItems.map(item => ({
        product_id: item.matched_product_id,
        product_name: item.invoice_item.product_name,
        sku: item.invoice_item.product_code,
        quantity: item.invoice_item.quantity,
        unit: item.invoice_item.unit,
        unit_price: item.invoice_item.unit_price,
        tax_rate: item.invoice_item.tax_rate,
        discount_rate: 0,
        line_total: item.invoice_item.line_total
      }));

      setPurchaseItems(items);

      // Load suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('customers')
        .select('id, name, tax_number, email')
        .eq('type', 'supplier')
        .order('name');

      if (suppliersError) throw suppliersError;
      setSuppliers(suppliersData || []);

      // Try to find supplier by tax number
      const matchingSupplier = suppliersData?.find(s => 
        s.tax_number === parsedInvoice.supplier_tax_number
      );
      if (matchingSupplier) {
        setSelectedSupplierId(matchingSupplier.id);
      }

      // Set default form values
      setFormData({
        invoice_date: parsedInvoice.invoice_date.split('T')[0],
        due_date: parsedInvoice.due_date ? parsedInvoice.due_date.split('T')[0] : '',
        payment_terms: '30 gün',
        notes: `E-faturadan aktarılan alış faturası - Orijinal No: ${parsedInvoice.invoice_number}`,
        project_id: '',
        expense_category_id: ''
      });

    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      toast({
        title: "Hata",
        description: error.message || "Veriler yüklenirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePurchaseInvoice = async () => {
    if (!invoice || !selectedSupplierId || purchaseItems.length === 0) {
      toast({
        title: "Hata",
        description: "Lütfen tüm gerekli alanları doldurun",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const subtotal = purchaseItems.reduce((sum, item) => sum + (item.line_total - (item.line_total * item.tax_rate / 100)), 0);
      const taxTotal = purchaseItems.reduce((sum, item) => sum + (item.line_total * item.tax_rate / 100), 0);
      const total = subtotal + taxTotal;

      // Create purchase invoice
      const { data: purchaseInvoice, error: invoiceError } = await supabase
        .from('purchase_invoices')
        .insert({
          invoice_number: invoice.invoice_number,
          supplier_id: selectedSupplierId,
          status: 'pending',
          currency: invoice.currency,
          subtotal,
          tax_amount: taxTotal,
          total_amount: total,
          paid_amount: 0,
          invoice_date: formData.invoice_date,
          due_date: formData.due_date || formData.invoice_date,
          notes: formData.notes,
          einvoice_id: invoice.id
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create purchase invoice items
      const purchaseInvoiceItems = purchaseItems.map(item => ({
        purchase_invoice_id: purchaseInvoice.id,
        product_id: item.product_id,
        product_name: item.product_name,
        sku: item.sku,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        discount_rate: item.discount_rate,
        line_total: item.line_total
      }));

      const { error: itemsError } = await supabase
        .from('purchase_invoice_items')
        .insert(purchaseInvoiceItems);

      if (itemsError) throw itemsError;

      // Store purchase invoice ID for completion step
      sessionStorage.setItem(`purchase_invoice_${invoiceId}`, JSON.stringify(purchaseInvoice));

      toast({
        title: "Başarılı",
        description: "Alış faturası başarıyla oluşturuldu",
      });

      onNext();

    } catch (error: any) {
      console.error('❌ Error creating purchase invoice:', error);
      toast({
        title: "Hata",
        description: error.message || "Alış faturası oluşturulurken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const subtotal = purchaseItems.reduce((sum, item) => 
    sum + (item.line_total - (item.line_total * item.tax_rate / 100)), 0
  );
  const taxTotal = purchaseItems.reduce((sum, item) => 
    sum + (item.line_total * item.tax_rate / 100), 0
  );
  const total = subtotal + taxTotal;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Alış faturası hazırlanıyor...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invoice Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              Tedarikçi ve Fatura Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="supplier">Tedarikçi *</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tedarikçi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-xs text-gray-500">VKN: {supplier.tax_number}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoice_date">Fatura Tarihi *</Label>
                <Input
                  id="invoice_date"
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="due_date">Vade Tarihi</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="payment_terms">Ödeme Koşulları</Label>
              <Input
                id="payment_terms"
                value={formData.payment_terms}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                placeholder="Ödeme koşulları"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Fatura notları"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-green-50 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Finansal Özet
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Kalem Sayısı</span>
                <span className="font-mono">{purchaseItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Net Tutar</span>
                <span className="font-mono">{subtotal.toFixed(2)} {invoice?.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">KDV Tutarı</span>
                <span className="font-mono">{taxTotal.toFixed(2)} {invoice?.currency}</span>
              </div>
              <div className="flex justify-between border-t pt-3 font-semibold text-lg">
                <span>TOPLAM</span>
                <span className="font-mono text-blue-600">{total.toFixed(2)} {invoice?.currency}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-600" />
            Alış Faturası Kalemleri ({purchaseItems.length} adet)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="min-w-48">Ürün/Hizmet</TableHead>
                  <TableHead className="w-32">SKU</TableHead>
                  <TableHead className="w-20 text-right">Miktar</TableHead>
                  <TableHead className="w-20">Birim</TableHead>
                  <TableHead className="w-24 text-right">Birim Fiyat</TableHead>
                  <TableHead className="w-20 text-right">KDV %</TableHead>
                  <TableHead className="w-24 text-right">Tutar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseItems.map((item, index) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-center">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-48">
                        <p className="font-medium text-gray-900 truncate">{item.product_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        {item.sku || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.quantity.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {item.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.unit_price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        %{item.tax_rate}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {item.line_total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Önceki Adım
        </Button>
        <Button 
          onClick={handleCreatePurchaseInvoice}
          disabled={isCreating || !selectedSupplierId || purchaseItems.length === 0}
          className="flex items-center gap-2"
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Alış Faturasını Oluştur
        </Button>
      </div>
    </div>
  );
}