import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  FileText, 
  Send,
  Loader2,
  Copy,
  Trash2,
  Package,
  DollarSign,
  Eye,
  MoreHorizontal,
  Building2,
  Printer
} from "lucide-react";
import { useSalesInvoices } from "@/hooks/useSalesInvoices";
import { useEInvoice } from "@/hooks/useEInvoice";
import { useVeribanInvoice } from "@/hooks/useVeribanInvoice";
import { IntegratorService } from "@/services/integratorService";
import { useNilveraPdf } from "@/hooks/useNilveraPdf";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatters";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { EInvoiceResendConfirmDialog } from "@/components/sales/EInvoiceResendConfirmDialog";
import InvoiceHeaderCard from "@/components/invoices/cards/InvoiceHeaderCard";
import ProductServiceCard from "@/components/proposals/cards/ProductServiceCard";
import FinancialSummaryCard from "@/components/proposals/cards/FinancialSummaryCard";
import EInvoiceStateBadge from "@/components/sales/EInvoiceStateBadge";
import { generateNumber } from "@/utils/numberFormat";

interface SalesInvoiceDetailProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

interface InvoiceItem {
  id: string;
  sales_invoice_id: string;
  product_id: string | null;
  urun_adi: string;
  aciklama: string | null;
  miktar: number;
  birim: string;
  birim_fiyat: number;
  kdv_orani: number;
  indirim_orani: number | null;
  satir_toplami: number;
  kdv_tutari: number;
  para_birimi: string | null;
  sira_no: number | null;
  product?: {
    id: string;
    name: string;
    sku: string | null;
  };
}

