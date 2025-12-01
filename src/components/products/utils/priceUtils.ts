export const formatPrice = (value: number | null, currency: string) => {
  if (value === null) return "0,00";
  // Convert TL to TRY directly
  const currencyCode = currency === 'TL' ? 'TRY' : (currency || 'TRY');
  return new Intl.NumberFormat('tr-TR', { 
    style: 'currency', 
    currency: currencyCode
  }).format(value);
};

export const calculateTax = (price: number, taxRate: number) => {
  return price * (taxRate / 100);
};

export const calculateDiscount = (originalPrice: number, discountedPrice: number | null) => {
  if (!discountedPrice || originalPrice === 0) return 0;
  return ((originalPrice - discountedPrice) / originalPrice) * 100;
};

export const formatCurrency = (value: number, currency: string = "TRY") => {
  // Convert TL to TRY directly
  const currencyCode = currency === 'TL' ? 'TRY' : (currency || 'TRY');
  return new Intl.NumberFormat('tr-TR', { 
    style: 'currency', 
    currency: currencyCode
  }).format(value);
};
