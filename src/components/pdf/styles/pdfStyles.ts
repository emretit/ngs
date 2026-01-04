import { StyleSheet } from '@react-pdf/renderer';
import { TemplateSchema } from '@/types/pdf-template';

/**
 * Creates PDF styles based on template schema
 */
export const createPdfStyles = (schema: TemplateSchema) => {
  // Sayfa kenarlarını daha verimli kullan - maksimum 25px padding
  const maxPadding = 25;
  
  return StyleSheet.create({
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
    signatureSection: {
      marginTop: 20,
      marginBottom: 12,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    signatureRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-start',
      marginTop: 10,
    },
    signatureBox: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: 10,
    },
    signatureImage: {
      width: 120,
      height: 60,
      borderWidth: 1,
      borderColor: '#D1D5DB',
      borderStyle: 'dashed',
      marginBottom: 5,
      backgroundColor: '#FFFFFF',
    },
    signatureLabel: {
      fontSize: schema.signatures?.fontSize || 10,
      fontWeight: 'bold',
      color: schema.page.fontColor || '#374151',
      marginBottom: 4,
    },
    signatureName: {
      fontSize: (schema.signatures?.fontSize || 10) - 1,
      color: schema.page.fontColor || '#6B7280',
      marginTop: 4,
    },
  });
};

