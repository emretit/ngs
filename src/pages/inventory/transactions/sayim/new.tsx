import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  ClipboardList, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Search,
  Package,
  Calendar,
  Warehouse,
  Info
} from "lucide-react";
import { useInventoryTransactions } from "@/hooks/useInventoryTransactions";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";

interface CountItem {
  product_id: string;
  product_name: string;
  product_sku?: string;
  unit: string;
  system_quantity: number;
  physical_quantity: number;
  difference: number;
}

export default function NewInventoryCount() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const warehouseIdFromUrl = searchParams.get("warehouse_id");
  
  const { createTransaction } = useInventoryTransactions();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouseIdFromUrl || "");
  const [countItems, setCountItems] = useState<CountItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Aktif depoları getir
  const { data: warehouses = [] } = useQuery({
    queryKey: ["available_warehouses"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) return [];

      const { data, error } = await supabase
        .from("warehouses")
        .select("id, name, code")
        
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });

  // Depo seçildiğinde ürünleri yükle
  useEffect(() => {
    if (selectedWarehouseId) {
      loadWarehouseProducts(selectedWarehouseId);
    } else {
      setCountItems([]);
    }
  }, [selectedWarehouseId]);

  const loadWarehouseProducts = async (warehouseId: string) => {
    setIsLoadingProducts(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) {
        toast.error("Şirket bilgisi bulunamadı");
        return;
      }

      const { data: warehouseStock, error: stockError } = await supabase
        .from("warehouse_stock")
        .select(`
          product_id,
          quantity,
          products (
            id,
            name,
            sku,
            unit
          )
        `)
        .eq("warehouse_id", warehouseId)
        
        .gt("quantity", 0);

      if (stockError) throw stockError;

      const items: CountItem[] = (warehouseStock || []).map((stock: any) => ({
        product_id: stock.product_id,
        product_name: stock.products?.name || "Bilinmeyen Ürün",
        product_sku: stock.products?.sku,
        unit: stock.products?.unit || "adet",
        system_quantity: Number(stock.quantity) || 0,
        physical_quantity: Number(stock.quantity) || 0,
        difference: 0,
      }));

      setCountItems(items);
    } catch (error: any) {
      logger.error("Error loading warehouse products:", error);
      toast.error("Ürünler yüklenirken hata oluştu");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const updatePhysicalQuantity = (index: number, value: number) => {
    const newItems = [...countItems];
    newItems[index].physical_quantity = value;
    newItems[index].difference = value - newItems[index].system_quantity;
    setCountItems(newItems);
  };

  const onSubmit = async () => {
    if (!selectedWarehouseId) {
      toast.error("Lütfen bir depo seçin");
      return;
    }

    if (countItems.length === 0) {
      toast.error("Bu depoda sayılacak ürün bulunmuyor");
      return;
    }

    // Sayım validasyonu: En az bir üründe fark olmalı
    const hasCountedItems = countItems.some(item => item.physical_quantity !== item.system_quantity);
    if (!hasCountedItems && countItems.every(item => item.physical_quantity === item.system_quantity)) {
      toast.info("Sayım sonuçları sistem stoku ile aynı. Fark olmadığı için sayım kaydedilmeyecek.");
      return;
    }

    // Sayım onaylandığında stokların güncelleneceği bilgisini göster
    const totalDifferences = countItems.filter(item => item.difference !== 0).length;
    if (totalDifferences > 0) {
      toast.info(`${totalDifferences} üründe fark tespit edildi. Sayım onaylandığında stoklar fiziksel sayım sonuçlarına göre güncellenecektir.`);
    }

    setIsSubmitting(true);
    try {
      await createTransaction({
        transaction_type: 'sayim',
        warehouse_id: selectedWarehouseId,
        transaction_date: format(transactionDate, 'yyyy-MM-dd'),
        reference_number: referenceNumber || undefined,
        notes: notes || undefined,
        items: countItems.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.physical_quantity,
          unit: item.unit,
        })),
      });

      toast.success("Stok sayımı başarıyla oluşturuldu");
      navigate("/inventory/counts");
    } catch (error: any) {
      logger.error("Error creating count:", error);
      toast.error(error.message || "Sayım oluşturulurken hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrelenmiş ürünler
  const filteredItems = countItems.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.product_name.toLowerCase().includes(query) ||
      item.product_sku?.toLowerCase().includes(query)
    );
  });

  // İstatistikler
  const stats = {
    total: countItems.length,
    withDifference: countItems.filter(item => item.difference !== 0).length,
    excess: countItems.filter(item => item.difference > 0).length,
    shortage: countItems.filter(item => item.difference < 0).length,
    totalSystemStock: countItems.reduce((sum, item) => sum + item.system_quantity, 0),
    totalPhysicalStock: countItems.reduce((sum, item) => sum + item.physical_quantity, 0),
    totalDifference: countItems.reduce((sum, item) => sum + item.difference, 0),
  };

  return (
    <div className="space-y-4">
      {/* Modern Header */}
      <div className="flex items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/inventory/counts")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white shadow-lg">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Yeni Stok Sayımı
              </h1>
              <p className="text-xs text-muted-foreground/70">
                Fiziksel stok sayımı yapın ve sistem kayıtlarıyla karşılaştırın
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sol Taraf - Form ve Liste */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sayım Bilgileri */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                Sayım Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="warehouse_id" className="text-xs font-medium">Depo *</Label>
                  <Select
                    value={selectedWarehouseId}
                    onValueChange={setSelectedWarehouseId}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Depo seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          <div className="flex items-center gap-2">
                            <Warehouse className="h-3 w-3" />
                            {warehouse.name}
                            {warehouse.code && (
                              <span className="text-xs text-muted-foreground">({warehouse.code})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Sayım Tarihi *</Label>
                  <EnhancedDatePicker
                    date={transactionDate}
                    onSelect={(date) => date && setTransactionDate(date)}
                    placeholder="Tarih seçin"
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference_number" className="text-xs font-medium">Referans No</Label>
                  <Input
                    id="reference_number"
                    placeholder="Opsiyonel"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs font-medium">Notlar</Label>
                <Textarea
                  id="notes"
                  placeholder="Sayım notları..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Ürün Listesi */}
          {selectedWarehouseId && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-600" />
                    Sayım Listesi
                    {stats.total > 0 && (
                      <Badge variant="outline" className="ml-2">
                        {stats.total} ürün
                      </Badge>
                    )}
                  </CardTitle>
                  {stats.withDifference > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {stats.withDifference} farklı
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Arama */}
                {countItems.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Ürün adı veya SKU ile ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                )}

                {isLoadingProducts ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-3">
                      <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                      <p className="text-sm text-muted-foreground">Ürünler yükleniyor...</p>
                    </div>
                  </div>
                ) : countItems.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-sm font-medium text-muted-foreground mb-1">Bu depoda stokta ürün bulunmuyor</p>
                    <p className="text-xs text-muted-foreground">Önce depoya stok girişi yapın</p>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg">
                    <Search className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">Arama kriterinize uygun ürün bulunamadı</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-[500px] overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-gray-50 z-10">
                          <TableRow>
                            <TableHead className="w-[40px] text-xs font-semibold">#</TableHead>
                            <TableHead className="text-xs font-semibold">Ürün</TableHead>
                            <TableHead className="text-right text-xs font-semibold">Sistem</TableHead>
                            <TableHead className="text-right text-xs font-semibold">Fiziksel</TableHead>
                            <TableHead className="text-right text-xs font-semibold">Fark</TableHead>
                            <TableHead className="w-[80px] text-xs font-semibold">Birim</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredItems.map((item, index) => (
                            <TableRow 
                              key={item.product_id}
                              className={item.difference !== 0 ? "bg-orange-50/50 hover:bg-orange-50" : ""}
                            >
                              <TableCell className="text-xs text-muted-foreground">
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium text-sm">{item.product_name}</div>
                                  {item.product_sku && (
                                    <div className="text-xs text-muted-foreground">
                                      SKU: {item.product_sku}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="font-medium text-sm">
                                  {item.system_quantity.toLocaleString('tr-TR')}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.physical_quantity || ""}
                                  onChange={(e) => updatePhysicalQuantity(
                                    countItems.findIndex(i => i.product_id === item.product_id),
                                    Number(e.target.value) || 0
                                  )}
                                  className={`w-28 ml-auto text-right h-8 ${
                                    item.difference !== 0 
                                      ? item.difference > 0 
                                        ? 'border-green-300 bg-green-50/50' 
                                        : 'border-red-300 bg-red-50/50'
                                      : ''
                                  }`}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                {item.difference !== 0 ? (
                                  <Badge
                                    variant="outline"
                                    className={
                                      item.difference > 0
                                        ? "bg-green-100 text-green-800 border-green-300"
                                        : "bg-red-100 text-red-800 border-red-300"
                                    }
                                  >
                                    {item.difference > 0 ? (
                                      <TrendingUp className="h-3 w-3 mr-1" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3 mr-1" />
                                    )}
                                    {item.difference > 0 ? "+" : ""}
                                    {item.difference.toLocaleString('tr-TR')}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-50 border-gray-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Uyumlu
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {item.unit}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sağ Taraf - İstatistikler ve Özet */}
        <div className="space-y-4">
          {/* Hızlı İstatistikler */}
          {selectedWarehouseId && countItems.length > 0 && (
            <>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-purple-900">
                    <Info className="h-4 w-4" />
                    Sayım Özeti
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/80 rounded-lg p-3 border border-purple-200/50">
                      <div className="text-xs text-muted-foreground mb-1">Toplam Ürün</div>
                      <div className="text-xl font-bold text-purple-900">{stats.total}</div>
                    </div>
                    <div className="bg-white/80 rounded-lg p-3 border border-purple-200/50">
                      <div className="text-xs text-muted-foreground mb-1">Farklı Ürün</div>
                      <div className={`text-xl font-bold ${stats.withDifference > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                        {stats.withDifference}
                      </div>
                    </div>
                  </div>
                  
                  {stats.excess > 0 && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-800">Fazla Stok</span>
                      </div>
                      <div className="text-lg font-bold text-green-900">{stats.excess} ürün</div>
                    </div>
                  )}

                  {stats.shortage > 0 && (
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-xs font-medium text-red-800">Eksik Stok</span>
                      </div>
                      <div className="text-lg font-bold text-red-900">{stats.shortage} ürün</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stok Karşılaştırması */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Stok Karşılaştırması</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Sistem Stoku</span>
                      <span className="text-sm font-semibold">
                        {stats.totalSystemStock.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Fiziksel Stok</span>
                      <span className="text-sm font-semibold">
                        {stats.totalPhysicalStock.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="text-xs font-medium">Toplam Fark</span>
                      <Badge
                        variant="outline"
                        className={
                          stats.totalDifference > 0
                            ? "bg-green-100 text-green-800 border-green-300"
                            : stats.totalDifference < 0
                            ? "bg-red-100 text-red-800 border-red-300"
                            : "bg-gray-50"
                        }
                      >
                        {stats.totalDifference > 0 ? "+" : ""}
                        {stats.totalDifference.toLocaleString('tr-TR')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Bilgi Kartı */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800 space-y-1">
                  <p className="font-medium">Sayım İpuçları:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                    <li>Fiziksel sayım miktarını girin</li>
                    <li>Fark otomatik hesaplanır</li>
                    <li>Onaylandığında stoklar güncellenir</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Butonları */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/inventory/counts")}
        >
          İptal
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!selectedWarehouseId || countItems.length === 0 || isSubmitting}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Sayımı Kaydet
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
