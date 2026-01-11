import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], filename: string) => {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch (error) {
    console.error('Excel export error:', error);
    throw new Error('Excel dosyası oluşturulamadı');
  }
};

// PDF export removed - use PDFMe templates instead