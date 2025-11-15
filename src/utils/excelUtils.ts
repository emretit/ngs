
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

// Export customer template to Excel
export const exportCustomerTemplateToExcel = (fileName = 'musteri_sablonu.xlsx') => {
  try {
    // Create a sample data array with the required columns
    const templateData = [
      {
        name: 'Örnek Müşteri 1',
        type: 'customer',
        status: 'active',
        email: 'ornek@musteri.com',
        mobile_phone: '0532 123 45 67',
        office_phone: '0212 123 45 67',
        company: 'Örnek Şirket A.Ş.',
        representative: 'Ahmet Yılmaz',
        balance: 0.00,
        address: 'Örnek Mahallesi, Örnek Sokak No:1, İstanbul',
        tax_number: '1234567890',
        tax_office: 'Kadıköy'
      },
      {
        name: 'Örnek Tedarikçi 1',
        type: 'supplier',
        status: 'active',
        email: 'ornek@tedarikci.com',
        mobile_phone: '0533 987 65 43',
        office_phone: '0216 987 65 43',
        company: 'Örnek Tedarikçi Ltd. Şti.',
        representative: 'Mehmet Demir',
        balance: 0.00,
        address: 'Tedarikçi Mahallesi, Tedarikçi Sokak No:5, Ankara',
        tax_number: '9876543210',
        tax_office: 'Çankaya'
      }
    ];
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Müşteri Şablonu');
    
    // Add instructions sheet
    const instructionsData = [
      { Alan: 'name', Açıklama: 'Müşteri/Tedarikçi adı (zorunlu)', 'Örnek Değer': 'ABC Şirketi' },
      { Alan: 'type', Açıklama: 'Tip (zorunlu)', 'Örnek Değer': 'customer, supplier' },
      { Alan: 'status', Açıklama: 'Durum (zorunlu)', 'Örnek Değer': 'active, inactive' },
      { Alan: 'email', Açıklama: 'E-posta adresi (isteğe bağlı)', 'Örnek Değer': 'info@abc.com' },
      { Alan: 'mobile_phone', Açıklama: 'Cep telefonu (isteğe bağlı)', 'Örnek Değer': '0532 123 45 67' },
      { Alan: 'office_phone', Açıklama: 'Ofis telefonu (isteğe bağlı)', 'Örnek Değer': '0212 123 45 67' },
      { Alan: 'company', Açıklama: 'Şirket adı (isteğe bağlı)', 'Örnek Değer': 'ABC Şirketi A.Ş.' },
      { Alan: 'representative', Açıklama: 'Temsilci adı (isteğe bağlı)', 'Örnek Değer': 'Ali Veli' },
      { Alan: 'balance', Açıklama: 'Bakiye (isteğe bağlı)', 'Örnek Değer': '0.00' },
      { Alan: 'address', Açıklama: 'Adres (isteğe bağlı)', 'Örnek Değer': 'Mahalle, Sokak No:1, Şehir' },
      { Alan: 'tax_number', Açıklama: 'Vergi numarası (isteğe bağlı)', 'Örnek Değer': '1234567890' },
      { Alan: 'tax_office', Açıklama: 'Vergi dairesi (isteğe bağlı)', 'Örnek Değer': 'Kadıköy' }
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
    console.error('Error exporting customer template to Excel:', error);
    return false;
  }
};

// Export product template to Excel
export const exportProductTemplateToExcel = (fileName = 'urun_sablonu.xlsx') => {
  try {
    // Create a sample data array with Turkish column names
    const templateData = [
      {
        'Ad': 'Örnek Ürün 1',
        'Açıklama': 'Ürün açıklaması (isteğe bağlı)',
        'Stok Kodu': 'PRD-001',
        'Barkod': '1234567890123',
        'Fiyat': 100.50,
        'İndirim Oranı': 15,
        'Stok Miktarı': 50,
        'Minimum Stok': 10,
        'Stok Eşiği': 15,
        'Vergi Oranı': 18,
        'Birim': 'piece',
        'Para Birimi': 'TRY',
        'Kategori Tipi': 'product',
        'Ürün Tipi': 'physical',
        'Durum': 'active',
        'Aktif': true
      },
      {
        'Ad': 'Örnek Hizmet 1',
        'Açıklama': 'Hizmet açıklaması',
        'Stok Kodu': 'SRV-001',
        'Barkod': '',
        'Fiyat': 250.00,
        'İndirim Oranı': '',
        'Stok Miktarı': 0,
        'Minimum Stok': 0,
        'Stok Eşiği': 0,
        'Vergi Oranı': 18,
        'Birim': 'hour',
        'Para Birimi': 'TRY',
        'Kategori Tipi': 'service',
        'Ürün Tipi': 'service',
        'Durum': 'active',
        'Aktif': true
      }
    ];
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ürün Şablonu');
    
    // Add instructions sheet
    const instructionsData = [
      { 'Kolon İsmi (TR/EN)': 'Ad / name / isim', Açıklama: 'Ürün adı (zorunlu)', 'Örnek Değer': 'Laptop Dell Inspiron' },
      { 'Kolon İsmi (TR/EN)': 'Açıklama / description', Açıklama: 'Ürün açıklaması (isteğe bağlı)', 'Örnek Değer': 'Yüksek performanslı dizüstü bilgisayar' },
      { 'Kolon İsmi (TR/EN)': 'Stok Kodu / sku', Açıklama: 'Stok kodu (isteğe bağlı)', 'Örnek Değer': 'LAP-DELL-001' },
      { 'Kolon İsmi (TR/EN)': 'Barkod / barcode', Açıklama: 'Barkod (isteğe bağlı)', 'Örnek Değer': '1234567890123' },
      { 'Kolon İsmi (TR/EN)': 'Fiyat / price / satış fiyatı', Açıklama: 'Satış fiyatı (zorunlu)', 'Örnek Değer': '15000.50' },
      { 'Kolon İsmi (TR/EN)': 'İndirim Oranı / discount_rate / indirim', Açıklama: 'İndirim oranı % (isteğe bağlı)', 'Örnek Değer': '15' },
      { 'Kolon İsmi (TR/EN)': 'Stok Miktarı / stock_quantity / stok', Açıklama: 'Stok miktarı (isteğe bağlı)', 'Örnek Değer': '25' },
      { 'Kolon İsmi (TR/EN)': 'Minimum Stok / min_stock_level / min stok', Açıklama: 'Minimum stok seviyesi (isteğe bağlı)', 'Örnek Değer': '5' },
      { 'Kolon İsmi (TR/EN)': 'Stok Eşiği / stock_threshold', Açıklama: 'Stok eşiği (isteğe bağlı)', 'Örnek Değer': '10' },
      { 'Kolon İsmi (TR/EN)': 'Vergi Oranı / tax_rate / kdv / kdv oranı', Açıklama: 'Vergi oranı % (zorunlu)', 'Örnek Değer': '20' },
      { 'Kolon İsmi (TR/EN)': 'Birim / unit', Açıklama: 'Birim (zorunlu)', 'Örnek Değer': 'piece, kg, m, hour' },
      { 'Kolon İsmi (TR/EN)': 'Para Birimi / currency', Açıklama: 'Para birimi (zorunlu)', 'Örnek Değer': 'TRY, USD, EUR, GBP' },
      { 'Kolon İsmi (TR/EN)': 'Kategori Tipi / category_type / kategori', Açıklama: 'Kategori tipi (isteğe bağlı)', 'Örnek Değer': 'product, service' },
      { 'Kolon İsmi (TR/EN)': 'Ürün Tipi / product_type / tip', Açıklama: 'Ürün tipi (zorunlu)', 'Örnek Değer': 'physical, service' },
      { 'Kolon İsmi (TR/EN)': 'Durum / status', Açıklama: 'Durum (isteğe bağlı)', 'Örnek Değer': 'active, inactive' },
      { 'Kolon İsmi (TR/EN)': 'Aktif / is_active / aktif mi', Açıklama: 'Aktif mi? (isteğe bağlı)', 'Örnek Değer': 'true, false' }
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

// Read Excel column headers only
export const readExcelColumns = async (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header row only
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 1) {
          resolve([]);
          return;
        }
        
        const headers = jsonData[0] as string[];
        resolve(headers.filter(h => h !== undefined && h !== null && h.toString().trim() !== ''));
      } catch (error) {
        console.error('Error reading Excel columns:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Import products from Excel
export const importProductsFromExcel = async (file: File, columnMapping?: { [excelColumn: string]: string }): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          resolve([]);
          return;
        }
        
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        // Use provided column mapping or fallback to default mapping
        const defaultHeaderMap: { [key: string]: string } = {
          'ad': 'name',
          'isim': 'name',
          'ürün adı': 'name',
          'açıklama': 'description',
          'stok kodu': 'sku',
          'sku': 'sku',
          'barkod': 'barcode',
          'fiyat': 'price',
          'satış fiyatı': 'price',
          'indirim oranı': 'discount_rate',
          'indirim': 'discount_rate',
          'stok miktarı': 'stock_quantity',
          'stok': 'stock_quantity',
          'minimum stok': 'min_stock_level',
          'min stok': 'min_stock_level',
          'stok eşiği': 'stock_threshold',
          'vergi oranı': 'tax_rate',
          'kdv': 'tax_rate',
          'kdv oranı': 'tax_rate',
          'birim': 'unit',
          'para birimi': 'currency',
          'kategori tipi': 'category_type',
          'kategori': 'category_type',
          'ürün tipi': 'product_type',
          'tip': 'product_type',
          'durum': 'status',
          'aktif': 'is_active',
          'aktif mi': 'is_active'
        };
        
        // Normalize headers using provided mapping or default
        const normalizedHeaders = headers.map(header => {
          const headerStr = header?.toString().trim() || '';
          
          // Önce custom mapping'i kontrol et
          if (columnMapping && columnMapping[headerStr]) {
            return columnMapping[headerStr];
          }
          
          // Sonra default mapping'i kontrol et
          const normalized = headerStr.toLowerCase();
          return defaultHeaderMap[normalized] || normalized;
        });
        
        // Map rows to objects with normalized headers
        const mappedData = rows.map(row => {
          const obj: any = {};
          normalizedHeaders.forEach((header, index) => {
            // Skip 'none' mappings and undefined/null values
            if (header && header !== 'none' && row[index] !== undefined && row[index] !== null) {
              obj[header] = row[index];
            }
          });
          return obj;
        });
        
        resolve(mappedData);
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
