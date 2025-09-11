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
  ServiceTypeField, 
  LocationField, 
  DueDateField,
  ReportedDateField,
  PlannedDateField,
  TechnicianField
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
  service_type: z.string().min(1, { message: "Servis türü seçmelisiniz" }),
  location: z.string().optional(),
  scheduled_date: z.date().optional(),
  customer_id: z.string().optional(),
  assigned_technician_id: z.string().optional(),
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
      service_type: initialData?.service_type || "",
      location: initialData?.location || "",
      customer_id: initialData?.customer_id || undefined,
      scheduled_date: initialData?.scheduled_date ? new Date(initialData.scheduled_date) : undefined,
      assigned_technician_id: initialData?.assigned_technician_id || undefined,
    },
  });

  useEffect(() => {
    if (initialData && isEditing) {
      Object.keys(initialData).forEach((key) => {
        const value = initialData[key as keyof ServiceRequestFormData];
        if (value !== undefined) {
          if (key === 'due_date' && typeof value === 'string') {
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

  const onSubmit = (data: FormData) => {
    // Convert form data to ServiceRequestFormData format
    const serviceRequestData: ServiceRequestFormData = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      service_type: data.service_type,
      location: data.location,
      scheduled_date: data.scheduled_date?.toISOString(),
      customer_id: data.customer_id,
      assigned_technician_id: data.assigned_technician_id,
      status: 'pending',
    };

    if (isEditing && initialData?.id) {
      updateServiceRequest({ 
        id: initialData.id, 
        updateData: serviceRequestData,
        newFiles: files
      });
      toast({
        title: "Servis Talebi Güncellendi",
        description: "Servis talebi başarıyla güncellendi",
      });
    } else {
      createServiceRequest({ formData: serviceRequestData, files });
      toast({
        title: "Servis Talebi Oluşturuldu",
        description: "Servis talebi başarıyla oluşturuldu",
      });
    }
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        {showPreview ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-800">Önizleme</h3>
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
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Temel Bilgiler - Kompakt */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-gray-800">Temel Bilgiler</h3>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <TitleField form={form as any} />
                </div>
                <div className="md:col-span-2">
                  <DescriptionField form={form as any} />
                </div>
                <PriorityField form={form as any} />
                <ServiceTypeField form={form as any} />
                <CustomerField form={form as any} />
                <LocationField form={form as any} />
                <DueDateField form={form as any} />
              </div>
            </div>

            {/* Atama ve Planlama - Kompakt */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-200">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-800">Atama & Planlama</h3>
                <span className="text-xs text-gray-500 font-normal">(Sonradan da belirlenebilir)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TechnicianField form={form as any} technicians={technicians} isLoading={techniciansLoading} />
                <PlannedDateField form={form as any} />
              </div>
            </div>

            {/* Dosyalar - Kompakt */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-200">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-800">Dosyalar</h3>
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
