/**
 * SOAP Helper Utility for Veriban Webservice Integration
 * 
 * This module provides utilities for creating and parsing SOAP requests/responses
 * for Veriban e-invoice integration.
 */

export interface VeribanLoginRequest {
  username: string;
  password: string;
}

export interface VeribanLoginResponse {
  success: boolean;
  sessionCode?: string;
  error?: string;
}

export interface VeribanSoapResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * E-Arşiv Transfer Parameters (XSD-Based)
 * XSD şemasına göre tüm alanları içerir
 * 
 * EArchiveTransferFile extends TransferFile:
 * - TransferFile base alanlar: fileName, fileDataType, binaryData, binaryDataHash
 * - EArchiveTransferFile opsiyonel: receiverMailAddresses, receiverGsmNo
 * - EArchiveTransferFile ZORUNLU (minOccurs="1"): invoiceTransportationType, isInvoiceCreatedAtDelivery, isInternetSalesInvoice
 */
export interface EArchiveTransferParams {
  // TransferFile base alanlar
  fileName: string;
  fileDataType: string; // 'XML_INZIP', 'PDF_INZIP', 'HTML_INZIP', 'TXT_INZIP'
  binaryData: string; // base64 ZIP
  binaryDataHash: string; // MD5
  
  // EArchiveTransferFile opsiyonel alanlar
  receiverMailAddresses?: string[]; // Mail adresleri (opsiyonel)
  receiverGsmNo?: string; // SMS numarası (opsiyonel) - format: +905551234567
  
  // EArchiveTransferFile ZORUNLU alanlar (XSD minOccurs="1")
  // Default değerler Edge Function'da verilecek
  invoiceTransportationType: string; // 'NONE' | 'ELEKTRONIK' | 'KAGIT'
  isInvoiceCreatedAtDelivery: boolean;
  isInternetSalesInvoice: boolean;
}

/**
 * Veriban Error Codes
 * C# test kodundan alınan hata kodları
 */
export const VERIBAN_ERROR_CODES: Record<number, string> = {
  5000: 'Sistem hatası',
  5001: 'Parametre hatası',
  5002: 'Giriş başarısız',
  5003: 'Oturum hatası',
  5004: 'Erişim hatası',
  5101: 'Hash hatası',
  5102: 'Arşiv ekleme hatası',
  5103: 'Kuyruk ekleme hatası',
  5201: 'İptal hatası',
  5301: 'Kuyruk sorgulama hatası',
  5302: 'Belge sorgulama hatası',
  5401: 'Belge indirme hatası',
  5501: 'İşlem hatası',
};

/**
 * Veriban State Codes
 * Fatura durum kodları
 */
export const VERIBAN_STATE_CODES: Record<number, string> = {
  1: 'İşleniyor',
  2: 'İşlenmeye Bekliyor',
  3: 'İşleniyor',
  4: 'Hatalı',
  5: 'Başarılı',
};

/**
 * Veriban FileDataType Enum Values
 * C# TransferDocumentDataTypes enum değerleri
 * E-Arşiv için sayısal değerler kullanılmalı
 */
export const VERIBAN_FILE_DATA_TYPES: Record<string, number> = {
  'XML_INZIP': 1,
  'PDF_INZIP': 2,
  'HTML_INZIP': 3,
};

/**
 * Get human-readable error message from Veriban error code
 */
export function getVeribanErrorMessage(code: number): string {
  return VERIBAN_ERROR_CODES[code] || `Bilinmeyen hata (kod: ${code})`;
}

/**
 * Get human-readable state message from Veriban state code
 */
export function getVeribanStateMessage(code: number): string {
  return VERIBAN_STATE_CODES[code] || `Bilinmeyen durum (kod: ${code})`;
}

/**
 * SOAP Client for Veriban Webservice
 */
