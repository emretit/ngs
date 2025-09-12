import React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Download, FileText, MoreHorizontal } from "lucide-react";
import EInvoiceStatusBadge from "./EInvoiceStatusBadge";

interface SalesInvoicesTableProps {
  invoices: any[];
  isLoading: boolean;
  onSelectInvoice: (invoice: any) => void;
  onSendInvoice?: (salesInvoiceId: string) => void;
  searchQuery?: string;
  documentTypeFilter?: string;
}

const SalesInvoicesTable = ({
  invoices,
  isLoading,
  onSelectInvoice,
  onSendInvoice,
  searchQuery,
  documentTypeFilter
}: SalesInvoicesTableProps) => {
  // Metinleri kısalt
  const shortenText = (text: string, maxLength: number = 25) => {
    if (!text) return "";
    
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength - 3) + "...";
  };

  // Müşteri ismini kısalt
  const getShortenedCustomerName = (customerName: string) => {
    return shortenText(customerName, 35);
  };

  // Şirket bilgisini kısalt
  const getShortenedCompanyInfo = (companyInfo: string) => {
    return shortenText(companyInfo, 30);
  };

  // Filter invoices based on criteria
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchQuery || 
      invoice.fatura_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.customer?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (invoice.aciklama?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      
    const matchesDocumentType = documentTypeFilter === "all" || invoice.document_type === documentTypeFilter;
    
    return matchesSearch && matchesDocumentType;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
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

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">📄 Fatura No</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-left">🏢 Müşteri Bilgileri</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">📅 Tarih</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">💰 Tutar</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">📋 Tip</TableHead>
            <TableHead className="font-bold text-foreground/80 text-sm tracking-wide text-center">⚡ E-Fatura</TableHead>
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
          <TableHead className="w-[25%] font-bold text-foreground/80 text-sm tracking-wide text-left">🏢 Müşteri Bilgileri</TableHead>
          <TableHead className="w-[12%] font-bold text-foreground/80 text-sm tracking-wide text-center">📅 Tarih</TableHead>
          <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-center">💰 Tutar</TableHead>
          <TableHead className="w-[12%] font-bold text-foreground/80 text-sm tracking-wide text-center">📋 Tip</TableHead>
          <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-center">⚡ E-Fatura</TableHead>
          <TableHead className="w-[6%] font-bold text-foreground/80 text-sm tracking-wide text-right">⚙️ İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredInvoices.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
              Bu kriterlere uygun fatura bulunamadı
            </TableCell>
          </TableRow>
        ) : (
          filteredInvoices.map((invoice) => (
            <TableRow key={invoice.id} onClick={() => onSelectInvoice(invoice)} className="cursor-pointer hover:bg-blue-50 h-8">
              <TableCell className="font-medium py-1 px-2 text-xs">
                <span className={`${invoice.fatura_no ? 'text-blue-600' : 'text-gray-400'}`}>
                  {invoice.fatura_no ? shortenText(invoice.fatura_no, 20) : 'Henüz atanmadı'}
                </span>
              </TableCell>
              <TableCell className="py-1 px-2">
                {invoice.customer ? (
                  <div className="flex flex-col space-y-0.5">
                    {invoice.customer.company ? (
                      <span className="text-xs font-medium" title={invoice.customer.company}>
                        {getShortenedCompanyInfo(invoice.customer.company)}
                      </span>
                    ) : (
                      <span className="text-xs font-medium" title={invoice.customer.name}>
                        {getShortenedCustomerName(invoice.customer.name)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-500 text-xs">-</span>
                )}
              </TableCell>
              <TableCell className="text-center py-1 px-1 text-xs">
                {invoice.fatura_tarihi ? (
                  format(new Date(invoice.fatura_tarihi), "dd MMM yyyy", { locale: tr })
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-center py-1 px-1 text-xs font-medium">
                {invoice.toplam_tutar ? formatCurrency(invoice.toplam_tutar) : '-'}
              </TableCell>
              <TableCell className="text-center py-1 px-1">
                {getDocumentTypeBadge(invoice.document_type)}
              </TableCell>
              <TableCell className="text-center py-1 px-1">
                <EInvoiceStatusBadge 
                  salesInvoiceId={invoice.id}
                  customerTaxNumber={invoice.customer?.tax_number}
                  onSendClick={() => {
                    console.log('Sending invoice:', invoice.id);
                    // Use the sendInvoice function from parent component
                    if (onSendInvoice) {
                      onSendInvoice(invoice.id);
                    }
                  }}
                  invoiceData={{
                    einvoice_status: invoice.einvoice_status,
                    nilvera_invoice_id: invoice.nilvera_invoice_id,
                    einvoice_sent_at: invoice.einvoice_sent_at,
                    einvoice_error_message: invoice.einvoice_error_message
                  }}
                />
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
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 w-6 hover:bg-gray-100"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default SalesInvoicesTable;
