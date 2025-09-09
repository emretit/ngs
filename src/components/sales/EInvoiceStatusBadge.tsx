import React, { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, UserCheck } from "lucide-react";
import { useEInvoiceStatus, getStatusDisplay, useEInvoice } from "@/hooks/useEInvoice";

interface EInvoiceStatusBadgeProps {
  salesInvoiceId: string;
  customerTaxNumber?: string;
  onSendClick?: () => void;
  onStatusRefresh?: () => void;
  // Optional: Direct invoice data to avoid extra API call
  invoiceData?: {
    einvoice_status?: string;
    nilvera_invoice_id?: string;
    einvoice_sent_at?: string;
    einvoice_error_message?: string;
  };
}

const EInvoiceStatusBadge: React.FC<EInvoiceStatusBadgeProps> = ({
  salesInvoiceId,
  customerTaxNumber,
  onSendClick,
  onStatusRefresh,
  invoiceData
}) => {
  const { status, isLoading, refreshStatus } = useEInvoiceStatus(salesInvoiceId);
  const { updateCustomerAlias, isUpdatingAlias } = useEInvoice();

  // Use direct invoice data if available, otherwise use hook data
  const displayStatus = invoiceData ? {
    status: invoiceData.einvoice_status || 'draft',
    nilvera_invoice_id: invoiceData.nilvera_invoice_id,
    sent_at: invoiceData.einvoice_sent_at,
    error_message: invoiceData.einvoice_error_message
  } : status;

  // Listen for einvoice status updates
  useEffect(() => {
    const handleStatusUpdate = (event: CustomEvent) => {
      const { salesInvoiceId: updatedInvoiceId, status: newStatus } = event.detail;
      if (updatedInvoiceId === salesInvoiceId) {
        console.log("🔄 E-fatura durumu güncellendi, yeniden yükleniyor:", newStatus);
        refreshStatus();
      }
    };

    window.addEventListener('einvoice-status-updated', handleStatusUpdate as EventListener);
    
    return () => {
      window.removeEventListener('einvoice-status-updated', handleStatusUpdate as EventListener);
    };
  }, [salesInvoiceId, refreshStatus]);

  const getStatusIcon = (statusValue?: string) => {
    switch (statusValue) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-3 w-3" />;
      case 'accepted':
        return <CheckCircle className="h-3 w-3" />;
      case 'rejected':
        return <XCircle className="h-3 w-3" />;
      case 'error':
        return <AlertCircle className="h-3 w-3" />;
      case 'sending':
        return <Clock className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const getStatusColor = (statusValue?: string) => {
    switch (statusValue) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered':
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected':
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'sending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Kontrol ediliyor...
        </Badge>
      </div>
    );
  }

  if (!displayStatus || !displayStatus.status) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          E-Fatura Gönderilmedi
        </Badge>
        {onSendClick && (
          <Button
            size="sm"
            variant="outline"
            onClick={onSendClick}
            className="h-6 px-2 text-xs"
          >
            Gönder
          </Button>
        )}
      </div>
    );
  }

  const { text, color } = getStatusDisplay(displayStatus.status);

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className={`flex items-center gap-1 ${getStatusColor(displayStatus.status)}`}
      >
        {getStatusIcon(displayStatus.status)}
        {text}
      </Badge>
      
      {/* Nilvera ID */}
      {displayStatus.nilvera_invoice_id && (
        <span className="text-xs text-gray-500 font-mono">
          {displayStatus.nilvera_invoice_id.slice(0, 8)}...
        </span>
      )}

      {/* Refresh button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          refreshStatus();
          onStatusRefresh?.();
        }}
        className="h-6 w-6 p-0"
      >
        <RefreshCw className="h-3 w-3" />
      </Button>

      {/* Send button for failed cases */}
      {(displayStatus.status === 'error' || displayStatus.status === 'draft') && onSendClick && (
        <Button
          size="sm"
          variant="outline"
          onClick={onSendClick}
          className="h-6 px-2 text-xs"
        >
          {displayStatus.status === 'error' ? 'Yeniden Gönder' : 'Gönder'}
        </Button>
      )}

      {/* Update Customer Alias button for error cases with CustomerAlias issue */}
      {displayStatus.status === 'error' && displayStatus.error_message?.includes('CustomerAlias') && customerTaxNumber && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => updateCustomerAlias(customerTaxNumber)}
          disabled={isUpdatingAlias}
          className="h-6 px-2 text-xs"
          title="Müşteri alias bilgilerini Nilvera'dan güncelle"
        >
          {isUpdatingAlias ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <UserCheck className="h-3 w-3" />
          )}
        </Button>
      )}

      {/* Error message tooltip */}
      {displayStatus.error_message && (
        <div className="flex items-center">
          <AlertCircle className="h-3 w-3 text-red-500" />
        </div>
      )}
    </div>
  );
};

export default EInvoiceStatusBadge;
