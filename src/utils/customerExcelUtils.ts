import * as XLSX from 'xlsx';
import { Customer } from '@/types/customer';

export const exportCustomersToExcel = (customers: Customer[]) => {
  // Prepare data for Excel export
  const excelData = customers.map(customer => ({
    'Ad': customer.name,
    'E-posta': customer.email || '',
    'Cep Telefonu': customer.mobile_phone || '',
    'Ofis Telefonu': customer.office_phone || '',
    'Şirket': customer.company || '',
    'Tip': customer.type === 'bireysel' ? 'Bireysel' : 'Kurumsal',
    'Durum': customer.status === 'aktif' ? 'Aktif' : customer.status === 'pasif' ? 'Pasif' : 'Potansiyel',
    'Temsilci': customer.representative || '',
    'Bakiye': customer.balance,
    'Adres': customer.address || '',
    'Vergi Numarası': customer.tax_number || '',
    'Vergi Dairesi': customer.tax_office || '',
    'Şehir': customer.city || '',
    'İlçe': customer.district || '',
    'Oluşturma Tarihi': customer.created_at ? new Date(customer.created_at).toLocaleDateString('tr-TR') : '',
    'Güncelleme Tarihi': customer.updated_at ? new Date(customer.updated_at).toLocaleDateString('tr-TR') : ''
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const colWidths = [
    { wch: 20 }, // Ad
    { wch: 25 }, // E-posta
    { wch: 15 }, // Cep Telefonu
    { wch: 15 }, // Ofis Telefonu
    { wch: 20 }, // Şirket
    { wch: 10 }, // Tip
    { wch: 12 }, // Durum
    { wch: 15 }, // Temsilci
    { wch: 15 }, // Bakiye
    { wch: 30 }, // Adres
    { wch: 15 }, // Vergi Numarası
    { wch: 15 }, // Vergi Dairesi
    { wch: 12 }, // Şehir
    { wch: 12 }, // İlçe
    { wch: 15 }, // Oluşturma Tarihi
    { wch: 15 }  // Güncelleme Tarihi
  ];
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Müşteriler');

  // Generate file name with current date
  const today = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
  const fileName = `musteriler_${today}.xlsx`;

  // Save file
  XLSX.writeFile(wb, fileName);
};

export const exportCustomerTemplateToExcel = () => {
  // Template data with example row
  const templateData = [
    {
      'Ad': 'Örnek Müşteri A.Ş.',
      'E-posta': 'info@ornekmusteri.com',
      'Cep Telefonu': '+90 555 123 4567',
      'Ofis Telefonu': '+90 212 123 4567',
      'Şirket': 'Örnek Müşteri A.Ş.',
      'Tip': 'kurumsal',
      'Durum': 'aktif',
      'Temsilci': 'Ahmet Yılmaz',
      'Bakiye': 15000,
      'Adres': 'Örnek Mah. Örnek Cad. No:1 İstanbul',
      'Vergi Numarası': '1234567890',
      'Vergi Dairesi': 'Kadıköy',
      'Şehir': 'İstanbul',
      'İlçe': 'Kadıköy'
    }
  ];

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  const colWidths = [
    { wch: 20 }, // Ad
    { wch: 25 }, // E-posta
    { wch: 15 }, // Cep Telefonu
    { wch: 15 }, // Ofis Telefonu
    { wch: 20 }, // Şirket
    { wch: 10 }, // Tip
    { wch: 12 }, // Durum
    { wch: 15 }, // Temsilci
    { wch: 15 }, // Bakiye
    { wch: 30 }, // Adres
    { wch: 15 }, // Vergi Numarası
    { wch: 15 }, // Vergi Dairesi
    { wch: 12 }, // Şehir
    { wch: 12 }  // İlçe
  ];
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Müşteri Şablonu');

  // Save file
  XLSX.writeFile(wb, 'musteri_sablonu.xlsx');
};

export const parseExcelFile = (file: File): Promise<Partial<Customer>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          reject(new Error('Excel dosyası boş veya geçersiz'));
          return;
        }
        
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        // Map headers to expected column names
        const headerMap: { [key: string]: string } = {
          'ad': 'name',
          'isim': 'name',
          'müşteri adı': 'name',
          'e-posta': 'email',
          'email': 'email',
          'eposta': 'email',
          'cep telefonu': 'mobile_phone',
          'telefon': 'mobile_phone',
          'cep': 'mobile_phone',
          'ofis telefonu': 'office_phone',
          'ofis': 'office_phone',
          'şirket': 'company',
          'firma': 'company',
          'tip': 'type',
          'tür': 'type',
          'durum': 'status',
          'temsilci': 'representative',
          'bakiye': 'balance',
          'adres': 'address',
          'vergi numarası': 'tax_number',
          'vergi no': 'tax_number',
          'vkn': 'tax_number',
          'vergi dairesi': 'tax_office',
          'şehir': 'city',
          'il': 'city',
          'ilçe': 'district'
        };
        
        const normalizedHeaders = headers.map(header => 
          headerMap[header?.toLowerCase()] || header?.toLowerCase()
        );
        
        const customers: Partial<Customer>[] = rows
          .filter(row => row.some(cell => cell != null && cell !== ''))
          .map(row => {
            const customer: Partial<Customer> = {};
            
            normalizedHeaders.forEach((header, index) => {
              const value = row[index];
              if (value == null || value === '') return;
              
              switch (header) {
                case 'name':
                  customer.name = String(value);
                  break;
                case 'email':
                  customer.email = String(value);
                  break;
                case 'mobile_phone':
                  customer.mobile_phone = String(value);
                  break;
                case 'office_phone':
                  customer.office_phone = String(value);
                  break;
                case 'company':
                  customer.company = String(value);
                  break;
                case 'type':
                  const typeValue = String(value).toLowerCase();
                  if (typeValue.includes('bireysel') || typeValue.includes('individual')) {
                    customer.type = 'bireysel';
                  } else if (typeValue.includes('kurumsal') || typeValue.includes('corporate')) {
                    customer.type = 'kurumsal';
                  }
                  break;
                case 'status':
                  const statusValue = String(value).toLowerCase();
                  if (statusValue.includes('aktif') || statusValue.includes('active')) {
                    customer.status = 'aktif';
                  } else if (statusValue.includes('pasif') || statusValue.includes('inactive')) {
                    customer.status = 'pasif';
                  } else if (statusValue.includes('potansiyel') || statusValue.includes('potential')) {
                    customer.status = 'potansiyel';
                  }
                  break;
                case 'representative':
                  customer.representative = String(value);
                  break;
                case 'balance':
                  const balanceValue = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
                  if (!isNaN(balanceValue)) {
                    customer.balance = balanceValue;
                  }
                  break;
                case 'address':
                  customer.address = String(value);
                  break;
                case 'tax_number':
                  customer.tax_number = String(value);
                  break;
                case 'tax_office':
                  customer.tax_office = String(value);
                  break;
                case 'city':
                  customer.city = String(value);
                  break;
                case 'district':
                  customer.district = String(value);
                  break;
              }
            });
            
            // Set defaults for required fields
            if (!customer.name) return null;
            if (!customer.type) customer.type = 'bireysel';
            if (!customer.status) customer.status = 'potansiyel';
            if (customer.balance === undefined) customer.balance = 0;
            
            return customer;
          })
          .filter(customer => customer !== null) as Partial<Customer>[];
        
        resolve(customers);
        
      } catch (error) {
        reject(new Error('Excel dosyası okunamadı: ' + error));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Dosya okuma hatası'));
    };
    
    reader.readAsBinaryString(file);
  });
};