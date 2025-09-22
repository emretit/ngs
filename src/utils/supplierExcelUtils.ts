import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Supplier } from '@/types/supplier';

export interface SupplierExcelData {
  name: string;
  type: string;
  status: string;
  email?: string;
  mobile_phone?: string;
  office_phone?: string;
  company?: string;
  representative?: string;
  balance?: number;
  address?: string;
  tax_number?: string;
  tax_office?: string;
}

export const exportSuppliersToExcel = (suppliers: Supplier[]) => {
  // Transform suppliers data for Excel export
  const excelData = suppliers.map(supplier => ({
    'Tedarikçi Adı': supplier.name,
    'Şirket': supplier.company || '',
    'E-posta': supplier.email || '',
    'Cep Telefonu': supplier.mobile_phone || '',
    'Ofis Telefonu': supplier.office_phone || '',
    'Tip': supplier.type,
    'Durum': supplier.status,
    'Temsilci': supplier.representative || '',
    'Bakiye': supplier.balance || 0,
    'Adres': supplier.address || '',
    'Vergi Numarası': supplier.tax_number || '',
    'Vergi Dairesi': supplier.tax_office || '',
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tedarikçiler');
  
  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  // Save file
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(data, `tedarikciler_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportSupplierTemplateToExcel = () => {
  // Create template data with example row
  const templateData = [
    {
      'name': 'Örnek Tedarikçi A.Ş.',
      'company': 'Örnek Tedarikçi A.Ş.',
      'email': 'info@ornektedarikci.com',
      'mobile_phone': '+90 555 123 4567',
      'office_phone': '+90 212 123 4567',
      'type': 'musteri',
      'status': 'aktif',
      'representative': 'Ahmet Yılmaz',
      'balance': 15000,
      'address': 'Örnek Mah. Örnek Cad. No:1 İstanbul',
      'tax_number': '1234567890',
      'tax_office': 'Kadıköy'
    }
  ];

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tedarikçi Şablonu');
  
  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  // Save file
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(data, 'tedarikci_sablonu.xlsx');
};

export const importSuppliersFromExcel = async (file: File): Promise<SupplierExcelData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Skip header row and process data
        const suppliers: SupplierExcelData[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          
          // Skip empty rows
          if (!row || row.length === 0 || !row[0]) continue;
          
          // Map columns to supplier data
          const supplier: SupplierExcelData = {
            name: row[0]?.toString() || '',
            company: row[1]?.toString() || '',
            email: row[2]?.toString() || '',
            mobile_phone: row[3]?.toString() || '',
            office_phone: row[4]?.toString() || '',
            type: row[5]?.toString() || '',
            status: row[6]?.toString() || '',
            representative: row[7]?.toString() || '',
            balance: parseFloat(row[8]) || 0,
            address: row[9]?.toString() || '',
            tax_number: row[10]?.toString() || '',
            tax_office: row[11]?.toString() || '',
          };
          
          suppliers.push(supplier);
        }
        
        resolve(suppliers);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Dosya okuma hatası'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};