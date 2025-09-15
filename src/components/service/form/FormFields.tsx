
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon, FileText, AlertTriangle, Wrench, MapPin, User, Clock, CalendarDays, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";

type FieldProps = {
  form: UseFormReturn<any>;
};

type TechnicianFieldProps = FieldProps & {
  technicians?: Array<{ id: string; name: string; department?: string; avatar_url?: string }>;
  isLoading?: boolean;
};

export const TitleField: React.FC<FieldProps> = ({ form }) => (
  <FormField
    control={form.control}
    name="title"
    render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className="flex items-center gap-1 text-xs font-medium text-gray-700">
          <FileText className="h-3 w-3 text-blue-600" />
          Başlık
        </FormLabel>
        <FormControl>
          <Input 
            placeholder="Örn: Klima arızası, Bilgisayar onarımı" 
            {...field}
            className="h-7 text-sm transition-all duration-200 focus:ring-1 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
          />
        </FormControl>
        <FormMessage className="text-xs" />
      </FormItem>
    )}
  />
);

export const DescriptionField: React.FC<FieldProps> = ({ form }) => (
  <FormField
    control={form.control}
    name="description"
    render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className="flex items-center gap-1 text-xs font-medium text-gray-700">
          <FileText className="h-3 w-3 text-gray-600" />
          Servis Nedeni
        </FormLabel>
        <FormControl>
          <Textarea
            placeholder="Örn: Klima çalışmıyor, sıcak hava üflüyor. Müşteri şikayeti: 2 gündür çalışmıyor."
            className="resize-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 focus:border-transparent min-h-[50px] text-sm placeholder-gray-400"
            {...field}
            value={field.value || ""}
          />
        </FormControl>
        <FormMessage className="text-xs" />
      </FormItem>
    )}
  />
);

export const PriorityField: React.FC<FieldProps> = ({ form }) => (
  <FormField
    control={form.control}
    name="priority"
    render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className="flex items-center gap-1 text-xs font-medium text-gray-700">
          <AlertTriangle className="h-3 w-3 text-orange-600" />
          Öncelik
        </FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger className="h-7 text-sm transition-all duration-200 focus:ring-1 focus:ring-blue-500 focus:border-transparent">
              <SelectValue placeholder="Öncelik seçin" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="low" className="text-green-600 text-sm">🟢 Düşük</SelectItem>
            <SelectItem value="medium" className="text-yellow-600 text-sm">🟡 Orta</SelectItem>
            <SelectItem value="high" className="text-orange-600 text-sm">🟠 Yüksek</SelectItem>
            <SelectItem value="urgent" className="text-red-600 text-sm">🔴 Acil</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage className="text-xs" />
      </FormItem>
    )}
  />
);

export const ServiceStatusField: React.FC<FieldProps> = ({ form }) => (
  <FormField
    control={form.control}
    name="status"
    render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className="flex items-center gap-1 text-xs font-medium text-gray-700">
          <Wrench className="h-3 w-3 text-blue-600" />
          Servis Durumu
        </FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger className="h-7 text-sm transition-all duration-200 focus:ring-1 focus:ring-blue-500 focus:border-transparent">
              <SelectValue placeholder="Servis durumu seçin" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="new" className="text-sm">🆕 Yeni</SelectItem>
            <SelectItem value="assigned" className="text-sm">👤 Atanmış</SelectItem>
            <SelectItem value="in_progress" className="text-sm">⚡ Devam Ediyor</SelectItem>
            <SelectItem value="completed" className="text-sm">✅ Tamamlandı</SelectItem>
            <SelectItem value="cancelled" className="text-sm">❌ İptal</SelectItem>
            <SelectItem value="on_hold" className="text-sm">⏸️ Beklemede</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage className="text-xs" />
      </FormItem>
    )}
  />
);

export const LocationField: React.FC<FieldProps> = ({ form }) => (
  <FormField
    control={form.control}
    name="location"
    render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className="flex items-center gap-1 text-xs font-medium text-gray-700">
          <MapPin className="h-3 w-3 text-red-600" />
          Konum
        </FormLabel>
        <FormControl>
          <Input 
            placeholder="Örn: Ofis binası, 3. kat, Oda 301" 
            {...field} 
            value={field.value || ""} 
            className="h-7 text-sm transition-all duration-200 focus:ring-1 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
          />
        </FormControl>
        <FormMessage className="text-xs" />
      </FormItem>
    )}
  />
);

