import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ServiceTemplateSchema, ServicePdfData, defaultServiceTemplateSchema } from '@/types/service-template';

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

const safeText = (text: string | undefined | null): string => {
  if (!text) return ' '; // Boş string yerine boşluk karakteri - Text component dışında kullanılırsa hata vermez
  const normalized = text.toString().normalize('NFC');
  // Boş string yerine boşluk karakteri döndür
  return normalized.trim() === '' ? ' ' : normalized;
};

interface ServicePdfRendererProps {
  data: ServicePdfData;
  schema: ServiceTemplateSchema;
}

const ServicePdfRenderer: React.FC<ServicePdfRendererProps> = ({ data, schema }) => {
  const maxPadding = 25;
  
  // Merge schema with defaults to ensure all properties exist
  const safeSchema: ServiceTemplateSchema = {
    ...defaultServiceTemplateSchema,
    ...schema,
    page: {
      ...defaultServiceTemplateSchema.page,
      ...(schema?.page || {}),
      padding: {
        ...defaultServiceTemplateSchema.page.padding,
        ...(schema?.page?.padding || {}),
      },
    },
    header: {
      ...defaultServiceTemplateSchema.header,
      ...(schema?.header || {}),
    },
    serviceInfo: {
      ...defaultServiceTemplateSchema.serviceInfo,
      ...(schema?.serviceInfo || {}),
    },
    partsTable: {
      ...defaultServiceTemplateSchema.partsTable,
      ...(schema?.partsTable || {}),
    },
    signatures: {
      ...defaultServiceTemplateSchema.signatures,
      ...(schema?.signatures || {}),
    },
    notes: {
      ...defaultServiceTemplateSchema.notes,
      ...(schema?.notes || {}),
    },
  };
  
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: safeSchema.page.backgroundColor || '#FFFFFF',
      color: safeSchema.page.fontColor || '#000000',
      paddingTop: Math.min(safeSchema.page.padding.top, maxPadding),
      paddingRight: Math.min(safeSchema.page.padding.right, maxPadding),
      paddingBottom: Math.min(safeSchema.page.padding.bottom, maxPadding),
      paddingLeft: Math.min(safeSchema.page.padding.left, maxPadding),
      fontSize: safeSchema.page.fontSize,
      fontFamily: safeSchema.page.fontFamily || 'Roboto',
      fontWeight: safeSchema.page.fontWeight === 'bold' ? 'bold' : 'normal',
    },
    header: {
      marginBottom: 10,
      paddingBottom: 6,
      borderBottomWidth: 2,
      borderBottomColor: '#E5E7EB',
    },
    logo: {
      width: safeSchema.header.logoSize || 80,
      height: 'auto',
      objectFit: 'contain',
    },
    title: {
      fontSize: safeSchema.header.titleFontSize || 18,
      fontWeight: 'bold',
      color: safeSchema.page.fontColor || '#1F2937',
    },
    companyInfo: {
      fontSize: safeSchema.header.companyInfoFontSize || 10,
      color: safeSchema.page.fontColor || '#6B7280',
    },
    section: {
      marginBottom: 8,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: safeSchema.serviceInfo.titleFontSize || 14,
      fontWeight: 'bold',
      marginBottom: 4,
      color: safeSchema.page.fontColor || '#374151',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      paddingBottom: 2,
    },
    infoRow: {
      flexDirection: 'row',
      marginBottom: 0,
      paddingVertical: 0,
      height: 'auto',
    },
    infoLabel: {
      fontSize: safeSchema.serviceInfo.infoFontSize || 10,
      fontWeight: 'bold',
      width: 120,
      color: safeSchema.page.fontColor || '#6B7280',
      lineHeight: 1.2,
      paddingVertical: 0,
      marginVertical: 0,
    },
    infoValue: {
      fontSize: safeSchema.serviceInfo.infoFontSize || 10,
      flex: 1,
      color: safeSchema.page.fontColor || '#374151',
      lineHeight: 1.2,
      paddingVertical: 0,
      marginVertical: 0,
    },
    infoValueContainer: {
      marginBottom: 6,
      paddingVertical: 2,
    },
    twoColumnRow: {
      flexDirection: 'row',
      gap: 20,
    },
    column: {
      flex: 1,
    },
    table: {
      marginBottom: 8,
    },
    tableHeader: {
      flexDirection: 'row',
      borderBottomWidth: 2,
      borderBottomColor: '#E5E7EB',
      paddingBottom: 4,
      marginBottom: 2,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 4,
      borderBottomWidth: 0.5,
      borderBottomColor: '#F3F4F6',
    },
    tableCell: {
      fontSize: 9,
      paddingHorizontal: 2,
    },
    tableCellHeader: {
      fontSize: 9,
      fontWeight: 'bold',
      color: safeSchema.page.fontColor || '#374151',
      paddingHorizontal: 2,
    },
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      fontSize: 9,
      fontWeight: 'bold',
    },
    footer: {
      marginTop: 'auto',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      fontSize: safeSchema.notes.footerFontSize || 10,
      color: safeSchema.page.fontColor || '#9CA3AF',
      textAlign: 'center',
    },
    signatureSection: {
      marginTop: 20,
      marginBottom: 10,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    signatureRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 10,
    },
    signatureBox: {
      width: '45%',
      alignItems: 'center',
    },
    signatureImage: {
      width: 150,
      height: 60,
      borderWidth: 1,
      borderColor: '#D1D5DB',
      borderStyle: 'dashed',
      marginBottom: 8,
      backgroundColor: '#F9FAFB',
    },
    signatureLabel: {
      fontSize: safeSchema.signatures?.fontSize || 10,
      fontWeight: 'bold',
      color: safeSchema.page.fontColor || '#374151',
      marginBottom: 4,
    },
    signatureName: {
      fontSize: (safeSchema.signatures?.fontSize || 10) - 1,
      color: safeSchema.page.fontColor || '#6B7280',
      marginTop: 4,
    },
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: tr });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' TL';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: 'Düşük',
      medium: 'Orta',
      high: 'Yüksek',
      urgent: 'Acil',
    };
    return labels[priority] || priority;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'Yeni',
      assigned: 'Atanmış',
      in_progress: 'Devam Ediyor',
      on_hold: 'Beklemede',
      completed: 'Tamamlandı',
      cancelled: 'İptal Edildi',
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#EF4444',
      urgent: '#DC2626',
    };
    return colors[priority] || '#6B7280';
  };

  const getColumnWidth = (key: string) => {
    const widths: Record<string, number> = {
      name: 40,
      quantity: 15,
      unit: 15,
      unitPrice: 15,
      total: 15,
    };
    return widths[key] || 20;
  };

  const visibleColumns = safeSchema.partsTable.columns.filter(col => col.show);

  // Convert page size to react-pdf compatible format
  const getPageSize = (size: 'A4' | 'A3' | 'Letter'): 'A4' | 'A3' | 'LETTER' => {
    if (size === 'Letter') return 'LETTER';
    return size;
  };

  return (
    <Document>
      <Page size={getPageSize(safeSchema.page.size)} style={styles.page}>
        {/* Header */}
        <View style={[
          styles.header,
          {
            flexDirection: safeSchema.header.logoPosition === 'center' ? 'column' : 'row',
            justifyContent: 
              safeSchema.header.logoPosition === 'center' ? 'center' :
              safeSchema.header.logoPosition === 'right' ? 'flex-end' : 
              'space-between',
            alignItems: safeSchema.header.logoPosition === 'center' ? 'center' : 'flex-start',
          }
        ]}>
          {/* Left Position Layout */}
          {(safeSchema.header.logoPosition === 'left' || !safeSchema.header.logoPosition) && (
            <>
              {/* Left Section - Logo and Company Info */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {/* Logo */}
                {safeSchema.header.showLogo && safeSchema.header.logoUrl && (
                  <View style={{ 
                    marginRight: 8, 
                    padding: 0, 
                    alignSelf: 'flex-start',
                    flexShrink: 0
                  }}>
                    <Image src={safeSchema.header.logoUrl} style={styles.logo} />
                  </View>
                )}
                
                {/* Company Info */}
                {safeSchema.header.showCompanyInfo && (
                  <View style={{ flex: 1, marginLeft: 0, paddingLeft: 0 }}>
                    {safeSchema.header.companyName && safeSchema.header.companyName.trim() && (
                      <Text style={{
                        fontSize: safeSchema.header.companyInfoFontSize || 12,
                        fontWeight: 'bold',
                        color: safeSchema.page.fontColor || '#1F2937',
                        marginBottom: 3,
                        marginLeft: 0,
                        paddingLeft: 0
                      }}>
                        {safeText(safeSchema.header.companyName)}
                      </Text>
                    )}
                    {safeSchema.header.companyAddress && safeSchema.header.companyAddress.trim() && (
                      <Text style={{
                        fontSize: (safeSchema.header.companyInfoFontSize || 12) - 1,
                        color: safeSchema.page.fontColor || '#4B5563',
                        marginBottom: 2,
                        marginLeft: 0,
                        paddingLeft: 0
                      }}>
                        {safeText(safeSchema.header.companyAddress)}
                      </Text>
                    )}
                    {safeSchema.header.companyPhone && safeSchema.header.companyPhone.trim() && (
                      <Text style={{
                        fontSize: (safeSchema.header.companyInfoFontSize || 12) - 1,
                        color: safeSchema.page.fontColor || '#4B5563',
                        marginBottom: 2,
                        marginLeft: 0,
                        paddingLeft: 0
                      }}>
                        Tel: {safeText(safeSchema.header.companyPhone)}
                      </Text>
                    )}
                    {safeSchema.header.companyEmail && safeSchema.header.companyEmail.trim() && (
                      <Text style={{
                        fontSize: (safeSchema.header.companyInfoFontSize || 12) - 1,
                        color: safeSchema.page.fontColor || '#4B5563',
                        marginBottom: 2,
                        marginLeft: 0,
                        paddingLeft: 0
                      }}>
                        E-posta: {safeText(safeSchema.header.companyEmail)}
                      </Text>
                    )}
                    {safeSchema.header.companyWebsite && safeSchema.header.companyWebsite.trim() && (
                      <Text style={{
                        fontSize: (safeSchema.header.companyInfoFontSize || 12) - 1,
                        color: safeSchema.page.fontColor || '#4B5563',
                        marginBottom: 2,
                        marginLeft: 0,
                        paddingLeft: 0
                      }}>
                        Web: {safeText(safeSchema.header.companyWebsite)}
                      </Text>
                    )}
                    {safeSchema.header.companyTaxNumber && safeSchema.header.companyTaxNumber.trim() && (
                      <Text style={{
                        fontSize: (safeSchema.header.companyInfoFontSize || 12) - 1,
                        color: safeSchema.page.fontColor || '#4B5563'
                      }}>
                        {safeText(safeSchema.header.companyTaxNumber)}
                      </Text>
                    )}
                  </View>
                )}
              </View>
              
              {/* Right Section - Title */}
              {(safeSchema.header.showTitle ?? true) && (
                <View style={{ textAlign: 'right', alignItems: 'flex-end' }}>
                  <Text style={styles.title}>{safeText(safeSchema.header.title)}</Text>
                </View>
              )}
            </>
          )}

          {/* Center Position Layout */}
          {safeSchema.header.logoPosition === 'center' && (
            <>
              {/* Logo */}
              {safeSchema.header.showLogo && safeSchema.header.logoUrl && (
                <View style={{ 
                  marginBottom: 15, 
                  alignItems: 'center', 
                  padding: 0, 
                  alignSelf: 'center',
                  flexShrink: 0
                }}>
                  <Image src={safeSchema.header.logoUrl} style={styles.logo} />
                </View>
              )}
              
              {/* Company Info */}
              {safeSchema.header.showCompanyInfo && (
                <View style={{ alignItems: 'center', marginBottom: 15 }}>
                  {safeSchema.header.companyName && safeSchema.header.companyName.trim() && (
                    <Text style={{
                      fontSize: safeSchema.header.companyInfoFontSize || 12,
                      fontWeight: 'bold',
                      color: safeSchema.page.fontColor || '#1F2937',
                      marginBottom: 3,
                      textAlign: 'center'
                    }}>
                      {safeText(safeSchema.header.companyName)}
                    </Text>
                  )}
                  {safeSchema.header.companyAddress && safeSchema.header.companyAddress.trim() && (
                    <Text style={{
                      fontSize: (safeSchema.header.companyInfoFontSize || 12) - 1,
                      color: safeSchema.page.fontColor || '#4B5563',
                      marginBottom: 2,
                      textAlign: 'center'
                    }}>
                      {safeText(safeSchema.header.companyAddress)}
                    </Text>
                  )}
                  {safeSchema.header.companyPhone && safeSchema.header.companyPhone.trim() && (
                    <Text style={{
                      fontSize: (safeSchema.header.companyInfoFontSize || 12) - 1,
                      color: safeSchema.page.fontColor || '#4B5563',
                      marginBottom: 2,
                      textAlign: 'center'
                    }}>
                      Tel: {safeText(safeSchema.header.companyPhone)}
                    </Text>
                  )}
                  {safeSchema.header.companyEmail && safeSchema.header.companyEmail.trim() && (
                    <Text style={{
                      fontSize: (safeSchema.header.companyInfoFontSize || 12) - 1,
                      color: safeSchema.page.fontColor || '#4B5563',
                      marginBottom: 2,
                      textAlign: 'center'
                    }}>
                      E-posta: {safeText(safeSchema.header.companyEmail)}
                    </Text>
                  )}
                  {safeSchema.header.companyWebsite && safeSchema.header.companyWebsite.trim() && (
                    <Text style={{
                      fontSize: (safeSchema.header.companyInfoFontSize || 12) - 1,
                      color: safeSchema.page.fontColor || '#4B5563',
                      marginBottom: 2,
                      textAlign: 'center'
                    }}>
                      Web: {safeText(safeSchema.header.companyWebsite)}
                    </Text>
                  )}
                  {safeSchema.header.companyTaxNumber && safeSchema.header.companyTaxNumber.trim() && (
                    <Text style={{
                      fontSize: (safeSchema.header.companyInfoFontSize || 12) - 1,
                      color: safeSchema.page.fontColor || '#4B5563',
                      textAlign: 'center'
                    }}>
                      {safeText(safeSchema.header.companyTaxNumber)}
                    </Text>
                  )}
                </View>
              )}
              
              {/* Title */}
              {(safeSchema.header.showTitle ?? true) && (
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.title}>{safeText(safeSchema.header.title)}</Text>
                </View>
              )}
            </>
          )}

          {/* Right Position Layout */}
          {safeSchema.header.logoPosition === 'right' && (
            <>
              {/* Left Section - Title */}
              {(safeSchema.header.showTitle ?? true) && (
                <View style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                  <Text style={styles.title}>{safeText(safeSchema.header.title)}</Text>
                </View>
              )}
              
              {/* Right Section - Company Info and Logo */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                {/* Company Info */}
                {safeSchema.header.showCompanyInfo && (
                  <View style={{ flex: 1, alignItems: 'flex-end', marginRight: 3 }}>
                    {safeSchema.header.companyName && safeSchema.header.companyName.trim() && (
                      <Text style={{
                        fontSize: safeSchema.header.companyInfoFontSize || 12,
                        fontWeight: 'bold',
                        color: safeSchema.page.fontColor || '#1F2937',
                        marginBottom: 3,
                        textAlign: 'right'
                      }}>
                        {safeText(safeSchema.header.companyName)}
                      </Text>
                    )}
                    {safeSchema.header.companyAddress && safeSchema.header.companyAddress.trim() && (
                      <Text style={{
                        fontSize: (safeSchema.header.companyInfoFontSize || 12) - 1,
                        color: safeSchema.page.fontColor || '#4B5563',
                        marginBottom: 2,
                        marginLeft: 0,
                        paddingLeft: 0,
                        textAlign: 'right'
                      }}>
                        {safeText(safeSchema.header.companyAddress)}
                      </Text>
                    )}
                    {safeSchema.header.companyPhone && safeSchema.header.companyPhone.trim() && (
                      <Text style={{
                        fontSize: (safeSchema.header.companyInfoFontSize || 12) - 1,
                        color: safeSchema.page.fontColor || '#4B5563',
                        marginBottom: 2,
                        marginLeft: 0,
                        paddingLeft: 0,
                        textAlign: 'right'
                      }}>
                        Tel: {safeText(safeSchema.header.companyPhone)}
                      </Text>
                    )}
                    {safeSchema.header.companyEmail && safeSchema.header.companyEmail.trim() && (
                      <Text style={{
                        fontSize: (safeSchema.header.companyInfoFontSize || 12) - 1,
                        color: safeSchema.page.fontColor || '#4B5563',
                        marginBottom: 2,
                        marginLeft: 0,
                        paddingLeft: 0,
                        textAlign: 'right'
                      }}>
                        E-posta: {safeText(safeSchema.header.companyEmail)}
                      </Text>
                    )}
                    {safeSchema.header.companyWebsite && safeSchema.header.companyWebsite.trim() && (
                      <Text style={{
                        fontSize: (safeSchema.header.companyInfoFontSize || 12) - 1,
                        color: safeSchema.page.fontColor || '#4B5563',
                        marginBottom: 2,
                        marginLeft: 0,
                        paddingLeft: 0,
                        textAlign: 'right'
                      }}>
                        Web: {safeText(safeSchema.header.companyWebsite)}
                      </Text>
                    )}
                    {safeSchema.header.companyTaxNumber && safeSchema.header.companyTaxNumber.trim() && (
                      <Text style={{
                        fontSize: (safeSchema.header.companyInfoFontSize || 12) - 1,
                        color: safeSchema.page.fontColor || '#4B5563',
                        textAlign: 'right'
                      }}>
                        {safeText(safeSchema.header.companyTaxNumber)}
                      </Text>
                    )}
                  </View>
                )}
                
                {/* Logo */}
                {safeSchema.header.showLogo && safeSchema.header.logoUrl && (
                  <View style={{ 
                    padding: 0, 
                    alignSelf: 'flex-start',
                    flexShrink: 0
                  }}>
                    <Image src={safeSchema.header.logoUrl} style={styles.logo} />
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        {/* Service Info and Customer Info - Two Column Layout */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, marginTop: 6 }}>
          {/* Servis Bilgileri - Left Column */}
          <View style={{ flex: 1, marginRight: 12, marginBottom: 0 }}>
            <Text style={styles.sectionTitle}>Servis Bilgileri</Text>
            
            <View style={{ marginTop: 4 }}>
              {safeSchema.serviceInfo.showServiceNumber && (
                <View style={{ marginBottom: 2 }}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Servis No:</Text>
                    <Text style={styles.infoValue}>{safeText(data.serviceNumber)}</Text>
                  </View>
                </View>
              )}
              <View style={{ marginBottom: 2 }}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Servis Başlığı:</Text>
                  <Text style={styles.infoValue}>{safeText(data.serviceTitle)}</Text>
                </View>
              </View>
              {safeSchema.serviceInfo.showServiceStatus && data.status && (
                <View style={{ marginBottom: 2 }}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Servis Durumu:</Text>
                    <Text style={styles.infoValue}>{safeText(getStatusLabel(data.status))}</Text>
                  </View>
                </View>
              )}
              {safeSchema.serviceInfo.showServiceType && data.serviceType && (
                <View style={{ marginBottom: 2 }}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Servis Tipi:</Text>
                    <Text style={styles.infoValue}>{safeText(data.serviceType)}</Text>
                  </View>
                </View>
              )}
              {safeSchema.serviceInfo.showDates && data.reportedDate && (
                <View style={{ marginBottom: 2 }}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Bildirim Tarihi:</Text>
                    <Text style={styles.infoValue}>{safeText(formatDate(data.reportedDate))}</Text>
                  </View>
                </View>
              )}
              {safeSchema.serviceInfo.showTechnician && data.technician?.name && (
                <View style={{ marginBottom: 2 }}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Teknisyen:</Text>
                    <Text style={styles.infoValue}>{safeText(data.technician.name)}</Text>
                  </View>
                </View>
              )}
              {data.serviceDescription && (
                <View style={{ marginTop: 4, marginBottom: 6 }}>
                  <Text style={styles.infoLabel}>Servis Açıklaması:</Text>
                  <Text style={[styles.infoValue, { marginTop: 2 }]}>
                    {safeText(data.serviceDescription)}
                  </Text>
                </View>
              )}
              {data.serviceResult && (
                <View style={{ marginTop: 12, marginBottom: 14 }}>
                  <Text style={styles.infoLabel}>Servis Sonucu:</Text>
                  <Text style={[styles.infoValue, { marginTop: 2 }]}>
                    {safeText(data.serviceResult)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Müşteri Bilgileri - Right Column */}
          {data.customer && (
            <View style={{ flex: 1, marginLeft: 12, marginBottom: 0 }}>
              <Text style={[styles.sectionTitle, { fontSize: safeSchema.serviceInfo?.titleFontSize || 14 }]}>
                Müşteri Bilgileri
              </Text>
              <View style={{ marginTop: 4 }}>
                {data.customer.company && (
                  <View style={{ marginBottom: 2 }}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Şirket:</Text>
                      <Text style={styles.infoValue}>{safeText(data.customer.company)}</Text>
                    </View>
                  </View>
                )}
                {data.customer.name && (
                  <View style={{ marginBottom: 2 }}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Ad:</Text>
                      <Text style={styles.infoValue}>{safeText(data.customer.name)}</Text>
                    </View>
                  </View>
                )}
                {data.customer.phone && (
                  <View style={{ marginBottom: 2 }}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Telefon:</Text>
                      <Text style={styles.infoValue}>{safeText(data.customer.phone)}</Text>
                    </View>
                  </View>
                )}
                {data.customer.email && (
                  <View style={{ marginBottom: 2 }}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>E-posta:</Text>
                      <Text style={styles.infoValue}>{safeText(data.customer.email)}</Text>
                    </View>
                  </View>
                )}
                {data.customer.address && (
                  <View style={{ marginBottom: 2 }}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Adres:</Text>
                      <Text style={styles.infoValue}>{safeText(data.customer.address)}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Parts Table */}
        {safeSchema.partsTable.show && data.parts && data.parts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: 10 }]}>Kullanılan Ürünler</Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                {safeSchema.partsTable.showRowNumber && (
                  <Text style={[styles.tableCellHeader, { width: '8%', textAlign: 'center' }]}>#</Text>
                )}
                {visibleColumns.map((col) => (
                  <Text
                    key={col.key}
                    style={[
                      styles.tableCellHeader,
                      { width: `${getColumnWidth(col.key)}%`, textAlign: col.align },
                    ]}
                  >
                    {col.label}
                  </Text>
                ))}
              </View>

              {/* Table Rows */}
              {data.parts.map((part, index) => (
                <View key={part.id} style={styles.tableRow}>
                  {safeSchema.partsTable.showRowNumber && (
                    <Text style={[styles.tableCell, { width: '8%', textAlign: 'center' }]}>
                      {index + 1}
                    </Text>
                  )}
                  {visibleColumns.map((col) => {
                    let value = '';
                    switch (col.key) {
                      case 'name':
                        value = part.name || ' ';
                        break;
                      case 'quantity':
                        value = String(part.quantity || ' ');
                        break;
                      case 'unit':
                        value = part.unit || '-';
                        break;
                      case 'unitPrice':
                        value = formatCurrency(part.unitPrice);
                        break;
                      case 'total':
                        value = formatCurrency(part.total);
                        break;
                    }
                    // Ensure value is never empty string
                    if (!value || value.trim() === '') {
                      value = ' ';
                    }
                    return (
                      <Text
                        key={col.key}
                        style={[
                          styles.tableCell,
                          { width: `${getColumnWidth(col.key)}%`, textAlign: col.align },
                        ]}
                      >
                        {safeText(value)}
                      </Text>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Signatures */}
        {safeSchema.signatures?.show && (
          <View style={styles.signatureSection}>
            <View style={styles.signatureRow}>
              {/* Technician Signature */}
              {safeSchema.signatures.showTechnician && (
                <View style={styles.signatureBox}>
                  {data.technicianSignature ? (
                    <Image src={data.technicianSignature} style={styles.signatureImage} />
                  ) : (
                    <View style={styles.signatureImage} />
                  )}
                  <Text style={styles.signatureLabel}>
                    {safeSchema.signatures.technicianLabel || 'Teknisyen'}
                  </Text>
                  {data.technician?.name && (
                    <Text style={styles.signatureName}>{safeText(data.technician.name)}</Text>
                  )}
                </View>
              )}

              {/* Customer Signature */}
              {safeSchema.signatures.showCustomer && (
                <View style={styles.signatureBox}>
                  {data.customerSignature ? (
                    <Image src={data.customerSignature} style={styles.signatureImage} />
                  ) : (
                    <View style={styles.signatureImage} />
                  )}
                  <Text style={styles.signatureLabel}>
                    {safeSchema.signatures.customerLabel || 'Müşteri'}
                  </Text>
                  {data.customer?.name && (
                    <Text style={styles.signatureName}>{safeText(data.customer.name)}</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        {safeSchema.notes?.footer && safeSchema.notes.footer.trim() && (
          <View style={styles.footer}>
            <Text>{safeText(safeSchema.notes.footer)}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default ServicePdfRenderer;
