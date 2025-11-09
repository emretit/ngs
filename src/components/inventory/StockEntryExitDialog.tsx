import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton, UnifiedDatePicker } from "@/components/ui/unified-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, X, Search, Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useInventoryTransactions } from "@/hooks/useInventoryTransactions";
import { Product } from "@/types/product";
import { toast } from "sonner";

interface StockEntryExitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transactionType: 'giris' | 'cikis';
  warehouseId?: string;
}

interface TransactionItem {
  product_id: string;
  product_name: string;
  product_sku?: string;
  unit: string;
  quantity: number;
  available_stock?: number; // Çıkış için mevcut stok
  unit_cost?: number;
  notes?: string;
}

export default function StockEntryExitDialog({ 
  isOpen, 
  onClose, 
  transactionType,
  warehouseId: initialWarehouseId,
  onSuccess
}: StockEntryExitDialogProps) {
  const { createTransaction } = useInventoryTransactions();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(initialWarehouseId || "");
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Dialog kapandığında formu temizle
  useEffect(() => {
    if (!isOpen) {
      setItems([]);
      setSelectedWarehouseId(initialWarehouseId || "");
      setTransactionDate(new Date());
      setReferenceNumber("");
      setNotes("");
      setProductSearchQuery("");
    }
  }, [isOpen, initialWarehouseId]);

  // Depo değiştiğinde ürünleri temizle (özellikle çıkış için önemli)
  useEffect(() => {
    if (transactionType === 'cikis') {
      setItems([]);
    }
  }, [selectedWarehouseId, transactionType]);

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
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });

  // Çıkış için: Seçili depodaki ürünleri getir (stokta olanlar)
  const { data: warehouseProducts = [] } = useQuery({
    queryKey: ["warehouse_products", selectedWarehouseId, transactionType],
    queryFn: async () => {
      if (!selectedWarehouseId || transactionType !== 'cikis') return [];

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) return [];

      const { data: stockData, error } = await supabase
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
        .eq("warehouse_id", selectedWarehouseId)
        .eq("company_id", profile.company_id)
        .gt("quantity", 0);

      if (error) throw error;
      return (stockData || []).map((stock: any) => ({
        ...stock.products,
        available_stock: Number(stock.quantity) || 0,
      })) as (Product & { available_stock: number })[];
    },
    enabled: !!selectedWarehouseId && transactionType === 'cikis',
  });

  // Giriş için: Tüm aktif ürünleri getir
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["products", productSearchQuery, transactionType],
    queryFn: async () => {
      if (transactionType !== 'giris') return [];

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) return [];

      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("company_id", profile.company_id)
        .order("name")
        .limit(50);

      if (productSearchQuery) {
        query = query.or(`name.ilike.%${productSearchQuery}%,sku.ilike.%${productSearchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Product[];
    },
    enabled: transactionType === 'giris',
  });

  // Ürünleri filtrele
  const filteredProducts = transactionType === 'cikis' 
    ? warehouseProducts.filter((product) => {
        if (!productSearchQuery) return true;
        const query = productSearchQuery.toLowerCase();
        return (
          product.name?.toLowerCase().includes(query) ||
          product.sku?.toLowerCase().includes(query)
        );
      })
    : allProducts;

  const addProduct = (product: Product & { available_stock?: number }) => {
    // Ürün zaten ekli mi kontrol et
    if (items.some(item => item.product_id === product.id)) {
      toast.warning("Bu ürün zaten listede");
      return;
    }

    const newItem: TransactionItem = {
      product_id: product.id,
      product_name: product.name || "Bilinmeyen Ürün",
      product_sku: product.sku,
      unit: product.unit || "adet",
      quantity: 1,
      available_stock: transactionType === 'cikis' ? product.available_stock : undefined,
      unit_cost: undefined,
      notes: "",
    };

    setItems([...items, newItem]);
    setIsProductDialogOpen(false);
    setProductSearchQuery("");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof TransactionItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Çıkış için: Miktar güncellendiğinde stok kontrolü yap
    if (transactionType === 'cikis' && field === "quantity" && value > (newItems[index].available_stock || 0)) {
      toast.warning(`Mevcut stok: ${newItems[index].available_stock} ${newItems[index].unit}`);
    }
    
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!selectedWarehouseId) {
      toast.error("Lütfen bir depo seçin");
      return;
    }

    if (items.length === 0) {
      toast.error("En az bir ürün eklemelisiniz");
      return;
    }

    // Çıkış için stok kontrolü
    if (transactionType === 'cikis') {
      const insufficientStock = items.find(item => item.quantity > (item.available_stock || 0));
      if (insufficientStock) {
        toast.error(`${insufficientStock.product_name} için yetersiz stok. Mevcut: ${insufficientStock.available_stock} ${insufficientStock.unit}`);
        return;
      }
    }

    // Tüm ürünler için miktar kontrolü
    if (items.some(item => !item.quantity || item.quantity <= 0)) {
      toast.error("Tüm ürünler için geçerli bir miktar girmelisiniz");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTransaction({
        transaction_type: transactionType,
        warehouse_id: selectedWarehouseId,
        transaction_date: transactionDate.toISOString().split('T')[0],
        reference_number: referenceNumber || undefined,
        notes: notes || undefined,
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          unit_cost: item.unit_cost || undefined,
          notes: item.notes || undefined,
        })),
      });

      toast.success(transactionType === 'giris' ? "Stok girişi başarıyla oluşturuldu" : "Stok çıkışı başarıyla oluşturuldu");
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error(`Error creating stock ${transactionType}:`, error);
      toast.error(error.message || `Stok ${transactionType === 'giris' ? 'girişi' : 'çıkışı'} oluşturulurken hata oluştu`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGiris = transactionType === 'giris';
  const title = isGiris ? "Yeni Stok Girişi" : "Yeni Stok Çıkışı";
  const headerColor = isGiris ? "green" : "red";

  return (
    <>
      <UnifiedDialog
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        maxWidth="4xl"
        headerColor={headerColor}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* İşlem Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">İşlem Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warehouse_id">Depo *</Label>
                <Select
                  value={selectedWarehouseId}
                  onValueChange={setSelectedWarehouseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Depo seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                        {warehouse.code && ` (${warehouse.code})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tarih *</Label>
                <UnifiedDatePicker
                  date={transactionDate}
                  onSelect={(date) => date && setTransactionDate(date)}
                  placeholder="Tarih seçin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference_number">Referans No</Label>
                <Input
                  id="reference_number"
                  placeholder="Opsiyonel"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                placeholder="İşlem notları..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Ürün Listesi */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex-1">Ürünler</h3>
              {selectedWarehouseId ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsProductDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ürün Ekle
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">Önce depo seçin</p>
              )}
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Henüz ürün eklenmedi</p>
                {selectedWarehouseId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsProductDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    İlk Ürünü Ekle
                  </Button>
                )}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      {transactionType === 'cikis' && (
                        <TableHead className="text-right">Mevcut Stok</TableHead>
                      )}
                      <TableHead className="text-right">{isGiris ? 'Giriş' : 'Çıkış'} Miktarı</TableHead>
                      <TableHead className="text-right">Birim</TableHead>
                      {transactionType === 'giris' && (
                        <TableHead className="text-right">Birim Maliyet</TableHead>
                      )}
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => {
                      const isInsufficient = transactionType === 'cikis' && item.quantity > (item.available_stock || 0);
                      return (
                        <TableRow key={item.product_id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.product_name}</div>
                              {item.product_sku && (
                                <div className="text-xs text-muted-foreground">
                                  SKU: {item.product_sku}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          {transactionType === 'cikis' && (
                            <TableCell className="text-right text-muted-foreground">
                              {item.available_stock?.toLocaleString('tr-TR') || 0}
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              max={transactionType === 'cikis' ? item.available_stock : undefined}
                              value={item.quantity || ""}
                              onChange={(e) => updateItem(index, "quantity", Number(e.target.value) || 0)}
                              className={`w-32 ml-auto text-right ${isInsufficient ? 'border-red-500' : ''}`}
                            />
                            {isInsufficient && (
                              <div className="text-xs text-red-600 mt-1 flex items-center gap-1 justify-end">
                                <AlertTriangle className="h-3 w-3" />
                                Yetersiz stok
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.unit}
                          </TableCell>
                          {transactionType === 'giris' && (
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unit_cost || ""}
                                onChange={(e) => updateItem(index, "unit_cost", Number(e.target.value) || undefined)}
                                placeholder="Opsiyonel"
                                className="w-32 ml-auto text-right"
                              />
                            </TableCell>
                          )}
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Footer */}
          <UnifiedDialogFooter>
            <UnifiedDialogCancelButton onClick={onClose} />
            <UnifiedDialogActionButton 
              onClick={handleSubmit}
              disabled={!selectedWarehouseId || items.length === 0 || isSubmitting}
              className={isGiris ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </UnifiedDialogActionButton>
          </UnifiedDialogFooter>
        </div>
      </UnifiedDialog>

      {/* Ürün Seçim Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {transactionType === 'giris' ? 'Ürün Seç' : 'Ürün Seç (Stokta Olanlar)'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ürün adı veya SKU ile ara..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto border rounded-lg">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedWarehouseId || transactionType === 'giris' ? (
                    <p>{transactionType === 'cikis' ? 'Bu depoda stokta ürün bulunamadı' : 'Ürün bulunamadı'}</p>
                  ) : (
                    <p>Önce depo seçin</p>
                  )}
                </div>
              ) : (
                <Table>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => addProduct(product)}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.sku && (
                              <div className="text-xs text-muted-foreground">
                                SKU: {product.sku}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        {transactionType === 'cikis' && 'available_stock' in product && (
                          <TableCell className="text-right">
                            <Badge variant="outline" className="mr-2">
                              {product.available_stock.toLocaleString('tr-TR')} {product.unit || "adet"}
                            </Badge>
                          </TableCell>
                        )}
                        {transactionType === 'giris' && (
                          <TableCell className="text-right">
                            <Badge variant="outline">{product.unit || "adet"}</Badge>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
              İptal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

