import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * @deprecated Use formatCurrency from @/utils/formatters instead
 * This version does not handle NaN/Infinity properly
 */
export function formatCurrency(amount: number, currency: string = 'TRY'): string {
  // Convert TL to TRY directly
  const currencyCode = currency === 'TL' ? 'TRY' : (currency || 'TRY');
  const formatter = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

/**
 * @deprecated Use formatDate from @/utils/dateUtils instead
 * This version has a fixed format, use dateUtils for flexible formatting
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  const lang = typeof window !== 'undefined' ? (localStorage.getItem('i18nextLng') || 'tr') : 'tr';
  const locale = lang === 'en' ? 'en-US' : 'tr-TR';
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
