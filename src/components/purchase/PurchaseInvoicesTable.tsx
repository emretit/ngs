import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, Trash2, Download, FileText, MoreHorizontal, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import PurchaseInvoicesTableHeader from "./table/PurchaseInvoicesTableHeader";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface PurchaseInvoicesTableProps {
  invoices: any[];
  incomingInvoices: any[];
  earchiveInvoices: any[];
  isLoading: boolean;
  onSelectInvoice: (invoice: any) => void;
  onInvoiceSelectToggle?: (invoice: any) => void;
  selectedInvoices?: any[];
  setSelectedInvoices?: (invoices: any[]) => void;
  onDownloadPdf?: (invoiceId: string, type: 'e-fatura' | 'e-arşiv') => Promise<void>;
  isDownloading?: boolean;
  searchQuery?: string;
  documentTypeFilter?: string;
  statusFilter?: string;
  onDeleteInvoice?: (id: string) => void;
}

const PurchaseInvoicesTable = ({
  invoices,
  incomingInvoices,
  earchiveInvoices,
  isLoading,
  onSelectInvoice,
  onInvoiceSelectToggle,
  selectedInvoices = [],
  setSelectedInvoices,
  onDownloadPdf,
  isDownloading = false,
  searchQuery,
  documentTypeFilter,
  statusFilter,
  onDeleteInvoice
}: PurchaseInvoicesTableProps) => {
  // Sorting state
  const [sortField, setSortField] = useState<string>('tarih');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Her satır için ayrı loading state
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  
  // Silme dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Columns definition
  const columns = [
    { id: 'fatura_no', label: 'Fatura No', visible: true, sortable: true },
    { id: 'tedarikci', label: 'Tedarikçi', visible: true, sortable: true },
    { id: 'tarih', label: 'Tarih', visible: true, sortable: true },
    { id: 'tutar', label: 'Tutar', visible: true, sortable: true },
    { id: 'durum', label: 'Durum', visible: true, sortable: false },
    { id: 'tip', label: 'Tip', visible: true, sortable: false },
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

  const handleDeleteClick = (invoice: any, e: React.MouseEvent) => {
    e.stopPropagation();
    // Sadece purchase tipindeki faturaları silebiliriz
    if (invoice.sourceType !== 'purchase') {
      return;
    }
    setInvoiceToDelete(invoice);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete || !onDeleteInvoice) return;

    setIsDeleting(true);
    try {
      await onDeleteInvoice(invoiceToDelete.id);
    } catch (error) {
      console.error('Error deleting invoice:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setInvoiceToDelete(null);
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
  ].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'fatura_no':
        aValue = a.displayNumber || '';
        bValue = b.displayNumber || '';
        break;
      case 'tedarikci':
        aValue = a.displaySupplier || '';
        bValue = b.displaySupplier || '';
        break;
      case 'tarih':
        aValue = a.sortDate || 0;
        bValue = b.sortDate || 0;
        break;
      case 'tutar':
        aValue = a.displayAmount || 0;
        bValue = b.displayAmount || 0;
        break;
      default:
        return b.sortDate - a.sortDate; // Default to date descending
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  // Debug için allInvoices'ı da logla
  console.log('🔍 PurchaseInvoicesTable - allInvoices:', allInvoices);

  // Tüm faturaları seç/kaldır
  const handleSelectAll = () => {
    if (selectedInvoices.length === allInvoices.length) {
      setSelectedInvoices?.([]);
    } else {
      setSelectedInvoices?.(allInvoices);
    }
  };

  if (isLoading) {
    return (
      <Table>
        <PurchaseInvoicesTableHeader
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
    <>
    <Table>
      <PurchaseInvoicesTableHeader
        columns={columns}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        hasSelection={true}
        onSelectAll={handleSelectAll}
        isAllSelected={selectedInvoices.length === allInvoices.length && allInvoices.length > 0}
      />
      <TableBody>
        {allInvoices.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz fatura bulunmuyor</p>
            </TableCell>
          </TableRow>
        ) : (
          allInvoices.map((invoice, index) => (
            <TableRow
              key={`${invoice.sourceType}-${invoice.id}-${index}`}
              className="cursor-pointer hover:bg-blue-50 h-8"
            >
              <TableCell className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedInvoices.some(inv => inv.id === invoice.id && inv.sourceType === invoice.sourceType)}
                  onCheckedChange={() => onInvoiceSelectToggle?.(invoice)}
                />
              </TableCell>
              <TableCell className="font-medium py-2 px-3 text-xs" onClick={() => onSelectInvoice(invoice)}>
                <span className="text-blue-600">
                  {invoice.displayNumber}
                </span>
              </TableCell>
              <TableCell className="py-2 px-3" onClick={() => onSelectInvoice(invoice)}>
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
              <TableCell className="text-center py-2 px-3 text-xs" onClick={() => onSelectInvoice(invoice)}>
                {format(new Date(invoice.invoiceDate), "dd MMM yyyy", { locale: tr })}
              </TableCell>
              <TableCell className="text-center py-2 px-3 text-xs font-medium" onClick={() => onSelectInvoice(invoice)}>
                {formatCurrency(invoice.displayAmount)}
              </TableCell>
              <TableCell className="text-center py-2 px-3" onClick={() => onSelectInvoice(invoice)}>
                {getStatusBadge(invoice.displayStatus)}
              </TableCell>
              <TableCell className="text-center py-2 px-3" onClick={() => onSelectInvoice(invoice)}>
                {getDocumentTypeBadge(invoice.sourceType)}
              </TableCell>
              <TableCell className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
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
                  
                  {invoice.sourceType === 'purchase' && onDeleteInvoice && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteClick(invoice, e)}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      title="Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {/* PDF Önizleme butonu - E-fatura ve E-arşiv faturaları için */}
                  {onDownloadPdf && (
                    <>
                      {/* İşlenmiş e-faturalar için (purchase tipinde ama einvoice_id var) */}
                      {invoice.sourceType === 'purchase' && invoice.einvoice_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const invoiceKey = `purchase-${invoice.einvoice_id}`;
                            setDownloadingInvoiceId(invoiceKey);
                            try {
                              await onDownloadPdf(invoice.einvoice_id, 'e-fatura');
                            } catch (error) {
                              console.error('PDF önizleme hatası:', error);
                            } finally {
                              setDownloadingInvoiceId(null);
                            }
                          }}
                          disabled={downloadingInvoiceId === `purchase-${invoice.einvoice_id}`}
                          className="h-8 w-8"
                          title="PDF Önizleme"
                        >
                          {downloadingInvoiceId === `purchase-${invoice.einvoice_id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      
                      {/* Gelen e-faturalar için (incoming veya earchive_received tipinde) */}
                      {(invoice.sourceType === 'incoming' || invoice.sourceType === 'earchive_received') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const invoiceKey = `${invoice.sourceType}-${invoice.id}`;
                            setDownloadingInvoiceId(invoiceKey);
                            try {
                              const invoiceType = invoice.sourceType === 'incoming' ? 'e-fatura' : 'e-arşiv';
                              await onDownloadPdf(invoice.id, invoiceType);
                            } catch (error) {
                              console.error('PDF önizleme hatası:', error);
                            } finally {
                              setDownloadingInvoiceId(null);
                            }
                          }}
                          disabled={downloadingInvoiceId === `${invoice.sourceType}-${invoice.id}`}
                          className="h-8 w-8"
                          title="PDF Önizleme"
                        >
                          {downloadingInvoiceId === `${invoice.sourceType}-${invoice.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </>
                  )}
                  
                  {/* Eski dropdown menü - artık kullanılmıyor ama geriye dönük uyumluluk için */}
                  {(invoice.sourceType === 'earchive_received' && onDownloadPdf && false) && (
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
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onDownloadPdf(invoice.id, 'e-arşiv');
                        }}>
                          <Download className="h-4 w-4 mr-2" />
                          PDF İndir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
    {/* Confirmation Dialog */}
    <ConfirmationDialogComponent
      open={isDeleteDialogOpen}
      onOpenChange={setIsDeleteDialogOpen}
      title="Faturayı Sil"
      description={`"${invoiceToDelete?.displayNumber || invoiceToDelete?.invoice_number || 'Bu fatura'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
      confirmText="Sil"
      cancelText="İptal"
      variant="destructive"
      onConfirm={handleDeleteConfirm}
      onCancel={handleDeleteCancel}
      isLoading={isDeleting}
    />
    </>
  );
};

export default PurchaseInvoicesTable;
