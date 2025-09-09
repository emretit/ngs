
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon, FileText, AlertTriangle, Wrench, MapPin, User, Clock, Calendar as CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { ServiceRequestFormData } from "@/hooks/service/types";

type FieldProps = {
  form: UseFormReturn<ServiceRequestFormData>;
};

export const TitleField: React.FC<FieldProps> = ({ form }) => (
  <FormField
    control={form.control}
    name="title"
    render={({ field }) => (
      <FormItem>
        <FormLabel className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          Başlık
        </FormLabel>
        <FormControl>
          <Input 
            placeholder="Servis talebi başlığı" 
            {...field}
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

export const DescriptionField: React.FC<FieldProps> = ({ form }) => (
  <FormField
    control={form.control}
    name="description"
    render={({ field }) => (
      <FormItem>
        <FormLabel className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-600" />
          Açıklama
        </FormLabel>
        <FormControl>
          <Textarea
            placeholder="Servis talebi ile ilgili detaylar"
            className="resize-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
            {...field}
            value={field.value || ""}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

export const PriorityField: React.FC<FieldProps> = ({ form }) => (
  <FormField
    control={form.control}
    name="priority"
    render={({ field }) => (
      <FormItem>
        <FormLabel className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          Öncelik
        </FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <SelectValue placeholder="Öncelik seçin" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="low" className="text-green-600">🟢 Düşük</SelectItem>
            <SelectItem value="medium" className="text-yellow-600">🟡 Orta</SelectItem>
            <SelectItem value="high" className="text-orange-600">🟠 Yüksek</SelectItem>
            <SelectItem value="urgent" className="text-red-600">🔴 Acil</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
);

export const ServiceTypeField: React.FC<FieldProps> = ({ form }) => (
  <FormField
    control={form.control}
    name="service_type"
    render={({ field }) => (
      <FormItem>
        <FormLabel className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-blue-600" />
          Servis Türü
        </FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <SelectValue placeholder="Servis türü seçin" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="installation">🔧 Kurulum</SelectItem>
            <SelectItem value="repair">⚡ Onarım</SelectItem>
            <SelectItem value="maintenance">🔨 Bakım</SelectItem>
            <SelectItem value="inspection">🔍 Kontrol</SelectItem>
            <SelectItem value="consultation">💬 Danışmanlık</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
);

export const LocationField: React.FC<FieldProps> = ({ form }) => (
  <FormField
    control={form.control}
    name="location"
    render={({ field }) => (
      <FormItem>
        <FormLabel className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-red-600" />
          Konum
        </FormLabel>
        <FormControl>
          <Input 
            placeholder="Servis konumu" 
            {...field} 
            value={field.value || ""} 
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

export const ReportedDateField: React.FC<FieldProps> = ({ form }) => (
  <FormField
    control={form.control}
    name="reported_date"
    render={({ field }) => (
      <FormItem className="flex flex-col">
        <FormLabel className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-green-600" />
          Bildirilme Tarihi
        </FormLabel>
        <Popover>
          <PopoverTrigger asChild>
            <FormControl>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full pl-3 text-left font-normal transition-all duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  !field.value && "text-muted-foreground"
                )}
              >
                {field.value ? (
                  format(field.value, "PPP")
                ) : (
                  <span>Tarih seçin</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
            />
          </PopoverContent>
        </Popover>
        <FormMessage />
      </FormItem>
    )}
  />
);

export const DueDateField: React.FC<FieldProps> = ({ form }) => (
  <FormField
    control={form.control}
    name="due_date"
    render={({ field }) => (
      <FormItem className="flex flex-col">
        <FormLabel className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-purple-600" />
          Son Tarih
        </FormLabel>
        <Popover>
          <PopoverTrigger asChild>
            <FormControl>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full pl-3 text-left font-normal transition-all duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  !field.value && "text-muted-foreground"
                )}
              >
                {field.value ? (
                  format(field.value, "PPP")
                ) : (
                  <span>Tarih seçin</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={field.value}
              onSelect={field.onChange}
              disabled={(date) =>
                date < new Date(new Date().setHours(0, 0, 0, 0))
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <FormMessage />
      </FormItem>
    )}
  />
);

export const TechnicianField: React.FC<FieldProps> = ({ form }) => (
  <FormField
    control={form.control}
    name="assigned_to"
    render={({ field }) => (
      <FormItem>
        <FormLabel className="flex items-center gap-2">
          <User className="h-4 w-4 text-indigo-600" />
          Teknisyen
        </FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <SelectValue placeholder="Teknisyen seçin (opsiyonel)" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="unassigned" className="text-gray-500">👤 Atanmamış</SelectItem>
            <SelectItem value="tech1">👨‍🔧 Can Öztürk</SelectItem>
            <SelectItem value="tech2">👩‍🔧 Zeynep Arslan</SelectItem>
            <SelectItem value="tech3">👨‍🔧 Ahmet Yılmaz</SelectItem>
            <SelectItem value="tech4">👨‍🔧 Mehmet Kaya</SelectItem>
            <SelectItem value="tech5">👨‍🔧 Ali Demir</SelectItem>
            <SelectItem value="tech6">👩‍🔧 Fatma Özkan</SelectItem>
            <SelectItem value="tech7">👨‍🔧 Ersin Keskin</SelectItem>
            <SelectItem value="tech8">👨‍🔧 Talip Elaman</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
);
