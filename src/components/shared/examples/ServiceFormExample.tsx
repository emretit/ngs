// ServiceRequestForm için FormGroup kullanım örneği
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import {
  FormSection,
  FormGrid,
  TextInputGroup,
  TextareaGroup,
  SelectGroup,
  DateGroup,
  type SelectOption
} from "../index";
import { 
  FileText, 
  AlertTriangle, 
  Wrench, 
  MapPin, 
  Clock, 
  CalendarDays,
  User 
} from "lucide-react";

const formSchema = z.object({
  service_title: z.string().min(3, { message: "Başlık en az 3 karakter olmalıdır" }),
  service_request_description: z.string().optional(),
  service_priority: z.enum(["low", "medium", "high", "urgent"]),
  service_type: z.string().min(1, { message: "Servis türü seçmelisiniz" }),
  service_location: z.string().optional(),
  service_due_date: z.date().optional(),
  service_reported_date: z.date().optional(),
  assigned_technician: z.string().optional(),
});

type ServiceFormData = z.infer<typeof formSchema>;

// Öncelik seçenekleri
const priorityOptions: SelectOption[] = [
  { value: "low", label: "Düşük", icon: "🟢" },
  { value: "medium", label: "Orta", icon: "🟡" },
  { value: "high", label: "Yüksek", icon: "🟠" },
  { value: "urgent", label: "Acil", icon: "🔴" },
];

// Servis türü seçenekleri
const serviceTypeOptions: SelectOption[] = [
  { value: "installation", label: "Kurulum", icon: "🔧" },
  { value: "repair", label: "Onarım", icon: "⚡" },
  { value: "maintenance", label: "Bakım", icon: "🔨" },
  { value: "inspection", label: "Kontrol", icon: "🔍" },
  { value: "consultation", label: "Danışmanlık", icon: "💬" },
];

// Teknisyen seçenekleri (örnek)
const technicianOptions: SelectOption[] = [
  { value: "unassigned", label: "Atanmamış", icon: "👤" },
  { value: "tech1", label: "Ahmet Yılmaz", icon: "👨‍🔧" },
  { value: "tech2", label: "Mehmet Kaya", icon: "👨‍🔧" },
  { value: "tech3", label: "Ayşe Demir", icon: "👩‍🔧" },
];

export function ServiceFormExample() {
  const form = useForm<ServiceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service_title: "",
      service_request_description: "",
      service_priority: "medium",
      service_type: "",
      service_location: "",
      service_reported_date: new Date(),
      assigned_technician: "unassigned",
    },
  });

  const onSubmit = (data: ServiceFormData) => {
    console.log("Form submitted:", data);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Yeni FormGroup Yapısı Örneği
        </h1>
        <p className="text-gray-600">
          ServiceRequestForm için güncellenen form yapısı
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Temel Bilgiler Bölümü */}
          <FormSection
            title="Temel Bilgiler"
            description="Servis talebi için gerekli temel bilgileri giriniz"
            icon={FileText}
          >
            <FormGrid columns={1}>
              <TextInputGroup
                form={form}
                name="service_title"
                label="Başlık"
                placeholder="Servis talebi başlığı"
                icon={FileText}
                required
              />
            </FormGrid>
            
            <TextareaGroup
              form={form}
              name="service_request_description"
              label="Açıklama"
              description="Servis talebi ile ilgili detayları yazınız"
              placeholder="Servis talebi ile ilgili detaylar"
              rows={4}
            />
            
            <FormGrid columns={2}>
              <SelectGroup
                form={form}
                name="service_priority"
                label="Öncelik"
                options={priorityOptions}
                placeholder="Öncelik seçin"
                icon={AlertTriangle}
                required
              />
              
              <SelectGroup
                form={form}
                name="service_type"
                label="Servis Türü"
                options={serviceTypeOptions}
                placeholder="Servis türü seçin"
                icon={Wrench}
                required
              />
            </FormGrid>
            
            <TextInputGroup
              form={form}
              name="service_location"
              label="Konum"
              placeholder="Servis konumu"
              icon={MapPin}
            />
          </FormSection>

          {/* Zaman Planlama Bölümü */}
          <FormSection
            title="Zaman Planlama"
            description="Tarih bilgilerini belirleyiniz"
            icon={Clock}
            collapsible
          >
            <FormGrid columns={2}>
              <DateGroup
                form={form}
                name="service_reported_date"
                label="Bildirilme Tarihi"
                placeholder="Tarih seçin"
                icon={Clock}
                disableFutureDates
                required
              />
              
              <DateGroup
                form={form}
                name="service_due_date"
                label="Son Tarih"
                placeholder="Tarih seçin"
                icon={CalendarDays}
                disablePastDates
              />
            </FormGrid>
          </FormSection>

          {/* Atama Bölümü */}
          <FormSection
            title="Atama & Planlama"
            description="Teknisyen ataması ve planlama bilgileri (sonradan da belirlenebilir)"
            icon={User}
            collapsible
            defaultCollapsed
          >
            <FormGrid columns={1}>
              <SelectGroup
                form={form}
                name="assigned_technician"
                label="Teknisyen"
                options={technicianOptions}
                placeholder="Teknisyen seçin (opsiyonel)"
                icon={User}
              />
            </FormGrid>
          </FormSection>

          {/* Form Aksiyonları */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Kaydet
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}
