import { logger } from '@/utils/logger';

/**
 * CSV formatında veri export eder
 */
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    logger.error('No data to export');
    return;
  }

  // CSV header
  const headers = Object.keys(data[0]);
  const csvHeader = headers.join(',');

  // CSV rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });

  // Combine header and rows
  const csvContent = [csvHeader, ...csvRows].join('\n');

  // Create blob and download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Excel formatında veri export eder (CSV uyumlu)
 */
export const exportToExcel = (data: any[], filename: string) => {
  // Excel için CSV formatı kullanıyoruz
  exportToCSV(data, filename);
};

/**
 * PNG formatında chart görüntüsü export eder
 * NOT: Bu fonksiyon tarayıcı native API kullanır
 */
export const exportToPNG = async (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      logger.error('Element not found');
      return;
    }

    // SVG elementini bul ve PNG'ye çevir
    const svgElement = element.querySelector('svg');
    if (!svgElement) {
      logger.error('SVG element not found');
      return;
    }

    // SVG'nin boyutlarını al
    const bbox = svgElement.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = bbox.width * 2; // 2x scale for better quality
    canvas.height = bbox.height * 2;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Beyaz arka plan
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(2, 2);

    // SVG'yi image olarak yükle
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement('a');
          const blobUrl = URL.createObjectURL(blob);
          link.setAttribute('href', blobUrl);
          link.setAttribute('download', `${filename}.png`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }
      });
    };
    
    img.src = url;
  } catch (error) {
    logger.error('Error exporting to PNG:', error);
  }
};

/**
 * SVG formatında chart görüntüsü export eder
 */
export const exportToSVG = (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      logger.error('Element not found');
      return;
    }

    // SVG elementini bul
    const svgElement = element.querySelector('svg');
    if (!svgElement) {
      logger.error('SVG element not found');
      return;
    }

    // SVG'yi serialize et
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    
    // Blob oluştur ve indir
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.svg`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    logger.error('Error exporting to SVG:', error);
  }
};

/**
 * Tüm export formatları için tip tanımı
 */
export type ExportFormat = 'csv' | 'excel' | 'png' | 'svg';

/**
 * Export handler - format'a göre doğru fonksiyonu çağırır
 */
export const handleExport = async (
  format: ExportFormat,
  data: any[],
  elementId: string,
  filename: string
) => {
  switch (format) {
    case 'csv':
      exportToCSV(data, filename);
      break;
    case 'excel':
      exportToExcel(data, filename);
      break;
    case 'png':
      await exportToPNG(elementId, filename);
      break;
    case 'svg':
      exportToSVG(elementId, filename);
      break;
    default:
      logger.error('Unsupported export format:', format);
  }
};

