
import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Ürün adı zorunludur").max(255, "Ürün adı çok uzun"),
  price: z.coerce.number().min(0, "Fiyat 0'dan küçük olamaz").max(999999999, "Fiyat çok büyük"),
  stock_quantity: z.coerce.number().min(0, "Stok miktarı 0'dan küçük olamaz").max(999999, "Stok miktarı çok büyük"),
  unit: z.string().min(1, "Birim zorunludur").max(50, "Birim adı çok uzun"),
  tax_rate: z.coerce.number().min(0, "Vergi oranı 0'dan küçük olamaz").max(100, "Vergi oranı 100'den büyük olamaz"),
  currency: z.string().min(1, "Para birimi zorunludur").length(3, "Para birimi 3 karakter olmalıdır"),
  product_type: z.string().min(1, "Ürün tipi zorunludur").max(100, "Ürün tipi çok uzun"),
  is_active: z.boolean(),
  // Optional fields with enhanced validation
  description: z.string().nullable().optional().transform(val => val || ""),
  sku: z.string().nullable().optional().transform(val => val || "").refine(val => !val || val.length <= 100, "SKU çok uzun"),
  barcode: z.string().nullable().optional().transform(val => val || "").refine(val => !val || val.length <= 50, "Barkod çok uzun"),
  discount_price: z.coerce.number().min(0, "İndirimli fiyat 0'dan küçük olamaz").nullable().optional(),
  min_stock_level: z.coerce.number().min(0, "Minimum stok seviyesi 0'dan küçük olamaz").optional().default(0),
  stock_threshold: z.coerce.number().min(0, "Stok eşiği 0'dan küçük olamaz").optional().default(0),
  exchange_rate: z.coerce.number().min(0.001, "Döviz kuru çok küçük").optional(),
  category_type: z.string().optional().default("product").refine(val => ["product", "service"].includes(val), "Geçersiz kategori tipi"),
  status: z.string().optional().default("active").refine(val => ["active", "inactive", "discontinued"].includes(val), "Geçersiz durum"),
  image_url: z.string().url("Geçersiz URL formatı").nullable().optional(),
  category_id: z.string().uuid("Geçersiz kategori ID").nullable().optional(),
  supplier_id: z.string().uuid("Geçersiz tedarikçi ID").nullable().optional(),
  purchase_price: z.coerce.number().min(0, "Alış fiyatı 0'dan küçük olamaz").nullable().optional(),
  price_includes_vat: z.boolean().optional().default(false),
  purchase_price_includes_vat: z.boolean().optional().default(false),
}).refine(data => {
  // Custom validation: discount_price should be less than price
  if (data.discount_price && data.price && data.discount_price >= data.price) {
    return false;
  }
  return true;
}, {
  message: "İndirimli fiyat, normal fiyattan küçük olmalıdır",
  path: ["discount_price"]
});

export type ProductFormSchema = z.infer<typeof productSchema>;
