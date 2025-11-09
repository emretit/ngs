import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Warehouse, AlertTriangle, CheckCircle, Edit2, Plus, X, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ProductWarehouseStockProps {
  productId: string;
  totalStock: number;
  unit: string;
}

const ProductWarehouseStock = ({ 
  productId, 
  totalStock,
  unit 
}: ProductWarehouseStockProps) => {
  const queryClient = useQueryClient();
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  // Aktif depoları getir
  const { data: availableWarehouses = [] } = useQuery({
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
        .select("id, name, code, warehouse_type")
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });

  // Depoları ve stok dağılımını getir
  const { data: warehouseStock, isLoading, refetch } = useQuery({
    queryKey: ["product_warehouse_stock", productId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) return [];

      // Warehouse_stock tablosundan gerçek stok verilerini çek
      const { data: stockData, error: stockError } = await supabase
        .from("warehouse_stock")
        .select(`
          id,
          quantity,
          reserved_quantity,
          available_quantity,
          last_transaction_date,
          warehouse_id,
          warehouses (
            id,
            name,
            code,
            warehouse_type
          )
        `)
        .eq("product_id", productId)
        .eq("company_id", profile.company_id)
        .order("warehouses(name)");

      if (stockError) throw stockError;

      // Eğer hiç warehouse_stock kaydı yoksa, aktif depoları göster (stok 0 ile)
      if (!stockData || stockData.length === 0) {
        const { data: warehouses, error: warehousesError } = await supabase
          .from("warehouses")
          .select("id, name, code, warehouse_type")
          .eq("company_id", profile.company_id)
          .eq("is_active", true)
          .order("name");

        if (warehousesError) throw warehousesError;

        return (warehouses || []).map((warehouse) => ({
          warehouse_id: warehouse.id,
          warehouse_name: warehouse.name,
          warehouse_code: warehouse.code,
          warehouse_type: warehouse.warehouse_type,
          stock_quantity: 0,
          reserved_quantity: 0,
          available_quantity: 0,
          last_transaction_date: null,
        }));
      }

      // Warehouse_stock verilerini formatla
      return stockData.map((stock) => ({
        id: stock.id, // warehouse_stock kayıt ID'si
        warehouse_id: stock.warehouse_id,
        warehouse_name: (stock.warehouses as any)?.name || 'Bilinmeyen Depo',
        warehouse_code: (stock.warehouses as any)?.code,
        warehouse_type: (stock.warehouses as any)?.warehouse_type,
        stock_quantity: Number(stock.quantity) || 0,
        reserved_quantity: Number(stock.reserved_quantity) || 0,
        available_quantity: Number(stock.available_quantity) || 0,
        last_transaction_date: stock.last_transaction_date,
      }));
    },
  });

  if (isLoading) {
    return (
      <Card className="rounded-xl">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-50/50 border border-indigo-200/50">
              <Warehouse className="h-4 w-4 text-indigo-600" />
            </div>
            Depo Bazlı Stok Dağılımı
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const warehouses = warehouseStock || [];
  const hasStockData = warehouses.some(w => w.stock_quantity > 0);
  const totalWarehouseStock = warehouses.reduce((sum, w) => sum + (w.stock_quantity || 0), 0);

  // Kullanılan depo ID'lerini al
  const usedWarehouseIds = warehouses.map(w => w.warehouse_id);
  // Kullanılmayan depoları filtrele
  const unusedWarehouses = availableWarehouses.filter(w => !usedWarehouseIds.includes(w.id));

  const handleEditStart = (warehouseId: string, currentQuantity: number) => {
    setEditingStockId(warehouseId);
    setEditQuantity(currentQuantity);
  };

  const handleEditCancel = () => {
    setEditingStockId(null);
    setEditQuantity(0);
  };

  const handleEditSave = async (warehouseStockId: string | undefined, warehouseId: string) => {
    setIsSaving(true);
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

      if (warehouseStockId) {
        // Mevcut stok kaydını güncelle
        const { error } = await supabase
          .from("warehouse_stock")
          .update({
            quantity: editQuantity,
            last_transaction_date: new Date().toISOString()
          })
          .eq("id", warehouseStockId)
          .eq("company_id", profile.company_id);

        if (error) throw error;
      } else {
        // Yeni stok kaydı oluştur
        const { error } = await supabase
          .from("warehouse_stock")
          .insert({
            company_id: profile.company_id,
            product_id: productId,
            warehouse_id: warehouseId,
            quantity: editQuantity,
            reserved_quantity: 0,
            last_transaction_date: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast.success("Stok güncellendi");
      setEditingStockId(null);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error: any) {
      console.error("Error updating stock:", error);
      toast.error(error.message || "Stok güncellenirken hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddStock = async () => {
    if (!selectedWarehouseId || newQuantity <= 0) {
      toast.error("Lütfen depo seçin ve geçerli bir miktar girin");
      return;
    }

    setIsSaving(true);
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

      // Mevcut stok kaydını kontrol et
      const { data: existingStock } = await supabase
        .from("warehouse_stock")
        .select("id, quantity")
        .eq("product_id", productId)
        .eq("warehouse_id", selectedWarehouseId)
        .eq("company_id", profile.company_id)
        .maybeSingle();

      if (existingStock) {
        // Mevcut stoku güncelle
        const { error } = await supabase
          .from("warehouse_stock")
          .update({
            quantity: newQuantity,
            last_transaction_date: new Date().toISOString()
          })
          .eq("id", existingStock.id);

        if (error) throw error;
      } else {
        // Yeni stok kaydı oluştur
        const { error } = await supabase
          .from("warehouse_stock")
          .insert({
            company_id: profile.company_id,
            product_id: productId,
            warehouse_id: selectedWarehouseId,
            quantity: newQuantity,
            reserved_quantity: 0,
            last_transaction_date: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast.success("Stok eklendi");
      setIsAddDialogOpen(false);
      setSelectedWarehouseId("");
      setNewQuantity(0);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error: any) {
      console.error("Error adding stock:", error);
      toast.error(error.message || "Stok eklenirken hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
    <Card className="rounded-xl">
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-50/50 border border-indigo-200/50">
              <Warehouse className="h-4 w-4 text-indigo-600" />
            </div>
            Depo Bazlı Stok Dağılımı
          </CardTitle>
          {(unusedWarehouses.length > 0 || warehouses.length === 0) && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Stok Ekle
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {warehouses.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500">
            Aktif depo bulunamadı
          </div>
        ) : (
          <div className="space-y-3">
            {/* Toplam Stok */}
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
              <span className="text-xs font-medium text-gray-700">Toplam Stok</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">
                  {totalWarehouseStock > 0 ? totalWarehouseStock : totalStock} {unit}
                </span>
                {(totalWarehouseStock > 0 || totalStock > 0) ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>

            {/* Depo Listesi */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {warehouses.map((warehouse) => {
                const isEditing = editingStockId === warehouse.warehouse_id;
                const warehouseStockId = (warehouse as any).id; // warehouse_stock kayıt ID'si

                return (
                  <div
                    key={warehouse.warehouse_id}
                    className="flex justify-between items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Warehouse className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900">
                          {warehouse.warehouse_name}
                          {warehouse.warehouse_code && (
                            <span className="text-gray-500 ml-1">
                              ({warehouse.warehouse_code})
                            </span>
                          )}
                        </div>
                        {warehouse.warehouse_type && (
                          <Badge 
                            variant="outline" 
                            className="text-xs mt-0.5"
                          >
                            {warehouse.warehouse_type === 'main' ? 'Ana Depo' :
                             warehouse.warehouse_type === 'sub' ? 'Alt Depo' :
                             warehouse.warehouse_type === 'virtual' ? 'Sanal Depo' :
                             warehouse.warehouse_type === 'transit' ? 'Transit' : warehouse.warehouse_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Input
                            type="number"
                            min="0"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(Number(e.target.value) || 0)}
                            className="w-20 h-7 text-xs text-right"
                            autoFocus
                          />
                          <span className="text-xs text-gray-500">{unit}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditSave(warehouseStockId, warehouse.warehouse_id)}
                            disabled={isSaving}
                          >
                            <Save className="h-3 w-3 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleEditCancel}
                            disabled={isSaving}
                          >
                            <X className="h-3 w-3 text-red-600" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                              {warehouse.stock_quantity > 0 ? (
                                <>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {warehouse.stock_quantity} {unit}
                                  </span>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </>
                              ) : (
                                <>
                                  <span className="text-sm text-gray-400">0 {unit}</span>
                                </>
                              )}
                            </div>
                            {warehouse.reserved_quantity > 0 && (
                              <div className="text-xs text-orange-600">
                                Rezerve: {warehouse.reserved_quantity} {unit}
                              </div>
                            )}
                            {warehouse.available_quantity !== warehouse.stock_quantity && warehouse.stock_quantity > 0 && (
                              <div className="text-xs text-blue-600">
                                Kullanılabilir: {warehouse.available_quantity} {unit}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditStart(warehouse.warehouse_id, warehouse.stock_quantity)}
                            title="Stok Düzenle"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {warehouses.length > 0 && totalWarehouseStock === 0 && totalStock === 0 && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-700">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  Bu ürünün hiçbir deposunda stok bulunmuyor. 
                  Stok girişi yapıldığında burada görünecek.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Stok Ekleme Dialog */}
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Depoya Stok Ekle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="warehouse">Depo Seçin</Label>
            <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
              <SelectTrigger>
                <SelectValue placeholder="Depo seçin" />
              </SelectTrigger>
              <SelectContent>
                {unusedWarehouses.length > 0 ? (
                  unusedWarehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                      {warehouse.code && ` (${warehouse.code})`}
                    </SelectItem>
                  ))
                ) : (
                  availableWarehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                      {warehouse.code && ` (${warehouse.code})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Stok Miktarı ({unit})</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={newQuantity || ""}
              onChange={(e) => setNewQuantity(Number(e.target.value) || 0)}
              placeholder="Miktar girin"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsAddDialogOpen(false);
              setSelectedWarehouseId("");
              setNewQuantity(0);
            }}
            disabled={isSaving}
          >
            İptal
          </Button>
          <Button onClick={handleAddStock} disabled={isSaving || !selectedWarehouseId || newQuantity <= 0}>
            {isSaving ? "Ekleniyor..." : "Ekle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default ProductWarehouseStock;

