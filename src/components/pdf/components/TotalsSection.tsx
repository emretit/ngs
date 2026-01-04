import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { QuoteData, TemplateSchema } from '@/types/pdf-template';
import { safeText } from '../utils/pdfTextUtils';

interface TotalsSectionProps {
  data: QuoteData;
  schema: TemplateSchema;
  styles: any;
}

export const TotalsSection: React.FC<TotalsSectionProps> = ({ data, schema, styles }) => {
  const formatCurrency = (amount: number | undefined | null, currency: string = 'TRY') => {
    // Handle undefined/null amounts
    if (amount == null || isNaN(amount)) {
      amount = 0;
    }
    
    // Manual formatting to avoid symbol rendering issues in PDF
    const formatted = new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    
    const symbol = currency === 'TRY' ? 'TRY' : currency;
    return `${formatted} ${symbol}`;
  };

  return (
    <View wrap={false} style={styles.totalsSection}>
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
  );
};

