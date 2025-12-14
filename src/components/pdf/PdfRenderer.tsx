import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, Svg, Circle, Rect, Path, Polygon } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { QuoteData, TemplateSchema } from '@/types/pdf-template';

// Register fonts for Turkish character support
// Using reliable CDN sources with TTF format for @react-pdf/renderer

// Roboto - Turkish character support
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 'bold',
    }
  ]
});

// Open Sans - Using jsDelivr CDN
Font.register({
  family: 'Open Sans',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/apache/opensans/OpenSans-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/apache/opensans/OpenSans-Bold.ttf',
      fontWeight: 'bold',
    }
  ]
});

// Lato - Using jsDelivr CDN
Font.register({
  family: 'Lato',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/lato/Lato-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/lato/Lato-Bold.ttf',
      fontWeight: 'bold',
    }
  ]
});

// Montserrat - Using jsDelivr CDN
Font.register({
  family: 'Montserrat',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/montserrat/Montserrat-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/montserrat/Montserrat-Bold.ttf',
      fontWeight: 'bold',
    }
  ]
});

// Inter - Using jsDelivr CDN
Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/rsms/inter@v4.0.1/fonts/Inter-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/rsms/inter@v4.0.1/fonts/Inter-Bold.ttf',
      fontWeight: 'bold',
    }
  ]
});

// Poppins - Using jsDelivr CDN
Font.register({
  family: 'Poppins',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Bold.ttf',
      fontWeight: 'bold',
    }
  ]
});

// Nunito - Using jsDelivr CDN
Font.register({
  family: 'Nunito',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/nunito/Nunito-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/nunito/Nunito-Bold.ttf',
      fontWeight: 'bold',
    }
  ]
});

// Playfair Display (Serif) - Using jsDelivr CDN
Font.register({
  family: 'Playfair Display',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/playfairdisplay/PlayfairDisplay-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/playfairdisplay/PlayfairDisplay-Bold.ttf',
      fontWeight: 'bold',
    }
  ]
});

// Merriweather (Serif) - Using jsDelivr CDN
Font.register({
  family: 'Merriweather',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/merriweather/Merriweather-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/merriweather/Merriweather-Bold.ttf',
      fontWeight: 'bold',
    }
  ]
});

// Source Sans Pro - Using jsDelivr CDN
Font.register({
  family: 'Source Sans Pro',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/sourcesanspro/SourceSansPro-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/sourcesanspro/SourceSansPro-Bold.ttf',
      fontWeight: 'bold',
    }
  ]
});

// Helvetica, Times-Roman, Courier are built-in fonts in PDF, no need to register

// Safe text rendering function for Turkish characters
// Returns empty string for null/undefined, but ensures it's always used inside <Text> component
const safeText = (text: string | undefined | null): string => {
  if (!text) return '';
  // Ensure text is properly encoded
  const normalized = text.toString().normalize('NFC');
  // Return empty string if normalized result is empty
  return normalized.trim() === '' ? '' : normalized;
};

// Parse HTML-like formatting tags and return React-PDF Text components
// Parse HTML-like formatting tags and return React-PDF Text components
const parseFormattedText = (text: string, baseStyle: any): React.ReactElement => {
  if (!text) return <Text style={baseStyle}></Text>;
  
  const parts: React.ReactNode[] = [];
  
  // Match all formatting tags: <b>, <i>, <u>
  const tagRegex = /<(b|i|u)>(.*?)<\/\1>/g;
  let match;
  const matches: Array<{ start: number; end: number; tag: string; content: string }> = [];
  
  while ((match = tagRegex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      tag: match[1].toLowerCase(),
      content: match[2],
    });
  }
  
  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);
  
  // Build parts array
  let lastIndex = 0;
  
  matches.forEach((m) => {
    // Add text before the tag
    if (m.start > lastIndex) {
      const beforeText = text.substring(lastIndex, m.start);
      if (beforeText) {
        parts.push(beforeText);
      }
    }
    
    // Add formatted text
    const style: any = { ...baseStyle };
    if (m.tag === 'b') style.fontWeight = 'bold';
    if (m.tag === 'i') style.fontStyle = 'italic';
    if (m.tag === 'u') style.textDecoration = 'underline';
    
    parts.push(
      <Text key={`${m.start}-${m.end}`} style={style}>
        {m.content}
      </Text>
    );
    
    lastIndex = m.end;
  });
  
  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(remainingText);
    }
  }
  
  // If no matches, return plain text
  if (parts.length === 0) {
    return <Text style={baseStyle}>{text}</Text>;
  }
  
  return <Text style={baseStyle}>{parts}</Text>;
};

