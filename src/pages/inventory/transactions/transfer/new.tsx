import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, ArrowRightLeft, Plus, X, Search, Package, AlertTriangle } from "lucide-react";
import { useInventoryTransactions } from "@/hooks/useInventoryTransactions";
import { Product } from "@/types/product";
import { toast } from "sonner";

interface TransactionItem {
  product_id: string;
  product_name: string;
  product_sku?: string;
  unit: string;
  quantity: number;
  available_stock: number; // Kaynak depodaki mevcut stok
  notes?: string;
}

export default function NewStockTransfer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromWarehouseIdFromUrl = searchParams.get("from_warehouse_id");
  
  const { createTransaction } = useInventoryTransactions();
  const [fromWarehouseId, setFromWarehouseId] = useState<string>(fromWarehouseIdFromUrl || "");
  const [toWarehouseId, setToWarehouseId] = useState<string>("");
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      from_warehouse_id: fromWarehouseIdFromUrl || "",
      to_warehouse_id: "",
      transaction_date: new Date().toISOString().split('T')[0],
      reference_number: "",
      notes: "",
    },
  });

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
        .eq("company_id", profile.company_id)
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

    const newItem: TransactionItem = {
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

  const updateItem = (index: number, field: keyof TransactionItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Miktar güncellendiğinde stok kontrolü yap
    if (field === "quantity" && value > newItems[index].available_stock) {
      toast.warning(`Mevcut stok: ${newItems[index].available_stock} ${newItems[index].unit}`);
    }
    
    setItems(newItems);
  };

  const onSubmit = async (data: any) => {
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
        transaction_date: data.transaction_date,
        reference_number: data.reference_number || undefined,
        notes: data.notes || undefined,
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes || undefined,
        })),
      });

      toast.success("Depo transferi başarıyla oluşturuldu");
      navigate("/inventory/transactions");
    } catch (error: any) {
      console.error("Error creating stock transfer:", error);
      toast.error(error.message || "Depo transferi oluşturulurken hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/inventory/transactions")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Yeni Depo Transferi</h1>
          <p className="text-muted-foreground">Depolar arası stok transferi yapın</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* İşlem Bilgileri */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-600" />
              İşlem Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from_warehouse_id">Kaynak Depo *</Label>
                <Select
                  value={fromWarehouseId}
                  onValueChange={(value) => {
                    setFromWarehouseId(value);
                    setValue("from_warehouse_id", value);
                    // Kaynak depo değiştiğinde ürünleri temizle
                    setItems([]);
                  }}
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
                  onValueChange={(value) => {
                    setToWarehouseId(value);
                    setValue("to_warehouse_id", value);
                  }}
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
                <Label htmlFor="transaction_date">Tarih *</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  {...register("transaction_date", { required: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference_number">Referans No</Label>
                <Input
                  id="reference_number"
                  placeholder="Opsiyonel"
                  {...register("reference_number")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                placeholder="İşlem notları..."
                {...register("notes")}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ürün Listesi */}
        <Card className="p-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transfer Edilecek Ürünler</CardTitle>
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
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
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
                            <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
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
            )}
          </CardContent>
        </Card>

        {/* Butonlar */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/inventory/transactions")}
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={!fromWarehouseId || !toWarehouseId || items.length === 0 || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? "Kaydediliyor..." : "Transferi Kaydet"}
          </Button>
        </div>
      </form>

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
    </div>
  );
}

