// Main component
export { default as PdfRenderer } from './PdfRenderer';

// Components
export { PdfHeader } from './components/PdfHeader';
export { CustomerProposalInfo } from './components/CustomerProposalInfo';
export { ItemsTable } from './components/ItemsTable';
export { TotalsSection } from './components/TotalsSection';
export { NotesSection } from './components/NotesSection';
export { SignaturesSection } from './components/SignaturesSection';
export { PdfFooter } from './components/PdfFooter';
export { BackgroundRenderer } from './components/BackgroundRenderer';

// Utils
export { safeText, parseFormattedText } from './utils/pdfTextUtils';

// Styles
export { createPdfStyles } from './styles/pdfStyles';

// Config
export { registerFonts } from './config/fontRegistry';