export const DueDateField: React.FC<FieldProps> = ({ form }) => (
  <FormField
    control={form.control}
    name="service_reported_date"
    render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className="flex items-center gap-1 text-xs font-medium text-gray-700">
          <CalendarDays className="h-3 w-3 text-purple-600" />
          Bildirilen Tarih
        </FormLabel>
        <Popover>
          <PopoverTrigger asChild>
            <FormControl>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full h-7 pl-3 text-left font-normal text-sm transition-all duration-200 hover:bg-gray-50 focus:ring-1 focus:ring-blue-500 focus:border-transparent",
                  !field.value && "text-muted-foreground"
                )}
              >
                {field.value ? (
                  format(field.value, "dd.MM.yyyy", { locale: tr })
                ) : (
                  <span>Tarih seçin</span>
                )}
                <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={field.value}
              onSelect={field.onChange}
              disabled={(date) =>
                date > new Date()
              }
              initialFocus
              locale={tr}
            />
          </PopoverContent>
        </Popover>
        <FormMessage className="text-xs" />
      </FormItem>
    )}
  />
);

export const ReportedDateField: React.FC<FieldProps> = ({ form }) => (
  <FormField
    control={form.control}
    name="created_at"
    render={({ field }) => (
      <FormItem className="flex flex-col">
        <FormLabel className="flex items-center gap-1 text-sm">
          <Clock className="h-3 w-3 text-green-600" />
          Bildirilme Tarihi
        </FormLabel>
        <Popover>
          <PopoverTrigger asChild>
            <FormControl>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full h-8 pl-3 text-left font-normal text-sm transition-all duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  !field.value && "text-muted-foreground"
                )}
              >
                {field.value ? (
                  format(field.value, "dd.MM.yyyy", { locale: tr })
                ) : (
                  <span>Tarih seçin</span>
                )}
                <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={field.value}
              onSelect={field.onChange}
              disabled={(date) =>
                date > new Date()
              }
              initialFocus
              locale={tr}
            />
          </PopoverContent>
        </Popover>
        <FormMessage className="text-xs" />
      </FormItem>
    )}
  />
);

export const PlannedDateField: React.FC<FieldProps> = ({ form }) => (
  <FormField
    control={form.control}
    name="scheduled_date"
    render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className="flex items-center gap-1 text-xs font-medium text-gray-700">
          <CalendarDays className="h-3 w-3 text-blue-600" />
          Planlanan Tarih
        </FormLabel>
        <Popover>
          <PopoverTrigger asChild>
            <FormControl>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full h-7 pl-3 text-left font-normal text-sm transition-all duration-200 hover:bg-gray-50 focus:ring-1 focus:ring-blue-500 focus:border-transparent",
                  !field.value && "text-muted-foreground"
                )}
              >
                {field.value ? (
                  format(field.value, "dd.MM.yyyy", { locale: tr })
                ) : (
                  <span>Tarih seçin</span>
                )}
                <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={field.value}
              onSelect={field.onChange}
              initialFocus
              locale={tr}
            />
          </PopoverContent>
        </Popover>
        <FormMessage className="text-xs" />
      </FormItem>
    )}
  />
);

export const TechnicianField: React.FC<TechnicianFieldProps> = ({ form, technicians = [], isLoading = false }) => (
  <FormField
    control={form.control}
    name="assigned_technician_id"
    render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className="flex items-center gap-1 text-xs font-medium text-gray-700">
          <User className="h-3 w-3 text-indigo-600" />
          Teknisyen
        </FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger className="h-7 text-sm transition-all duration-200 focus:ring-1 focus:ring-blue-500 focus:border-transparent">
              <SelectValue placeholder={isLoading ? "Yükleniyor..." : "Teknisyen seçin (opsiyonel)"} />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="unassigned" className="text-gray-500 text-sm">👤 Atanmamış</SelectItem>
            {technicians.map((tech) => (
              <SelectItem key={tech.id} value={tech.id} className="text-sm">
                {tech.avatar_url ? (
                  <div className="flex items-center gap-2">
                    <img src={tech.avatar_url} alt={tech.name} className="w-4 h-4 rounded-full" />
                    {tech.name}
                  </div>
                ) : (
                  `👨‍🔧 ${tech.name}`
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage className="text-xs" />
      </FormItem>
    )}
  />
);

export const ServiceResultField: React.FC<FieldProps> = ({ form }) => (
  <FormField
    control={form.control}
    name="service_result"
    render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className="flex items-center gap-1 text-xs font-medium text-gray-700">
          <CheckCircle className="h-3 w-3 text-green-600" />
          Servis Sonucu
        </FormLabel>
        <FormControl>
          <Textarea
            placeholder="Örn: Klima filtresi değiştirildi, gaz kontrolü yapıldı. Test edildi, çalışıyor."
            className="resize-none transition-all duration-200 focus:ring-1 focus:ring-blue-500 focus:border-transparent min-h-[60px] text-sm placeholder-gray-400"
            {...field}
            value={field.value || ""}
          />
        </FormControl>
        <FormMessage className="text-xs" />
      </FormItem>
    )}
  />
);
