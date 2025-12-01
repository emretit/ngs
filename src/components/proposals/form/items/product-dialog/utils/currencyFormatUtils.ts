
export function getCurrencyName(code: string) {
  const currencies: Record<string, string> = {
    TRY: "Türk Lirası",
    TL: "Türk Lirası",
    USD: "Amerikan Doları",
    EUR: "Euro",
    GBP: "İngiliz Sterlini"
  };
  // TRY için "Türk Lirası" döndür
  const normalizedCode = code === "TL" ? "TRY" : code;
  return currencies[normalizedCode] || currencies[code] || code;
}

export function getCurrencySymbol(code: string) {
  const symbols: Record<string, string> = {
    TRY: "₺",
    TL: "₺",
    USD: "$",
    EUR: "€",
    GBP: "£"
  };
  // TRY için "₺" döndür
  const normalizedCode = code === "TL" ? "TRY" : code;
  return symbols[normalizedCode] || symbols[code] || code;
}
