import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ServiceTemplateSchema, ServicePdfData } from '@/types/service-template';

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
  if (!text) return '';
  return text.toString().normalize('NFC');
};

interface ServicePdfRendererProps {
  data: ServicePdfData;
  schema: ServiceTemplateSchema;
}

const ServicePdfRenderer: React.FC<ServicePdfRendererProps> = ({ data, schema }) => {
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
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
      paddingBottom: 10,
      borderBottomWidth: 2,
      borderBottomColor: '#E5E7EB',
    },
    logo: {
      width: schema.header.logoSize || 80,
      height: 'auto',
      objectFit: 'contain',
    },
    title: {
      fontSize: schema.header.titleFontSize || 18,
      fontWeight: 'bold',
      color: schema.page.fontColor || '#1F2937',
    },
    companyInfo: {
      fontSize: schema.header.companyInfoFontSize || 10,
      color: schema.page.fontColor || '#6B7280',
      textAlign: 'right',
    },
    section: {
      marginBottom: 12,
      marginTop: 8,
    },
    sectionTitle: {
      fontSize: schema.serviceInfo.titleFontSize || 14,
      fontWeight: 'bold',
      marginBottom: 8,
      color: schema.page.fontColor || '#374151',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      paddingBottom: 4,
    },
    infoRow: {
      flexDirection: 'row',
      marginBottom: 0,
      paddingVertical: 0,
      height: 'auto',
    },
    infoLabel: {
      fontSize: schema.serviceInfo.infoFontSize || 10,
      fontWeight: 'bold',
      width: 120,
      color: schema.page.fontColor || '#6B7280',
      lineHeight: 1.2,
      paddingVertical: 0,
      marginVertical: 0,
    },
    infoValue: {
      fontSize: schema.serviceInfo.infoFontSize || 10,
      flex: 1,
      color: schema.page.fontColor || '#374151',
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
      marginBottom: 12,
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
      color: schema.page.fontColor || '#374151',
      paddingHorizontal: 2,
    },
    instructionItem: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    instructionNumber: {
      fontSize: schema.instructions.fontSize || 10,
      fontWeight: 'bold',
      width: 20,
      color: schema.page.fontColor || '#6B7280',
    },
    instructionText: {
      fontSize: schema.instructions.fontSize || 10,
      flex: 1,
      color: schema.page.fontColor || '#374151',
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
      fontSize: schema.notes.footerFontSize || 10,
      color: schema.page.fontColor || '#9CA3AF',
      textAlign: 'center',
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

  const visibleColumns = schema.partsTable.columns.filter(col => col.show);

  return (
    <Document>
      <Page size={schema.page.size} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            {schema.header.showLogo && schema.header.logoUrl && (
              <Image src={schema.header.logoUrl} style={styles.logo} />
            )}
            {schema.header.showTitle && (
              <Text style={styles.title}>{safeText(schema.header.title)}</Text>
            )}
          </View>
          {schema.header.showCompanyInfo && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.companyInfo, { fontWeight: 'bold', fontSize: 12 }]}>
                {safeText(schema.header.companyName)}
              </Text>
              <Text style={styles.companyInfo}>{safeText(schema.header.companyAddress)}</Text>
              <Text style={styles.companyInfo}>{safeText(schema.header.companyPhone)}</Text>
              <Text style={styles.companyInfo}>{safeText(schema.header.companyEmail)}</Text>
            </View>
          )}
        </View>

        {/* Service Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servis Bilgileri</Text>
          
          <View style={styles.twoColumnRow}>
            <View style={styles.column}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Servis No:</Text>
                <Text style={styles.infoValue}>{safeText(data.serviceNumber)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Servis Başlığı:</Text>
                <Text style={styles.infoValue}>{safeText(data.serviceTitle)}</Text>
              </View>
              {schema.serviceInfo.showServiceType && data.serviceType && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Servis Tipi:</Text>
                  <Text style={styles.infoValue}>{safeText(data.serviceType)}</Text>
                </View>
              )}
              {schema.serviceInfo.showPriority && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Öncelik:</Text>
                  <Text style={[styles.infoValue, { color: getPriorityColor(data.priority) }]}>
                    {getPriorityLabel(data.priority)}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.column}>
              {schema.serviceInfo.showDates && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Bildirim Tarihi:</Text>
                    <Text style={styles.infoValue}>{formatDate(data.reportedDate)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Hedef Tarih:</Text>
                    <Text style={styles.infoValue}>{formatDate(data.dueDate)}</Text>
                  </View>
                </>
              )}
              {schema.serviceInfo.showEstimatedDuration && data.estimatedDuration && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tahmini Süre:</Text>
                  <Text style={styles.infoValue}>{data.estimatedDuration} dakika</Text>
                </View>
              )}
              {schema.serviceInfo.showLocation && data.location && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Konum:</Text>
                  <Text style={styles.infoValue}>{safeText(data.location)}</Text>
                </View>
              )}
            </View>
          </View>
          
          {data.serviceDescription && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.infoLabel}>Açıklama:</Text>
              <Text style={[styles.infoValue, { marginTop: 4 }]}>
                {safeText(data.serviceDescription)}
              </Text>
            </View>
          )}
        </View>

        {/* Customer & Technician Info */}
        <View style={[styles.twoColumnRow, { marginTop: 12, marginBottom: 16 }]}>
          {/* Customer Info */}
          {data.customer && (
            <View style={[styles.column, { marginRight: 15, paddingRight: 10 }]}>
              <Text style={styles.sectionTitle}>Müşteri Bilgileri</Text>
              <View style={{ marginTop: 8, gap: 4 }}>
                {data.customer.name && (
                  <View style={{ marginBottom: 4 }}>
                    <Text style={styles.infoValue}>{safeText(data.customer.name)}</Text>
                  </View>
                )}
                {data.customer.company && (
                  <View style={{ marginBottom: 4 }}>
                    <Text style={styles.infoValue}>{safeText(data.customer.company)}</Text>
                  </View>
                )}
                {data.customer.phone && (
                  <View style={{ marginBottom: 4 }}>
                    <Text style={styles.infoValue}>{safeText(data.customer.phone)}</Text>
                  </View>
                )}
                {data.customer.email && (
                  <View style={{ marginBottom: 4 }}>
                    <Text style={styles.infoValue}>{safeText(data.customer.email)}</Text>
                  </View>
                )}
                {data.customer.address && (
                  <View style={{ marginBottom: 4 }}>
                    <Text style={styles.infoValue}>
                      {safeText(data.customer.address)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Technician Info */}
          {schema.serviceInfo.showTechnician && data.technician && (
            <View style={[styles.column, { marginLeft: 15, paddingLeft: 10 }]}>
              <Text style={styles.sectionTitle}>Teknisyen Bilgileri</Text>
              <View style={{ marginTop: 8, gap: 4 }}>
                {data.technician.name && (
                  <View style={{ marginBottom: 4 }}>
                    <Text style={styles.infoValue}>{safeText(data.technician.name)}</Text>
                  </View>
                )}
                {data.technician.phone && (
                  <View style={{ marginBottom: 4 }}>
                    <Text style={styles.infoValue}>{safeText(data.technician.phone)}</Text>
                  </View>
                )}
                {data.technician.email && (
                  <View style={{ marginBottom: 4 }}>
                    <Text style={styles.infoValue}>{safeText(data.technician.email)}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Parts Table */}
        {schema.partsTable.show && data.parts && data.parts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kullanılan Parçalar</Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                {schema.partsTable.showRowNumber && (
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
                  {schema.partsTable.showRowNumber && (
                    <Text style={[styles.tableCell, { width: '8%', textAlign: 'center' }]}>
                      {index + 1}
                    </Text>
                  )}
                  {visibleColumns.map((col) => {
                    let value = '';
                    switch (col.key) {
                      case 'name':
                        value = part.name;
                        break;
                      case 'quantity':
                        value = String(part.quantity);
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

        {/* Instructions */}
        {schema.instructions.show && data.instructions && data.instructions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: schema.instructions.titleFontSize }]}>
              Yapılacak İşlemler
            </Text>
            {data.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>{index + 1}.</Text>
                <Text style={styles.instructionText}>{safeText(instruction)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notlar</Text>
            <Text style={styles.infoValue}>{safeText(data.notes)}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{safeText(schema.notes.footer)}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ServicePdfRenderer;
