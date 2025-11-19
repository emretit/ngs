
export function getCurrencyName(code: string) {
  const currencies: Record<string, string> = {
    TRY: "Türk Lirası",
    TL: "Türk Lirası",
    USD: "Amerikan Doları",
    EUR: "Euro",
    GBP: "İngiliz Sterlini"
  };
  // TRY veya TL için "Türk Lirası" döndür
  return currencies[code] || currencies[code === "TRY" ? "TL" : code] || code;
}

export function getCurrencySymbol(code: string) {
  const symbols: Record<string, string> = {
    TRY: "₺",
    TL: "₺",
    USD: "$",
    EUR: "€",
    GBP: "£"
  };
  // TRY veya TL için "₺" döndür
  return symbols[code] || symbols[code === "TRY" ? "TL" : code] || code;
}
