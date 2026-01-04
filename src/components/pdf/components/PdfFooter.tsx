import React from 'react';
import { View, Image } from '@react-pdf/renderer';
import { TemplateSchema } from '@/types/pdf-template';
import { parseFormattedText } from '../utils/pdfTextUtils';

interface PdfFooterProps {
  schema: TemplateSchema;
  styles: any;
}

export const PdfFooter: React.FC<PdfFooterProps> = ({ schema, styles }) => {
  const hasFooter = (schema.notes.footer && schema.notes.footer.trim() !== '') || 
                    (schema.notes.showFooterLogo && schema.header.logoUrl);

  if (!hasFooter) {
    return null;
  }

  return (
    <View fixed wrap={false} style={[
      styles.footer,
      {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
      }
    ]}>
      {/* Footer Logo - Header'daki logoyu kullanır */}
      {schema.notes.showFooterLogo && schema.header.logoUrl && (
        <View style={{
          justifyContent: 'center',
          alignItems: 'center',
          maxHeight: 44,
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <Image
            style={{
              width: schema.notes.footerLogoSize || 40,
              maxHeight: 44,
              objectFit: 'contain',
            }}
            src={schema.header.logoUrl}
          />
        </View>
      )}

      {/* Footer Text */}
      {schema.notes.footer && schema.notes.footer.trim() !== '' && (
        parseFormattedText(schema.notes.footer, {
          fontSize: schema.notes.footerFontSize || 10,
          textAlign: 'center',
        })
      )}
    </View>
  );
};

