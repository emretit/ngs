import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Send, Loader2, CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from "lucide-react";

interface InvoiceEInvoiceCardProps {
  savedInvoiceId: string | null;
  einvoiceStatus: any;
  isSending: boolean;
  onSendEInvoice: () => void;
  onRefreshStatus: () => void;
  onNavigateToInvoices: () => void;
}

const InvoiceEInvoiceCard: React.FC<InvoiceEInvoiceCardProps> = ({
  savedInvoiceId,
  einvoiceStatus,
  isSending,
  onSendEInvoice,
  onRefreshStatus,
  onNavigateToInvoices,
}) => {
  if (!savedInvoiceId) return null;

  const getStatusConfig = () => {
    const configs = {
      sent: { 
        bg: 'bg-green-50', 
        border: 'border-green-200', 
        iconBg: 'bg-green-100',
        icon: CheckCircle2, 
        iconColor: 'text-green-600',
        label: 'Gönderildi',
        labelColor: 'text-green-700'
      },
      sending: { 
        bg: 'bg-blue-50', 
        border: 'border-blue-200', 
        iconBg: 'bg-blue-100',
        icon: Loader2, 
        iconColor: 'text-blue-600',
        label: 'Gönderiliyor...',
        labelColor: 'text-blue-700'
      },
      error: { 
        bg: 'bg-red-50', 
        border: 'border-red-200', 
        iconBg: 'bg-red-100',
        icon: AlertCircle, 
        iconColor: 'text-red-600',
        label: 'Hata',
        labelColor: 'text-red-700'
      },
      draft: { 
        bg: 'bg-gray-50', 
        border: 'border-gray-200', 
        iconBg: 'bg-gray-100',
        icon: FileText, 
        iconColor: 'text-gray-600',
        label: 'Hazır',
        labelColor: 'text-gray-700'
      },
    };

    return configs[einvoiceStatus?.status as keyof typeof configs] || configs.draft;
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card className={`${config.bg} ${config.border} border shadow-xl rounded-2xl backdrop-blur-sm relative z-10`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.iconBg}`}>
              <Icon className={`h-4 w-4 ${config.iconColor} ${einvoiceStatus?.status === 'sending' ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">E-Fatura</span>
                <Badge variant="outline" className={`text-[10px] py-0 ${config.labelColor} ${config.border}`}>
                  {config.label}
                </Badge>
              </div>
              {einvoiceStatus?.error_message && (
                <p className="text-xs text-red-600 mt-0.5">{einvoiceStatus.error_message}</p>
              )}
              {einvoiceStatus?.sent_at && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(einvoiceStatus.sent_at).toLocaleString('tr-TR')}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {einvoiceStatus?.status !== 'sent' && (
              <Button 
                onClick={onSendEInvoice}
                disabled={isSending || einvoiceStatus?.status === 'sending'}
                size="sm"
                className="h-8 gap-1.5 bg-green-600 hover:bg-green-700"
              >
                {isSending || einvoiceStatus?.status === 'sending' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span className="text-sm">Gönder</span>
              </Button>
            )}
            
            {einvoiceStatus?.status === 'error' && (
              <Button 
                onClick={onRefreshStatus}
                variant="outline"
                size="sm"
                className="h-8 px-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
            
            <Button 
              onClick={onNavigateToInvoices}
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
            >
              <span className="text-sm">Faturalara Git</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceEInvoiceCard;
