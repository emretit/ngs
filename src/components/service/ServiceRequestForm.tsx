import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { useServiceRequests } from "@/hooks/service/useServiceRequests";
import { ServiceRequestFormData } from "@/types/service";
import { useToast } from "@/components/ui/use-toast";
import { 
  TitleField, 
  DescriptionField, 
  PriorityField, 
  ServiceStatusField, 
  LocationField, 
  DueDateField,
  ReportedDateField,
  PlannedDateField,
  TechnicianField,
  ServiceResultField
} from "./form/FormFields";
import { CustomerField } from "./form/CustomerField";
import { FileUploadField } from "./form/FileUploadField";
import { FormActions } from "./form/FormActions";
import { ServiceRequestPreview } from "./form/ServiceRequestPreview";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { useTechnicians } from "@/hooks/useTechnicians";

const formSchema = z.object({
  title: z.string().min(3, { message: "Başlık en az 3 karakter olmalıdır" }),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["new", "assigned", "in_progress", "completed", "cancelled", "on_hold"]),
  location: z.string().optional(),
  scheduled_date: z.date().optional(),
  customer_id: z.string().optional(),
  assigned_technician_id: z.string().optional(),
  service_result: z.string().optional(),
});

export interface ServiceRequestFormProps {
  onClose: () => void;
  initialData?: ServiceRequestFormData;
  isEditing?: boolean;
}

export function ServiceRequestForm({ onClose, initialData, isEditing = false }: ServiceRequestFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { createServiceRequest, updateServiceRequest, isCreating, isUpdating } = useServiceRequests();
  const { toast } = useToast();
  const { customers } = useCustomerSelect();
  const { technicians, isLoading: techniciansLoading } = useTechnicians();

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      priority: (initialData?.priority as "low" | "medium" | "high" | "urgent") || "medium",
      status: (initialData?.status as "new" | "assigned" | "in_progress" | "completed" | "cancelled" | "on_hold") || "new",
      location: initialData?.location || "",
      customer_id: initialData?.customer_id || undefined,
      scheduled_date: initialData?.scheduled_date ? new Date(initialData.scheduled_date) : undefined,
      assigned_technician_id: initialData?.assigned_technician_id || undefined,
      service_result: initialData?.service_result || "",
    },
  });

  useEffect(() => {
    if (initialData && isEditing) {
      Object.keys(initialData).forEach((key) => {
        const value = initialData[key as keyof ServiceRequestFormData];
        if (value !== undefined) {
          if ((key === 'scheduled_date' || key === 'due_date') && typeof value === 'string') {
            form.setValue(key as any, new Date(value));
          } else {
            form.setValue(key as any, value);
          }
        }
      });
    }
  }, [initialData, isEditing, form]);

  const getCustomerName = () => {
    const customerId = form.watch("customer_id");
    if (!customerId || !customers) return undefined;
    
    const customer = customers.find(c => c.id === customerId);
    return customer?.name;
  };

  const getTechnicianName = () => {
    const technicianId = form.watch("assigned_technician_id");
    if (!technicianId || !technicians) return undefined;
    
    const technician = technicians.find(t => t.id === technicianId);
    return technician ? `${technician.first_name} ${technician.last_name}` : undefined;
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Convert form data to ServiceRequestFormData format
      const serviceRequestData: ServiceRequestFormData = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        location: data.location,
        scheduled_date: data.scheduled_date?.toISOString(),
        customer_id: data.customer_id,
        assigned_technician_id: data.assigned_technician_id,
        service_result: data.service_result,
      };

      if (isEditing && initialData?.id) {
        await updateServiceRequest({ 
          id: initialData.id, 
          updateData: serviceRequestData,
          newFiles: files
        });
        toast({
          title: "Servis Talebi Güncellendi",
          description: "Servis talebi başarıyla güncellendi",
        });
      } else {
        await createServiceRequest({ formData: serviceRequestData, files });
        toast({
          title: "Servis Talebi Oluşturuldu",
          description: "Servis talebi başarıyla oluşturuldu",
        });
      }
      onClose();
    } catch (error) {
      console.error('Servis talebi kaydetme hatası:', error);
      toast({
        title: "Hata",
        description: "Servis talebi kaydedilemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        {showPreview ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {isEditing ? "Düzenleme Önizlemesi" : "Önizleme"}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="show-preview" className="text-xs">Önizleme</Label>
                <Switch 
                  id="show-preview" 
                  checked={showPreview} 
                  onCheckedChange={setShowPreview}
                  className="scale-75"
                />
              </div>
            </div>
            <ServiceRequestPreview 
              formData={form.getValues() as any} 
              files={files}
              customerName={getCustomerName()}
              technicianName={getTechnicianName()}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Servis Bilgileri */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h3 className="text-base font-semibold text-gray-900">Servis Bilgileri</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="show-preview" className="text-sm text-gray-600">Önizleme</Label>
                  <Switch 
                    id="show-preview" 
                    checked={showPreview} 
                    onCheckedChange={setShowPreview}
                    className="scale-90"
                  />
                </div>
              </div>
              
              {/* Başlık ve Açıklama - Tam genişlik */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <TitleField form={form as any} />
                </div>
                <div className="space-y-2">
                  <DescriptionField form={form as any} />
                </div>
              </div>

              {/* Durum ve Öncelik - Yan yana */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <ServiceStatusField form={form as any} />
                </div>
                <div className="space-y-2">
                  <PriorityField form={form as any} />
                </div>
              </div>

              {/* Müşteri ve Konum - Yan yana */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <CustomerField form={form as any} />
                </div>
                <div className="space-y-2">
                  <LocationField form={form as any} />
                </div>
              </div>

              {/* Tarih ve Sonuç - Yan yana */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <DueDateField form={form as any} />
                </div>
                <div className="space-y-2">
                  <ServiceResultField form={form as any} />
                </div>
              </div>
            </div>

            {/* Atama & Planlama */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <h3 className="text-base font-semibold text-gray-900">Atama & Planlama</h3>
                <span className="text-sm text-gray-500 font-normal">(Sonradan da belirlenebilir)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <TechnicianField form={form as any} technicians={technicians} isLoading={techniciansLoading} />
                </div>
                <div className="space-y-2">
                  <PlannedDateField form={form as any} />
                </div>
              </div>
            </div>

            {/* Ek Dosyalar */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <h3 className="text-base font-semibold text-gray-900">Ek Dosyalar</h3>
              </div>
              <div className="space-y-2">
                <FileUploadField files={files} setFiles={setFiles} />
              </div>
            </div>
          </div>
        )}
        
        <FormActions 
          onClose={onClose} 
          isSubmitting={isCreating || isUpdating} 
          isEditing={isEditing}
          showPreview={showPreview}
          setShowPreview={setShowPreview} 
        />
      </form>
    </Form>
  );
}
