import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { TemplateSchema } from '@/types/pdf-template';
import { safeText } from '../utils/pdfTextUtils';

interface PdfHeaderProps {
  schema: TemplateSchema;
  styles: any;
}

export const PdfHeader: React.FC<PdfHeaderProps> = ({ schema, styles }) => {
  return (
    <View style={[
      styles.header, 
      {
        justifyContent: 
          schema.header.logoPosition === 'center' ? 'center' :
          schema.header.logoPosition === 'right' ? 'flex-end' : 
          'space-between',
        flexDirection: schema.header.logoPosition === 'center' ? 'column' : 'row',
        alignItems: schema.header.logoPosition === 'center' ? 'center' : 'flex-start'
      }
    ]}>
      {/* Left Position Layout */}
      {schema.header.logoPosition === 'left' && (
        <>
          {/* Left Section - Logo and Company Info */}
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {/* Logo */}
            {schema.header.showLogo && schema.header.logoUrl && (
              <View style={{ 
                marginRight: 8, 
                padding: 0, 
                alignSelf: 'flex-start',
                flexShrink: 0
              }}>
                <Image
                  style={styles.logo}
                  src={schema.header.logoUrl}
                />
              </View>
            )}
            
            {/* Company Info */}
            {schema.header.showCompanyInfo && (
              <View style={{ flex: 1, marginLeft: 0, paddingLeft: 0 }}>
                {schema.header.companyName && schema.header.companyName.trim() && (
                  <Text style={{
                    fontSize: schema.header.companyInfoFontSize || 12,
                    fontWeight: 'bold',
                    color: schema.page.fontColor || '#1F2937',
                    marginBottom: 3,
                    marginLeft: 0,
                    paddingLeft: 0
                  }}>
                    {safeText(schema.header.companyName)}
                  </Text>
                )}
                {schema.header.companyAddress && schema.header.companyAddress.trim() && (
                  <Text style={{
                    fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                    color: schema.page.fontColor || '#4B5563',
                    marginBottom: 2,
                    marginLeft: 0,
                    paddingLeft: 0
                  }}>
                    {safeText(schema.header.companyAddress)}
                  </Text>
                )}
                {schema.header.companyPhone && schema.header.companyPhone.trim() && (
                  <Text style={{
                    fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                    color: schema.page.fontColor || '#4B5563',
                    marginBottom: 2,
                    marginLeft: 0,
                    paddingLeft: 0
                  }}>
                    Tel: {safeText(schema.header.companyPhone)}
                  </Text>
                )}
                {schema.header.companyEmail && schema.header.companyEmail.trim() && (
                  <Text style={{
                    fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                    color: schema.page.fontColor || '#4B5563',
                    marginBottom: 2,
                    marginLeft: 0,
                    paddingLeft: 0
                  }}>
                    E-posta: {safeText(schema.header.companyEmail)}
                  </Text>
                )}
                {schema.header.companyWebsite && schema.header.companyWebsite.trim() && (
                  <Text style={{
                    fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                    color: schema.page.fontColor || '#4B5563',
                    marginBottom: 2,
                    marginLeft: 0,
                    paddingLeft: 0
                  }}>
                    Web: {safeText(schema.header.companyWebsite)}
                  </Text>
                )}
                {schema.header.companyTaxNumber && schema.header.companyTaxNumber.trim() && (
                  <Text style={{
                    fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                    color: schema.page.fontColor || '#4B5563'
                  }}>
                    {safeText(schema.header.companyTaxNumber)}
                  </Text>
                )}
              </View>
            )}
          </View>
          
          {/* Right Section - Title */}
          {(schema.header.showTitle ?? true) && (
            <View style={{ textAlign: 'right', alignItems: 'flex-end' }}>
              <Text style={styles.title}>{safeText(schema.header.title)}</Text>
            </View>
          )}
        </>
      )}

      {/* Center Position Layout */}
      {schema.header.logoPosition === 'center' && (
        <>
          {/* Logo */}
          {schema.header.showLogo && schema.header.logoUrl && (
            <View style={{
              marginBottom: 15,
              alignItems: 'center',
              padding: 0,
              alignSelf: 'center',
              flexShrink: 0
            }}>
              <Image
                style={styles.logo}
                src={schema.header.logoUrl}
              />
            </View>
          )}
          
          {/* Company Info */}
          {schema.header.showCompanyInfo && (
            <View style={{ alignItems: 'center', marginBottom: 15 }}>
              {schema.header.companyName && schema.header.companyName.trim() && (
                <Text style={{
                  fontSize: schema.header.companyInfoFontSize || 12,
                  fontWeight: 'bold',
                  color: schema.page.fontColor || '#1F2937',
                  marginBottom: 3,
                  textAlign: 'center'
                }}>
                  {safeText(schema.header.companyName)}
                </Text>
              )}
              {schema.header.companyAddress && schema.header.companyAddress.trim() && (
                <Text style={{
                  fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                  color: schema.page.fontColor || '#4B5563',
                  marginBottom: 2,
                  textAlign: 'center'
                }}>
                  {safeText(schema.header.companyAddress)}
                </Text>
              )}
              {schema.header.companyPhone && schema.header.companyPhone.trim() && (
                <Text style={{
                  fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                  color: schema.page.fontColor || '#4B5563',
                  marginBottom: 2,
                  textAlign: 'center'
                }}>
                  Tel: {safeText(schema.header.companyPhone)}
                </Text>
              )}
              {schema.header.companyEmail && schema.header.companyEmail.trim() && (
                <Text style={{
                  fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                  color: schema.page.fontColor || '#4B5563',
                  marginBottom: 2,
                  textAlign: 'center'
                }}>
                  E-posta: {safeText(schema.header.companyEmail)}
                </Text>
              )}
              {schema.header.companyWebsite && schema.header.companyWebsite.trim() && (
                <Text style={{
                  fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                  color: schema.page.fontColor || '#4B5563',
                  marginBottom: 2,
                  textAlign: 'center'
                }}>
                  Web: {safeText(schema.header.companyWebsite)}
                </Text>
              )}
              {schema.header.companyTaxNumber && schema.header.companyTaxNumber.trim() && (
                <Text style={{
                  fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                  color: schema.page.fontColor || '#4B5563',
                  textAlign: 'center'
                }}>
                  {safeText(schema.header.companyTaxNumber)}
                </Text>
              )}
            </View>
          )}
          
          {/* Title */}
          {(schema.header.showTitle ?? true) && (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.title}>{safeText(schema.header.title)}</Text>
            </View>
          )}
        </>
      )}

      {/* Right Position Layout */}
      {schema.header.logoPosition === 'right' && (
        <>
          {/* Left Section - Title */}
          {(schema.header.showTitle ?? true) && (
            <View style={{ textAlign: 'left', alignItems: 'flex-start' }}>
              <Text style={styles.title}>{safeText(schema.header.title)}</Text>
            </View>
          )}
          
          {/* Right Section - Company Info and Logo */}
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
            {/* Company Info */}
            {schema.header.showCompanyInfo && (
              <View style={{ flex: 1, alignItems: 'flex-end', marginRight: 3 }}>
                {schema.header.companyName && schema.header.companyName.trim() && (
                  <Text style={{
                    fontSize: schema.header.companyInfoFontSize || 12,
                    fontWeight: 'bold',
                    color: schema.page.fontColor || '#1F2937',
                    marginBottom: 3,
                    textAlign: 'right'
                  }}>
                    {safeText(schema.header.companyName)}
                  </Text>
                )}
                {schema.header.companyAddress && schema.header.companyAddress.trim() && (
                  <Text style={{
                    fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                    color: schema.page.fontColor || '#4B5563',
                    marginBottom: 2,
                    marginLeft: 0,
                    paddingLeft: 0,
                    textAlign: 'right'
                  }}>
                    {safeText(schema.header.companyAddress)}
                  </Text>
                )}
                {schema.header.companyPhone && schema.header.companyPhone.trim() && (
                  <Text style={{
                    fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                    color: schema.page.fontColor || '#4B5563',
                    marginBottom: 2,
                    marginLeft: 0,
                    paddingLeft: 0,
                    textAlign: 'right'
                  }}>
                    Tel: {safeText(schema.header.companyPhone)}
                  </Text>
                )}
                {schema.header.companyEmail && schema.header.companyEmail.trim() && (
                  <Text style={{
                    fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                    color: schema.page.fontColor || '#4B5563',
                    marginBottom: 2,
                    marginLeft: 0,
                    paddingLeft: 0,
                    textAlign: 'right'
                  }}>
                    E-posta: {safeText(schema.header.companyEmail)}
                  </Text>
                )}
                {schema.header.companyWebsite && schema.header.companyWebsite.trim() && (
                  <Text style={{
                    fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                    color: schema.page.fontColor || '#4B5563',
                    marginBottom: 2,
                    marginLeft: 0,
                    paddingLeft: 0,
                    textAlign: 'right'
                  }}>
                    Web: {safeText(schema.header.companyWebsite)}
                  </Text>
                )}
                {schema.header.companyTaxNumber && schema.header.companyTaxNumber.trim() && (
                  <Text style={{
                    fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                    color: schema.page.fontColor || '#4B5563',
                    textAlign: 'right'
                  }}>
                    {safeText(schema.header.companyTaxNumber)}
                  </Text>
                )}
              </View>
            )}
            
            {/* Logo */}
            {schema.header.showLogo && schema.header.logoUrl && (
              <View style={{ 
                padding: 0, 
                alignSelf: 'flex-start',
                flexShrink: 0
              }}>
                <Image
                  style={styles.logo}
                  src={schema.header.logoUrl}
                />
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
};

