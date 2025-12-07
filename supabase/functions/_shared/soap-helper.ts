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
}
