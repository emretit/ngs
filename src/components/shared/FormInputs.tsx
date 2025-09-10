import React from "react";
import { FormGroup, FormGroupProps } from "./FormGroup";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { FieldValues } from "react-hook-form";
import type { 
  TextInputGroupProps, 
  TextareaGroupProps, 
  SelectGroupProps, 
  DateGroupProps, 
  CheckboxGroupProps, 
  NumberInputGroupProps, 
  FileUploadGroupProps 
} from "@/types/shared-types";

// Select Group Bileşeni
export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export interface SelectGroupProps<T extends FieldValues> extends Omit<FormGroupProps<T>, 'children'> {
  options: SelectOption[];
  placeholder?: string;
  selectClassName?: string;
  emptyMessage?: string;
}

export function SelectGroup<T extends FieldValues>({
  options,
  placeholder = "Seçim yapın",
  selectClassName,
  emptyMessage = "Seçenek bulunamadı",
  ...props
}: SelectGroupProps<T>) {
  return (
    <FormGroup {...props}>
      {(field) => (
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <SelectTrigger className={cn(
            "h-8 text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            selectClassName
          )}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.length === 0 ? (
              <div className="py-2 px-3 text-sm text-gray-500 text-center">
                {emptyMessage}
              </div>
            ) : (
              options.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value} 
                  className="text-sm"
                  disabled={option.disabled}
                >
                  {option.icon && <span className="mr-2">{option.icon}</span>}
                  {option.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
    </FormGroup>
  );
}

// Date Picker Group Bileşeni
export interface DateGroupProps<T extends FieldValues> extends Omit<FormGroupProps<T>, 'children'> {
  placeholder?: string;
  buttonClassName?: string;
  disablePastDates?: boolean;
  disableFutureDates?: boolean;
  customDisabledDates?: (date: Date) => boolean;
}

export function DateGroup<T extends FieldValues>({
  placeholder = "Tarih seçin",
  buttonClassName,
  disablePastDates = false,
  disableFutureDates = false,
  customDisabledDates,
  ...props
}: DateGroupProps<T>) {
  const getDisabledDates = (date: Date) => {
    if (customDisabledDates) {
      return customDisabledDates(date);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (disablePastDates && date < today) {
      return true;
    }
    
    if (disableFutureDates && date > today) {
      return true;
    }
    
    return false;
  };

  return (
    <FormGroup {...props}>
      {(field) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-8 pl-3 text-left font-normal text-sm transition-all duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                !field.value && "text-muted-foreground",
                buttonClassName
              )}
            >
              {field.value ? (
                format(field.value, "dd.MM.yyyy", { locale: tr })
              ) : (
                <span>{placeholder}</span>
              )}
              <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={field.value}
              onSelect={field.onChange}
              disabled={getDisabledDates}
              initialFocus
              locale={tr}
            />
          </PopoverContent>
        </Popover>
      )}
    </FormGroup>
  );
}

// Checkbox Group Bileşeni
export interface CheckboxGroupProps<T extends FieldValues> extends Omit<FormGroupProps<T>, 'children'> {
  checkboxClassName?: string;
}

export function CheckboxGroup<T extends FieldValues>({
  checkboxClassName,
  ...props
}: CheckboxGroupProps<T>) {
  return (
    <FormGroup {...props}>
      {(field) => (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={field.name}
            checked={field.value || false}
            onChange={(e) => field.onChange(e.target.checked)}
            className={cn(
              "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
              checkboxClassName
            )}
          />
        </div>
      )}
    </FormGroup>
  );
}

// Number Input Group Bileşeni
export interface NumberInputGroupProps<T extends FieldValues> extends Omit<FormGroupProps<T>, 'children'> {
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  inputClassName?: string;
}

export function NumberInputGroup<T extends FieldValues>({
  placeholder,
  min,
  max,
  step = 1,
  inputClassName,
  ...props
}: NumberInputGroupProps<T>) {
  return (
    <FormGroup {...props}>
      {(field) => (
        <input
          type="number"
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className={cn(
            "flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            inputClassName
          )}
          {...field}
          value={field.value || ""}
          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
        />
      )}
    </FormGroup>
  );
}

// Multi-Select Group (gelecekte eklenebilir)
export interface MultiSelectOption {
  value: string;
  label: string;
  icon?: string;
}

export interface MultiSelectGroupProps<T extends FieldValues> extends Omit<FormGroupProps<T>, 'children'> {
  options: MultiSelectOption[];
  placeholder?: string;
  maxSelections?: number;
}

// File Upload Group
export interface FileUploadGroupProps<T extends FieldValues> extends Omit<FormGroupProps<T>, 'children'> {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // MB cinsinden
  onFilesChange?: (files: File[]) => void;
}

export function FileUploadGroup<T extends FieldValues>({
  accept,
  multiple = false,
  maxSize = 10,
  onFilesChange,
  ...props
}: FileUploadGroupProps<T>) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const files = Array.from(e.target.files || []);
    
    // Dosya boyut kontrolü
    const oversizedFiles = files.filter(file => file.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert(`Bazı dosyalar ${maxSize}MB'dan büyük: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    if (multiple) {
      field.onChange(files);
      onFilesChange?.(files);
    } else {
      field.onChange(files[0] || null);
      onFilesChange?.(files);
    }
  };

  return (
    <FormGroup {...props}>
      {(field) => (
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileChange(e, field)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      )}
    </FormGroup>
  );
}
