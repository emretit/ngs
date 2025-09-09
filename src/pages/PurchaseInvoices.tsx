
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  FileUp, 
  Search, 
  Filter, 
  Download,
  Eye,
  Edit,
  CreditCard,
  Trash2,
  RefreshCw
} from "lucide-react";
import { usePurchaseInvoices } from '@/hooks/usePurchaseInvoices';
import { useIncomingInvoices } from '@/hooks/useIncomingInvoices';
import { useEarchiveInvoices } from '@/hooks/useEarchiveInvoices';
import { useNilveraPdf } from '@/hooks/useNilveraPdf';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import React from "react";

interface PurchaseInvoicesProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const PurchaseInvoices = ({ isCollapsed, setIsCollapsed }: PurchaseInvoicesProps) => {
  const { 
    invoices, 
    isLoading, 
    filters, 
    setFilters,
  } = usePurchaseInvoices();
  
  const { incomingInvoices, isLoading: isLoadingIncoming, refetch: refetchIncoming } = useIncomingInvoices();
  const { earchiveInvoices, isLoading: isLoadingEarchive, refetch: refetchEarchive } = useEarchiveInvoices();
  const { downloadAndOpenPdf, isDownloading } = useNilveraPdf();
  
  const [dateOpen, setDateOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (status: any) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Ödendi</Badge>;
      case 'partially_paid':
        return <Badge className="bg-blue-500">Kısmi Ödeme</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500">Bekliyor</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Gecikti</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500">İptal</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  // Analytics calculation
  const totalInvoices = invoices?.length || 0;
  const totalPaid = invoices?.filter(i => i.status === 'paid').length || 0;
  const totalPending = invoices?.filter(i => i.status === 'pending').length || 0;
  const totalOverdue = invoices?.filter(i => i.status === 'overdue').length || 0;
  
  const totalAmountSum = invoices?.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0) || 0;
  const paidAmountSum = invoices?.reduce((sum, invoice) => sum + Number(invoice.paid_amount), 0) || 0;
  const pendingAmountSum = totalAmountSum - paidAmountSum;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex relative">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-[60px]" : "ml-[60px] sm:ml-64"
        }`}
      >
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                Alış Faturaları
              </h1>
              <p className="text-gray-600">
                Alış faturalarının yönetimi
              </p>
            </div>
            <Button className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-primary to-primary/90">
              <Plus className="h-4 w-4" />
              <span>Yeni Fatura</span>
            </Button>
          </div>

          <div className="w-full">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="p-4 bg-white shadow-sm">
                  <CardContent className="p-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Toplam Fatura</span>
                      <FileUp className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{totalInvoices}</p>
                    <span className="text-sm text-gray-500">Bu dönem</span>
                  </CardContent>
                </Card>
                
                <Card className="p-4 bg-white shadow-sm">
                  <CardContent className="p-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Ödenen</span>
                      <FileUp className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(paidAmountSum)}</p>
                    <span className="text-sm text-gray-500">{totalPaid} fatura</span>
                  </CardContent>
                </Card>
                
                <Card className="p-4 bg-white shadow-sm">
                  <CardContent className="p-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Bekleyen</span>
                      <FileUp className="h-5 w-5 text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(pendingAmountSum)}</p>
                    <span className="text-sm text-gray-500">{totalPending} fatura</span>
                  </CardContent>
                </Card>
                
                <Card className="p-4 bg-white shadow-sm">
                  <CardContent className="p-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Geciken</span>
                      <FileUp className="h-5 w-5 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-red-600">{totalOverdue}</p>
                    <span className="text-sm text-gray-500">fatura</span>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Fatura no, tedarikçi ara..."
                        className="pl-9"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      />
                    </div>
                    <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                      <SelectTrigger className="w-full lg:w-48">
                        <SelectValue placeholder="Durum Filtrele" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Durumlar</SelectItem>
                        <SelectItem value="pending">Bekliyor</SelectItem>
                        <SelectItem value="paid">Ödendi</SelectItem>
                        <SelectItem value="partially_paid">Kısmi Ödendi</SelectItem>
                        <SelectItem value="overdue">Gecikmiş</SelectItem>
                        <SelectItem value="cancelled">İptal</SelectItem>
                      </SelectContent>
                    </Select>
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full lg:w-auto justify-start text-left font-normal">
                          <FileUp className="mr-2 h-4 w-4" />
                          Tarih Aralığı
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DatePickerWithRange
                          value={{
                            from: filters.dateRange.from ? new Date(filters.dateRange.from) : undefined,
                            to: filters.dateRange.to ? new Date(filters.dateRange.to) : undefined
                          }}
                          onChange={(range) => setFilters({ 
                            ...filters, 
                            dateRange: { 
                              from: range?.from || null, 
                              to: range?.to || null 
                            }
                          })}
                        />
                      </PopoverContent>
                    </Popover>
                    <Button variant="outline" onClick={() => setFilters({
                      search: "",
                      status: "all",
                      dateRange: { from: null, to: null }
                    })}>
                      <Filter className="h-4 w-4 mr-2" />
                      Temizle
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        refetchIncoming();
                        refetchEarchive();
                      }}
                      disabled={isLoadingIncoming || isLoadingEarchive}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${(isLoadingIncoming || isLoadingEarchive) ? 'animate-spin' : ''}`} />
                      E-Fatura Yenile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Purchase Invoices Table */}
              <Card>
                <CardContent className="p-0">
              {isLoading || isLoadingIncoming || isLoadingEarchive ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-8 w-[80px]" />
                    </div>
                  ))}
                </div>
              ) : (invoices && invoices.length > 0) || (incomingInvoices && incomingInvoices.length > 0) || (earchiveInvoices && earchiveInvoices.length > 0) ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-700">Fatura No</th>
                        <th className="text-left p-4 font-medium text-gray-700">Tedarikçi</th>
                        <th className="text-left p-4 font-medium text-gray-700">Tarih</th>
                        <th className="text-left p-4 font-medium text-gray-700">Toplam</th>
                        <th className="text-left p-4 font-medium text-gray-700">Durum</th>
                        <th className="text-left p-4 font-medium text-gray-700">Tip</th>
                        <th className="text-center p-4 font-medium text-gray-700">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                       {/* Combine all invoices and sort by date */}
                       {[
                         ...(invoices || []).map(invoice => ({
                           ...invoice,
                           sourceType: 'purchase',
                           invoiceDate: invoice.invoice_date,
                           sortDate: new Date(invoice.invoice_date).getTime(),
                           displayNumber: invoice.invoice_number,
                           displaySupplier: 'Tedarikçi', // TODO: supplier lookup
                           displayAmount: invoice.total_amount,
                           displayStatus: invoice.status
                         })),
                         ...(incomingInvoices || []).filter(invoice => 
                           invoice.status?.toLowerCase().includes('alındı') || 
                           invoice.responseStatus?.toLowerCase().includes('received')
                         ).map(invoice => ({
                           ...invoice,
                           sourceType: 'incoming',
                           invoiceDate: invoice.invoiceDate,
                           sortDate: new Date(invoice.invoiceDate).getTime(),
                           displayNumber: invoice.invoiceNumber,
                           displaySupplier: invoice.supplierName,
                           displayAmount: invoice.totalAmount,
                           displayStatus: 'received'
                         })),
                         ...(earchiveInvoices || []).filter(invoice => 
                           invoice.status?.toLowerCase().includes('succeed') ||
                           invoice.statusCode?.toLowerCase().includes('succeed')
                         ).map(invoice => ({
                           ...invoice,
                           sourceType: 'earchive_received',
                           invoiceDate: invoice.invoiceDate,
                           sortDate: new Date(invoice.invoiceDate).getTime(),
                           displayNumber: invoice.invoiceNumber,
                           displaySupplier: invoice.customerName,
                           displayAmount: invoice.totalAmount,
                           displayStatus: 'received'
                         }))
                       ]
                       .sort((a, b) => b.sortDate - a.sortDate)
                       .map((invoice, index) => (
                         <tr key={`${invoice.sourceType}-${invoice.id}-${index}`} className="border-b hover:bg-gray-50 transition-colors">
                           <td className="p-4">
                             <span className="font-medium text-blue-600">{invoice.displayNumber}</span>
                           </td>
                           <td className="p-4">
                              <div>
                                <div className="font-medium">{invoice.displaySupplier}</div>
                                {(invoice.sourceType === 'incoming' || invoice.sourceType === 'earchive_received') && (
                                  <div className="text-sm text-gray-500">VKN: {(invoice as any).supplierTaxNumber || (invoice as any).customerTaxNumber}</div>
                                )}
                              </div>
                           </td>
                           <td className="p-4">
                             {format(new Date(invoice.invoiceDate), "dd.MM.yyyy", { locale: tr })}
                           </td>
                           <td className="p-4">
                             <div className="font-medium">{formatCurrency(invoice.displayAmount)}</div>
                           </td>
                           <td className="p-4">
                             {invoice.sourceType === 'purchase' ? 
                               getStatusBadge(invoice.displayStatus) : 
                               <Badge className="bg-green-500">Alındı</Badge>
                             }
                           </td>
                           <td className="p-4">
                             {invoice.sourceType === 'purchase' && <Badge variant="outline" className="border-gray-500 text-gray-700">Normal Fatura</Badge>}
                             {invoice.sourceType === 'incoming' && (
                               <Badge variant="outline" className="border-blue-500 text-blue-700">Gelen E-Fatura</Badge>
                             )}
                             {invoice.sourceType === 'earchive_received' && (
                               <Badge variant="outline" className="border-purple-500 text-purple-700">Gelen E-Arşiv</Badge>
                             )}
                           </td>
                           <td className="p-4 text-center">
                             <div className="flex gap-2 justify-center">
                               <Button variant="outline" size="sm">
                                 <Eye className="h-4 w-4" />
                               </Button>
                               {(invoice.sourceType === 'earchive_received') && (
                                 <Button 
                                   variant="outline" 
                                   size="sm"
                                   onClick={() => downloadAndOpenPdf(invoice.id, 'e-arşiv')}
                                   disabled={isDownloading}
                                   className="text-blue-600 hover:text-blue-700"
                                 >
                                   <Download className="h-4 w-4" />
                                 </Button>
                               )}
                             </div>
                           </td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Henüz fatura bulunmuyor</p>
                </div>
              )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PurchaseInvoices;
