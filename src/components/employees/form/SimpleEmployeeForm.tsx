
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toastUtils";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BasicInfoSection } from "./sections/BasicInfoSection";
import { PersonalInfoSection } from "./sections/PersonalInfoSection";
import { AddressSection } from "./sections/AddressSection";
import { EmergencyContactSection } from "./sections/EmergencyContactSection";

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
  gender: z.enum(["male", "female", "other"]).optional(),
  marital_status: z.enum(["single", "married", "divorced", "widowed"]).optional(),
  id_ssn: z.string().optional(),

  // Address Information
  address: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  postal_code: z.string().optional(),
  
  // Emergency Contact
  emergency_contact_name: z.string().optional(),
  emergency_contact_relation: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const SimpleEmployeeForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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
      postal_code: "",
      emergency_contact_name: "",
      emergency_contact_relation: "",
      emergency_contact_phone: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Ensure all required fields are present
      const employeeData = {
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
        postal_code: data.postal_code || null,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_relation: data.emergency_contact_relation || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
      };

      const { data: newEmployee, error } = await supabase
        .from("employees")
        .insert(employeeData)
        .select()
        .single();

      if (error) throw error;

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
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Yeni Çalışan Ekle</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <BasicInfoSection control={form.control} />
            <PersonalInfoSection control={form.control} />
            <AddressSection control={form.control} />
            <EmergencyContactSection control={form.control} />
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate("/employees")}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Kaydediliyor..." : "Çalışan Ekle"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SimpleEmployeeForm;
