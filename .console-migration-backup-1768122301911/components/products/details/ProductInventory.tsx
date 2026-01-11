import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, Edit2, Warehouse, Plus, X, Save, AlertTriangle, CheckCircle, Settings, ArrowRightLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductInventoryProps {
  productId: string;
  stockQuantity: number;
  minStockLevel: number;
  stockThreshold?: number;
  unit: string;
  supplier: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  lastPurchaseDate: string | null;
  onUpdate: (updates: {
    stock_quantity?: number;
    min_stock_level?: number;
    stock_threshold?: number;
  }) => void;
}

const ProductInventory = ({ 
  productId,
  stockQuantity, 
  minStockLevel,
  stockThreshold,
  unit,
  supplier,
  lastPurchaseDate,
  onUpdate
}: ProductInventoryProps) => {
  const queryClient = useQueryClient();
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editValues, setEditValues] = useState({
    minStockLevel,
    stockThreshold: stockThreshold || minStockLevel
  });
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [transferFromWarehouseId, setTransferFromWarehouseId] = useState<string>("");
  const [transferToWarehouseId, setTransferToWarehouseId] = useState<string>("");
  const [transferQuantity, setTransferQuantity] = useState<number>(0);

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
        id: stock.id,
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

  const warehouses = warehouseStock || [];
  const totalWarehouseStock = warehouses.reduce((sum, w) => sum + (w.stock_quantity || 0), 0);
  const usedWarehouseIds = warehouses.map(w => w.warehouse_id);
  const unusedWarehouses = availableWarehouses.filter(w => !usedWarehouseIds.includes(w.id));

  const handleSaveSettings = () => {
    onUpdate({
      min_stock_level: Number(editValues.minStockLevel),
      stock_threshold: Number(editValues.stockThreshold)
    });
    setIsEditingSettings(false);
  };

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

      const { data: existingStock } = await supabase
        .from("warehouse_stock")
        .select("id, quantity")
        .eq("product_id", productId)
        .eq("warehouse_id", selectedWarehouseId)
        .eq("company_id", profile.company_id)
        .maybeSingle();

      if (existingStock) {
        const { error } = await supabase
          .from("warehouse_stock")
          .update({
            quantity: newQuantity,
            last_transaction_date: new Date().toISOString()
          })
          .eq("id", existingStock.id);

        if (error) throw error;
      } else {
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

  const handleTransferStock = async () => {
    if (!transferFromWarehouseId || !transferToWarehouseId || transferQuantity <= 0) {
      toast.error("Lütfen kaynak ve hedef depo seçin ve geçerli bir miktar girin");
      return;
    }

    if (transferFromWarehouseId === transferToWarehouseId) {
      toast.error("Kaynak ve hedef depo aynı olamaz");
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

      // Kaynak depodan stok kontrolü
      const { data: fromStock } = await supabase
        .from("warehouse_stock")
        .select("id, quantity")
        .eq("product_id", productId)
        .eq("warehouse_id", transferFromWarehouseId)
        .eq("company_id", profile.company_id)
        .maybeSingle();

      if (!fromStock || Number(fromStock.quantity) < transferQuantity) {
        toast.error("Kaynak depoda yeterli stok bulunmuyor");
        return;
      }

      // Kaynak depodan stok azalt
      const { error: fromError } = await supabase
        .from("warehouse_stock")
        .update({
          quantity: Number(fromStock.quantity) - transferQuantity,
          last_transaction_date: new Date().toISOString()
        })
        .eq("id", fromStock.id);

      if (fromError) throw fromError;

      // Hedef depoya stok ekle
      const { data: toStock } = await supabase
        .from("warehouse_stock")
        .select("id, quantity")
        .eq("product_id", productId)
        .eq("warehouse_id", transferToWarehouseId)
        .eq("company_id", profile.company_id)
        .maybeSingle();

      if (toStock) {
        // Mevcut stoku güncelle
        const { error: toError } = await supabase
          .from("warehouse_stock")
          .update({
            quantity: Number(toStock.quantity) + transferQuantity,
            last_transaction_date: new Date().toISOString()
          })
          .eq("id", toStock.id);

        if (toError) throw toError;
      } else {
        // Yeni stok kaydı oluştur
        const { error: toError } = await supabase
          .from("warehouse_stock")
          .insert({
            company_id: profile.company_id,
            product_id: productId,
            warehouse_id: transferToWarehouseId,
            quantity: transferQuantity,
            reserved_quantity: 0,
            last_transaction_date: new Date().toISOString()
          });

        if (toError) throw toError;
      }

      toast.success("Stok transferi tamamlandı");
      setIsTransferDialogOpen(false);
      setTransferFromWarehouseId("");
      setTransferToWarehouseId("");
      setTransferQuantity(0);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error: any) {
      console.error("Error transferring stock:", error);
      toast.error(error.message || "Stok transferi sırasında hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  const showThreshold = stockThreshold && stockThreshold !== minStockLevel;
  const isLowStock = stockQuantity <= (stockThreshold || minStockLevel);

  if (isLoading) {
    return (
      <Card className="rounded-lg border border-gray-200">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
              <Archive className="h-4 w-4 text-blue-600" />
            </div>
            Stok Yönetimi
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

  return (
    <>
    <Card className="rounded-lg border border-gray-200">
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
              <Archive className="h-4 w-4 text-blue-600" />
            </div>
            Stok Yönetimi
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {(unusedWarehouses.length > 0 || warehouses.length === 0) && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Ekle
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsEditingSettings(!isEditingSettings)}
              title="Stok Ayarlarını Düzenle"
            >
              <Settings className="h-3.5 w-3.5 text-gray-500" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Toplam Stok ve Ayarlar - Sade Tasarım */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-gray-600" />
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Toplam Stok</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-semibold text-gray-900">
                    {totalWarehouseStock > 0 ? totalWarehouseStock : stockQuantity}
                  </span>
                  <span className="text-xs text-gray-500">{unit}</span>
                </div>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-gray-500">Min. Seviye:</span>
                {isEditingSettings ? (
                  <Input
                    type="number"
                    min="0"
                    value={editValues.minStockLevel}
                    onChange={(e) => setEditValues(prev => ({
                      ...prev,
                      minStockLevel: Number(e.target.value) || 0
                    }))}
                    className="h-6 w-16 text-xs text-right"
                  />
                ) : (
                  <span className="text-xs font-medium text-gray-700">{minStockLevel} {unit}</span>
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-gray-500">Alarm Eşiği:</span>
                {isEditingSettings ? (
                  <Input
                    type="number"
                    min="0"
                    value={editValues.stockThreshold}
                    onChange={(e) => setEditValues(prev => ({
                      ...prev,
                      stockThreshold: Number(e.target.value) || 0
                    }))}
                    className="h-6 w-16 text-xs text-right"
                  />
                ) : (
                  <span className="text-xs font-medium text-gray-700">{stockThreshold || minStockLevel} {unit}</span>
                )}
              </div>
            </div>
          </div>
          {isEditingSettings && (
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setEditValues({
                    minStockLevel,
                    stockThreshold: stockThreshold || minStockLevel
                  });
                  setIsEditingSettings(false);
                }}
              >
                İptal
              </Button>
              <Button size="sm" className="h-6 text-xs" onClick={handleSaveSettings}>
                Kaydet
              </Button>
            </div>
          )}

          {/* Depo Bazlı Stok Dağılımı - Toplam Stok Altında */}
          {warehouses.length > 0 && (
            <div className="pt-2 border-t border-gray-200 mt-2">
              <div className="space-y-1 max-h-[280px] overflow-y-auto">
                {warehouses.map((warehouse) => {
                const isEditing = editingStockId === warehouse.warehouse_id;
                const warehouseStockId = (warehouse as any).id;

                return (
                  <div
                    key={warehouse.warehouse_id}
                    className="flex justify-between items-center p-1.5 border border-gray-200 rounded hover:bg-white transition-colors bg-white"
                  >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <Warehouse className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-900 truncate">
                          {warehouse.warehouse_name}
                          {warehouse.warehouse_code && (
                            <span className="text-gray-400 ml-1 text-[10px]">
                              ({warehouse.warehouse_code})
                            </span>
                          )}
                        </div>
                        {warehouse.warehouse_type && (
                          <span className="text-[10px] text-gray-400">
                            {warehouse.warehouse_type === 'main' ? 'Ana' :
                             warehouse.warehouse_type === 'sub' ? 'Alt' :
                             warehouse.warehouse_type === 'virtual' ? 'Sanal' :
                             warehouse.warehouse_type === 'transit' ? 'Transit' : warehouse.warehouse_type}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
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
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-gray-900">
                              {warehouse.stock_quantity} {unit}
                            </span>
                            {warehouse.stock_quantity > 0 && (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-0.5">
                            {warehouse.stock_quantity > 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  setTransferFromWarehouseId(warehouse.warehouse_id);
                                  setIsTransferDialogOpen(true);
                                }}
                                title="Depo Transferi"
                              >
                                <ArrowRightLeft className="h-3 w-3 text-gray-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleEditStart(warehouse.warehouse_id, warehouse.stock_quantity)}
                              title="Stok Düzenle"
                            >
                              <Edit2 className="h-3 w-3 text-gray-500" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {warehouses.length === 0 && (
            <div className="pt-2 border-t border-gray-200 mt-2">
              <div className="text-center py-3 text-xs text-gray-400">
                <Warehouse className="h-5 w-5 mx-auto mb-1 text-gray-300" />
                <p>Aktif depo bulunamadı</p>
              </div>
            </div>
          )}

          {warehouses.length > 0 && totalWarehouseStock === 0 && stockQuantity === 0 && (
            <div className="pt-2 border-t border-gray-200 mt-2">
              <div className="p-1.5 bg-gray-50 border border-gray-200 rounded">
                <p className="text-xs text-gray-600">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  Stok bulunmuyor. "Stok Ekle" butonunu kullanın.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Ek Bilgiler - Kompakt */}
        {(supplier || lastPurchaseDate) && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              {supplier && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-600">Tedarikçi:</span>
                  <span className="font-medium text-gray-900">{supplier.name}</span>
                  {(supplier.email || supplier.phone) && (
                    <span className="text-gray-400">•</span>
                  )}
                  {supplier.email && (
                    <span className="text-gray-500">{supplier.email}</span>
                  )}
                  {supplier.phone && supplier.email && (
                    <span className="text-gray-400">•</span>
                  )}
                  {supplier.phone && (
                    <span className="text-gray-500">{supplier.phone}</span>
                  )}
                </div>
              )}
              {lastPurchaseDate && (
                <>
                  {supplier && <span className="text-gray-300">|</span>}
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-600">Son Alım:</span>
                    <span className="font-medium text-gray-900">{format(new Date(lastPurchaseDate), 'dd.MM.yyyy')}</span>
                  </div>
                </>
              )}
            </div>
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

    {/* Depo Transferi Dialog */}
    <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Depo Arası Transfer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Kaynak Depo</Label>
            <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm">
              {warehouses.find(w => w.warehouse_id === transferFromWarehouseId)?.warehouse_name || "-"}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="transfer-to">Hedef Depo</Label>
            <Select 
              value={transferToWarehouseId} 
              onValueChange={setTransferToWarehouseId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Hedef depo seçin" />
              </SelectTrigger>
              <SelectContent>
                {availableWarehouses
                  .filter(w => w.id !== transferFromWarehouseId)
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
            <Label htmlFor="transfer-quantity">
              Transfer Miktarı ({unit})
              {transferFromWarehouseId && (
                <span className="text-xs text-gray-500 ml-2">
                  (Mevcut: {warehouses.find(w => w.warehouse_id === transferFromWarehouseId)?.stock_quantity || 0})
                </span>
              )}
            </Label>
            <Input
              id="transfer-quantity"
              type="number"
              min="0"
              max={warehouses.find(w => w.warehouse_id === transferFromWarehouseId)?.stock_quantity || 0}
              value={transferQuantity || ""}
              onChange={(e) => setTransferQuantity(Number(e.target.value) || 0)}
              placeholder="Miktar girin"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsTransferDialogOpen(false);
              setTransferFromWarehouseId("");
              setTransferToWarehouseId("");
              setTransferQuantity(0);
            }}
            disabled={isSaving}
          >
            İptal
          </Button>
          <Button 
            onClick={handleTransferStock} 
            disabled={isSaving || !transferToWarehouseId || transferQuantity <= 0 || transferQuantity > (warehouses.find(w => w.warehouse_id === transferFromWarehouseId)?.stock_quantity || 0)}
          >
            {isSaving ? "Transfer ediliyor..." : "Transfer Et"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default ProductInventory;

