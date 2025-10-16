
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toastUtils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BasicInfoSection } from "./sections/BasicInfoSection";
import { AddressSection } from "./sections/AddressSection";
import { EmergencyContactSection } from "./sections/EmergencyContactSection";
import { SalarySection } from "./sections/SalarySection";
import { DocumentUploadSection, DocumentFile } from "./sections/DocumentUploadSection";
import BackButton from "@/components/ui/back-button";
import { UserPlus, Save } from "lucide-react";

const formSchema = z.object({
  // Basic Information
  first_name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  last_name: z.string().min(2, "Soyisim en az 2 karakter olmalıdır"),
  email: z.string().email("Geçersiz e-posta adresi"),
  phone: z.string().optional(),
  position: z.string().min(2, "Pozisyon gereklidir"),
  department: z.string().min(2, "Departman gereklidir"),
  hire_date: z.string().min(1, "İşe başlama tarihi gereklidir"),
  status: z.enum(["aktif", "pasif"]).default("aktif"),
  
  // Personal Information
  date_of_birth: z.string().optional(),
  gender: z.enum(["erkek", "kadın", "diğer"]).optional(),
  marital_status: z.enum(["bekar", "evli", "boşanmış", "dul"]).optional(),
  id_ssn: z.string().optional(),

  // Address Information
    address: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    neighborhood: z.string().optional(),
    postal_code: z.string().optional(),
    
    // New address fields
    city_id: z.number().optional(),
    district_id: z.number().optional(),
    neighborhood_id: z.number().optional(),
    address_line: z.string().optional(),
  
  // Emergency Contact
  emergency_contact_name: z.string().optional(),
  emergency_contact_relation: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  
  // Salary Information (Detaylı Maaş Bilgileri)
  net_salary: z.number().optional(),
  manual_employer_sgk_cost: z.number().optional(),
  meal_allowance: z.number().optional(),
  transport_allowance: z.number().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const SimpleEmployeeForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const navigate = useNavigate();
  const { userData } = useCurrentUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      hire_date: new Date().toISOString().split("T")[0],
      status: "aktif",
      date_of_birth: "",
      gender: undefined,
      marital_status: undefined,
      id_ssn: "",
      address: "",
      country: "Turkey",
      city: "",
      district: "",
      neighborhood: "",
      postal_code: "",
      city_id: undefined,
      district_id: undefined,
      neighborhood_id: undefined,
      address_line: "",
      emergency_contact_name: "",
      emergency_contact_relation: "",
      emergency_contact_phone: "",
      net_salary: 0,
      manual_employer_sgk_cost: 0,
      meal_allowance: 0,
      transport_allowance: 0,
      notes: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Get user session and company_id
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Lütfen giriş yapın.");
      }

      // Get profile to ensure company_id exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.company_id) {
        throw new Error("Şirket bilgisi bulunamadı. Lütfen yöneticinizle iletişime geçin.");
      }
      
      // Use the company_id from profile
      const employeeData = {
        company_id: profile.company_id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || null,
        position: data.position,
        department: data.department,
        hire_date: data.hire_date,
        status: data.status,
        date_of_birth: data.date_of_birth || null,
        gender: data.gender || null,
        marital_status: data.marital_status || null,
        id_ssn: data.id_ssn || null,
      address: data.address || null,
      country: data.country || "Turkey",
      city: data.city || null,
      district: data.district || null,
      neighborhood: data.neighborhood || null,
      postal_code: data.postal_code || null,
      city_id: data.city_id || null,
      district_id: data.district_id || null,
      neighborhood_id: data.neighborhood_id || null,
      address_line: data.address_line || null,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_relation: data.emergency_contact_relation || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        // Detaylı Maaş Bilgileri
        net_salary: data.net_salary || null,
        gross_salary: data.net_salary || null, // Şimdilik gross = net
        manual_employer_sgk_cost: data.manual_employer_sgk_cost || null,
        meal_allowance: data.meal_allowance || null,
        transport_allowance: data.transport_allowance || null,
        total_employer_cost: (data.net_salary || 0) + (data.manual_employer_sgk_cost || 0) + (data.meal_allowance || 0) + (data.transport_allowance || 0),
        salary_notes: data.notes || null,
        salary_input_type: 'net',
        calculate_as_minimum_wage: false,
        effective_date: data.hire_date || new Date().toISOString().split('T')[0],
      };

      const { data: newEmployee, error } = await supabase
        .from("employees")
        .insert(employeeData)
        .select()
        .single();

      if (error) throw error;

      // Upload documents if any
      if (documents.length > 0 && newEmployee?.id) {
        try {
          const documentPromises = documents.map(async (doc) => {
            if (doc.file) {
              const fileExt = doc.file.name.split('.').pop();
              const fileName = `${newEmployee.id}/${doc.name}`;
              
              const { error: uploadError } = await supabase.storage
                .from('employee-documents')
                .upload(fileName, doc.file);

              if (uploadError) throw uploadError;

              // Get public URL
              const { data: urlData } = supabase.storage
                .from('employee-documents')
                .getPublicUrl(fileName);

              // Save document record to database
              const { error: docError } = await supabase
                .from('employee_documents')
                .insert({
                  employee_id: newEmployee.id,
                  name: doc.name,
                  type: doc.type,
                  size: doc.size,
                  url: urlData.publicUrl,
                  uploaded_at: new Date().toISOString()
                });

              if (docError) throw docError;
            }
          });

          await Promise.all(documentPromises);
        } catch (docError) {
          console.error("Error uploading documents:", docError);
          showError("Belgeler yüklenirken hata oluştu, ancak çalışan oluşturuldu.");
        }
      }

      showSuccess("Çalışan başarıyla oluşturuldu");
      
      // Navigate to the employee details page
      if (newEmployee?.id) {
        navigate(`/employees/${newEmployee.id}`);
      } else {
        navigate("/employees");
      }
    } catch (error) {
      console.error("Error creating employee:", error);
      showError("Çalışan oluşturulurken hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Enhanced Sticky Header */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center justify-between p-3 pl-12">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <BackButton 
              onClick={() => navigate("/employees")}
              variant="ghost"
              size="sm"
            >
              Çalışanlar
            </BackButton>
            
            {/* Title Section with Icon */}
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Yeni Çalışan Ekle
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  Hızlı ve kolay çalışan kaydı
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => navigate("/employees")}
              disabled={isSubmitting}
              className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50/50 hover:text-gray-700 hover:border-gray-200 transition-all duration-200 hover:shadow-sm"
            >
              <span className="font-medium">İptal</span>
            </Button>
            <Button 
              type="submit"
              form="employee-form"
              disabled={isSubmitting}
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? "Kaydediliyor..." : "Kaydet"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Form {...form}>
        <form id="employee-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Temel Bilgiler */}
          <BasicInfoSection control={form.control} />

          {/* Kişisel Bilgiler ve Adres, Maaş Bilgileri ve Acil Durum İletişim */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            <AddressSection control={form.control} />
            <div className="space-y-4">
              <SalarySection control={form.control} />
              <EmergencyContactSection control={form.control} />
            </div>
          </div>

          {/* Belge Yükleme */}
          <DocumentUploadSection 
            onDocumentsChange={setDocuments}
          />
        </form>
      </Form>
    </div>
  );
};

export default SimpleEmployeeForm;
