import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, Trash2, Download, FileText, MoreHorizontal } from "lucide-react";
import EInvoiceStatusBadge from "./EInvoiceStatusBadge";
import SalesInvoicesTableHeader from "./table/SalesInvoicesTableHeader";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface SalesInvoicesTableProps {
  invoices: any[];
  isLoading: boolean;
  onSelectInvoice: (invoice: any) => void;
  onInvoiceSelectToggle?: (invoice: any) => void;
  selectedInvoices?: any[];
  setSelectedInvoices?: (invoices: any[]) => void;
  onSendInvoice?: (salesInvoiceId: string) => void;
  searchQuery?: string;
  documentTypeFilter?: string;
}

const SalesInvoicesTable = ({
  invoices,
  isLoading,
  onSelectInvoice,
  onInvoiceSelectToggle,
  selectedInvoices = [],
  setSelectedInvoices,
  onSendInvoice,
  searchQuery,
  documentTypeFilter
}: SalesInvoicesTableProps) => {
  // Sorting state
  const [sortField, setSortField] = useState<string>('tarih');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Columns definition
  const columns = [
    { id: 'fatura_no', label: 'Fatura No', visible: true, sortable: true },
    { id: 'musteri', label: 'Müşteri Bilgileri', visible: true, sortable: true },
    { id: 'tarih', label: 'Tarih', visible: true, sortable: true },
    { id: 'tutar', label: 'Tutar', visible: true, sortable: true },
    { id: 'tip', label: 'Tip', visible: true, sortable: false },
    { id: 'e_fatura', label: 'E-Fatura', visible: true, sortable: false },
    { id: 'actions', label: 'İşlemler', visible: true, sortable: false }
  ];

  // Handle sort
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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

  // Filter and sort invoices
  const filteredInvoices = invoices
    .filter(invoice => {
      const matchesSearch = !searchQuery ||
        invoice.fatura_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (invoice.customer?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (invoice.aciklama?.toLowerCase() || "").includes(searchQuery.toLowerCase());

      const matchesDocumentType = documentTypeFilter === "all" || invoice.document_type === documentTypeFilter;

      return matchesSearch && matchesDocumentType;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'fatura_no':
          aValue = a.fatura_no || '';
          bValue = b.fatura_no || '';
          break;
        case 'musteri':
          aValue = a.customer?.company || a.customer?.name || '';
          bValue = b.customer?.company || b.customer?.name || '';
          break;
        case 'tarih':
          aValue = a.fatura_tarihi ? new Date(a.fatura_tarihi).getTime() : 0;
          bValue = b.fatura_tarihi ? new Date(b.fatura_tarihi).getTime() : 0;
          break;
        case 'tutar':
          aValue = a.toplam_tutar || 0;
          bValue = b.toplam_tutar || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
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

  // Tüm faturaları seç/kaldır
  const handleSelectAll = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices?.([]);
    } else {
      setSelectedInvoices?.(filteredInvoices);
    }
  };

  if (isLoading) {
    return (
      <Table>
        <SalesInvoicesTableHeader
          columns={columns}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          hasSelection={true}
          isAllSelected={false}
        />
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-4" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-6 w-6" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <SalesInvoicesTableHeader
        columns={columns}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        hasSelection={true}
        onSelectAll={handleSelectAll}
        isAllSelected={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
      />
      <TableBody>
        {filteredInvoices.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
              Bu kriterlere uygun fatura bulunamadı
            </TableCell>
          </TableRow>
        ) : (
          filteredInvoices.map((invoice) => (
            <TableRow key={invoice.id} className="cursor-pointer hover:bg-blue-50 h-8">
              <TableCell className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedInvoices.some(inv => inv.id === invoice.id)}
                  onCheckedChange={() => onInvoiceSelectToggle?.(invoice)}
                />
              </TableCell>
              <TableCell className="font-medium py-2 px-3 text-xs" onClick={() => onSelectInvoice(invoice)}>
                <span className={`${invoice.fatura_no ? 'text-blue-600' : 'text-gray-400'}`}>
                  {invoice.fatura_no ? shortenText(invoice.fatura_no, 20) : 'Henüz atanmadı'}
                </span>
              </TableCell>
              <TableCell className="py-2 px-3" onClick={() => onSelectInvoice(invoice)}>
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
              <TableCell className="text-center py-2 px-3 text-xs" onClick={() => onSelectInvoice(invoice)}>
                {invoice.fatura_tarihi ? (
                  format(new Date(invoice.fatura_tarihi), "dd MMM yyyy", { locale: tr })
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-center py-2 px-3 text-xs font-medium" onClick={() => onSelectInvoice(invoice)}>
                {invoice.toplam_tutar ? formatCurrency(invoice.toplam_tutar) : '-'}
              </TableCell>
              <TableCell className="text-center py-2 px-3" onClick={() => onSelectInvoice(invoice)}>
                {getDocumentTypeBadge(invoice.document_type)}
              </TableCell>
              <TableCell className="text-center py-2 px-3" onClick={(e) => e.stopPropagation()}>
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
              <TableCell className="py-2 px-3 text-center">
                <div className="flex justify-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectInvoice(invoice);
                    }}
                    className="h-8 w-8"
                    title="Düzenle"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: onDelete eklenmeli
                    }}
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 w-8"
                        title="Daha Fazla"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Dropdown içeriği eklenecek */}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