interface PdfRendererProps {
  data: QuoteData;
  schema: TemplateSchema;
}

const PdfRenderer: React.FC<PdfRendererProps> = ({ data, schema }) => {
  // Sayfa kenarlarını daha verimli kullan - maksimum 25px padding
  const maxPadding = 25;
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: schema.page.backgroundColor || '#FFFFFF',
      color: schema.page.fontColor || '#000000',
      paddingTop: Math.min(schema.page.padding.top, maxPadding),
      paddingRight: Math.min(schema.page.padding.right, maxPadding),
      paddingBottom: Math.min(schema.page.padding.bottom, maxPadding),
      paddingLeft: Math.min(schema.page.padding.left, maxPadding),
      fontSize: schema.page.fontSize,
      fontFamily: schema.page.fontFamily || 'Roboto',
      fontWeight: schema.page.fontWeight === 'bold' ? 'bold' : 'normal',
      minHeight: '100%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingBottom: 10,
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
      color: schema.page.fontColor || '#1F2937',
    },
    subtitle: {
      fontSize: 12,
      color: schema.page.fontColor || '#6B7280',
      marginTop: 5,
    },
    customerSection: {
      marginBottom: 12,
    },
    customerTitle: {
      fontSize: schema.customer?.customerTitleFontSize || 12,
      fontWeight: 'bold',
      marginBottom: 6,
      color: schema.page.fontColor || '#374151',
    },
    customerInfo: {
      fontSize: schema.customer?.customerInfoFontSize || 10,
      lineHeight: 1.4,
      color: schema.page.fontColor || '#4B5563',
    },
    table: {
      marginBottom: 12,
    },
    tableHeader: {
      flexDirection: 'row',
      borderBottomWidth: 2,
      borderBottomColor: '#E5E7EB',
      paddingBottom: 2,
      marginBottom: 1,
      alignItems: 'center', // Header içeriğini dikey olarak ortala
    },
    tableRow: {
      flexDirection: 'row',
      paddingTop: 1,
      paddingBottom: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: '#F3F4F6',
      alignItems: 'flex-start', // Üstten hizala
    },
    tableCell: {
      flex: 1,
      fontSize: 8, // Varsayılan font boyutu - tüm tablo hücreleri için
      justifyContent: 'flex-start', // Üstten başla
      paddingTop: 2,
    },
    tableCellHeader: {
      fontSize: 9, // Header'ları da küçült - tablo daha kompakt
      fontWeight: 'bold',
      color: schema.page.fontColor || '#374151',
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
      marginBottom: 12,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 3,
    },
    totalLabel: {
      fontSize: 10,
      color: schema.page.fontColor || '#6B7280',
    },
    totalValue: {
      fontSize: 10,
      fontWeight: 'bold',
      color: schema.page.fontColor || '#374151',
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
      color: schema.page.fontColor || '#1F2937',
    },
    totalValueFinal: {
      fontSize: 12,
      fontWeight: 'bold',
      color: schema.page.fontColor || '#1F2937',
    },
    notesSection: {
      marginTop: 10,
      marginBottom: 6,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 6,
      marginTop: 6,
      color: schema.page.fontColor || '#374151',
    },
    notesText: {
      fontSize: 9,
      color: schema.page.fontColor || '#6B7280',
      lineHeight: 1.4,
      marginBottom: 5,
    },
    footer: {
      marginTop: 'auto',
      paddingTop: 8,
      paddingBottom: 8,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      fontSize: 8,
      color: schema.page.fontColor || '#9CA3AF',
      textAlign: 'center',
      minHeight: 30,
      maxHeight: 60,
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
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

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    // Manual formatting to avoid symbol rendering issues in PDF
    const formatted = new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    
    const symbol = currency === 'TRY' ? 'TRY' : currency;
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

    const infoFontSize = schema?.customer?.customerInfoFontSize ?? 10;
    return (
      <Text key={fieldKey} style={{
        fontSize: infoFontSize,
        lineHeight: 1.4,
        color: schema.page.fontColor || '#4B5563',
        marginBottom: 3,
        textAlign: 'left'
      }}>
        {safeText(value)}
      </Text>
    );
  };

  const renderProposalField = (fieldKey: string) => {
    // Sadece 4 temel teklif bilgisi gösterilecek
    // offer_date varsa onu kullan, yoksa created_at'i kullan (fallback)
    const proposalDate = (data.offer_date as string) || (data.created_at as string);
    const fieldMap: Record<string, { label: string; value: string | undefined }> = {
      number: { label: 'Teklif No', value: data.number as string },
      created_at: { label: 'Tarih', value: proposalDate ? formatDate(proposalDate) : undefined },
      offer_date: { label: 'Tarih', value: proposalDate ? formatDate(proposalDate) : undefined },
      valid_until: { label: 'Geçerlilik', value: data.valid_until ? formatDate(data.valid_until as string) : undefined },
      prepared_by: { label: 'Hazırlayan', value: (data.prepared_by as string) || 'Belirtilmemiş' },
    };

    const field = fieldMap[fieldKey];
    // Check for empty strings as well
    if (!field || !field.value || field.value.trim() === '') return null;

    const infoFontSize = schema?.customer?.customerInfoFontSize ?? 10;
    return (
      <View key={fieldKey} style={{ flexDirection: 'row', marginBottom: 5, alignItems: 'center', justifyContent: 'space-between', width: 160 }}>
        <Text style={{
          fontSize: infoFontSize,
          lineHeight: 1.4,
          color: schema.page.fontColor || '#4B5563',
          fontWeight: 'bold',
          width: 60
        }}>
          {safeText(field.label)}
        </Text>
        <Text style={{
          fontSize: infoFontSize,
          lineHeight: 1.4,
          color: schema.page.fontColor || '#4B5563',
          fontWeight: 'bold',
          marginHorizontal: 4
        }}>:</Text>
        <Text style={{
          fontSize: infoFontSize,
          lineHeight: 1.4,
          color: schema.page.fontColor || '#4B5563',
          flex: 1
        }}>
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
        <View style={{ position: 'relative', flex: 1, flexDirection: 'column', minHeight: '100%' }}>
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          {/* Müşteri Bilgileri Container - Her zaman göster */}
          {data.customer && (
            <View style={[styles.customerSection, { flex: 2, marginRight: 20, marginBottom: 0, alignItems: 'flex-start' }]}>
              {/* Firma İsmi */}
              {data.customer?.company && data.customer.company.trim() !== '' && (() => {
                const titleFontSize = schema?.customer?.customerTitleFontSize ?? 12;
                return (
                  <Text style={{
                    fontSize: titleFontSize,
                    fontWeight: 'bold',
                    marginBottom: 10,
                    color: schema.page.fontColor || '#374151',
                    textAlign: 'left'
                  }}>
                    {safeText(String(data.customer.company).toUpperCase())}
                  </Text>
                );
              })()}
              
              <View style={{ alignItems: 'flex-start' }}>
                {/* Sayın Yetkili */}
                {(() => {
                  const infoFontSize = schema?.customer?.customerInfoFontSize ?? 10;
                  return (
                    <>
                      <Text style={{
                        fontSize: infoFontSize,
                        lineHeight: 1.4,
                        color: schema.page.fontColor || '#4B5563',
                        marginBottom: 8
                      }}>
                        {safeText('Sayın')}
                      </Text>
                      
                      {/* Müşteri Yetkilisi */}
                      {data.customer?.name && data.customer.name.trim() !== '' && (
                        <Text style={{
                          fontSize: infoFontSize,
                          lineHeight: 1.4,
                          color: schema.page.fontColor || '#4B5563',
                          marginBottom: 12,
                          fontWeight: 'bold'
                        }}>
                          {safeText(`${String(data.customer.name)},`)}
                        </Text>
                      )}
                      
                      {/* Açıklama Metni */}
                      <Text style={{
                        fontSize: infoFontSize,
                        lineHeight: 1.4,
                        color: schema.page.fontColor || '#4B5563'
                      }}>
                        {safeText('Yapmış olduğumuz görüşmeler sonrasında hazırlamış olduğumuz fiyat teklifimizi değerlendirmenize sunarız.')}
                      </Text>
                    </>
                  );
                })()}
              </View>
            </View>
          )}
          
          {/* Teklif Bilgileri Container - Her zaman göster */}
          <View style={[styles.customerSection, { flex: 1, marginLeft: 20, marginBottom: 0, alignItems: 'center' }]}>
            <Text style={[styles.customerTitle, { 
              textAlign: 'center', 
              marginBottom: 10,
              fontSize: schema.customer?.customerTitleFontSize || 12
            }]}>
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
              <View key="row-number" style={[styles.tableCell, { flex: 0.5, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={[styles.tableCellHeader, { textAlign: 'center' }]}>
                  {safeText('#')}
                </Text>
              </View>
            )}
            {schema.lineTable.columns
              .filter(col => col.show)
              .map(col => (
                <View key={col.key} style={[styles.tableCell, { flex: col.key === 'description' ? 3 : col.key === 'product_image' ? 1 : 1, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={[styles.tableCellHeader, { textAlign: col.key === 'description' ? 'center' : (col.key === 'total' || col.key === 'unit_price') ? 'right' : col.key === 'product_image' ? 'center' : 'center' }]}>
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
                <View key="row-number" style={[styles.tableCell, { flex: 0.5, justifyContent: 'center', alignItems: 'center', alignSelf: 'stretch' }]}>
                  <Text style={[styles.tableCell, { textAlign: 'center', fontSize: 8 }]}>
                    {safeText(String(index + 1))}
                  </Text>
                </View>
              )}
              {schema.lineTable.columns
                .filter(col => col.show)
                .map(col => {
                  // Product Image Column - Special handling
                  if (col.key === 'product_image') {
                    const imageUrl = (item as any).image_url || (item as any).product?.image_url;
                    // Debug: image_url durumunu logla (sadece development'ta)
                    if (process.env.NODE_ENV === 'development' && index === 0) {
                      console.log('PDF Render - Product Image Debug:', {
                        itemIndex: index,
                        itemId: (item as any).id,
                        productId: (item as any).product_id,
                        hasImageUrl: !!imageUrl,
                        imageUrl: imageUrl,
                        itemKeys: Object.keys(item as any),
                      });
                    }
                    return (
                      <View key={col.key} style={[styles.tableCell, { flex: 1, justifyContent: 'center', alignItems: 'center', alignSelf: 'stretch' }]}>
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            style={{ width: 40, height: 40, objectFit: 'contain' }}
                            cache={false}
                            // @react-pdf/renderer, Supabase Storage'dan görselleri direkt olarak fetch ediyor
                            // Eğer görsel yüklenemezse "-" gösterilecek
                          />
                        ) : (
                          <Text style={[styles.tableCell, { textAlign: 'center', color: '#9CA3AF' }]}>-</Text>
                        )}
                      </View>
                    );
                  }
                  
                  let cellContent: string | null = null;
                  if (col.key === 'description') {
                    const text = safeText(item.description);
                    cellContent = text && text.trim() !== '' ? text : null;
                  } else if (col.key === 'quantity') {
                    const text = safeText(`${item.quantity}${item.unit ? ` ${item.unit}` : ''}`);
                    cellContent = text && text.trim() !== '' ? text : null;
                  } else if (col.key === 'unit_price') {
                    const text = safeText(formatCurrency(item.unit_price, data.currency));
                    cellContent = text && text.trim() !== '' ? text : null;
                  } else if (col.key === 'discount') {
                    const text = (item.discount_rate && item.discount_rate > 0) ? safeText(`%${item.discount_rate}`) : safeText('-');
                    cellContent = text && text.trim() !== '' ? text : null;
                  } else if (col.key === 'total') {
                    const text = safeText(formatCurrency(item.total, data.currency));
                    cellContent = text && text.trim() !== '' ? text : null;
                  }
                  
                  if (!cellContent) {
                    cellContent = ' '; // Boş string yerine boşluk karakteri
                  }
                  
                  // Description sütunu için özel stil - metin sarılması için
                  const isDescription = col.key === 'description';
                  const isNumericColumn = ['quantity', 'unit_price', 'discount', 'total'].includes(col.key);
                  
                  // Her sütun için font boyutu
                  const cellFontSize = isDescription ? 9 : 8; // Açıklama 9px, diğer tüm sütunlar 8px
                  
                  return (
                    <View key={col.key} style={[
                      styles.tableCell, 
                      { 
                        flex: isDescription ? 3 : col.key === 'product_image' ? 1 : 1, 
                        justifyContent: 'flex-start', 
                        alignItems: isDescription ? 'flex-start' : 'center', 
                        alignSelf: 'stretch',
                        paddingRight: isDescription ? 6 : 2,
                        paddingLeft: isDescription ? 4 : 2,
                      }
                    ]}>
                      <Text style={{
                        fontSize: cellFontSize, // Açıkça belirtilmiş font boyutu
                        textAlign: isDescription ? 'left' : (col.key === 'total' || col.key === 'unit_price') ? 'right' : 'center',
                        lineHeight: 1.2,
                        color: schema.page.fontColor || '#000000',
                        fontWeight: isDescription ? 'bold' : 'normal', // Açıklama sütunu bold
                      }}>
                        {cellContent}
                      </Text>
                    </View>
                  );
                })
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
                <View style={{ flexDirection: 'row', marginBottom: 3, alignItems: 'flex-start' }}>
                  <View style={{ width: 80, flexShrink: 0 }}>
                    <Text style={[styles.notesText, { fontWeight: 'bold' }]}>Ödeme</Text>
                  </View>
                  <Text style={[styles.notesText, { fontWeight: 'bold', marginRight: 5 }]}>:</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notesText}>{safeText(String(data.payment_terms))}</Text>
                  </View>
                </View>
              )}
              {schema.notes.termsSettings?.showDeliveryTerms && data.delivery_terms && String(data.delivery_terms).trim() !== '' && (
                <View style={{ flexDirection: 'row', marginBottom: 3, alignItems: 'flex-start' }}>
                  <View style={{ width: 80, flexShrink: 0 }}>
                    <Text style={[styles.notesText, { fontWeight: 'bold' }]}>Teslimat</Text>
                  </View>
                  <Text style={[styles.notesText, { fontWeight: 'bold', marginRight: 5 }]}>:</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notesText}>{safeText(String(data.delivery_terms))}</Text>
                  </View>
                </View>
              )}
              {schema.notes.termsSettings?.showWarrantyTerms && data.warranty_terms && String(data.warranty_terms).trim() !== '' && (
                <View style={{ flexDirection: 'row', marginBottom: 3, alignItems: 'flex-start' }}>
                  <View style={{ width: 80, flexShrink: 0 }}>
                    <Text style={[styles.notesText, { fontWeight: 'bold' }]}>Garanti</Text>
                  </View>
                  <Text style={[styles.notesText, { fontWeight: 'bold', marginRight: 5 }]}>:</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notesText}>{safeText(String(data.warranty_terms))}</Text>
                  </View>
                </View>
              )}
              {schema.notes.termsSettings?.showPriceTerms && data.price_terms && String(data.price_terms).trim() !== '' && (
                <View style={{ flexDirection: 'row', marginBottom: 3, alignItems: 'flex-start' }}>
                  <View style={{ width: 80, flexShrink: 0 }}>
                    <Text style={[styles.notesText, { fontWeight: 'bold' }]}>Fiyatlandırma Koşulları</Text>
                  </View>
                  <Text style={[styles.notesText, { fontWeight: 'bold', marginRight: 5 }]}>:</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notesText}>{safeText(String(data.price_terms))}</Text>
                  </View>
                </View>
              )}
              {schema.notes.termsSettings?.showOtherTerms && data.other_terms && String(data.other_terms).trim() !== '' && (
                <View style={{ flexDirection: 'row', marginBottom: 3, alignItems: 'flex-start' }}>
                  <View style={{ width: 80, flexShrink: 0 }}>
                    <Text style={[styles.notesText, { fontWeight: 'bold' }]}>Ticari Şartlar</Text>
                  </View>
                  <Text style={[styles.notesText, { fontWeight: 'bold', marginRight: 5 }]}>:</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notesText}>{safeText(String(data.other_terms))}</Text>
                  </View>
                </View>
              )}
            </>
          ) : null}
        </View>

        {/* Footer */}
        {(schema.notes.footer && schema.notes.footer.trim() !== '') || (schema.notes.showFooterLogo && (schema.header as any).logoUrl) ? (
          <View style={[
            styles.footer,
            {
              flexDirection: 'row',
              gap: 8,
              alignItems: 'center',
            }
          ]}>
            {/* Footer Logo - Header'daki logoyu kullanır */}
            {schema.notes.showFooterLogo && (schema.header as any).logoUrl && (
              <View style={{
                justifyContent: 'center',
                alignItems: 'center',
                maxHeight: 44,
                overflow: 'hidden',
                flexShrink: 0,
              }}>
                <Image
                  style={{
                    width: schema.notes.footerLogoSize || 40,
                    maxHeight: 44,
                    objectFit: 'contain',
                  }}
                  src={(schema.header as any).logoUrl}
                />
              </View>
            )}

            {/* Footer Text */}
            {schema.notes.footer && schema.notes.footer.trim() !== '' && (
              parseFormattedText(schema.notes.footer, {
                fontSize: schema.notes.footerFontSize || 10,
                textAlign: 'center',
              })
            )}
          </View>
        ) : null}
        </View>
        
        {/* Background Style - En son render edilir (arkada kalır) */}
        {renderBackgroundStyle()}

      </Page>
    </Document>
  );
};

export default PdfRenderer;
