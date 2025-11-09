import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { InventoryTransaction, TransactionStatus, TransactionType } from "@/types/inventory";
import { useInventoryTransactions } from "@/hooks/useInventoryTransactions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
  Warehouse, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowRightLeft, 
  ClipboardList,
  Package,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Edit2
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface InventoryTransactionDetailsProps {
  transaction: InventoryTransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

const InventoryTransactionDetails = ({ transaction, isOpen, onClose }: InventoryTransactionDetailsProps) => {
  const queryClient = useQueryClient();
  const { updateTransaction, approveTransaction, cancelTransaction, fetchTransactionById } = useInventoryTransactions();
  
  const [notes, setNotes] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [status, setStatus] = useState<TransactionStatus>("pending");

  // Transaction'ı detaylı olarak fetch et (items bilgisi için)
  const { data: fullTransaction } = useQuery({
    queryKey: ["inventory_transaction", transaction?.id],
    queryFn: () => transaction ? fetchTransactionById(transaction.id) : null,
    enabled: !!transaction && isOpen,
  });

  const displayTransaction = fullTransaction || transaction;

  // Transaction değiştiğinde state'leri güncelle
  useEffect(() => {
    if (displayTransaction) {
      setNotes(displayTransaction.notes || "");
      setReferenceNumber(displayTransaction.reference_number || "");
      setStatus(displayTransaction.status);
    }
  }, [displayTransaction]);

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'giris':
        return <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">⬇️ Stok Girişi</Badge>;
      case 'cikis':
        return <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">⬆️ Stok Çıkışı</Badge>;
      case 'transfer':
        return <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">↔️ Depo Transferi</Badge>;
      case 'sayim':
        return <Badge variant="outline" className="border-purple-500 text-purple-700 bg-purple-50">📋 Stok Sayımı</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-orange-500 text-orange-700 bg-orange-50">⏳ Bekleyen</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">✅ Onaylı</Badge>;
      case 'completed':
        return <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">✔️ Tamamlandı</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">❌ İptal</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'giris':
        return <ArrowDownToLine className="h-4 w-4 text-green-600" />;
      case 'cikis':
        return <ArrowUpFromLine className="h-4 w-4 text-red-600" />;
      case 'transfer':
        return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
      case 'sayim':
        return <ClipboardList className="h-4 w-4 text-purple-600" />;
      default:
        return null;
    }
  };

  const handleSaveChanges = async () => {
    if (!displayTransaction) return;
    
    try {
      await updateTransaction(displayTransaction.id, {
        notes: notes || undefined,
        reference_number: referenceNumber || undefined,
        status: status,
      });
      toast.success("İşlem başarıyla güncellendi");
      queryClient.invalidateQueries({ queryKey: ["inventory_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_transaction", displayTransaction.id] });
    } catch (error: any) {
      toast.error(error.message || "İşlem güncellenirken hata oluştu");
    }
  };

  const handleApprove = async () => {
    if (!displayTransaction) return;
    
    try {
      await approveTransaction(displayTransaction.id);
      toast.success("İşlem onaylandı ve stok güncellendi");
      queryClient.invalidateQueries({ queryKey: ["inventory_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_transaction", displayTransaction.id] });
      onClose();
    } catch (error: any) {
      toast.error(error.message || "İşlem onaylanırken hata oluştu");
    }
  };

  const handleCancel = async () => {
    if (!displayTransaction) return;
    
    if (window.confirm(`${displayTransaction.transaction_number} numaralı işlemi iptal etmek istediğinize emin misiniz?`)) {
      try {
        await cancelTransaction(displayTransaction.id);
        toast.success("İşlem iptal edildi");
        queryClient.invalidateQueries({ queryKey: ["inventory_transactions"] });
        queryClient.invalidateQueries({ queryKey: ["inventory_transaction", displayTransaction.id] });
        onClose();
      } catch (error: any) {
        toast.error(error.message || "İşlem iptal edilirken hata oluştu");
      }
    }
  };

  if (!displayTransaction) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg md:max-w-xl overflow-hidden p-0 flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            <h2 className="text-base font-semibold text-gray-900">İşlem Detayları</h2>
          </div>
          <div className="flex items-center gap-1.5">
            {getTypeIcon(displayTransaction.transaction_type)}
            {getTypeBadge(displayTransaction.transaction_type)}
          </div>
        </div>
          
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pr-1 -mr-1">
          <div className="p-3 space-y-3">
            {/* Temel Bilgiler */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-900">Temel Bilgiler</h3>
                {getStatusBadge(status)}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <Label className="text-[10px] font-medium text-gray-600">İşlem No</Label>
                  <div className="text-xs font-medium text-gray-900">{displayTransaction.transaction_number}</div>
                </div>
                
                <div className="space-y-0.5">
                  <Label className="text-[10px] font-medium text-gray-600">Tarih</Label>
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    {format(new Date(displayTransaction.transaction_date), "dd MMM yyyy", { locale: tr })}
                  </div>
                </div>
              </div>

              {/* Depo Bilgileri */}
              {displayTransaction.transaction_type === 'transfer' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <Label className="text-[10px] font-medium text-gray-600 flex items-center gap-1">
                      <Warehouse className="h-2.5 w-2.5" />
                      Kaynak Depo
                    </Label>
                    <div className="text-xs text-gray-600">
                      {displayTransaction.from_warehouse_name || displayTransaction.from_warehouse?.name || '-'}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px] font-medium text-gray-600 flex items-center gap-1">
                      <Warehouse className="h-2.5 w-2.5" />
                      Hedef Depo
                    </Label>
                    <div className="text-xs text-gray-600">
                      {displayTransaction.to_warehouse_name || displayTransaction.to_warehouse?.name || '-'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <Label className="text-[10px] font-medium text-gray-600 flex items-center gap-1">
                    <Warehouse className="h-2.5 w-2.5" />
                    Depo
                  </Label>
                  <div className="text-xs text-gray-600">
                    {displayTransaction.warehouse_name || displayTransaction.warehouse?.name || '-'}
                  </div>
                </div>
              )}
            </div>

            {/* Referans ve Notlar */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-900">Ek Bilgiler</h3>
              
              <div className="space-y-0.5">
                <Label htmlFor="reference_number" className="text-[10px] font-medium text-gray-600">Referans No</Label>
                <Input 
                  id="reference_number"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Referans numarası"
                  className="h-7 text-xs"
                />
              </div>
              
              <div className="space-y-0.5">
                <Label htmlFor="notes" className="text-[10px] font-medium text-gray-600">Notlar</Label>
                <Textarea 
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="İşlem notları"
                  rows={2}
                  className="resize-none text-xs"
                />
              </div>
            </div>

            {/* Durum */}
            {displayTransaction.status === 'pending' && (
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-gray-600">Durum</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                  className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">⏳ Bekleyen</option>
                  <option value="approved">✅ Onaylı</option>
                  <option value="completed">✔️ Tamamlandı</option>
                  <option value="cancelled">❌ İptal</option>
                </select>
              </div>
            )}

            {/* Ürünler */}
            {displayTransaction.items && displayTransaction.items.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                  <Package className="h-3 w-3" />
                  Ürünler ({displayTransaction.items.length})
                </h3>
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="h-7 py-1 px-2 text-[10px] font-semibold">Ürün</TableHead>
                        <TableHead className="h-7 py-1 px-2 text-[10px] font-semibold text-right">Miktar</TableHead>
                        <TableHead className="h-7 py-1 px-2 text-[10px] font-semibold text-right">Birim Fiyat</TableHead>
                        <TableHead className="h-7 py-1 px-2 text-[10px] font-semibold text-right">Toplam</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayTransaction.items.map((item) => (
                        <TableRow key={item.id} className="h-7">
                          <TableCell className="py-1 px-2 text-xs">
                            <div>
                              <div className="font-medium">{item.product_name}</div>
                              {item.product?.sku && (
                                <div className="text-gray-500 text-[10px]">SKU: {item.product.sku}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-1 px-2 text-xs text-right">
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell className="py-1 px-2 text-xs text-right">
                            {item.unit_cost ? `${item.unit_cost.toFixed(2)} ₺` : '-'}
                          </TableCell>
                          <TableCell className="py-1 px-2 text-xs text-right font-medium">
                            {item.unit_cost ? `${(item.quantity * item.unit_cost).toFixed(2)} ₺` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* İşlem Geçmişi */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-gray-900">İşlem Geçmişi</h3>
              <div className="space-y-1.5">
                <div className="flex items-start space-x-1.5 p-1.5 bg-gray-50 rounded-md">
                  <div className="p-1 rounded-full bg-green-100 flex-shrink-0">
                    <CheckCircle2 className="h-2.5 w-2.5 text-green-600" />
                  </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-medium text-gray-900">İşlem Oluşturuldu</span>
                        <span className="text-[10px] text-gray-500 whitespace-nowrap">
                          {displayTransaction.created_at && format(new Date(displayTransaction.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-600 mt-0.5 truncate">
                        {displayTransaction.transaction_number} numaralı işlem oluşturuldu
                      </p>
                    </div>
                  </div>
                
                {displayTransaction.approved_at && (
                  <div className="flex items-start space-x-1.5 p-1.5 bg-gray-50 rounded-md">
                    <div className="p-1 rounded-full bg-blue-100 flex-shrink-0">
                      <CheckCircle2 className="h-2.5 w-2.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-medium text-gray-900">İşlem Onaylandı</span>
                        <span className="text-[10px] text-gray-500 whitespace-nowrap">
                          {format(new Date(displayTransaction.approved_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </span>
                      </div>
                      {displayTransaction.approved_by_employee && (
                        <p className="text-[10px] text-gray-600 mt-0.5 truncate">
                          {displayTransaction.approved_by_employee.first_name} {displayTransaction.approved_by_employee.last_name} tarafından onaylandı
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {displayTransaction.updated_at && displayTransaction.updated_at !== displayTransaction.created_at && (
                  <div className="flex items-start space-x-1.5 p-1.5 bg-gray-50 rounded-md">
                    <div className="p-1 rounded-full bg-gray-100 flex-shrink-0">
                      <Edit2 className="h-2.5 w-2.5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-medium text-gray-900">Son Güncelleme</span>
                        <span className="text-[10px] text-gray-500 whitespace-nowrap">
                          {format(new Date(displayTransaction.updated_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        Durum: {status === 'pending' && 'Bekleyen'}
                        {status === 'approved' && 'Onaylı'}
                        {status === 'completed' && 'Tamamlandı'}
                        {status === 'cancelled' && 'İptal'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-3 py-2 border-t bg-gray-50 flex items-center justify-end gap-2 flex-shrink-0">
          {displayTransaction.status === 'pending' && (
            <>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="mr-1.5 h-3 w-3" />
                İptal Et
              </Button>
              <Button
                onClick={handleApprove}
                size="sm"
                className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="mr-1.5 h-3 w-3" />
                Onayla
              </Button>
            </>
          )}
          <Button
            onClick={handleSaveChanges}
            size="sm"
            className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="mr-1.5 h-3 w-3" />
            Kaydet
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default InventoryTransactionDetails;