export class VeribanSoapClient {
  /**
   * Fetch with timeout helper
   */
  private static async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number = 60000 // Increased to 60 seconds for production
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error(`Bağlantı zaman aşımına uğradı (${timeoutMs / 1000} saniye). Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.`);
      }
      throw fetchError;
    }
  }
  /**
   * Login to Veriban and get session code
   */
  static async login(
    params: VeribanLoginRequest,
    url: string
  ): Promise<VeribanLoginResponse> {
    const { username, password } = params;

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:Login>
      <tem:userName>${this.escapeXml(username)}</tem:userName>
      <tem:password>${this.escapeXml(password)}</tem:password>
    </tem:Login>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'Login',
        },
        body: soapRequest,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlText = await response.text();
      return this.parseLoginResponse(xmlText);
    } catch (error) {
      console.error('❌ Veriban login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Logout from Veriban
   * Doküman: Bölüm 3 - Oturum Kapama
   */
  static async logout(sessionCode: string, url: string): Promise<VeribanSoapResponse> {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:Logout>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
    </tem:Logout>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'Logout',
        },
        body: soapRequest,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error! status: ${response.status}`,
        };
      }

      const xmlText = await response.text();
      return this.parseLogoutResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }

  /**
   * Transfer Sales Invoice File - Send invoice
   */
  static async transferSalesInvoice(
    sessionCode: string,
    params: {
      fileName: string;
      fileDataType: string;
      binaryData: string; // base64 ZIP
      binaryDataHash: string; // MD5
      customerAlias?: string;
      isDirectSend: boolean;
      integrationCode?: string;
    },
    url: string
  ): Promise<VeribanSoapResponse> {
    const {
      fileName,
      fileDataType,
      binaryData,
      binaryDataHash,
      customerAlias = '',
      isDirectSend,
      integrationCode = '',
    } = params;

    // Note: If integrationCode is provided, we should use TransferSalesInvoiceFileWithIntegrationCode instead
    const useIntegrationCodeMethod = !!integrationCode;

    // Format boolean value for SOAP (true/false as lowercase string)
    const isDirectSendStr = isDirectSend ? 'true' : 'false';
    
    // FileDataType should be numeric value (0, 1, 2, 3) - already string format
    // Ensure it's a valid numeric string
    const fileDataTypeNum = fileDataType.toString();
    
    // Veriban dokümanına göre EInvoiceTransferFile element sırası:
    // 1. FileNameWithExtension
    // 2. FileDataType
    // 3. BinaryData
    // 4. BinaryDataHash
    // 5. CustomerAlias
    // 6. IsDirectSend
    // .NET SOAP servisleri element sırasına dikkat eder
    const soapRequest = useIntegrationCodeMethod ?
    `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:TransferSalesInvoiceFileWithIntegrationCode>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:transferFile>
        <tem:FileNameWithExtension>${this.escapeXml(fileName)}</tem:FileNameWithExtension>
        <tem:FileDataType>${fileDataTypeNum}</tem:FileDataType>
        <tem:BinaryData>${binaryData}</tem:BinaryData>
        <tem:BinaryDataHash>${this.escapeXml(binaryDataHash)}</tem:BinaryDataHash>
        <tem:CustomerAlias>${this.escapeXml(customerAlias || '')}</tem:CustomerAlias>
        <tem:IsDirectSend>${isDirectSendStr}</tem:IsDirectSend>
      </tem:transferFile>
      <tem:uniqueIntegrationCode>${this.escapeXml(integrationCode)}</tem:uniqueIntegrationCode>
    </tem:TransferSalesInvoiceFileWithIntegrationCode>
  </soapenv:Body>
</soapenv:Envelope>` :
    `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:TransferSalesInvoiceFile>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:transferFile>
        <tem:FileNameWithExtension>${this.escapeXml(fileName)}</tem:FileNameWithExtension>
        <tem:FileDataType>${fileDataTypeNum}</tem:FileDataType>
        <tem:BinaryData>${binaryData}</tem:BinaryData>
        <tem:BinaryDataHash>${this.escapeXml(binaryDataHash)}</tem:BinaryDataHash>
        <tem:CustomerAlias>${this.escapeXml(customerAlias || '')}</tem:CustomerAlias>
        <tem:IsDirectSend>${isDirectSendStr}</tem:IsDirectSend>
      </tem:transferFile>
    </tem:TransferSalesInvoiceFile>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      // SOAPAction: .NET SOAP servisleri genellikle namespace ile birlikte bekler
      // Format: "http://tempuri.org/IService/MethodName" veya sadece "MethodName"
      // Veriban için sadece method adı yeterli görünüyor (diğer methodlarda da öyle)
      const soapAction = useIntegrationCodeMethod ? 'TransferSalesInvoiceFileWithIntegrationCode' : 'TransferSalesInvoiceFile';
      
      // Alternatif: Namespace ile (eğer yukarıdaki çalışmazsa)
      // const soapAction = useIntegrationCodeMethod 
      //   ? 'http://tempuri.org/IIntegrationService/TransferSalesInvoiceFileWithIntegrationCode'
      //   : 'http://tempuri.org/IIntegrationService/TransferSalesInvoiceFile';

      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': soapAction,
        },
        body: soapRequest,
      });

      const xmlText = await response.text();

      return this.parseTransferResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transfer failed',
      };
    }
  }

  /**
   * Transfer E-Archive Invoice File (E-Arşiv Fatura Gönderimi)
   * XSD şemasına göre tüm ZORUNLU parametreleri içerir
   * 
   * XSD: EArchiveTransferFile extends TransferFile
   * - minOccurs="1": InvoiceTransportationType, IsInvoiceCreatedAtDelivery, IsInternetSalesInvoice
   * - minOccurs="0": ReceiverMailTargetAddresses, ReceiverGsmNo
   * 
   * @param sessionCode - Oturum kodu
   * @param params - E-Arşiv transfer parametreleri (XSD-based)
   * @param url - Webservice URL
   */
  static async transferEArchiveInvoice(
    sessionCode: string,
    params: EArchiveTransferParams,
    url: string
  ): Promise<VeribanSoapResponse> {
    const {
      fileName,
      fileDataType,
      binaryData,
      binaryDataHash,
      receiverMailAddresses,
      receiverGsmNo,
      invoiceTransportationType,
      isInvoiceCreatedAtDelivery,
      isInternetSalesInvoice,
    } = params;

    const fileDataTypeValue = fileDataType || 'XML_INZIP';

    // Mail adresleri XML (opsiyonel - sadece dolu ise gönder)
    const mailAddressesXml = receiverMailAddresses && receiverMailAddresses.length > 0 
      ? `
        <tem:ReceiverMailTargetAddresses>${receiverMailAddresses.map(mail => `
          <tem:string>${this.escapeXml(mail)}</tem:string>`).join('')}
        </tem:ReceiverMailTargetAddresses>`
      : '';

    // GSM numarası XML (opsiyonel - sadece dolu ise gönder)
    const gsmNoXml = receiverGsmNo 
      ? `
        <tem:ReceiverGsmNo>${this.escapeXml(receiverGsmNo)}</tem:ReceiverGsmNo>`
      : '';

    // XSD'de ZORUNLU parametreler (minOccurs="1")
    // Boolean değerler lowercase string olarak gönderilmeli
    const transportTypeXml = `
        <tem:InvoiceTransportationType>${this.escapeXml(invoiceTransportationType)}</tem:InvoiceTransportationType>`;
    
    const createdAtDeliveryXml = `
        <tem:IsInvoiceCreatedAtDelivery>${isInvoiceCreatedAtDelivery ? 'true' : 'false'}</tem:IsInvoiceCreatedAtDelivery>`;
    
    const internetSalesXml = `
        <tem:IsInternetSalesInvoice>${isInternetSalesInvoice ? 'true' : 'false'}</tem:IsInternetSalesInvoice>`;

    // XSD element sırasına uygun SOAP request
    // ÖNEMLİ: TransferFile base alanları ÖNCE, sonra EArchiveTransferFile alanları
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:TransferSalesInvoiceFile>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:transferFile>
        <tem:FileDataType>${fileDataTypeValue}</tem:FileDataType>
        <tem:FileNameWithExtension>${this.escapeXml(fileName)}</tem:FileNameWithExtension>
        <tem:BinaryData>${binaryData}</tem:BinaryData>
        <tem:BinaryDataHash>${this.escapeXml(binaryDataHash)}</tem:BinaryDataHash>${mailAddressesXml}${gsmNoXml}${transportTypeXml}${createdAtDeliveryXml}${internetSalesXml}
      </tem:transferFile>
    </tem:TransferSalesInvoiceFile>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const soapAction = 'TransferSalesInvoiceFile';

      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': soapAction,
        },
        body: soapRequest,
      });

      const xmlText = await response.text();

      return this.parseTransferResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'E-Archive Transfer failed',
      };
    }
  }

  /**
   * Cancel E-Archive Invoice (E-Arşiv Fatura İptal)
   * E-Arşiv faturaları iptal edilebilir (E-Fatura'dan farklı olarak)
   * 
   * C# örnek kodundan: FATURA_IPTAL_TEST()
   * Metod: CancelSalesInvoiceWithInvoiceNumber
   * 
   * @param sessionCode - Oturum kodu
   * @param params - İptal parametreleri
   * @param url - Webservice URL
   */
  static async cancelEArchiveInvoice(
    sessionCode: string,
    params: {
      invoiceNumber: string;
      cancelDate?: string; // ISO format datetime
    },
    url: string
  ): Promise<VeribanSoapResponse> {
    const { invoiceNumber, cancelDate } = params;
    
    // Cancel date: eğer verilmemişse şu anki zaman
    const cancelDateStr = cancelDate || new Date().toISOString();

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:CancelSalesInvoiceWithInvoiceNumber>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:invoiceNumber>${this.escapeXml(invoiceNumber)}</tem:invoiceNumber>
      <tem:cancelDate>${this.escapeXml(cancelDateStr)}</tem:cancelDate>
    </tem:CancelSalesInvoiceWithInvoiceNumber>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'CancelSalesInvoiceWithInvoiceNumber',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();

      return this.parseCancelResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'E-Archive Cancel failed',
      };
    }
  }

  /**
   * Parse cancel response XML
   */
  private static parseCancelResponse(xmlText: string): VeribanSoapResponse {
    try {
      // Check for SOAP fault first
      const faultCodeMatch = xmlText.match(/<FaultCode[^>]*>(.*?)<\/FaultCode>/i);
      const faultDescMatch = xmlText.match(/<FaultDescription[^>]*>(.*?)<\/FaultDescription>/i);
      const faultStringMatch = xmlText.match(/<faultstring[^>]*>(.*?)<\/faultstring>/i);
      const soapFaultMatch = xmlText.match(/<soap:Fault[^>]*>[\s\S]*?<soap:faultstring[^>]*>(.*?)<\/soap:faultstring>/i);

      if (faultCodeMatch || faultDescMatch || faultStringMatch || soapFaultMatch) {
        const errorMsg = faultDescMatch?.[1] || faultStringMatch?.[1] || soapFaultMatch?.[1] || faultCodeMatch?.[1] || 'Bilinmeyen SOAP hatası';
        console.error('❌ SOAP Fault detected in cancel:', errorMsg);
        return {
          success: false,
          error: errorMsg.trim(),
        };
      }

      // Check for OperationCompleted
      const operationCompletedMatch = xmlText.match(/<OperationCompleted[^>]*>(.*?)<\/OperationCompleted>/);
      const operationCompleted = operationCompletedMatch ? operationCompletedMatch[1].trim().toLowerCase() === 'true' : false;

      // Get description
      const descriptionMatch = xmlText.match(/<Description[^>]*>(.*?)<\/Description>/);
      const description = descriptionMatch ? descriptionMatch[1].trim() : '';

      if (!operationCompleted) {
        return {
          success: false,
          error: description || 'İptal işlemi başarısız',
        };
      }

      return {
        success: true,
        data: {
          operationCompleted,
          description,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'XML parse error',
      };
    }
  }

  /**
   * Get Transfer Sales Invoice File Status
   * Doküman: Bölüm 8 - Fatura Gönderme Durum Sorgulaması
   */
  static async getTransferStatus(
    sessionCode: string,
    transferFileUniqueId: string,
    url: string
  ): Promise<VeribanSoapResponse> {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetTransferSalesInvoiceFileStatus>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:transferFileUniqueId>${this.escapeXml(transferFileUniqueId)}</tem:transferFileUniqueId>
    </tem:GetTransferSalesInvoiceFileStatus>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'GetTransferSalesInvoiceFileStatus',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseTransferStatusResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetTransferStatus failed',
      };
    }
  }

  /**
   * Get Transfer Sales Invoice File Status with Integration Code
   * Doküman: Bölüm 9 - Fatura Gönderme Durum Sorgulaması Entegrasyon Kodu İle
   */
  static async getTransferStatusWithIntegrationCode(
    sessionCode: string,
    uniqueIntegrationCode: string,
    url: string
  ): Promise<VeribanSoapResponse> {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetTransferSalesInvoiceFileStatusWithIntegrationCode>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:uniqueIntegrationCode>${this.escapeXml(uniqueIntegrationCode)}</tem:uniqueIntegrationCode>
    </tem:GetTransferSalesInvoiceFileStatusWithIntegrationCode>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'GetTransferSalesInvoiceFileStatusWithIntegrationCode',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseTransferStatusResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetTransferStatusWithIntegrationCode failed',
      };
    }
  }

  /**
   * Get Sales Invoice Status with Invoice UUID
   * Doküman: Bölüm 12 - Giden Fatura Durum Sorgulama
   */
  static async getSalesInvoiceStatus(
    sessionCode: string,
    invoiceUUID: string,
    url: string
  ): Promise<VeribanSoapResponse> {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetSalesInvoiceStatusWithInvoiceUUID>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:invoiceUUID>${this.escapeXml(invoiceUUID)}</tem:invoiceUUID>
    </tem:GetSalesInvoiceStatusWithInvoiceUUID>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'GetSalesInvoiceStatusWithInvoiceUUID',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseInvoiceStatusResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetSalesInvoiceStatus failed',
      };
    }
  }

  /**
   * Get Sales Invoice Status with Integration Code
   * Doküman: Bölüm 13 - Giden Fatura Durum Sorgulama Entegrasyon Kodu İle
   */
  static async getSalesInvoiceStatusWithIntegrationCode(
    sessionCode: string,
    uniqueIntegrationCode: string,
    url: string
  ): Promise<VeribanSoapResponse> {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetSalesInvoiceStatusWithIntegrationCode>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:uniqueIntegrationCode>${this.escapeXml(uniqueIntegrationCode)}</tem:uniqueIntegrationCode>
    </tem:GetSalesInvoiceStatusWithIntegrationCode>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'GetSalesInvoiceStatusWithIntegrationCode',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseInvoiceStatusResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetSalesInvoiceStatusWithIntegrationCode failed',
      };
    }
  }

  /**
   * Get Sales Invoice Status with Invoice Number
   * Doküman: Bölüm 14 - Giden Fatura Durum Sorgulama Fatura Numarası İle
   */
  static async getSalesInvoiceStatusWithInvoiceNumber(
    sessionCode: string,
    invoiceNumber: string,
    url: string
  ): Promise<VeribanSoapResponse> {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetSalesInvoiceStatusWithInvoiceNumber>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:invoiceNumber>${this.escapeXml(invoiceNumber)}</tem:invoiceNumber>
    </tem:GetSalesInvoiceStatusWithInvoiceNumber>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'GetSalesInvoiceStatusWithInvoiceNumber',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseInvoiceStatusResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetSalesInvoiceStatusWithInvoiceNumber failed',
      };
    }
  }

  /**
   * Get Purchase Invoice Status with Invoice UUID
   * Doküman: Bölüm 15 - Gelen Fatura Durum Sorgulama
   */
  static async getPurchaseInvoiceStatus(
    sessionCode: string,
    invoiceUUID: string,
    url: string
  ): Promise<VeribanSoapResponse> {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetPurchaseInvoiceStatusWithInvoiceUUID>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:invoiceUUID>${this.escapeXml(invoiceUUID)}</tem:invoiceUUID>
    </tem:GetPurchaseInvoiceStatusWithInvoiceUUID>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'GetPurchaseInvoiceStatusWithInvoiceUUID',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parsePurchaseInvoiceStatusResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetPurchaseInvoiceStatus failed',
      };
    }
  }

  /**
   * Get Purchase Invoice Status with Invoice Number
   * Doküman: Bölüm 16 - Gelen Fatura Durum Sorgulama Fatura Numarası İle
   */
  static async getPurchaseInvoiceStatusWithInvoiceNumber(
    sessionCode: string,
    invoiceNumber: string,
    url: string
  ): Promise<VeribanSoapResponse> {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetPurchaseInvoiceStatusWithInvoiceNumber>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:invoiceNumber>${this.escapeXml(invoiceNumber)}</tem:invoiceNumber>
    </tem:GetPurchaseInvoiceStatusWithInvoiceNumber>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'GetPurchaseInvoiceStatusWithInvoiceNumber',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parsePurchaseInvoiceStatusResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetPurchaseInvoiceStatusWithInvoiceNumber failed',
      };
    }
  }

  /**
   * Get Sales Invoice List
   */
  static async getSalesInvoiceList(
    sessionCode: string,
    params: {
      startDate?: string;
      endDate?: string;
      pageIndex?: number;
      pageSize?: number;
    },
    url: string
  ): Promise<VeribanSoapResponse> {
    const {
      startDate = '',
      endDate = '',
      pageIndex = 1,
      pageSize = 100,
    } = params;

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetSalesInvoiceList>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      ${startDate ? `<tem:startDate>${this.escapeXml(startDate)}</tem:startDate>` : '<tem:startDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>'}
      ${endDate ? `<tem:endDate>${this.escapeXml(endDate)}</tem:endDate>` : '<tem:endDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>'}
      <tem:pageIndex>${pageIndex}</tem:pageIndex>
      <tem:pageSize>${pageSize}</tem:pageSize>
    </tem:GetSalesInvoiceList>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'GetSalesInvoiceList',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseInvoiceListResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetSalesInvoiceList failed',
      };
    }
  }

  /**
   * Get Purchase Invoice List
   */
  static async getPurchaseInvoiceList(
    sessionCode: string,
    params: {
      startDate?: string;
      endDate?: string;
      pageIndex?: number;
      pageSize?: number;
    },
    url: string
  ): Promise<VeribanSoapResponse> {
    const {
      startDate = '',
      endDate = '',
      pageIndex = 1,
      pageSize = 100,
    } = params;

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetPurchaseInvoiceList>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      ${startDate ? `<tem:startDate>${this.escapeXml(startDate)}</tem:startDate>` : '<tem:startDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>'}
      ${endDate ? `<tem:endDate>${this.escapeXml(endDate)}</tem:endDate>` : '<tem:endDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>'}
      <tem:pageIndex>${pageIndex}</tem:pageIndex>
      <tem:pageSize>${pageSize}</tem:pageSize>
    </tem:GetPurchaseInvoiceList>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'GetPurchaseInvoiceList',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseInvoiceListResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetPurchaseInvoiceList failed',
      };
    }
  }

  /**
   * Get Sales Invoice UUID List
   * Doküman: Bölüm 18 - Giden Fatura UUID Listesi
   * 
   * Müşteri VKN/TCKN ile filtreleme yapılabilir.
   * customerRegisterNumber parametresi ile belirli bir müşteriye ait faturaları getirir.
   */
  static async getSalesInvoiceUUIDList(
    sessionCode: string,
    params: {
      startDate?: string;
      endDate?: string;
      customerRegisterNumber?: string;
    },
    url: string
  ): Promise<VeribanSoapResponse> {
    const {
      startDate,
      endDate,
      customerRegisterNumber,
    } = params;

    const customerRegNumberTag = customerRegisterNumber 
      ? `<tem:customerRegisterNumber>${this.escapeXml(customerRegisterNumber)}</tem:customerRegisterNumber>`
      : '';
    
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetSalesInvoiceUUIDList>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      ${startDate ? `<tem:startDate>${this.escapeXml(startDate)}</tem:startDate>` : '<tem:startDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>'}
      ${endDate ? `<tem:endDate>${this.escapeXml(endDate)}</tem:endDate>` : '<tem:endDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>'}${customerRegNumberTag}
    </tem:GetSalesInvoiceUUIDList>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'GetSalesInvoiceUUIDList',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseUUIDListResponse(xmlText);
    } catch (error) {
      console.error('❌ GetSalesInvoiceUUIDList Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetSalesInvoiceUUIDList failed',
      };
    }
  }

  /**
   * Get Sales Invoice UUID List With Customer Register Number (Alias)
   * Müşteri VKN/TCKN bazında tarih aralıklı fatura ETTN listesi
   * 
   * Bu fonksiyon getSalesInvoiceUUIDList'in alias'ıdır ve aynı şekilde çalışır.
   * Dokümandaki isimlendirmeye uyum için eklenmiştir.
   */
  static async getSalesInvoiceUUIDListWithCustomerRegisterNumber(
    sessionCode: string,
    customerRegisterNumber: string,
    startDate: string,
    endDate: string,
    url: string
  ): Promise<VeribanSoapResponse> {
    return this.getSalesInvoiceUUIDList(
      sessionCode,
      { startDate, endDate, customerRegisterNumber },
      url
    );
  }

  /**
   * Get Purchase Invoice UUID List
   * Doküman: Bölüm 19 - Gelen Fatura UUID Listesi
   */
  static async getPurchaseInvoiceUUIDList(
    sessionCode: string,
    params: {
      startDate?: string;
      endDate?: string;
    },
    url: string
  ): Promise<VeribanSoapResponse> {
    const {
      startDate = '',
      endDate = '',
    } = params;

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetPurchaseInvoiceUUIDList>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      ${startDate ? `<tem:startDate>${this.escapeXml(startDate)}</tem:startDate>` : '<tem:startDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>'}
      ${endDate ? `<tem:endDate>${this.escapeXml(endDate)}</tem:endDate>` : '<tem:endDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>'}
    </tem:GetPurchaseInvoiceUUIDList>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'GetPurchaseInvoiceUUIDList',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseUUIDListResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetPurchaseInvoiceUUIDList failed',
      };
    }
  }

  /**
   * Get UnTransferred Purchase Invoice UUID List
   * Doküman: Bölüm 20 - Gelen Transfer Edilmemiş UUID Listesi
   */
  static async getUnTransferredPurchaseInvoiceUUIDList(
    sessionCode: string,
    url: string
  ): Promise<VeribanSoapResponse> {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetUnTransferredPurchaseInvoiceUUIDList>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
    </tem:GetUnTransferredPurchaseInvoiceUUIDList>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'GetUnTransferredPurchaseInvoiceUUIDList',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseUUIDListResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetUnTransferredPurchaseInvoiceUUIDList failed',
      };
    }
  }

  /**
   * Set UnTransferred Purchase Invoice Done
   * Doküman: Bölüm 21 - Gelen Faturayı Transfer Edildi Yap
   */
  static async setUnTransferredPurchaseInvoiceDone(
    sessionCode: string,
    invoiceUUID: string,
    url: string
  ): Promise<VeribanSoapResponse> {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:SetUnTransferredPurchaseInvoiceDone>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:invoiceUUID>${this.escapeXml(invoiceUUID)}</tem:invoiceUUID>
    </tem:SetUnTransferredPurchaseInvoiceDone>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'SetUnTransferredPurchaseInvoiceDone',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseStandardResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SetUnTransferredPurchaseInvoiceDone failed',
      };
    }
  }

  /**
   * Get Wait Answer Purchase Invoice UUID List
   * Doküman: Bölüm 22 - Gelen Fatura Cevap Verilmemiş UUID Listesi
   */
  static async getWaitAnswerPurchaseInvoiceUUIDList(
    sessionCode: string,
    url: string
  ): Promise<VeribanSoapResponse> {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetWaitAnswerPurchaseInvoiceUUIDList>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
    </tem:GetWaitAnswerPurchaseInvoiceUUIDList>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'GetWaitAnswerPurchaseInvoiceUUIDList',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseUUIDListResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetWaitAnswerPurchaseInvoiceUUIDList failed',
      };
    }
  }

  /**
   * Set Purchase Invoice Answer With Invoice Number
   * Doküman: Bölüm 24 - Gelen Faturaya Fatura Numarası İle Cevap Verme
   */
  static async setPurchaseInvoiceAnswerWithInvoiceNumber(
    sessionCode: string,
    params: {
      invoiceNumber: string;
      answerType: string; // KABUL, RED, IADE
      answerTime?: string;
      answerNote?: string;
      isDirectSend: boolean;
    },
    url: string
  ): Promise<VeribanSoapResponse> {
    const {
      invoiceNumber,
      answerType,
      answerTime,
      answerNote = '',
      isDirectSend,
    } = params;

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:SetPurchaseInvoiceAnswerWithInvoiceNumber>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:answerType>${this.escapeXml(answerType)}</tem:answerType>
      ${answerTime ? `<tem:answerTime>${this.escapeXml(answerTime)}</tem:answerTime>` : '<tem:answerTime xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>'}
      <tem:answerNote>${this.escapeXml(answerNote)}</tem:answerNote>
      <tem:isDirectSend>${isDirectSend}</tem:isDirectSend>
      <tem:invoiceNumber>${this.escapeXml(invoiceNumber)}</tem:invoiceNumber>
    </tem:SetPurchaseInvoiceAnswerWithInvoiceNumber>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'SetPurchaseInvoiceAnswerWithInvoiceNumber',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseStandardResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SetPurchaseInvoiceAnswerWithInvoiceNumber failed',
      };
    }
  }

  /**
   * Download Sales Invoice with Invoice UUID
   * Doküman: Bölüm 25 - Giden Faturaya İndirme
   */
  static async downloadSalesInvoice(
    sessionCode: string,
    params: {
      invoiceUUID: string;
      downloadDataType?: string; // XML_INZIP, HTML_INZIP, PDF_INZIP
    },
    url: string
  ): Promise<VeribanSoapResponse> {
    const { invoiceUUID, downloadDataType = 'XML_INZIP' } = params;

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:DownloadSalesInvoiceWithInvoiceUUID>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:downloadDataType>${this.escapeXml(downloadDataType)}</tem:downloadDataType>
      <tem:invoiceUUID>${this.escapeXml(invoiceUUID)}</tem:invoiceUUID>
    </tem:DownloadSalesInvoiceWithInvoiceUUID>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'DownloadSalesInvoiceWithInvoiceUUID',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseDownloadResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DownloadSalesInvoice failed',
      };
    }
  }

  /**
   * Download Sales Invoice with Invoice Number
   * Doküman: Bölüm 26 - Giden Faturayı Fatura Numarası İle İndirme
   */
  static async downloadSalesInvoiceWithInvoiceNumber(
    sessionCode: string,
    params: {
      invoiceNumber: string;
      downloadDataType?: string; // XML_INZIP, HTML_INZIP, PDF_INZIP
    },
    url: string
  ): Promise<VeribanSoapResponse> {
    const { invoiceNumber, downloadDataType = 'XML_INZIP' } = params;

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:DownloadSalesInvoiceWithInvoiceNumber>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:downloadDataType>${this.escapeXml(downloadDataType)}</tem:downloadDataType>
      <tem:invoiceNumber>${this.escapeXml(invoiceNumber)}</tem:invoiceNumber>
    </tem:DownloadSalesInvoiceWithInvoiceNumber>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'DownloadSalesInvoiceWithInvoiceNumber',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseDownloadResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DownloadSalesInvoiceWithInvoiceNumber failed',
      };
    }
  }

  /**
   * Download Sales Invoice with Integration Code
   * Doküman: Bölüm 27 - Giden Faturayı Entegrasyon Kodu İle İndirme
   */
  static async downloadSalesInvoiceWithIntegrationCode(
    sessionCode: string,
    params: {
      uniqueIntegrationCode: string;
      downloadDataType?: string; // XML_INZIP, HTML_INZIP, PDF_INZIP
    },
    url: string
  ): Promise<VeribanSoapResponse> {
    const { uniqueIntegrationCode, downloadDataType = 'XML_INZIP' } = params;

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:DownloadSalesInvoiceWithIntegrationCode>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:downloadDataType>${this.escapeXml(downloadDataType)}</tem:downloadDataType>
      <tem:uniqueIntegrationCode>${this.escapeXml(uniqueIntegrationCode)}</tem:uniqueIntegrationCode>
    </tem:DownloadSalesInvoiceWithIntegrationCode>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'DownloadSalesInvoiceWithIntegrationCode',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseDownloadResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DownloadSalesInvoiceWithIntegrationCode failed',
      };
    }
  }

  /**
   * Download Purchase Invoice with Invoice UUID
   * Doküman: Bölüm 28 - Gelen Faturayı İndirme
   */
  static async downloadPurchaseInvoice(
    sessionCode: string,
    params: {
      invoiceUUID: string;
      downloadDataType?: string; // XML_INZIP, HTML_INZIP, PDF_INZIP
    },
    url: string
  ): Promise<VeribanSoapResponse> {
    const { invoiceUUID, downloadDataType = 'XML_INZIP' } = params;

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:DownloadPurchaseInvoiceWithInvoiceUUID>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:downloadDataType>${this.escapeXml(downloadDataType)}</tem:downloadDataType>
      <tem:invoiceUUID>${this.escapeXml(invoiceUUID)}</tem:invoiceUUID>
    </tem:DownloadPurchaseInvoiceWithInvoiceUUID>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'DownloadPurchaseInvoiceWithInvoiceUUID',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseDownloadResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DownloadPurchaseInvoice failed',
      };
    }
  }

  /**
   * Download Purchase Invoice with Invoice Number
   * Doküman: Bölüm 29 - Gelen Faturayı Fatura Numarası İle İndirme
   */
  static async downloadPurchaseInvoiceWithInvoiceNumber(
    sessionCode: string,
    params: {
      invoiceNumber: string;
      downloadDataType?: string; // XML_INZIP, HTML_INZIP, PDF_INZIP
    },
    url: string
  ): Promise<VeribanSoapResponse> {
    const { invoiceNumber, downloadDataType = 'XML_INZIP' } = params;

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:DownloadPurchaseInvoiceWithInvoiceNumber>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:downloadDataType>${this.escapeXml(downloadDataType)}</tem:downloadDataType>
      <tem:invoiceNumber>${this.escapeXml(invoiceNumber)}</tem:invoiceNumber>
    </tem:DownloadPurchaseInvoiceWithInvoiceNumber>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'DownloadPurchaseInvoiceWithInvoiceNumber',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseDownloadResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DownloadPurchaseInvoiceWithInvoiceNumber failed',
      };
    }
  }

  /**
   * Check Taxpayer (Mükellef Kontrol) - GetCustomerAliasListWithRegisterNumber
   * Doküman: Bölüm 17 - Müşteri Etiket Bilgisi Sorgulama
   */
  static async checkTaxpayer(
    sessionCode: string,
    taxNumber: string,
    url: string
  ): Promise<VeribanSoapResponse> {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetCustomerAliasListWithRegisterNumber>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:customerRegisterNumber>${this.escapeXml(taxNumber)}</tem:customerRegisterNumber>
    </tem:GetCustomerAliasListWithRegisterNumber>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'GetCustomerAliasListWithRegisterNumber',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseCustomerDataResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'CheckTaxpayer failed',
      };
    }
  }

  /**
   * Set Purchase Invoice Answer with Invoice UUID
   * Doküman: Bölüm 23 - Gelen Faturaya Cevap Verme
   */
  static async setPurchaseInvoiceAnswer(
    sessionCode: string,
    params: {
      invoiceUUID: string;
      answerType: string; // 'KABUL', 'RED', 'IADE' etc.
      answerTime?: string; // DateTime? format: ISO string
      answerNote?: string;
      isDirectSend?: boolean;
    },
    url: string
  ): Promise<VeribanSoapResponse> {
    const { 
      invoiceUUID, 
      answerType, 
      answerTime = '', 
      answerNote = '',
      isDirectSend = true 
    } = params;

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:SetPurchaseInvoiceAnswerWithInvoiceUUID>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:answerType>${this.escapeXml(answerType)}</tem:answerType>
      ${answerTime ? `<tem:answerTime>${this.escapeXml(answerTime)}</tem:answerTime>` : '<tem:answerTime xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>'}
      <tem:answerNote>${this.escapeXml(answerNote)}</tem:answerNote>
      <tem:isDirectSend>${isDirectSend}</tem:isDirectSend>
      <tem:invoiceUUID>${this.escapeXml(invoiceUUID)}</tem:invoiceUUID>
    </tem:SetPurchaseInvoiceAnswerWithInvoiceUUID>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'SetPurchaseInvoiceAnswerWithInvoiceUUID',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseStandardResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SetPurchaseInvoiceAnswer failed',
      };
    }
  }

  /**
   * Parse login response XML
   * Doküman: Bölüm 2 - Oturum Açma
   * Geri Dönüş: String token (sessionCode)
   */
  private static parseLoginResponse(xmlText: string): VeribanLoginResponse {
    try {
      // Check for SOAP fault first
      const faultCodeMatch = xmlText.match(/<FaultCode[^>]*>(.*?)<\/FaultCode>/i);
      const faultDescMatch = xmlText.match(/<FaultDescription[^>]*>(.*?)<\/FaultDescription>/i);
      const faultStringMatch = xmlText.match(/<faultstring[^>]*>(.*?)<\/faultstring>/i);
      const soapFaultMatch = xmlText.match(/<soap:Fault[^>]*>[\s\S]*?<soap:faultstring[^>]*>(.*?)<\/soap:faultstring>/i);
      const soapFaultCodeMatch = xmlText.match(/<soap:Fault[^>]*>[\s\S]*?<soap:faultcode[^>]*>(.*?)<\/soap:faultcode>/i);
      
      if (faultCodeMatch || faultDescMatch || faultStringMatch || soapFaultMatch || soapFaultCodeMatch) {
        const errorMsg = faultDescMatch?.[1] || faultStringMatch?.[1] || soapFaultMatch?.[1] || faultCodeMatch?.[1] || soapFaultCodeMatch?.[1] || 'Bilinmeyen hata';
        console.error('❌ SOAP Fault detected:', errorMsg);
        return {
          success: false,
          error: errorMsg.trim(),
        };
      }
      
      // Extract LoginResult (sessionCode/token)
      // Try different possible XML structures
      let loginResultMatch = xmlText.match(/<LoginResult[^>]*>(.*?)<\/LoginResult>/i);
      if (!loginResultMatch) {
        // Try with namespace
        loginResultMatch = xmlText.match(/<tem:LoginResult[^>]*>(.*?)<\/tem:LoginResult>/i);
      }
      if (!loginResultMatch) {
        // Try with different namespace
        loginResultMatch = xmlText.match(/<[^:]*:LoginResult[^>]*>(.*?)<\/[^:]*:LoginResult>/i);
      }
      
      const sessionCode = loginResultMatch ? loginResultMatch[1].trim() : '';

      if (!sessionCode || sessionCode.length === 0) {
        return {
          success: false,
          error: 'Giriş başarısız - session code alınamadı. Lütfen kullanıcı adı ve şifrenizi kontrol edin.',
        };
      }

      return {
        success: true,
        sessionCode,
      };
    } catch (error) {
      console.error('❌ XML parse error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'XML parse error',
      };
    }
  }

  /**
   * Parse logout response XML
   * Doküman: Bölüm 3 - Oturum Kapama
   */
  private static parseLogoutResponse(xmlText: string): VeribanSoapResponse {
    try {
      // Check for SOAP fault
      const faultCodeMatch = xmlText.match(/<FaultCode[^>]*>(.*?)<\/FaultCode>/i);
      const faultDescMatch = xmlText.match(/<FaultDescription[^>]*>(.*?)<\/FaultDescription>/i);
      const faultStringMatch = xmlText.match(/<faultstring[^>]*>(.*?)<\/faultstring>/i);
      const soapFaultMatch = xmlText.match(/<soap:Fault[^>]*>[\s\S]*?<soap:faultstring[^>]*>(.*?)<\/soap:faultstring>/i);
      
      if (faultCodeMatch || faultDescMatch || faultStringMatch || soapFaultMatch) {
        const errorMsg = faultDescMatch?.[1] || faultStringMatch?.[1] || soapFaultMatch?.[1] || faultCodeMatch?.[1] || 'Bilinmeyen hata';
        console.error('❌ SOAP Fault detected in logout:', errorMsg);
        return {
          success: false,
          error: errorMsg.trim(),
        };
      }
      
      // Logout doesn't return data, just success/failure
      // If no fault, consider it successful
      return {
        success: true,
      };
    } catch (error) {
      console.error('❌ Logout parse error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout parse error',
      };
    }
  }

  /**
   * Parse transfer response XML
   */
  private static parseTransferResponse(xmlText: string): VeribanSoapResponse {
    try {
      // Check for SOAP fault first
      const faultCodeMatch = xmlText.match(/<FaultCode[^>]*>(.*?)<\/FaultCode>/i);
      const faultDescMatch = xmlText.match(/<FaultDescription[^>]*>(.*?)<\/FaultDescription>/i);
      const faultStringMatch = xmlText.match(/<faultstring[^>]*>(.*?)<\/faultstring>/i);
      const soapFaultMatch = xmlText.match(/<soap:Fault[^>]*>[\s\S]*?<soap:faultstring[^>]*>(.*?)<\/soap:faultstring>/i);
      const soapFaultCodeMatch = xmlText.match(/<soap:Fault[^>]*>[\s\S]*?<soap:faultcode[^>]*>(.*?)<\/soap:faultcode>/i);

      if (faultCodeMatch || faultDescMatch || faultStringMatch || soapFaultMatch || soapFaultCodeMatch) {
        const errorMsg = faultDescMatch?.[1] || faultStringMatch?.[1] || soapFaultMatch?.[1] || faultCodeMatch?.[1] || soapFaultCodeMatch?.[1] || 'Bilinmeyen SOAP hatası';
        console.error('❌ SOAP Fault detected in transfer:', errorMsg);
        return {
          success: false,
          error: errorMsg.trim(),
          data: {
            operationCompleted: false,
            transferFileUniqueId: '',
            errorMessage: errorMsg.trim(),
          },
        };
      }

      const operationCompletedMatch = xmlText.match(/<OperationCompleted[^>]*>(.*?)<\/OperationCompleted>/);
      const operationCompleted = operationCompletedMatch ? operationCompletedMatch[1].trim().toLowerCase() === 'true' : false;

      const transferFileUniqueIdMatch = xmlText.match(/<TransferFileUniqueId[^>]*>(.*?)<\/TransferFileUniqueId>/);
      const transferFileUniqueId = transferFileUniqueIdMatch ? transferFileUniqueIdMatch[1].trim() : '';

      // Look for invoice number in the response (Veriban may return it after successful transfer)
      // NOTE: Transfer response'unda genellikle InvoiceNumber olmaz, bu yüzden sadece açıkça InvoiceNumber tag'i varsa parse ediyoruz
      // Description veya Message'dan parse etmeyi kaldırdık çünkü yanlış değerler bulabiliyor (örn: "DOKUMAN")
      let invoiceNumber = '';
      
      // Pattern 1: Standard <InvoiceNumber>...</InvoiceNumber>
      const invoiceNumberMatch1 = xmlText.match(/<InvoiceNumber[^>]*>(.*?)<\/InvoiceNumber>/i);
      if (invoiceNumberMatch1) {
        const parsedValue = invoiceNumberMatch1[1].trim();
        // Geçersiz değerleri filtrele (DOKUMAN, TASLAK, vb. gibi)
        if (parsedValue && 
            parsedValue.length > 0 && 
            parsedValue.length <= 50 && // Maksimum uzunluk kontrolü
            !['DOKUMAN', 'TASLAK', 'MESSAGE', 'DESCRIPTION', 'ERROR'].includes(parsedValue.toUpperCase())) {
          invoiceNumber = parsedValue;
        }
      }
      
      // Pattern 2: With namespace <tem:InvoiceNumber>...</tem:InvoiceNumber>
      if (!invoiceNumber) {
        const invoiceNumberMatch2 = xmlText.match(/<tem:InvoiceNumber[^>]*>(.*?)<\/tem:InvoiceNumber>/i);
        if (invoiceNumberMatch2) {
          const parsedValue = invoiceNumberMatch2[1].trim();
          if (parsedValue && 
              parsedValue.length > 0 && 
              parsedValue.length <= 50 &&
              !['DOKUMAN', 'TASLAK', 'MESSAGE', 'DESCRIPTION', 'ERROR'].includes(parsedValue.toUpperCase())) {
            invoiceNumber = parsedValue;
          }
        }
      }
      
      // Pattern 3: <ns:InvoiceNumber>...</ns:InvoiceNumber> (any namespace)
      if (!invoiceNumber) {
        const invoiceNumberMatch3 = xmlText.match(/<[^:>]*:InvoiceNumber[^>]*>(.*?)<\/[^:>]*:InvoiceNumber>/i);
        if (invoiceNumberMatch3) {
          const parsedValue = invoiceNumberMatch3[1].trim();
          if (parsedValue && 
              parsedValue.length > 0 && 
              parsedValue.length <= 50 &&
              !['DOKUMAN', 'TASLAK', 'MESSAGE', 'DESCRIPTION', 'ERROR'].includes(parsedValue.toUpperCase())) {
            invoiceNumber = parsedValue;
          }
        }
      }
      
      // Pattern 4: <InvoiceNumber /> (self-closing) - attribute'dan al
      if (!invoiceNumber) {
        const invoiceNumberMatch4 = xmlText.match(/<InvoiceNumber[^>]*\/>/i);
        if (invoiceNumberMatch4) {
          // Try to extract from attribute
          const attrMatch = xmlText.match(/<InvoiceNumber[^>]*value=["'](.*?)["']/i);
          if (attrMatch) {
            const parsedValue = attrMatch[1].trim();
            if (parsedValue && 
                parsedValue.length > 0 && 
                parsedValue.length <= 50 &&
                !['DOKUMAN', 'TASLAK', 'MESSAGE', 'DESCRIPTION', 'ERROR'].includes(parsedValue.toUpperCase())) {
              invoiceNumber = parsedValue;
            }
          }
        }
      }
      
      // NOT: Description veya Message'dan parse etmeyi kaldırdık çünkü yanlış değerler bulabiliyor

      // Look for error messages in the response
      const errorMessageMatch = xmlText.match(/<ErrorMessage[^>]*>(.*?)<\/ErrorMessage>/i);
      const errorMessage = errorMessageMatch ? errorMessageMatch[1].trim() : '';

      const messageMatch = xmlText.match(/<Message[^>]*>(.*?)<\/Message>/i);
      const message = messageMatch ? messageMatch[1].trim() : '';

      const descriptionMatch = xmlText.match(/<Description[^>]*>(.*?)<\/Description>/i);
      const description = descriptionMatch ? descriptionMatch[1].trim() : '';

      // If operation didn't complete, include error details
      if (!operationCompleted) {
        const detailedError = errorMessage || message || description || 'Transfer tamamlanamadı - Veriban yanıtında OperationCompleted=false';
        console.error('❌ Transfer failed:', detailedError);

        return {
          success: false,
          error: detailedError,
          data: {
            operationCompleted: false,
            transferFileUniqueId: transferFileUniqueId,
            invoiceNumber: invoiceNumber,
            errorMessage: detailedError,
            message: message,
            description: description,
          },
        };
      }

      return {
        success: operationCompleted,
        data: {
          operationCompleted,
          transferFileUniqueId,
          invoiceNumber: invoiceNumber,
          errorMessage: errorMessage,
          message: message,
          description: description,
        },
      };
    } catch (error) {
      console.error('❌ parseTransferResponse exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'XML parse error',
      };
    }
  }

  /**
   * Parse transfer status response XML
   */
  private static parseTransferStatusResponse(xmlText: string): VeribanSoapResponse {
    try {
      const stateCodeMatch = xmlText.match(/<StateCode[^>]*>(.*?)<\/StateCode>/);
      const stateCode = stateCodeMatch ? parseInt(stateCodeMatch[1].trim()) : 0;

      const stateNameMatch = xmlText.match(/<StateName[^>]*>(.*?)<\/StateName>/);
      const stateName = stateNameMatch ? stateNameMatch[1].trim() : '';

      const stateDescriptionMatch = xmlText.match(/<StateDescription[^>]*>(.*?)<\/StateDescription>/);
      const stateDescription = stateDescriptionMatch ? stateDescriptionMatch[1].trim() : '';

      // Veriban'ın döndürdüğü fatura numarasını parse et (E-Arşiv için önemli)
      let invoiceNumber = '';
      const invoiceNumberMatch = xmlText.match(/<InvoiceNumber[^>]*>(.*?)<\/InvoiceNumber>/i);
      if (invoiceNumberMatch) {
        invoiceNumber = invoiceNumberMatch[1].trim();
      }

      return {
        success: true,
        data: {
          stateCode,
          stateName,
          stateDescription,
          invoiceNumber: invoiceNumber || undefined,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'XML parse error',
      };
    }
  }

  /**
   * Parse invoice status response XML (for Sales Invoice)
   * E-Arşiv için InvoiceProfile, GIBReportStateCode, MailStateCode alanları eklendi
   */
  private static parseInvoiceStatusResponse(xmlText: string): VeribanSoapResponse {
    try {
      const stateCodeMatch = xmlText.match(/<StateCode[^>]*>(.*?)<\/StateCode>/);
      const stateCode = stateCodeMatch ? parseInt(stateCodeMatch[1].trim()) : 0;

      const stateNameMatch = xmlText.match(/<StateName[^>]*>(.*?)<\/StateName>/);
      const stateName = stateNameMatch ? stateNameMatch[1].trim() : '';

      const stateDescriptionMatch = xmlText.match(/<StateDescription[^>]*>(.*?)<\/StateDescription>/);
      const stateDescription = stateDescriptionMatch ? stateDescriptionMatch[1].trim() : '';

      const answerStateCodeMatch = xmlText.match(/<AnswerStateCode[^>]*>(.*?)<\/AnswerStateCode>/);
      const answerStateCode = answerStateCodeMatch ? parseInt(answerStateCodeMatch[1].trim()) : 0;

      const answerTypeCodeMatch = xmlText.match(/<AnswerTypeCode[^>]*>(.*?)<\/AnswerTypeCode>/);
      const answerTypeCode = answerTypeCodeMatch ? parseInt(answerTypeCodeMatch[1].trim()) : 0;

      // ========================================
      // YENİ: InvoiceProfile alanını parse et
      // E-Arşiv ve E-Fatura ayrımı için kritik
      // ========================================
      let invoiceProfile = '';
      
      // Pattern 1: Standard <InvoiceProfile>...</InvoiceProfile>
      const invoiceProfileMatch1 = xmlText.match(/<InvoiceProfile[^>]*>(.*?)<\/InvoiceProfile>/i);
      if (invoiceProfileMatch1) {
        invoiceProfile = invoiceProfileMatch1[1].trim();
      }
      
      // Pattern 2: With namespace <tem:InvoiceProfile>...</tem:InvoiceProfile>
      if (!invoiceProfile) {
        const invoiceProfileMatch2 = xmlText.match(/<tem:InvoiceProfile[^>]*>(.*?)<\/tem:InvoiceProfile>/i);
        if (invoiceProfileMatch2) {
          invoiceProfile = invoiceProfileMatch2[1].trim();
        }
      }
      
      // Pattern 3: Any namespace <ns:InvoiceProfile>...</ns:InvoiceProfile>
      if (!invoiceProfile) {
        const invoiceProfileMatch3 = xmlText.match(/<[^:>]*:InvoiceProfile[^>]*>(.*?)<\/[^:>]*:InvoiceProfile>/i);
        if (invoiceProfileMatch3) {
          invoiceProfile = invoiceProfileMatch3[1].trim();
        }
      }

      // ========================================
      // YENİ: E-Arşiv özel alanlarını parse et
      // GIB rapor durumu ve mail durumu
      // ========================================
      const gibReportStateCodeMatch = xmlText.match(/<GIBReportStateCode[^>]*>(.*?)<\/GIBReportStateCode>/i);
      const gibReportStateCode = gibReportStateCodeMatch ? parseInt(gibReportStateCodeMatch[1].trim()) : null;

      const gibReportStateNameMatch = xmlText.match(/<GIBReportStateName[^>]*>(.*?)<\/GIBReportStateName>/i);
      const gibReportStateName = gibReportStateNameMatch ? gibReportStateNameMatch[1].trim() : '';

      const mailStateCodeMatch = xmlText.match(/<MailStateCode[^>]*>(.*?)<\/MailStateCode>/i);
      const mailStateCode = mailStateCodeMatch ? parseInt(mailStateCodeMatch[1].trim()) : null;

      const mailStateNameMatch = xmlText.match(/<MailStateName[^>]*>(.*?)<\/MailStateName>/i);
      const mailStateName = mailStateNameMatch ? mailStateNameMatch[1].trim() : '';

      // Look for InvoiceNumber in the response (Veriban may return it in status response)
      // NOTE: Sadece açıkça InvoiceNumber tag'i varsa parse ediyoruz
      // Description veya Message'dan parse etmeyi kaldırdık çünkü yanlış değerler bulabiliyor (örn: "DOKUMAN")
      let invoiceNumber = '';
      
      // Pattern 1: Standard <InvoiceNumber>...</InvoiceNumber>
      const invoiceNumberMatch1 = xmlText.match(/<InvoiceNumber[^>]*>(.*?)<\/InvoiceNumber>/i);
      if (invoiceNumberMatch1) {
        const parsedValue = invoiceNumberMatch1[1].trim();
        // Geçersiz değerleri filtrele (DOKUMAN, TASLAK, vb. gibi)
        if (parsedValue && 
            parsedValue.length > 0 && 
            parsedValue.length <= 50 && // Maksimum uzunluk kontrolü
            !['DOKUMAN', 'TASLAK', 'MESSAGE', 'DESCRIPTION', 'ERROR', 'STATE', 'ANSWER'].includes(parsedValue.toUpperCase())) {
          invoiceNumber = parsedValue;
        }
      }
      
      // Pattern 2: With namespace <tem:InvoiceNumber>...</tem:InvoiceNumber>
      if (!invoiceNumber) {
        const invoiceNumberMatch2 = xmlText.match(/<tem:InvoiceNumber[^>]*>(.*?)<\/tem:InvoiceNumber>/i);
        if (invoiceNumberMatch2) {
          const parsedValue = invoiceNumberMatch2[1].trim();
          if (parsedValue && 
              parsedValue.length > 0 && 
              parsedValue.length <= 50 &&
              !['DOKUMAN', 'TASLAK', 'MESSAGE', 'DESCRIPTION', 'ERROR', 'STATE', 'ANSWER'].includes(parsedValue.toUpperCase())) {
            invoiceNumber = parsedValue;
          }
        }
      }
      
      // Pattern 3: <ns:InvoiceNumber>...</ns:InvoiceNumber> (any namespace)
      if (!invoiceNumber) {
        const invoiceNumberMatch3 = xmlText.match(/<[^:>]*:InvoiceNumber[^>]*>(.*?)<\/[^:>]*:InvoiceNumber>/i);
        if (invoiceNumberMatch3) {
          const parsedValue = invoiceNumberMatch3[1].trim();
          if (parsedValue && 
              parsedValue.length > 0 && 
              parsedValue.length <= 50 &&
              !['DOKUMAN', 'TASLAK', 'MESSAGE', 'DESCRIPTION', 'ERROR', 'STATE', 'ANSWER'].includes(parsedValue.toUpperCase())) {
            invoiceNumber = parsedValue;
          }
        }
      }
      
      // NOT: StateDescription veya Message'dan parse etmeyi kaldırdık çünkü yanlış değerler bulabiliyor
      
      // Look for error messages in the response (for detailed error information)
      const errorMessageMatch = xmlText.match(/<ErrorMessage[^>]*>(.*?)<\/ErrorMessage>/i);
      const errorMessage = errorMessageMatch ? errorMessageMatch[1].trim() : '';
      
      const messageMatch = xmlText.match(/<Message[^>]*>(.*?)<\/Message>/i);
      const message = messageMatch ? messageMatch[1].trim() : '';

      // Try flexible invoice number parsing if not found
      if (!invoiceNumber) {
        const allInvoiceNumberMatches = xmlText.matchAll(/InvoiceNumber[^>]*>([^<]*)<\/InvoiceNumber>/gi);
        const matches = Array.from(allInvoiceNumberMatches);
        
        for (const match of matches) {
          const value = match[1].trim();
          if (value && 
              value.length >= 3 && 
              value.length <= 50 &&
              /\d/.test(value) &&
              !['DOKUMAN', 'TASLAK', 'MESSAGE', 'DESCRIPTION', 'ERROR', 'STATE', 'ANSWER', 'NULL', 'UNDEFINED'].includes(value.toUpperCase())) {
            invoiceNumber = value;
            break;
          }
        }
      }

      return {
        success: true,
        data: {
          stateCode,
          stateName,
          stateDescription,
          answerStateCode,
          answerTypeCode,
          invoiceNumber, // Add InvoiceNumber to response
          invoiceProfile, // YENİ: TEMELFATURA, TICARIFATURA, EARSIVFATURA
          // E-Arşiv özel alanları
          gibReportStateCode,
          gibReportStateName,
          mailStateCode,
          mailStateName,
          errorMessage, // Add ErrorMessage for detailed error info
          message, // Add Message for additional info
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'XML parse error',
      };
    }
  }

  /**
   * Parse purchase invoice status response XML (for Purchase Invoice - has more fields)
   */
  private static parsePurchaseInvoiceStatusResponse(xmlText: string): VeribanSoapResponse {
    try {
      const stateCodeMatch = xmlText.match(/<StateCode[^>]*>(.*?)<\/StateCode>/);
      const stateCode = stateCodeMatch ? parseInt(stateCodeMatch[1].trim()) : 0;

      const stateNameMatch = xmlText.match(/<StateName[^>]*>(.*?)<\/StateName>/);
      const stateName = stateNameMatch ? stateNameMatch[1].trim() : '';

      const stateDescriptionMatch = xmlText.match(/<StateDescription[^>]*>(.*?)<\/StateDescription>/);
      const stateDescription = stateDescriptionMatch ? stateDescriptionMatch[1].trim() : '';

      const answerStateCodeMatch = xmlText.match(/<AnswerStateCode[^>]*>(.*?)<\/AnswerStateCode>/);
      const answerStateCode = answerStateCodeMatch ? parseInt(answerStateCodeMatch[1].trim()) : 0;

      const answerStateNameMatch = xmlText.match(/<AnswerStateName[^>]*>(.*?)<\/AnswerStateName>/);
      const answerStateName = answerStateNameMatch ? answerStateNameMatch[1].trim() : '';

      const answerStateDescriptionMatch = xmlText.match(/<AnswerStateDescription[^>]*>(.*?)<\/AnswerStateDescription>/);
      const answerStateDescription = answerStateDescriptionMatch ? answerStateDescriptionMatch[1].trim() : '';

      const answerTypeCodeMatch = xmlText.match(/<AnswerTypeCode[^>]*>(.*?)<\/AnswerTypeCode>/);
      const answerTypeCode = answerTypeCodeMatch ? parseInt(answerTypeCodeMatch[1].trim()) : 0;

      const answerTypeNameMatch = xmlText.match(/<AnswerTypeName[^>]*>(.*?)<\/AnswerTypeName>/);
      const answerTypeName = answerTypeNameMatch ? answerTypeNameMatch[1].trim() : '';

      const answerTypeDescriptionMatch = xmlText.match(/<AnswerTypeDescription[^>]*>(.*?)<\/AnswerTypeDescription>/);
      const answerTypeDescription = answerTypeDescriptionMatch ? answerTypeDescriptionMatch[1].trim() : '';

      const envelopeIdentifierMatch = xmlText.match(/<EnvelopeIdentifier[^>]*>(.*?)<\/EnvelopeIdentifier>/);
      const envelopeIdentifier = envelopeIdentifierMatch ? envelopeIdentifierMatch[1].trim() : '';

      const envelopeGIBCodeMatch = xmlText.match(/<EnvelopeGIBCode[^>]*>(.*?)<\/EnvelopeGIBCode>/);
      const envelopeGIBCode = envelopeGIBCodeMatch ? parseInt(envelopeGIBCodeMatch[1].trim()) : 0;

      const envelopeGIBStateNameMatch = xmlText.match(/<EnvelopeGIBStateName[^>]*>(.*?)<\/EnvelopeGIBStateName>/);
      const envelopeGIBStateName = envelopeGIBStateNameMatch ? envelopeGIBStateNameMatch[1].trim() : '';

      const envelopeCreationTimeMatch = xmlText.match(/<EnvelopeCreationTime[^>]*>(.*?)<\/EnvelopeCreationTime>/);
      const envelopeCreationTime = envelopeCreationTimeMatch ? envelopeCreationTimeMatch[1].trim() : '';

      return {
        success: true,
        data: {
          stateCode,
          stateName,
          stateDescription,
          answerStateCode,
          answerStateName,
          answerStateDescription,
          answerTypeCode,
          answerTypeName,
          answerTypeDescription,
          envelopeIdentifier,
          envelopeGIBCode,
          envelopeGIBStateName,
          envelopeCreationTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'XML parse error',
      };
    }
  }

  /**
   * Parse invoice list response XML
   */
  private static parseInvoiceListResponse(xmlText: string): VeribanSoapResponse {
    try {
      const invoices: any[] = [];
      
      // Extract invoice UUIDs from response
      const uuidMatches = [...xmlText.matchAll(/<InvoiceUUID[^>]*>(.*?)<\/InvoiceUUID>/g)];
      
      for (const uuidMatch of uuidMatches) {
        const invoiceUUID = uuidMatch[1].trim();
        if (invoiceUUID) {
          invoices.push({
            invoiceUUID,
          });
        }
      }

      return {
        success: true,
        data: {
          invoices,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'XML parse error',
      };
    }
  }

  /**
   * Parse UUID list response XML (List<string>)
   * Doküman: Bölüm 19 - Gelen Fatura UUID Listesi
   */
  private static parseUUIDListResponse(xmlText: string): VeribanSoapResponse {
    try {
      // Check for SOAP Fault first - this is critical!
      const faultCodeMatch = xmlText.match(/<FaultCode[^>]*>(.*?)<\/FaultCode>/i);
      const faultDescMatch = xmlText.match(/<FaultDescription[^>]*>(.*?)<\/FaultDescription>/i);
      const faultStringMatch = xmlText.match(/<faultstring[^>]*>(.*?)<\/faultstring>/i);
      const soapFaultMatch = xmlText.match(/<soap:Fault[^>]*>[\s\S]*?<soap:faultstring[^>]*>(.*?)<\/soap:faultstring>/i);
      const soapFaultCodeMatch = xmlText.match(/<soap:Fault[^>]*>[\s\S]*?<soap:faultcode[^>]*>(.*?)<\/soap:faultcode>/i);
      
      // Also check for PARAMETER ERROR pattern in response
      const parameterErrorMatch = xmlText.match(/PARAMETER\s*ERROR[^<]*(=>[^<]*)?/i);
      
      if (faultCodeMatch || faultDescMatch || faultStringMatch || soapFaultMatch || soapFaultCodeMatch || parameterErrorMatch) {
        const errorMsg = faultDescMatch?.[1] || faultStringMatch?.[1] || soapFaultMatch?.[1] || parameterErrorMatch?.[0] || faultCodeMatch?.[1] || soapFaultCodeMatch?.[1] || 'Bilinmeyen SOAP hatası';
        console.error('❌ SOAP Fault detected in UUID list response:', errorMsg);
        return {
          success: false,
          error: errorMsg.trim(),
        };
      }

      const uuids: string[] = [];
      
      // UUID format regex: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
      const uuidFormatRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      // Extract UUIDs from response - can be in <string> tags or other formats
      const stringMatches = [...xmlText.matchAll(/<string[^>]*>(.*?)<\/string>/gi)];
      
      // Process string tags and validate UUID format
      for (const match of stringMatches) {
        const uuid = match[1].trim();
        // Validate UUID format before adding
        if (uuid && uuidFormatRegex.test(uuid)) {
          uuids.push(uuid);
        } else if (uuid) {
          console.warn(`⚠️ Geçersiz UUID formatı atlanıyor: "${uuid}"`);
        }
      }

      return {
        success: true,
        data: uuids,
      };
    } catch (error) {
      console.error('❌ parseUUIDListResponse error:', error);
      return {
        success: false,
        error: 'XML parse error',
      };
    }
  }

  /**
   * Parse download response XML
   */
  private static parseDownloadResponse(xmlText: string): VeribanSoapResponse {
    try {
      // Check for SOAP Fault first
      const faultCodeMatch = xmlText.match(/<FaultCode[^>]*>(.*?)<\/FaultCode>/i);
      const faultDescMatch = xmlText.match(/<FaultDescription[^>]*>(.*?)<\/FaultDescription>/i);
      const faultStringMatch = xmlText.match(/<faultstring[^>]*>(.*?)<\/faultstring>/i);
      const soapFaultMatch = xmlText.match(/<soap:Fault[^>]*>[\s\S]*?<soap:faultstring[^>]*>(.*?)<\/soap:faultstring>/i);
      const soapFaultCodeMatch = xmlText.match(/<soap:Fault[^>]*>[\s\S]*?<soap:faultcode[^>]*>(.*?)<\/soap:faultcode>/i);
      
      if (faultCodeMatch || faultDescMatch || faultStringMatch || soapFaultMatch || soapFaultCodeMatch) {
        const errorMsg = faultDescMatch?.[1] || faultStringMatch?.[1] || soapFaultMatch?.[1] || faultCodeMatch?.[1] || soapFaultCodeMatch?.[1] || 'Bilinmeyen SOAP hatası';
        console.error('❌ SOAP Fault detected in download response:', errorMsg);
        return {
          success: false,
          error: errorMsg.trim(),
        };
      }

      // Extract binary data (base64 ZIP) - can be in BinaryData or FileData field
      let binaryDataMatch = xmlText.match(/<BinaryData[^>]*>(.*?)<\/BinaryData>/s);
      let binaryData = binaryDataMatch ? binaryDataMatch[1].trim() : '';
      
      // Try FileData if BinaryData is not found (according to documentation)
      if (!binaryData) {
        const fileDataMatch = xmlText.match(/<FileData[^>]*>(.*?)<\/FileData>/s);
        binaryData = fileDataMatch ? fileDataMatch[1].trim() : '';
      }

      // Extract file name - can be in FileName or DownloadFile/FileName
      let fileNameMatch = xmlText.match(/<FileName[^>]*>(.*?)<\/FileName>/);
      let fileName = fileNameMatch ? fileNameMatch[1].trim() : '';
      
      // Try DownloadFile/FileName structure
      if (!fileName) {
        const downloadFileMatch = xmlText.match(/<DownloadFile[^>]*>[\s\S]*?<FileName[^>]*>(.*?)<\/FileName>/i);
        fileName = downloadFileMatch ? downloadFileMatch[1].trim() : '';
      }

      // Check for DownloadFileReady and DownloadDescription
      const downloadFileReadyMatch = xmlText.match(/<DownloadFileReady[^>]*>(.*?)<\/DownloadFileReady>/i);
      const downloadFileReady = downloadFileReadyMatch ? downloadFileReadyMatch[1].trim().toLowerCase() === 'true' : true;

      const downloadDescriptionMatch = xmlText.match(/<DownloadDescription[^>]*>(.*?)<\/DownloadDescription>/i);
      const downloadDescription = downloadDescriptionMatch ? downloadDescriptionMatch[1].trim() : '';

      // If binaryData is empty, check if there's an error message
      if (!binaryData) {
        const errorMsg = downloadDescription || 'Binary data bulunamadı';
        console.error('❌ Download response has no binary data:', errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }

      return {
        success: true,
        data: {
          binaryData,
          fileName,
          downloadFileReady,
          downloadDescription,
        },
      };
    } catch (error) {
      console.error('❌ parseDownloadResponse error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'XML parse error',
      };
    }
  }

  /**
   * Parse customer data response XML
   * Doküman: Bölüm 17 - Müşteri Etiket Bilgisi Sorgulama
   */
  private static parseCustomerDataResponse(xmlText: string): VeribanSoapResponse {
    try {
      // Parse List<CustomerData> - multiple customers possible
      const customers: any[] = [];
      
      // Extract all customer data blocks
      const customerBlocks = xmlText.match(/<CustomerData[^>]*>[\s\S]*?<\/CustomerData>/g) || 
                            xmlText.match(/<[^>]*CustomerData[^>]*>[\s\S]*?<\/[^>]*CustomerData[^>]*>/g) ||
                            [xmlText]; // If no blocks, parse entire response

      for (const block of customerBlocks) {
        const identifierNumberMatch = block.match(/<IdentifierNumber[^>]*>(.*?)<\/IdentifierNumber>/i);
        const identifierNumber = identifierNumberMatch ? identifierNumberMatch[1].trim() : '';

        const aliasMatch = block.match(/<Alias[^>]*>(.*?)<\/Alias>/i);
        const alias = aliasMatch ? aliasMatch[1].trim() : '';

        const titleMatch = block.match(/<Title[^>]*>(.*?)<\/Title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '';

        const typeMatch = block.match(/<Type[^>]*>(.*?)<\/Type>/i);
        const type = typeMatch ? typeMatch[1].trim() : '';

        const registerTimeMatch = block.match(/<RegisterTime[^>]*>(.*?)<\/RegisterTime>/i);
        const registerTime = registerTimeMatch ? registerTimeMatch[1].trim() : '';

        const aliasCreationTimeMatch = block.match(/<AliasCreationTime[^>]*>(.*?)<\/AliasCreationTime>/i);
        const aliasCreationTime = aliasCreationTimeMatch ? aliasCreationTimeMatch[1].trim() : '';

        const documentTypeMatch = block.match(/<DocumentType[^>]*>(.*?)<\/DocumentType>/i);
        const documentType = documentTypeMatch ? documentTypeMatch[1].trim() : '';

        // Also check for alternative field names (Identifier instead of IdentifierNumber)
        const identifierMatch = block.match(/<Identifier[^>]*>(.*?)<\/Identifier>/i);
        const identifier = identifierMatch ? identifierMatch[1].trim() : identifierNumber;

        if (identifier || alias || title) {
          customers.push({
            identifierNumber: identifierNumber || identifier,
            alias,
            title,
            type,
            registerTime,
            aliasCreationTime,
            documentType,
            isEinvoiceMukellef: !!alias,
          });
        }
      }

      // If no customers found, try simple parsing (backward compatibility)
      if (customers.length === 0) {
        const titleMatch = xmlText.match(/<Title[^>]*>(.*?)<\/Title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '';

        const identifierMatch = xmlText.match(/<Identifier[^>]*>(.*?)<\/Identifier>/i);
        const identifier = identifierMatch ? identifierMatch[1].trim() : '';

        const aliasMatch = xmlText.match(/<Alias[^>]*>(.*?)<\/Alias>/i);
        const alias = aliasMatch ? aliasMatch[1].trim() : '';

        if (identifier || alias || title) {
          customers.push({
            identifierNumber: identifier,
            alias,
            title,
            type: '',
            registerTime: '',
            aliasCreationTime: '',
            documentType: '',
            isEinvoiceMukellef: !!alias,
          });
        }
      }

      return {
        success: customers.length > 0,
        data: customers.length === 1 ? customers[0] : customers,
      };
    } catch (error) {
      return {
        success: false,
        error: 'XML parse error',
      };
    }
  }

  /**
   * Parse standard SOAP response
   */
  private static parseStandardResponse(xmlText: string): VeribanSoapResponse {
    try {
      // Check for success indicators
      const successMatch = xmlText.match(/<OperationCompleted[^>]*>(.*?)<\/OperationCompleted>/);
      const success = successMatch ? successMatch[1].trim().toLowerCase() === 'true' : false;

      return {
        success,
      };
    } catch (error) {
      return {
        success: false,
        error: 'XML parse error',
      };
    }
  }

  /**
   * Escape XML special characters
   */
  private static escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Calculate MD5 hash using SparkMD5 (same as e-Logo helper)
   */
  static async calculateMD5Async(data: Uint8Array): Promise<string> {
    try {
      const SparkMD5 = (await import('https://esm.sh/spark-md5@3.0.2')).default;
      
      const arrayBuffer = data.buffer.slice(
        data.byteOffset,
        data.byteOffset + data.byteLength
      );
      
      const md5Hash = SparkMD5.ArrayBuffer.hash(arrayBuffer as ArrayBuffer);
      
      return md5Hash.toUpperCase();
    } catch (error) {
      console.error('MD5 calculation error:', error);
      throw new Error('MD5 calculation failed');
    }
  }

  /**
   * Encode to base64
   */
  static encodeBase64(data: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < data.byteLength; i++) {
      binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
  }

  /**
   * Decode base64 string
   */
  static decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}

/**
 * Get valid session code for Veriban
 * Checks if existing session is still valid, otherwise creates a new one
 *
 * @param supabase - Supabase client instance
 * @param veribanAuth - Veriban auth record from database
 * @returns Valid session code
 */
export async function getValidSessionCode(
  supabase: any,
  veribanAuth: any
): Promise<{ success: boolean; sessionCode?: string; error?: string }> {
  try {
    const now = new Date();
    const expiresAt = veribanAuth.session_expires_at
      ? new Date(veribanAuth.session_expires_at)
      : null;

    // Check if we have a valid session
    if (veribanAuth.session_code && expiresAt && expiresAt > now) {
      const remainingMinutes = Math.floor((expiresAt.getTime() - now.getTime()) / 1000 / 60);
      console.log(`✅ Using existing session code (expires in ${remainingMinutes} minutes)`);
      return {
        success: true,
        sessionCode: veribanAuth.session_code
      };
    }

    // Session expired or doesn't exist - create new one
    console.log('🔄 Session expired or not found, creating new session...');

    const loginResult = await VeribanSoapClient.login(
      {
        username: veribanAuth.username,
        password: veribanAuth.password,
      },
      veribanAuth.webservice_url
    );

    if (!loginResult.success || !loginResult.sessionCode) {
      return {
        success: false,
        error: loginResult.error || 'Veriban giriş başarısız'
      };
    }

    // Calculate new expiration time (6 hours from now)
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setHours(sessionExpiresAt.getHours() + 6);

    // Update session in database
    const { error: updateError } = await supabase
      .from('veriban_auth')
      .update({
        session_code: loginResult.sessionCode,
        session_expires_at: sessionExpiresAt.toISOString(),
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('company_id', veribanAuth.company_id);

    if (updateError) {
      console.warn('⚠️ Session güncellenemedi:', updateError.message);
    }

    return {
      success: true,
      sessionCode: loginResult.sessionCode
    };

  } catch (error: any) {
    console.error('❌ getValidSessionCode error:', error);
    return {
      success: false,
      error: error.message || 'Session code alınamadı'
    };
  }
}

