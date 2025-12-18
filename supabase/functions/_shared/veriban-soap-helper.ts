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
      console.log('🔄 SOAP Login Request URL:', url);
      console.log('🔄 SOAP Login Request Body:', soapRequest);
      
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'Login',
        },
        body: soapRequest,
      });
      
      console.log('📥 SOAP Response Status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlText = await response.text();
      console.log('📥 SOAP Response Body:', xmlText);
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

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/"
                  xmlns:ver="http://schemas.datacontract.org/2004/07/Veriban.Service.Model">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:TransferSalesInvoiceFile>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:EInvoiceTransferFile>
        <ver:FileNameWithExtension>${this.escapeXml(fileName)}</ver:FileNameWithExtension>
        <ver:FileDataType>${this.escapeXml(fileDataType)}</ver:FileDataType>
        <ver:BinaryData>${binaryData}</ver:BinaryData>
        <ver:BinaryDataHash>${this.escapeXml(binaryDataHash)}</ver:BinaryDataHash>
        <ver:CustomerAlias>${this.escapeXml(customerAlias)}</ver:CustomerAlias>
        <ver:IsDirectSend>${isDirectSend}</ver:IsDirectSend>
        ${integrationCode ? `<ver:IntegrationCode>${this.escapeXml(integrationCode)}</ver:IntegrationCode>` : ''}
      </tem:EInvoiceTransferFile>
    </tem:TransferSalesInvoiceFile>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'TransferSalesInvoiceFile',
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
      startDate = '',
      endDate = '',
      customerRegisterNumber = '',
    } = params;

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetSalesInvoiceUUIDList>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      ${startDate ? `<tem:startDate>${this.escapeXml(startDate)}</tem:startDate>` : '<tem:startDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>'}
      ${endDate ? `<tem:endDate>${this.escapeXml(endDate)}</tem:endDate>` : '<tem:endDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>'}
      ${customerRegisterNumber ? `<tem:customerRegisterNumber>${this.escapeXml(customerRegisterNumber)}</tem:customerRegisterNumber>` : '<tem:customerRegisterNumber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>'}
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetSalesInvoiceUUIDList failed',
      };
    }
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
      console.log('🔍 Parsing login response...');
      
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

      console.log('🔍 Session code found:', sessionCode ? 'Yes' : 'No');
      console.log('🔍 Session code length:', sessionCode.length);

      if (!sessionCode || sessionCode.length === 0) {
        console.error('❌ No session code in response');
        console.error('❌ Response XML:', xmlText.substring(0, 500));
        return {
          success: false,
          error: 'Giriş başarısız - session code alınamadı. Lütfen kullanıcı adı ve şifrenizi kontrol edin.',
        };
      }

      console.log('✅ Login successful, session code:', sessionCode.substring(0, 10) + '...');
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
      const operationCompletedMatch = xmlText.match(/<OperationCompleted[^>]*>(.*?)<\/OperationCompleted>/);
      const operationCompleted = operationCompletedMatch ? operationCompletedMatch[1].trim().toLowerCase() === 'true' : false;

      const transferFileUniqueIdMatch = xmlText.match(/<TransferFileUniqueId[^>]*>(.*?)<\/TransferFileUniqueId>/);
      const transferFileUniqueId = transferFileUniqueIdMatch ? transferFileUniqueIdMatch[1].trim() : '';

      return {
        success: operationCompleted,
        data: {
          operationCompleted,
          transferFileUniqueId,
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

      return {
        success: true,
        data: {
          stateCode,
          stateName,
          stateDescription,
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

      return {
        success: true,
        data: {
          stateCode,
          stateName,
          stateDescription,
          answerStateCode,
          answerTypeCode,
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
      const uuids: string[] = [];
      
      // Extract UUIDs from response - can be in <string> tags or other formats
      const stringMatches = [...xmlText.matchAll(/<string[^>]*>(.*?)<\/string>/gi)];
      const uuidMatches = [...xmlText.matchAll(/<[^>]*UUID[^>]*>(.*?)<\/[^>]*UUID[^>]*>/gi)];
      
      // Try string format first (common for List<string>)
      for (const match of stringMatches) {
        const uuid = match[1].trim();
        if (uuid && uuid.length > 10) { // UUID should be longer than 10 chars
          uuids.push(uuid);
        }
      }
      
      // If no string matches, try UUID format
      if (uuids.length === 0) {
        for (const match of uuidMatches) {
          const uuid = match[1].trim();
          if (uuid && uuid.length > 10) {
            uuids.push(uuid);
          }
        }
      }

      return {
        success: true,
        data: uuids,
      };
    } catch (error) {
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

    console.log('💾 Updating session code in database...');
    console.log('⏰ New session expires at:', sessionExpiresAt.toISOString());

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
      console.error('❌ Failed to update session in database:', updateError);
      // Still return the session code even if database update fails
      // The session is valid, just not persisted
    } else {
      console.log('✅ Session code updated in database');
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

