import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import EInvoiceStatusBadge from "@/components/sales/EInvoiceStatusBadge";
import { useEInvoice } from "@/hooks/useEInvoice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  FileUp, 
  Search, 
  Filter, 
  Download,
  Eye,
  FileText,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { useSalesInvoices } from "@/hooks/useSalesInvoices";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface SalesInvoicesProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const SalesInvoices = ({ isCollapsed, setIsCollapsed }: SalesInvoicesProps) => {
  const navigate = useNavigate();
  const { 
    invoices, 
    isLoading, 
    filters, 
    setFilters,
  } = useSalesInvoices();
  const { sendInvoice } = useEInvoice();
  
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

  const getDocumentTypeBadge = (type: any) => {
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
                Kesilmiş satış faturalarının yönetimi ve takibi
              </p>
            </div>
            <Button 
              onClick={() => navigate('/sales-invoices/create')}
              className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-primary to-primary/90"
            >
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

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold">Kesilmiş Faturalar</h2>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Dışa Aktar
                  </Button>
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
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="odendi">Ödendi</SelectItem>
                      <SelectItem value="kismi_odendi">Kısmi Ödendi</SelectItem>
                      <SelectItem value="odenmedi">Ödenmedi</SelectItem>
                      <SelectItem value="gecikti">Gecikti</SelectItem>
                      <SelectItem value="iptal">İptal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Fatura no, müşteri adı veya açıklama ile ara..."
                    className="pl-9"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
              </div>

              {isLoading ? (
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
              ) : invoices && invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-700">Fatura No</th>
                        <th className="text-left p-4 font-medium text-gray-700">Müşteri</th>
                        <th className="text-left p-4 font-medium text-gray-700">Tarih</th>
                        <th className="text-left p-4 font-medium text-gray-700">Tutar</th>
                        <th className="text-left p-4 font-medium text-gray-700">Ödeme Durumu</th>
                        <th className="text-left p-4 font-medium text-gray-700">Tip</th>
                        <th className="text-left p-4 font-medium text-gray-700">E-Fatura</th>
                        <th className="text-center p-4 font-medium text-gray-700">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice, index) => (
                        <tr key={invoice.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <span className="font-medium text-blue-600">{invoice.fatura_no}</span>
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{invoice.customer?.name}</div>
                              {invoice.customer?.company && (
                                <div className="text-sm text-gray-500">{invoice.customer.company}</div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {format(new Date(invoice.fatura_tarihi), "dd.MM.yyyy", { locale: tr })}
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="font-medium">{formatCurrency(invoice.toplam_tutar)}</div>
                              {invoice.odenen_tutar > 0 && (
                                <div className="text-sm text-green-600">Ödenen: {formatCurrency(invoice.odenen_tutar)}</div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {getStatusBadge(invoice.odeme_durumu)}
                          </td>
                          <td className="p-4">
                            {getDocumentTypeBadge(invoice.document_type)}
                          </td>
                          <td className="p-4">
                            <EInvoiceStatusBadge 
                              salesInvoiceId={invoice.id}
                              onSendClick={() => sendInvoice(invoice.id)}
                            />
                          </td>
                          <td className="p-4 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Görüntüle
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  PDF İndir
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Düzenle
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
      </main>
    </div>
  );
};

export default SalesInvoices;