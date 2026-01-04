import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { QuoteData, TemplateSchema } from '@/types/pdf-template';
import { safeText } from '../utils/pdfTextUtils';

interface CustomerProposalInfoProps {
  data: QuoteData;
  schema: TemplateSchema;
  styles: any;
}

export const CustomerProposalInfo: React.FC<CustomerProposalInfoProps> = ({ data, schema, styles }) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: tr });
    } catch {
      return dateString;
    }
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

  return (
    <View wrap={false} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
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
  );
};

