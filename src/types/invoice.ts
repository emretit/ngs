
export interface InvoiceDetail {
  invoiceInfo: {
    number: string;
    date: string;
    totalAmount: number;
    currency: string;
    taxTotalAmount: number;
    lineExtensionAmount: number;
  };
  supplier: {
    name: string;
    taxNumber: string;
    address: string;
  };
  items: InvoiceItem[];
}

export interface InvoiceItem {
  description: string;
  productCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  discountRate: number;
  discountAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  supplierTaxNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  taxAmount: number;
  status: string;
  pdfUrl: string | null;
  xmlData: any;
}
