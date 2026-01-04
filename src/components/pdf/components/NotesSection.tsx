import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { QuoteData, TemplateSchema } from '@/types/pdf-template';
import { safeText } from '../utils/pdfTextUtils';

interface NotesSectionProps {
  data: QuoteData;
  schema: TemplateSchema;
  styles: any;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ data, schema, styles }) => {
  const hasTerms = 
    (schema.notes.termsSettings?.showPaymentTerms && data.payment_terms && String(data.payment_terms).trim() !== '') ||
    (schema.notes.termsSettings?.showDeliveryTerms && data.delivery_terms && String(data.delivery_terms).trim() !== '') ||
    (schema.notes.termsSettings?.showWarrantyTerms && data.warranty_terms && String(data.warranty_terms).trim() !== '') ||
    (schema.notes.termsSettings?.showPriceTerms && data.price_terms && String(data.price_terms).trim() !== '') ||
    (schema.notes.termsSettings?.showOtherTerms && data.other_terms && String(data.other_terms).trim() !== '');

  return (
    <View wrap={false} style={styles.notesSection}>
      {data.notes && data.notes.trim() !== '' && (
        <Text style={styles.notesText}>{safeText(data.notes)}</Text>
      )}
      
      {/* Şartlar ve Koşullar - Template ayarlarına göre göster */}
      {hasTerms ? (
        <View wrap={false}>
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
        </View>
      ) : null}
    </View>
  );
};

