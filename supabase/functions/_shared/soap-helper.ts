/**
 * SOAP Helper Utility for e-Logo Webservice Integration
 * 
 * This module provides utilities for creating and parsing SOAP requests/responses
 * for e-Logo e-invoice integration.
 */

export interface ElogoLoginRequest {
  username: string;
  password: string;
  appStr?: string;
  source?: number;
  version?: string;
}

export interface ElogoLoginResponse {
  success: boolean;
  sessionID?: string;
  error?: string;
}

export interface ElogoSoapResponse {
  success: boolean;
  data?: any;
  error?: string;
  resultCode?: number;
  resultMsg?: string;
}

/**
 * SOAP Client for e-Logo Webservice
 */
export class SoapClient {
  /**
   * Login to e-Logo and get session ID
   */
  static async login(
    params: ElogoLoginRequest,
    url: string
  ): Promise<ElogoLoginResponse> {
    const { username, password, appStr = '', source = 0, version = '' } = params;

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/" 
                  xmlns:efat="http://schemas.datacontract.org/2004/07/eFaturaWebService">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:Login>
      <tem:login>
        <efat:appStr>${this.escapeXml(appStr)}</efat:appStr>
        <efat:passWord>${this.escapeXml(password)}</efat:passWord>
        <efat:source>${source}</efat:source>
        <efat:userName>${this.escapeXml(username)}</efat:userName>
        <efat:version>${this.escapeXml(version)}</efat:version>
      </tem:login>
    </tem:Login>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IPostBoxService/Login',
        },
        body: soapRequest,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlText = await response.text();
      return this.parseLoginResponse(xmlText);
    } catch (error) {
      console.error('e-Logo login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Logout from e-Logo
   */
  static async logout(sessionID: string, url: string): Promise<ElogoSoapResponse> {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:Logout>
      <tem:sessionID>${this.escapeXml(sessionID)}</tem:sessionID>
    </tem:Logout>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IPostBoxService/Logout',
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
   * Get Document - Retrieve incoming invoices
   */
  static async getDocument(
    sessionID: string,
    documentType: string,
    url: string
  ): Promise<ElogoSoapResponse> {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/" 
                  xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetDocument>
      <tem:sessionID>${this.escapeXml(sessionID)}</tem:sessionID>
      <tem:paramList>
        <arr:string>DOCUMENTTYPE=${this.escapeXml(documentType)}</arr:string>
      </tem:paramList>
    </tem:GetDocument>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IPostBoxService/GetDocument',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseGetDocumentResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetDocument failed',
      };
    }
  }

  /**
   * Mark document as received
   */
  static async getDocumentDone(
    sessionID: string,
    uuid: string,
    documentType: string,
    url: string
  ): Promise<ElogoSoapResponse> {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/" 
                  xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetDocumentDone>
      <tem:sessionID>${this.escapeXml(sessionID)}</tem:sessionID>
      <tem:uuid>${this.escapeXml(uuid)}</tem:uuid>
      <tem:paramList>
        <arr:string>DOCUMENTTYPE=${this.escapeXml(documentType)}</arr:string>
      </tem:paramList>
    </tem:GetDocumentDone>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IPostBoxService/GetDocumentDone',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseStandardResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetDocumentDone failed',
      };
    }
  }

  /**
   * Check GIB user (mükellef sorgulama)
   */
  static async checkGibUser(
    sessionID: string,
    vknTcknList: string[],
    url: string
  ): Promise<ElogoSoapResponse> {
    const vknListXml = vknTcknList
      .map((vkn) => `<arr:string>${this.escapeXml(vkn)}</arr:string>`)
      .join('\n');

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/" 
                  xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:CheckGibUser>
      <tem:sessionID>${this.escapeXml(sessionID)}</tem:sessionID>
      <tem:vknTcknList>
        ${vknListXml}
      </tem:vknTcknList>
    </tem:CheckGibUser>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IPostBoxService/CheckGibUser',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseCheckGibUserResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'CheckGibUser failed',
      };
    }
  }

  /**
   * Send Document - Send invoice or other document
   */
  static async sendDocument(
    sessionID: string,
    paramList: string[],
    document: {
      binaryData: string; // base64 encoded zip file
      fileName: string;
      hash: string; // MD5 hash
      currentDate?: string;
    },
    url: string
  ): Promise<ElogoSoapResponse> {
    const paramListXml = paramList
      .map((param) => `<arr:string>${this.escapeXml(param)}</arr:string>`)
      .join('\n');

    const currentDate = document.currentDate || new Date().toISOString().split('T')[0];

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/" 
                  xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays"
                  xmlns:efat="http://schemas.datacontract.org/2004/07/eFaturaWebService">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:SendDocument>
      <tem:sessionID>${this.escapeXml(sessionID)}</tem:sessionID>
      <tem:paramList>
        ${paramListXml}
      </tem:paramList>
      <tem:document>
        <efat:binaryData>
          <efat:Value>${document.binaryData}</efat:Value>
          <efat:contentType>base64</efat:contentType>
        </efat:binaryData>
        <efat:currentDate>${currentDate}</efat:currentDate>
        <efat:fileName>${this.escapeXml(document.fileName)}</efat:fileName>
        <efat:hash>${this.escapeXml(document.hash)}</efat:hash>
      </tem:document>
    </tem:SendDocument>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IPostBoxService/SendDocument',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseSendDocumentResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SendDocument failed',
      };
    }
  }

  /**
   * Get Document Status - Query document status
   */
  static async getDocumentStatus(
    sessionID: string,
    uuid: string,
    paramList: string[],
    url: string
  ): Promise<ElogoSoapResponse> {
    const paramListXml = paramList
      .map((param) => `<arr:string>${this.escapeXml(param)}</arr:string>`)
      .join('\n');

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/" 
                  xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetDocumentStatus>
      <tem:sessionID>${this.escapeXml(sessionID)}</tem:sessionID>
      <tem:uuid>${this.escapeXml(uuid)}</tem:uuid>
      <tem:paramList>
        ${paramListXml}
      </tem:paramList>
    </tem:GetDocumentStatus>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IPostBoxService/GetDocumentStatus',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseGetDocumentStatusResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetDocumentStatus failed',
      };
    }
  }

  /**
   * Get Document Data - Get document in requested format
   */
  static async getDocumentData(
    sessionID: string,
    uuid: string,
    paramList: string[],
    url: string
  ): Promise<ElogoSoapResponse> {
    const paramListXml = paramList
      .map((param) => `<arr:string>${this.escapeXml(param)}</arr:string>`)
      .join('\n');

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/" 
                  xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetDocumentData>
      <tem:sessionID>${this.escapeXml(sessionID)}</tem:sessionID>
      <tem:uuid>${this.escapeXml(uuid)}</tem:uuid>
      <tem:paramList>
        ${paramListXml}
      </tem:paramList>
    </tem:GetDocumentData>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IPostBoxService/GetDocumentData',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseGetDocumentDataResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetDocumentData failed',
      };
    }
  }

  /**
   * Get Document List - Get document list for date range
   */
  static async getDocumentList(
    sessionID: string,
    paramList: string[],
    url: string
  ): Promise<ElogoSoapResponse> {
    const paramListXml = paramList
      .map((param) => `<arr:string>${this.escapeXml(param)}</arr:string>`)
      .join('\n');

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/" 
                  xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetDocumentList>
      <tem:sessionID>${this.escapeXml(sessionID)}</tem:sessionID>
      <tem:paramList>
        ${paramListXml}
      </tem:paramList>
    </tem:GetDocumentList>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      console.log('🔄 GetDocumentList SOAP Request URL:', url);
      console.log('🔄 GetDocumentList SOAP Request Body:', soapRequest);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IPostBoxService/GetDocumentList',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      console.log('📄 GetDocumentList SOAP Response Status:', response.status);
      console.log('📄 GetDocumentList SOAP Response (first 3000 chars):', xmlText.substring(0, 3000));
      
      return this.parseGetDocumentListResponse(xmlText);
    } catch (error) {
      console.error('❌ GetDocumentList fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetDocumentList failed',
      };
    }
  }

  /**
   * Get Document Status Batch - Batch status query (max 20 UUIDs)
   */
  static async getDocumentStatusBatch(
    sessionID: string,
    paramList: string[],
    uuidList: string[],
    url: string
  ): Promise<ElogoSoapResponse> {
    const paramListXml = paramList
      .map((param) => `<arr:string>${this.escapeXml(param)}</arr:string>`)
      .join('\n');

    const uuidListXml = uuidList
      .map((uuid) => `<arr:string>${this.escapeXml(uuid)}</arr:string>`)
      .join('\n');

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/" 
                  xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GetDocumentStatusBatch>
      <tem:sessionID>${this.escapeXml(sessionID)}</tem:sessionID>
      <tem:paramList>
        ${paramListXml}
      </tem:paramList>
      <tem:uuidList>
        ${uuidListXml}
      </tem:uuidList>
    </tem:GetDocumentStatusBatch>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IPostBoxService/GetDocumentStatusBatch',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseGetDocumentStatusBatchResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GetDocumentStatusBatch failed',
      };
    }
  }

  /**
   * Get 2FA Code - Get 2FA code for e-Arşiv Type 2 invoices
   */
  static async get2FACode(
    sessionID: string,
    url: string
  ): Promise<ElogoSoapResponse> {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:Get2FACode>
      <tem:sessionID>${this.escapeXml(sessionID)}</tem:sessionID>
    </tem:Get2FACode>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IPostBoxService/Get2FACode',
        },
        body: soapRequest,
      });

      const xmlText = await response.text();
      return this.parseGet2FACodeResponse(xmlText);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Get2FACode failed',
      };
    }
  }

  /**
   * Parse login response XML
   */
  private static parseLoginResponse(xmlText: string): ElogoLoginResponse {
    try {
      // Extract LoginResult
      const loginResultMatch = xmlText.match(/<LoginResult>(.*?)<\/LoginResult>/);
      const loginResult = loginResultMatch ? loginResultMatch[1] === 'true' : false;

      if (!loginResult) {
        // Check for fault
        const faultStringMatch = xmlText.match(/<faultstring>(.*?)<\/faultstring>/);
        const errorMsg = faultStringMatch ? faultStringMatch[1] : 'Giriş başarısız';

        return {
          success: false,
          error: errorMsg,
        };
      }

      // Extract sessionID
      const sessionIDMatch = xmlText.match(/<sessionID>(.*?)<\/sessionID>/);
      const sessionID = sessionIDMatch ? sessionIDMatch[1] : '';

      return {
        success: true,
        sessionID,
      };
    } catch (error) {
      return {
        success: false,
        error: 'XML parse error',
      };
    }
  }

  /**
   * Parse GetDocument response XML
   */
  private static parseGetDocumentResponse(xmlText: string): ElogoSoapResponse {
    try {
      // Extract resultCode
      const resultCodeMatch = xmlText.match(/<a:resultCode>(.*?)<\/a:resultCode>/);
      const resultCode = resultCodeMatch ? parseInt(resultCodeMatch[1]) : 0;

      // Extract resultMsg
      const resultMsgMatch = xmlText.match(/<a:resultMsg>(.*?)<\/a:resultMsg>/);
      const resultMsg = resultMsgMatch ? resultMsgMatch[1] : '';

      if (resultCode !== 1) {
        return {
          success: false,
          error: resultMsg || 'GetDocument failed',
          resultCode,
          resultMsg,
        };
      }

      // Extract document data
      const binaryDataMatch = xmlText.match(/<a:Value>(.*?)<\/a:Value>/s);
      const binaryData = binaryDataMatch ? binaryDataMatch[1].trim() : '';

      const fileNameMatch = xmlText.match(/<a:fileName>(.*?)<\/a:fileName>/);
      const fileName = fileNameMatch ? fileNameMatch[1] : '';

      const envelopeIdMatch = xmlText.match(/<a:envelopeId>(.*?)<\/a:envelopeId>/);
      const envelopeId = envelopeIdMatch ? envelopeIdMatch[1] : '';

      const currentDateMatch = xmlText.match(/<a:currentDate>(.*?)<\/a:currentDate>/);
      const currentDate = currentDateMatch ? currentDateMatch[1] : '';

      return {
        success: true,
        resultCode,
        resultMsg,
        data: {
          binaryData,
          fileName,
          envelopeId,
          currentDate,
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
  private static parseStandardResponse(xmlText: string): ElogoSoapResponse {
    try {
      const resultCodeMatch = xmlText.match(/<a:resultCode>(.*?)<\/a:resultCode>/);
      const resultCode = resultCodeMatch ? parseInt(resultCodeMatch[1]) : 0;

      const resultMsgMatch = xmlText.match(/<a:resultMsg>(.*?)<\/a:resultMsg>/);
      const resultMsg = resultMsgMatch ? resultMsgMatch[1] : '';

      return {
        success: resultCode === 1,
        resultCode,
        resultMsg,
      };
    } catch (error) {
      return {
        success: false,
        error: 'XML parse error',
      };
    }
  }

  /**
   * Parse CheckGibUser response
   */
  private static parseCheckGibUserResponse(xmlText: string): ElogoSoapResponse {
    try {
      const resultCodeMatch = xmlText.match(/<a:resultCode>(.*?)<\/a:resultCode>/);
      const resultCode = resultCodeMatch ? parseInt(resultCodeMatch[1]) : -1;

      const resultMsgMatch = xmlText.match(/<a:resultMsg>(.*?)<\/a:resultMsg>/);
      const resultMsg = resultMsgMatch ? resultMsgMatch[1] : '';

      if (resultCode !== 1) {
        return {
          success: false,
          error: resultMsg,
          resultCode,
          resultMsg,
        };
      }

      // Extract GibUserType data
      const gibUserTypeMatch = xmlText.match(/<a:GibUserType>(.*?)<\/a:GibUserType>/s);
      const gibUserData = gibUserTypeMatch ? gibUserTypeMatch[1] : '';

      // Extract Invoice aliases
      const invoicePkAliasMatch = gibUserData.match(
        /<a:InvoicePkList>.*?<a:Alias>(.*?)<\/a:Alias>.*?<\/a:InvoicePkList>/s
      );
      const invoicePkAlias = invoicePkAliasMatch ? invoicePkAliasMatch[1] : '';

      // Extract Title
      const titleMatch = gibUserData.match(/<a:Title>(.*?)<\/a:Title>/);
      const title = titleMatch ? titleMatch[1] : '';

      // Extract Identifier (VKN/TCKN)
      const identifierMatch = gibUserData.match(/<a:Identifier>(.*?)<\/a:Identifier>/);
      const identifier = identifierMatch ? identifierMatch[1] : '';

      return {
        success: true,
        resultCode,
        resultMsg,
        data: {
          identifier,
          title,
          invoicePkAlias,
          isEinvoiceMukellef: !!invoicePkAlias,
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
   * Parse SendDocument response
   */
  private static parseSendDocumentResponse(xmlText: string): ElogoSoapResponse {
    try {
      const resultCodeMatch = xmlText.match(/<a:resultCode>(.*?)<\/a:resultCode>/);
      const resultCode = resultCodeMatch ? parseInt(resultCodeMatch[1]) : -1;

      const resultMsgMatch = xmlText.match(/<a:resultMsg>(.*?)<\/a:resultMsg>/);
      const resultMsg = resultMsgMatch ? resultMsgMatch[1] : '';

      // Extract refId
      const refIdMatch = xmlText.match(/<refId>(.*?)<\/refId>/);
      const refId = refIdMatch ? parseInt(refIdMatch[1]) : 0;

      return {
        success: resultCode === 1,
        resultCode,
        resultMsg,
        data: {
          refId,
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
   * Parse GetDocumentStatus response
   */
  private static parseGetDocumentStatusResponse(xmlText: string): ElogoSoapResponse {
    try {
      const resultCodeMatch = xmlText.match(/<a:resultCode>(.*?)<\/a:resultCode>/);
      const resultCode = resultCodeMatch ? parseInt(resultCodeMatch[1]) : -1;

      const resultMsgMatch = xmlText.match(/<a:resultMsg>(.*?)<\/a:resultMsg>/);
      const resultMsg = resultMsgMatch ? resultMsgMatch[1] : '';

      if (resultCode !== 1) {
        return {
          success: false,
          error: resultMsg,
          resultCode,
          resultMsg,
        };
      }

      // Extract status info
      const statusMatch = xmlText.match(/<a:Status>(.*?)<\/a:Status>/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 0;

      const codeMatch = xmlText.match(/<a:Code>(.*?)<\/a:Code>/);
      const code = codeMatch ? parseInt(codeMatch[1]) : 0;

      const descriptionMatch = xmlText.match(/<a:description>(.*?)<\/a:description>/);
      const description = descriptionMatch ? descriptionMatch[1] : '';

      const envelopeIdMatch = xmlText.match(/<a:envelopeId>(.*?)<\/a:envelopeId>/);
      const envelopeId = envelopeIdMatch ? envelopeIdMatch[1] : '';

      const currentDateMatch = xmlText.match(/<a:currentDate>(.*?)<\/a:currentDate>/);
      const currentDate = currentDateMatch ? currentDateMatch[1] : '';

      const isCancelMatch = xmlText.match(/<a:isCancel>(.*?)<\/a:isCancel>/);
      const isCancel = isCancelMatch ? isCancelMatch[1] === 'true' : false;

      // Extract StatusDetail
      const respCodeMatch = xmlText.match(/<a:RespCode>(.*?)<\/a:RespCode>/);
      const respCode = respCodeMatch ? respCodeMatch[1] : '';

      const respDescriptionMatch = xmlText.match(/<a:RespDescription>(.*?)<\/a:RespDescription>/);
      const respDescription = respDescriptionMatch ? respDescriptionMatch[1] : '';

      const elementIdMatch = xmlText.match(/<a:ElementId>(.*?)<\/a:ElementId>/);
      const elementId = elementIdMatch ? elementIdMatch[1] : '';

      return {
        success: true,
        resultCode,
        resultMsg,
        data: {
          status,
          code,
          description,
          envelopeId,
          currentDate,
          isCancel,
          statusDetail: {
            respCode,
            respDescription,
            elementId,
          },
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
   * Parse GetDocumentData response
   */
  private static parseGetDocumentDataResponse(xmlText: string): ElogoSoapResponse {
    try {
      const resultCodeMatch = xmlText.match(/<a:resultCode>(.*?)<\/a:resultCode>/);
      const resultCode = resultCodeMatch ? parseInt(resultCodeMatch[1]) : -1;

      const resultMsgMatch = xmlText.match(/<a:resultMsg>(.*?)<\/a:resultMsg>/);
      const resultMsg = resultMsgMatch ? resultMsgMatch[1] : '';

      if (resultCode !== 1) {
        return {
          success: false,
          error: resultMsg,
          resultCode,
          resultMsg,
        };
      }

      // Extract document data
      const binaryDataMatch = xmlText.match(/<a:Value>(.*?)<\/a:Value>/s);
      const binaryData = binaryDataMatch ? binaryDataMatch[1].trim() : '';

      const fileNameMatch = xmlText.match(/<a:fileName>(.*?)<\/a:fileName>/);
      const fileName = fileNameMatch ? fileNameMatch[1] : '';

      const hashMatch = xmlText.match(/<a:hash>(.*?)<\/a:hash>/);
      const hash = hashMatch ? hashMatch[1] : '';

      const currentDateMatch = xmlText.match(/<a:currentDate>(.*?)<\/a:currentDate>/);
      const currentDate = currentDateMatch ? currentDateMatch[1] : '';

      return {
        success: true,
        resultCode,
        resultMsg,
        data: {
          binaryData,
          fileName,
          hash,
          currentDate,
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
   * Parse GetDocumentList response
   */
  private static parseGetDocumentListResponse(xmlText: string): ElogoSoapResponse {
    try {
      // Debug: Log raw response (first 2000 chars for debugging)
      console.log('📄 GetDocumentList Raw Response (first 2000 chars):', xmlText.substring(0, 2000));
      
      const resultCodeMatch = xmlText.match(/<a:resultCode>(.*?)<\/a:resultCode>/);
      const resultCode = resultCodeMatch ? parseInt(resultCodeMatch[1]) : -1;

      const resultMsgMatch = xmlText.match(/<a:resultMsg>(.*?)<\/a:resultMsg>/);
      const resultMsg = resultMsgMatch ? resultMsgMatch[1] : '';

      console.log('📊 GetDocumentList resultCode:', resultCode, 'resultMsg:', resultMsg);

      if (resultCode !== 1) {
        console.log('❌ GetDocumentList resultCode is not 1');
        return {
          success: false,
          error: resultMsg || `Beklenmeyen resultCode: ${resultCode}`,
          resultCode,
          resultMsg,
        };
      }

      // Try multiple document list patterns (e-Logo API might use different tags)
      let docListXml = '';
      
      // Pattern 1: <docList>...</docList>
      const docListMatch1 = xmlText.match(/<docList>(.*?)<\/docList>/s);
      if (docListMatch1) {
        docListXml = docListMatch1[1];
        console.log('✅ Found docList pattern 1');
      }
      
      // Pattern 2: <a:docList>...</a:docList>
      if (!docListXml) {
        const docListMatch2 = xmlText.match(/<a:docList>(.*?)<\/a:docList>/s);
        if (docListMatch2) {
          docListXml = docListMatch2[1];
          console.log('✅ Found docList pattern 2 (a: prefix)');
        }
      }
      
      // Pattern 3: <GetDocumentListResult>...</GetDocumentListResult>
      if (!docListXml) {
        const docListMatch3 = xmlText.match(/<GetDocumentListResult[^>]*>(.*?)<\/GetDocumentListResult>/s);
        if (docListMatch3) {
          docListXml = docListMatch3[1];
          console.log('✅ Found GetDocumentListResult pattern');
        }
      }

      console.log('📋 DocList XML length:', docListXml.length);
      if (docListXml.length > 0) {
        console.log('📋 DocList XML sample (first 500 chars):', docListXml.substring(0, 500));
      }

      // Parse each document - try multiple patterns
      const documents: any[] = [];
      
      // Pattern 1: <a:Document>...</a:Document>
      let docMatches = [...docListXml.matchAll(/<a:Document>(.*?)<\/a:Document>/gs)];
      
      // Pattern 2: <Document>...</Document> (without namespace)
      if (docMatches.length === 0) {
        docMatches = [...docListXml.matchAll(/<Document>(.*?)<\/Document>/gs)];
        if (docMatches.length > 0) {
          console.log('✅ Found Document pattern (no namespace)');
        }
      }
      
      // Pattern 3: Try DocumentType
      if (docMatches.length === 0) {
        docMatches = [...docListXml.matchAll(/<a:DocumentType>(.*?)<\/a:DocumentType>/gs)];
        if (docMatches.length > 0) {
          console.log('✅ Found DocumentType pattern');
        }
      }

      console.log('📊 Document matches found:', docMatches.length);

      for (const docMatch of docMatches) {
        const docXml = docMatch[1];

        // Try both with and without namespace prefix
        let documentUuid = '';
        let documentId = '';
        
        const documentUuidMatch1 = docXml.match(/<a:documentUuid>(.*?)<\/a:documentUuid>/);
        const documentUuidMatch2 = docXml.match(/<documentUuid>(.*?)<\/documentUuid>/);
        const documentUuidMatch3 = docXml.match(/<a:uuid>(.*?)<\/a:uuid>/);
        const documentUuidMatch4 = docXml.match(/<uuid>(.*?)<\/uuid>/);
        documentUuid = documentUuidMatch1?.[1] || documentUuidMatch2?.[1] || documentUuidMatch3?.[1] || documentUuidMatch4?.[1] || '';

        const documentIdMatch1 = docXml.match(/<a:documentId>(.*?)<\/a:documentId>/);
        const documentIdMatch2 = docXml.match(/<documentId>(.*?)<\/documentId>/);
        documentId = documentIdMatch1?.[1] || documentIdMatch2?.[1] || '';

        // Extract docInfo array - try multiple patterns
        const docInfo: Record<string, string> = {};
        
        // Pattern 1: <b:string>KEY=VALUE</b:string>
        const docInfoMatches1 = [...docXml.matchAll(/<b:string>(.*?)<\/b:string>/g)];
        // Pattern 2: <string>KEY=VALUE</string>
        const docInfoMatches2 = [...docXml.matchAll(/<string>(.*?)<\/string>/g)];
        // Pattern 3: <arr:string>KEY=VALUE</arr:string>
        const docInfoMatches3 = [...docXml.matchAll(/<arr:string>(.*?)<\/arr:string>/g)];
        
        const allInfoMatches = [...docInfoMatches1, ...docInfoMatches2, ...docInfoMatches3];

        for (const infoMatch of allInfoMatches) {
          const infoStr = infoMatch[1];
          const [key, ...valueParts] = infoStr.split('=');
          if (key && valueParts.length > 0) {
            docInfo[key.trim()] = valueParts.join('=').trim();
          }
        }

        if (documentUuid) {
          documents.push({
            documentUuid,
            documentId,
            docInfo,
          });
          console.log('📄 Found document:', documentUuid.substring(0, 8) + '...');
        }
      }

      console.log('✅ Total documents parsed:', documents.length);

      return {
        success: true,
        resultCode,
        resultMsg,
        data: {
          documents,
        },
      };
    } catch (error: any) {
      console.error('❌ XML parse error:', error.message);
      return {
        success: false,
        error: 'XML parse error: ' + (error.message || 'Unknown error'),
      };
    }
  }

  /**
   * Parse GetDocumentStatusBatch response
   */
  private static parseGetDocumentStatusBatchResponse(xmlText: string): ElogoSoapResponse {
    try {
      const resultCodeMatch = xmlText.match(/<a:resultCode>(.*?)<\/a:resultCode>/);
      const resultCode = resultCodeMatch ? parseInt(resultCodeMatch[1]) : -1;

      const resultMsgMatch = xmlText.match(/<a:resultMsg>(.*?)<\/a:resultMsg>/);
      const resultMsg = resultMsgMatch ? resultMsgMatch[1] : '';

      if (resultCode !== 1) {
        return {
          success: false,
          error: resultMsg,
          resultCode,
          resultMsg,
        };
      }

      // Extract status list
      const statusList: any[] = [];
      const statusMatches = xmlText.matchAll(/<a:DocumentStatusType>(.*?)<\/a:DocumentStatusType>/gs);

      for (const statusMatch of statusMatches) {
        const statusXml = statusMatch[1];

        const status = this.extractXmlValue(statusXml, 'Status');
        const code = this.extractXmlValue(statusXml, 'Code');
        const description = this.extractXmlValue(statusXml, 'description');
        const envelopeId = this.extractXmlValue(statusXml, 'envelopeId');
        const currentDate = this.extractXmlValue(statusXml, 'currentDate');
        const isCancel = this.extractXmlValue(statusXml, 'isCancel') === 'true';
        const uuid = this.extractXmlValue(statusXml, 'uuid');

        statusList.push({
          status: parseInt(status) || 0,
          code: parseInt(code) || 0,
          description,
          envelopeId,
          currentDate,
          isCancel,
          uuid,
        });
      }

      return {
        success: true,
        resultCode,
        resultMsg,
        data: {
          statusList,
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
   * Parse Get2FACode response
   */
  private static parseGet2FACodeResponse(xmlText: string): ElogoSoapResponse {
    try {
      const resultCodeMatch = xmlText.match(/<a:resultCode>(.*?)<\/a:resultCode>/);
      const resultCode = resultCodeMatch ? parseInt(resultCodeMatch[1]) : -1;

      const resultMsgMatch = xmlText.match(/<a:resultMsg>(.*?)<\/a:resultMsg>/);
      const resultMsg = resultMsgMatch ? resultMsgMatch[1] : '';

      if (resultCode !== 1) {
        return {
          success: false,
          error: resultMsg,
          resultCode,
          resultMsg,
        };
      }

      // Extract 2FA code validity time
      const outputListMatch = xmlText.match(/<a:outputList>(.*?)<\/a:outputList>/s);
      const outputListXml = outputListMatch ? outputListMatch[1] : '';

      const validityTimeMatch = outputListXml.match(/2FACodeValidityTime=(\d+)/);
      const validityTime = validityTimeMatch ? parseInt(validityTimeMatch[1]) : 180;

      return {
        success: true,
        resultCode,
        resultMsg,
        data: {
          validityTime,
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
   * Helper to extract XML value
   */
  private static extractXmlValue(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<a:${tag}>(.*?)<\/a:${tag}>`));
    return match ? match[1] : '';
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
   * Calculate MD5 hash of data (Synchronous - Simple fallback)
   * WARNING: This is NOT a real MD5 hash! Use calculateMD5Async for production.
   * This is only a placeholder for basic testing.
   */
  static calculateMD5(data: Uint8Array): string {
    console.warn('⚠️ Using simple hash instead of MD5. Use calculateMD5Async for production.');
    
    // Simple hash function (NOT cryptographically secure)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data[i];
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Convert to hex string (32 characters for MD5 format)
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
    // Repeat to make 32 characters (MD5 length)
    return (hexHash + hexHash + hexHash + hexHash).substring(0, 32).toUpperCase();
  }

  /**
   * Calculate proper MD5 hash using SparkMD5 library
   * This is the CORRECT implementation that should be used in production
   * Usage: const md5 = await SoapClient.calculateMD5Async(data);
   */
  static async calculateMD5Async(data: Uint8Array): Promise<string> {
    try {
      // Import SparkMD5 for proper MD5 hashing
      const SparkMD5 = (await import('https://esm.sh/spark-md5@3.0.2')).default;
      
      // Convert Uint8Array to ArrayBuffer
      const arrayBuffer = data.buffer.slice(
        data.byteOffset,
        data.byteOffset + data.byteLength
      );
      
      // Calculate MD5 hash
      const md5Hash = SparkMD5.ArrayBuffer.hash(arrayBuffer);
      
      console.log('✅ MD5 hash calculated successfully');
      return md5Hash.toUpperCase();
    } catch (error) {
      console.error('❌ MD5 calculation error:', error);
      console.warn('⚠️ Falling back to simple hash (NOT MD5!)');
      return this.calculateMD5(data);
    }
  }
}
