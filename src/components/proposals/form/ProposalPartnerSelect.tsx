
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Building2, Plus, Phone, Mail, MapPin, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { CustomTabs, CustomTabsList, CustomTabsTrigger, CustomTabsContent } from "@/components/ui/custom-tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProposalPartnerSelectProps {
  partnerType: "customer" | "supplier";
}

const ProposalPartnerSelect = ({ partnerType }: ProposalPartnerSelectProps) => {
  const navigate = useNavigate();
  const { setValue, watch } = useFormContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [localPartnerType, setLocalPartnerType] = useState<"customer" | "supplier">(partnerType);
  
  const customerId = watch("customer_id");
  const supplierId = watch("supplier_id");
  
  const { customers, suppliers, isLoading } = useCustomerSelect();
  
  const selectedCustomer = customers?.find(c => c.id === customerId);
  const selectedSupplier = suppliers?.find(s => s.id === supplierId);
  
  const handleSelectPartner = (id: string, type: "customer" | "supplier") => {
    if (type === "customer") {
      setValue("customer_id", id);
      setValue("supplier_id", "");
    } else {
      setValue("supplier_id", id);
      setValue("customer_id", "");
    }
    setIsOpen(false);
  };
  
  const handleCreateNew = (type: "customer" | "supplier") => {
    navigate(type === "customer" ? "/contacts/new" : "/suppliers/new");
  };
  
  const getDisplayName = () => {
    if (partnerType === "customer" && selectedCustomer) {
      return selectedCustomer.name;
    }
    if (partnerType === "supplier" && selectedSupplier) {
      return selectedSupplier.name;
    }
    return partnerType === "customer" ? "Müşteri seçin..." : "Tedarikçi seçin...";
  };

  const selectedPartner = partnerType === "customer" ? selectedCustomer : selectedSupplier;

  const filteredCustomers = customers?.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.company && customer.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredSuppliers = suppliers?.filter(supplier => 
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (supplier.company && supplier.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-base font-medium">
          {partnerType === "customer" ? "Müşteri" : "Tedarikçi"}
        </Label>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              className="w-full justify-between mt-1"
            >
              <div className="flex items-center">
                {partnerType === "customer" ? (
                  <User className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                ) : (
                  <Building2 className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                )}
                {getDisplayName()}
              </div>
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] max-w-[90vw] p-0" align="start">
            <div className="p-4 border-b">
              <Input
                placeholder="Arama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <CustomTabs defaultValue={partnerType} onValueChange={(value) => setLocalPartnerType(value as "customer" | "supplier")}>
              <div className="px-4 pt-3 pb-1">
                <CustomTabsList className="w-full">
                  <CustomTabsTrigger value="customer" className="flex-1">
                    <User className="h-4 w-4 mr-2" />
                    Müşteriler
                  </CustomTabsTrigger>
                  <CustomTabsTrigger value="supplier" className="flex-1">
                    <Building2 className="h-4 w-4 mr-2" />
                    Tedarikçiler
                  </CustomTabsTrigger>
                </CustomTabsList>
              </div>
              
              <CustomTabsContent value="customer" className="p-0 focus-visible:outline-none focus-visible:ring-0">
                <ScrollArea className="h-[300px]">
                  {isLoading ? (
                    <div className="p-4 text-center text-muted-foreground">Yükleniyor...</div>
                  ) : filteredCustomers?.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">Müşteri bulunamadı</div>
                  ) : (
                    <div className="grid gap-1 p-2">
                      {filteredCustomers?.map((customer) => (
                        <div
                          key={customer.id}
                          className={`flex items-start p-2 cursor-pointer rounded-md hover:bg-muted/50 ${
                            customer.id === customerId ? "bg-muted" : ""
                          }`}
                          onClick={() => handleSelectPartner(customer.id, "customer")}
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3 mt-1">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <p className="font-medium truncate">{customer.name}</p>
                              {customer.status && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  customer.status === "aktif" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                }`}>
                                  {customer.status === "aktif" ? "Aktif" : "Pasif"}
                                </span>
                              )}
                            </div>
                            {customer.company && (
                              <p className="text-sm text-muted-foreground truncate">{customer.company}</p>
                            )}
                            {customer.email && (
                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <Mail className="h-3 w-3 mr-1" />
                                <span className="truncate">{customer.email}</span>
                              </div>
                            )}
                            {customer.mobile_phone && (
                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <Phone className="h-3 w-3 mr-1" />
                                <span>{customer.mobile_phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="p-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleCreateNew("customer")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Müşteri Ekle
                    </Button>
                  </div>
                </ScrollArea>
              </CustomTabsContent>
              
              <CustomTabsContent value="supplier" className="p-0 focus-visible:outline-none focus-visible:ring-0">
                <ScrollArea className="h-[300px]">
                  {isLoading ? (
                    <div className="p-4 text-center text-muted-foreground">Yükleniyor...</div>
                  ) : filteredSuppliers?.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">Tedarikçi bulunamadı</div>
                  ) : (
                    <div className="grid gap-1 p-2">
                      {filteredSuppliers?.map((supplier) => (
                        <div
                          key={supplier.id}
                          className={`flex items-start p-2 cursor-pointer rounded-md hover:bg-muted/50 ${
                            supplier.id === supplierId ? "bg-muted" : ""
                          }`}
                          onClick={() => handleSelectPartner(supplier.id, "supplier")}
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3 mt-1">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <p className="font-medium truncate">{supplier.name}</p>
                              {supplier.status && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  supplier.status === "aktif" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                }`}>
                                  {supplier.status === "aktif" ? "Aktif" : "Pasif"}
                                </span>
                              )}
                            </div>
                            {supplier.company && (
                              <p className="text-sm text-muted-foreground truncate">{supplier.company}</p>
                            )}
                            {supplier.email && (
                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <Mail className="h-3 w-3 mr-1" />
                                <span className="truncate">{supplier.email}</span>
                              </div>
                            )}
                            {supplier.mobile_phone && (
                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <Phone className="h-3 w-3 mr-1" />
                                <span>{supplier.mobile_phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="p-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleCreateNew("supplier")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Tedarikçi Ekle
                    </Button>
                  </div>
                </ScrollArea>
              </CustomTabsContent>
            </CustomTabs>
          </PopoverContent>
        </Popover>
      </div>

      {selectedPartner && (
        <Card className="bg-muted/40">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <h3 className="font-medium">{selectedPartner.name}</h3>
                {selectedPartner.company && (
                  <span className="text-sm text-muted-foreground">{selectedPartner.company}</span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {selectedPartner.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{selectedPartner.email}</span>
                  </div>
                )}
                {selectedPartner.mobile_phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{selectedPartner.mobile_phone}</span>
                  </div>
                )}
                {selectedPartner.address && (
                  <div className="flex items-center col-span-2">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{selectedPartner.address}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProposalPartnerSelect;
