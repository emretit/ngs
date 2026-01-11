/**
 * Module Report - Shared Types and Config
 */

export type ModuleType = 
  | "customers"
  | "suppliers"
  | "employees"
  | "products"
  | "vehicles"
  | "sales_invoices"
  | "purchase_invoices"
  | "opportunities"
  | "service_records"
  | "bank_accounts";

export interface ModuleReportOptions {
  module: ModuleType;
  startDate?: string;
  endDate?: string;
}

export interface ModuleConfig {
  tableName: string;
  displayName: string;
  icon: string;
  columns: Record<string, string>;
  relations?: string;
}

export const moduleConfig: Record<ModuleType, ModuleConfig> = {
  customers: {
    tableName: "customers",
    displayName: "Müşteriler",
    icon: "👥",
    columns: {
      "name": "Müşteri Adı",
      "email": "E-posta",
      "phone": "Telefon",
      "address": "Adres",
      "tax_number": "Vergi No",
      "created_at": "Kayıt Tarihi"
    }
  },
  suppliers: {
    tableName: "suppliers",
    displayName: "Tedarikçiler",
    icon: "🏭",
    columns: {
      "name": "Tedarikçi Adı",
      "email": "E-posta",
      "phone": "Telefon",
      "address": "Adres",
      "tax_number": "Vergi No",
      "created_at": "Kayıt Tarihi"
    }
  },
  employees: {
    tableName: "employees",
    displayName: "Çalışanlar",
    icon: "👔",
    relations: "*, departments(name)",
    columns: {
      "first_name": "Ad",
      "last_name": "Soyad",
      "email": "E-posta",
      "phone": "Telefon",
      "position": "Pozisyon",
      "hire_date": "İşe Başlama",
      "status": "Durum"
    }
  },
  products: {
    tableName: "products",
    displayName: "Ürünler",
    icon: "📦",
    columns: {
      "code": "Ürün Kodu",
      "name": "Ürün Adı",
      "category": "Kategori",
      "unit": "Birim",
      "stock_quantity": "Stok",
      "purchase_price": "Alış Fiyatı",
      "sale_price": "Satış Fiyatı"
    }
  },
  vehicles: {
    tableName: "vehicles",
    displayName: "Araçlar",
    icon: "🚗",
    columns: {
      "plate_number": "Plaka",
      "brand": "Marka",
      "model": "Model",
      "year": "Yıl",
      "fuel_type": "Yakıt Tipi",
      "current_km": "Kilometre",
      "status": "Durum"
    }
  },
  sales_invoices: {
    tableName: "sales_invoices",
    displayName: "Satış Faturaları",
    icon: "💰",
    relations: "*, customers(name)",
    columns: {
      "invoice_number": "Fatura No",
      "invoice_date": "Fatura Tarihi",
      "total_amount": "Tutar",
      "currency": "Para Birimi",
      "status": "Durum",
      "due_date": "Vade Tarihi"
    }
  },
  purchase_invoices: {
    tableName: "purchase_invoices",
    displayName: "Alış Faturaları",
    icon: "🛒",
    relations: "*, suppliers(name)",
    columns: {
      "invoice_number": "Fatura No",
      "invoice_date": "Fatura Tarihi",
      "total_amount": "Tutar",
      "currency": "Para Birimi",
      "status": "Durum",
      "due_date": "Vade Tarihi"
    }
  },
  opportunities: {
    tableName: "opportunities",
    displayName: "Satış Fırsatları",
    icon: "🎯",
    columns: {
      "name": "Fırsat Adı",
      "customer_name": "Müşteri",
      "stage": "Aşama",
      "value": "Değer",
      "currency": "Para Birimi",
      "probability": "Olasılık",
      "expected_close_date": "Beklenen Kapanış"
    }
  },
  service_records: {
    tableName: "service_records",
    displayName: "Servis Kayıtları",
    icon: "🔧",
    relations: "*, vehicles(plate_number, brand, model)",
    columns: {
      "service_type": "Servis Tipi",
      "description": "Açıklama",
      "cost": "Maliyet",
      "service_date": "Servis Tarihi",
      "next_service_km": "Sonraki Servis KM",
      "status": "Durum"
    }
  },
  bank_accounts: {
    tableName: "bank_accounts",
    displayName: "Banka Hesapları",
    icon: "🏦",
    columns: {
      "account_name": "Hesap Adı",
      "bank_name": "Banka",
      "account_type": "Hesap Tipi",
      "iban": "IBAN",
      "current_balance": "Bakiye",
      "currency": "Para Birimi"
    }
  }
};
