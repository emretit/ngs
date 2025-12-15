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
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IIntegrationService/Login',
        },
        body: soapRequest,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlText = await response.text();
      return this.parseLoginResponse(xmlText);
    } catch (error) {
      console.error('Veriban login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Logout from Veriban
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
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IIntegrationService/Logout',
        },
        body: soapRequest,
      });

      return {
        success: response.ok,
      };
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
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IIntegrationService/TransferSalesInvoiceFile',
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
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IIntegrationService/GetTransferSalesInvoiceFileStatus',
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
   * Get Sales Invoice Status with Invoice UUID
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
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IIntegrationService/GetSalesInvoiceStatusWithInvoiceUUID',
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
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IIntegrationService/GetSalesInvoiceList',
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
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IIntegrationService/GetPurchaseInvoiceList',
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
   * Download Sales Invoice
   */
  static async downloadSalesInvoice(
    sessionCode: string,
    invoiceUUID: string,
    url: string
  ): Promise<VeribanSoapResponse> {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetSalesInvoiceWithInvoiceUUID>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:invoiceUUID>${this.escapeXml(invoiceUUID)}</tem:invoiceUUID>
    </tem:GetSalesInvoiceWithInvoiceUUID>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IIntegrationService/GetSalesInvoiceWithInvoiceUUID',
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
   * Download Purchase Invoice
   */
  static async downloadPurchaseInvoice(
    sessionCode: string,
    invoiceUUID: string,
    url: string
  ): Promise<VeribanSoapResponse> {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetPurchaseInvoiceWithInvoiceUUID>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:invoiceUUID>${this.escapeXml(invoiceUUID)}</tem:invoiceUUID>
    </tem:GetPurchaseInvoiceWithInvoiceUUID>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IIntegrationService/GetPurchaseInvoiceWithInvoiceUUID',
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
   * Check Taxpayer (Mükellef Kontrol)
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
    <tem:GetCustomerData>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:vknTckn>${this.escapeXml(taxNumber)}</tem:vknTckn>
    </tem:GetCustomerData>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IIntegrationService/GetCustomerData',
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
   * Set Purchase Invoice Answer
   */
  static async setPurchaseInvoiceAnswer(
    sessionCode: string,
    params: {
      invoiceUUID: string;
      answerType: 'KABUL' | 'RED';
      description?: string;
    },
    url: string
  ): Promise<VeribanSoapResponse> {
    const { invoiceUUID, answerType, description = '' } = params;

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:SetPurchaseInvoiceAnswerWithInvoiceUUID>
      <tem:sessionCode>${this.escapeXml(sessionCode)}</tem:sessionCode>
      <tem:invoiceUUID>${this.escapeXml(invoiceUUID)}</tem:invoiceUUID>
      <tem:answerType>${this.escapeXml(answerType)}</tem:answerType>
      <tem:description>${this.escapeXml(description)}</tem:description>
    </tem:SetPurchaseInvoiceAnswerWithInvoiceUUID>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IIntegrationService/SetPurchaseInvoiceAnswerWithInvoiceUUID',
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
   */
  private static parseLoginResponse(xmlText: string): VeribanLoginResponse {
    try {
      // Extract LoginResult (sessionCode)
      const loginResultMatch = xmlText.match(/<LoginResult[^>]*>(.*?)<\/LoginResult>/);
      const sessionCode = loginResultMatch ? loginResultMatch[1].trim() : '';

      if (!sessionCode) {
        // Check for fault
        const faultStringMatch = xmlText.match(/<faultstring>(.*?)<\/faultstring>/);
        const errorMsg = faultStringMatch ? faultStringMatch[1] : 'Giriş başarısız';

        return {
          success: false,
          error: errorMsg,
        };
      }

      return {
        success: true,
        sessionCode,
      };
    } catch (error) {
      return {
        success: false,
        error: 'XML parse error',
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
   * Parse invoice status response XML
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
   * Parse download response XML
   */
  private static parseDownloadResponse(xmlText: string): VeribanSoapResponse {
    try {
      // Extract binary data (base64 ZIP)
      const binaryDataMatch = xmlText.match(/<BinaryData[^>]*>(.*?)<\/BinaryData>/s);
      const binaryData = binaryDataMatch ? binaryDataMatch[1].trim() : '';

      const fileNameMatch = xmlText.match(/<FileName[^>]*>(.*?)<\/FileName>/);
      const fileName = fileNameMatch ? fileNameMatch[1].trim() : '';

      return {
        success: !!binaryData,
        data: {
          binaryData,
          fileName,
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
   * Parse customer data response XML
   */
  private static parseCustomerDataResponse(xmlText: string): VeribanSoapResponse {
    try {
      const titleMatch = xmlText.match(/<Title[^>]*>(.*?)<\/Title>/);
      const title = titleMatch ? titleMatch[1].trim() : '';

      const identifierMatch = xmlText.match(/<Identifier[^>]*>(.*?)<\/Identifier>/);
      const identifier = identifierMatch ? identifierMatch[1].trim() : '';

      const aliasMatch = xmlText.match(/<Alias[^>]*>(.*?)<\/Alias>/);
      const alias = aliasMatch ? aliasMatch[1].trim() : '';

      return {
        success: true,
        data: {
          title,
          identifier,
          alias,
          isEinvoiceMukellef: !!alias,
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

