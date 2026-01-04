import { ProposalItem } from "@/types/proposal";

interface LineItem extends ProposalItem {
  row_number: number;
}

interface TotalsByCurrency {
  gross: number;
  discount: number;
  net: number;
  vat: number;
  grand: number;
}

/**
 * Calculate totals by currency
 */
export const calculateTotalsByCurrency = (
  items: LineItem[],
  globalDiscountType: 'percentage' | 'amount',
  globalDiscountValue: number,
  vatPercentage: number
): Record<string, TotalsByCurrency> => {
  const totals: Record<string, TotalsByCurrency> = {};
  
  // First, collect all currencies used in items
  const usedCurrencies = new Set<string>();
  items.forEach(item => {
    const currency = item.currency || 'TRY';
    usedCurrencies.add(currency);
  });
  
  // Initialize totals for all used currencies
  usedCurrencies.forEach(currency => {
    totals[currency] = { gross: 0, discount: 0, net: 0, vat: 0, grand: 0 };
  });

  // Calculate gross totals
  items.forEach(item => {
    const currency = item.currency || 'TRY';
    totals[currency].gross += item.quantity * item.unit_price;
  });
  
  // Calculate total gross across all currencies for global discount
  const totalGross = Object.values(totals).reduce((sum, total) => sum + total.gross, 0);
  
  // Apply global discount and VAT calculations for each currency
  Object.keys(totals).forEach(currency => {
    const gross = totals[currency].gross;
    
    // Calculate global discount proportionally for this currency
    let globalDiscount = 0;
    if (globalDiscountValue > 0 && totalGross > 0) {
      const currencyProportion = gross / totalGross;
      if (globalDiscountType === 'percentage') {
        globalDiscount = (gross * globalDiscountValue) / 100;
      } else {
        // Amount discount distributed proportionally
        globalDiscount = globalDiscountValue * currencyProportion;
      }
    }
    
    const net = gross - globalDiscount;
    const vat = (net * (vatPercentage || 0)) / 100;
    const grand = net + vat;
    
    totals[currency] = {
      gross,
      discount: globalDiscount,
      net,
      vat,
      grand
    };
  });
  
  return totals;
};

/**
 * Auto-detect primary currency from items (use the currency with highest total)
 */
export const detectPrimaryCurrency = (
  calculationsByCurrency: Record<string, TotalsByCurrency>,
  fallbackCurrency: string
): string => {
  const currencyTotals = Object.entries(calculationsByCurrency);
  const [detectedCurrency] = currencyTotals.length > 0
    ? currencyTotals.reduce((max, current) => current[1].grand > max[1].grand ? current : max)
    : [fallbackCurrency, { grand: 0 }];
  
  return detectedCurrency || fallbackCurrency;
};

