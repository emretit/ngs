import { useState } from "react";
import { logger } from '@/utils/logger';
import { Button } from "@/components/ui/button";
import { X, Trash2, Download, Mail, FileSpreadsheet, Send, CheckCircle } from "lucide-react";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";

interface SalesInvoicesBulkActionsProps {
  selectedInvoices: any[];
  onClearSelection: () => void;
  onBulkDelete?: (invoiceIds: string[]) => void;
  onBulkSendEInvoice?: (invoiceIds: string[]) => void;
}

const SalesInvoicesBulkActions = ({ 
  selectedInvoices, 
  onClearSelection,
  onBulkDelete,
  onBulkSendEInvoice 
}: SalesInvoicesBulkActionsProps) => {
  const hasSelection = selectedInvoices.length > 0;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eInvoiceDialogOpen, setEInvoiceDialogOpen] = useState(false);

  const handleBulkExport = () => {
    // Excel export işlemi
    toast.info("Excel dışa aktarma özelliği yakında eklenecek");
    logger.debug("Exporting selected invoices:", selectedInvoices);
  };

  const handleBulkEmail = () => {
    // Toplu e-posta gönderimi
    toast.info("Toplu e-posta gönderimi yakında eklenecek");
    logger.debug("Sending bulk email for invoices:", selectedInvoices);
  };

  const handleBulkEInvoice = () => {
    // Gönderilmemiş faturaları filtrele
    const eligibleInvoices = selectedInvoices.filter(inv => 
      !inv.einvoice_status || 
      inv.einvoice_status === 'draft' || 
      inv.einvoice_status === 'error'
    );
    
    if (eligibleInvoices.length === 0) {
      toast.warning("Seçilen faturalar zaten gönderilmiş");
      return;
    }
    
    setEInvoiceDialogOpen(true);
  };

  const handleConfirmBulkEInvoice = () => {
    const eligibleInvoices = selectedInvoices.filter(inv => 
      !inv.einvoice_status || 
      inv.einvoice_status === 'draft' || 
      inv.einvoice_status === 'error'
    );
    
    if (onBulkSendEInvoice) {
      onBulkSendEInvoice(eligibleInvoices.map(inv => inv.id));
      toast.success(`${eligibleInvoices.length} fatura gönderiliyor...`);
    }
    setEInvoiceDialogOpen(false);
  };

  const handleBulkMarkAsPaid = () => {
    // Toplu ödendi olarak işaretle
    toast.info("Toplu ödeme işaretleme yakında eklenecek");
    logger.debug("Marking invoices as paid:", selectedInvoices);
  };

  const handleBulkDelete = () => {
    // Gönderilmiş faturaları kontrol et
    const sentInvoices = selectedInvoices.filter(inv => 
      inv.einvoice_status === 'sent' || 
      inv.einvoice_status === 'delivered' || 
      inv.einvoice_status === 'accepted'
    );
    
    if (sentInvoices.length > 0) {
      toast.error(`${sentInvoices.length} fatura gönderilmiş olduğu için silinemez`);
      return;
    }
    
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (onBulkDelete) {
      const deletableInvoices = selectedInvoices.filter(inv => 
        inv.einvoice_status !== 'sent' && 
        inv.einvoice_status !== 'delivered' && 
        inv.einvoice_status !== 'accepted'
      );
      onBulkDelete(deletableInvoices.map(inv => inv.id));
    }
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-blue-900">
            {hasSelection ? `${selectedInvoices.length} fatura seçildi` : "Fatura seçilmedi"}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="text-blue-700 border-blue-300 hover:bg-blue-100"
            disabled={!hasSelection}
            onClick={handleBulkExport}
          >
            <Download className="h-4 w-4 mr-1" />
            Excel İndir
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-purple-700 border-purple-300 hover:bg-purple-100"
            disabled={!hasSelection}
            onClick={handleBulkEInvoice}
          >
            <Send className="h-4 w-4 mr-1" />
            Toplu e-Fatura
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-green-700 border-green-300 hover:bg-green-100"
            disabled={!hasSelection}
            onClick={handleBulkEmail}
          >
            <Mail className="h-4 w-4 mr-1" />
            Toplu E-posta
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-emerald-700 border-emerald-300 hover:bg-emerald-100"
            disabled={!hasSelection}
            onClick={handleBulkMarkAsPaid}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Ödendi İşaretle
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-red-700 border-red-300 hover:bg-red-100"
            disabled={!hasSelection}
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Sil
          </Button>

          {hasSelection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-gray-600 hover:bg-gray-100"
            >
              <X className="h-4 w-4 mr-1" />
              Seçimi Temizle
            </Button>
          )}
        </div>
      </div>

      {/* Toplu Silme Onay Dialogu */}
      <ConfirmationDialogComponent
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Faturaları Sil"
        description={`${selectedInvoices.length} faturayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />

      {/* Toplu E-Fatura Gönderim Onay Dialogu */}
      <ConfirmationDialogComponent
        open={eInvoiceDialogOpen}
        onOpenChange={setEInvoiceDialogOpen}
        title="Toplu E-Fatura Gönder"
        description={`${selectedInvoices.filter(inv => !inv.einvoice_status || inv.einvoice_status === 'draft' || inv.einvoice_status === 'error').length} faturayı e-fatura olarak göndermek istediğinizden emin misiniz?`}
        confirmText="Gönder"
        cancelText="İptal"
        onConfirm={handleConfirmBulkEInvoice}
        variant="default"
      />
    </>
  );
};

export default SalesInvoicesBulkActions;
