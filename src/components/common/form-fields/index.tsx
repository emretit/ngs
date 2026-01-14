import { Controller, UseFormReturn, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import type { FieldConfig } from "../EditableDetailSheet";

interface FormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  config: FieldConfig<T>;
}

export function FormField<T extends FieldValues>({ form, config }: FormFieldProps<T>) {
  const { control, formState: { errors } } = form;
  const error = errors[config.name]?.message as string | undefined;

  return (
    <Controller
      control={control}
      name={config.name as any}
      render={({ field }) => (
        <div className="space-y-0.5">
          <Label htmlFor={config.name} className="text-xs font-medium text-gray-700">
            {config.label}
            {config.required && <span className="text-red-500 ml-0.5">*</span>}
          </Label>

          {/* Text Input */}
          {config.type === 'text' && (
            <Input
              id={config.name}
              type="text"
              placeholder={config.placeholder}
              disabled={config.disabled}
              {...field}
              value={field.value || ''}
              className="h-8 text-xs"
            />
          )}

          {/* Email Input */}
          {config.type === 'email' && (
            <Input
              id={config.name}
              type="email"
              placeholder={config.placeholder}
              disabled={config.disabled}
              {...field}
              value={field.value || ''}
              className="h-8 text-xs"
            />
          )}

          {/* Tel Input */}
          {config.type === 'tel' && (
            <Input
              id={config.name}
              type="tel"
              placeholder={config.placeholder}
              disabled={config.disabled}
              {...field}
              value={field.value || ''}
              className="h-8 text-xs"
            />
          )}

          {/* Number Input */}
          {config.type === 'number' && (
            <Input
              id={config.name}
              type="number"
              placeholder={config.placeholder}
              disabled={config.disabled}
              {...field}
              value={field.value || ''}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : Number(e.target.value);
                field.onChange(value);
              }}
              className="h-8 text-xs"
            />
          )}

          {/* Textarea */}
          {config.type === 'textarea' && (
            <Textarea
              id={config.name}
              placeholder={config.placeholder}
              disabled={config.disabled}
              {...field}
              value={field.value || ''}
              rows={3}
              className="resize-none text-xs py-1.5"
            />
          )}

          {/* Select */}
          {config.type === 'select' && (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={config.disabled}
            >
              <SelectTrigger id={config.name} className="h-8 text-xs">
                <SelectValue placeholder={config.placeholder || 'Seçiniz...'} />
              </SelectTrigger>
              <SelectContent>
                {config.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Date Picker */}
          {config.type === 'date' && (
            <EnhancedDatePicker
              date={field.value ? new Date(field.value) : undefined}
              onSelect={(date) => field.onChange(date?.toISOString())}
              placeholder={config.placeholder || 'Tarih seçiniz'}
              disabled={config.disabled}
              className="w-full"
            />
          )}

          {/* Custom Render */}
          {config.type === 'custom' && config.render && config.render(field)}

          {/* Description */}
          {config.description && (
            <p className="text-xs text-muted-foreground">{config.description}</p>
          )}

          {/* Error Message */}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      )}
    />
  );
}
