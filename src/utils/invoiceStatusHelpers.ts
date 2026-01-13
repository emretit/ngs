/**
 * E-Fatura Durum Yönetimi Helper Fonksiyonları
 * 
 * Bu modül Veriban StateCode ve AnswerType bazlı durum yönetimi için
 * merkezi helper fonksiyonlar sağlar.
 * 
 * StateCode (elogo_status) değerleri:
 * 1 = Taslak
 * 2 = İmza Bekliyor / Gönderilmeyi Bekliyor
 * 3 = Gönderim Listesinde
 * 4 = Hatalı
 * 5 = Başarıyla İletildi (Alıcıya teslim edildi)
 * 
 * AnswerStateCode (elogo_code) değerleri:
 * 0 = Cevap Bekleniyor
 * 1 = Kabul Edildi
 * 2 = Reddedildi
 * 3 = İade Edildi
 * 
 * AnswerType değerleri:
 * KABUL, RED, IADE
 */

export type InvoiceStateCode = 1 | 2 | 3 | 4 | 5 | null;
export type AnswerStateCode = 0 | 1 | 2 | 3 | null;
export type AnswerType = 'KABUL' | 'RED' | 'IADE' | null;

export type InvoiceStatus = 
  | 'draft'       // Taslak
  | 'pending'     // İmza bekliyor
  | 'sending'     // Gönderim listesinde
  | 'error'       // Hatalı
  | 'sent'        // Gönderildi (Veriban'a iletildi)
  | 'delivered'   // Teslim edildi (Alıcıya ulaştı, cevap bekleniyor)
  | 'accepted'    // Kabul edildi
  | 'rejected'    // Reddedildi
  | 'returned'    // İade edildi
  | 'unknown';    // Bilinmiyor

/**
 * StateCode'a göre faturanın düzenlenebilir olup olmadığını kontrol eder
 * Sadece taslak durumundaki veya henüz gönderilmemiş faturalar düzenlenebilir
 */
export function isInvoiceEditable(stateCode: InvoiceStateCode): boolean {
  // Taslak (1) veya null (henüz gönderilmemiş) ise düzenlenebilir
  return !stateCode || stateCode === 1;
}

/**
 * StateCode'a göre faturanın gönderilebilir olup olmadığını kontrol eder
 * Taslak veya hatalı durumundaki faturalar gönderilebilir
 */
export function isInvoiceSendable(stateCode: InvoiceStateCode): boolean {
  // Taslak (1), hatalı (4) veya null (henüz gönderilmemiş) ise gönderilebilir
  return !stateCode || stateCode === 1 || stateCode === 4;
}

/**
 * StateCode'a göre faturanın silinebilir olup olmadığını kontrol eder
 * Sadece taslak veya hatalı durumundaki faturalar silinebilir
 */
export function isInvoiceDeletable(stateCode: InvoiceStateCode): boolean {
  // Taslak (1), hatalı (4) veya null (henüz gönderilmemiş) ise silinebilir
  return !stateCode || stateCode === 1 || stateCode === 4;
}

/**
 * StateCode'a göre faturanın başarıyla gönderilip gönderilmediğini kontrol eder
 */
export function isInvoiceSuccessfullySent(stateCode: InvoiceStateCode): boolean {
  // StateCode 5 = Başarıyla iletildi
  return stateCode === 5;
}

/**
 * StateCode'a göre faturanın hatalı olup olmadığını kontrol eder
 */
export function isInvoiceError(stateCode: InvoiceStateCode): boolean {
  // StateCode 4 = Hatalı
  return stateCode === 4;
}

/**
 * StateCode'a göre faturanın gönderim sürecinde olup olmadığını kontrol eder
 */
export function isInvoiceInProgress(stateCode: InvoiceStateCode): boolean {
  // StateCode 2 (İmza bekliyor) veya 3 (Gönderim listesinde)
  return stateCode === 2 || stateCode === 3;
}

/**
 * StateCode ve AnswerType'a göre fatura durumu string'i döndürür
 * Bu fonksiyon einvoice_status alanının yerine kullanılabilir
 */
export function getInvoiceStatusFromStateCode(
  stateCode: InvoiceStateCode, 
  answerType: AnswerType = null
): InvoiceStatus {
  if (!stateCode) return 'draft';
  
  switch (stateCode) {
    case 1: 
      return 'draft'; // Taslak
      
    case 2: 
      return 'pending'; // İmza bekliyor
      
    case 3: 
      return 'sending'; // Gönderim listesinde
      
    case 4: 
      return 'error'; // Hatalı
      
    case 5: 
      // Başarıyla iletildi - Cevap tipine göre detaylandır
      if (answerType === 'KABUL') return 'accepted';
      if (answerType === 'RED') return 'rejected';
      if (answerType === 'IADE') return 'returned';
      return 'delivered'; // Teslim edildi (cevap bekleniyor)
      
    default: 
      return 'unknown';
  }
}

/**
 * StateCode'a göre kullanıcı dostu durum mesajı döndürür
 */
export function getStateCodeLabel(stateCode: InvoiceStateCode): string {
  if (!stateCode) return 'Henüz Gönderilmedi';
  
  switch (stateCode) {
    case 1: return 'Taslak';
    case 2: return 'İşleniyor'; // Değişti: "İmza Bekliyor" → "İşleniyor"
    case 3: return 'Gönderim Listesinde';
    case 4: return 'Hatalı';
    case 5: return 'Başarıyla İletildi';
    default: return 'Bilinmiyor';
  }
}

