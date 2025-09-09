
export function getCurrencyName(code: string) {
  const currencies: Record<string, string> = {
    TRY: "Türk Lirası",
    USD: "Amerikan Doları",
    EUR: "Euro",
    GBP: "İngiliz Sterlini"
  };
  return currencies[code] || code;
}

export function getCurrencySymbol(code: string) {
  const symbols: Record<string, string> = {
    TRY: "₺",
    USD: "$",
    EUR: "€",
    GBP: "£"
  };
  return symbols[code] || code;
}
