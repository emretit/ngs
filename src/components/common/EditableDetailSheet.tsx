import { ReactNode, useEffect } from "react";
import { useForm, FormProvider, UseFormReturn, FieldValues, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { FormField } from "./form-fields";

export interface FieldConfig<T extends FieldValues> {
  name: keyof T & string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'email' | 'tel' | 'custom';
  placeholder?: string;
  description?: string;

  // Select options
  options?: Array<{ label: string; value: any }>;

  // Custom render
  render?: (field: any) => ReactNode;

  // Validation
  required?: boolean;
  disabled?: boolean;

  // Layout
  gridColumn?: 'col-span-1' | 'col-span-2' | 'col-span-full';
  hidden?: boolean | ((data: T) => boolean);
}

export interface TabConfig<T extends FieldValues> {
  id: string;
  label: string;
  icon?: LucideIcon;
  fields?: FieldConfig<T>[];
  renderContent?: (data: T | null, form: UseFormReturn<T>) => ReactNode;
}

export interface EditableDetailSheetProps<T extends FieldValues> {
  // Temel props
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;

  // Data
  data: T | null;
  isLoading?: boolean;

  // Form config
  fields?: FieldConfig<T>[];
  schema?: z.ZodSchema<any>;
  defaultValues?: DefaultValues<T>;

  // Actions
  onSave: (values: T) => Promise<void>;
  isSaving?: boolean;

  // Customization
  renderHeader?: (data: T | null) => ReactNode;
  renderActions?: (data: T | null, form: UseFormReturn<T>) => ReactNode;
  renderFooter?: (data: T | null, form: UseFormReturn<T>) => ReactNode;

  // Tabs (opsiyonel)
  tabs?: TabConfig<T>[];

  // Styling
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';

  // Save button
  saveButtonText?: string;
  cancelButtonText?: string;
  hideCancelButton?: boolean;
}

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
};

export function EditableDetailSheet<T extends FieldValues>({
  isOpen,
  onClose,
  title,
  subtitle,
  data,
  isLoading = false,
  fields = [],
  schema,
  defaultValues,
  onSave,
  isSaving = false,
  renderHeader,
  renderActions,
  renderFooter,
  tabs,
  className,
  size = 'xl',
  saveButtonText = 'Kaydet',
  cancelButtonText = 'İptal',
  hideCancelButton = false,
}: EditableDetailSheetProps<T>) {
  // Form setup
  const form = useForm<T>({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: (defaultValues || data || {}) as DefaultValues<T>,
  });

  // Reset form when data changes
  useEffect(() => {
    if (data) {
      form.reset(data as DefaultValues<T>);
    }
  }, [data, form]);

  const handleSubmit = async (values: T) => {
    try {
      await onSave(values);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const renderFields = (fieldsToRender: FieldConfig<T>[], currentData: T | null) => {
    return (
      <div className="grid grid-cols-2 gap-4">
        {fieldsToRender.map((fieldConfig) => {
          // Handle hidden fields
          if (fieldConfig.hidden) {
            const shouldHide = typeof fieldConfig.hidden === 'function'
              ? currentData && fieldConfig.hidden(currentData)
              : fieldConfig.hidden;
            if (shouldHide) return null;
          }

          const gridClass = fieldConfig.gridColumn || 'col-span-1';

          return (
            <div key={fieldConfig.name} className={gridClass}>
              <FormField
                form={form}
                config={fieldConfig}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className={`${sizeClasses[size]} overflow-hidden p-0 flex flex-col ${className || ''}`}>
        {/* Header */}
        <SheetHeader className="text-left border-b pb-3 mb-0 px-4 pt-4 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
          </div>
          {subtitle && <SheetDescription>{subtitle}</SheetDescription>}
          {renderHeader && renderHeader(data)}
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Yükleniyor...</p>
              </div>
            </div>
          ) : (
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {tabs && tabs.length > 0 ? (
                  <Tabs defaultValue={tabs[0].id} className="w-full">
                    <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
                      {tabs.map((tab) => (
                        <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                          {tab.icon && <tab.icon className="h-4 w-4" />}
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {tabs.map((tab) => (
                      <TabsContent key={tab.id} value={tab.id} className="space-y-4 mt-4">
                        {tab.renderContent
                          ? tab.renderContent(data, form)
                          : tab.fields && renderFields(tab.fields, data)
                        }
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div className="space-y-4">
                    {renderFields(fields, data)}
                  </div>
                )}

                {/* Custom Actions */}
                {renderActions && (
                  <div className="pt-4 border-t">
                    {renderActions(data, form)}
                  </div>
                )}

                {/* Custom Footer */}
                {renderFooter && renderFooter(data, form)}
              </form>
            </FormProvider>
          )}
        </div>

        {/* Footer Buttons */}
        <SheetFooter className="flex justify-end gap-2 pt-4 px-4 pb-4 mt-auto border-t flex-shrink-0">
          {!hideCancelButton && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              {cancelButtonText}
            </Button>
          )}
          <Button
            type="button"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isSaving || isLoading}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {saveButtonText}
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
