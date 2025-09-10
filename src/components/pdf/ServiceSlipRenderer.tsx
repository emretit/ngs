import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { ServiceSlipData } from '@/types/service-slip';
import { formatDate, formatMoney } from '@/utils/pdfHelpers';

// Register fonts for better PDF rendering
Font.register({
  family: 'Roboto',
  src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2',
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    padding: 30,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #000000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  slipNumber: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: '30%',
    fontWeight: 'bold',
  },
  value: {
    width: '70%',
  },
  table: {
    border: '1 solid #000000',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottom: '1 solid #000000',
    padding: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #cccccc',
    padding: 5,
  },
  tableCol: {
    flex: 1,
    textAlign: 'center',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1 solid #cccccc',
  },
  signatureBox: {
    width: '45%',
    height: 60,
    border: '1 solid #000000',
    padding: 5,
  },
  signatureLabel: {
    textAlign: 'center',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666666',
  },
});

interface ServiceSlipRendererProps {
  data: ServiceSlipData;
}

const ServiceSlipDocument: React.FC<ServiceSlipRendererProps> = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>SERVİS FİŞİ</Text>
          <Text style={styles.slipNumber}>Fiş No: {data.slip_number}</Text>
        </View>

        {/* Service Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servis Bilgileri</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Düzenlenme Tarihi:</Text>
            <Text style={styles.value}>{formatDate(data.issue_date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tamamlanma Tarihi:</Text>
            <Text style={styles.value}>{data.completion_date ? formatDate(data.completion_date) : 'Devam ediyor'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Teknisyen:</Text>
            <Text style={styles.value}>{data.technician_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Servis Türü:</Text>
            <Text style={styles.value}>{data.service_details.service_type}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Müşteri Bilgileri</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Müşteri Adı:</Text>
            <Text style={styles.value}>{data.customer.name}</Text>
          </View>
          {data.customer.company && (
            <View style={styles.row}>
              <Text style={styles.label}>Şirket:</Text>
              <Text style={styles.value}>{data.customer.company}</Text>
            </View>
          )}
          {data.customer.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Telefon:</Text>
              <Text style={styles.value}>{data.customer.phone}</Text>
            </View>
          )}
          {data.customer.address && (
            <View style={styles.row}>
              <Text style={styles.label}>Adres:</Text>
              <Text style={styles.value}>{data.customer.address}</Text>
            </View>
          )}
        </View>

        {/* Equipment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ekipman Bilgileri</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Ekipman:</Text>
            <Text style={styles.value}>{data.equipment.name || 'Belirtilmemiş'}</Text>
          </View>
          {data.equipment.model && (
            <View style={styles.row}>
              <Text style={styles.label}>Model:</Text>
              <Text style={styles.value}>{data.equipment.model}</Text>
            </View>
          )}
          {data.equipment.serial_number && (
            <View style={styles.row}>
              <Text style={styles.label}>Seri No:</Text>
              <Text style={styles.value}>{data.equipment.serial_number}</Text>
            </View>
          )}
          {data.equipment.location && (
            <View style={styles.row}>
              <Text style={styles.label}>Konum:</Text>
              <Text style={styles.value}>{data.equipment.location}</Text>
            </View>
          )}
        </View>

        {/* Service Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servis Detayları</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Problem Tanımı:</Text>
          </View>
          <Text style={[styles.value, { marginBottom: 8, padding: 5, backgroundColor: '#f9f9f9' }]}>
            {data.service_details.problem_description}
          </Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Yapılan İşlemler:</Text>
          </View>
          <Text style={[styles.value, { marginBottom: 8, padding: 5, backgroundColor: '#f9f9f9' }]}>
            {data.service_details.work_performed}
          </Text>
        </View>

        {/* Parts Used */}
        {data.service_details.parts_used.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kullanılan Parçalar</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCol, { flex: 2 }]}>Parça Adı</Text>
                <Text style={styles.tableCol}>Miktar</Text>
                <Text style={styles.tableCol}>Birim Fiyat</Text>
                <Text style={styles.tableCol}>Toplam</Text>
              </View>
              {data.service_details.parts_used.map((part, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCol, { flex: 2 }]}>{part.name}</Text>
                  <Text style={styles.tableCol}>{part.quantity}</Text>
                  <Text style={styles.tableCol}>
                    {part.unit_price ? formatMoney(part.unit_price) : '-'}
                  </Text>
                  <Text style={styles.tableCol}>
                    {part.unit_price ? formatMoney(part.quantity * part.unit_price) : '-'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Teknisyen İmzası</Text>
            {data.technician_signature && (
              <Text style={{ fontSize: 8 }}>İmzalandı: {formatDate(new Date().toISOString())}</Text>
            )}
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Müşteri İmzası</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Bu belge {formatDate(new Date().toISOString())} tarihinde sistem tarafından oluşturulmuştur.</Text>
        </View>
      </Page>
    </Document>
  );
};

export const ServiceSlipRenderer = ServiceSlipDocument;
export default ServiceSlipDocument;