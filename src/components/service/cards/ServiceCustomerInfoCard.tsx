import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CustomTabs, CustomTabsList, CustomTabsTrigger, CustomTabsContent } from "@/components/ui/custom-tabs";
import { User, Building2, Phone, Mail, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ContactPersonInput from "@/components/proposals/form/ContactPersonInput";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";

interface ServiceCustomerInfoCardProps {
  formData: {
    customer_id: string | null;
    supplier_id: string | null;
    contact_person: string;
    contact_phone: string;
    contact_email: string;
    received_by: string | null;
  };
  handleInputChange: (field: string, value: any) => void;
  handlePartnerSelect: (partnerId: string, type: 'customer' | 'supplier') => void;
  customers?: any[];
  suppliers?: any[];
  partnersLoading?: boolean;
  selectedPartner?: any;
  onContactChange?: (contactInfo: { phone?: string; email?: string }) => void;
  errors?: Record<string, string>;
}

const ServiceCustomerInfoCard: React.FC<ServiceCustomerInfoCardProps> = ({
  formData,
  handleInputChange,
  handlePartnerSelect,
  customers = [],
  suppliers = [],
  partnersLoading = false,
  selectedPartner,
  onContactChange,
  errors = {}
}) => {
  const navigate = useNavigate();
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [partnerPopoverOpen, setPartnerPopoverOpen] = useState(false);
  const [partnerType, setPartnerType] = useState<'customer' | 'supplier'>('customer');

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!partnerSearchQuery.trim()) return customers;
    
    const query = partnerSearchQuery.toLowerCase();
    return customers.filter(customer => {
      const searchableText = [
        customer.name,
        customer.company,
        customer.email,
        customer.mobile_phone,
        customer.office_phone
      ].filter(Boolean).join(' ').toLowerCase();
      return searchableText.includes(query);
    });
  }, [customers, partnerSearchQuery]);

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    if (!partnerSearchQuery.trim()) return suppliers;
    
    const query = partnerSearchQuery.toLowerCase();
    return suppliers.filter(supplier => {
      const searchableText = [
        supplier.name,
        supplier.company,
        supplier.email,
        supplier.mobile_phone,
        supplier.office_phone
      ].filter(Boolean).join(' ').toLowerCase();
      return searchableText.includes(query);
    });
  }, [suppliers, partnerSearchQuery]);

  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
            <User className="h-4 w-4 text-green-600" />
          </div>
          Müşteri / Tedarikçi ve İletişim
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 px-3 pb-3">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Müşteri / Tedarikçi
          </Label>
          <Popover open={partnerPopoverOpen} onOpenChange={setPartnerPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={partnerPopoverOpen}
                className="w-full h-10 text-sm justify-between"
              >
                <div className="flex items-center">
                  {formData.customer_id ? (
                    <User className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  ) : formData.supplier_id ? (
                    <Building2 className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  ) : (
                    <User className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  )}
                  {selectedPartner 
                    ? selectedPartner.company || selectedPartner.name || 'İsimsiz'
                    : 'Müşteri veya Tedarikçi seçin...'}
                </div>
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] max-w-[90vw] p-0" align="start">
              <div className="p-4 border-b">
                <Input
                  placeholder="Arama..."
                  value={partnerSearchQuery}
                  onChange={(e) => setPartnerSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <CustomTabs defaultValue={partnerType} onValueChange={(value) => setPartnerType(value as "customer" | "supplier")}>
                <div className="px-4 pt-3 pb-1">
                  <CustomTabsList className="w-full">
                    <CustomTabsTrigger value="customer" className="flex-1 text-xs">
                      <User className="h-4 w-4 mr-2" />
                      Müşteriler
                    </CustomTabsTrigger>
                    <CustomTabsTrigger value="supplier" className="flex-1 text-xs">
                      <Building2 className="h-4 w-4 mr-2" />
                      Tedarikçiler
                    </CustomTabsTrigger>
                  </CustomTabsList>
                </div>
                
                <CustomTabsContent value="customer" className="p-0 focus-visible:outline-none focus-visible:ring-0">
                  <ScrollArea className="h-[300px]">
                    {partnersLoading ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        Yükleniyor...
                      </div>
                    ) : filteredCustomers && filteredCustomers.length > 0 ? (
                      <div className="grid gap-1 p-2">
                        {filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className={`flex items-start p-2 cursor-pointer rounded-md hover:bg-muted/50 ${
                              customer.id === formData.customer_id ? "bg-muted" : ""
                            }`}
                            onClick={() => {
                              handlePartnerSelect(customer.id, 'customer');
                              setPartnerPopoverOpen(false);
                            }}
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3 mt-1">
                              {customer.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between">
                                <p className="font-medium text-xs truncate">
                                  {customer.name || customer.company || 'İsimsiz Müşteri'}
                                </p>
                              </div>
                              {customer.company && customer.name && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {customer.company}
                                </p>
                              )}
                              {customer.email && (
                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                  <Mail className="h-3 w-3 mr-1" />
                                  <span className="truncate">{customer.email}</span>
                                </div>
                              )}
                              {(customer.mobile_phone || customer.office_phone) && (
                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                  <Phone className="h-3 w-3 mr-1" />
                                  <span>{customer.mobile_phone || customer.office_phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        Müşteri bulunamadı
                      </div>
                    )}
                  </ScrollArea>
                  <div className="p-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => {
                        setPartnerPopoverOpen(false);
                        navigate('/contacts/new');
                      }}
                    >
                      <Building2 className="h-3 w-3 mr-2" />
                      Yeni Müşteri Ekle
                    </Button>
                  </div>
                </CustomTabsContent>
                
                <CustomTabsContent value="supplier" className="p-0 focus-visible:outline-none focus-visible:ring-0">
                  <ScrollArea className="h-[300px]">
                    {partnersLoading ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        Yükleniyor...
                      </div>
                    ) : filteredSuppliers && filteredSuppliers.length > 0 ? (
                      <div className="grid gap-1 p-2">
                        {filteredSuppliers.map((supplier) => (
                          <div
                            key={supplier.id}
                            className={`flex items-start p-2 cursor-pointer rounded-md hover:bg-muted/50 ${
                              supplier.id === formData.supplier_id ? "bg-muted" : ""
                            }`}
                            onClick={() => {
                              handlePartnerSelect(supplier.id, 'supplier');
                              setPartnerPopoverOpen(false);
                            }}
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3 mt-1">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between">
                                <p className="font-medium text-xs truncate">
                                  {supplier.name || supplier.company || 'İsimsiz Tedarikçi'}
                                </p>
                              </div>
                              {supplier.company && supplier.name && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {supplier.company}
                                </p>
                              )}
                              {supplier.email && (
                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                  <Mail className="h-3 w-3 mr-1" />
                                  <span className="truncate">{supplier.email}</span>
                                </div>
                              )}
                              {(supplier.mobile_phone || supplier.office_phone) && (
                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                  <Phone className="h-3 w-3 mr-1" />
                                  <span>{supplier.mobile_phone || supplier.office_phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        Tedarikçi bulunamadı
                      </div>
                    )}
                  </ScrollArea>
                  <div className="p-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => {
                        setPartnerPopoverOpen(false);
                        navigate('/suppliers/new');
                      }}
                    >
                      <Building2 className="h-3 w-3 mr-2" />
                      Yeni Tedarikçi Ekle
                    </Button>
                  </div>
                </CustomTabsContent>
              </CustomTabs>
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <ContactPersonInput
            value={formData.contact_person}
            onChange={(value) => handleInputChange('contact_person', value)}
            customerId={formData.customer_id || undefined}
            supplierId={formData.supplier_id || undefined}
            error={errors.contact_person}
            onContactChange={onContactChange}
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Telefon
              </Label>
              <Input
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                placeholder="0(555) 123 45 67"
                className="h-10 text-sm"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                E-posta
              </Label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="email@ornek.com"
                className="h-10 text-sm"
              />
            </div>
          </div>

          {/* Talebi Alan */}
          <EmployeeSelector
            value={formData.received_by || ""}
            onChange={(value) => handleInputChange('received_by', value)}
            label="Talebi Alan"
            placeholder="Talebi alan kişiyi seçin..."
            error={errors.received_by}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCustomerInfoCard;

