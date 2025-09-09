import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Format money value to Turkish format
 */
export const formatMoney = (amount: number | null | undefined, currency = '₺'): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `0,00 ${currency}`;
  }
  
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  // Use TL symbol or currency code for better PDF compatibility
  const symbol = currency === 'TRY' ? '₺' : currency;
  return `${formatted} ${symbol}`;
};

/**
 * Format date to Turkish format
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd.MM.yyyy', { locale: tr });
  } catch (error) {
    console.error('Date formatting error:', error);
    return '-';
  }
};

/**
 * Calculate line total with discount and tax
 */
export const calculateLineTotal = (
  quantity: number,
  unitPrice: number,
  discountPercent?: number,
  taxPercent?: number
): { subtotal: number; discount: number; tax: number; total: number } => {
  const subtotal = quantity * unitPrice;
  const discount = discountPercent ? (subtotal * discountPercent) / 100 : 0;
  const taxableAmount = subtotal - discount;
  const tax = taxPercent ? (taxableAmount * taxPercent) / 100 : 0;
  const total = taxableAmount + tax;

  return {
    subtotal,
    discount,
    tax,
    total
  };
};

/**
 * Calculate totals for all lines
 */
export const calculateTotals = (lines: Array<{
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
}>): { subtotal: number; totalDiscount: number; totalTax: number; grandTotal: number } => {
  const totals = lines.reduce(
    (acc, line) => {
      const lineCalc = calculateLineTotal(
        line.quantity,
        line.unitPrice,
        line.discountPercent,
        line.taxPercent
      );
      
      return {
        subtotal: acc.subtotal + lineCalc.subtotal,
        totalDiscount: acc.totalDiscount + lineCalc.discount,
        totalTax: acc.totalTax + lineCalc.tax,
        grandTotal: acc.grandTotal + lineCalc.total
      };
    },
    { subtotal: 0, totalDiscount: 0, totalTax: 0, grandTotal: 0 }
  );

  return totals;
};

/**
 * Safe text truncation
 */
export const truncateText = (text: string | null | undefined, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Check if required fields are missing for PDF generation
 */
export const validatePdfData = (data: any): { isValid: boolean; missingFields: string[] } => {
  const missingFields: string[] = [];
  
  // Validate minimum required fields for PDF generation
  if (!data.id && !data.number) missingFields.push('Teklif numarası');
  if (!data.customer) missingFields.push('Müşteri bilgileri');
  
  // Customer validation
  if (data.customer && !data.customer.name && !data.customer.company) {
    missingFields.push('Müşteri adı veya şirket adı');
  }
  
  // Items validation (at least one item or allow empty for draft proposals)
  if (!data.items || !Array.isArray(data.items)) {
    missingFields.push('Ürün listesi');
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};
