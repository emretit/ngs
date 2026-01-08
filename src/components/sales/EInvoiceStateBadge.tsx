import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Send, RotateCcw } from "lucide-react";

interface EInvoiceStateBadgeProps {
  stateCode?: number | null;
  answerType?: string | null;
  onSendClick?: () => void;
  showActionButton?: boolean;
  isSending?: boolean;
}

/**
 * E-Fatura Durumu Badge Component (StateCode Bazlı - Single Source of Truth)
 * 
 * Veriban XML'den gelen StateCode ve AnswerType bazlı durum gösterir.
 * Bu component artık hem durum gösterimi hem de aksiyon butonlarını içerir.
 * 
 * StateCode değerleri:
 * 1 = Taslak
 * 2 = İmza Bekliyor / Gönderilmeyi Bekliyor
 * 3 = Gönderim Listesinde
 * 4 = Hatalı
 * 5 = Başarıyla İletildi (Alıcıya teslim edildi)
 * 
 * AnswerType değerleri:
 * KABUL = Kabul Edildi
 * RED = Reddedildi
 * IADE = İade Edildi
 */
const EInvoiceStateBadge: React.FC<EInvoiceStateBadgeProps> = ({
  stateCode,
  answerType,
  onSendClick,
  showActionButton = true,
  isSending = false
}) => {
  // StateCode 5 (Başarıyla iletildi) + AnswerType kombinasyonları
  if (stateCode === 5) {
    if (answerType === 'KABUL') {
      return (
        <Badge variant="outline" className="border-teal-400 text-teal-600 bg-teal-50 text-xs">
          ✓ Kabul Edildi
        </Badge>
      );
    } else if (answerType === 'RED') {
      return (
        <Badge variant="outline" className="border-red-400 text-red-600 bg-red-50 text-xs">
          ✗ Reddedildi
        </Badge>
      );
    } else if (answerType === 'IADE') {
      return (
        <Badge variant="outline" className="border-orange-400 text-orange-600 bg-orange-50 text-xs">
          ↩ İade Edildi
        </Badge>
      );
    }
    // StateCode 5 ama henüz cevap yok
    return (
      <Badge variant="outline" className="border-emerald-400 text-emerald-600 bg-emerald-50 text-xs">
        ✓ Teslim Edildi
      </Badge>
    );
  }
  
  // StateCode 4 (Hatalı) - Yeniden Gönder butonu göster
  if (stateCode === 4) {
    return (
      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className="border-red-400 text-red-600 bg-red-50 text-xs">
          ✗ Hata
        </Badge>
        {showActionButton && onSendClick && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onSendClick();
            }}
            disabled={isSending}
            className="h-6 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            {isSending ? 'Gönderiliyor...' : 'Yeniden Gönder'}
          </Button>
        )}
      </div>
    );
  }
  
  // StateCode 3 (Gönderim listesinde)
  if (stateCode === 3) {
    return (
      <Badge variant="outline" className="border-blue-400 text-blue-600 bg-blue-50 text-xs">
        → Gönderim Listesinde
      </Badge>
    );
  }
  
  // StateCode 2 (İmza bekliyor)
  if (stateCode === 2) {
    return (
      <Badge variant="outline" className="border-yellow-400 text-yellow-600 bg-yellow-50 text-xs">
        ⏱ İmza Bekliyor
      </Badge>
    );
  }
  
  // StateCode 1 (Taslak) - Gönder butonu göster
  if (stateCode === 1) {
    // Eğer gönderim işlemi başladıysa "Gönderiliyor" göster
    if (isSending) {
      return (
        <Badge variant="outline" className="border-blue-400 text-blue-600 bg-blue-50 text-xs animate-pulse">
          → Gönderiliyor...
        </Badge>
      );
    }
    
    return (
      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className="border-gray-400 text-gray-600 bg-gray-50 text-xs">
          📝 Taslak
        </Badge>
        {showActionButton && onSendClick && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onSendClick();
            }}
            disabled={isSending}
            className="h-6 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Send className="h-3 w-3 mr-1" />
            Gönder
          </Button>
        )}
      </div>
    );
  }
  
  // StateCode null veya 0 (Henüz gönderilmemiş) - Gönder butonu göster
  if (!stateCode) {
    // Eğer gönderim işlemi başladıysa "Gönderiliyor" göster
    if (isSending) {
      return (
        <Badge variant="outline" className="border-blue-400 text-blue-600 bg-blue-50 text-xs animate-pulse">
          → Gönderiliyor...
        </Badge>
      );
    }
    
    return (
      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className="border-gray-400 text-gray-600 bg-gray-50 text-xs">
          ○ Henüz Gönderilmedi
        </Badge>
        {showActionButton && onSendClick && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onSendClick();
            }}
            disabled={isSending}
            className="h-6 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Send className="h-3 w-3 mr-1" />
            Gönder
          </Button>
        )}
      </div>
    );
  }
  
  // Bilinmeyen durum
  return (
    <Badge variant="outline" className="border-gray-400 text-gray-600 bg-gray-50 text-xs">
      ? Bilinmiyor
    </Badge>
  );
};

export default EInvoiceStateBadge;
