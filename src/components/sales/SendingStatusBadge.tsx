import React from "react";
import { logger } from '@/utils/logger';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface SendingStatusBadgeProps {
  status?: string | null;
  onSendClick?: () => void;
}

/**
 * @deprecated Bu component artık kullanılmıyor. Yerine EInvoiceStateBadge kullanın.
 * 
 * Gönderim Durumu Badge Component
 * İşlem/gönderim durumunu gösterir (sent, delivered, error, sending, vb.)
 * 
 * NOT: Bu component StateCode bazlı durum yönetimi sistemine geçişle birlikte
 * deprecate edilmiştir. Tüm durum gösterimleri artık EInvoiceStateBadge ile yapılıyor.
 * 
 * Migration Rehberi:
 * Eski kullanım:
 *   <SendingStatusBadge status={invoice.einvoice_status} onSendClick={handleSend} />
 * 
 * Yeni kullanım:
 *   <EInvoiceStateBadge 
 *     stateCode={invoice.elogo_status} 
 *     answerType={invoice.answer_type}
 *     onSendClick={handleSend}
 *     showActionButton={true}
 *   />
 */
const SendingStatusBadge: React.FC<SendingStatusBadgeProps> = ({
  status,
  onSendClick
}) => {
  logger.warn(
    '[DEPRECATED] SendingStatusBadge is deprecated. Use EInvoiceStateBadge instead.\n' +
    'See component documentation for migration guide.'
  );

  const normalizedStatus = status?.toLowerCase();
  
  switch (normalizedStatus) {
    case 'sent':
    case 'gönderildi':
      return <Badge variant="outline" className="border-blue-400 text-blue-600 bg-blue-50 text-xs">Gönderildi</Badge>;
    case 'delivered':
    case 'teslim edildi':
      return <Badge variant="outline" className="border-emerald-400 text-emerald-600 bg-emerald-50 text-xs">Teslim Edildi</Badge>;
    case 'error':
    case 'hatalı':
      return (
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="border-red-400 text-red-600 bg-red-50 text-xs">Hata</Badge>
          {onSendClick && (
            <Button
              size="sm"
              variant="outline"
              onClick={onSendClick}
              className="h-6 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
            >
              Yeniden Gönder
            </Button>
          )}
        </div>
      );
    case 'sending':
    case 'gönderiliyor':
      return <Badge variant="outline" className="border-yellow-400 text-yellow-600 bg-yellow-50 text-xs">Gönderiliyor</Badge>;
    case 'draft':
    case 'taslak':
      return (
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="border-gray-400 text-gray-600 bg-gray-50 text-xs">
            <FileText className="h-3 w-3 mr-1" />
            Taslak
          </Badge>
          {onSendClick && (
            <Button
              size="sm"
              variant="outline"
              onClick={onSendClick}
              className="h-6 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Gönder
            </Button>
          )}
        </div>
      );
    case 'pending':
    case 'bekliyor':
      return <Badge variant="outline" className="border-orange-400 text-orange-600 bg-orange-50 text-xs">Bekliyor</Badge>;
    case 'cancelled':
    case 'iptal':
      return <Badge variant="outline" className="border-gray-400 text-gray-600 bg-gray-50 text-xs">İptal</Badge>;
    case 'failed':
    case 'başarısız':
      return <Badge variant="outline" className="border-red-400 text-red-600 bg-red-50 text-xs">Başarısız</Badge>;
    default:
      return <Badge variant="outline" className="border-gray-400 text-gray-600 bg-gray-50 text-xs">{status || '-'}</Badge>;
  }
};

export default SendingStatusBadge;
