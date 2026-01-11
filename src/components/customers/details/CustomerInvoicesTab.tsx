import React, { useState, useMemo } from 'react';
import { logger } from '@/utils/logger';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Receipt, 
  Calendar, 
  FileText, 
  Eye, 
  Filter,
  Plus,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@/components/ui/date-picker';

interface CustomerInvoicesTabProps {
  customerId: string;
  customerName: string;
}

interface SalesInvoice {
  id: string;
  fatura_no: string;
  fatura_tarihi: string;
  toplam_tutar: number;
  durum: string;
  para_birimi: string;
  aciklama?: string;
  customer?: {
    name?: string;
    company?: string;
  };
}

interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  status: string;
  currency: string;
  notes?: string;
  supplier?: {
    name?: string;
    company?: string;
  };
}

// Birleşik fatura tipi
interface UnifiedInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  amount: number;
  status: string;
  currency: string;
  type: 'sales' | 'purchase';
  original?: SalesInvoice | PurchaseInvoice;
}

const CustomerInvoicesTab = ({ customerId, customerName }: CustomerInvoicesTabProps) => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  // Son 30 gün için varsayılan tarih filtresi
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());
  const { userData } = useCurrentUser();

  // Satış faturalarını çek (müşteriye kesilen faturalar)
  const { data: salesInvoices = [], isLoading: isLoadingSales } = useQuery({
    queryKey: ['customer-sales-invoices', customerId],
    queryFn: async (): Promise<SalesInvoice[]> => {
      const { data, error } = await supabase
        .from('sales_invoices')
        .select(`
          *,
          customer:customers(name, company)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching sales invoices:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!customerId,
  });

  // Alış faturalarını çek (müşteriden alınan faturalar customer_id ile, müşteri aynı zamanda tedarikçi ise supplier_id ile)
  const { data: purchaseInvoices = [], isLoading: isLoadingPurchase } = useQuery({
    queryKey: ['customer-purchase-invoices', customerId, userData?.company_id],
    queryFn: async (): Promise<PurchaseInvoice[]> => {
      if (!userData?.company_id || !customerId) {
        logger.warn('No company_id or customerId available');
        return [];
      }

      // İki ayrı sorgu yapıp birleştir (daha güvenli)
      const [customerInvoicesResult, supplierInvoicesResult] = await Promise.all([
        // Müşteriden alınan faturalar (customer_id ile)
        supabase
          .from('purchase_invoices')
          .select(`
            *,
            supplier:suppliers(name, company),
            customer:customers(name, company)
          `)
          .eq('company_id', userData.company_id)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false }),
        // Müşteri aynı zamanda tedarikçi ise (supplier_id ile)
        supabase
          .from('purchase_invoices')
          .select(`
            *,
            supplier:suppliers(name, company),
            customer:customers(name, company)
          `)
          .eq('company_id', userData.company_id)
          .eq('supplier_id', customerId)
          .order('created_at', { ascending: false })
      ]);

      if (customerInvoicesResult.error) {
        logger.error('Error fetching customer purchase invoices:', customerInvoicesResult.error);
        throw customerInvoicesResult.error;
      }

      if (supplierInvoicesResult.error) {
        logger.error('Error fetching supplier purchase invoices:', supplierInvoicesResult.error);
        throw supplierInvoicesResult.error;
      }

      // İki sonucu birleştir ve duplicate'leri kaldır
      const allInvoices = [
        ...(customerInvoicesResult.data || []),
        ...(supplierInvoicesResult.data || [])
      ];

      // Duplicate'leri kaldır (id'ye göre)
      const uniqueInvoices = Array.from(
        new Map(allInvoices.map(inv => [inv.id, inv])).values()
      );

      // Tarihe göre sırala
      uniqueInvoices.sort((a, b) => {
        const dateA = new Date(a.created_at || a.invoice_date).getTime();
        const dateB = new Date(b.created_at || b.invoice_date).getTime();
        return dateB - dateA;
      });

      logger.debug('✅ Purchase invoices fetched:', uniqueInvoices.length, uniqueInvoices);
      return uniqueInvoices;
    },
    enabled: !!customerId && !!userData?.company_id,
  });

  // Birleşik faturalar listesi
  const unifiedInvoices = useMemo((): UnifiedInvoice[] => {
    const sales = salesInvoices.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.fatura_no,
      invoiceDate: inv.fatura_tarihi,
      amount: inv.toplam_tutar,
      status: inv.durum,
      currency: inv.para_birimi,
      type: 'sales' as const,
      original: inv
    }));
    
    const purchases = purchaseInvoices.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      invoiceDate: inv.invoice_date,
      amount: inv.total_amount,
      status: inv.status,
      currency: inv.currency,
      type: 'purchase' as const,
      original: inv
    }));
    
    return [...sales, ...purchases].sort((a, b) => {
      const dateA = new Date(a.invoiceDate).getTime();
      const dateB = new Date(b.invoiceDate).getTime();
      return dateB - dateA;
    });
  }, [salesInvoices, purchaseInvoices]);

  // Filtrelenmiş birleşik faturalar
  const filteredInvoices = useMemo(() => {
    return unifiedInvoices.filter(invoice => {
      // Tip filtresi
      const matchesType = typeFilter === 'all' || invoice.type === typeFilter;
      
      // Durum filtresi
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        if (invoice.type === 'sales') {
          matchesStatus = invoice.status === statusFilter;
        } else {
          // Alış faturaları için durum eşleştirmesi
          const statusMap: { [key: string]: string } = {
            'odendi': 'paid',
            'odenmedi': 'pending',
            'gecikti': 'overdue',
            'taslak': 'draft',
            'iptal': 'cancelled'
          };
          const mappedStatus = statusMap[statusFilter] || statusFilter;
          matchesStatus = invoice.status === mappedStatus;
        }
      }
      
      // Tarih filtresi
      let matchesDate = true;
      if (startDate || endDate) {
        const invoiceDate = invoice.invoiceDate;
        if (invoiceDate) {
          const date = new Date(invoiceDate);
          if (startDate && date < startDate) matchesDate = false;
          if (endDate) {
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);
            if (date > endDateTime) matchesDate = false;
          }
        } else {
          matchesDate = false;
        }
      }
      
      return matchesType && matchesStatus && matchesDate;
    });
  }, [unifiedInvoices, typeFilter, statusFilter, startDate, endDate]);

  // Birleşik istatistikler
  const invoiceStats = useMemo(() => {
    const all = unifiedInvoices || [];
    return {
      total: all.length,
      sales: all.filter(inv => inv.type === 'sales').length,
      purchase: all.filter(inv => inv.type === 'purchase').length,
      paid: all.filter(inv => {
        if (inv.type === 'sales') {
          return inv.status === 'odendi' || inv.status === 'paid';
        } else {
          return inv.status === 'paid';
        }
      }).length,
      pending: all.filter(inv => {
        if (inv.type === 'sales') {
          return inv.status === 'odenmedi' || inv.status === 'pending' || inv.status === 'beklemede';
        } else {
          return inv.status === 'pending';
        }
      }).length,
      overdue: all.filter(inv => {
        if (inv.type === 'sales') {
          return inv.status === 'gecikti' || inv.status === 'overdue' || inv.status === 'gecikmis';
        } else {
          return inv.status === 'overdue';
        }
      }).length,
    };
  }, [unifiedInvoices]);

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string } } = {
      'pending': { variant: 'secondary', label: 'Beklemede' },
      'paid': { variant: 'default', label: 'Ödendi' },
      'overdue': { variant: 'destructive', label: 'Gecikmiş' },
      'draft': { variant: 'outline', label: 'Taslak' },
      'sent': { variant: 'secondary', label: 'Gönderildi' },
      'cancelled': { variant: 'destructive', label: 'İptal' },
      'beklemede': { variant: 'secondary', label: 'Beklemede' },
      'odendi': { variant: 'default', label: 'Ödendi' },
      'gecikmis': { variant: 'destructive', label: 'Gecikmiş' },
      'taslak': { variant: 'outline', label: 'Taslak' },
      'gonderildi': { variant: 'secondary', label: 'Gönderildi' },
      'iptal': { variant: 'destructive', label: 'İptal' },
    };

    const config = statusMap[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleInvoiceClick = (invoice: UnifiedInvoice) => {
    if (invoice.type === 'sales') {
      navigate(`/sales-invoices/${invoice.id}`);
    } else {
      navigate(`/purchase-invoices/${invoice.id}`);
    }
  };

  const isLoading = isLoadingSales || isLoadingPurchase;

  return (
    <div className="space-y-4">

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Faturalar</h3>
          </div>
          <div className="h-8 w-px bg-gray-300" />
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Satış</span>
              <span className="text-sm font-semibold text-blue-600">
                {invoiceStats.sales}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Alış</span>
              <span className="text-sm font-semibold text-purple-600">
                {invoiceStats.purchase}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Ödendi</span>
              <span className="text-sm font-semibold text-green-600">
                {invoiceStats.paid}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Bekleyen</span>
              <span className="text-sm font-semibold text-yellow-600">
                {invoiceStats.pending}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Toplam</span>
              <span className="text-sm font-semibold text-gray-900">
                {invoiceStats.total}
              </span>
            </div>
            {invoiceStats.overdue > 0 && (
              <>
                <div className="h-8 w-px bg-gray-300" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Gecikmiş</span>
                  <span className="text-sm font-semibold text-red-600">
                    {invoiceStats.overdue}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Tip" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Tipler</SelectItem>
              <SelectItem value="sales">Satış</SelectItem>
              <SelectItem value="purchase">Alış</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="odendi">Ödendi</SelectItem>
              <SelectItem value="odenmedi">Ödenmedi</SelectItem>
              <SelectItem value="gecikti">Gecikmiş</SelectItem>
              <SelectItem value="taslak">Taslak</SelectItem>
              <SelectItem value="iptal">İptal</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <DatePicker
              date={startDate}
              onSelect={setStartDate}
              placeholder="Başlangıç"
            />
            <span className="text-muted-foreground text-sm">-</span>
            <DatePicker
              date={endDate}
              onSelect={setEndDate}
              placeholder="Bitiş"
            />
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="h-9"
            onClick={() => navigate('/sales-invoices/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Fatura Ekle
          </Button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="pb-6">
          <div className="-mx-4">
            <div className="px-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-muted-foreground">Yükleniyor...</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-100 border-b border-slate-200">
                        <TableHead className="py-1.5 px-2.5 font-bold text-foreground/80 text-xs tracking-wide text-left">
                          <div className="flex items-center gap-1">
                            <span className="text-lg mr-2">📋</span>
                            <span>Tip</span>
                          </div>
                        </TableHead>
                        <TableHead className="py-1.5 px-2.5 font-bold text-foreground/80 text-xs tracking-wide text-left">
                          <div className="flex items-center gap-1">
                            <span className="text-lg mr-2">📄</span>
                            <span>Fatura No</span>
                          </div>
                        </TableHead>
                        <TableHead className="py-1.5 px-2.5 font-bold text-foreground/80 text-xs tracking-wide text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-lg mr-2">📅</span>
                            <span>Tarih</span>
                          </div>
                        </TableHead>
                        <TableHead className="py-1.5 px-2.5 font-bold text-foreground/80 text-xs tracking-wide text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-lg mr-2">💰</span>
                            <span>Tutar</span>
                          </div>
                        </TableHead>
                        <TableHead className="py-1.5 px-2.5 font-bold text-foreground/80 text-xs tracking-wide text-left">
                          <div className="flex items-center gap-1">
                            <span className="text-lg mr-2">📊</span>
                            <span>Durum</span>
                          </div>
                        </TableHead>
                        <TableHead className="py-1.5 px-2.5 font-bold text-foreground/80 text-xs tracking-wide text-left">
                          <div className="flex items-center gap-1">
                            <span className="text-lg mr-2">💱</span>
                            <span>Para Birimi</span>
                          </div>
                        </TableHead>
                        <TableHead className="py-1.5 px-2.5 font-bold text-foreground/80 text-xs tracking-wide text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-sm mr-1">⚙️</span>
                            <span>İşlemler</span>
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                              <h3 className="text-lg font-semibold mb-2">Fatura bulunamadı</h3>
                              <p className="text-muted-foreground">
                                Bu müşteri için fatura bulunmuyor.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredInvoices.map((invoice) => (
                          <TableRow key={`${invoice.type}-${invoice.id}`} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleInvoiceClick(invoice)}>
                            <TableCell className="py-2 px-3 text-xs">
                              <Badge variant={invoice.type === 'sales' ? 'default' : 'secondary'}>
                                {invoice.type === 'sales' ? 'Satış' : 'Alış'}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2 px-3 text-xs">
                              <div className="flex items-center gap-2">
                                <FileText className={`h-4 w-4 ${invoice.type === 'sales' ? 'text-green-500' : 'text-blue-500'}`} />
                                <span className="font-medium">{invoice.invoiceNumber || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 px-3 text-xs text-center">
                              {invoice.invoiceDate ? (() => {
                                const dateValue = invoice.invoiceDate;
                                if (!dateValue) return <span className="text-muted-foreground">-</span>;
                                const dateObj = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
                                if (isNaN(dateObj.getTime())) return <span className="text-muted-foreground">-</span>;
                                return dateObj.toLocaleDateString('tr-TR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                });
                              })() : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell className="py-2 px-3 text-xs text-right">
                              <span className="font-medium">
                                {invoice.amount.toLocaleString('tr-TR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </span>
                            </TableCell>
                            <TableCell className="py-2 px-3 text-xs">
                              {getStatusBadge(invoice.status)}
                            </TableCell>
                            <TableCell className="py-2 px-3 text-xs">
                              <Badge variant="outline">{invoice.currency || 'TRY'}</Badge>
                            </TableCell>
                            <TableCell className="py-2 px-3 text-xs text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInvoiceClick(invoice);
                                }}
                                className="h-8 w-8"
                                title="Detayları Görüntüle"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerInvoicesTab;
