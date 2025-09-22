import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface PurchaseInvoicesTableProps {
  invoices: any[];
  incomingInvoices: any[];
  earchiveInvoices: any[];
  isLoading: boolean;
  onSelectInvoice: (invoice: any) => void;
  onDownloadPdf?: (invoiceId: string, type: string) => void;
  searchQuery?: string;
  documentTypeFilter?: string;
  statusFilter?: string;
}

const PurchaseInvoicesTable = ({
  invoices,
  incomingInvoices,
  earchiveInvoices,
  isLoading,
  onSelectInvoice,
  onDownloadPdf,
  searchQuery,
  documentTypeFilter,
  statusFilter
}: PurchaseInvoicesTableProps) => {
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
      case 'received':
        return <Badge className="bg-green-500">Alındı</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const getDocumentTypeBadge = (sourceType: string) => {
    switch (sourceType) {
      case 'purchase':
        return <Badge variant="outline" className="border-gray-500 text-gray-700">Normal Fatura</Badge>;
      case 'incoming':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Gelen E-Fatura</Badge>;
      case 'earchive_received':
        return <Badge variant="outline" className="border-purple-500 text-purple-700">Gelen E-Arşiv</Badge>;
      default:
        return <Badge variant="outline">{sourceType}</Badge>;
    }
  };

  // Filtreleme fonksiyonu
  const filterInvoices = (invoiceList: any[], sourceType: string) => {
    return invoiceList.filter(invoice => {
      // Arama filtresi
      const matchesSearch = !searchQuery || 
        invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        'Tedarikçi'.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Belge tipi filtresi
      const matchesDocumentType = documentTypeFilter === "all" || 
        (documentTypeFilter === "purchase" && sourceType === "purchase") ||
        (documentTypeFilter === "incoming" && sourceType === "incoming") ||
        (documentTypeFilter === "earchive" && sourceType === "earchive_received");
      
      // Durum filtresi
      const matchesStatus = statusFilter === "all" || 
        invoice.status === statusFilter ||
        (statusFilter === "received" && (sourceType === "incoming" || sourceType === "earchive_received"));
      
      return matchesSearch && matchesDocumentType && matchesStatus;
    });
  };

  // Debug için console.log ekle
  console.log('🔍 PurchaseInvoicesTable - invoices:', invoices);
  console.log('🔍 PurchaseInvoicesTable - incomingInvoices:', incomingInvoices);
  console.log('🔍 PurchaseInvoicesTable - earchiveInvoices:', earchiveInvoices);
  
  // Tüm faturaları birleştir ve filtrele
  const allInvoices = [
    ...filterInvoices(invoices, 'purchase').map(invoice => {
      // Debug için supplier bilgisini logla
      console.log('🔍 Invoice supplier debug:', {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        supplier: invoice.supplier,
        supplier_name: invoice.supplier?.name,
        supplier_company: invoice.supplier?.company
      });
      
      return {
        ...invoice,
        sourceType: 'purchase',
        invoiceDate: invoice.invoice_date,
        sortDate: new Date(invoice.invoice_date).getTime(),
        displayNumber: invoice.invoice_number,
        displaySupplier: invoice.supplier?.name || invoice.supplier?.company || 'Bilinmeyen Tedarikçi',
        displayAmount: invoice.total_amount,
        displayStatus: invoice.status
      };
    }),
    ...filterInvoices(incomingInvoices, 'incoming').filter(invoice => 
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
    ...filterInvoices(earchiveInvoices, 'earchive_received').filter(invoice => 
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
  ].sort((a, b) => b.sortDate - a.sortDate);
  
  // Debug için allInvoices'ı da logla
  console.log('🔍 PurchaseInvoicesTable - allInvoices:', allInvoices);

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">📄 Fatura No</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">🏢 Tedarikçi</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">📅 Tarih</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">💰 Tutar</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">📋 Durum</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">📋 Tip</TableHead>
            <TableHead className="w-[50px] font-bold text-foreground/80 text-sm tracking-wide text-right">⚙️ İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-left">📄 Fatura No</TableHead>
          <TableHead className="w-[25%] font-bold text-foreground/80 text-sm tracking-wide text-left">🏢 Tedarikçi</TableHead>
          <TableHead className="w-[12%] font-bold text-foreground/80 text-sm tracking-wide text-center">📅 Tarih</TableHead>
          <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-center">💰 Tutar</TableHead>
          <TableHead className="w-[12%] font-bold text-foreground/80 text-sm tracking-wide text-center">📋 Durum</TableHead>
          <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-center">📋 Tip</TableHead>
          <TableHead className="w-[6%] font-bold text-foreground/80 text-sm tracking-wide text-right">⚙️ İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {allInvoices.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz fatura bulunmuyor</p>
            </TableCell>
          </TableRow>
        ) : (
          allInvoices.map((invoice, index) => (
            <TableRow 
              key={`${invoice.sourceType}-${invoice.id}-${index}`} 
              onClick={() => onSelectInvoice(invoice)} 
              className="cursor-pointer hover:bg-blue-50 h-8"
            >
              <TableCell className="font-medium py-1 px-2 text-xs">
                <span className="text-blue-600">
                  {invoice.displayNumber}
                </span>
              </TableCell>
              <TableCell className="py-1 px-2">
                <div className="flex flex-col space-y-0.5">
                  <span className="text-xs font-medium">
                    {invoice.displaySupplier}
                  </span>
                  {(invoice.sourceType === 'incoming' || invoice.sourceType === 'earchive_received') && (
                    <span className="text-xs text-gray-500">
                      VKN: {(invoice as any).supplierTaxNumber || (invoice as any).customerTaxNumber}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center py-1 px-1 text-xs">
                {format(new Date(invoice.invoiceDate), "dd MMM yyyy", { locale: tr })}
              </TableCell>
              <TableCell className="text-center py-1 px-1 text-xs font-medium">
                {formatCurrency(invoice.displayAmount)}
              </TableCell>
              <TableCell className="text-center py-1 px-1">
                {getStatusBadge(invoice.displayStatus)}
              </TableCell>
              <TableCell className="text-center py-1 px-1">
                {getDocumentTypeBadge(invoice.sourceType)}
              </TableCell>
              <TableCell className="py-1 px-1">
                <div className="flex justify-end space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectInvoice(invoice);
                    }}
                    className="h-6 w-6 hover:bg-blue-100"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  {(invoice.sourceType === 'earchive_received') && onDownloadPdf && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadPdf(invoice.id, 'e-arşiv');
                      }}
                      className="h-6 w-6 hover:bg-gray-100 text-blue-600"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default PurchaseInvoicesTable;
