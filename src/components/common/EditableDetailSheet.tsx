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
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, X } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { FormField } from "./form-fields";

export interface FieldConfig<T extends FieldValues> {
  name: keyof T & string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'email' | 'tel' | 'custom';
  placeholder?: string;
  description?: string;
  icon?: LucideIcon;

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
  sm: 'sm:max-w-[320px]',
  md: 'sm:max-w-[420px]',
  lg: 'sm:max-w-[520px]',
  xl: 'sm:max-w-[620px]',
  '2xl': 'sm:max-w-[720px]',
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
      <div className="grid grid-cols-2 gap-1.5">
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
      <SheetContent className={`${sizeClasses[size]} overflow-hidden p-0 flex flex-col my-4 h-[calc(100vh-2rem)] max-h-[900px] ${className || ''}`}>
        {/* Accessibility için SheetTitle ve SheetDescription */}
        {!renderHeader && !title ? (
          <>
            <VisuallyHidden>
              <SheetTitle>Detay</SheetTitle>
            </VisuallyHidden>
            <VisuallyHidden>
              <SheetDescription>Detay görünümü</SheetDescription>
            </VisuallyHidden>
          </>
        ) : null}
        
        {/* Ultra Compact Header */}
        <div className="flex-shrink-0 sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
              {renderHeader ? (
                <div className="flex-1 min-w-0">
                  <VisuallyHidden>
                    <SheetTitle>{title || 'Detay'}</SheetTitle>
                  </VisuallyHidden>
                  {renderHeader(data)}
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-lg font-semibold text-gray-900 truncate">
                    {title}
                  </SheetTitle>
                  {subtitle && (
                    <SheetDescription className="text-xs text-gray-500 mt-0.5 truncate">
                      {subtitle}
                    </SheetDescription>
                  )}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 ml-2 h-auto w-auto"
            >
              <X className="h-5 w-5 text-gray-500" />
            </Button>
          </div>
        </div>

        {/* Ultra Compact Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-1.5">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                <p className="text-xs text-gray-500">Yükleniyor...</p>
              </div>
            </div>
          ) : (
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                {tabs && tabs.length > 0 ? (
                  <Tabs defaultValue={tabs[0].id} className="w-full">
                    <div className="sticky top-0 bg-white border-b px-3 py-1.5">
                      <TabsList className="inline-flex h-7 items-center justify-start rounded-md bg-gray-100 p-0.5 text-gray-500 w-auto">
                        {tabs.map((tab) => (
                          <TabsTrigger 
                            key={tab.id} 
                            value={tab.id} 
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 py-0.5 text-[10px] font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm gap-1"
                          >
                            {tab.icon && <tab.icon className="h-3 w-3" />}
                            {tab.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>
                    {tabs.map((tab) => (
                      <TabsContent key={tab.id} value={tab.id} className="mt-0 px-3 py-2">
                        {tab.renderContent
                          ? tab.renderContent(data, form)
                          : tab.fields && renderFields(tab.fields, data)
                        }
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div className="px-3 pt-2 pb-2">
                    {fields.length > 0 && renderFields(fields, data)}
                  </div>
                )}

                {/* Custom Actions */}
                {renderActions && (
                  <>
                    <Separator className="my-0" />
                    <div className="px-3 py-2">
                      {renderActions(data, form)}
                    </div>
                  </>
                )}

                {/* Custom Footer */}
                {renderFooter && renderFooter(data, form)}
              </form>
            </FormProvider>
          )}
        </div>

        {/* Ultra Compact Footer */}
        <div className="flex-shrink-0 sticky bottom-0 border-t bg-white px-3 py-2">
          <div className="flex items-center justify-end gap-2">
            {!hideCancelButton && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isSaving}
                className="h-9 px-4 text-base"
              >
                {cancelButtonText}
              </Button>
            )}
            <Button
              type="button"
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isSaving || isLoading}
              size="sm"
              className="h-9 px-4 text-base gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
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
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
