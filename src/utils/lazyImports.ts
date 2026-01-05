// Lazy loading utilities for heavy libraries
// This file provides centralized lazy imports for large dependencies
// to reduce initial bundle size and improve application load time

import { lazy } from 'react';

// PDF Rendering - @react-pdf/renderer (~500KB)
// Only load when actually viewing/generating PDFs
export const PDFViewer = lazy(() => 
  import('@react-pdf/renderer').then(module => ({ default: module.PDFViewer }))
);

export const PDFDownloadLink = lazy(() => 
  import('@react-pdf/renderer').then(module => ({ default: module.PDFDownloadLink }))
);

// Excel Import/Export - xlsx (~800KB)
// Only load when importing or exporting Excel files
export const loadXLSX = () => import('xlsx');

// Leaflet Maps - leaflet (~150KB)
// Only load when displaying maps
export const loadLeaflet = () => import('leaflet');
export const loadReactLeaflet = () => import('react-leaflet');

// Charts - recharts (~400KB)
// Only load when displaying charts/graphs
export const loadRecharts = () => import('recharts');

// React Big Calendar - react-big-calendar (~200KB)
// Only load when viewing calendar pages
export const BigCalendar = lazy(() => 
  import('react-big-calendar').then(module => ({ default: module.Calendar }))
);

// Usage examples:
// 
// For PDF:
// import { PDFViewer } from '@/utils/lazyImports';
// <Suspense fallback={<LoadingSpinner />}>
//   <PDFViewer>...</PDFViewer>
// </Suspense>
//
// For XLSX:
// import { loadXLSX } from '@/utils/lazyImports';
// const handleExport = async () => {
//   const XLSX = await loadXLSX();
//   // Use XLSX...
// };
//
// For Leaflet:
// import { loadLeaflet } from '@/utils/lazyImports';
// useEffect(() => {
//   loadLeaflet().then(L => {
//     // Initialize map with L
//   });
// }, []);

