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
  salary_currency: z.enum(["TRY", "USD", "EUR", "GBP"]).nullable().optional(),
  salary_type: z.enum(["gross", "net", "hourly", "daily"]).nullable().optional(),
  payment_frequency: z.enum(["monthly", "weekly", "daily", "hourly"]).nullable().optional(),
  salary_start_date: z.string().optional(),
  salary_notes: z.string().optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const useEmployeeForm = (employee?: Employee) => {
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      first_name: employee?.first_name || "",
      last_name: employee?.last_name || "",
      email: employee?.email || "",
      phone: employee?.phone || "",
      position: employee?.position || "",
      department: employee?.department || "",
      hire_date: employee?.hire_date || "",
      status: employee?.status || "aktif",
      date_of_birth: employee?.date_of_birth || "",
      gender: employee?.gender || null,
      marital_status: employee?.marital_status || null,
      id_ssn: employee?.id_ssn || "",
      city_id: employee?.city_id || undefined,
      district_id: employee?.district_id || undefined,
      neighborhood_id: employee?.neighborhood_id || undefined,
      address_line: employee?.address_line || "",
      postal_code: employee?.postal_code || "",
      emergency_contact_name: employee?.emergency_contact_name || "",
      emergency_contact_phone: employee?.emergency_contact_phone || "",
      emergency_contact_relation: employee?.emergency_contact_relation || "",
      salary_amount: employee?.salary_amount || undefined,
      salary_currency: employee?.salary_currency || null,
      salary_type: employee?.salary_type || null,
      payment_frequency: employee?.payment_frequency || null,
      salary_start_date: employee?.salary_start_date || "",
      salary_notes: employee?.salary_notes || "",
    },
  });

  return form;
};
