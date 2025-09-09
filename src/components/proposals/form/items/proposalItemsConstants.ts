
export const CURRENCY_OPTIONS = [
  { value: "TRY", label: "₺ TRY" },
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
  { value: "GBP", label: "£ GBP" },
];

export const TAX_RATE_OPTIONS = [
  { value: 20, label: "20%" },
  { value: 18, label: "18%" },
  { value: 10, label: "10%" },
  { value: 8, label: "8%" },
  { value: 1, label: "1%" },
  { value: 0, label: "0%" },
];

export const DEFAULT_EXCHANGE_RATES = {
  TRY: 1,
  USD: 32.5,
  EUR: 35.2,
  GBP: 41.3,
};

// Yeni eklenen teklif grubu/kategorileri
export const PROPOSAL_ITEM_GROUPS = [
  { value: "urun", label: "Ürünler" },
  { value: "hizmet", label: "Hizmetler" },
  { value: "yazilim", label: "Yazılım" },
  { value: "donanim", label: "Donanım" },
  { value: "diger", label: "Diğer" },
];
