import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { FileText, Send, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";

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

  const getStatusBadge = () => {
    if (!einvoiceStatus) return null;
    
    const statusConfig = {
      sent: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle2, label: 'Gönderildi' },
      sending: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Loader2, label: 'Gönderiliyor...' },
      error: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertCircle, label: 'Hata' },
      draft: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: Info, label: 'Taslak' },
    };

    const config = statusConfig[einvoiceStatus.status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge 
        variant="outline" 
        className={`${config.bg} ${config.text} ${config.border}`}
      >
        <Icon className={`h-3 w-3 mr-1 ${einvoiceStatus.status === 'sending' ? 'animate-spin' : ''}`} />
        E-Fatura: {config.label}
      </Badge>
    );
  };

  return (
    <Card id="einvoice-section" className="mt-6 border-2 border-blue-100 bg-blue-50/50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">E-Fatura İşlemleri</h3>
              {getStatusBadge()}
            </div>
            
            {/* Durum bilgisi */}
            {einvoiceStatus && (
              <Alert className="mb-4 bg-white">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">Durum: {
                      einvoiceStatus.status === 'sent' ? '✅ Gönderildi' :
                      einvoiceStatus.status === 'sending' ? '⏳ Gönderiliyor...' :
                      einvoiceStatus.status === 'error' ? '❌ Hata' :
                      '📝 Taslak'
                    }</div>
                    {einvoiceStatus.error_message && (
                      <div className="text-sm text-red-600">
                        Hata: {einvoiceStatus.error_message}
                      </div>
                    )}
                    {einvoiceStatus.sent_at && (
                      <div className="text-sm text-gray-600">
                        Gönderim: {new Date(einvoiceStatus.sent_at).toLocaleString('tr-TR')}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <p className="text-gray-700 mb-4">
              {einvoiceStatus?.status === 'sent' 
                ? '✅ Faturanız başarıyla Nilvera üzerinden e-fatura olarak gönderildi.'
                : einvoiceStatus?.status === 'sending'
                ? '⏳ Faturanız şu anda gönderiliyor. Lütfen bekleyin...'
                : einvoiceStatus?.status === 'error'
                ? '❌ E-fatura gönderiminde hata oluştu. Lütfen hata mesajını kontrol edin ve tekrar deneyin.'
                : 'Faturanız başarıyla kaydedildi. E-fatura olarak göndermek için aşağıdaki butona tıklayın.'
              }
            </p>
            
            <div className="flex gap-4">
              {einvoiceStatus?.status !== 'sent' && (
                <Button 
                  onClick={onSendEInvoice}
                  disabled={isSending || einvoiceStatus?.status === 'sending'}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isSending || einvoiceStatus?.status === 'sending' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      E-Fatura Gönder
                    </>
                  )}
                </Button>
              )}
              
              {einvoiceStatus?.status === 'error' && (
                <Button 
                  onClick={onRefreshStatus}
                  variant="outline"
                  size="sm"
                >
                  <Loader2 className="h-4 w-4 mr-2" />
                  Durumu Yenile
                </Button>
              )}
              
              <Button 
                onClick={onNavigateToInvoices}
                variant="outline"
              >
                Faturalar Sayfasına Git
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceEInvoiceCard;


