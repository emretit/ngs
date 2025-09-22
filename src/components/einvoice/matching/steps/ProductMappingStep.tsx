import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  ArrowRight, 
  Search, 
  Zap, 
  Plus, 
  Check, 
  X,
  Loader2,
  Target,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EInvoiceDetails, ProductMatchingItem } from '@/types/einvoice';

interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  unit: string;
  tax_rate: number;
  category_type?: string;
}

interface ProductMappingStepProps {
  invoiceId?: string;
  onNext: () => void;
  onBack: () => void;
}

export default function ProductMappingStep({ invoiceId, onNext, onBack }: ProductMappingStepProps) {
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<EInvoiceDetails | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [matchingItems, setMatchingItems] = useState<ProductMatchingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAutoMatching, setIsAutoMatching] = useState(false);

  useEffect(() => {
    loadData();
  }, [invoiceId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load invoice details from session storage
      const invoiceData = sessionStorage.getItem(`einvoice_details_${invoiceId}`);
      if (!invoiceData) {
        throw new Error('Fatura detayları bulunamadı. Lütfen önceki adıma dönün.');
      }

      const parsedInvoice: EInvoiceDetails = JSON.parse(invoiceData);
      setInvoice(parsedInvoice);

      // Load existing products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, price, unit, tax_rate, category_type')
        .eq('is_active', true)
        .order('name');

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Initialize matching items
      const initialMatching: ProductMatchingItem[] = parsedInvoice.items.map(item => ({
        invoice_item: item,
        match_type: 'unmatched',
        confidence_score: 0
      }));

      setMatchingItems(initialMatching);

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

  const performAutoMatching = async () => {
    setIsAutoMatching(true);
    try {
      const updatedMatching = matchingItems.map(item => {
        const invoiceItem = item.invoice_item;
        let bestMatch: Product | null = null;
        let confidence = 0;

        // 1. Exact SKU match (highest priority)
        if (invoiceItem.product_code) {
          bestMatch = products.find(p => p.sku === invoiceItem.product_code) || null;
          if (bestMatch) confidence = 0.95;
        }

        // 2. Exact name match
        if (!bestMatch) {
          bestMatch = products.find(p => 
            p.name.toLowerCase() === invoiceItem.product_name.toLowerCase()
          ) || null;
          if (bestMatch) confidence = 0.90;
        }

        // 3. Partial name match
        if (!bestMatch) {
          const nameWords = invoiceItem.product_name.toLowerCase().split(' ');
          bestMatch = products.find(p => {
            const productWords = p.name.toLowerCase().split(' ');
            const commonWords = nameWords.filter(word => productWords.includes(word));
            return commonWords.length >= Math.min(2, nameWords.length / 2);
          }) || null;
          if (bestMatch) confidence = 0.70;
        }

        // 4. Fuzzy name match
        if (!bestMatch) {
          bestMatch = products.find(p => {
            const similarity = calculateSimilarity(
              invoiceItem.product_name.toLowerCase(),
              p.name.toLowerCase()
            );
            return similarity > 0.6;
          }) || null;
          if (bestMatch) confidence = 0.60;
        }

        return {
          ...item,
          matched_product_id: bestMatch?.id,
          match_type: bestMatch ? 'automatic' as const : 'unmatched' as const,
          confidence_score: confidence
        };
      });

      setMatchingItems(updatedMatching);

      const matchedCount = updatedMatching.filter(item => item.matched_product_id).length;
      toast({
        title: "Otomatik Eşleştirme Tamamlandı",
        description: `${matchedCount} / ${updatedMatching.length} ürün otomatik olarak eşleştirildi`,
      });

    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Otomatik eşleştirme sırasında hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsAutoMatching(false);
    }
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const getEditDistance = (str1: string, str2: string): number => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  const handleManualMatch = (itemIndex: number, productId: string) => {
    const updatedMatching = [...matchingItems];
    updatedMatching[itemIndex] = {
      ...updatedMatching[itemIndex],
      matched_product_id: productId,
      match_type: 'manual',
      confidence_score: 1.0
    };
    setMatchingItems(updatedMatching);
  };

  const handleCreateNewProduct = (itemIndex: number) => {
    const updatedMatching = [...matchingItems];
    updatedMatching[itemIndex] = {
      ...updatedMatching[itemIndex],
      matched_product_id: undefined,
      match_type: 'new_product',
      confidence_score: 1.0
    };
    setMatchingItems(updatedMatching);
  };

  const handleRemoveMatch = (itemIndex: number) => {
    const updatedMatching = [...matchingItems];
    updatedMatching[itemIndex] = {
      ...updatedMatching[itemIndex],
      matched_product_id: undefined,
      match_type: 'unmatched',
      confidence_score: 0
    };
    setMatchingItems(updatedMatching);
  };

  const handleNext = () => {
    // Store matching results for next step
    sessionStorage.setItem(`product_matching_${invoiceId}`, JSON.stringify(matchingItems));
    onNext();
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getMatchStatusBadge = (item: ProductMatchingItem) => {
    switch (item.match_type) {
      case 'automatic':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <Zap className="h-3 w-3 mr-1" />
            Otomatik ({Math.round((item.confidence_score || 0) * 100)}%)
          </Badge>
        );
      case 'manual':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <Check className="h-3 w-3 mr-1" />
            Manuel
          </Badge>
        );
      case 'new_product':
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
            <Plus className="h-3 w-3 mr-1" />
            Yeni Ürün
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-500">
            <AlertCircle className="h-3 w-3 mr-1" />
            Eşleşmemiş
          </Badge>
        );
    }
  };

  const getMatchedProduct = (productId?: string) => {
    return products.find(p => p.id === productId);
  };

  const matchedCount = matchingItems.filter(item => 
    item.match_type !== 'unmatched'
  ).length;

  const allMatched = matchedCount === matchingItems.length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Ürünler yükleniyor...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Ürün Eşleştirme
            </CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant={allMatched ? "default" : "secondary"} className={
                allMatched ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
              }>
                {matchedCount} / {matchingItems.length} Eşleştirildi
              </Badge>
              <Button
                onClick={performAutoMatching}
                disabled={isAutoMatching}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isAutoMatching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Otomatik Eşleştir
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Ürün ara (isim veya SKU)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-gray-500">
              {filteredProducts.length} ürün bulundu
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matching Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="min-w-48">Fatura Kalemi</TableHead>
                  <TableHead className="w-32">Fatura Kodu</TableHead>
                  <TableHead className="w-20 text-right">Miktar</TableHead>
                  <TableHead className="w-32">Durum</TableHead>
                  <TableHead className="min-w-64">Eşleşen Ürün</TableHead>
                  <TableHead className="w-32">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchingItems.map((item, index) => {
                  const matchedProduct = getMatchedProduct(item.matched_product_id);
                  
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
                            {item.invoice_item.unit_price.toFixed(2)} {invoice?.currency} / {item.invoice_item.unit}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {item.invoice_item.product_code || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.invoice_item.quantity.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getMatchStatusBadge(item)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {matchedProduct ? (
                            <div className="p-2 bg-green-50 border border-green-200 rounded">
                              <p className="font-medium text-green-900 text-sm">
                                {matchedProduct.name}
                              </p>
                              <p className="text-xs text-green-600">
                                SKU: {matchedProduct.sku || '-'} • 
                                {matchedProduct.price.toFixed(2)} {invoice?.currency}
                              </p>
                            </div>
                          ) : item.match_type === 'new_product' ? (
                            <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                              <p className="font-medium text-orange-900 text-sm">
                                Yeni ürün oluşturulacak
                              </p>
                              <p className="text-xs text-orange-600">
                                {item.invoice_item.product_name}
                              </p>
                            </div>
                          ) : (
                            <Select
                              value=""
                              onValueChange={(value) => {
                                if (value === 'new_product') {
                                  handleCreateNewProduct(index);
                                } else {
                                  handleManualMatch(index, value);
                                }
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Ürün seçin veya yeni oluşturun" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new_product">
                                  <div className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Yeni ürün oluştur
                                  </div>
                                </SelectItem>
                                {filteredProducts.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    <div>
                                      <p className="font-medium">{product.name}</p>
                                      <p className="text-xs text-gray-500">
                                        SKU: {product.sku || '-'} • {product.price.toFixed(2)} {invoice?.currency}
                                      </p>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.match_type !== 'unmatched' && (
                          <Button
                            onClick={() => handleRemoveMatch(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
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
          onClick={handleNext} 
          disabled={!allMatched}
          className="flex items-center gap-2"
        >
          İncelemeye Geç
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}