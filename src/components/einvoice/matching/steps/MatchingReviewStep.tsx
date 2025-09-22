import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  Check, 
  AlertTriangle,
  Plus,
  Edit,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EInvoiceDetails, ProductMatchingItem, MatchingSummary } from '@/types/einvoice';

interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  unit: string;
  tax_rate: number;
}

interface MatchingReviewStepProps {
  invoiceId?: string;
  onNext: () => void;
  onBack: () => void;
}

export default function MatchingReviewStep({ invoiceId, onNext, onBack }: MatchingReviewStepProps) {
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<EInvoiceDetails | null>(null);
  const [matchingItems, setMatchingItems] = useState<ProductMatchingItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<MatchingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
      const parsedMatching: ProductMatchingItem[] = JSON.parse(matchingData);
      setMatchingItems(parsedMatching);

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, price, unit, tax_rate')
        .eq('is_active', true);

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Calculate summary
      const totalItems = parsedMatching.length;
      const matchedItems = parsedMatching.filter(item => 
        item.match_type === 'automatic' || item.match_type === 'manual'
      ).length;
      const newProducts = parsedMatching.filter(item => 
        item.match_type === 'new_product'
      ).length;
      const unmatchedItems = parsedMatching.filter(item => 
        item.match_type === 'unmatched'
      ).length;
      
      const confidenceScores = parsedMatching
        .filter(item => item.confidence_score && item.confidence_score > 0)
        .map(item => item.confidence_score!);
      const confidenceAvg = confidenceScores.length > 0 
        ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length 
        : 0;

      setSummary({
        total_items: totalItems,
        matched_items: matchedItems,
        new_products: newProducts,
        unmatched_items: unmatchedItems,
        confidence_avg: confidenceAvg
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

  const handleSaveMatching = async () => {
    if (!invoice) return;

    setIsSaving(true);
    try {
      // Save matching results to database
      const matchingRecords = matchingItems.map(item => ({
        invoice_id: invoice.id,
        invoice_line_id: item.invoice_item.id,
        invoice_product_name: item.invoice_item.product_name,
        invoice_product_code: item.invoice_item.product_code,
        invoice_quantity: item.invoice_item.quantity,
        invoice_unit: item.invoice_item.unit,
        invoice_unit_price: item.invoice_item.unit_price,
        invoice_total_amount: item.invoice_item.line_total,
        invoice_tax_rate: item.invoice_item.tax_rate,
        matched_stock_id: item.matched_product_id,
        match_type: item.match_type,
        match_confidence: item.confidence_score || 0,
        is_confirmed: true,
        notes: item.notes
      }));

      const { error: insertError } = await supabase
        .from('e_fatura_stok_eslestirme')
        .insert(matchingRecords);

      if (insertError) throw insertError;

      // Create new products if needed
      const newProductItems = matchingItems.filter(item => item.match_type === 'new_product');
      
      for (const item of newProductItems) {
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            name: item.invoice_item.product_name,
            sku: item.invoice_item.product_code,
            price: item.invoice_item.unit_price,
            unit: item.invoice_item.unit,
            tax_rate: item.invoice_item.tax_rate,
            currency: invoice.currency,
            category_type: 'product',
            product_type: 'physical',
            status: 'active',
            is_active: true,
            stock_quantity: 0,
            description: `E-faturadan oluşturulan ürün - Fatura No: ${invoice.invoice_number}`
          })
          .select()
          .single();

        if (productError) {
          console.error('❌ Error creating product:', productError);
          continue;
        }

        // Update matching record with new product ID
        await supabase
          .from('e_fatura_stok_eslestirme')
          .update({ matched_stock_id: newProduct.id })
          .eq('invoice_id', invoice.id)
          .eq('invoice_line_id', item.invoice_item.id);
      }

      // Store results for next step
      sessionStorage.setItem(`matching_saved_${invoiceId}`, JSON.stringify(true));

      toast({
        title: "Başarılı",
        description: `Eşleştirme sonuçları kaydedildi. ${newProductItems.length} yeni ürün oluşturuldu.`,
      });

      onNext();

    } catch (error: any) {
      console.error('❌ Error saving matching:', error);
      toast({
        title: "Hata",
        description: error.message || "Eşleştirme sonuçları kaydedilirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getMatchedProduct = (productId?: string) => {
    return products.find(p => p.id === productId);
  };

  const getStatusBadge = (item: ProductMatchingItem) => {
    switch (item.match_type) {
      case 'automatic':
        return (
          <Badge className="bg-blue-100 text-blue-700">
            Otomatik ({Math.round((item.confidence_score || 0) * 100)}%)
          </Badge>
        );
      case 'manual':
        return (
          <Badge className="bg-green-100 text-green-700">
            Manuel
          </Badge>
        );
      case 'new_product':
        return (
          <Badge className="bg-orange-100 text-orange-700">
            Yeni Ürün
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive">
            Eşleşmemiş
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Eşleştirme sonuçları yükleniyor...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.total_items}</div>
                <div className="text-sm text-gray-600">Toplam Kalem</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.matched_items}</div>
                <div className="text-sm text-gray-600">Eşleşen Ürün</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{summary.new_products}</div>
                <div className="text-sm text-gray-600">Yeni Ürün</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(summary.confidence_avg * 100)}%
                </div>
                <div className="text-sm text-gray-600">Ortalama Güven</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Review Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Eşleştirme İncelemesi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="min-w-48">Fatura Kalemi</TableHead>
                  <TableHead className="w-32">Durum</TableHead>
                  <TableHead className="min-w-64">Eşleşen/Yeni Ürün</TableHead>
                  <TableHead className="w-24 text-right">Fiyat Farkı</TableHead>
                  <TableHead className="w-32">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchingItems.map((item, index) => {
                  const matchedProduct = getMatchedProduct(item.matched_product_id);
                  const priceDiff = matchedProduct 
                    ? item.invoice_item.unit_price - matchedProduct.price
                    : 0;
                  
                  return (
                    <TableRow key={item.invoice_item.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-center">
                        {item.invoice_item.line_number}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-48">
                          <p className="font-medium text-gray-900 truncate">
                            {item.invoice_item.product_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Kod: {item.invoice_item.product_code || '-'} • 
                            {item.invoice_item.quantity} {item.invoice_item.unit} • 
                            {item.invoice_item.unit_price.toFixed(2)} {invoice?.currency}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item)}
                      </TableCell>
                      <TableCell>
                        {matchedProduct ? (
                          <div className="p-2 bg-green-50 border border-green-200 rounded">
                            <p className="font-medium text-green-900 text-sm">
                              {matchedProduct.name}
                            </p>
                            <p className="text-xs text-green-600">
                              SKU: {matchedProduct.sku || '-'} • 
                              {matchedProduct.price.toFixed(2)} {invoice?.currency} • 
                              KDV: %{matchedProduct.tax_rate}
                            </p>
                          </div>
                        ) : item.match_type === 'new_product' ? (
                          <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                            <p className="font-medium text-orange-900 text-sm">
                              Yeni ürün oluşturulacak
                            </p>
                            <p className="text-xs text-orange-600">
                              Ad: {item.invoice_item.product_name} • 
                              Fiyat: {item.invoice_item.unit_price.toFixed(2)} {invoice?.currency}
                            </p>
                          </div>
                        ) : (
                          <div className="p-2 bg-red-50 border border-red-200 rounded">
                            <p className="font-medium text-red-900 text-sm">
                              Eşleştirilmemiş
                            </p>
                            <p className="text-xs text-red-600">
                              Bu kalem için ürün seçilmedi
                            </p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {matchedProduct && (
                          <div className={`text-sm font-mono ${
                            Math.abs(priceDiff) > 0.01 
                              ? priceDiff > 0 ? 'text-red-600' : 'text-green-600'
                              : 'text-gray-600'
                          }`}>
                            {priceDiff > 0 ? '+' : ''}{priceDiff.toFixed(2)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Go back to mapping step to edit this item
                            onBack();
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {summary && summary.unmatched_items > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                {summary.unmatched_items} kalem eşleştirilmemiş. 
                Bu kalemler alış faturasına dahil edilmeyecek.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Eşleştirmeyi Düzenle
        </Button>
        <Button 
          onClick={handleSaveMatching}
          disabled={isSaving || (summary && summary.unmatched_items === summary.total_items)}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Onayla ve Devam Et
        </Button>
      </div>
    </div>
  );
}