const SalesInvoiceDetail = ({ isCollapsed, setIsCollapsed }: SalesInvoiceDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchInvoiceById, deleteInvoiceMutation } = useSalesInvoices();
  const { sendInvoice: sendNilveraInvoice, isSending: isSendingNilvera } = useEInvoice();
  const { 
    sendInvoice: sendVeribanInvoice, 
    isSending: isSendingVeriban,
    confirmDialog,
    handleConfirmResend,
    handleCancelResend,
  } = useVeribanInvoice();
  const { downloadAndOpenPdf, isDownloading } = useNilveraPdf();
  
  // Form setup for customer selection
  const form = useForm({ 
    defaultValues: { 
      customer_id: "", 
      supplier_id: "" 
    },
    mode: "onChange"
  });
  
  const [invoice, setInvoice] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Integrator status
  const [integratorStatus, setIntegratorStatus] = useState<{
    nilvera: boolean;
    elogo: boolean;
    veriban: boolean;
    selected: 'nilvera' | 'elogo' | 'veriban';
  } | null>(null);
  
  useEffect(() => {
    const loadIntegratorStatus = async () => {
      try {
        const status = await IntegratorService.checkIntegratorStatus();
        setIntegratorStatus(status);
      } catch (error) {
        console.error('Error loading integrator status:', error);
      }
    };
    loadIntegratorStatus();
  }, []);
  
  // Determine which integrator to use and get sending state
  const usingVeriban = integratorStatus?.selected === 'veriban';
  const usingNilvera = integratorStatus?.selected === 'nilvera';
  const isSending = usingVeriban ? isSendingVeriban : isSendingNilvera;

  useEffect(() => {
    if (id) {
      loadInvoice();
      loadInvoiceItems();
    }
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const invoiceData = await fetchInvoiceById(id!);
      setInvoice(invoiceData);
      
      // Set customer_id in form when invoice is loaded
      if (invoiceData?.customer_id) {
        form.setValue("customer_id", invoiceData.customer_id);
      }
    } catch (error) {
      console.error("Error loading invoice:", error);
      toast.error("Fatura yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const loadInvoiceItems = async () => {
    if (!id) return;
    try {
      const { data: items, error } = await supabase
        .from("sales_invoice_items")
        .select(`
          *,
          product:products (
            id,
            name,
            sku
          )
        `)
        .eq("sales_invoice_id", id)
        .order("sira_no", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading invoice items:", error);
        toast.error("Fatura kalemleri yüklenirken hata oluştu");
      } else {
        setInvoiceItems(items || []);
      }
    } catch (error) {
      console.error("Error loading invoice items:", error);
    }
  };

  const handleDelete = () => {
    if (invoice?.einvoice_status === 'sent' || invoice?.einvoice_status === 'delivered' || invoice?.einvoice_status === 'accepted') {
      toast.error("Gönderilmiş faturalar silinemez");
      return;
    }
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteInvoiceMutation.mutate(id!, {
      onSuccess: () => {
        toast.success("Fatura başarıyla silindi");
        navigate('/sales-invoices');
      }
    });
    setDeleteDialogOpen(false);
  };

  const handleSendEInvoice = async () => {
    if (!id) return;
    
    try {
      // Fatura numarası kontrolü - tüm entegratörler için
      if (!invoice?.fatura_no) {
        console.log('📝 [SalesInvoiceDetail] Fatura numarası yok, otomatik üretiliyor...');
        
        // Kullanıcının company_id'sini al
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Kullanıcı bilgisi alınamadı');
          return;
        }
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();
        
        if (!profile?.company_id) {
          toast.error('Şirket bilgisi bulunamadı');
          return;
        }
        
        // Hangi formatı kullanacağımızı belirle
        let formatKey = 'invoice_number_format';
        let checkVeriban = false;
        
        if (usingVeriban) {
          formatKey = 'veriban_invoice_number_format';
          checkVeriban = true;
        } else if (usingNilvera) {
          formatKey = 'einvoice_number_format';
        }
        
        // Otomatik fatura numarası üret
        const invoiceDate = invoice.fatura_tarihi ? new Date(invoice.fatura_tarihi) : new Date();
        const autoInvoiceNumber = await generateNumber(
          formatKey,
          profile.company_id,
          invoiceDate,
          checkVeriban // Veriban ise çift kontrol
        );
        
        console.log('✅ [SalesInvoiceDetail] Otomatik fatura numarası üretildi:', autoInvoiceNumber);
        
        // Fatura numarasını veritabanına kaydet
        const { error: updateError } = await supabase
          .from('sales_invoices')
          .update({ fatura_no: autoInvoiceNumber })
          .eq('id', id);
        
        if (updateError) {
          console.error('❌ [SalesInvoiceDetail] Fatura numarası kaydedilemedi:', updateError);
          toast.error('Fatura numarası oluşturulamadı');
          return;
        }
        
        // Local state'i güncelle
        setInvoice((prev: any) => ({ ...prev, fatura_no: autoInvoiceNumber }));
        
        toast.success(`Fatura numarası oluşturuldu: ${autoInvoiceNumber}`);
      }
      
      // E-fatura gönderimini başlat
      if (usingVeriban) {
        sendVeribanInvoice({ salesInvoiceId: id });
      } else {
        sendNilveraInvoice(id);
      }
    } catch (error) {
      console.error('❌ [SalesInvoiceDetail] Fatura gönderimi hazırlanırken hata:', error);
      toast.error('Bir hata oluştu, lütfen tekrar deneyin');
    }
  };

  const handleDownloadPdf = async () => {
    if (invoice?.nilvera_invoice_id) {
      const invoiceType = invoice.einvoice_profile === 'EARSIVFATURA' ? 'e-arşiv' : 'e-fatura';
      await downloadAndOpenPdf(invoice.nilvera_invoice_id, invoiceType);
    } else {
      window.print();
    }
  };

  const handleCopyInvoice = () => {
    navigate(`/sales-invoices/create?copyFrom=${id}`);
  };

  // Transform items to match ProductServiceCard format
  const transformedItems = invoiceItems.map((item, index) => ({
    id: item.id,
    row_number: item.sira_no || index + 1,
    name: item.urun_adi,
    description: item.aciklama || "",
    quantity: item.miktar,
    unit: item.birim,
    unit_price: item.birim_fiyat,
    tax_rate: item.kdv_orani,
    discount_rate: item.indirim_orani || 0,
    total_price: item.satir_toplami,
    currency: item.para_birimi || invoice?.para_birimi || 'TRY',
  }));

  // Calculate financial totals for FinancialSummaryCard
  const calculationsByCurrency: Record<string, any> = {};
  const currency = invoice?.para_birimi || 'TRY';
  
  let gross = 0;
  let discount = 0;
  let net = 0;
  let vat = 0;
  let grand = 0;

  transformedItems.forEach(item => {
    const itemGross = item.quantity * item.unit_price;
    const itemDiscount = itemGross * (item.discount_rate / 100);
    const itemNet = itemGross - itemDiscount;
    const itemVat = itemNet * (item.tax_rate / 100);
    const itemGrand = itemNet + itemVat;

    gross += itemGross;
    discount += itemDiscount;
    net += itemNet;
    vat += itemVat;
    grand += itemGrand;
  });

  calculationsByCurrency[currency] = { gross, discount, net, vat, grand };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Fatura yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Fatura Bulunamadı</h3>
          <p className="text-muted-foreground mb-4">Aradığınız fatura mevcut değil veya silinmiş olabilir.</p>
          <Button onClick={() => navigate('/sales-invoices')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Faturalara Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Modern Header - Yeni Satış Faturası sayfası gibi */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg mb-6">
          <div className="flex items-center justify-between p-4 pl-12">
            <div className="flex items-center gap-4">
              <BackButton 
                onClick={() => navigate("/sales-invoices")}
                variant="ghost"
                size="sm"
                className="rounded-xl"
              >
                Satış Faturaları
              </BackButton>
              
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Satış Faturası Detay
                  </h1>
                  <p className="text-xs text-muted-foreground/70">
                    {invoice.fatura_no ? `Fatura No: ${invoice.fatura_no}` : 'Görüntüleme modu'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-wrap gap-2 items-center">
                {/* E-Fatura Durumu Badge (StateCode Bazlı - Single Source of Truth) */}
                <EInvoiceStateBadge 
                  stateCode={invoice.elogo_status}
                  answerType={invoice.answer_type}
                  onSendClick={handleSendEInvoice}
                  showActionButton={false}
                  isSending={isSending}
                />
                
                <Badge variant="outline" className="px-3 py-1">
                  <Package className="h-3 w-3 mr-1" />
                  {invoiceItems.length} Kalem
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {formatCurrency(invoice.toplam_tutar || 0, invoice.para_birimi || 'TRY')}
                </Badge>
              </div>
              
              {/* E-Fatura Gönder Butonu */}
              {(!invoice.einvoice_status || invoice.einvoice_status === 'draft' || invoice.einvoice_status === 'error') && (
                <Button
                  onClick={handleSendEInvoice}
                  disabled={isSending}
                  className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>E-Fatura Gönder</span>
                    </>
                  )}
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50/50 hover:text-gray-700 hover:border-gray-200 transition-all duration-200 hover:shadow-sm"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="font-medium">İşlemler</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Düzenleme</DropdownMenuLabel>
                  <DropdownMenuItem 
                    onClick={() => navigate(`/sales-invoices/edit/${id}`)}
                    className="gap-2 cursor-pointer"
                    disabled={invoice.einvoice_status === 'sent' || invoice.einvoice_status === 'delivered' || invoice.einvoice_status === 'accepted'}
                  >
                    <Edit className="h-4 w-4 text-slate-500" />
                    <span>Düzenle</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuLabel>Yazdırma & İndirme</DropdownMenuLabel>
                  <DropdownMenuItem 
                    onClick={handleDownloadPdf}
                    className="gap-2 cursor-pointer"
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 text-blue-500" />
                    )}
                    <span>PDF İndir</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => window.print()}
                    className="gap-2 cursor-pointer"
                  >
                    <Printer className="h-4 w-4 text-gray-500" />
                    <span>Yazdır</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuLabel>Kopyalama</DropdownMenuLabel>
                  <DropdownMenuItem 
                    onClick={handleCopyInvoice}
                    className="gap-2 cursor-pointer"
                  >
                    <Copy className="h-4 w-4 text-green-500" />
                    <span>Kopyala</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {invoice.customer_id && (
                    <>
                      <DropdownMenuItem 
                        onClick={() => navigate(`/customers/${invoice.customer_id}`)}
                        className="gap-2 cursor-pointer"
                      >
                        <Building2 className="h-4 w-4 text-blue-500" />
                        <span>Müşteri Sayfasına Git</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="gap-2 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={invoice.einvoice_status === 'sent' || invoice.einvoice_status === 'delivered' || invoice.einvoice_status === 'accepted'}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Sil</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main Content - Yeni Satış Faturası sayfası layout'u */}
        <div className="space-y-6">
          {/* Invoice Header Card */}
          <InvoiceHeaderCard
            selectedCustomer={invoice.customer}
            formData={{
              fatura_no: invoice.fatura_no || "",
              fatura_tarihi: new Date(invoice.fatura_tarihi),
              issue_time: invoice.issue_time || "",
              vade_tarihi: invoice.vade_tarihi ? new Date(invoice.vade_tarihi) : null,
              invoice_type: invoice.invoice_type || "SATIS",
              invoice_profile: invoice.invoice_profile || "TEMELFATURA",
              send_type: invoice.send_type || "ELEKTRONIK",
              sales_platform: invoice.sales_platform || "NORMAL",
              is_despatch: invoice.is_despatch || false,
              internet_info: invoice.internet_info || {},
              return_invoice_info: invoice.return_invoice_info || {},
              aciklama: invoice.aciklama || "",
              notlar: invoice.notlar || "",
              para_birimi: invoice.para_birimi || 'TRY',
              exchange_rate: invoice.exchange_rate || 1,
              banka_bilgileri: invoice.banka_bilgileri || "",
            }}
            assignedInvoiceNumber={invoice.fatura_no}
            einvoiceStatus={invoice.einvoice_status}
            onFieldChange={() => {}} // Read-only, no changes
            form={form}
            compact={true}
          />

          {/* Product/Service Items */}
          <ProductServiceCard
            items={transformedItems}
            onAddItem={() => {}} // Read-only
            onRemoveItem={() => {}} // Read-only
            onItemChange={() => {}} // Read-only
            onProductModalSelect={() => {}} // Read-only
          />

          {/* Financial Summary */}
          <FinancialSummaryCard
            calculationsByCurrency={calculationsByCurrency}
            globalDiscountType="percentage"
            globalDiscountValue={0}
            onGlobalDiscountTypeChange={() => {}} // Read-only
            onGlobalDiscountValueChange={() => {}} // Read-only
            selectedCurrency={invoice.para_birimi || 'TRY'}
          />
        </div>
      </div>

      {/* Silme Onay Dialogu */}
      <ConfirmationDialogComponent
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Faturayı Sil"
        description={`"${invoice?.fatura_no || 'Bu fatura'}" numaralı faturayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />

      {/* E-Fatura Tekrar Gönderme Onay Dialog'u (Veriban için) */}
      <EInvoiceResendConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) handleCancelResend();
        }}
        currentStatus={confirmDialog.currentStatus}
        onConfirm={handleConfirmResend}
        onCancel={handleCancelResend}
      />
    </>
  );
};

export default SalesInvoiceDetail;
