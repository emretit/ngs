import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { QuoteData, TemplateSchema } from '@/types/pdf-template';
import { safeText } from '../utils/pdfTextUtils';

interface SignaturesSectionProps {
  data: QuoteData;
  schema: TemplateSchema;
  styles: any;
}

export const SignaturesSection: React.FC<SignaturesSectionProps> = ({ data, schema, styles }) => {
  if (!schema.signatures?.show) {
    return null;
  }

  return (
    <View wrap={false} style={styles.signatureSection}>
      <View wrap={false} style={styles.signatureRow}>
        {/* Technician Signature */}
        {schema.signatures.showTechnician && (
          <View style={styles.signatureBox}>
            {data.technicianSignature ? (
              <Image src={data.technicianSignature} style={styles.signatureImage} />
            ) : (
              <View style={styles.signatureImage} />
            )}
            <Text style={styles.signatureLabel}>
              {schema.signatures.technicianLabel || 'Çalışan'}
            </Text>
            {data.employee && (
              <Text style={styles.signatureName}>
                {safeText(`${data.employee.first_name} ${data.employee.last_name}`)}
              </Text>
            )}
          </View>
        )}

        {/* Customer Signature */}
        {schema.signatures.showCustomer && (
          <View style={styles.signatureBox}>
            {data.customerSignature ? (
              <Image src={data.customerSignature} style={styles.signatureImage} />
            ) : (
              <View style={styles.signatureImage} />
            )}
            <Text style={styles.signatureLabel}>
              {schema.signatures.customerLabel || 'Müşteri'}
            </Text>
            {data.customer?.name && (
              <Text style={styles.signatureName}>
                {safeText(data.customer.name)}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

