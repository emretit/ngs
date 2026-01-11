import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
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
import { Plus, X, Search, Package, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { useInventoryTransactions } from "@/hooks/useInventoryTransactions";
import { Product } from "@/types/product";
import { toast } from "sonner";

interface StockTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fromWarehouseId?: string;
  onSuccess?: () => void;
}

interface TransferItem {
  product_id: string;
  product_name: string;
  product_sku?: string;
  unit: string;
  quantity: number;
  available_stock: number; // Kaynak depodaki mevcut stok
  notes?: string;
}

export default function StockTransferDialog({ 
  isOpen, 
  onClose, 
  fromWarehouseId: initialFromWarehouseId,
  onSuccess
}: StockTransferDialogProps) {
  const { createTransaction } = useInventoryTransactions();
  const [fromWarehouseId, setFromWarehouseId] = useState<string>(initialFromWarehouseId || "");
  const [toWarehouseId, setToWarehouseId] = useState<string>("");
  const [items, setItems] = useState<TransferItem[]>([]);
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
      setFromWarehouseId(initialFromWarehouseId || "");
      setToWarehouseId("");
      setTransactionDate(new Date());
      setReferenceNumber("");
      setNotes("");
      setProductSearchQuery("");
    }
  }, [isOpen, initialFromWarehouseId]);

  // Kaynak depo değiştiğinde ürünleri temizle
  useEffect(() => {
    if (fromWarehouseId) {
      setItems([]);
    }
  }, [fromWarehouseId]);

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

  // Kaynak depodaki ürünleri getir (stokta olanlar)
  const { data: sourceWarehouseProducts = [] } = useQuery({
    queryKey: ["warehouse_products", fromWarehouseId],
    queryFn: async () => {
      if (!fromWarehouseId) return [];

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
        .eq("warehouse_id", fromWarehouseId)
        
        .gt("quantity", 0);

      if (error) throw error;
      return (stockData || []).map((stock: any) => ({
        ...stock.products,
        available_stock: Number(stock.quantity) || 0,
      })) as (Product & { available_stock: number })[];
    },
    enabled: !!fromWarehouseId,
  });

  // Ürünleri filtrele
  const filteredProducts = sourceWarehouseProducts.filter((product) => {
    if (!productSearchQuery) return true;
    const query = productSearchQuery.toLowerCase();
    return (
      product.name?.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query)
    );
  });

  const addProduct = (product: Product & { available_stock: number }) => {
    // Ürün zaten ekli mi kontrol et
    if (items.some(item => item.product_id === product.id)) {
      toast.warning("Bu ürün zaten listede");
      return;
    }

    const newItem: TransferItem = {
      product_id: product.id,
      product_name: product.name || "Bilinmeyen Ürün",
      product_sku: product.sku,
      unit: product.unit || "adet",
      quantity: 1,
      available_stock: product.available_stock,
      notes: "",
    };

    setItems([...items, newItem]);
    setIsProductDialogOpen(false);
    setProductSearchQuery("");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof TransferItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Miktar güncellendiğinde stok kontrolü yap
    if (field === "quantity" && value > newItems[index].available_stock) {
      toast.warning(`Mevcut stok: ${newItems[index].available_stock} ${newItems[index].unit}`);
    }
    
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!fromWarehouseId) {
      toast.error("Lütfen kaynak depo seçin");
      return;
    }

    if (!toWarehouseId) {
      toast.error("Lütfen hedef depo seçin");
      return;
    }

    if (fromWarehouseId === toWarehouseId) {
      toast.error("Kaynak ve hedef depo aynı olamaz");
      return;
    }

    if (items.length === 0) {
      toast.error("En az bir ürün eklemelisiniz");
      return;
    }

    // Stok kontrolü
    const insufficientStock = items.find(item => item.quantity > item.available_stock);
    if (insufficientStock) {
      toast.error(`${insufficientStock.product_name} için yetersiz stok. Mevcut: ${insufficientStock.available_stock} ${insufficientStock.unit}`);
      return;
    }

    // Tüm ürünler için miktar kontrolü
    if (items.some(item => !item.quantity || item.quantity <= 0)) {
      toast.error("Tüm ürünler için geçerli bir miktar girmelisiniz");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTransaction({
        transaction_type: 'transfer',
        from_warehouse_id: fromWarehouseId,
        to_warehouse_id: toWarehouseId,
        transaction_date: transactionDate.toISOString().split('T')[0],
        reference_number: referenceNumber || undefined,
        notes: notes || undefined,
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes || undefined,
        })),
      });

      toast.success("Depo transferi başarıyla oluşturuldu");
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      logger.error("Error creating stock transfer:", error);
      toast.error(error.message || "Depo transferi oluşturulurken hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <UnifiedDialog
        isOpen={isOpen}
        onClose={onClose}
        title="Yeni Depo Transferi"
        maxWidth="4xl"
        headerColor="blue"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* İşlem Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">İşlem Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from_warehouse_id">Kaynak Depo *</Label>
                <Select
                  value={fromWarehouseId}
                  onValueChange={setFromWarehouseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kaynak depo seçin" />
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
                <Label htmlFor="to_warehouse_id">Hedef Depo *</Label>
                <Select
                  value={toWarehouseId}
                  onValueChange={setToWarehouseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Hedef depo seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses
                      .filter(w => w.id !== fromWarehouseId)
                      .map((warehouse) => (
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
                  label="Tarih"
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
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex-1">Transfer Edilecek Ürünler</h3>
              {fromWarehouseId ? (
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
                <p className="text-sm text-muted-foreground">Önce kaynak depo seçin</p>
              )}
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Henüz ürün eklenmedi</p>
                {fromWarehouseId && (
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
                      <TableHead className="text-right">Kaynak Depo Stoku</TableHead>
                      <TableHead className="text-right">Transfer Miktarı</TableHead>
                      <TableHead className="text-right">Birim</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => {
                      const isInsufficient = item.quantity > item.available_stock;
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
                          <TableCell className="text-right text-muted-foreground">
                            {item.available_stock.toLocaleString('tr-TR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              max={item.available_stock}
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
              disabled={!fromWarehouseId || !toWarehouseId || items.length === 0 || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Kaydediliyor..." : "Transferi Kaydet"}
            </UnifiedDialogActionButton>
          </UnifiedDialogFooter>
        </div>
      </UnifiedDialog>

      {/* Ürün Seçim Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Ürün Seç (Kaynak Depodaki Stokta Olanlar)</DialogTitle>
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
                  {fromWarehouseId ? (
                    <p>Kaynak depoda stokta ürün bulunamadı</p>
                  ) : (
                    <p>Önce kaynak depo seçin</p>
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
                        <TableCell className="text-right">
                          <Badge variant="outline" className="mr-2">
                            {product.available_stock.toLocaleString('tr-TR')} {product.unit || "adet"}
                          </Badge>
                        </TableCell>
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

