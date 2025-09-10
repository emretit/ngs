import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { useServiceRequests, ServiceRequestFormData } from "@/hooks/useServiceRequests";
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
  service_title: z.string().min(3, { message: "Başlık en az 3 karakter olmalıdır" }),
  service_request_description: z.string().optional(),
  service_priority: z.enum(["low", "medium", "high", "urgent"]),
  service_type: z.string().min(1, { message: "Servis türü seçmelisiniz" }),
  service_location: z.string().optional(),
  service_due_date: z.date().optional(),
  service_reported_date: z.date().optional(),
  issue_date: z.date().optional(), // Planlanan tarih
  customer_id: z.string().optional(),
  equipment_id: z.string().optional(),
  assigned_technician: z.string().optional(),
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

  const form = useForm<ServiceRequestFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      service_title: "",
      service_request_description: "",
      service_priority: "medium",
      service_type: "",
      service_location: "",
      customer_id: undefined,
      service_reported_date: new Date(),
      assigned_technician: undefined,
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

  const onSubmit = (data: ServiceRequestFormData) => {
    if (isEditing && initialData?.id) {
      updateServiceRequest({ 
        id: initialData.id, 
        updateData: data,
        newFiles: files
      });
      toast({
        title: "Servis Talebi Güncellendi",
        description: "Servis talebi başarıyla güncellendi",
      });
    } else {
      createServiceRequest({ formData: data, files });
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
              formData={form.getValues()} 
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
                  <TitleField form={form} />
                </div>
                <div className="md:col-span-2">
                  <DescriptionField form={form} />
                </div>
                <PriorityField form={form} />
                <ServiceTypeField form={form} />
                <CustomerField form={form} />
                <LocationField form={form} />
                <ReportedDateField form={form} />
                <DueDateField form={form} />
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
                <TechnicianField form={form} technicians={technicians} isLoading={techniciansLoading} />
                <PlannedDateField form={form} />
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
