
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileUp, ExternalLink, Search, Filter, Calendar } from "lucide-react";
import { useSalesInvoices, SalesInvoice } from "@/hooks/useSalesInvoices";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface SalesInvoicesProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const SalesInvoices = ({ isCollapsed, setIsCollapsed }: SalesInvoicesProps) => {
  const { 
    invoices, 
    isLoading, 
    filters, 
    setFilters,
  } = useSalesInvoices();
  
  const [dateOpen, setDateOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (status: SalesInvoice['odeme_durumu']) => {
    switch (status) {
      case 'odendi':
        return <Badge className="bg-green-500">Ödendi</Badge>;
      case 'kismi_odendi':
        return <Badge className="bg-blue-500">Kısmi Ödeme</Badge>;
      case 'odenmedi':
        return <Badge className="bg-amber-500">Ödenmedi</Badge>;
      case 'gecikti':
        return <Badge className="bg-red-500">Gecikti</Badge>;
      case 'iptal':
        return <Badge className="bg-gray-500">İptal</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const getDocumentTypeBadge = (type: SalesInvoice['document_type']) => {
    switch (type) {
      case 'e_fatura':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">e-Fatura</Badge>;
      case 'e_arsiv':
        return <Badge variant="outline" className="border-purple-500 text-purple-700">e-Arşiv</Badge>;
      case 'fatura':
        return <Badge variant="outline" className="border-gray-500 text-gray-700">Fatura</Badge>;
      case 'irsaliye':
        return <Badge variant="outline" className="border-amber-500 text-amber-700">İrsaliye</Badge>;
      case 'makbuz':
        return <Badge variant="outline" className="border-green-500 text-green-700">Makbuz</Badge>;
      case 'serbest_meslek_makbuzu':
        return <Badge variant="outline" className="border-indigo-500 text-indigo-700">SMM</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Analytics calculation
  const totalInvoices = invoices?.length || 0;
  const totalPaid = invoices?.filter(i => i.odeme_durumu === 'odendi').length || 0;
  const totalUnpaid = invoices?.filter(i => i.odeme_durumu === 'odenmedi').length || 0;
  const totalOverdue = invoices?.filter(i => i.odeme_durumu === 'gecikti').length || 0;
  
  const totalAmountSum = invoices?.reduce((sum, invoice) => sum + Number(invoice.toplam_tutar), 0) || 0;
  const paidAmountSum = invoices?.reduce((sum, invoice) => sum + Number(invoice.odenen_tutar), 0) || 0;
  const unpaidAmountSum = totalAmountSum - paidAmountSum;

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
                Satış Faturaları
              </h1>
              <p className="text-gray-600">
                Satış faturalarının yönetimi
              </p>
            </div>
            <Button className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-primary to-primary/90">
              <Plus className="h-4 w-4" />
              <span>Yeni Fatura</span>
            </Button>
          </div>

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
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(unpaidAmountSum)}</p>
                <span className="text-sm text-gray-500">{totalUnpaid} fatura</span>
              </CardContent>
            </Card>
            
            <Card className="p-4 bg-white shadow-sm">
              <CardContent className="p-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Vadesi Geçmiş</span>
                  <FileUp className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-red-600">{totalOverdue}</p>
                <span className="text-sm text-gray-500">fatura</span>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-end justify-between mb-4">
                <div className="flex flex-1 flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Fatura ara..."
                      className="pl-9"
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters({ ...filters, status: value })}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Ödeme Durumu" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tümü</SelectItem>
                        <SelectItem value="odendi">Ödendi</SelectItem>
                        <SelectItem value="kismi_odendi">Kısmi Ödendi</SelectItem>
                        <SelectItem value="odenmedi">Ödenmedi</SelectItem>
                        <SelectItem value="gecikti">Gecikti</SelectItem>
                        <SelectItem value="iptal">İptal</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[180px] justify-start text-left font-normal flex gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Tarih Aralığı</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DatePickerWithRange
                          value={{
                            from: filters.dateRange.from,
                            to: filters.dateRange.to,
                          }}
                          onChange={(range) => {
                            setFilters({
                              ...filters,
                              dateRange: {
                                from: range.from,
                                to: range.to,
                              }
                            });
                            setDateOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <Button variant="secondary" onClick={() => setFilters({
                  status: "",
                  search: "",
                  dateRange: { from: null, to: null }
                })}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filtreleri Temizle
                </Button>
              </div>
              
              <div className="rounded-md border">
                <div className="grid grid-cols-7 gap-2 p-4 font-medium text-sm text-gray-500 bg-gray-50 rounded-t-md">
                  <div>Fatura No</div>
                  <div className="col-span-2">Müşteri</div>
                  <div>Tarih</div>
                  <div>Tutar</div>
                  <div>Durum</div>
                  <div>Tip</div>
                </div>
                
                <Separator />
                
                {isLoading ? (
                  Array(5).fill(0).map((_, index) => (
                    <div key={index} className="grid grid-cols-7 gap-2 p-4 items-center border-b last:border-0">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-full col-span-2" />
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  ))
                ) : (
                  invoices && invoices.length > 0 ? (
                    invoices.map((invoice) => (
                      <div key={invoice.id} className="grid grid-cols-7 gap-2 p-4 items-center border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="font-medium text-blue-600 flex items-center gap-1">
                          {invoice.fatura_no}
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        </div>
                        <div className="col-span-2">
                          <div className="font-medium">{invoice.customer?.name || "—"}</div>
                          <div className="text-xs text-gray-500">
                            {invoice.customer?.tax_number ? `VKN: ${invoice.customer.tax_number}` : ""}
                          </div>
                        </div>
                        <div>{format(new Date(invoice.fatura_tarihi), "dd.MM.yyyy", { locale: tr })}</div>
                        <div className="font-medium">{formatCurrency(invoice.toplam_tutar)}</div>
                        <div>{getStatusBadge(invoice.odeme_durumu)}</div>
                        <div>{getDocumentTypeBadge(invoice.document_type)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      Henüz fatura bulunmuyor veya arama kriterlerine uygun sonuç yok.
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SalesInvoices;
