
export interface ExchangeRates {
  [currency: string]: number;
}

export interface CurrencyOption {
  value: string;
  label: string;
  symbol: string;
}
