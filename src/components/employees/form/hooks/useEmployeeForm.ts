import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Employee } from "@/types/employee";

const employeeFormSchema = z.object({
  // Temel Bilgiler
  first_name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  last_name: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string().optional(),
  
  // İstihdam Bilgileri
  position: z.string().min(1, "Pozisyon zorunludur"),
  department: z.string().min(1, "Departman zorunludur"),
  hire_date: z.string().min(1, "İşe başlama tarihi zorunludur"),
  status: z.enum(["aktif", "pasif"]),
  
  // Kişisel Bilgiler
  date_of_birth: z.string().optional(),
  gender: z.enum(["erkek", "kadın", "diğer"]).nullable().optional(),
  marital_status: z.enum(["bekar", "evli", "boşanmış", "dul"]).nullable().optional(),
  id_ssn: z.string().optional(),
  
  // Adres Bilgileri
  city_id: z.number().optional(),
  district_id: z.number().optional(),
  neighborhood_id: z.number().optional(),
  address_line: z.string().optional(),
  postal_code: z.string().optional(),
  
  // Acil Durum İletişim
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relation: z.string().optional(),
  
  // Mali Bilgiler
  salary_amount: z.number().optional(),
  salary_currency: z.enum(["TRY", "USD", "EUR", "GBP"]).optional(),
  salary_type: z.enum(["gross", "net", "hourly", "daily"]).optional(),
  payment_frequency: z.enum(["monthly", "weekly", "daily", "hourly"]).optional(),
  salary_start_date: z.string().optional(),
  salary_notes: z.string().optional(),
  net_salary: z.number().optional(),
  manual_employer_sgk_cost: z.number().optional(),
  meal_allowance: z.number().optional(),
  transport_allowance: z.number().optional(),
  notes: z.string().optional(),
  balance: z.number().optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

// Helper functions to convert between database and form values
const salaryTypeToTurkish = (type: string | null | undefined): "brüt" | "net" | "saatlik" | "günlük" | null => {
  if (!type) return null;
  const mapping: Record<string, "brüt" | "net" | "saatlik" | "günlük"> = {
    "gross": "brüt",
    "net": "net",
    "hourly": "saatlik",
    "daily": "günlük"
  };
  return mapping[type] || null;
};

const paymentFrequencyToTurkish = (freq: string | null | undefined): "aylık" | "haftalık" | "günlük" | "saatlik" | null => {
  if (!freq) return null;
  const mapping: Record<string, "aylık" | "haftalık" | "günlük" | "saatlik"> = {
    "monthly": "aylık",
    "weekly": "haftalık",
    "daily": "günlük",
    "hourly": "saatlik"
  };
  return mapping[freq] || null;
};

export const useEmployeeForm = (employee?: Employee) => {
  const defaultValues: EmployeeFormValues = employee ? {
    first_name: employee.first_name || "",
    last_name: employee.last_name || "",
    email: employee.email || "",
    phone: employee.phone || "",
    position: employee.position || "",
    department: employee.department || "",
    hire_date: employee.hire_date || "",
    status: employee.status || "aktif",
    date_of_birth: employee.date_of_birth || "",
    gender: employee.gender || null,
    marital_status: employee.marital_status || null,
    id_ssn: employee.id_ssn || "",
    city_id: employee.city_id || undefined,
    district_id: employee.district_id || undefined,
    neighborhood_id: employee.neighborhood_id || undefined,
    address_line: employee.address_line || "",
    postal_code: employee.postal_code || "",
    emergency_contact_name: employee.emergency_contact_name || "",
    emergency_contact_phone: employee.emergency_contact_phone || "",
    emergency_contact_relation: employee.emergency_contact_relation || "",
    salary_amount: employee.salary_amount || undefined,
    salary_currency: employee.salary_currency || undefined,
    salary_type: employee.salary_type || undefined,
    payment_frequency: employee.payment_frequency || undefined,
    salary_start_date: employee.salary_start_date || "",
    salary_notes: employee.salary_notes || "",
    net_salary: employee.net_salary || undefined,
    manual_employer_sgk_cost: employee.manual_employer_sgk_cost || undefined,
    meal_allowance: employee.meal_allowance || undefined,
    transport_allowance: employee.transport_allowance || undefined,
    notes: employee.salary_notes || "",
    balance: employee.balance || undefined,
  } : {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    hire_date: "",
    status: "aktif",
    date_of_birth: "",
    gender: null,
    marital_status: null,
    id_ssn: "",
    city_id: undefined,
    district_id: undefined,
    neighborhood_id: undefined,
    address_line: "",
    postal_code: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "",
    salary_amount: undefined,
    salary_currency: undefined,
    salary_type: undefined,
    payment_frequency: undefined,
    salary_start_date: "",
    salary_notes: "",
    net_salary: undefined,
    manual_employer_sgk_cost: undefined,
    meal_allowance: undefined,
    transport_allowance: undefined,
    notes: "",
    balance: undefined,
  };

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues,
    values: employee ? defaultValues : undefined, // Force re-render when employee data changes
  });

  return form;
};
