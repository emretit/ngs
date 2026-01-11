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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowDownToLine, Plus, X, Search, Package } from "lucide-react";
import { useInventoryTransactions } from "@/hooks/useInventoryTransactions";
import { Product } from "@/types/product";
import { toast } from "sonner";

interface TransactionItem {
  product_id: string;
  product_name: string;
  product_sku?: string;
  unit: string;
  quantity: number;
  unit_cost?: number;
  notes?: string;
}

export default function NewStockEntry() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const warehouseIdFromUrl = searchParams.get("warehouse_id");
  
  const { createTransaction } = useInventoryTransactions();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouseIdFromUrl || "");
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      warehouse_id: warehouseIdFromUrl || "",
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

  // Ürünleri getir
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["products", productSearchQuery],
    queryFn: async () => {
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
  });

  const addProduct = (product: Product) => {
    // Ürün zaten ekli mi kontrol et
    if (items.some(item => item.product_id === product.id)) {
      toast.warning("Bu ürün zaten listede");
      return;
    }

    const newItem: TransactionItem = {
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      unit: product.unit || "adet",
      quantity: 1,
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
    setItems(newItems);
  };

  const onSubmit = async (data: any) => {
    if (!selectedWarehouseId) {
      toast.error("Lütfen bir depo seçin");
      return;
    }

    if (items.length === 0) {
      toast.error("En az bir ürün eklemelisiniz");
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
        transaction_type: 'giris',
        warehouse_id: selectedWarehouseId,
        transaction_date: data.transaction_date,
        reference_number: data.reference_number || undefined,
        notes: data.notes || undefined,
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          unit_cost: item.unit_cost || undefined,
          notes: item.notes || undefined,
        })),
      });

      toast.success("Stok girişi başarıyla oluşturuldu");
      navigate("/inventory/transactions");
    } catch (error: any) {
      logger.error("Error creating stock entry:", error);
      toast.error(error.message || "Stok girişi oluşturulurken hata oluştu");
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
          <h1 className="text-3xl font-bold">Yeni Stok Girişi</h1>
          <p className="text-muted-foreground">Depoya stok girişi yapın</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* İşlem Bilgileri */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-green-600" />
              İşlem Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warehouse_id">Depo *</Label>
                <Select
                  value={selectedWarehouseId}
                  onValueChange={(value) => {
                    setSelectedWarehouseId(value);
                    setValue("warehouse_id", value);
                  }}
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
              <CardTitle>Ürünler</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsProductDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ürün Ekle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Henüz ürün eklenmedi</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsProductDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Ürünü Ekle
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead className="text-right">Miktar</TableHead>
                    <TableHead className="text-right">Birim</TableHead>
                    <TableHead className="text-right">Birim Maliyet</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
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
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity || ""}
                          onChange={(e) => updateItem(index, "quantity", Number(e.target.value) || 0)}
                          className="w-32 ml-auto text-right"
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.unit}
                      </TableCell>
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
                  ))}
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
            disabled={!selectedWarehouseId || items.length === 0 || isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Kaydediliyor..." : "Stok Girişini Kaydet"}
          </Button>
        </div>
      </form>

      {/* Ürün Seçim Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Ürün Seç</DialogTitle>
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
              {isLoadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Yükleniyor...</p>
                  </div>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Ürün bulunamadı</p>
                </div>
              ) : (
                <Table>
                  <TableBody>
                    {products.map((product) => (
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
                          <Badge variant="outline">{product.unit || "adet"}</Badge>
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

