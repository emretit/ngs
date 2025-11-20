
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

// Export suppliers to Excel
export const exportSuppliersToExcel = (suppliers: any[], fileName = 'tedarikciler.xlsx') => {
  try {
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(suppliers);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Save file
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, fileName);
    
    return true;
  } catch (error) {
    console.error('Error exporting suppliers to Excel:', error);
    return false;
  }
};

// Import customers from Excel
export const importCustomersFromExcel = async (file: File, columnMapping?: { [excelColumn: string]: string }): Promise<any[]> => {
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
          'ünvan': 'name',
          'unvan': 'name',
          'firma': 'name',
          'müşteri': 'name',
          'name': 'name',
          'title': 'name',
          'email': 'email',
          'e-posta': 'email',
          'mail': 'email',
          'telefon': 'mobile_phone',
          'cep': 'mobile_phone',
          'gsm': 'mobile_phone',
          'mobile': 'mobile_phone',
          'cep telefonu': 'mobile_phone',
          'mobile_phone': 'mobile_phone',
          'iş': 'office_phone',
          'tel': 'office_phone',
          'sabit': 'office_phone',
          'office': 'office_phone',
          'iş telefonu': 'office_phone',
          'office_phone': 'office_phone',
          'vergi no': 'tax_number',
          'vkn': 'tax_number',
          'tc': 'tax_number',
          'tckn': 'tax_number',
          'tax id': 'tax_number',
          'tax_number': 'tax_number',
          'vergi dairesi': 'tax_office',
          'vd': 'tax_office',
          'tax office': 'tax_office',
          'tax_office': 'tax_office',
          'adres': 'address',
          'address': 'address',
          'şehir': 'city',
          'il': 'city',
          'city': 'city',
          'ilçe': 'district',
          'district': 'district',
          'ülke': 'country',
          'country': 'country',
          'posta kodu': 'postal_code',
          'postal_code': 'postal_code',
          'tip': 'type',
          'tür': 'type',
          'type': 'type',
          'durum': 'status',
          'status': 'status',
          'şirket': 'company',
          'sirket': 'company',
          'firma adı': 'company',
          'firma adi': 'company',
          'company': 'company',
          'firm': 'company'
        };
        
        // Normalize headers using provided mapping or default
        const normalizedHeaders = headers.map(header => {
          const headerStr = header?.toString().trim() || '';
          
          // Önce custom mapping'i kontrol et
          if (columnMapping && columnMapping[headerStr]) {
            const mappedValue = columnMapping[headerStr];
            // 'none' değerini skip et
            return mappedValue === 'none' ? null : mappedValue;
          }
          
          // Sonra default mapping'i kontrol et
          const normalized = headerStr.toLowerCase();
          return defaultHeaderMap[normalized] || normalized;
        });
        
        // Map rows to objects with normalized headers
        const mappedData = rows.map(row => {
          const obj: any = {};
          normalizedHeaders.forEach((header, index) => {
            // Skip null headers, 'none' mappings, and undefined/null values
            if (header && header !== 'none' && row[index] !== undefined && row[index] !== null) {
              const value = row[index];
              // Preserve the value, convert to string if needed for tax_number
              if (value !== '' && value !== null && value !== undefined) {
                // For tax_number and other string fields, ensure it's a string
                if (header === 'tax_number' || header === 'tax_office' || header === 'mobile_phone' || header === 'office_phone') {
                  obj[header] = String(value).trim();
                } else {
                  obj[header] = value;
                }
              } else if (value === '') {
                // Empty string is valid for optional fields
                obj[header] = '';
              }
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
        type: 'bireysel',
        status: 'aktif',
        email: 'ornek@musteri.com',
        mobile_phone: '0532 123 45 67',
        office_phone: '0212 123 45 67',
        address: 'Örnek Mahallesi, Örnek Sokak No:1, İstanbul',
        tax_number: '1234567890',
        tax_office: 'Kadıköy'
      },
      {
        name: 'Örnek Şirket A.Ş.',
        type: 'kurumsal',
        status: 'aktif',
        email: 'info@sirket.com',
        mobile_phone: '0533 987 65 43',
        office_phone: '0216 987 65 43',
        address: 'Organize Sanayi Bölgesi, 1. Cadde No:5, Ankara',
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
      { Alan: 'name', Açıklama: 'Müşteri adı/Ünvanı (zorunlu)', 'Örnek Değer': 'Ahmet Yılmaz' },
      { Alan: 'type', Açıklama: 'Tip (bireysel, kurumsal)', 'Örnek Değer': 'bireysel' },
      { Alan: 'status', Açıklama: 'Durum (aktif, pasif)', 'Örnek Değer': 'aktif' },
      { Alan: 'email', Açıklama: 'E-posta adresi', 'Örnek Değer': 'info@abc.com' },
      { Alan: 'mobile_phone', Açıklama: 'Cep telefonu', 'Örnek Değer': '0532 123 45 67' },
      { Alan: 'office_phone', Açıklama: 'Ofis telefonu', 'Örnek Değer': '0212 123 45 67' },
      { Alan: 'address', Açıklama: 'Adres', 'Örnek Değer': 'Mahalle, Sokak No:1, Şehir' },
      { Alan: 'tax_number', Açıklama: 'Vergi/TC No', 'Örnek Değer': '1234567890' },
      { Alan: 'tax_office', Açıklama: 'Vergi dairesi', 'Örnek Değer': 'Kadıköy' }
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

// Export supplier template to Excel
export const exportSupplierTemplateToExcel = (fileName = 'tedarikci_sablonu.xlsx') => {
  try {
    // Create a sample data array with the required columns
    const templateData = [
      {
        name: 'Örnek Tedarikçi 1',
        type: 'kurumsal',
        status: 'aktif',
        email: 'satis@tedarikci1.com',
        mobile_phone: '0532 111 22 33',
        office_phone: '0212 111 22 33',
        address: 'Sanayi Sitesi A Blok No:1',
        tax_number: '1111111111',
        tax_office: 'Şişli',
        website: 'www.tedarikci1.com',
        bank_name: 'Ziraat Bankası',
        iban: 'TR12 3456 7890 1234 5678 90'
      },
      {
        name: 'Örnek Tedarikçi 2',
        type: 'bireysel',
        status: 'aktif',
        email: 'info@tedarikci2.com',
        mobile_phone: '0533 222 33 44',
        office_phone: '0216 222 33 44',
        address: 'Teknopark B Blok No:5',
        tax_number: '22222222222',
        tax_office: 'Ümraniye',
        website: '',
        bank_name: 'Garanti BBVA',
        iban: 'TR98 7654 3210 9876 5432 10'
      }
    ];
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tedarikçi Şablonu');
    
    // Add instructions sheet
    const instructionsData = [
      { Alan: 'name', Açıklama: 'Tedarikçi adı/Ünvanı (zorunlu)', 'Örnek Değer': 'ABC Tedarik' },
      { Alan: 'type', Açıklama: 'Tip (bireysel, kurumsal)', 'Örnek Değer': 'kurumsal' },
      { Alan: 'status', Açıklama: 'Durum (aktif, pasif)', 'Örnek Değer': 'aktif' },
      { Alan: 'email', Açıklama: 'E-posta adresi', 'Örnek Değer': 'info@abc.com' },
      { Alan: 'mobile_phone', Açıklama: 'Cep telefonu', 'Örnek Değer': '0532 123 45 67' },
      { Alan: 'office_phone', Açıklama: 'Ofis telefonu', 'Örnek Değer': '0212 123 45 67' },
      { Alan: 'address', Açıklama: 'Adres', 'Örnek Değer': 'Mahalle, Sokak No:1, Şehir' },
      { Alan: 'tax_number', Açıklama: 'Vergi/TC No', 'Örnek Değer': '1234567890' },
      { Alan: 'tax_office', Açıklama: 'Vergi dairesi', 'Örnek Değer': 'Kadıköy' },
      { Alan: 'website', Açıklama: 'Web sitesi', 'Örnek Değer': 'www.abc.com' },
      { Alan: 'bank_name', Açıklama: 'Banka Adı', 'Örnek Değer': 'Garanti' },
      { Alan: 'iban', Açıklama: 'IBAN', 'Örnek Değer': 'TR00...' }
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
    console.error('Error exporting supplier template to Excel:', error);
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
