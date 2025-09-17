import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  RefreshCw, 
  Eye, 
  Package, 
  FileText, 
  Calendar,
  Building,
  DollarSign,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useIncomingInvoices } from '@/hooks/useIncomingInvoices';
import { useToast } from '@/hooks/use-toast';
import EInvoiceProcessModal from './EInvoiceProcessModal';

export default function EInvoiceList() {
  // Date range filter states - Default to current month
  const getCurrentMonthRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      start: startOfMonth.toISOString().split('T')[0],
      end: endOfMonth.toISOString().split('T')[0]
    };
  };
  
  const currentMonth = getCurrentMonthRange();
  const [startDate, setStartDate] = useState(currentMonth.start);
  const [endDate, setEndDate] = useState(currentMonth.end);
  
  const { incomingInvoices, isLoading, refetch } = useIncomingInvoices({ startDate, endDate });
  const { toast } = useToast();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  
  // Refetch when date filters change
  useEffect(() => {
    refetch();
  }, [startDate, endDate, refetch]);

  // Show ALL invoices for now (removed unprocessed filter)
  // TODO: Add filter toggle later for processed/unprocessed invoices
  
  // Apply filters
  const filteredInvoices = incomingInvoices.filter(invoice => {
    const matchesSearch = !searchTerm || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplierTaxNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'unanswered' && !invoice.isAnswered) ||
      (statusFilter === 'pending' && invoice.status === 'pending') ||
      (statusFilter === 'overdue' && invoice.status === 'overdue');

    return matchesSearch && matchesStatus;
  });

  // Calculate summary statistics
  const totalInvoices = filteredInvoices.length;
  const unansweredInvoices = filteredInvoices.filter(inv => !inv.isAnswered).length;
  const overdueInvoices = filteredInvoices.filter(inv => inv.status === 'overdue').length;
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  const getStatusBadge = (invoice: any) => {
    if (invoice.isAnswered) {
      return <Badge className="bg-green-100 text-green-800">Cevaplanmış</Badge>;
    } else if (invoice.status === 'overdue') {
      return <Badge className="bg-red-100 text-red-800">Gecikmiş</Badge>;
    } else {
      return <Badge className="bg-orange-100 text-orange-800">Beklemede</Badge>;
    }
  };

  const getInvoiceTypeBadge = (invoiceType: string) => {
    switch (invoiceType) {
      case 'SATIS':
        return <Badge className="bg-green-100 text-green-800">Satış</Badge>;
      case 'IADE':
        return <Badge className="bg-red-100 text-red-800">İade</Badge>;
      case 'OZELMATRAH':
        return <Badge className="bg-blue-100 text-blue-800">Özel Matrah</Badge>;
      case 'TEVKIFAT_IADE':
        return <Badge className="bg-blue-100 text-blue-800">Tevkifat İade</Badge>;
      case 'KONAKLAMA':
        return <Badge className="bg-purple-100 text-purple-800">Konaklama</Badge>;
      case 'SGK':
        return <Badge className="bg-blue-100 text-blue-800">SGK</Badge>;
      case 'IHRAC_KAYITLI':
        return <Badge className="bg-blue-100 text-blue-800">İhraç Kayıtlı</Badge>;
      case 'ISTISNA':
        return <Badge className="bg-blue-100 text-blue-800">İstisna</Badge>;
      case 'TEMEL':
        return <Badge className="bg-gray-100 text-gray-800">Temel</Badge>;
      case 'TICARI':
        return <Badge className="bg-green-100 text-green-800">Ticari</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{invoiceType || 'Bilinmiyor'}</Badge>;
    }
  };

  const getInvoiceProfileBadge = (invoiceProfile: string) => {
    switch (invoiceProfile) {
      case 'TEMELFATURA':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Temel Fatura</Badge>;
      case 'TICARIFATURA':
        return <Badge variant="outline" className="border-green-500 text-green-700">Ticari Fatura</Badge>;
      case 'IHRACAT':
        return <Badge variant="outline" className="border-purple-500 text-purple-700">İhracat</Badge>;
      case 'YOLCUBERABERFATURA':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Yolcu Beraber</Badge>;
      case 'EARSIVFATURA':
        return <Badge variant="outline" className="border-indigo-500 text-indigo-700">E-Arşiv</Badge>;
      case 'KAMU':
        return <Badge variant="outline" className="border-red-500 text-red-700">Kamu</Badge>;
      case 'HKS':
        return <Badge variant="outline" className="border-gray-500 text-gray-700">HKS</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-500 text-gray-700">{invoiceProfile || 'Bilinmiyor'}</Badge>;
    }
  };

  const handleProcessInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsProcessModalOpen(true);
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Yenilendi",
      description: "E-fatura listesi güncellendi"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-400">
                Gelen E-Faturalar
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Tüm gelen e-faturaları görüntüleyin ve işleme alın
              </p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {filteredInvoices.length} Fatura
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6">
            {/* Date Range Filter */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tarih Aralığı:</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Başlangıç:</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-[140px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Bitiş:</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-[140px]"
                  />
                </div>
                <Button 
                  onClick={handleRefresh}
                  disabled={isLoading}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Filtrele
                </Button>
              </div>
            </div>
            
            {/* Search and Status Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Fatura no, firma adı veya vergi no ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Durum filtresi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="unanswered">Cevaplanmamış</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="overdue">Gecikmiş</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tarih filtresi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Tarihler</SelectItem>
                  <SelectItem value="today">Bugün</SelectItem>
                  <SelectItem value="week">Bu Hafta</SelectItem>
                  <SelectItem value="month">Bu Ay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="flex items-center p-4">
                <FileText className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-600">Toplam</p>
                  <p className="text-lg font-bold text-blue-900">{totalInvoices}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-4">
                <Clock className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-orange-600">Cevaplanmamış</p>
                  <p className="text-lg font-bold text-orange-900">{unansweredInvoices}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-4">
                <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-600">Gecikmiş</p>
                  <p className="text-lg font-bold text-red-900">{overdueInvoices}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-4">
                <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-600">Toplam Tutar</p>
                  <p className="text-lg font-bold text-green-900">
                    {totalAmount.toLocaleString('tr-TR')} ₺
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <span className="ml-2 text-muted-foreground">E-faturalar yükleniyor...</span>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">E-Fatura Bulunamadı</h3>
              <p className="text-muted-foreground">
                Seçilen tarih aralığında e-fatura bulunmuyor veya filtre kriterlerinize uygun fatura yok.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Durum</TableHead>
                  <TableHead>Fatura No</TableHead>
                  <TableHead>Fatura Tipi</TableHead>
                  <TableHead>Fatura Senaryosu</TableHead>
                  <TableHead>Tedarikçi</TableHead>
                  <TableHead>Vergi No</TableHead>
                  <TableHead>Fatura Tarihi</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead>Para Birimi</TableHead>
                  <TableHead className="text-center">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/50">
                    <TableCell>
                      {getStatusBadge(invoice)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      {getInvoiceTypeBadge(invoice.invoiceType)}
                    </TableCell>
                    <TableCell>
                      {getInvoiceProfileBadge(invoice.invoiceProfile)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-muted-foreground mr-2" />
                        {invoice.supplierName}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {invoice.supplierTaxNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                        {format(new Date(invoice.invoiceDate), 'dd.MM.yyyy', { locale: tr })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {invoice.dueDate ? (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                          {format(new Date(invoice.dueDate), 'dd.MM.yyyy', { locale: tr })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {invoice.totalAmount.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{invoice.currency}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleProcessInvoice(invoice)}
                          className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                        >
                          <Package className="h-4 w-4 mr-1" />
                          İşle
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // TODO: Implement preview functionality
                            toast({
                              title: "Önizleme",
                              description: "Fatura önizlemesi yakında eklenecek"
                            });
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Process Modal */}
      {selectedInvoice && (
        <EInvoiceProcessModal
          isOpen={isProcessModalOpen}
          onClose={() => {
            setIsProcessModalOpen(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          onProcessComplete={() => {
            refetch();
            setIsProcessModalOpen(false);
            setSelectedInvoice(null);
            toast({
              title: "Başarılı",
              description: "E-fatura başarıyla işlendi"
            });
          }}
        />
      )}
    </div>
  );
}