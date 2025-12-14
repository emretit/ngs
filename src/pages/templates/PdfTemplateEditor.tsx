import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { PDFViewer } from '@react-pdf/renderer';
import { Download, Save, Eye, EyeOff, Plus, FileText, MoreHorizontal, FileDown, Send, Bold, Italic, Underline } from 'lucide-react';
import BackButton from '@/components/ui/back-button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TemplateSchema, PdfTemplate, QuoteData } from '@/types/pdf-template';
import PdfRenderer from '@/components/pdf/PdfRenderer';
import { PdfExportService } from '@/services/pdf/pdfExportService';
import { LogoUploadField } from '@/components/templates/LogoUploadField';
import { toast } from 'sonner';

interface PdfTemplateEditorProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (value: boolean) => void;
}

const PdfTemplateEditor: React.FC<PdfTemplateEditorProps> = ({ 
  isCollapsed = false, 
  setIsCollapsed = () => {} 
}) => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PdfTemplate | null>(null);
  const [previewData, setPreviewData] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isNewTemplate, setIsNewTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [companyInfoLoaded, setCompanyInfoLoaded] = useState(false);
  const companyInfoLoadedRef = useRef(false);
  const footerTextareaRef = useRef<HTMLTextAreaElement>(null);

  const form = useForm<TemplateSchema>({
    resolver: zodResolver(z.object({
      page: z.object({
        size: z.enum(['A4', 'A3', 'Letter']),
        padding: z.object({
          top: z.number().min(10).max(100),
          right: z.number().min(10).max(100),
          bottom: z.number().min(10).max(100),
          left: z.number().min(10).max(100),
        }),
        fontSize: z.number().min(8).max(20),
        fontFamily: z.enum(['Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Inter', 'Poppins', 'Nunito', 'Playfair Display', 'Merriweather', 'Source Sans Pro', 'Helvetica', 'Times-Roman', 'Courier']).optional(),
        fontWeight: z.enum(['normal', 'bold']).optional(),
        fontColor: z.string().optional(),
        backgroundColor: z.string().optional(),
        backgroundImage: z.string().optional(),
        backgroundStyle: z.enum(['none', 'corner-wave', 'side-gradient', 'bottom-shapes', 'top-circles', 'diagonal-bands', 'corner-triangles', 'side-curves', 'custom']).optional(),
        backgroundStyleColor: z.string().optional(),
        backgroundOpacity: z.number().min(0).max(100).optional(),
      }),
      header: z.object({
        showTitle: z.boolean().optional(),
        title: z.string().min(1),
        titleFontSize: z.number().min(8).max(30),
        showLogo: z.boolean(),
        logoUrl: z.string().optional(),
        logoPosition: z.enum(['left', 'center', 'right']),
        logoSize: z.number().min(20).max(150),
        showValidity: z.boolean(),
        showCompanyInfo: z.boolean(),
        companyName: z.string().optional(),
        companyAddress: z.string().optional(),
        companyPhone: z.string().optional(),
        companyEmail: z.string().optional(),
        companyWebsite: z.string().optional(),
        companyTaxNumber: z.string().optional(),
        companyInfoFontSize: z.number().min(8).max(32),
      }),

      customer: z.object({
        customerTitleFontSize: z.number().min(8).max(25).optional(),
        customerInfoFontSize: z.number().min(8).max(32).optional(),
      }).optional(),
      lineTable: z.object({
        columns: z.array(z.object({
          key: z.string(),
          show: z.boolean(),
          label: z.string(),
          align: z.enum(['left', 'center', 'right']),
        })),
        showRowNumber: z.boolean().optional(),
      }),
      totals: z.object({
        showGross: z.boolean(),
        showDiscount: z.boolean(),
        showTax: z.boolean(),
        showNet: z.boolean(),
      }),
      notes: z.object({
        footer: z.string(),
        footerFontSize: z.number().min(8).max(32),
        showFooterLogo: z.boolean().optional(),
        footerLogoSize: z.number().min(20).max(100).optional(),
        termsSettings: z.object({
          showPaymentTerms: z.boolean(),
          showDeliveryTerms: z.boolean(),
          showWarrantyTerms: z.boolean(),
          showPriceTerms: z.boolean(),
          showOtherTerms: z.boolean(),
          titleAlign: z.enum(['left', 'center', 'right']).optional(),
        }).optional(),
      }),
    })),
    defaultValues: {
      page: {
        size: 'A4',
        padding: { top: 40, right: 40, bottom: 40, left: 40 },
        fontSize: 12,
        fontFamily: 'Roboto',
        fontWeight: 'normal',
        fontColor: '#000000',
        backgroundColor: '#FFFFFF',
        backgroundImage: '',
        backgroundStyle: 'none',
        backgroundStyleColor: '#4F46E5',
        backgroundOpacity: 5,
      },
      header: {
        showTitle: true,
        title: 'TEKLİF',
        titleFontSize: 16,
        showLogo: true,
        logoUrl: undefined,
        logoPosition: 'left',
        logoSize: 80,
        showValidity: true,
        showCompanyInfo: true,
        companyName: '',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        companyWebsite: '',
        companyTaxNumber: '',
        companyInfoFontSize: 10,
      },

      customer: {
        customerTitleFontSize: 12,
        customerInfoFontSize: 10,
      },
      lineTable: {
        columns: [
          { key: 'product_image', show: true, label: 'Görsel', align: 'center' },
          { key: 'description', show: true, label: 'Açıklama', align: 'left' },
          { key: 'quantity', show: true, label: 'Miktar', align: 'center' },
          { key: 'unit_price', show: true, label: 'Birim Fiyat', align: 'right' },
          { key: 'discount', show: true, label: 'İndirim', align: 'right' },
          { key: 'total', show: true, label: 'Toplam', align: 'right' },
        ],
        showRowNumber: true,
      },
      totals: {
        showGross: true,
        showDiscount: true,
        showTax: true,
        showNet: true,
      },
      notes: {
        footer: 'İyi çalışmalar dileriz.',
        footerFontSize: 12,
        showFooterLogo: true,
        footerLogoSize: 40,
        termsSettings: {
          showPaymentTerms: true,
          showDeliveryTerms: true,
          showWarrantyTerms: true,
          showPriceTerms: false,
          showOtherTerms: false,
          titleAlign: 'left',
        },
      },
    },
  });

  useEffect(() => {
    loadTemplates();
    loadSampleData();
  }, []);

  // Load company info from companies table - optimized to only load when needed
  const loadCompanyInfo = async (showToast = false) => {
    // Prevent duplicate calls
    if (companyInfoLoadedRef.current && showToast) {
      return;
    }
    
    try {
      console.log('Loading company info...'); // Debug
      const companySettings = await PdfExportService.getCompanySettings();
      
      console.log('Company settings loaded:', companySettings); // Debug
      
      if (companySettings && Object.keys(companySettings).length > 0) {
        // Get current form values to preserve other fields
        const currentValues = form.getValues();
        const settings = companySettings as any; // Type assertion for company settings
        
        console.log('Current form values before update:', currentValues.header); // Debug
        console.log('Company settings to apply:', {
          company_name: settings.company_name,
          company_address: settings.company_address,
          company_phone: settings.company_phone,
          company_email: settings.company_email,
          company_website: settings.company_website,
          company_tax_number: settings.company_tax_number,
        }); // Debug
        
        // Update header with company info using form.reset for reliable update
        const updatedValues = {
          ...currentValues,
          header: {
            ...currentValues.header,
            companyName: settings.company_name || '',
            companyAddress: settings.company_address || '',
            companyPhone: settings.company_phone || '',
            companyEmail: settings.company_email || '',
            companyWebsite: settings.company_website || '',
            companyTaxNumber: settings.company_tax_number || '',
            ...(settings.company_logo_url ? { logoUrl: settings.company_logo_url } : {})
          }
        };
        
        // Use form.reset to reliably update all values and trigger re-render
        form.reset(updatedValues, {
          keepDirty: false,
          keepErrors: false,
          keepIsSubmitted: false,
          keepTouched: false,
          keepIsValid: false,
          keepSubmitCount: false
        });
        
        console.log('Form values after reset:', form.getValues('header')); // Debug
        
        if (showToast && !companyInfoLoadedRef.current) {
          companyInfoLoadedRef.current = true;
          toast.success('Şirket bilgileri sistem ayarlarından yüklendi');
        }
      } else {
        console.warn('No company settings found'); // Debug
        if (showToast) {
          toast.warning('Şirket bilgileri bulunamadı. Lütfen Sistem Ayarları sayfasından şirket bilgilerinizi kaydedin.');
        }
      }
    } catch (error) {
      console.error('Error loading company info:', error);
      if (showToast) {
        toast.error('Şirket bilgileri yüklenirken hata oluştu');
      }
    }
  };

  useEffect(() => {
    console.log('useEffect triggered, templateId:', templateId, 'pathname:', location.pathname); // Debug
    // Check if we're on the new template page
    const isNewTemplatePage = location.pathname === '/pdf-templates/new' || templateId === 'new';
    
    if (isNewTemplatePage) {
      console.log('New template page detected, initializing...'); // Debug
      setIsNewTemplate(true);
      setSelectedTemplate(null);
      setTemplateName('Yeni Şablon');
      // Reset the ref when navigating to new template page
      companyInfoLoadedRef.current = false;
      // Load company info for new template after form is ready
      const initializeNewTemplate = async () => {
        console.log('initializeNewTemplate called, waiting 200ms...'); // Debug
        // Wait a bit to ensure form is mounted
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('Calling loadCompanyInfo...'); // Debug
        await loadCompanyInfo(true);
        console.log('loadCompanyInfo completed'); // Debug
      };
      initializeNewTemplate();
    } else if (templateId) {
      // If templates are still loading, wait for them to finish
      if (isLoadingTemplates) {
        return; // Wait for templates to load
      }
      
      // If templates are loaded but empty, check if template exists
      if (templates.length > 0) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setSelectedTemplate(template);
        setIsNewTemplate(false);
        setTemplateName(template.name);
        
        // Ensure all required fields exist with defaults (including migration for proposalBlock)
        const schemaWithDefaults = {
          ...template.schema_json,
            page: {
              ...template.schema_json.page,
              fontFamily: template.schema_json.page.fontFamily || 'Roboto',
              fontWeight: template.schema_json.page.fontWeight || 'normal',
              fontColor: template.schema_json.page.fontColor || '#000000',
              backgroundColor: template.schema_json.page.backgroundColor || '#FFFFFF',
              backgroundImage: template.schema_json.page.backgroundImage || '',
              backgroundStyle: template.schema_json.page.backgroundStyle || 'none',
              backgroundStyleColor: template.schema_json.page.backgroundStyleColor || '#4F46E5',
              backgroundOpacity: template.schema_json.page.backgroundOpacity ?? 5,
            },
          header: {
            ...template.schema_json.header,
            logoPosition: template.schema_json.header.logoPosition || 'left',
            logoSize: template.schema_json.header.logoSize || 80,
            showTitle: template.schema_json.header.showTitle ?? true,
            titleFontSize: template.schema_json.header.titleFontSize || 16,
            showCompanyInfo: template.schema_json.header.showCompanyInfo ?? true,
            companyName: template.schema_json.header.companyName || 'NGS TEKNOLOJİ',
            companyAddress: template.schema_json.header.companyAddress || 'İstanbul, Türkiye',
            companyPhone: template.schema_json.header.companyPhone || '+90 212 555 0123',
            companyEmail: template.schema_json.header.companyEmail || 'info@ngsteknoloji.com',
            companyWebsite: template.schema_json.header.companyWebsite || 'www.ngsteknoloji.com',
            companyTaxNumber: template.schema_json.header.companyTaxNumber || '',
            companyInfoFontSize: template.schema_json.header.companyInfoFontSize || 10,
          },
          
            // Migration: Add discount column if it doesn't exist and ensure align field exists
          customer: {
            ...template.schema_json.customer,
            customerTitleFontSize: template.schema_json.customer?.customerTitleFontSize || 12,
            customerInfoFontSize: template.schema_json.customer?.customerInfoFontSize || 10,
          },
          lineTable: {
            ...template.schema_json.lineTable,
            showRowNumber: template.schema_json.lineTable?.showRowNumber ?? true,
            columns: (() => {
              const existingColumns = template.schema_json.lineTable?.columns || [];
              const hasDiscountColumn = existingColumns.some(col => col.key === 'discount');
              const hasProductImageColumn = existingColumns.some(col => col.key === 'product_image');
                
                // Ensure all columns have align field
                let newColumns = existingColumns.map(col => ({
                  ...col,
                  align: col.align || (col.key === 'quantity' ? 'center' : col.key === 'total' || col.key === 'unit_price' || col.key === 'discount' ? 'right' : col.key === 'product_image' ? 'center' : 'left')
                }));
              
              if (!hasProductImageColumn) {
                // Insert product_image column before description column (after row number)
                const descriptionIndex = newColumns.findIndex(col => col.key === 'description');
                if (descriptionIndex !== -1) {
                  newColumns.splice(descriptionIndex, 0, {
                    key: 'product_image',
                    show: true,
                    label: 'Görsel',
                    align: 'center'
                  });
                } else {
                  // If no description column, add at the beginning
                  newColumns.unshift({
                    key: 'product_image',
                    show: true,
                    label: 'Görsel',
                    align: 'center'
                  });
                }
              }
              
              if (!hasDiscountColumn) {
                // Insert discount column before total column
                const totalIndex = newColumns.findIndex(col => col.key === 'total');
                if (totalIndex !== -1) {
                  newColumns.splice(totalIndex, 0, {
                    key: 'discount',
                    show: true,
                      label: 'İndirim',
                      align: 'right'
                  });
                } else {
                  // If no total column, add at the end
                  newColumns.push({
                    key: 'discount',
                    show: true,
                      label: 'İndirim',
                      align: 'right'
                  });
                }
              }
                return newColumns;
            })()
          },

          notes: {
            ...template.schema_json.notes,
            footerFontSize: template.schema_json.notes.footerFontSize || 12,
            showFooterLogo: template.schema_json.notes.showFooterLogo ?? true,
            footerLogoSize: template.schema_json.notes.footerLogoSize || 40,
            termsSettings: template.schema_json.notes.termsSettings || {
              showPaymentTerms: true,
              showDeliveryTerms: true,
              showWarrantyTerms: true,
              showPriceTerms: false,
              showOtherTerms: false,
              titleAlign: 'left',
            },
          }
        };
        
        form.reset(schemaWithDefaults);
      } else {
          // Template not found after templates are loaded
          toast.error('Şablon bulunamadı. Şablon silinmiş olabilir veya erişim yetkiniz olmayabilir.');
          navigate('/pdf-templates');
      }
      } else {
        // Templates loaded but empty - template might not exist or user has no access
        toast.error('Şablon bulunamadı. Şablon silinmiş olabilir veya erişim yetkiniz olmayabilir.');
        navigate('/settings/pdf-templates');
    }
    }
  }, [templateId, templates, form, navigate, location.pathname, isLoadingTemplates]);

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const templates = await PdfExportService.getTemplates();
      setTemplates(templates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Şablonlar yüklenirken hata oluştu');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const loadSampleData = async () => {
    try {
      const companySettings = await PdfExportService.getCompanySettings();
      const settings = companySettings as any; // Type assertion for company settings
      const sampleData: QuoteData = {
        number: 'TEK-2024-001',
        title: 'Örnek Teklif',
        date: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        prepared_by: settings.default_prepared_by || 'Satış Ekibi',
        customer: {
          name: 'Örnek Müşteri',
          company: 'Örnek Şirket A.Ş.',
          email: 'info@ornek.com',
          mobile_phone: '+90 212 555 0123',
          address: 'İstanbul, Türkiye',
        },
        items: [
          {
            id: '1',
            description: 'Ürün/Hizmet 1',
            quantity: 2,
            unit: 'adet',
            unit_price: 100.00,
            discount_rate: 10,
            total: 180.00,
          },
          {
            id: '2',
            description: 'Ürün/Hizmet 2',
            quantity: 1,
            unit: 'paket',
            unit_price: 150.00,
            discount_rate: 0,
            total: 150.00,
          },
        ],
        subtotal: 350.00,
        total_discount: 35.00,
        total_tax: 63.00,
        total_amount: 378.00,
        currency: 'TRY',
        notes: 'Bu bir örnek tekliftir.',
        payment_terms: '30 gün vadeli',
        delivery_terms: '1 hafta içinde',
        warranty_terms: '1 yıl garanti',
        price_terms: 'Fiyatlar KDV hariç olup, 30 gün süreyle geçerlidir.',
        other_terms: 'Teklif edilen ürünler stokla sınırlıdır. Sipariş öncesi stok kontrolü yapılmalıdır.',
        id: 'sample-1',
        created_at: new Date().toISOString(),
      };
      setPreviewData(sampleData);
    } catch (error) {
      console.error('Error loading sample data:', error);
    }
  };

  const handleSave = async (data: TemplateSchema) => {
    console.log('handleSave called with data:', data); // Debug
    setIsLoading(true);
    try {
      // Get current form values to ensure logo URL is included
      const currentFormData = form.getValues();
      const currentLogoUrl = currentFormData.header?.logoUrl;
      console.log('Current form data:', currentFormData); // Debug
      
      // Merge current form data with submitted data to ensure logo URL is preserved
      const mergedData = {
        ...data,
        header: {
          ...data.header,
          logoUrl: currentLogoUrl || data.header?.logoUrl
        }
      };

      if (isNewTemplate) {
        // Create new template
        const newTemplate: Omit<PdfTemplate, 'id' | 'created_at' | 'updated_at'> = {
          name: templateName || 'Yeni Şablon',
          type: 'quote',
          locale: 'tr',
          schema_json: mergedData,
          version: 1,
          is_default: false,
          created_by: null, // Will be set by Supabase trigger or can be set manually
        };
        
        const savedTemplate = await PdfExportService.saveTemplate(newTemplate);
        toast.success('Şablon başarıyla oluşturuldu');
        
        // Navigate to edit mode
        navigate(`/pdf-templates/edit/${savedTemplate.id}`);
      } else if (selectedTemplate) {
        // Update existing template
        const updatedTemplate: Omit<PdfTemplate, 'id' | 'created_at' | 'updated_at'> = {
          name: templateName || selectedTemplate.name,
          type: selectedTemplate.type,
          locale: selectedTemplate.locale,
          schema_json: mergedData,
          version: selectedTemplate.version + 1,
          is_default: selectedTemplate.is_default,
          created_by: selectedTemplate.created_by,
        };
        
        // Pass the template ID for update
        await PdfExportService.saveTemplate(updatedTemplate, selectedTemplate.id);
        toast.success('Şablon başarıyla kaydedildi');
        
        // Update the selected template with the new schema to prevent reload issues
        setSelectedTemplate(prev => prev ? { 
          ...prev, 
          name: templateName || prev.name,
          schema_json: mergedData, 
          version: prev.version + 1 
        } : null);
        
        // Reload templates to refresh the list, but don't reset the form
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Şablon kaydedilirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!previewData || !selectedTemplate) return;
    
    setIsLoading(true);
    try {
      await PdfExportService.downloadPdf(previewData, { templateId: selectedTemplate.id });
      toast.success('PDF başarıyla indirildi');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('PDF indirilirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const watchedValues = form.watch();

  // Rich text formatting functions for footer
  const insertFormatting = (tag: string) => {
    const textarea = footerTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = form.getValues('notes.footer') || '';
    const selectedText = currentValue.substring(start, end);

    if (selectedText) {
      // Wrap selected text with tags
      const beforeText = currentValue.substring(0, start);
      const afterText = currentValue.substring(end);
      const newValue = `${beforeText}<${tag}>${selectedText}</${tag}>${afterText}`;

      form.setValue('notes.footer', newValue);

      // Set cursor position after the closing tag
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + tag.length + 2 + selectedText.length + tag.length + 3;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      // Insert empty tags
      const beforeText = currentValue.substring(0, start);
      const afterText = currentValue.substring(start);
      const newValue = `${beforeText}<${tag}></${tag}>${afterText}`;

      form.setValue('notes.footer', newValue);

      // Set cursor position between tags
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + tag.length + 2;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  return (
    <div className="space-y-2">
      {/* Enhanced Sticky Header */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-2">
        <div className="flex items-center justify-between p-3 pl-12">
          <div className="flex items-center gap-3">
            <BackButton 
              onClick={() => navigate("/pdf-templates")}
              variant="ghost"
              size="sm"
            >
              PDF Şablonları
            </BackButton>
            
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  {isNewTemplate ? 'Yeni PDF Şablonu' : 'PDF Şablon Editörü'}
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  {isNewTemplate ? 'Yeni bir PDF şablonu oluşturun' : `${selectedTemplate?.name || 'Şablon'} düzenleniyor`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={form.handleSubmit(handleSave, (errors) => {
                console.error('Form validation errors:', errors);
                toast.error('Lütfen form alanlarını kontrol edin');
              })}
              disabled={isLoading}
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? "Kaydediliyor..." : "Kaydet"}</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50/50 hover:text-gray-700 hover:border-gray-200 transition-all duration-200 hover:shadow-sm"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="font-medium">İşlemler</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleDownloadPdf} className="gap-2 cursor-pointer" disabled={!previewData || !selectedTemplate}>
                  <Download className="h-4 w-4" />
                  <span>PDF İndir</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info("E-posta gönderimi özelliği yakında eklenecek")} className="gap-2 cursor-pointer">
                  <Send className="h-4 w-4" />
                  <span>E-posta Gönder</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Top Panel - Genel Ayarlar */}
      <div className="bg-background px-4 py-2 rounded-md border border-gray-200">
        <div className="flex items-center gap-6">
          {/* Genel Ayarlar - Accordion */}
          <div className="flex-1">
            <Accordion type="single" collapsible defaultValue="general" className="w-full">
              <AccordionItem value="general" className="border-0">
                <AccordionTrigger className="bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 px-3 py-1.5 rounded-lg border border-gray-200 font-semibold text-xs text-gray-800 h-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">🎨</span>
                    <span>Genel Ayarlar</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 px-0 pb-0">
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Şablon Adı */}
                    <div className="flex items-center gap-2">
                      <Label htmlFor="template-name" className="text-xs text-gray-600 whitespace-nowrap">Şablon Adı:</Label>
                      <Input
                        id="template-name"
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Şablon adı"
                        className="h-7 w-40 text-xs"
                      />
                    </div>

                    {/* Font Family */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600 whitespace-nowrap">Font:</Label>
                      <Select
                        value={form.watch('page.fontFamily') || 'Roboto'}
                        onValueChange={(value) => form.setValue('page.fontFamily', value as any)}
                      >
                        <SelectTrigger className="h-7 w-40 text-xs">
                          <SelectValue placeholder="Font seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Open Sans">Open Sans</SelectItem>
                          <SelectItem value="Lato">Lato</SelectItem>
                          <SelectItem value="Montserrat">Montserrat</SelectItem>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Poppins">Poppins</SelectItem>
                          <SelectItem value="Nunito">Nunito</SelectItem>
                          <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                          <SelectItem value="Merriweather">Merriweather</SelectItem>
                          <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Times-Roman">Times Roman</SelectItem>
                          <SelectItem value="Courier">Courier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Font Size */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600 whitespace-nowrap">Font Boyutu:</Label>
                      <Input
                        type="number"
                        {...form.register('page.fontSize', { valueAsNumber: true })}
                        min="8"
                        max="20"
                        placeholder="12"
                        className="h-7 w-14 text-center text-xs"
                      />
                    </div>

                    {/* Font Weight */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600 whitespace-nowrap">Kalınlık:</Label>
                      <Select
                        value={form.watch('page.fontWeight') || 'normal'}
                        onValueChange={(value) => form.setValue('page.fontWeight', value as 'normal' | 'bold')}
                      >
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <SelectValue placeholder="Kalınlık" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Kalın</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Font Color */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600 whitespace-nowrap">Font Rengi:</Label>
                      <div className="flex items-center gap-1">
                        {[
                          { name: 'Siyah', value: '#000000' },
                          { name: 'Koyu Gri', value: '#374151' },
                          { name: 'Gri', value: '#6B7280' },
                          { name: 'Mavi', value: '#3B82F6' },
                          { name: 'Kırmızı', value: '#EF4444' },
                          { name: 'Yeşil', value: '#10B981' },
                        ].map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => form.setValue('page.fontColor', color.value)}
                            className={`h-6 w-6 rounded-full border hover:ring-2 hover:ring-blue-400 transition-all ${
                              form.watch('page.fontColor') === color.value ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                      <Input
                        type="color"
                        value={form.watch('page.fontColor') || '#000000'}
                        onChange={(e) => form.setValue('page.fontColor', e.target.value)}
                        className="h-7 w-12"
                        title="Özel Renk"
                      />
                    </div>

                    {/* Background Color */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600 whitespace-nowrap">Arka Plan:</Label>
                      <div className="flex items-center gap-1">
                        {[
                          { name: 'Beyaz', value: '#FFFFFF', preview: 'bg-white' },
                          { name: 'Açık Gri', value: '#F9FAFB', preview: 'bg-gray-50' },
                          { name: 'Gri', value: '#F3F4F6', preview: 'bg-gray-100' },
                          { name: 'Açık Mavi', value: '#EFF6FF', preview: 'bg-blue-50' },
                          { name: 'Açık Yeşil', value: '#F0FDF4', preview: 'bg-green-50' },
                          { name: 'Açık Sarı', value: '#FEFCE8', preview: 'bg-yellow-50' },
                          { name: 'Açık Pembe', value: '#FDF2F8', preview: 'bg-pink-50' },
                          { name: 'Açık Mor', value: '#FAF5FF', preview: 'bg-purple-50' },
                        ].map((bg) => (
                          <button
                            key={bg.value}
                            type="button"
                            onClick={() => form.setValue('page.backgroundColor', bg.value)}
                            className={`${bg.preview} border rounded p-1 h-6 w-6 hover:ring-2 hover:ring-blue-400 transition-all ${
                              form.watch('page.backgroundColor') === bg.value ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300'
                            }`}
                            title={bg.name}
                          />
                        ))}
                      </div>
                      <Input
                        type="color"
                        value={form.watch('page.backgroundColor') || '#FFFFFF'}
                        onChange={(e) => form.setValue('page.backgroundColor', e.target.value)}
                        className="h-7 w-12"
                        title="Özel Renk"
                      />
                    </div>

                    {/* Background Style */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600 whitespace-nowrap">Arka Plan Stili:</Label>
                      <Select
                        value={form.watch('page.backgroundStyle') || 'none'}
                        onValueChange={(value) => form.setValue('page.backgroundStyle', value as any)}
                      >
                        <SelectTrigger className="h-7 w-40 text-xs">
                          <SelectValue placeholder="Stil seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Yok</SelectItem>
                          <SelectItem value="corner-wave">Köşe Dalga</SelectItem>
                          <SelectItem value="side-gradient">Yan Gradient</SelectItem>
                          <SelectItem value="bottom-shapes">Alt Şekiller</SelectItem>
                          <SelectItem value="top-circles">Üst Daireler</SelectItem>
                          <SelectItem value="diagonal-bands">Çapraz Bantlar</SelectItem>
                          <SelectItem value="corner-triangles">Köşe Üçgenler</SelectItem>
                          <SelectItem value="side-curves">Yan Eğriler</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Background Style Color */}
                    {form.watch('page.backgroundStyle') && form.watch('page.backgroundStyle') !== 'none' && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-gray-600 whitespace-nowrap">Stil Rengi:</Label>
                        <div className="flex items-center gap-1">
                          {[
                            { name: 'İndigo', value: '#4F46E5' },
                            { name: 'Mavi', value: '#3B82F6' },
                            { name: 'Yeşil', value: '#10B981' },
                            { name: 'Turuncu', value: '#F59E0B' },
                            { name: 'Kırmızı', value: '#EF4444' },
                            { name: 'Mor', value: '#8B5CF6' },
                          ].map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => form.setValue('page.backgroundStyleColor', color.value)}
                              className={`border rounded h-6 w-6 hover:ring-2 hover:ring-blue-400 transition-all ${
                                form.watch('page.backgroundStyleColor') === color.value ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                            />
                          ))}
                        </div>
                        <Input
                          type="color"
                          value={form.watch('page.backgroundStyleColor') || '#4F46E5'}
                          onChange={(e) => form.setValue('page.backgroundStyleColor', e.target.value)}
                          className="h-7 w-12"
                          title="Özel Renk"
                        />
                      </div>
                    )}

                    {/* Background Opacity */}
                    {form.watch('page.backgroundStyle') && form.watch('page.backgroundStyle') !== 'none' && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-gray-600 whitespace-nowrap">Şeffaflık:</Label>
                        <Input
                          type="number"
                          {...form.register('page.backgroundOpacity', { valueAsNumber: true })}
                          min="0"
                          max="100"
                          placeholder="5"
                          className="h-7 w-16 text-center text-xs"
                        />
                        <span className="text-xs text-gray-500">%</span>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-16rem)] rounded-md border border-gray-200 overflow-hidden">
          {/* Settings Panel */}
          <ResizablePanel defaultSize={28} minSize={22} className="min-w-0 flex flex-col">
            <div className="h-full flex flex-col bg-gradient-to-b from-background via-background/98 to-muted/20 border-r border-border/20 min-h-0 overflow-hidden">
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-2 min-h-0 space-y-2">

                {/* Header Settings */}
                <Accordion type="single" collapsible defaultValue="header">
                  <AccordionItem value="header" className="border border-gray-200 rounded-lg">
                    <AccordionTrigger className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 px-2 py-1.5 rounded-t-lg border-b border-gray-200 font-semibold text-xs text-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">📄</span>
                        <span>Başlık Ayarları</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-1.5 px-2 pb-2">
                      {/* Title and Logo Settings - Side by Side */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                        {/* Title Settings */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">T</span>
                              <Label className="text-xs font-semibold text-gray-800">Başlık</Label>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Switch
                                id="show-title"
                                checked={watchedValues.header?.showTitle ?? true}
                                onCheckedChange={(checked) => form.setValue('header.showTitle', checked)}
                                className="scale-[0.65]"
                              />
                              <Label htmlFor="show-title" className="text-xs text-gray-600">Göster</Label>
                            </div>
                          </div>
                          {(watchedValues.header?.showTitle ?? true) && (
                          <div className="bg-gray-50/80 border border-gray-200 rounded-md p-2 space-y-1.5">
                            <div>
                              <Label className="text-xs text-gray-600 mb-0.5 block">Başlık Metni</Label>
                              <Input 
                                {...form.register('header.title')} 
                                className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                                placeholder="Başlık metnini girin"
                              />
                            </div>
                            <div className="pt-1 border-t border-gray-200 flex items-center gap-2">
                                <Label className="text-xs text-gray-600 min-w-fit">Font</Label>
                                <Input
                                  type="number"
                                  {...form.register('header.titleFontSize', { valueAsNumber: true })}
                                  min="8"
                                  max="30"
                                  placeholder="16"
                                  className="h-7 w-14 text-center text-xs"
                                />
                            </div>
                          </div>
                          )}
                        </div>
                        
                        {/* Logo Settings */}
                          <LogoUploadField
                            logoUrl={watchedValues.header?.logoUrl}
                            onLogoChange={(url) => form.setValue('header.logoUrl', url || undefined)}
                            logoPosition={watchedValues.header?.logoPosition || 'left'}
                            onPositionChange={(value) => form.setValue('header.logoPosition', value)}
                            logoSize={watchedValues.header?.logoSize || 80}
                            onSizeChange={(value) => form.setValue('header.logoSize', value)}
                            showLogo={watchedValues.header?.showLogo}
                            onShowLogoChange={(value) => form.setValue('header.showLogo', value)}
                          />
                      </div>
                      
                      {/* Company Info Settings */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">🏢</span>
                            <Label className="text-xs font-semibold text-gray-800">Şirket Bilgileri</Label>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Switch
                              id="show-company-info"
                              checked={watchedValues.header?.showCompanyInfo}
                              onCheckedChange={(checked) => form.setValue('header.showCompanyInfo', checked)}
                              className="scale-75"
                            />
                            <Label htmlFor="show-company-info" className="text-xs text-gray-600">Göster</Label>
                          </div>
                        </div>

                        {watchedValues.header?.showCompanyInfo && (
                          <div className="bg-gray-50/80 border border-gray-200 rounded-md p-2 space-y-1.5">
                            <div className="p-1 bg-blue-50/80 border border-blue-200/50 rounded text-xs text-blue-700 flex items-center gap-1">
                              <span>💡</span>
                              <span>Sistem Ayarları'ndan otomatik yüklenir</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <div>
                                <Label className="text-xs text-gray-600 mb-0.5 block">Şirket Adı</Label>
                                <Input 
                                  {...form.register('header.companyName')} 
                                  placeholder="Şirket adı" 
                                  className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600 mb-0.5 block">Font</Label>
                                <Input
                                  type="number"
                                  {...form.register('header.companyInfoFontSize', { valueAsNumber: true })}
                                  min="8"
                                  max="15"
                                  placeholder="10"
                                  className="h-7 w-14 text-center text-xs"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-xs text-gray-600 mb-0.5 block">Adres</Label>
                              <Input 
                                {...form.register('header.companyAddress')} 
                                placeholder="Şirket adresi" 
                                className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs text-gray-600 mb-0.5 block">Telefon</Label>
                                <Input 
                                  {...form.register('header.companyPhone')} 
                                  placeholder="Telefon" 
                                  className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600 mb-0.5 block">E-posta</Label>
                                <Input 
                                  {...form.register('header.companyEmail')} 
                                  placeholder="E-posta" 
                                  className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs text-gray-600 mb-0.5 block">Website</Label>
                                <Input 
                                  {...form.register('header.companyWebsite')} 
                                  placeholder="Website" 
                                  className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600 mb-0.5 block">Diğer</Label>
                                <Input 
                                  {...form.register('header.companyTaxNumber')} 
                                  placeholder="İstediğiniz metni yazın" 
                                  className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Customer and Proposal Block Settings */}
                <Accordion type="single" collapsible defaultValue="customer">
                  <AccordionItem value="customer" className="border border-gray-200 rounded-lg">
                    <AccordionTrigger className="bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 px-2 py-1.5 rounded-t-lg border-b border-gray-200 font-semibold text-xs text-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">👥</span>
                        <span>Müşteri ve Teklif Bilgileri</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 pt-2 space-y-2">
                      <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded-md">
                        <div className="font-medium text-blue-800 mb-1">Müşteri ve Teklif Bilgileri</div>
                        <div className="space-y-0.5 text-blue-700 text-xs">
                          <div>• Müşteri bilgileri otomatik gösterilir</div>
                          <div>• Teklif bilgileri otomatik gösterilir</div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50/80 border border-gray-200 rounded-md p-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-gray-600 whitespace-nowrap">Başlık Font:</Label>
                          <Input
                            type="number"
                            {...form.register('customer.customerTitleFontSize', { valueAsNumber: true })}
                            min="8"
                            max="25"
                            placeholder="12"
                            className="h-7 w-16 text-center text-xs"
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-gray-600 whitespace-nowrap">Bilgi Font:</Label>
                          <Input
                            type="number"
                            {...form.register('customer.customerInfoFontSize', { valueAsNumber: true })}
                            min="8"
                            max="15"
                            placeholder="10"
                            className="h-7 w-16 text-center text-xs"
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Line Table Settings */}
                <Accordion type="single" collapsible defaultValue="table">
                  <AccordionItem value="table" className="border border-gray-200 rounded-lg">
                    <AccordionTrigger className="bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 px-2 py-1.5 rounded-t-lg border-b border-gray-200 font-semibold text-xs text-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">📊</span>
                        <span>Tablo Ayarları</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pb-2 pt-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        {/* Sıra Numarası */}
                        <div className="border rounded-md p-1.5 bg-indigo-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">1</span>
                              <Label className="text-xs font-medium text-gray-700">Sıra No.</Label>
                            </div>
                            <Switch
                              id="show-row-number"
                              checked={watchedValues.lineTable?.showRowNumber ?? true}
                              onCheckedChange={(checked) => form.setValue('lineTable.showRowNumber', checked)}
                              className="scale-[0.65]"
                            />
                          </div>
                        </div>

                        {/* Kolonlar */}
                        {watchedValues.lineTable?.columns?.map((column, index) => (
                          <div key={column.key} className="border rounded-md p-1.5 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs">{index + 2}</span>
                                <Label className="text-xs font-medium text-gray-700">{column.label}</Label>
                              </div>
                              <Switch
                                id={`show-${column.key}`}
                                checked={column.show}
                                onCheckedChange={(checked) => {
                                  const newColumns = [...(watchedValues.lineTable?.columns || [])];
                                  newColumns[index].show = checked;
                                  form.setValue('lineTable.columns', newColumns);
                                }}
                                className="scale-[0.65]"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Totals Settings */}
                <Accordion type="single" collapsible defaultValue="totals">
                  <AccordionItem value="totals" className="border border-gray-200 rounded-lg">
                    <AccordionTrigger className="bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 px-2 py-1.5 rounded-t-lg border-b border-gray-200 font-semibold text-xs text-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">💰</span>
                        <span>Toplam Ayarları</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pb-2 pt-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="border rounded-md p-1.5 bg-orange-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">1</span>
                              <Label className="text-xs font-medium text-gray-700">Ara Toplam</Label>
                            </div>
                            <Switch
                              id="show-gross"
                              checked={watchedValues.totals?.showGross}
                              onCheckedChange={(checked) => form.setValue('totals.showGross', checked)}
                              className="scale-[0.65]"
                            />
                          </div>
                        </div>

                        <div className="border rounded-md p-1.5 bg-red-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">2</span>
                              <Label className="text-xs font-medium text-gray-700">İndirim</Label>
                            </div>
                            <Switch
                              id="show-discount"
                              checked={watchedValues.totals?.showDiscount}
                              onCheckedChange={(checked) => form.setValue('totals.showDiscount', checked)}
                              className="scale-[0.65]"
                            />
                          </div>
                        </div>

                        <div className="border rounded-md p-1.5 bg-blue-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">3</span>
                              <Label className="text-xs font-medium text-gray-700">KDV</Label>
                            </div>
                            <Switch
                              id="show-tax"
                              checked={watchedValues.totals?.showTax}
                              onCheckedChange={(checked) => form.setValue('totals.showTax', checked)}
                              className="scale-[0.65]"
                            />
                          </div>
                        </div>

                        <div className="border rounded-md p-1.5 bg-green-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">4</span>
                              <Label className="text-xs font-medium text-gray-700">Genel Toplam</Label>
                            </div>
                            <Switch
                              id="show-net"
                              checked={watchedValues.totals?.showNet}
                              onCheckedChange={(checked) => form.setValue('totals.showNet', checked)}
                              className="scale-[0.65]"
                            />
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Notes Settings */}
                <Accordion type="single" collapsible defaultValue="notes">
                  <AccordionItem value="notes" className="border border-gray-200 rounded-lg">
                    <AccordionTrigger className="bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 px-3 py-2 rounded-t-lg border-b border-gray-200 font-semibold text-sm text-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">📝</span>
                        <span>Not Ayarları</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pb-2 pt-1.5 space-y-1.5">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <Label className="text-xs font-semibold text-gray-800">Şartlar ve Koşullar</Label>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-gray-600">Başlık Hizalama:</Label>
                            <Select
                              value={watchedValues.notes?.termsSettings?.titleAlign || 'left'}
                              onValueChange={(value) => form.setValue('notes.termsSettings.titleAlign', value as 'left' | 'center' | 'right')}
                            >
                              <SelectTrigger className="h-6 w-24 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Sol</SelectItem>
                                <SelectItem value="center">Orta</SelectItem>
                                <SelectItem value="right">Sağ</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="bg-gray-50/80 border border-gray-200 rounded-md p-1.5 space-y-1.5">
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="border rounded-md p-1.5 bg-blue-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs">1</span>
                                  <Label className="text-xs font-medium text-gray-700">Ödeme Şartları</Label>
                                </div>
                                <Switch
                                  id="show-payment-terms"
                                  checked={watchedValues.notes?.termsSettings?.showPaymentTerms ?? true}
                                  onCheckedChange={(checked) => form.setValue('notes.termsSettings.showPaymentTerms', checked)}
                                  className="scale-[0.65]"
                                />
                              </div>
                            </div>

                            <div className="border rounded-md p-1.5 bg-green-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs">2</span>
                                  <Label className="text-xs font-medium text-gray-700">Teslimat Şartları</Label>
                                </div>
                                <Switch
                                  id="show-delivery-terms"
                                  checked={watchedValues.notes?.termsSettings?.showDeliveryTerms ?? true}
                                  onCheckedChange={(checked) => form.setValue('notes.termsSettings.showDeliveryTerms', checked)}
                                  className="scale-[0.65]"
                                />
                              </div>
                            </div>

                            <div className="border rounded-md p-1.5 bg-purple-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs">3</span>
                                  <Label className="text-xs font-medium text-gray-700">Garanti Şartları</Label>
                                </div>
                                <Switch
                                  id="show-warranty-terms"
                                  checked={watchedValues.notes?.termsSettings?.showWarrantyTerms ?? true}
                                  onCheckedChange={(checked) => form.setValue('notes.termsSettings.showWarrantyTerms', checked)}
                                  className="scale-[0.65]"
                                />
                              </div>
                            </div>

                            <div className="border rounded-md p-1.5 bg-orange-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs">4</span>
                                  <Label className="text-xs font-medium text-gray-700">Fiyatlandırma Koşulları</Label>
                                </div>
                                <Switch
                                  id="show-price-terms"
                                  checked={watchedValues.notes?.termsSettings?.showPriceTerms ?? false}
                                  onCheckedChange={(checked) => form.setValue('notes.termsSettings.showPriceTerms', checked)}
                                  className="scale-[0.65]"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="border rounded-md p-1.5 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs">5</span>
                                <Label className="text-xs font-medium text-gray-700">Diğer Şartlar</Label>
                              </div>
                              <Switch
                                id="show-other-terms"
                                checked={watchedValues.notes?.termsSettings?.showOtherTerms ?? false}
                                onCheckedChange={(checked) => form.setValue('notes.termsSettings.showOtherTerms', checked)}
                                className="scale-[0.65]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 pt-1.5 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-gray-800">Alt Bilgi</Label>
                          <div className="flex items-center gap-1.5">
                            <Switch
                              id="show-footer-logo"
                              checked={watchedValues.notes?.showFooterLogo ?? true}
                              onCheckedChange={(checked) => form.setValue('notes.showFooterLogo', checked)}
                              className="scale-75"
                            />
                            <Label htmlFor="show-footer-logo" className="text-xs text-gray-600">Logo</Label>
                          </div>
                        </div>

                        {/* Font and Logo Size Settings */}
                        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-200">
                          <div className="flex items-center gap-1.5">
                            <Label className="text-xs text-gray-600">Font:</Label>
                            <Input
                              type="number"
                              {...form.register('notes.footerFontSize', { valueAsNumber: true })}
                              min="6"
                              max="14"
                              placeholder="9"
                              className="h-6 w-14 text-center text-xs"
                            />
                          </div>
                          {watchedValues.notes?.showFooterLogo && (
                            <div className="flex items-center gap-1.5">
                              <Label className="text-xs text-gray-600">Logo Boyut:</Label>
                              <Input
                                type="number"
                                {...form.register('notes.footerLogoSize', { valueAsNumber: true })}
                                min="20"
                                max="80"
                                placeholder="40"
                                className="h-6 w-14 text-center text-xs"
                              />
                            </div>
                          )}
                        </div>

                        {/* Rich Text Formatting Buttons */}
                        <div className="flex items-center gap-1 mb-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => insertFormatting('b')}
                            className="h-6 w-6 p-0"
                            title="Kalın (Bold)"
                          >
                            <Bold className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => insertFormatting('i')}
                            className="h-6 w-6 p-0"
                            title="İtalik (Italic)"
                          >
                            <Italic className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => insertFormatting('u')}
                            className="h-6 w-6 p-0"
                            title="Altı Çizili (Underline)"
                          >
                            <Underline className="h-3 w-3" />
                          </Button>
                          <span className="text-xs text-gray-500 ml-2">Metni seçip butonlara tıklayarak biçimlendirin</span>
                        </div>

                        {/* Footer Text Input */}
                        <Textarea
                          {...form.register('notes.footer')}
                          ref={(e) => {
                            form.register('notes.footer').ref(e);
                            (footerTextareaRef as any).current = e;
                          }}
                          rows={3}
                          className="text-xs"
                          placeholder="Alt bilgi metnini buraya yazın. Formatlama için metni seçip yukarıdaki butonları kullanın."
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* PDF Preview */}
          <ResizablePanel defaultSize={72} minSize={60} className="min-w-0">
            <div className="h-full flex flex-col">
              <div className="pb-2 px-4 pt-2 border-b sticky top-0 bg-background z-10">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Eye className="h-4 w-4" />
                    PDF Önizleme
                </div>
              </div>
              <div className="flex-1 w-full">
                  {previewData && watchedValues ? (
                  <PDFViewer className="w-full h-full border-0">
                        <PdfRenderer data={previewData} schema={watchedValues} />
                      </PDFViewer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      PDF önizlemesi yükleniyor...
                    </div>
                  )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
    </div>
  );
};

export default PdfTemplateEditor;