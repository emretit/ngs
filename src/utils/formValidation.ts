import { z } from 'zod';
import { toast } from 'sonner';

/**
 * Centralized form validation utilities
 * Provides consistent validation patterns across the application
 */

/**
 * Proposal form validation schema
 */
export const proposalFormSchema = z.object({
  customer_id: z.string().min(1, "Müşteri bilgisi seçilmelidir"),
  subject: z.string().min(1, "Teklif konusu gereklidir"),
  offer_date: z.date().optional(),
  validity_date: z.date({
    required_error: "Geçerlilik tarihi gereklidir",
    invalid_type_error: "Geçerli bir tarih seçiniz",
  }),
  items: z.array(z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    quantity: z.number().min(0.01, "Miktar 0'dan büyük olmalıdır"),
    unit_price: z.number().min(0, "Birim fiyat negatif olamaz"),
  })).min(1, "En az bir teklif kalemi eklenmelidir")
    .refine((items) => {
      return items.some(item => 
        (item.name && item.name.trim().length > 0) || 
        (item.description && item.description.trim().length > 0)
      );
    }, {
      message: "En az bir teklif kalemi eklenmelidir",
    })
    .refine((items) => {
      return items.every((item, index) => {
        const hasNameOrDescription = 
          (item.name && item.name.trim().length > 0) || 
          (item.description && item.description.trim().length > 0);
        if (!hasNameOrDescription) {
          return false;
        }
        return true;
      });
    }, {
      message: "Tüm kalemlerde ürün/hizmet adı gereklidir",
    }),
}).refine((data) => {
  const minDate = data.offer_date || new Date();
  return data.validity_date >= minDate;
}, {
  message: "Geçerlilik tarihi teklif tarihinden sonra olmalıdır",
  path: ["validity_date"]
});

/**
 * Order form validation schema
 */
export const orderFormSchema = z.object({
  customer_company: z.string().min(1, "Müşteri firma adı gereklidir"),
  contact_name: z.string().min(1, "İletişim kişisi adı gereklidir"),
  order_date: z.date({
    required_error: "Sipariş tarihi gereklidir",
    invalid_type_error: "Geçerli bir tarih seçiniz",
  }),
  subject: z.string().min(1, "Sipariş konusu gereklidir"),
  items: z.array(z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    quantity: z.number().min(0.01, "Miktar 0'dan büyük olmalıdır"),
    unit_price: z.number().min(0, "Birim fiyat negatif olamaz"),
  })).min(1, "En az bir sipariş kalemi eklenmelidir")
    .refine((items) => {
      return items.some(item => 
        (item.name && item.name.trim().length > 0) || 
        (item.description && item.description.trim().length > 0)
      );
    }, {
      message: "En az bir sipariş kalemi eklenmelidir",
    })
    .refine((items) => {
      return items.every((item) => {
        const hasNameOrDescription = 
          (item.name && item.name.trim().length > 0) || 
          (item.description && item.description.trim().length > 0);
        if (!hasNameOrDescription) {
          return false;
        }
        return true;
      });
    }, {
      message: "Tüm kalemlerde ürün/hizmet adı gereklidir",
    }),
});

/**
 * Validates proposal form data
 */
export const validateProposalForm = (data: {
  customer_id?: string;
  subject?: string;
  offer_date?: Date;
  validity_date?: Date;
  items?: Array<{ name?: string; description?: string; quantity?: number; unit_price?: number }>;
}): { isValid: boolean; errors: string[] } => {
  try {
    proposalFormSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: ['Bilinmeyen validasyon hatası'] };
  }
};

/**
 * Validates order form data
 */
export const validateOrderForm = (data: {
  customer_company?: string;
  contact_name?: string;
  order_date?: Date;
  subject?: string;
  items?: Array<{ name?: string; description?: string; quantity?: number; unit_price?: number }>;
}): { isValid: boolean; errors: string[] } => {
  try {
    orderFormSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: ['Bilinmeyen validasyon hatası'] };
  }
};

/**
 * Validates form and shows toast errors
 */
export const validateAndShowErrors = (
  validationResult: { isValid: boolean; errors: string[] },
  showToast: boolean = true
): boolean => {
  if (!validationResult.isValid && validationResult.errors.length > 0) {
    if (showToast) {
      validationResult.errors.forEach(error => {
        toast.error(error);
      });
    }
    return false;
  }
  return true;
};

/**
 * Warehouse form validation schema
 */
export const warehouseFormSchema = z.object({
  name: z.string().min(1, "Depo adı gereklidir"),
  code: z.string().optional(),
  email: z.string().email("Geçerli bir e-posta adresi giriniz").optional().or(z.literal("")),
  manager_email: z.string().email("Geçerli bir e-posta adresi giriniz").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  phone: z.string().optional(),
  manager_name: z.string().optional(),
  manager_phone: z.string().optional(),
  warehouse_type: z.enum(["main", "branch", "temporary"]).optional(),
  is_active: z.boolean().optional(),
  capacity: z.number().positive().optional(),
  capacity_unit: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Validates warehouse form data
 */
export const validateWarehouseForm = (data: {
  name?: string;
  email?: string;
  manager_email?: string;
  [key: string]: any;
}): { isValid: boolean; errors: Record<string, string> } => {
  try {
    warehouseFormSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach(err => {
        const path = err.path[0] as string;
        if (path) {
          errors[path] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Bilinmeyen validasyon hatası' } };
  }
};

/**
 * Common validation rules
 */
export const validationRules = {
  required: (fieldName: string) => `${fieldName} gereklidir`,
  minLength: (fieldName: string, min: number) => `${fieldName} en az ${min} karakter olmalıdır`,
  maxLength: (fieldName: string, max: number) => `${fieldName} en fazla ${max} karakter olabilir`,
  email: () => "Geçerli bir e-posta adresi giriniz",
  min: (fieldName: string, min: number) => `${fieldName} en az ${min} olmalıdır`,
  max: (fieldName: string, max: number) => `${fieldName} en fazla ${max} olabilir`,
  positive: (fieldName: string) => `${fieldName} pozitif bir sayı olmalıdır`,
  futureDate: (fieldName: string) => `${fieldName} bugünden sonra olmalıdır`,
};

