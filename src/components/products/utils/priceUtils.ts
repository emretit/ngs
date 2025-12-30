// Import centralized formatCurrency from formatters
import { formatCurrency } from '@/utils/formatters';

// Re-export for backward compatibility
export { formatCurrency };

export const formatPrice = (value: number | null, currency: string) => {
  if (value === null) return "0,00";
  // Use centralized formatCurrency
  return formatCurrency(value, currency);
};

export const calculateTax = (price: number, taxRate: number) => {
  return price * (taxRate / 100);
};

export const calculateDiscount = (originalPrice: number, discountedPrice: number | null) => {
  if (!discountedPrice || originalPrice === 0) return 0;
  return ((originalPrice - discountedPrice) / originalPrice) * 100;
};
