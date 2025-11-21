import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, Svg, Circle, Rect, Path, Polygon } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { QuoteData, TemplateSchema } from '@/types/pdf-template';

// Register fonts for Turkish character support
// Roboto
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.ttf',
      fontWeight: 'bold',
    }
  ]
});

// Open Sans
Font.register({
  family: 'Open Sans',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVc.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/opensans/v34/memQYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWq8tWZ0Pw86hd0Rk8ZkWVAewA.ttf',
      fontWeight: 'bold',
    }
  ]
});

// Lato
Font.register({
  family: 'Lato',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/lato/v23/S6uyw4BMUTPHjx4wXg.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/lato/v23/S6u9w4BMUTPHh6UVSwiPHA.ttf',
      fontWeight: 'bold',
    }
  ]
});

// Montserrat
Font.register({
  family: 'Montserrat',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aXpsog.woff2',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM73w5aXpsog.woff2',
      fontWeight: 'bold',
    }
  ]
});

// Inter
Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2',
      fontWeight: 'bold',
    }
  ]
});

// Poppins
Font.register({
  family: 'Poppins',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2',
      fontWeight: 'bold',
    }
  ]
});

// Nunito
Font.register({
  family: 'Nunito',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/nunito/v25/XRXI3I6Li01BKofAnsSUYevN.woff2',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/nunito/v25/XRXQ3I6Li01BKofAjsOUYevN.woff2',
      fontWeight: 'bold',
    }
  ]
});

// Playfair Display (Serif)
Font.register({
  family: 'Playfair Display',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYgA.woff2',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFnD-vYSZviVYUb_rj3ij__anPXDTnogq7hV0jZ3Y.woff2',
      fontWeight: 'bold',
    }
  ]
});

// Merriweather (Serif)
Font.register({
  family: 'Merriweather',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/merriweather/v30/u-440qyriQwlOrhSvowK_l5-fCZMdeX3rg.woff2',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/merriweather/v30/u-4b0qyriQwlOrhSvowK_l5-fCZMdeX3rg.woff2',
      fontWeight: 'bold',
    }
  ]
});

// Source Sans Pro
Font.register({
  family: 'Source Sans Pro',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/sourcesanspro/v21/6xK3dSBYKcSV-LCoeQqfX1RYOo3qOK7lujVj9w.woff2',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/sourcesanspro/v21/6xKydSBYKcSV-LCoeQqfX1RYOo3ig4vwmRduz8A.woff2',
      fontWeight: 'bold',
    }
  ]
});

// Helvetica, Times-Roman, Courier are built-in fonts in PDF, no need to register

// Safe text rendering function for Turkish characters
const safeText = (text: string | undefined | null): string => {
  if (!text) return '';
  // Ensure text is properly encoded
  return text.toString().normalize('NFC');
};

interface PdfRendererProps {
  data: QuoteData;
  schema: TemplateSchema;
}

