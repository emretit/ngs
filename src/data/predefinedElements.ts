// import { ElementCategory } from '@/types/template-builder';

export const PREDEFINED_ELEMENTS: any[] = [
  {
    id: 'company',
    name: 'Firma Bilgileri',
    icon: '🏢',
    elements: [
      {
        id: 'companyName',
        name: 'companyName',
        label: 'Firma Adı',
        category: 'company',
        type: 'text',
        defaultProps: {
          position: { x: 50, y: 50 },
          width: 200,
          height: 25,
          fontSize: 16,
          fontName: 'Helvetica',
          alignment: 'left',
          fontColor: '#000000'
        },
        dataBinding: 'companyName',
        description: 'Firma/şirket adı',
        icon: '🏢'
      },
      {
        id: 'companyAddress',
        name: 'companyAddress',
        label: 'Firma Adresi',
        category: 'company',
        type: 'multiline',
        defaultProps: {
          position: { x: 50, y: 80 },
          width: 200,
          height: 40,
          fontSize: 10,
          fontName: 'Helvetica',
          alignment: 'left',
          fontColor: '#666666'
        },
        dataBinding: 'companyAddress',
        description: 'Firma adresi (çok satırlı)',
        icon: '📍'
      },
      {
        id: 'companyPhone',
        name: 'companyPhone',
        label: 'Firma Telefon',
        category: 'company',
        type: 'text',
        defaultProps: {
          position: { x: 50, y: 130 },
          width: 150,
          height: 20,
          fontSize: 10,
          fontName: 'Helvetica',
          alignment: 'left',
          fontColor: '#666666'
        },
        dataBinding: 'companyPhone',
        description: 'Firma telefon numarası',
        icon: '📞'
      },
      {
        id: 'companyEmail',
        name: 'companyEmail',
        label: 'Firma E-mail',
        category: 'company',
        type: 'text',
        defaultProps: {
          position: { x: 50, y: 150 },
          width: 150,
          height: 20,
          fontSize: 10,
          fontName: 'Helvetica',
          alignment: 'left',
          fontColor: '#666666'
        },
        dataBinding: 'companyEmail',
        description: 'Firma e-mail adresi',
        icon: '✉️'
      },
      {
        id: 'companyLogo',
        name: 'companyLogo',
        label: 'Firma Logo',
        category: 'company',
        type: 'image',
        defaultProps: {
          position: { x: 450, y: 30 },
          width: 80,
          height: 60,
        },
        dataBinding: 'companyLogo',
        description: 'Firma logosu',
        icon: '🖼️'
      }
    ]
  },
  {
    id: 'customer',
    name: 'Müşteri Bilgileri',
    icon: '👤',
    elements: [
      {
        id: 'customerName',
        name: 'customerName',
        label: 'Müşteri Adı',
        category: 'customer',
        type: 'text',
        defaultProps: {
          position: { x: 300, y: 150 },
          width: 200,
          height: 25,
          fontSize: 14,
          fontName: 'Helvetica',
          alignment: 'left',
          fontColor: '#000000'
        },
        dataBinding: 'customerName',
        description: 'Müşteri/firma adı',
        icon: '👤'
      },
      {
        id: 'customerAddress',
        name: 'customerAddress',
        label: 'Müşteri Adresi',
        category: 'customer',
        type: 'multiline',
        defaultProps: {
          position: { x: 300, y: 180 },
          width: 200,
          height: 40,
          fontSize: 10,
          fontName: 'Helvetica',
          alignment: 'left',
          fontColor: '#666666'
        },
        dataBinding: 'customerAddress',
        description: 'Müşteri adresi',
        icon: '📍'
      },
      {
        id: 'customerPhone',
        name: 'customerPhone',
        label: 'Müşteri Telefon',
        category: 'customer',
        type: 'text',
        defaultProps: {
          position: { x: 300, y: 230 },
          width: 150,
          height: 20,
          fontSize: 10,
          fontName: 'Helvetica',
          alignment: 'left',
          fontColor: '#666666'
        },
        dataBinding: 'customerPhone',
        description: 'Müşteri telefon',
        icon: '📞'
      },
      {
        id: 'customerEmail',
        name: 'customerEmail',
        label: 'Müşteri E-mail',
        category: 'customer',
        type: 'text',
        defaultProps: {
          position: { x: 300, y: 250 },
          width: 150,
          height: 20,
          fontSize: 10,
          fontName: 'Helvetica',
          alignment: 'left',
          fontColor: '#666666'
        },
        dataBinding: 'customerEmail',
        description: 'Müşteri e-mail',
        icon: '✉️'
      }
    ]
  },
  {
    id: 'proposal',
    name: 'Teklif Bilgileri',
    icon: '📄',
    elements: [
      {
        id: 'proposalTitle',
        name: 'proposalTitle',
        label: 'Teklif Başlığı',
        category: 'proposal',
        type: 'text',
        defaultProps: {
          position: { x: 200, y: 120 },
          width: 200,
          height: 30,
          fontSize: 18,
          fontName: 'Helvetica-Bold',
          alignment: 'center',
          fontColor: '#000000'
        },
        dataBinding: 'proposalTitle',
        description: 'Teklif dokümanı başlığı',
        icon: '📄'
      },
      {
        id: 'proposalNumber',
        name: 'proposalNumber',
        label: 'Teklif Numarası',
        category: 'proposal',
        type: 'text',
        defaultProps: {
          position: { x: 50, y: 200 },
          width: 150,
          height: 20,
          fontSize: 12,
          fontName: 'Helvetica',
          alignment: 'left',
          fontColor: '#000000'
        },
        dataBinding: 'proposalNumber',
        description: 'Benzersiz teklif numarası',
        icon: '#️⃣'
      },
      {
        id: 'proposalDate',
        name: 'proposalDate',
        label: 'Teklif Tarihi',
        category: 'proposal',
        type: 'date',
        defaultProps: {
          position: { x: 50, y: 220 },
          width: 100,
          height: 20,
          fontSize: 12,
          fontName: 'Helvetica',
          alignment: 'left',
          fontColor: '#000000'
        },
        dataBinding: 'proposalDate',
        description: 'Teklif oluşturulma tarihi',
        icon: '📅'
      },
      {
        id: 'validUntil',
        name: 'validUntil',
        label: 'Geçerlilik Tarihi',
        category: 'proposal',
        type: 'date',
        defaultProps: {
          position: { x: 200, y: 220 },
          width: 100,
          height: 20,
          fontSize: 12,
          fontName: 'Helvetica',
          alignment: 'left',
          fontColor: '#000000'
        },
        dataBinding: 'validUntil',
        description: 'Teklifin geçerli olduğu son tarih',
        icon: '⏰'
      }
    ]
  },
  {
    id: 'financial',
    name: 'Mali Bilgiler',
    icon: '💰',
    elements: [
      {
        id: 'subtotal',
        name: 'subtotal',
        label: 'Ara Toplam',
        category: 'financial',
        type: 'number',
        defaultProps: {
          position: { x: 400, y: 600 },
          width: 100,
          height: 20,
          fontSize: 12,
          fontName: 'Helvetica',
          alignment: 'right',
          fontColor: '#000000'
        },
        dataBinding: 'subtotal',
        description: 'KDV hariç toplam tutar',
        icon: '🧮'
      },
      {
        id: 'taxAmount',
        name: 'taxAmount',
        label: 'KDV Tutarı',
        category: 'financial',
        type: 'number',
        defaultProps: {
          position: { x: 400, y: 620 },
          width: 100,
          height: 20,
          fontSize: 12,
          fontName: 'Helvetica',
          alignment: 'right',
          fontColor: '#000000'
        },
        dataBinding: 'taxAmount',
        description: 'KDV tutarı',
        icon: '📊'
      },
      {
        id: 'totalAmount',
        name: 'totalAmount',
        label: 'Genel Toplam',
        category: 'financial',
        type: 'number',
        defaultProps: {
          position: { x: 400, y: 640 },
          width: 100,
          height: 25,
          fontSize: 14,
          fontName: 'Helvetica-Bold',
          alignment: 'right',
          fontColor: '#000000',
          backgroundColor: '#f0f0f0',
          borderWidth: 1,
          borderColor: '#cccccc'
        },
        dataBinding: 'totalAmount',
        description: 'KDV dahil genel toplam',
        icon: '💰'
      },
      {
        id: 'taxRate',
        name: 'taxRate',
        label: 'KDV Oranı',
        category: 'financial',
        type: 'text',
        defaultProps: {
          position: { x: 350, y: 620 },
          width: 50,
          height: 20,
          fontSize: 12,
          fontName: 'Helvetica',
          alignment: 'right',
          fontColor: '#000000'
        },
        dataBinding: 'taxRate',
        description: 'KDV oranı (%18 gibi)',
        icon: '%'
      }
    ]
  },
  {
    id: 'items',
    name: 'Ürün/Hizmet',
    icon: '📋',
    elements: [
      {
        id: 'itemsTable',
        name: 'itemsTable',
        label: 'Ürün/Hizmet Tablosu',
        category: 'items',
        type: 'table',
        defaultProps: {
          position: { x: 50, y: 300 },
          width: 500,
          height: 200,
          fontSize: 10,
          fontName: 'Helvetica',
          alignment: 'left',
          fontColor: '#000000',
          borderWidth: 1,
          borderColor: '#cccccc'
        },
        dataBinding: 'items',
        description: 'Ürün/hizmet listesi tablosu',
        icon: '📋'
      }
    ]
  },
  {
    id: 'terms',
    name: 'Şartlar & Notlar',
    icon: '📝',
    elements: [
      {
        id: 'paymentTerms',
        name: 'paymentTerms',
        label: 'Ödeme Şartları',
        category: 'terms',
        type: 'multiline',
        defaultProps: {
          position: { x: 50, y: 700 },
          width: 250,
          height: 60,
          fontSize: 9,
          fontName: 'Helvetica',
          alignment: 'left',
          fontColor: '#666666'
        },
        dataBinding: 'paymentTerms',
        description: 'Ödeme koşulları ve şartları',
        icon: '💳'
      },
      {
        id: 'deliveryTerms',
        name: 'deliveryTerms',
        label: 'Teslimat Şartları',
        category: 'terms',
        type: 'multiline',
        defaultProps: {
          position: { x: 320, y: 700 },
          width: 250,
          height: 60,
          fontSize: 9,
          fontName: 'Helvetica',
          alignment: 'left',
          fontColor: '#666666'
        },
        dataBinding: 'deliveryTerms',
        description: 'Teslimat koşulları',
        icon: '🚚'
      },
      {
        id: 'notes',
        name: 'notes',
        label: 'Notlar',
        category: 'terms',
        type: 'multiline',
        defaultProps: {
          position: { x: 50, y: 780 },
          width: 500,
          height: 40,
          fontSize: 9,
          fontName: 'Helvetica',
          alignment: 'left',
          fontColor: '#666666'
        },
        dataBinding: 'notes',
        description: 'Ek notlar ve açıklamalar',
        icon: '📝'
      }
    ]
  }
];

export const getAllElements = () => {
  return PREDEFINED_ELEMENTS.flatMap(category => category.elements);
};

export const getElementById = (id: string) => {
  return getAllElements().find(element => element.id === id);
};

export const getElementsByCategory = (categoryId: string) => {
  const category = PREDEFINED_ELEMENTS.find(cat => cat.id === categoryId);
  return category ? category.elements : [];
};