
export const formatMoney = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const paymentMethods = [
  { value: "bank_transfer", label: "Banka Transferi" },
  { value: "credit_card", label: "Kredi Kartı" },
  { value: "cash", label: "Nakit" },
  { value: "check", label: "Çek" },
  { value: "promissory_note", label: "Senet" }
];

export const deliveryMethods = [
  { value: "standard", label: "Standart Teslimat" },
  { value: "express", label: "Hızlı Teslimat" },
  { value: "pickup", label: "Şubeden Teslim" },
  { value: "cargo", label: "Kargo" }
];

export const paymentTerms = [
  { value: "immediate", label: "Peşin" },
  { value: "net15", label: "15 Gün Vade" },
  { value: "net30", label: "30 Gün Vade" },
  { value: "net60", label: "60 Gün Vade" },
  { value: "custom", label: "Özel Vade" }
];
