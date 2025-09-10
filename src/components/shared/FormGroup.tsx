import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { UseFormReturn, FieldPath, FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import type { FormGroupProps as SharedFormGroupProps, FormSectionProps, FormGridProps } from "@/types/shared-types";

// Temel FormGroup Props Interface
export interface FormGroupProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  form: UseFormReturn<TFieldValues>;
  name: TName;
  label: string;
  description?: string;
  icon?: LucideIcon;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  children: (field: any) => React.ReactNode;
}

// Temel FormGroup Bileşeni
export function FormGroup<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  name,
  label,
  description,
  icon: Icon,
  required = false,
  className,
  labelClassName,
  children,
}: FormGroupProps<TFieldValues, TName>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("space-y-2", className)}>
          <FormLabel className={cn(
            "flex items-center gap-1 text-sm font-medium",
            labelClassName
          )}>
            {Icon && <Icon className="h-3 w-3" />}
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            {children(field)}
          </FormControl>
          {description && (
            <FormDescription className="text-xs text-gray-600">
              {description}
            </FormDescription>
          )}
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}

// FormSection Wrapper - Birden fazla form elemanını gruplamak için
export interface FormSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function FormSection({
  title,
  description,
  icon: Icon,
  children,
  className,
  headerClassName,
  collapsible = false,
  defaultCollapsed = false,
}: FormSectionProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const toggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div 
        className={cn(
          "flex items-center gap-2 pb-2 border-b border-gray-200",
          collapsible && "cursor-pointer hover:bg-gray-50 p-2 rounded",
          headerClassName
        )}
        onClick={toggleCollapse}
      >
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
        {Icon && <Icon className="h-4 w-4 text-gray-600" />}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {collapsible && (
          <div className={cn(
            "transition-transform duration-200",
            isCollapsed && "rotate-180"
          )}>
            ▼
          </div>
        )}
      </div>
      
      {(!collapsible || !isCollapsed) && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

// Grid Layout Helper - Form elemanlarını grid'de düzenlemek için
export interface FormGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: number;
  className?: string;
}

export function FormGrid({ 
  children, 
  columns = 2, 
  gap = 3, 
  className 
}: FormGridProps) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  const gapClasses = {
    1: "gap-1",
    2: "gap-2", 
    3: "gap-3",
    4: "gap-4",
    5: "gap-5",
    6: "gap-6",
  };

  return (
    <div className={cn(
      "grid",
      gridClasses[columns],
      gapClasses[gap as keyof typeof gapClasses] || "gap-3",
      className
    )}>
      {children}
    </div>
  );
}

// Özel Form Elemanları için Hazır Wrapper'lar
export interface TextInputGroupProps<T extends FieldValues> extends Omit<FormGroupProps<T>, 'children'> {
  placeholder?: string;
  inputClassName?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
}

export function TextInputGroup<T extends FieldValues>({
  placeholder,
  inputClassName,
  type = 'text',
  ...props
}: TextInputGroupProps<T>) {
  return (
    <FormGroup {...props}>
      {(field) => (
        <input
          type={type}
          placeholder={placeholder}
          className={cn(
            "flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            inputClassName
          )}
          {...field}
          value={field.value || ""}
        />
      )}
    </FormGroup>
  );
}

export interface TextareaGroupProps<T extends FieldValues> extends Omit<FormGroupProps<T>, 'children'> {
  placeholder?: string;
  rows?: number;
  textareaClassName?: string;
}

export function TextareaGroup<T extends FieldValues>({
  placeholder,
  rows = 3,
  textareaClassName,
  ...props
}: TextareaGroupProps<T>) {
  return (
    <FormGroup {...props}>
      {(field) => (
        <textarea
          placeholder={placeholder}
          rows={rows}
          className={cn(
            "flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            "resize-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            textareaClassName
          )}
          {...field}
          value={field.value || ""}
        />
      )}
    </FormGroup>
  );
}
