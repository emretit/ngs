import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ServiceRequest } from "@/hooks/service/types";
import { PdfExportService } from "@/services/pdf/pdfExportService";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Edit3,
  FileText,
  Download,
  Clock,
  User,
  MapPin,
  Calendar,
  Phone,
  Wrench,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Circle,
  Star,
  Printer,
  Package
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ServiceDetailSheetProps {
  service: ServiceRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technicians?: Array<{ id: string; first_name: string; last_name: string }>;
}

const ServiceDetailSheet: React.FC<ServiceDetailSheetProps> = ({
  service,
  open,
  onOpenChange,
  technicians = []
}) => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load templates when component mounts
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const templates = await PdfExportService.getServiceTemplates();
      setTemplates(templates);
    } catch (error) {
      console.error('Error loading service templates:', error);
    }
  };

  // Fetch service items (products)
  const { data: serviceItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['service-items', service?.id],
    queryFn: async () => {
      if (!service?.id) return [];
      
      const { data, error } = await supabase
        .from('service_items')
        .select('*')
        .eq('service_request_id', service.id)
        .order('row_number', { ascending: true });

      if (error) {
        console.error('Error loading service items:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!service?.id,
  });

  if (!service) return null;

  const customerData = service.customer_data as any;
  const technician = technicians.find(t => t.id === service.assigned_technician);

  // Durum badge renkleri
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          <AlertCircle className="h-3 w-3 mr-1" />
          Yeni
        </Badge>;
      case 'assigned':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
          <Circle className="h-3 w-3 mr-1" />
          Atanmış
        </Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          <Clock className="h-3 w-3 mr-1" />
          Devam Ediyor
        </Badge>;
      case 'on_hold':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
          <AlertCircle className="h-3 w-3 mr-1" />
          Beklemede
        </Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Tamamlandı
        </Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
          <XCircle className="h-3 w-3 mr-1" />
          İptal Edildi
        </Badge>;
      default:
        return <Badge variant="outline">{status || 'Bilinmiyor'}</Badge>;
    }
  };

  // Öncelik badge renkleri
  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Acil</Badge>;
      case 'high':
        return <Badge variant="destructive">Yüksek</Badge>;
      case 'medium':
        return <Badge variant="default">Orta</Badge>;
      case 'low':
        return <Badge variant="secondary">Düşük</Badge>;
      default:
        return priority ? <Badge variant="outline">{priority}</Badge> : null;
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: tr });
    } catch {
      return "-";
    }
  };

  const formatMoney = (amount: number | null | undefined, currency: string = 'TRY') => {
    if (amount === null || amount === undefined) return "0,00 ₺";
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate total from service items
  const calculateTotal = () => {
    if (!serviceItems || serviceItems.length === 0) return 0;
    return serviceItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
  };

  const handleEdit = () => {
    onOpenChange(false);
    navigate(`/service/edit/${service.id}`);
  };

  const handleDownloadPdf = async (templateId?: string) => {
    if (!service) return;
    
    setIsLoading(true);
    try {
      const serviceData = await PdfExportService.transformServiceForPdf(service);
      await PdfExportService.openServicePdfInNewTab(serviceData, { 
        templateId,
        filename: `servis-${serviceData.serviceNumber}.pdf`
      });
      toast.success("Servis PDF'i yeni sekmede açıldı");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("PDF oluşturulurken hata oluştu: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {/* Kompakt Header */}
        <SheetHeader className="space-y-2 pb-3 border-b">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <SheetTitle className="text-base font-semibold truncate">
                  {service.service_number || 'SR-' + service.id.slice(-6).toUpperCase()}
                </SheetTitle>
                {getStatusBadge(service.service_status)}
              </div>
              <p className="text-sm font-medium text-foreground truncate">
                {service.service_title || "Başlık belirtilmemiş"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {customerData?.company || customerData?.name || "Müşteri yok"}
              </p>
            </div>
          </div>

          {/* Hızlı Aksiyonlar */}
          <div className="flex gap-1.5">
            <Button onClick={handleEdit} size="sm" className="flex-1">
              <Edit3 className="mr-2 h-3.5 w-3.5" />
              Düzenle
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="mr-2 h-3.5 w-3.5" />
                  PDF
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {templates && templates.length > 0 ? (
                  templates.map((template) => (
                    <DropdownMenuItem 
                      key={template.id} 
                      onClick={() => handleDownloadPdf(template.id)}
                      className="cursor-pointer"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      {template.name || 'PDF Yazdır'}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    Şablon bulunamadı
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SheetHeader>

        <div className="space-y-2.5 pt-2.5">
          {/* Özet Bilgiler */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Oluşturulma</p>
              <p className="font-medium text-sm">{formatDate(service.created_at)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Bitiş Tarihi</p>
              <p className="font-medium text-sm">{formatDate(service.service_due_date)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Öncelik</p>
              <p className="font-medium text-sm">
                {getPriorityBadge(service.service_priority)}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Başlangıç</p>
              <p className="font-medium text-sm">{formatDate(service.issue_date)}</p>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Müşteri Bilgileri */}
          {customerData && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Müşteri Bilgileri</span>
              </div>
              <div className="p-2 bg-muted/30 rounded-lg space-y-1.5">
                <p className="font-medium text-sm">
                  {customerData.company || customerData.name || "Bilinmiyor"}
                </p>
                {customerData.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    {customerData.phone}
                  </p>
                )}
                {(customerData.address || service.service_location) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    {customerData.address || service.service_location}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Teknisyen Bilgisi */}
          {technician && (
            <>
              <Separator className="my-2" />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Atanan Teknisyen</span>
                </div>
                <div className="p-2 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="font-medium text-sm">
                    {technician.first_name} {technician.last_name}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Ürünler - Kompakt Liste */}
          {serviceItems && serviceItems.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Ürünler ({serviceItems.length})</span>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {serviceItems.map((item, index) => (
                    <div key={item.id || index} className="flex justify-between items-start p-1.5 bg-muted/30 rounded-lg text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{item.name || 'Ürün'}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.quantity || 1} {item.unit || 'adet'} × {formatMoney(item.unit_price, item.currency || 'TRY')}
                          {item.tax_rate && item.tax_rate > 0 && (
                            <span className="ml-1">(KDV %{item.tax_rate})</span>
                          )}
                        </p>
                      </div>
                      <span className="font-semibold text-primary ml-2 whitespace-nowrap text-sm">
                        {formatMoney(item.total_price, item.currency || 'TRY')}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Toplam */}
                {serviceItems.length > 0 && (
                  <div className="bg-primary/5 rounded-lg p-2 border border-primary/20 mt-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-muted-foreground">Toplam</span>
                      <span className="text-base font-bold text-primary">
                        {formatMoney(calculateTotal(), serviceItems[0]?.currency || 'TRY')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Açıklama */}
          {service.service_request_description && (
            <>
              <Separator className="my-2" />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Açıklama</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-4 p-2 bg-muted/30 rounded-lg">
                  {service.service_request_description}
                </p>
              </div>
            </>
          )}

          {/* Konum */}
          {service.service_location && (
            <>
              <Separator className="my-2" />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Konum</span>
                </div>
                <p className="text-xs text-muted-foreground p-2 bg-muted/30 rounded-lg">
                  {service.service_location}
                </p>
              </div>
            </>
          )}

          {/* Geçmiş - Accordion */}
          <Separator className="my-2" />
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="history" className="border-0">
              <AccordionTrigger className="py-1 px-0 hover:no-underline">
                <h3 className="text-sm font-medium">Geçmiş</h3>
              </AccordionTrigger>
              <AccordionContent className="pt-1.5 pb-0">
                <div className="space-y-2">
                  {/* Oluşturulma */}
                  {service.created_at && (
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded-full bg-gray-100 mt-0.5">
                        <CheckCircle2 className="h-2.5 w-2.5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium">Servis Oluşturuldu</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(service.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {service.service_number || 'SR-' + service.id.slice(-6).toUpperCase()} numaralı servis oluşturuldu
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Güncelleme */}
                  {service.updated_at && service.updated_at !== service.created_at && (
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded-full bg-blue-100 mt-0.5">
                        <Edit3 className="h-2.5 w-2.5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium">Son Güncelleme</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(service.updated_at)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Durum: {service.service_status}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ServiceDetailSheet;

