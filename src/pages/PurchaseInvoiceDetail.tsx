import React, { useState, useEffect, useMemo } from "react";
import { logger } from '@/utils/logger';
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  FileText, 
  Calendar, 
  User, 
  Building2, 
  Package, 
  Warehouse, 
  Receipt, 
  DollarSign,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  Copy,
  Trash2,
  ExternalLink
} from "lucide-react";
import { usePurchaseInvoices } from "@/hooks/usePurchaseInvoices";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUnit } from "@/utils/unitConstants";
import { useCashflowCategories } from "@/hooks/useCashflowCategories";
import { useCashflowSubcategories } from "@/hooks/useCashflowSubcategories";

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
  
  // Kategori bilgilerini çek
  const { getCategoriesByType } = useCashflowCategories();
  const expenseCategories = getCategoriesByType('expense');
  const { subcategories: allSubcategories } = useCashflowSubcategories();
  
  // Seçili kategori adını bul
  const categoryName = useMemo(() => {
    if (!invoice?.category_id) return null;
    
    // Önce alt kategorilerde ara
    const subcategory = allSubcategories.find((sub) => sub.id === invoice.category_id);
    if (subcategory) {
      const parentCategory = expenseCategories.find((cat) => cat.id === subcategory.category_id);
      return `${parentCategory?.name || ''} > ${subcategory.name}`;
    }
    
    // Sonra kategorilerde ara
    const category = expenseCategories.find((cat) => cat.id === invoice.category_id);
    if (category) {
      return category.name;
    }
    
    return null;
  }, [invoice?.category_id, expenseCategories, allSubcategories]);

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
      // Supplier bilgisi artık fetchInvoiceById içinde dahil ediliyor
      setInvoice(invoiceData);
    } catch (error: any) {
      logger.error("Error loading invoice:", error);
      // Hata mesajı zaten toast ile gösterildi, burada sadece logluyoruz
      if (error?.message?.includes("bulunamadı")) {
        // Fatura bulunamadı durumunda invoice'u null yap ki "Fatura Bulunamadı" mesajı gösterilsin
        setInvoice(null);
      }
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
        logger.error("Error loading invoice items:", error);
      } else {
        setInvoiceItems(items || []);
      }
    } catch (error) {
      logger.error("Error loading invoice items:", error);
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
        
        .eq("transaction_type", "giris")
        .order("transaction_date", { ascending: false });

      if (error) {
        logger.error("Error loading stock movements:", error);
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
      logger.error("Error loading stock movements:", error);
    } finally {
      setMovementsLoading(false);
    }
  };

  useEffect(() => {
    if (invoice?.invoice_number) {
      loadStockMovements();
    }
  }, [invoice?.invoice_number]);

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    const currencyCode = currency === 'TL' ? 'TRY' : currency;
    const formatted = new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2
    }).format(amount);
    return formatted;
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
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Fatura detayları yükleniyor...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Fatura Bulunamadı</h3>
              <p className="text-gray-600 mb-4">Aradığınız fatura mevcut değil veya silinmiş olabilir.</p>
              <Button onClick={() => navigate('/purchase-invoices')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Faturalara Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAmount = invoice.total_amount || 0;
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
  const currency = invoice.currency || 'TRY';
  const exchangeRate = invoice.exchange_rate || null;
  const isForeignCurrency = currency !== 'TRY' && currency !== 'TL' && exchangeRate && exchangeRate > 0;
  
  // TRY karşılıklarını hesapla
  const totalAmountTRY = isForeignCurrency ? totalAmount * exchangeRate : totalAmount;
  const subtotalTRY = isForeignCurrency ? subtotal * exchangeRate : subtotal;
  const taxTotalTRY = isForeignCurrency ? taxTotal * exchangeRate : taxTotal;

  return (
    <div className="space-y-2">
      {/* Enhanced Sticky Header with Progress */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-2">
        <div className="flex items-center justify-between p-3 pl-12">
          <div className="flex items-center gap-3">
            {/* Simple Back Button */}
            <BackButton 
              onClick={() => navigate("/purchase-invoices")}
              variant="ghost"
              size="sm"
            >
              Alış Faturaları
            </BackButton>
            
            {/* Simple Title Section with Icon */}
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Alış Faturası
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  {invoice.invoice_number || 'Henüz atanmadı'} • {invoice.supplier?.company || invoice.supplier?.name || 'Tedarikçi'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="outline" className="px-3 py-1">
                <Package className="h-3 w-3 mr-1" />
                {invoiceItems.length} Kalem
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <DollarSign className="h-3 w-3 mr-1" />
                {isForeignCurrency ? (
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(totalAmount, currency)}</span>
                    <span className="text-[10px] text-gray-500">{formatCurrency(totalAmountTRY, 'TRY')}</span>
                  </div>
                ) : (
                  formatCurrency(totalAmount, currency)
                )}
              </Badge>
              {getStatusBadge(invoice.status)}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50/50 hover:text-gray-700 hover:border-gray-200 transition-all duration-200 hover:shadow-sm"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="font-medium">İşlemler</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Düzenleme</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => navigate(`/purchase-invoices/edit/${id}`)}
                  className="gap-2 cursor-pointer"
                >
                  <Edit className="h-4 w-4 text-slate-500" />
                  <span>Düzenle</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>Yazdırma & İndirme</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => window.print()}
                  className="gap-2 cursor-pointer"
                >
                  <Download className="h-4 w-4 text-blue-500" />
                  <span>PDF İndir</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>Kopyalama</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => navigate(`/purchase-invoices/new?copyFrom=${id}`)}
                  className="gap-2 cursor-pointer"
                >
                  <Copy className="h-4 w-4 text-green-500" />
                  <span>Kopyala</span>
                </DropdownMenuItem>
                
                {invoice.supplier?.id && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Navigasyon</DropdownMenuLabel>
                    <DropdownMenuItem 
                      onClick={() => navigate(`/suppliers/${invoice.supplier.id}`)}
                      className="gap-2 cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4 text-blue-500" />
                      <span>Tedarikçiye Git</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Invoice Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Fatura & Tedarikçi Bilgileri */}
          <Card className="border-2 border-gray-300 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b-2 border-gray-300 p-3">
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
                  <span className={`font-semibold text-xs ${invoice.invoice_number ? 'text-blue-600' : 'text-gray-400'}`}>
                    {invoice.invoice_number || 'Henüz atanmadı'}
                  </span>
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
                  <span className="text-xs font-medium">{currency === 'TL' ? 'TRY' : currency}</span>
                </div>
                
                {/* Döviz Kuru - Sadece TRY değilse göster */}
                {currency && currency !== 'TRY' && currency !== 'TL' && (
                  <div className="mt-2 p-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded border border-amber-200">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-amber-900">Döviz Kuru:</span>
                        {exchangeRate ? (
                          <span className="text-amber-700 font-semibold">
                            1 {currency} = {exchangeRate.toFixed(4)} TRY
                          </span>
                        ) : (
                          <span className="text-amber-600 text-[10px] italic">XML'de bulunamadı</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Ara Toplam:</span>
                  <div className="text-right">
                    <div className="font-medium text-xs">{formatCurrency(subtotal, currency)}</div>
                    {isForeignCurrency && (
                      <div className="text-[10px] text-gray-500">{formatCurrency(subtotalTRY, 'TRY')}</div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">KDV:</span>
                  <div className="text-right">
                    <div className="font-medium text-xs">{formatCurrency(taxTotal, currency)}</div>
                    {isForeignCurrency && (
                      <div className="text-[10px] text-gray-500">{formatCurrency(taxTotalTRY, 'TRY')}</div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1 border-t">
                  <span className="text-gray-700 font-medium text-xs">Toplam:</span>
                  <div className="text-right">
                    <span className="text-base font-bold text-primary">
                      {formatCurrency(totalAmount, currency)}
                    </span>
                    {isForeignCurrency && (
                      <div className="text-sm font-semibold text-gray-600">{formatCurrency(totalAmountTRY, 'TRY')}</div>
                    )}
                  </div>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Durum:</span>
                  {getStatusBadge(invoice.status)}
                </div>
                {categoryName && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs">Gider Kategorisi:</span>
                    <span className="text-xs font-medium text-blue-600">{categoryName}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Tedarikçi Bilgileri */}
              <div className="p-2.5 rounded-lg text-xs bg-green-50 border border-green-200">
                <div className="mb-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Building2 className="h-3 w-3 text-green-600" />
                    <span className="text-green-700 font-medium text-xs">Tedarikçi Bilgileri</span>
                  </div>
                  <div className="font-semibold text-gray-900 text-sm mb-0.5">
                    {invoice.supplier?.company || invoice.supplier?.name || 'Bilinmiyor'}
                  </div>
                  {invoice.supplier?.tax_number && (
                    <div className="text-gray-500 text-xs mt-0.5">
                      VKN: {invoice.supplier.tax_number}
                    </div>
                  )}
                </div>
                {invoice.supplier?.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/suppliers/${invoice.supplier.id}`)}
                    className="w-full mt-2 h-7 text-xs bg-white hover:bg-green-100 border-green-300"
                  >
                    <ExternalLink className="h-3 w-3 mr-1.5" />
                    Tedarikçiye Git
                  </Button>
                )}
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
          <Card className="border-2 border-gray-300 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-b-2 border-gray-300 p-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-4 w-4 text-orange-600" />
                  Fatura Kalemleri
                </CardTitle>
                <Badge variant="outline" className="px-3 py-1">
                  {invoiceItems.length} Kalem
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {itemsLoading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : invoiceItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Fatura kalemleri bulunamadı</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="max-h-[50vh] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gray-50 z-10">
                        <TableRow className="border-gray-200">
                          <TableHead className="w-10 font-semibold text-[10px] px-2">#</TableHead>
                          <TableHead className="min-w-80 font-semibold text-[10px] px-3">Ürün</TableHead>
                          <TableHead className="text-right font-semibold text-[10px] px-2 w-20">Miktar</TableHead>
                          <TableHead className="text-center font-semibold text-[10px] px-2 w-16">Birim</TableHead>
                          <TableHead className="text-right font-semibold text-[10px] px-2 w-24">Birim Fiyat</TableHead>
                          <TableHead className="text-right font-semibold text-[10px] px-2 w-20">İndirim</TableHead>
                          <TableHead className="text-right font-semibold text-[10px] px-2 w-16">KDV</TableHead>
                          <TableHead className="text-right font-semibold text-[10px] px-2 w-24">Toplam</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoiceItems.map((item, index) => (
                          <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors border-gray-100">
                            <TableCell className="font-medium text-[10px] px-2 py-2">
                              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-semibold text-gray-600">
                                {index + 1}
                              </div>
                            </TableCell>
                            <TableCell className="px-3 py-2">
                              <div className="min-w-80 max-w-none">
                                <p className="font-medium text-gray-900 text-xs mb-1 break-words">
                                  {item.product_name}
                                </p>
                                {item.sku && (
                                  <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 mt-1">
                                    <span className="px-2 py-0.5 bg-gray-100 rounded">SKU: {item.sku}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right px-2 py-2">
                              <div className="font-mono text-xs font-semibold text-gray-700">
                                {item.quantity.toFixed(2)}
                              </div>
                            </TableCell>
                            <TableCell className="text-center px-2 py-2">
                              <div className="text-[10px] font-medium text-gray-600">
                                {formatUnit(item.unit)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-xs font-medium px-2 py-2">
                              {(() => {
                                const itemUnitPriceTRY = isForeignCurrency && exchangeRate ? item.unit_price * exchangeRate : null;
                                return (
                                  <div className="flex flex-col items-end">
                                    <span>{formatCurrency(item.unit_price, currency)}</span>
                                    {itemUnitPriceTRY && (
                                      <span className="text-[10px] text-gray-500">{formatCurrency(itemUnitPriceTRY, 'TRY')}</span>
                                    )}
                                  </div>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="text-right px-2 py-2">
                              {item.discount_rate > 0 ? (
                                <span className="text-red-600 text-[10px]">{item.discount_rate}%</span>
                              ) : (
                                <span className="text-gray-400 text-[10px]">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-[10px] px-2 py-2">{item.tax_rate}%</TableCell>
                            <TableCell className="text-right font-semibold text-xs text-gray-900 px-2 py-2">
                              {(() => {
                                // KDV'siz tutar hesapla
                                const itemSubtotal = item.unit_price * item.quantity;
                                const discountAmount = itemSubtotal * (item.discount_rate / 100);
                                const kdvsizTutar = itemSubtotal - discountAmount;
                                const kdvsizTutarTRY = isForeignCurrency && exchangeRate ? kdvsizTutar * exchangeRate : null;
                                return (
                                  <div className="flex flex-col items-end">
                                    <span>{formatCurrency(kdvsizTutar, currency)}</span>
                                    {kdvsizTutarTRY && (
                                      <span className="text-[10px] text-gray-500">{formatCurrency(kdvsizTutarTRY, 'TRY')}</span>
                                    )}
                                  </div>
                                );
                              })()}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(() => {
                          // Genel toplam hesaplamaları
                          const kdvsizToplam = invoiceItems.reduce((sum, item) => {
                            const itemSubtotal = item.unit_price * item.quantity;
                            const discountAmount = itemSubtotal * (item.discount_rate / 100);
                            const kdvsizTutar = itemSubtotal - discountAmount;
                            return sum + kdvsizTutar;
                          }, 0);
                          
                          const kdvToplami = invoiceItems.reduce((sum, item) => {
                            const itemSubtotal = item.unit_price * item.quantity;
                            const discountAmount = itemSubtotal * (item.discount_rate / 100);
                            const afterDiscount = itemSubtotal - discountAmount;
                            const kdvTutari = afterDiscount * (item.tax_rate / 100);
                            return sum + kdvTutari;
                          }, 0);
                          
                          const kdvDahilToplam = kdvsizToplam + kdvToplami;
                          const kdvsizToplamTRY = isForeignCurrency && exchangeRate ? kdvsizToplam * exchangeRate : null;
                          const kdvToplamiTRY = isForeignCurrency && exchangeRate ? kdvToplami * exchangeRate : null;
                          const kdvDahilToplamTRY = isForeignCurrency && exchangeRate ? kdvDahilToplam * exchangeRate : null;
                          
                          return (
                            <>
                              <TableRow className="bg-gray-50 font-semibold border-t-2 border-gray-300 [&>td]:py-0.5">
                                <TableCell colSpan={7} className="text-right text-xs px-2 leading-none">
                                  Ara Toplam
                                </TableCell>
                                <TableCell className="text-right text-xs px-2 leading-none">
                                  <div className="flex flex-col items-end">
                                    <span>{formatCurrency(kdvsizToplam, currency)}</span>
                                    {kdvsizToplamTRY && (
                                      <span className="text-[10px] text-gray-500">{formatCurrency(kdvsizToplamTRY, 'TRY')}</span>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                              <TableRow className="bg-gray-50 font-semibold [&>td]:py-0.5">
                                <TableCell colSpan={7} className="text-right text-xs px-2 leading-none">
                                  KDV
                                </TableCell>
                                <TableCell className="text-right text-xs px-2 leading-none">
                                  <div className="flex flex-col items-end">
                                    <span>{formatCurrency(kdvToplami, currency)}</span>
                                    {kdvToplamiTRY && (
                                      <span className="text-[10px] text-gray-500">{formatCurrency(kdvToplamiTRY, 'TRY')}</span>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                              <TableRow className="bg-gray-50 font-bold border-b-2 border-gray-300 [&>td]:py-0.5">
                                <TableCell colSpan={7} className="text-right text-xs px-2 leading-none">
                                  Genel Toplam (KDV Dahil)
                                </TableCell>
                                <TableCell className="text-right text-sm px-2 leading-none">
                                  <div className="flex flex-col items-end">
                                    <span>{formatCurrency(kdvDahilToplam, currency)}</span>
                                    {kdvDahilToplamTRY && (
                                      <span className="text-xs font-semibold text-gray-600">{formatCurrency(kdvDahilToplamTRY, 'TRY')}</span>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            </>
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stok Hareketleri */}
          {stockMovements.length > 0 && (
            <Card className="border-2 border-gray-300 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 border-b-2 border-gray-300 p-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-indigo-600" />
                    Stok Hareketleri
                  </CardTitle>
                  <Badge variant="outline" className="px-3 py-1">
                    {stockMovements.length} Hareket
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {movementsLoading ? (
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="max-h-[50vh] overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-gray-50 z-10">
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
