import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { QuoteData, TemplateSchema } from '@/types/pdf-template';

// Register fonts for Turkish character support
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

// Safe text rendering function for Turkish characters
const safeText = (text: string): string => {
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
      backgroundColor: '#FFFFFF',
      paddingTop: schema.page.padding.top,
      paddingRight: schema.page.padding.right,
      paddingBottom: schema.page.padding.bottom,
      paddingLeft: schema.page.padding.left,
      fontSize: schema.page.fontSize,
      fontFamily: 'Roboto',
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

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    // Manual formatting to avoid symbol rendering issues in PDF
    const formatted = new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    
    const symbol = currency === 'TRY' ? '₺' : currency;
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
    if (!value) return null;

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
    if (!field || !field.value) return null;

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

  return (
    <Document>
      <Page size={schema.page.size === "LETTER" ? "LETTER" : schema.page.size} style={styles.page}>
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
                    {schema.header.companyName && (
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
                    {schema.header.companyAddress && (
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
                    {schema.header.companyPhone && (
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
                    {schema.header.companyEmail && (
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
                    {schema.header.companyWebsite && (
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
                    {schema.header.companyTaxNumber && (
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
                  {schema.header.companyName && (
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
                  {schema.header.companyAddress && (
                    <Text style={{
                      fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                      color: '#4B5563',
                      marginBottom: 2,
                      textAlign: 'center'
                    }}>
                      {safeText(schema.header.companyAddress)}
                    </Text>
                  )}
                  {schema.header.companyPhone && (
                    <Text style={{
                      fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                      color: '#4B5563',
                      marginBottom: 2,
                      textAlign: 'center'
                    }}>
                      Tel: {safeText(schema.header.companyPhone)}
                    </Text>
                  )}
                  {schema.header.companyEmail && (
                    <Text style={{
                      fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                      color: '#4B5563',
                      marginBottom: 2,
                      textAlign: 'center'
                    }}>
                      E-posta: {safeText(schema.header.companyEmail)}
                    </Text>
                  )}
                  {schema.header.companyWebsite && (
                    <Text style={{
                      fontSize: (schema.header.companyInfoFontSize || 12) - 1,
                      color: '#4B5563',
                      marginBottom: 2,
                      textAlign: 'center'
                    }}>
                      Web: {safeText(schema.header.companyWebsite)}
                    </Text>
                  )}
                  {schema.header.companyTaxNumber && (
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
                    {schema.header.companyName && (
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
                    {schema.header.companyAddress && (
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
                    {schema.header.companyPhone && (
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
                    {schema.header.companyEmail && (
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
                    {schema.header.companyWebsite && (
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
                    {schema.header.companyTaxNumber && (
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

        {/* Custom Header Fields */}
        {(schema.notes as any).customFields?.filter((field: any) => field.position === 'header').map((field: any) => (
          <View key={field.id} style={[styles.customField, { textAlign: field.style?.align || 'left' }]}>
            <Text style={[
              styles.customFieldText,
              {
                fontSize: field.style?.fontSize || 12,
                fontWeight: field.style?.bold ? 'bold' : 'normal',
                color: field.style?.color || '#000000',
              }
            ]}>
              {safeText(field.text)}
            </Text>
          </View>
        ))}

        {/* Customer and Quote Information Container */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
          {/* Müşteri Bilgileri Container - Her zaman göster */}
          {data.customer && (
            <View style={[styles.customerSection, { flex: 2, marginRight: 20, marginBottom: 0, alignItems: 'flex-start' }]}>
              {/* Firma İsmi */}
              {data.customer?.company && (
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
                {data.customer?.name && (
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

        {/* Custom Before-Table Fields */}
        {(schema.notes as any).customFields?.filter((field: any) => field.position === 'before-table').map((field: any) => (
          <View key={field.id} style={[styles.customField, { textAlign: field.style?.align || 'left' }]}>
            <Text style={[
              styles.customFieldText,
              {
                fontSize: field.style?.fontSize || 12,
                fontWeight: field.style?.bold ? 'bold' : 'normal',
                color: field.style?.color || '#000000',
              }
            ]}>
              {safeText(field.text)}
            </Text>
          </View>
        ))}

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            {schema.lineTable.columns
              .filter(col => col.show)
              .map(col => (
                                  <View key={col.key} style={[styles.tableCell, { flex: col.key === 'description' ? 3 : 1 }]}>
                    <Text style={[styles.tableCellHeader, { textAlign: col.key === 'total' ? 'right' : 'center' }]}>
                      {safeText(col.label)}
                    </Text>
                  </View>
              ))
            }
          </View>

          {/* Table Rows */}
          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              {schema.lineTable.columns
                .filter(col => col.show)
                .map(col => (
                  <View key={col.key} style={[styles.tableCell, { flex: col.key === 'description' ? 3 : 1 }]}>
                    <Text style={[styles.tableCell, { textAlign: col.key === 'description' ? 'left' : col.key === 'total' ? 'right' : 'center' }]}>
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

        {/* Custom After-Table Fields */}
        {(schema.notes as any).customFields?.filter((field: any) => field.position === 'after-table').map((field: any) => (
          <View key={field.id} style={[styles.customField, { textAlign: field.style?.align || 'left' }]}>
            <Text style={[
              styles.customFieldText,
              {
                fontSize: field.style?.fontSize || 12,
                fontWeight: field.style?.bold ? 'bold' : 'normal',
                color: field.style?.color || '#000000',
              }
            ]}>
              {safeText(field.text)}
            </Text>
          </View>
        ))}

        {/* Notes */}
        <View style={styles.notesSection}>
          {schema.notes.intro && (
            <Text style={[styles.notesText, { fontSize: schema.notes.introFontSize || 12 }]}>
              {safeText(schema.notes.intro)}
            </Text>
          )}
          {data.notes && (
            <Text style={styles.notesText}>{safeText(data.notes)}</Text>
          )}
          {data.payment_terms && (
            <Text style={styles.notesText}>{safeText(`Ödeme Şartları: ${data.payment_terms}`)}</Text>
          )}
          {data.delivery_terms && (
            <Text style={styles.notesText}>{safeText(`Teslimat Şartları: ${data.delivery_terms}`)}</Text>
          )}
          {data.warranty_terms && (
            <Text style={styles.notesText}>{safeText(`Garanti Şartları: ${data.warranty_terms}`)}</Text>
          )}
        </View>

        {/* Footer */}
        {schema.notes.footer && (
          <View style={styles.footer}>
            <Text style={{ fontSize: schema.notes.footerFontSize || 12 }}>
              {safeText(schema.notes.footer)}
            </Text>
          </View>
        )}

        {/* Custom Footer Fields */}
        {(schema.notes as any).customFields?.filter((field: any) => field.position === 'footer').map((field: any) => (
          <View key={field.id} style={[styles.footer, { textAlign: field.style?.align || 'left' }]}>
            <Text style={[
              styles.notesText,
              {
                fontSize: field.style?.fontSize || 12,
                fontWeight: field.style?.bold ? 'bold' : 'normal',
                color: field.style?.color || '#000000',
              }
            ]}>
              {safeText(field.text)}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );
};

export default PdfRenderer;
