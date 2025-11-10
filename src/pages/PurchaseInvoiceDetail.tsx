import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, Download, FileText, Calendar, User, Building2, Package, Warehouse, Receipt, DollarSign } from "lucide-react";
import { usePurchaseInvoices } from "@/hooks/usePurchaseInvoices";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUnit } from "@/utils/unitConstants";

interface PurchaseInvoiceDetailProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

interface InvoiceItem {
  id: string;
  product_id: string | null;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  line_total: number;
  product?: {
    id: string;
    name: string;
    sku: string | null;
  };
}

interface StockMovement {
  id: string;
  transaction_number: string;
  transaction_type: string;
  transaction_date: string;
  warehouse_name: string | null;
  quantity: number;
  unit: string;
  notes: string | null;
}

const PurchaseInvoiceDetail = ({ isCollapsed, setIsCollapsed }: PurchaseInvoiceDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchInvoiceById } = usePurchaseInvoices();
  const [invoice, setInvoice] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [movementsLoading, setMovementsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadInvoice();
      loadInvoiceItems();
    }
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const invoiceData = await fetchInvoiceById(id!);
      // Supplier bilgisini al
      if (invoiceData.supplier_id) {
        const { data: supplier } = await supabase
          .from("suppliers")
          .select("id, name, company, tax_number")
          .eq("id", invoiceData.supplier_id)
          .single();
        setInvoice({ ...invoiceData, supplier });
      } else {
        setInvoice(invoiceData);
      }
    } catch (error) {
      console.error("Error loading invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoiceItems = async () => {
    if (!id) return;
    try {
      setItemsLoading(true);
      const { data: items, error } = await supabase
        .from("purchase_invoice_items")
        .select(`
          *,
          product:products (
            id,
            name,
            sku
          )
        `)
        .eq("purchase_invoice_id", id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading invoice items:", error);
      } else {
        setInvoiceItems(items || []);
      }
    } catch (error) {
      console.error("Error loading invoice items:", error);
    } finally {
      setItemsLoading(false);
    }
  };

  const loadStockMovements = async () => {
    if (!invoice?.invoice_number) return;
    try {
      setMovementsLoading(true);
      // Company ID'yi al
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) return;

      // Bu faturaya ait stok hareketlerini bul
      const { data: transactions, error } = await supabase
        .from("inventory_transactions")
        .select(`
          id,
          transaction_number,
          transaction_type,
          transaction_date,
          warehouse_id,
          notes,
          items:inventory_transaction_items (
            quantity,
            unit
          ),
          warehouse:warehouses!inventory_transactions_warehouse_id_fkey (
            name
          )
        `)
        .eq("reference_number", invoice.invoice_number)
        .eq("company_id", profile.company_id)
        .eq("transaction_type", "giris")
        .order("transaction_date", { ascending: false });

      if (error) {
        console.error("Error loading stock movements:", error);
      } else if (transactions) {
        const movements: StockMovement[] = transactions.flatMap((transaction: any) => {
          if (!transaction.items || transaction.items.length === 0) return [];
          
          return transaction.items.map((item: any) => ({
            id: `${transaction.id}-${item.quantity}`,
            transaction_number: transaction.transaction_number,
            transaction_type: transaction.transaction_type,
            transaction_date: transaction.transaction_date,
            warehouse_name: transaction.warehouse?.name || null,
            quantity: Number(item.quantity) || 0,
            unit: item.unit || 'adet',
            notes: transaction.notes,
          }));
        });
        setStockMovements(movements);
      }
    } catch (error) {
      console.error("Error loading stock movements:", error);
    } finally {
      setMovementsLoading(false);
    }
  };

  useEffect(() => {
    if (invoice?.invoice_number) {
      loadStockMovements();
    }
  }, [invoice?.invoice_number]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TL',
      minimumFractionDigits: 2
    }).format(amount);
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">Beklemede</Badge>;
      case 'paid':
        return <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">Ödendi</Badge>;
      case 'partially_paid':
        return <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">Kısmi Ödendi</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">Gecikmiş</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="p-4 rounded-full bg-gray-100 mb-4">
          <FileText className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Fatura bulunamadı</h3>
        <p className="text-sm text-gray-500 mb-6">Aradığınız fatura mevcut değil veya silinmiş olabilir.</p>
        <Button
          variant="outline"
          onClick={() => navigate('/purchase-invoices')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Faturalara Dön
        </Button>
      </div>
    );
  }

  const totalAmount = invoice.total_amount || 0;
  const paidAmount = invoice.paid_amount || 0;
  const remainingAmount = totalAmount - paidAmount;
  const subtotal = invoiceItems.reduce((sum, item) => {
    const itemSubtotal = item.unit_price * item.quantity;
    const discountAmount = itemSubtotal * (item.discount_rate / 100);
    return sum + (itemSubtotal - discountAmount);
  }, 0);
  const taxTotal = invoiceItems.reduce((sum, item) => {
    const itemSubtotal = item.unit_price * item.quantity;
    const discountAmount = itemSubtotal * (item.discount_rate / 100);
    const afterDiscount = itemSubtotal - discountAmount;
    return sum + (afterDiscount * (item.tax_rate / 100));
  }, 0);

  return (
    <div className="space-y-4 p-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/purchase-invoices')}
          className="shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => navigate(`/purchase-invoices/edit/${id}`)}
            className="shadow-sm"
          >
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="shadow-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            PDF İndir
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Invoice Info */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b p-3">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Fatura & Tedarikçi Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Fatura Bilgileri */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Fatura No:</span>
                  <span className="font-semibold text-xs">{invoice.invoice_number || 'Henüz atanmadı'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Tarih:</span>
                  <span className="text-xs">
                    {invoice.invoice_date ? format(new Date(invoice.invoice_date), 'dd.MM.yyyy', { locale: tr }) : 'Belirtilmemiş'}
                  </span>
                </div>
                {invoice.due_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Vade:</span>
                    <span className="text-xs">{format(new Date(invoice.due_date), 'dd.MM.yyyy', { locale: tr })}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Kalem:</span>
                  <span className="font-medium text-xs">{invoiceItems.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Para Birimi:</span>
                  <span className="text-xs font-medium">{invoice.currency === 'TL' ? 'TL' : invoice.currency || 'TL'}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Ara Toplam:</span>
                  <span className="font-medium text-xs">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">KDV:</span>
                  <span className="font-medium text-xs">{formatCurrency(taxTotal)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t">
                  <span className="text-gray-700 font-medium text-xs">Toplam:</span>
                  <span className="text-base font-bold text-primary">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Ödenen:</span>
                  <span className="font-medium text-xs text-blue-600">{formatCurrency(paidAmount)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t">
                  <span className="text-gray-700 font-medium text-xs">Kalan:</span>
                  <span className="text-sm font-bold text-red-600">{formatCurrency(remainingAmount)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Durum:</span>
                  {getStatusBadge(invoice.status)}
                </div>
              </div>

              <Separator />

              {/* Tedarikçi Bilgileri */}
              <div className="p-2.5 rounded-lg text-xs bg-gray-50 border border-gray-200">
                <div className="mb-2">
                  <div className="font-semibold text-gray-900 text-sm mb-0.5">
                    {invoice.supplier?.name || 'Bilinmiyor'}
                  </div>
                  {invoice.supplier?.company && (
                    <div className="text-gray-600 text-xs">
                      {invoice.supplier.company}
                    </div>
                  )}
                  {invoice.supplier?.tax_number && (
                    <div className="text-gray-500 text-xs mt-0.5">
                      VKN: {invoice.supplier.tax_number}
                    </div>
                  )}
                </div>
              </div>

              {invoice.description && (
                <>
                  <Separator />
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Açıklama</div>
                    <div className="text-xs text-gray-700">{invoice.description}</div>
                  </div>
                </>
              )}

              {invoice.notes && (
                <>
                  <Separator />
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Notlar</div>
                    <div className="text-xs text-gray-700 whitespace-pre-wrap">{invoice.notes}</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Invoice Items */}
        <div className="lg:col-span-3 space-y-4">
          {/* Fatura Kalemleri */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-b p-3">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-orange-600" />
                Fatura Kalemleri
                <Badge variant="outline" className="ml-2 text-xs">{invoiceItems.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {itemsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : invoiceItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Fatura kalemleri bulunamadı</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="w-12 font-semibold text-xs">#</TableHead>
                        <TableHead className="font-semibold text-xs">Ürün</TableHead>
                        <TableHead className="text-right font-semibold text-xs">Miktar</TableHead>
                        <TableHead className="text-center font-semibold text-xs">Birim</TableHead>
                        <TableHead className="text-right font-semibold text-xs">Birim Fiyat</TableHead>
                        <TableHead className="text-right font-semibold text-xs">İndirim</TableHead>
                        <TableHead className="text-right font-semibold text-xs">KDV</TableHead>
                        <TableHead className="text-right font-semibold text-xs">Toplam</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceItems.map((item, index) => (
                        <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors border-gray-100">
                          <TableCell className="font-medium text-xs">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                              {index + 1}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-48">
                              <p className="font-medium text-gray-900 truncate text-sm mb-1">
                                {item.product_name}
                              </p>
                              {item.sku && (
                                <span className="text-xs text-gray-500">SKU: {item.sku}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-mono text-sm font-semibold text-gray-700">
                              {item.quantity.toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="text-xs font-medium text-gray-600">
                              {formatUnit(item.unit)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {formatCurrency(item.unit_price)}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.discount_rate > 0 ? (
                              <span className="text-red-600 text-xs">{item.discount_rate}%</span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs">{item.tax_rate}%</TableCell>
                          <TableCell className="text-right font-semibold text-gray-900">
                            {formatCurrency(item.line_total)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50 font-bold border-t-2 border-gray-300">
                        <TableCell colSpan={7} className="text-right text-sm">
                          Genel Toplam
                        </TableCell>
                        <TableCell className="text-right text-base">
                          {formatCurrency(invoiceItems.reduce((sum, item) => sum + (item.line_total || 0), 0))}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stok Hareketleri */}
          {stockMovements.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 border-b p-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-4 w-4 text-indigo-600" />
                  Stok Hareketleri
                  <Badge variant="outline" className="ml-2 text-xs">{stockMovements.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {movementsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200">
                          <TableHead className="font-semibold text-xs">İşlem No</TableHead>
                          <TableHead className="font-semibold text-xs">Tarih</TableHead>
                          <TableHead className="font-semibold text-xs">Depo</TableHead>
                          <TableHead className="text-right font-semibold text-xs">Miktar</TableHead>
                          <TableHead className="font-semibold text-xs">Notlar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockMovements.map((movement) => (
                          <TableRow key={movement.id} className="hover:bg-gray-50/50 transition-colors border-gray-100">
                            <TableCell className="font-medium text-xs">
                              {movement.transaction_number}
                            </TableCell>
                            <TableCell className="text-xs">
                              {format(new Date(movement.transaction_date), "dd.MM.yyyy", { locale: tr })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Warehouse className="h-3 w-3 text-gray-400" />
                                <span className="text-xs">{movement.warehouse_name || 'Belirtilmemiş'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-semibold text-green-600 text-xs">
                                +{movement.quantity.toFixed(2)} {formatUnit(movement.unit)}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-gray-500">
                              {movement.notes || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseInvoiceDetail;