const PdfRenderer: React.FC<PdfRendererProps> = ({ data, schema }) => {
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: schema.page.backgroundColor || '#FFFFFF',
      paddingTop: schema.page.padding.top,
      paddingRight: schema.page.padding.right,
      paddingBottom: schema.page.padding.bottom,
      paddingLeft: schema.page.padding.left,
      fontSize: schema.page.fontSize,
      fontFamily: schema.page.fontFamily || 'Roboto',
      fontWeight: schema.page.fontWeight === 'bold' ? 'bold' : 'normal',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 30,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    logo: {
      width: schema.header.logoSize || 60,
      height: 'auto', // Let height adjust automatically
      objectFit: 'contain',
      margin: 2,
    },
    title: {
      fontSize: schema.header.titleFontSize || 24,
      fontWeight: 'bold',
      color: '#1F2937',
    },
    subtitle: {
      fontSize: 12,
      color: '#6B7280',
      marginTop: 5,
    },
    customerSection: {
      marginBottom: 30,
    },
    customerTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 10,
      color: '#374151',
    },
    customerInfo: {
      fontSize: 10,
      lineHeight: 1.4,
      color: '#4B5563',
    },
    table: {
      marginBottom: 30,
    },
    tableHeader: {
      flexDirection: 'row',
      borderBottomWidth: 2,
      borderBottomColor: '#E5E7EB',
      paddingBottom: 8,
      marginBottom: 8,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: '#F3F4F6',
    },
    tableCell: {
      flex: 1,
      fontSize: 10,
    },
    tableCellHeader: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#374151',
    },
    tableCellLeft: {
      textAlign: 'left',
    },
    tableCellCenter: {
      textAlign: 'center',
    },
    tableCellRight: {
      textAlign: 'right',
    },
    totalsSection: {
      marginLeft: 'auto',
      width: 200,
      marginBottom: 30,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 3,
    },
    totalLabel: {
      fontSize: 10,
      color: '#6B7280',
    },
    totalValue: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#374151',
    },
    totalRowFinal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
      marginTop: 5,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    totalLabelFinal: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#1F2937',
    },
    totalValueFinal: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#1F2937',
    },
    notesSection: {
      marginTop: 'auto',
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 10,
      marginTop: 10,
      color: '#374151',
    },
    notesText: {
      fontSize: 9,
      color: '#6B7280',
      lineHeight: 1.4,
      marginBottom: 5,
    },
    footer: {
      marginTop: 20,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      fontSize: 8,
      color: '#9CA3AF',
      textAlign: 'center',
    },
    customField: {
      marginVertical: 8,
      paddingHorizontal: 0,
    },
    customFieldText: {
      fontSize: 12,
      color: '#000',
      lineHeight: 1.4,
    },
  });

  const formatCurrency = (amount: number, currency: string = 'TL') => {
    // Manual formatting to avoid symbol rendering issues in PDF
    const formatted = new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    
    const symbol = currency === 'TL' ? 'TL' : currency;
    return `${formatted} ${symbol}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: tr });
    } catch {
      return dateString;
    }
  };



  const renderCustomerField = (fieldKey: string, customer: QuoteData['customer']) => {
    if (!customer) return null;

    const fieldMap: Record<string, string | undefined> = {
      name: customer.name,
      company: customer.company,
      email: customer.email,
      mobile_phone: customer.mobile_phone,
      office_phone: customer.office_phone,
      address: customer.address,
      tax_number: customer.tax_number,
      tax_office: customer.tax_office,
    };

    const value = fieldMap[fieldKey];
    // Check for empty strings as well
    if (!value || value.trim() === '') return null;

    return (
      <Text key={fieldKey} style={[styles.customerInfo, { marginBottom: 3, textAlign: 'left' }]}>
        {safeText(value)}
      </Text>
    );
  };

  const renderProposalField = (fieldKey: string) => {
    // Sadece 4 temel teklif bilgisi gösterilecek
    const fieldMap: Record<string, { label: string; value: string | undefined }> = {
      number: { label: 'Teklif No', value: data.number },
      created_at: { label: 'Tarih', value: data.created_at ? formatDate(data.created_at) : undefined },
      valid_until: { label: 'Geçerlilik', value: data.valid_until ? formatDate(data.valid_until) : undefined },
      prepared_by: { label: 'Hazırlayan', value: data.prepared_by || 'Belirtilmemiş' },
    };

    const field = fieldMap[fieldKey];
    // Check for empty strings as well
    if (!field || !field.value || field.value.trim() === '') return null;

    return (
      <View key={fieldKey} style={{ flexDirection: 'row', marginBottom: 5, alignItems: 'center', justifyContent: 'space-between', width: 160 }}>
        <Text style={[styles.customerInfo, { fontWeight: 'bold', width: 60 }]}>
          {safeText(field.label)}
        </Text>
        <Text style={[styles.customerInfo, { fontWeight: 'bold', marginHorizontal: 4 }]}>:</Text>
        <Text style={[styles.customerInfo, { flex: 1 }]}>
          {safeText(field.value)}
        </Text>
      </View>
    );
  };

  // Helper function to render background style
  const renderBackgroundStyle = () => {
    const style = schema.page.backgroundStyle || 'none';
    const opacity = (schema.page.backgroundOpacity ?? 5) / 100; // Çok düşük varsayılan opacity (5%)
    const accentColor = schema.page.backgroundStyleColor || '#4F46E5';
    
    if (style === 'none') {
      return null;
    }
    // Tüm arka plan stilleri için çok düşük opacity - yazıların arkasında kalması için
    const containerStyle = {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: opacity * 0.3, // Çok silik - toplam opacity çok düşük olacak
      zIndex: 0, // Arka planda kalması için
      pointerEvents: 'none' as const,
    };

    switch (style) {
      case 'corner-wave':
        // Modern dalga köşe tasarımı
        return (
          <View style={containerStyle}>
            <Svg style={{ width: '100%', height: '100%' }}>
              {/* Sağ alt köşede büyük dalga */}
              <Path
                d="M 450 600 Q 500 550 600 600 L 600 842 L 450 842 Z"
                fill={accentColor}
              />
              <Path
                d="M 400 650 Q 450 600 550 650 Q 600 680 600 750 L 600 842 L 400 842 Z"
                fill={accentColor}
              />
            </Svg>
          </View>
        );

      case 'side-gradient':
        // Sağ tarafta gradient - çok silik
        return (
          <View style={containerStyle}>
            <Svg style={{ width: '100%', height: '100%' }}>
              <Rect x="450" y="0" width="150" height="842" fill={accentColor} />
              <Rect x="400" y="0" width="50" height="842" fill={accentColor} />
              <Rect x="350" y="0" width="50" height="842" fill={accentColor} />
            </Svg>
          </View>
        );

      case 'bottom-shapes':
        // Alt kısımda modern şekiller (örneğinizdeki gibi)
        return (
          <View style={containerStyle}>
            <Svg style={{ width: '100%', height: '100%' }}>
              {/* Büyük üçgen */}
              <Polygon
                points="500,700 650,842 350,842"
                fill={accentColor}
              />
              {/* Küçük daire */}
              <Circle cx="420" cy="750" r="40" fill={accentColor} />
              {/* Dikdörtgen */}
              <Rect x="0" y="780" width="300" height="62" fill={accentColor} />
            </Svg>
          </View>
        );

      case 'top-circles':
        // Üst kısımda daireler
        return (
          <View style={containerStyle}>
            <Svg style={{ width: '100%', height: '100%' }}>
              <Circle cx="500" cy="60" r="80" fill={accentColor} />
              <Circle cx="100" cy="80" r="50" fill={accentColor} />
              <Circle cx="300" cy="40" r="30" fill={accentColor} />
            </Svg>
          </View>
        );

      case 'diagonal-bands':
        // Çapraz bantlar
        return (
          <View style={containerStyle}>
            <Svg style={{ width: '100%', height: '100%' }}>
              <Polygon
                points="550,0 600,0 150,842 100,842"
                fill={accentColor}
              />
              <Polygon
                points="350,0 400,0 0,842 0,792"
                fill={accentColor}
              />
            </Svg>
          </View>
        );

      case 'corner-triangles':
        // Köşelerde üçgenler
        return (
          <View style={containerStyle}>
            <Svg style={{ width: '100%', height: '100%' }}>
              {/* Sağ üst */}
              <Polygon points="600,0 600,150 450,0" fill={accentColor} />
              {/* Sol alt */}
              <Polygon points="0,842 0,692 150,842" fill={accentColor} />
              {/* Sağ alt */}
              <Polygon points="600,842 600,742 500,842" fill={accentColor} />
            </Svg>
          </View>
        );

      case 'side-curves':
        // Yanlarda eğriler
        return (
          <View style={containerStyle}>
            <Svg style={{ width: '100%', height: '100%' }}>
              {/* Sol taraf eğri */}
              <Path
                d="M 0 200 Q 100 300 0 400 L 0 200 Z"
                fill={accentColor}
              />
              {/* Sağ taraf eğri */}
              <Path
                d="M 600 400 Q 500 500 600 600 L 600 400 Z"
                fill={accentColor}
              />
              {/* Alt eğri */}
              <Path
                d="M 200 842 Q 300 750 400 842 L 200 842 Z"
                fill={accentColor}
              />
            </Svg>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Document>
      <Page size={schema.page.size === "LETTER" ? "LETTER" : schema.page.size} style={styles.page}>
        {/* Content Wrapper - Önce render edilir (önde olur) */}
        <View style={{ position: 'relative' }}>
        {/* Header */}
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
                {schema.header.showLogo && (schema.header as any).logoUrl && (
                  <View style={{ 
                    marginRight: 8, 
                    padding: 0, 
                    alignSelf: 'flex-start',
                    flexShrink: 0
                  }}>
                    <Image
                      style={styles.logo}
                      src={(schema.header as any).logoUrl}
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
                        color: '#1F2937',
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
                        color: '#4B5563',
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
                        color: '#4B5563',
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
                        color: '#4B5563',
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
                        color: '#4B5563',
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
                        color: '#4B5563'
                      }}>
                        Vergi No: {safeText(schema.header.companyTaxNumber)}
                      </Text>
                    )}
                  </View>
                )}
              </View>
              
              {/* Right Section - Title */}
              <View style={{ textAlign: 'right', alignItems: 'flex-end' }}>
                <Text style={styles.title}>{safeText(schema.header.title)}</Text>
              </View>
            </>
          )}

          {/* Center Position Layout */}
          {schema.header.logoPosition === 'center' && (
            <>
              {/* Logo */}
              {schema.header.showLogo && (schema.header as any).logoUrl && (
                <View style={{ 
                  marginBottom: 15, 
                  alignItems: 'center', 
                  padding: 0, 
                  alignSelf: 'center',
                  flexShrink: 0
                }}>
                  <Image
                    style={styles.logo}
                    src={(schema.header as any).logoUrl}
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
                      color: '#1F2937',
                      marginBottom: 3,
                      textAlign: 'center'
                    }}>
                      {safeText(schema.header.companyName)}
                    </Text>
                  )}
                  {schema.header.companyAddress && schema.header.companyAddress.trim() && (
                    <Text style={{
                      fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                      color: '#4B5563',
                      marginBottom: 2,
                      textAlign: 'center'
                    }}>
                      {safeText(schema.header.companyAddress)}
                    </Text>
                  )}
                  {schema.header.companyPhone && schema.header.companyPhone.trim() && (
                    <Text style={{
                      fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                      color: '#4B5563',
                      marginBottom: 2,
                      textAlign: 'center'
                    }}>
                      Tel: {safeText(schema.header.companyPhone)}
                    </Text>
                  )}
                  {schema.header.companyEmail && schema.header.companyEmail.trim() && (
                    <Text style={{
                      fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                      color: '#4B5563',
                      marginBottom: 2,
                      textAlign: 'center'
                    }}>
                      E-posta: {safeText(schema.header.companyEmail)}
                    </Text>
                  )}
                  {schema.header.companyWebsite && schema.header.companyWebsite.trim() && (
                    <Text style={{
                      fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                      color: '#4B5563',
                      marginBottom: 2,
                      textAlign: 'center'
                    }}>
                      Web: {safeText(schema.header.companyWebsite)}
                    </Text>
                  )}
                  {schema.header.companyTaxNumber && schema.header.companyTaxNumber.trim() && (
                    <Text style={{
                      fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                      color: '#4B5563',
                      textAlign: 'center'
                    }}>
                      Vergi No: {safeText(schema.header.companyTaxNumber)}
                    </Text>
                  )}
                </View>
              )}
              
                            {/* Title */}
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.title}>{safeText(schema.header.title)}</Text>
              </View>
            </>
          )}

          {/* Right Position Layout */}
          {schema.header.logoPosition === 'right' && (
            <>
                            {/* Left Section - Title */}
              <View style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                <Text style={styles.title}>{safeText(schema.header.title)}</Text>
              </View>
              
              {/* Right Section - Company Info and Logo */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                {/* Company Info */}
                {schema.header.showCompanyInfo && (
                  <View style={{ flex: 1, alignItems: 'flex-end', marginRight: 3 }}>
                    {schema.header.companyName && schema.header.companyName.trim() && (
                      <Text style={{
                        fontSize: schema.header.companyInfoFontSize || 12,
                        fontWeight: 'bold',
                        color: '#1F2937',
                        marginBottom: 3,
                        textAlign: 'right'
                      }}>
                        {safeText(schema.header.companyName)}
                      </Text>
                    )}
                    {schema.header.companyAddress && schema.header.companyAddress.trim() && (
                      <Text style={{
                        fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                        color: '#4B5563',
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
                        color: '#4B5563',
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
                        color: '#4B5563',
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
                        color: '#4B5563',
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
                        color: '#4B5563',
                        textAlign: 'right'
                      }}>
                        Vergi No: {safeText(schema.header.companyTaxNumber)}
                      </Text>
                    )}
                  </View>
                )}
                
                {/* Logo */}
                {schema.header.showLogo && (schema.header as any).logoUrl && (
                  <View style={{ 
                    padding: 0, 
                    alignSelf: 'flex-start',
                    flexShrink: 0
                  }}>
                    <Image
                      style={styles.logo}
                      src={(schema.header as any).logoUrl}
                    />
                  </View>
                )}
              </View>
            </>
          )}
        </View>


        {/* Customer and Quote Information Container */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
          {/* Müşteri Bilgileri Container - Her zaman göster */}
          {data.customer && (
            <View style={[styles.customerSection, { flex: 2, marginRight: 20, marginBottom: 0, alignItems: 'flex-start' }]}>
              {/* Firma İsmi */}
              {data.customer?.company && data.customer.company.trim() !== '' && (
                <Text style={[styles.customerTitle, { textAlign: 'left', marginBottom: 10, fontSize: 16, fontWeight: 'bold' }]}>
                  {safeText(String(data.customer.company).toUpperCase())}
                </Text>
              )}
              
              <View style={{ alignItems: 'flex-start' }}>
                {/* Sayın Yetkili */}
                <Text style={[styles.customerInfo, { marginBottom: 8, fontSize: 11 }]}>
                  {safeText('Sayın')}
                </Text>
                
                {/* Müşteri Yetkilisi */}
                {data.customer?.name && data.customer.name.trim() !== '' && (
                  <Text style={[styles.customerInfo, { marginBottom: 12, fontSize: 12, fontWeight: 'bold' }]}>
                    {safeText(`${String(data.customer.name)},`)}
                  </Text>
                )}
                
                {/* Açıklama Metni */}
                <Text style={[styles.customerInfo, { lineHeight: 1.4, fontSize: 10 }]}>
                  {safeText('Yapmış olduğumuz görüşmeler sonrasında hazırlamış olduğumuz fiyat teklifimizi değerlendirmenize sunarız.')}
                </Text>
              </View>
            </View>
          )}
          
          {/* Teklif Bilgileri Container - Her zaman göster */}
          <View style={[styles.customerSection, { flex: 1, marginLeft: 20, marginBottom: 0, alignItems: 'center' }]}>
            <Text style={[styles.customerTitle, { textAlign: 'center', marginBottom: 10 }]}>
              {safeText('Teklif Bilgileri')}
            </Text>
            
            <View style={{ alignItems: 'center' }}>
              {/* Sabit 4 teklif bilgisi göster */}
              {renderProposalField('number')}
              {renderProposalField('created_at')}
              {renderProposalField('valid_until')}
              {renderProposalField('prepared_by')}
            </View>
          </View>
        </View>


        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            {/* Sıra Numarası Header */}
            {schema.lineTable.showRowNumber && (
              <View key="row-number" style={[styles.tableCell, { flex: 0.5 }]}>
                <Text style={[styles.tableCellHeader, { textAlign: 'center' }]}>
                  {safeText('#')}
                </Text>
              </View>
            )}
            {schema.lineTable.columns
              .filter(col => col.show)
              .map(col => (
                                  <View key={col.key} style={[styles.tableCell, { flex: col.key === 'description' ? 3 : 1 }]}>
                    <Text style={[styles.tableCellHeader, { textAlign: col.key === 'description' ? 'center' : col.key === 'total' ? 'right' : 'center' }]}>
                      {safeText(col.label)}
                    </Text>
                  </View>
              ))
            }
          </View>

          {/* Table Rows */}
          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              {/* Sıra Numarası */}
              {schema.lineTable.showRowNumber && (
                <View key="row-number" style={[styles.tableCell, { flex: 0.5 }]}>
                  <Text style={[styles.tableCell, { textAlign: 'center' }]}>
                    {safeText(String(index + 1))}
                  </Text>
                </View>
              )}
              {schema.lineTable.columns
                .filter(col => col.show)
                .map(col => (
                  <View key={col.key} style={[styles.tableCell, { flex: col.key === 'description' ? 3 : 1 }]}>
                    <Text style={[styles.tableCell, { textAlign: col.key === 'description' ? 'center' : col.key === 'total' ? 'right' : 'center' }]}>
                      {col.key === 'description' && safeText(item.description)}
                      {col.key === 'quantity' && safeText(`${item.quantity} ${item.unit || ''}`)}
                      {col.key === 'unit_price' && safeText(formatCurrency(item.unit_price, data.currency))}
                      {col.key === 'discount' && (item.discount_rate && item.discount_rate > 0 ? safeText(`%${item.discount_rate}`) : safeText('-'))}
                      {col.key === 'total' && safeText(formatCurrency(item.total, data.currency))}
                    </Text>
                  </View>
                ))
              }
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          {schema.totals.showGross && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{safeText('Ara Toplam:')}</Text>
              <Text style={styles.totalValue}>
                {safeText(formatCurrency(data.subtotal, data.currency))}
              </Text>
            </View>
          )}
          
          {schema.totals.showDiscount && data.total_discount && data.total_discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{safeText('İndirim:')}</Text>
              <Text style={styles.totalValue}>
                {safeText(`-${formatCurrency(data.total_discount, data.currency)}`)}
              </Text>
            </View>
          )}
          
          {schema.totals.showTax && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{safeText('KDV:')}</Text>
              <Text style={styles.totalValue}>
                {safeText(formatCurrency(data.total_tax, data.currency))}
              </Text>
            </View>
          )}
          
          {schema.totals.showNet && (
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabelFinal}>{safeText('Genel Toplam:')}</Text>
              <Text style={styles.totalValueFinal}>
                {safeText(formatCurrency(data.total_amount, data.currency))}
              </Text>
            </View>
          )}
        </View>


        {/* Notes */}
        <View style={styles.notesSection}>
          {data.notes && data.notes.trim() !== '' && (
            <Text style={styles.notesText}>{safeText(data.notes)}</Text>
          )}
          
          {/* Şartlar ve Koşullar - Template ayarlarına göre göster */}
          {(schema.notes.termsSettings?.showPaymentTerms && data.payment_terms && String(data.payment_terms).trim() !== '') ||
           (schema.notes.termsSettings?.showDeliveryTerms && data.delivery_terms && String(data.delivery_terms).trim() !== '') ||
           (schema.notes.termsSettings?.showWarrantyTerms && data.warranty_terms && String(data.warranty_terms).trim() !== '') ||
           (schema.notes.termsSettings?.showPriceTerms && data.price_terms && String(data.price_terms).trim() !== '') ||
           (schema.notes.termsSettings?.showOtherTerms && data.other_terms && String(data.other_terms).trim() !== '') ? (
            <>
              <Text style={[
                styles.sectionTitle,
                { textAlign: schema.notes.termsSettings?.titleAlign || 'left' }
              ]}>
                Şartlar ve Koşullar
              </Text>
              {schema.notes.termsSettings?.showPaymentTerms && data.payment_terms && String(data.payment_terms).trim() !== '' && (
                <Text style={styles.notesText}>{safeText(`Ödeme Şartları: ${data.payment_terms}`)}</Text>
              )}
              {schema.notes.termsSettings?.showDeliveryTerms && data.delivery_terms && String(data.delivery_terms).trim() !== '' && (
                <Text style={styles.notesText}>{safeText(`Teslimat Şartları: ${data.delivery_terms}`)}</Text>
              )}
              {schema.notes.termsSettings?.showWarrantyTerms && data.warranty_terms && String(data.warranty_terms).trim() !== '' && (
                <Text style={styles.notesText}>{safeText(`Garanti Şartları: ${data.warranty_terms}`)}</Text>
              )}
              {schema.notes.termsSettings?.showPriceTerms && data.price_terms && String(data.price_terms).trim() !== '' && (
                <Text style={styles.notesText}>{safeText(`Fiyat Şartları: ${data.price_terms}`)}</Text>
              )}
              {schema.notes.termsSettings?.showOtherTerms && data.other_terms && String(data.other_terms).trim() !== '' && (
                <Text style={styles.notesText}>{safeText(`Diğer Şartlar: ${data.other_terms}`)}</Text>
              )}
            </>
          ) : null}
        </View>

        {/* Footer */}
        {schema.notes.footer && schema.notes.footer.trim() !== '' && (
          <View style={styles.footer}>
            <Text style={{ fontSize: schema.notes.footerFontSize || 12 }}>
              {safeText(schema.notes.footer)}
            </Text>
          </View>
        )}
        </View>
        
        {/* Background Style - En son render edilir (arkada kalır) */}
        {renderBackgroundStyle()}

      </Page>
    </Document>
  );
};

export default PdfRenderer;
