import React from 'react';
import { Document, Page, View } from '@react-pdf/renderer';
import { QuoteData, TemplateSchema } from '@/types/pdf-template';
import './config/fontRegistry'; // Register fonts on import
import { createPdfStyles } from './styles/pdfStyles';
import { PdfHeader } from './components/PdfHeader';
import { CustomerProposalInfo } from './components/CustomerProposalInfo';
import { ItemsTable } from './components/ItemsTable';
import { TotalsSection } from './components/TotalsSection';
import { NotesSection } from './components/NotesSection';
import { SignaturesSection } from './components/SignaturesSection';
import { PdfFooter } from './components/PdfFooter';
import { BackgroundRenderer } from './components/BackgroundRenderer';

interface PdfRendererProps {
  data: QuoteData;
  schema: TemplateSchema;
}

const PdfRenderer: React.FC<PdfRendererProps> = ({ data, schema }) => {
  const styles = createPdfStyles(schema);

  return (
    <Document>
      <Page size={schema.page.size === "LETTER" ? "LETTER" : schema.page.size} style={styles.page}>
        {/* Content Wrapper - Önce render edilir (önde olur) */}
        <View style={{ position: 'relative', flex: 1, flexDirection: 'column', minHeight: '100%' }}>
          {/* Header */}
          <PdfHeader schema={schema} styles={styles} />

          {/* Customer and Quote Information Container */}
          <CustomerProposalInfo data={data} schema={schema} styles={styles} />

          {/* Items Table */}
          <ItemsTable data={data} schema={schema} styles={styles} />

          {/* Totals */}
          <TotalsSection data={data} schema={schema} styles={styles} />

          {/* Notes */}
          <NotesSection data={data} schema={schema} styles={styles} />

          {/* Signatures */}
          <SignaturesSection data={data} schema={schema} styles={styles} />

          {/* Footer */}
          <PdfFooter schema={schema} styles={styles} />
        </View>
        
        {/* Background Style - En son render edilir (arkada kalır) */}
        <BackgroundRenderer schema={schema} />
      </Page>
    </Document>
  );
};

export default PdfRenderer;
