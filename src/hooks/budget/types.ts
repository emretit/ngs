// Shared types and constants for budget matrix hooks

export interface MatrixCell {
  id?: string;
  budget_amount: number;
  actual_amount: number;
  forecast_amount: number;
  variance: number;
  variancePercent: number;
  status: "draft" | "approved" | "locked";
  isEditing?: boolean;
}

export interface MatrixRow {
  category: string;
  subcategory: string | null;
  isExpanded?: boolean;
  isSubcategory?: boolean;
  parentCategory?: string;
  months: Record<number, MatrixCell>;
  total: MatrixCell;
  ytd: MatrixCell;
}

export interface MatrixConfig {
  year: number;
  currency: string;
  department_id?: string;
  showActual: boolean;
  showForecast: boolean;
  showVariance: boolean;
}

export const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export const defaultCell: MatrixCell = {
  budget_amount: 0,
  actual_amount: 0,
  forecast_amount: 0,
  variance: 0,
  variancePercent: 0,
  status: "draft",
};