/**
 * AnswerType'a göre kullanıcı dostu cevap mesajı döndürür
 */
export function getAnswerTypeLabel(answerType: AnswerType): string {
  if (!answerType) return 'Cevap Bekleniyor';
  
  switch (answerType) {
    case 'KABUL': return 'Kabul Edildi';
    case 'RED': return 'Reddedildi';
    case 'IADE': return 'İade Edildi';
    default: return answerType;
  }
}

/**
 * StateCode ve AnswerType'a göre tam durum açıklaması döndürür
 */
export function getFullInvoiceStatusLabel(
  stateCode: InvoiceStateCode, 
  answerType: AnswerType = null
): string {
  if (!stateCode) return 'Henüz Gönderilmedi';
  
  if (stateCode === 5 && answerType) {
    // Başarıyla iletildi ve cevap var
    return getAnswerTypeLabel(answerType);
  }
  
  return getStateCodeLabel(stateCode);
}

/**
 * Mevcut einvoice_status string'ini StateCode'a dönüştürür (migration için)
 */
export function mapEinvoiceStatusToStateCode(einvoiceStatus: string | null): InvoiceStateCode {
  if (!einvoiceStatus) return null;
  
  switch (einvoiceStatus.toLowerCase()) {
    case 'draft':
    case 'taslak':
      return 1; // Taslak
      
    case 'pending':
    case 'bekliyor':
      return 2; // İmza bekliyor
      
    case 'sending':
    case 'gönderiliyor':
      return 3; // Gönderim listesinde
      
    case 'error':
    case 'failed':
    case 'hatalı':
    case 'başarısız':
      return 4; // Hatalı
      
    case 'sent':
    case 'delivered':
    case 'accepted':
    case 'approved':
    case 'rejected':
    case 'returned':
    case 'gönderildi':
    case 'teslim edildi':
      return 5; // Başarıyla iletildi
      
    default:
      return null;
  }
}

/**
 * outgoing_invoices.status string'ini StateCode'a dönüştürür
 */
export function mapOutgoingStatusToStateCode(status: string | null): InvoiceStateCode {
  if (!status) return null;
  
  switch (status.toLowerCase()) {
    case 'draft':
      return 1; // Taslak
      
    case 'pending':
      return 2; // İmza bekliyor
      
    case 'sending':
    case 'sent':
      return 3; // Gönderim listesinde veya gönderildi
      
    case 'error':
    case 'failed':
      return 4; // Hatalı
      
    case 'delivered':
    case 'accepted':
    case 'approved':
    case 'rejected':
    case 'cancelled': // Cancelled genelde başarıyla iletilmiş ama sonra iptal edilmiş demektir
      return 5; // Başarıyla iletildi
      
    default:
      return null;
  }
}

/**
 * Veriban XML'den gelen StateCode'u doğrular
 */
export function isValidStateCode(stateCode: any): stateCode is InvoiceStateCode {
  if (stateCode === null || stateCode === undefined) return true;
  return [1, 2, 3, 4, 5].includes(Number(stateCode));
}

/**
 * Veriban XML'den gelen AnswerType'ı doğrular
 */
export function isValidAnswerType(answerType: any): answerType is AnswerType {
  if (answerType === null || answerType === undefined) return true;
  return ['KABUL', 'RED', 'IADE'].includes(String(answerType).toUpperCase());
}

/**
 * StateCode bazlı durum renk kodları (Tailwind CSS)
 */
export function getStateCodeColorClasses(stateCode: InvoiceStateCode, answerType: AnswerType = null): {
  border: string;
  text: string;
  bg: string;
} {
  if (!stateCode) {
    return {
      border: 'border-gray-400',
      text: 'text-gray-600',
      bg: 'bg-gray-50'
    };
  }
  
  switch (stateCode) {
    case 1: // Taslak
      return {
        border: 'border-gray-400',
        text: 'text-gray-600',
        bg: 'bg-gray-50'
      };
      
    case 2: // İşleniyor (E-Arşiv otomatik, E-Fatura imza gerekebilir)
      return {
        border: 'border-yellow-400',
        text: 'text-yellow-600',
        bg: 'bg-yellow-50'
      };
      
    case 3: // Gönderim listesinde
      return {
        border: 'border-blue-400',
        text: 'text-blue-600',
        bg: 'bg-blue-50'
      };
      
    case 4: // Hatalı
      return {
        border: 'border-red-400',
        text: 'text-red-600',
        bg: 'bg-red-50'
      };
      
    case 5: // Başarıyla iletildi
      if (answerType === 'KABUL') {
        return {
          border: 'border-teal-400',
          text: 'text-teal-600',
          bg: 'bg-teal-50'
        };
      } else if (answerType === 'RED') {
        return {
          border: 'border-red-400',
          text: 'text-red-600',
          bg: 'bg-red-50'
        };
      } else if (answerType === 'IADE') {
        return {
          border: 'border-orange-400',
          text: 'text-orange-600',
          bg: 'bg-orange-50'
        };
      }
      return {
        border: 'border-emerald-400',
        text: 'text-emerald-600',
        bg: 'bg-emerald-50'
      };
      
    default:
      return {
        border: 'border-gray-400',
        text: 'text-gray-600',
        bg: 'bg-gray-50'
      };
  }
}
