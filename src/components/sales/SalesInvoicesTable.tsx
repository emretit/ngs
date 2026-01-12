import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { useNavigate } from "react-router-dom";
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
import { Edit2, Trash2, Download, FileText, MoreHorizontal, Copy, Eye, Loader2 } from "lucide-react";
import EInvoiceStateBadge from "./EInvoiceStateBadge";
import SalesInvoicesTableHeader from "./table/SalesInvoicesTableHeader";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { useNilveraPdf } from "@/hooks/useNilveraPdf";
import { useVeribanPdf } from "@/hooks/useVeribanPdf";
import { IntegratorService, IntegratorType } from "@/services/integratorService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SalesInvoicesTableProps {
  invoices: any[];
  isLoading: boolean;
  onSelectInvoice: (invoice: any) => void;
  onInvoiceSelectToggle?: (invoice: any) => void;
  selectedInvoices?: any[];
  setSelectedInvoices?: (invoices: any[]) => void;
  onSendInvoice?: (salesInvoiceId: string) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
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
  onDeleteInvoice,
  searchQuery,
  documentTypeFilter
}: SalesInvoicesTableProps) => {
  const navigate = useNavigate();
  const { downloadAndOpenPdf: downloadNilveraPdf } = useNilveraPdf();
  const { downloadAndOpenPdf: downloadVeribanPdf } = useVeribanPdf();
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('tarih');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null);
  
  // PDF downloading state
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  
  // Integrator state
  const [currentIntegrator, setCurrentIntegrator] = useState<IntegratorType | null>(null);

  // Get current integrator
  useEffect(() => {
    const fetchIntegrator = async () => {
      const integrator = await IntegratorService.getSelectedIntegrator();
      setCurrentIntegrator(integrator);
    };
    fetchIntegrator();
  }, []);

  // PDF'in mevcut olup olmadığını kontrol et
  const [outgoingInvoiceIds, setOutgoingInvoiceIds] = useState<Record<string, string>>({});
  const [fetchingOutgoingInvoices, setFetchingOutgoingInvoices] = useState(false);

  useEffect(() => {
    // Sadece Veriban aktifse ve faturalarda outgoing_invoice_id varsa kontrol et
    if (currentIntegrator !== 'veriban' || invoices.length === 0) return;

    const fetchOutgoingInvoiceIds = async () => {
      if (fetchingOutgoingInvoices) return;
      setFetchingOutgoingInvoices(true);

      try {
        // İlişki: sales_invoices.outgoing_invoice_id = outgoing_invoices.id
        const invoicesWithOutgoing = invoices.filter(inv => inv.outgoing_invoice_id);
        
        if (invoicesWithOutgoing.length === 0) {
          logger.debug('ℹ️ [SalesInvoicesTable] Veriban ile ilişkili fatura yok');
          setFetchingOutgoingInvoices(false);
          return;
        }
        
        const outgoingIds = invoicesWithOutgoing.map(inv => inv.outgoing_invoice_id);
        
        logger.debug('🔍 [SalesInvoicesTable] Checking outgoing_invoice_ids:', outgoingIds);
        
        const { data, error } = await supabase
          .from('outgoing_invoices')
          .select('id, ettn')
          .in('id', outgoingIds);

        if (error) {
          logger.error('❌ [SalesInvoicesTable] Error fetching outgoing invoices:', error);
          return;
        }

        logger.debug('✅ [SalesInvoicesTable] Outgoing invoices found:', data?.length || 0);

        if (data) {
          // sales_invoice_id -> outgoing_invoice_id mapping oluştur
          const mapping: Record<string, string> = {};
          invoicesWithOutgoing.forEach(inv => {
            if (inv.outgoing_invoice_id && data.some(d => d.id === inv.outgoing_invoice_id)) {
              mapping[inv.id] = inv.outgoing_invoice_id;
            }
          });
          setOutgoingInvoiceIds(mapping);
          logger.debug('📊 [SalesInvoicesTable] Outgoing invoice mapping:', mapping);
        }
      } catch (error) {
        logger.error('❌ [SalesInvoicesTable] Exception in fetchOutgoingInvoiceIds:', error);
      } finally {
        setFetchingOutgoingInvoices(false);
      }
    };

    fetchOutgoingInvoiceIds();
  }, [invoices, currentIntegrator]);

  // Columns definition
  const columns = [
    { id: 'fatura_no', label: 'Fatura No', visible: true, sortable: true },
    { id: 'musteri', label: 'Müşteri Bilgileri', visible: true, sortable: true },
    { id: 'tarih', label: 'Tarih', visible: true, sortable: true },
    { id: 'tutar', label: 'Tutar', visible: true, sortable: true },
    { id: 'tip', label: 'Fatura Tipi', visible: true, sortable: false },
    { id: 'fatura_tipi2', label: 'Fatura Tipi 2', visible: true, sortable: false },
    { id: 'e_fatura_durumu', label: 'E-Fatura Durumu', visible: true, sortable: false },
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
        (invoice.customer?.company?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (invoice.supplier?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (invoice.supplier?.company?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
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
          aValue = a.customer?.company || a.customer?.name || a.supplier?.company || a.supplier?.name || '';
          bValue = b.customer?.company || b.customer?.name || b.supplier?.company || b.supplier?.name || '';
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

  // Giden e-fatura ile aynı tip badge'leri kullan
  const getInvoiceTypeBadge = (invoiceType: string) => {
    switch (invoiceType) {
      case 'SATIS':
        return <Badge className="bg-green-100 text-green-800 text-xs">Satış</Badge>;
      case 'IADE':
        return <Badge className="bg-red-100 text-red-800 text-xs">İade</Badge>;
      case 'OZELMATRAH':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Özel Matrah</Badge>;
      case 'TEVKIFAT_IADE':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Tevkifat İade</Badge>;
      case 'KONAKLAMA':
        return <Badge className="bg-purple-100 text-purple-800 text-xs">Konaklama</Badge>;
      case 'SGK':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">SGK</Badge>;
      case 'IHRAC_KAYITLI':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">İhraç Kayıtlı</Badge>;
      case 'ISTISNA':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">İstisna</Badge>;
      case 'TEMEL':
        return <Badge className="bg-gray-100 text-gray-800 text-xs">Temel</Badge>;
      case 'TICARI':
        return <Badge className="bg-green-100 text-green-800 text-xs">Ticari</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs">{invoiceType || 'Bilinmiyor'}</Badge>;
    }
  };

  const getInvoiceProfileBadge = (invoiceProfile: string) => {
    switch (invoiceProfile) {
      case 'TEMELFATURA':
        return <Badge variant="outline" className="border-blue-500 text-blue-700 text-xs">Temel Fatura</Badge>;
      case 'TICARIFATURA':
        return <Badge variant="outline" className="border-green-500 text-green-700 text-xs">Ticari Fatura</Badge>;
      case 'IHRACAT':
        return <Badge variant="outline" className="border-purple-500 text-purple-700 text-xs">İhracat</Badge>;
      case 'YOLCUBERABERFATURA':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700 text-xs">Yolcu Beraber</Badge>;
      case 'EARSIVFATURA':
        return <Badge variant="outline" className="border-indigo-500 text-indigo-700 text-xs">E-Arşiv</Badge>;
      case 'KAMU':
        return <Badge variant="outline" className="border-red-500 text-red-700 text-xs">Kamu</Badge>;
      case 'HKS':
        return <Badge variant="outline" className="border-gray-500 text-gray-700 text-xs">HKS</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-500 text-gray-700 text-xs">{invoiceProfile || 'Bilinmiyor'}</Badge>;
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

  // Silme işlemi
  const handleDeleteClick = (invoice: any) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (invoiceToDelete && onDeleteInvoice) {
      onDeleteInvoice(invoiceToDelete.id);
    }
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
  };

  // Fatura için PDF'in mevcut olup olmadığını kontrol et
  const hasPdfAvailable = (invoice: any) => {
    // Nilvera kontrolü (Nilvera entegratör kullanılıyorsa)
    if (currentIntegrator === 'nilvera' && invoice.nilvera_invoice_id) return true;
    
    // Veriban kontrolü (outgoing_invoice_id ile ilişkilendirilmiş)
    if (currentIntegrator === 'veriban' && outgoingInvoiceIds[invoice.id]) return true;
    
    // Fallback: Her iki entegratör için de kontrol
    if (invoice.nilvera_invoice_id || outgoingInvoiceIds[invoice.id]) return true;
    
    return false;
  };

  // PDF indirme - hem Nilvera hem Veriban destekli
  const handleDownloadPdf = async (invoice: any) => {
    setDownloadingInvoiceId(invoice.id);
    try {
      const invoiceType = invoice.invoice_profile === 'EARSIVFATURA' ? 'e-arşiv' : 'e-fatura';
      
      // Veriban kontrolü - outgoing_invoice_id varsa Veriban ile indir
      if (currentIntegrator === 'veriban' && outgoingInvoiceIds[invoice.id]) {
        logger.debug('📄 [PDF Download] Veriban ile indiriliyor:', outgoingInvoiceIds[invoice.id]);
        await downloadVeribanPdf(outgoingInvoiceIds[invoice.id], invoiceType, 'outgoing');
        return;
      }
      
      // Nilvera kontrolü
      if (invoice.nilvera_invoice_id) {
        logger.debug('📄 [PDF Download] Nilvera ile indiriliyor:', invoice.nilvera_invoice_id);
        await downloadNilveraPdf(invoice.nilvera_invoice_id, invoiceType);
        return;
      }
      
      // Hiçbir entegratör ile ilişkili değilse
      toast.error('Bu fatura için PDF bulunamadı. Lütfen önce e-fatura gönderin.');
    } catch (error) {
      logger.error('PDF önizleme hatası:', error);
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  // Fatura kopyalama
  const handleCopyInvoice = (invoice: any) => {
    navigate(`/sales-invoices/new?copyFrom=${invoice.id}`);
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
            <TableCell colSpan={9} className="text-center py-8 text-gray-500">
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
                ) : invoice.supplier ? (
                  <div className="flex flex-col space-y-0.5">
                    {invoice.supplier.company ? (
                      <span className="text-xs font-medium" title={invoice.supplier.company}>
                        {getShortenedCompanyInfo(invoice.supplier.company)}
                      </span>
                    ) : (
                      <span className="text-xs font-medium" title={invoice.supplier.name}>
                        {getShortenedCustomerName(invoice.supplier.name)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-500 text-xs">-</span>
                )}
              </TableCell>
              <TableCell className="text-center py-2 px-3 text-xs" onClick={() => onSelectInvoice(invoice)}>
                {(() => {
                  const dateValue = invoice.fatura_tarihi;
                  if (!dateValue) return <span className="text-muted-foreground">-</span>;
                  const dateObj = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
                  if (isNaN(dateObj.getTime())) return <span className="text-muted-foreground">-</span>;
                  return dateObj.toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  });
                })()}
              </TableCell>
              <TableCell className="text-center py-2 px-3 text-xs font-medium" onClick={() => onSelectInvoice(invoice)}>
                {invoice.toplam_tutar ? formatCurrency(invoice.toplam_tutar) : '-'}
              </TableCell>
              <TableCell className="text-center py-2 px-3" onClick={() => onSelectInvoice(invoice)}>
                <div className="flex flex-col items-center gap-1">
                  {invoice.invoice_type && getInvoiceTypeBadge(invoice.invoice_type)}
                  {invoice.invoice_profile && getInvoiceProfileBadge(invoice.invoice_profile)}
                  {!invoice.invoice_type && !invoice.invoice_profile && getDocumentTypeBadge(invoice.document_type)}
                </div>
              </TableCell>
              <TableCell className="text-center py-2 px-3" onClick={() => onSelectInvoice(invoice)}>
                {invoice.fatura_tipi2 ? (
                  invoice.fatura_tipi2 === 'e-arşiv' ? (
                    <Badge variant="outline" className="border-purple-500 text-purple-700 bg-purple-50">e-Arşiv</Badge>
                  ) : (
                    <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">e-Fatura</Badge>
                  )
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </TableCell>
              <TableCell className="text-center py-2 px-3" onClick={(e) => e.stopPropagation()}>
                <EInvoiceStateBadge 
                  stateCode={invoice.elogo_status}
                  answerType={invoice.answer_type}
                  onSendClick={() => {
                    logger.debug('Sending invoice:', invoice.id);
                    if (onSendInvoice) {
                      onSendInvoice(invoice.id);
                    }
                  }}
                  showActionButton={true}
                />
              </TableCell>
              <TableCell className="py-2 px-3 text-center">
                <div className="flex justify-center space-x-1">
                  {hasPdfAvailable(invoice) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPdf(invoice);
                      }}
                      disabled={downloadingInvoiceId === invoice.id}
                      className="h-7 w-7"
                      title="PDF Önizleme"
                    >
                      {downloadingInvoiceId === invoice.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(invoice);
                    }}
                    className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                    title="Sil"
                    disabled={invoice.einvoice_status === 'sent' || invoice.einvoice_status === 'delivered' || invoice.einvoice_status === 'accepted'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="h-7 w-7"
                        title="Daha Fazla"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSelectInvoice(invoice)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Görüntüle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyInvoice(invoice)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Kopyala
                      </DropdownMenuItem>
                      {hasPdfAvailable(invoice) && (
                        <DropdownMenuItem 
                          onClick={() => handleDownloadPdf(invoice)}
                          disabled={downloadingInvoiceId === invoice.id}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          PDF İndir
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClick(invoice)}
                        className="text-red-600 focus:text-red-600"
                        disabled={invoice.einvoice_status === 'sent' || invoice.einvoice_status === 'delivered' || invoice.einvoice_status === 'accepted'}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>

      {/* Silme Onay Dialogu */}
      <ConfirmationDialogComponent
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Faturayı Sil"
        description={`"${invoiceToDelete?.fatura_no || 'Bu fatura'}" numaralı faturayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </Table>
  );
};

export default SalesInvoicesTable;
