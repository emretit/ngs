
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Customer } from '@/types/customer';
import { Proposal } from '@/types/proposal';
import { Product } from '@/types/product';

// Export customers to Excel
export const exportCustomersToExcel = (customers: Customer[], fileName = 'customers.xlsx') => {
  try {
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(customers);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Save file
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, fileName);
    
    return true;
  } catch (error) {
    console.error('Error exporting customers to Excel:', error);
    return false;
  }
};

// Import customers from Excel
export const importCustomersFromExcel = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        console.error('Error importing Excel file:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Export proposals to Excel
export const exportProposalsToExcel = (proposals: Proposal[], fileName = 'proposals.xlsx') => {
  try {
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(proposals);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Proposals');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Save file
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, fileName);
    
    return true;
  } catch (error) {
    console.error('Error exporting proposals to Excel:', error);
    return false;
  }
};

// Export products to Excel
export const exportProductsToExcel = (products: Product[], fileName = 'products.xlsx') => {
  try {
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(products);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Save file
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, fileName);
    
    return true;
  } catch (error) {
    console.error('Error exporting products to Excel:', error);
    return false;
  }
};

// Export product template to Excel
export const exportProductTemplateToExcel = (fileName = 'urun_sablonu.xlsx') => {
  try {
    // Create a sample data array with the required columns
    const templateData = [
      {
        name: 'Örnek Ürün 1',
        description: 'Ürün açıklaması (isteğe bağlı)',
        sku: 'PRD-001',
        barcode: '1234567890123',
        price: 100.50,
        discount_price: 85.00,
        stock_quantity: 50,
        min_stock_level: 10,
        stock_threshold: 15,
        tax_rate: 18,
        unit: 'piece',
        currency: 'TRY',
        category_type: 'product',
        product_type: 'physical',
        status: 'active',
        is_active: true
      },
      {
        name: 'Örnek Hizmet 1',
        description: 'Hizmet açıklaması',
        sku: 'SRV-001',
        barcode: '',
        price: 250.00,
        discount_price: '',
        stock_quantity: 0,
        min_stock_level: 0,
        stock_threshold: 0,
        tax_rate: 18,
        unit: 'hour',
        currency: 'TRY',
        category_type: 'service',
        product_type: 'service',
        status: 'active',
        is_active: true
      }
    ];
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ürün Şablonu');
    
    // Add instructions sheet
    const instructionsData = [
      { Alan: 'name', Açıklama: 'Ürün adı (zorunlu)', 'Örnek Değer': 'Laptop Dell Inspiron' },
      { Alan: 'description', Açıklama: 'Ürün açıklaması (isteğe bağlı)', 'Örnek Değer': 'Yüksek performanslı dizüstü bilgisayar' },
      { Alan: 'sku', Açıklama: 'Stok kodu (isteğe bağlı)', 'Örnek Değer': 'LAP-DELL-001' },
      { Alan: 'barcode', Açıklama: 'Barkod (isteğe bağlı)', 'Örnek Değer': '1234567890123' },
      { Alan: 'price', Açıklama: 'Satış fiyatı (zorunlu)', 'Örnek Değer': '15000.50' },
      { Alan: 'discount_price', Açıklama: 'İndirimli fiyat (isteğe bağlı)', 'Örnek Değer': '13500.00' },
      { Alan: 'stock_quantity', Açıklama: 'Stok miktarı (zorunlu)', 'Örnek Değer': '25' },
      { Alan: 'min_stock_level', Açıklama: 'Minimum stok seviyesi (zorunlu)', 'Örnek Değer': '5' },
      { Alan: 'stock_threshold', Açıklama: 'Stok eşiği (isteğe bağlı)', 'Örnek Değer': '10' },
      { Alan: 'tax_rate', Açıklama: 'Vergi oranı % (zorunlu)', 'Örnek Değer': '18' },
      { Alan: 'unit', Açıklama: 'Birim (zorunlu)', 'Örnek Değer': 'piece, kg, m, hour' },
      { Alan: 'currency', Açıklama: 'Para birimi (zorunlu)', 'Örnek Değer': 'TRY, USD, EUR' },
      { Alan: 'category_type', Açıklama: 'Kategori tipi (zorunlu)', 'Örnek Değer': 'product, service, subscription' },
      { Alan: 'product_type', Açıklama: 'Ürün tipi (zorunlu)', 'Örnek Değer': 'physical, service' },
      { Alan: 'status', Açıklama: 'Durum (zorunlu)', 'Örnek Değer': 'active, inactive' },
      { Alan: 'is_active', Açıklama: 'Aktif mi? (zorunlu)', 'Örnek Değer': 'true, false' }
    ];
    
    const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Kullanım Kılavuzu');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Save file
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, fileName);
    
    return true;
  } catch (error) {
    console.error('Error exporting product template to Excel:', error);
    return false;
  }
};

// Import products from Excel
export const importProductsFromExcel = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        console.error('Error importing Excel file:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};
