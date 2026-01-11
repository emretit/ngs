import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { QuoteData, TemplateSchema } from '@/types/pdf-template';
import { safeText } from '../utils/pdfTextUtils';

interface ItemsTableProps {
  data: QuoteData;
  schema: TemplateSchema;
  styles: any;
}

export const ItemsTable: React.FC<ItemsTableProps> = ({ data, schema, styles }) => {
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
    <View style={styles.table}>
      {/* Table Header */}
      <View wrap={false} style={styles.tableHeader}>
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
                const imageUrl = item.image_url || item.product?.image_url;
                // Debug: image_url durumunu logla (sadece development'ta)
                if (process.env.NODE_ENV === 'development' && index === 0) {
                  console.log('PDF Render - Product Image Debug:', {
                    itemIndex: index,
                    itemId: item.id,
                    productId: item.product_id,
                    hasImageUrl: !!imageUrl,
                    imageUrl: imageUrl,
                    itemKeys: Object.keys(item),
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
                      <Text style={[styles.tableCell, { textAlign: 'center', color: '#9CA3AF' }]}>{safeText('-')}</Text>
                    )}
                  </View>
                );
              }
              
              let cellContent: string = ' '; // Varsayılan olarak boşluk karakteri
              if (col.key === 'description') {
                if (item.description) {
                  const text = safeText(item.description);
                  cellContent = text && text.trim() !== '' ? text : ' ';
                }
              } else if (col.key === 'quantity') {
                // quantity 0 olsa bile gösterilmeli
                const quantityStr = item.quantity != null ? String(item.quantity) : '';
                const unitStr = item.unit ? ` ${item.unit}` : '';
                const text = safeText(`${quantityStr}${unitStr}`);
                cellContent = text && text.trim() !== '' ? text : ' ';
              } else if (col.key === 'unit_price') {
                if (item.unit_price != null) {
                  const text = safeText(formatCurrency(item.unit_price, data.currency));
                  cellContent = text && text.trim() !== '' ? text : ' ';
                }
              } else if (col.key === 'discount') {
                if (item.discount_rate && item.discount_rate > 0) {
                  const text = safeText(`%${item.discount_rate}`);
                  cellContent = text && text.trim() !== '' ? text : ' ';
                } else {
                  cellContent = safeText('-');
                }
              } else if (col.key === 'total') {
                if (item.total != null) {
                  const text = safeText(formatCurrency(item.total, data.currency));
                  cellContent = text && text.trim() !== '' ? text : ' ';
                }
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
  );
};

