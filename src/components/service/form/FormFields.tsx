
import React from "react";
import { 
  TextInputGroup, 
  TextareaGroup, 
  SelectGroup, 
  DateGroup,
  FormGroup,
  type SelectOption 
} from "@/components/shared";
import { UseFormReturn } from "react-hook-form";
import { ServiceRequestFormData } from "@/hooks/service/types";
import { FileText, AlertTriangle, Wrench, MapPin, User, Clock, CalendarDays } from "lucide-react";

type FieldProps = {
  form: UseFormReturn<ServiceRequestFormData>;
};

type TechnicianFieldProps = FieldProps & {
  technicians?: Array<{ id: string; name: string; department?: string; avatar_url?: string }>;
  isLoading?: boolean;
};

export const TitleField: React.FC<FieldProps> = ({ form }) => (
  <TextInputGroup
    form={form}
    name="service_title"
    label="Başlık"
    placeholder="Servis talebi başlığı"
    icon={FileText}
    required
  />
);

export const DescriptionField: React.FC<FieldProps> = ({ form }) => (
  <TextareaGroup
    form={form}
    name="service_request_description"
    label="Açıklama"
    placeholder="Servis talebi ile ilgili detaylar"
    rows={3}
  />
);

const priorityOptions: SelectOption[] = [
  { value: "low", label: "Düşük", icon: "🟢" },
  { value: "medium", label: "Orta", icon: "🟡" },
  { value: "high", label: "Yüksek", icon: "🟠" },
  { value: "urgent", label: "Acil", icon: "🔴" },
];

export const PriorityField: React.FC<FieldProps> = ({ form }) => (
  <SelectGroup
    form={form}
    name="service_priority"
    label="Öncelik"
    options={priorityOptions}
    placeholder="Öncelik seçin"
    icon={AlertTriangle}
    required
  />
);

const serviceTypeOptions: SelectOption[] = [
  { value: "installation", label: "Kurulum", icon: "🔧" },
  { value: "repair", label: "Onarım", icon: "⚡" },
  { value: "maintenance", label: "Bakım", icon: "🔨" },
  { value: "inspection", label: "Kontrol", icon: "🔍" },
  { value: "consultation", label: "Danışmanlık", icon: "💬" },
];

export const ServiceTypeField: React.FC<FieldProps> = ({ form }) => (
  <SelectGroup
    form={form}
    name="service_type"
    label="Servis Türü"
    options={serviceTypeOptions}
    placeholder="Servis türü seçin"
    icon={Wrench}
    required
  />
);

export const LocationField: React.FC<FieldProps> = ({ form }) => (
  <TextInputGroup
    form={form}
    name="service_location"
    label="Konum"
    placeholder="Servis konumu"
    icon={MapPin}
  />
);

export const ReportedDateField: React.FC<FieldProps> = ({ form }) => (
  <DateGroup
    form={form}
    name="service_reported_date"
    label="Bildirilme Tarihi"
    icon={Clock}
    required
    iconClassName="text-green-600"
  />
);

export const DueDateField: React.FC<FieldProps> = ({ form }) => (
  <DateGroup
    form={form}
    name="service_due_date"
    label="Son Tarih"
    icon={CalendarDays}
    required
    iconClassName="text-purple-600"
  />
);

export const PlannedDateField: React.FC<FieldProps> = ({ form }) => (
  <DateGroup
    form={form}
    name="issue_date"
    label="Planlanan Tarih"
    icon={CalendarDays}
    iconClassName="text-blue-600"
    placeholder="Tarih seçin (opsiyonel)"
  />
);

export const TechnicianField: React.FC<TechnicianFieldProps> = ({ form, technicians = [], isLoading = false }) => (
  <SelectGroup
    form={form}
    name="assigned_technician"
    label="Teknisyen"
    icon={User}
    iconClassName="text-indigo-600"
    placeholder={isLoading ? "Yükleniyor..." : "Teknisyen seçin (opsiyonel)"}
    options={[
      { value: "unassigned", label: "👤 Atanmamış" },
      ...technicians.map((tech) => ({
        value: tech.id,
        label: tech.avatar_url ? (
          <div className="flex items-center gap-2">
            <img src={tech.avatar_url} alt={tech.name} className="w-4 h-4 rounded-full" />
            {tech.name}
          </div>
        ) : `👨‍🔧 ${tech.name}`
      }))
    ]}
  />
);
