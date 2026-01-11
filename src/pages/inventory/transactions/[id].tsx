import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowRightLeft, 
  ClipboardList,
  Warehouse,
  Calendar,
  FileText,
  User,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useInventoryTransactions } from "@/hooks/useInventoryTransactions";
import { InventoryTransaction } from "@/types/inventory";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface SystemStockInfo {
  product_id: string;
  system_quantity: number;
}

export default function InventoryTransactionDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchTransactionById, approveTransaction, cancelTransaction } = useInventoryTransactions();
  const [systemStockMap, setSystemStockMap] = useState<Map<string, number>>(new Map());
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: transaction, isLoading, refetch } = useQuery<InventoryTransaction | null>({
    queryKey: ["inventory_transaction", id],
    queryFn: () => fetchTransactionById(id!),
    enabled: !!id,
  });

  // Sayım transaction'ı için sistem stoku bilgisini çek
  useEffect(() => {
    const fetchSystemStock = async () => {
      if (!transaction || transaction.transaction_type !== 'sayim' || !transaction.warehouse_id) {
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) return;

      const productIds = transaction.items?.map(item => item.product_id) || [];
      if (productIds.length === 0) return;

      const { data: stockData } = await supabase
        .from("warehouse_stock")
        .select("product_id, quantity")
        .eq("warehouse_id", transaction.warehouse_id)
        
        .in("product_id", productIds);

      if (stockData) {
        const stockMap = new Map<string, number>();
        stockData.forEach((stock: any) => {
          stockMap.set(stock.product_id, Number(stock.quantity) || 0);
        });
        setSystemStockMap(stockMap);
      }
    };

    fetchSystemStock();
  }, [transaction]);

  const handleApprove = () => {
    if (!id) return;
    setIsApproveDialogOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!id) return;

    setIsProcessing(true);
    try {
      await approveTransaction(id);
      await refetch();
      setIsApproveDialogOpen(false);
      navigate("/inventory/transactions");
    } catch (error: any) {
      toast.error(error.message || "İşlem onaylanırken hata oluştu");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveCancel = () => {
    setIsApproveDialogOpen(false);
  };

  const handleCancel = () => {
    if (!id) return;
    setIsCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!id) return;

    setIsProcessing(true);
    try {
      await cancelTransaction(id);
      await refetch();
      setIsCancelDialogOpen(false);
      navigate("/inventory/transactions");
    } catch (error: any) {
      toast.error(error.message || "İşlem iptal edilirken hata oluştu");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelCancel = () => {
    setIsCancelDialogOpen(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'giris':
        return <ArrowDownToLine className="h-5 w-5 text-green-600" />;
      case 'cikis':
        return <ArrowUpFromLine className="h-5 w-5 text-red-600" />;
      case 'transfer':
        return <ArrowRightLeft className="h-5 w-5 text-blue-600" />;
      case 'sayim':
        return <ClipboardList className="h-5 w-5 text-purple-600" />;
      default:
        return <Warehouse className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'giris':
        return 'Stok Girişi';
      case 'cikis':
        return 'Stok Çıkışı';
      case 'transfer':
        return 'Depo Transferi';
      case 'sayim':
        return 'Stok Sayımı';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Tamamlandı</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Onaylı</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-orange-300 text-orange-700">Bekliyor</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">İptal Edildi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">İşlem yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">İşlem Bulunamadı</h2>
          <p className="text-muted-foreground mb-4">Aradığınız stok hareketi bulunamadı veya silinmiş olabilir.</p>
          <Button onClick={() => navigate("/inventory/transactions")}>
            Stok Hareketleri Sayfasına Dön
          </Button>
        </div>
      </div>
    );
  }

  const canApprove = transaction.status === 'pending' || transaction.status === 'approved';
  const canCancel = transaction.status === 'pending' || transaction.status === 'approved';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/inventory/transactions")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              {getTypeIcon(transaction.transaction_type)}
              <h1 className="text-3xl font-bold">{getTypeLabel(transaction.transaction_type)}</h1>
              {getStatusBadge(transaction.status)}
            </div>
            <p className="text-muted-foreground mt-1">{transaction.transaction_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canApprove && (
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Onayla ve Tamamla
            </Button>
          )}
          {canCancel && (
            <Button variant="destructive" onClick={handleCancel}>
              <XCircle className="h-4 w-4 mr-2" />
              İptal Et
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Taraf - İşlem Bilgileri */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ürün Listesi */}
          <Card>
            <CardHeader>
              <CardTitle>Ürünler</CardTitle>
            </CardHeader>
            <CardContent>
              {transaction.items && transaction.items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead className="text-right">Miktar</TableHead>
                      <TableHead className="text-right">Birim</TableHead>
                      {transaction.transaction_type === 'sayim' && (
                        <>
                          <TableHead className="text-right">Sistem Stoku</TableHead>
                          <TableHead className="text-right">Fark</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transaction.items.map((item, index) => {
                      const systemStock = transaction.transaction_type === 'sayim' 
                        ? systemStockMap.get(item.product_id) || 0 
                        : null;
                      const difference = transaction.transaction_type === 'sayim' && systemStock !== null
                        ? Number(item.quantity) - systemStock
                        : null;
                      
                      return (
                        <TableRow key={item.id || index}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.product_name}</div>
                              {item.notes && (
                                <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {transaction.transaction_type === 'sayim' ? (
                              <span className="font-semibold text-purple-700">
                                {Number(item.quantity).toLocaleString('tr-TR')}
                                <span className="text-xs text-muted-foreground ml-1">(Fiziksel)</span>
                              </span>
                            ) : (
                              <span>{Number(item.quantity).toLocaleString('tr-TR')}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {item.unit}
                          </TableCell>
                          {transaction.transaction_type === 'sayim' && (
                            <>
                              <TableCell className="text-right text-muted-foreground">
                                {systemStock.toLocaleString('tr-TR')}
                              </TableCell>
                              <TableCell className="text-right">
                                {difference !== null && (
                                  <Badge 
                                    variant={difference > 0 ? "default" : difference < 0 ? "destructive" : "outline"}
                                    className={difference === 0 ? "bg-green-100 text-green-800 border-green-300" : ""}
                                  >
                                    {difference > 0 ? '+' : ''}{difference.toLocaleString('tr-TR')}
                                  </Badge>
                                )}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Bu işlemde ürün bulunmuyor</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sağ Taraf - İşlem Detayları */}
        <div className="space-y-6">
          {/* Sayım İşlemi için Bilgilendirme */}
          {transaction.transaction_type === 'sayim' && transaction.status === 'pending' && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-purple-800">
                  <AlertTriangle className="h-4 w-4" />
                  Sayım Onaylama Bilgisi
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-purple-700 space-y-2">
                <p>• Sayım onaylandığında, depodaki stok miktarları <strong>fiziksel sayım sonuçlarına</strong> göre güncellenecektir.</p>
                <p>• Sistem stoku ile fiziksel sayım arasındaki farklar otomatik olarak düzeltilecektir.</p>
                <p>• Bu işlem geri alınamaz. Lütfen sayım sonuçlarını kontrol edin.</p>
              </CardContent>
            </Card>
          )}

          {/* İşlem Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle>İşlem Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Tarih</span>
                </div>
                <p className="font-medium">
                  {format(new Date(transaction.transaction_date), 'dd MMMM yyyy', { locale: tr })}
                </p>
              </div>

              {transaction.warehouse_id && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Warehouse className="h-4 w-4" />
                    <span>Depo</span>
                  </div>
                  <p className="font-medium">{transaction.warehouse_name || transaction.warehouse?.name || '-'}</p>
                </div>
              )}

              {transaction.transaction_type === 'transfer' && (
                <>
                  {transaction.from_warehouse_id && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span>Kaynak Depo</span>
                      </div>
                      <p className="font-medium">{transaction.from_warehouse_name || '-'}</p>
                    </div>
                  )}
                  {transaction.to_warehouse_id && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span>Hedef Depo</span>
                      </div>
                      <p className="font-medium">{transaction.to_warehouse_name || '-'}</p>
                    </div>
                  )}
                </>
              )}

              {transaction.reference_number && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Referans No</span>
                  </div>
                  <p className="font-medium">{transaction.reference_number}</p>
                </div>
              )}

              {transaction.notes && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Notlar</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{transaction.notes}</p>
                </div>
              )}

              {transaction.created_at && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Oluşturulma</span>
                  </div>
                  <p className="text-sm">
                    {format(new Date(transaction.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                  </p>
                </div>
              )}

              {transaction.approved_at && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4" />
                    <span>Onaylanma</span>
                  </div>
                  <p className="text-sm">
                    {format(new Date(transaction.approved_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* İstatistikler */}
          {transaction.items && transaction.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Özet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Toplam Ürün</span>
                  <span className="font-medium">{transaction.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Toplam Miktar</span>
                  <span className="font-medium">
                    {transaction.items.reduce((sum, item) => sum + Number(item.quantity), 0).toLocaleString('tr-TR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Onay Dialog */}
      <ConfirmationDialogComponent
        open={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
        title="Stok Hareketini Onayla"
        description={
          transaction?.transaction_type === 'sayim' && transaction.items?.some(item => {
            const systemStock = systemStockMap.get(item.product_id) || 0;
            return Number(item.quantity) !== systemStock;
          })
            ? "Bu sayımı onayladığınızda, depodaki stok miktarları fiziksel sayım sonuçlarına göre güncellenecektir. Devam etmek istiyor musunuz?"
            : transaction
            ? `"${transaction.transaction_number}" numaralı işlemi onaylamak istediğinizden emin misiniz?`
            : "Bu işlemi onaylamak istediğinizden emin misiniz?"
        }
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        variant="default"
        onConfirm={handleApproveConfirm}
        onCancel={handleApproveCancel}
        isLoading={isProcessing}
      />

      {/* İptal Dialog */}
      <ConfirmationDialogComponent
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        title="Stok Hareketini İptal Et"
        description={
          transaction
            ? `"${transaction.transaction_number}" numaralı işlemi iptal etmek istediğinizden emin misiniz?`
            : "Bu işlemi iptal etmek istediğinizden emin misiniz?"
        }
        confirmText={t("common.cancel")}
        cancelText={t("common.close")}
        variant="default"
        onConfirm={handleCancelConfirm}
        onCancel={handleCancelCancel}
        isLoading={isProcessing}
      />
    </div>
  );
}

