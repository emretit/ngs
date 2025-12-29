
import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Building2, Plus, Phone, Mail, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { useNavigate } from "react-router-dom";
import { CustomTabs, CustomTabsList, CustomTabsTrigger, CustomTabsContent } from "@/components/ui/custom-tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProposalPartnerSelectProps {
  partnerType: "customer" | "supplier";
  label?: string;
  placeholder?: string;
  hideLabel?: boolean;
  required?: boolean;
  disabled?: boolean;
}

const ProposalPartnerSelect = ({ partnerType, label, placeholder, hideLabel, required, disabled = false }: ProposalPartnerSelectProps) => {
  const navigate = useNavigate();
  const { setValue, watch } = useFormContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [localPartnerType, setLocalPartnerType] = useState<"customer" | "supplier">(partnerType);
  const [displayCount, setDisplayCount] = useState(20); // İlk 20 müşteri göster
  
  const customerId = watch("customer_id");
  const supplierId = watch("supplier_id");
  
  // Load all customers/suppliers for initial display (limited)
  const { customers: allCustomers, suppliers: allSuppliers, customersTotalCount, suppliersTotalCount, isLoading: isLoadingAll } = useCustomerSelect();
  
  // Search in database when search query is provided
  const { data: searchedCustomers, isLoading: isSearchingCustomers } = useQuery({
    queryKey: ["customers-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return null;
      
      // Normalize search query to lowercase for case-insensitive search
      const normalizedQuery = searchQuery.trim().toLowerCase();
      
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, company, email, mobile_phone, office_phone, address, representative, einvoice_document_type, tax_number, is_einvoice_mukellef")
        .or(`name.ilike.%${normalizedQuery}%,company.ilike.%${normalizedQuery}%,email.ilike.%${normalizedQuery}%`)
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!searchQuery.trim() && isOpen,
  });

  const { data: searchedSuppliers, isLoading: isSearchingSuppliers } = useQuery({
    queryKey: ["suppliers-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return null;
      
      // Normalize search query to lowercase for case-insensitive search
      const normalizedQuery = searchQuery.trim().toLowerCase();
      
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name, company, email, mobile_phone, office_phone, address, representative, einvoice_document_type, tax_number, is_einvoice_mukellef")
        .or(`name.ilike.%${normalizedQuery}%,company.ilike.%${normalizedQuery}%,email.ilike.%${normalizedQuery}%`)
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!searchQuery.trim() && isOpen,
  });

  // Fetch selected customer/supplier directly from database if ID exists but not found in lists
  const { data: selectedCustomerData } = useQuery({
    queryKey: ["selected-customer", customerId],
    queryFn: async () => {
      if (!customerId) return null;
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, company, email, mobile_phone, office_phone, address, representative, einvoice_document_type, tax_number, is_einvoice_mukellef")
        .eq("id", customerId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!customerId && !allCustomers?.find(c => c.id === customerId) && !searchedCustomers?.find(c => c.id === customerId),
  });

  const { data: selectedSupplierData } = useQuery({
    queryKey: ["selected-supplier", supplierId],
    queryFn: async () => {
      if (!supplierId) return null;
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name, company, email, mobile_phone, office_phone, address, representative, einvoice_document_type, tax_number, is_einvoice_mukellef")
        .eq("id", supplierId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!supplierId && !allSuppliers?.find(s => s.id === supplierId) && !searchedSuppliers?.find(s => s.id === supplierId),
  });

  // Use searched results if available, otherwise use all customers
  const customers = searchQuery.trim() ? searchedCustomers : allCustomers;
  const suppliers = searchQuery.trim() ? searchedSuppliers : allSuppliers;
  const isLoading = searchQuery.trim() 
    ? (isSearchingCustomers || isSearchingSuppliers)
    : isLoadingAll;
  
  // Find selected customer/supplier from all sources
  const selectedCustomer = allCustomers?.find(c => c.id === customerId) 
    || searchedCustomers?.find(c => c.id === customerId)
    || selectedCustomerData;
  const selectedSupplier = allSuppliers?.find(s => s.id === supplierId)
    || searchedSuppliers?.find(s => s.id === supplierId)
    || selectedSupplierData;
  
  const handleSelectPartner = (id: string, type: "customer" | "supplier") => {
    if (type === "customer") {
      setValue("customer_id", id);
      setValue("supplier_id", null);
    } else {
      setValue("supplier_id", id);
      setValue("customer_id", null);
    }
    // Müşteri/tedarikçi değiştiğinde iletişim kişisi alanını temizle
    setValue("contact_name", "");
    setSearchQuery(""); // Arama sorgusunu temizle
    setIsOpen(false);
  };
  
  const handleCreateNew = (type: "customer" | "supplier") => {
    navigate(type === "customer" ? "/customers/new" : "/suppliers/new");
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 20);
  };

  // Reset display count when search query changes or popover opens
  useEffect(() => {
    if (isOpen && !searchQuery.trim()) {
      setDisplayCount(20);
    }
  }, [isOpen, searchQuery]);
  
  const getDisplayName = () => {
    if (selectedCustomer) {
      return selectedCustomer.company || selectedCustomer.name || "Müşteri seçin...";
    }
    if (selectedSupplier) {
      return selectedSupplier.company || selectedSupplier.name || "Tedarikçi seçin...";
    }
    return placeholder ?? "Müşteri veya Tedarikçi seçin...";
  };

  const selectedPartner = partnerType === "customer" ? selectedCustomer : selectedSupplier;

  // When searching, use database results directly
  // When not searching, show limited initial list (based on displayCount)
  const filteredCustomers = searchQuery.trim() 
    ? customers 
    : customers?.slice(0, displayCount);

  const filteredSuppliers = searchQuery.trim()
    ? suppliers
    : suppliers?.slice(0, displayCount);

  // Check if there are more customers/suppliers to load
  // Use totalCount if available, otherwise fall back to array length
  const hasMoreCustomers = !searchQuery.trim() && allCustomers && (
    customersTotalCount > displayCount || allCustomers.length > displayCount
  );
  const hasMoreSuppliers = !searchQuery.trim() && allSuppliers && (
    suppliersTotalCount > displayCount || allSuppliers.length > displayCount
  );
  
  // Calculate remaining count - use totalCount if available
  const remainingCustomers = customersTotalCount > 0 
    ? Math.max(0, customersTotalCount - displayCount)
    : (allCustomers ? Math.max(0, allCustomers.length - displayCount) : 0);
  const remainingSuppliers = suppliersTotalCount > 0
    ? Math.max(0, suppliersTotalCount - displayCount)
    : (allSuppliers ? Math.max(0, allSuppliers.length - displayCount) : 0);

  return (
    <div className="space-y-1.5">
      {!hideLabel && (
        <Label className="text-xs font-medium text-gray-700">
          {label ?? "Müşteri / Tedarikçi"}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Popover
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setSearchQuery(""); // Popover kapandığında arama sorgusunu temizle
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              disabled={disabled}
              className="w-full justify-between mt-0.5 h-8 text-xs"
            >
              <div className="flex items-center min-w-0 flex-1">
                {partnerType === "customer" ? (
                  <User className="mr-1.5 h-3 w-3 shrink-0 opacity-50" />
                ) : (
                  <Building2 className="mr-1.5 h-3 w-3 shrink-0 opacity-50" />
                )}
                <span className="truncate min-w-0">{getDisplayName()}</span>
              </div>
              <Search className="ml-1.5 h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[400px] max-w-[90vw] p-0 z-[9999] pointer-events-auto overflow-hidden" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <div className="p-1.5 border-b">
              <Input
                placeholder="Arama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 text-xs"
                autoComplete="off"
              />
            </div>
            
            <CustomTabs defaultValue={partnerType} onValueChange={(value) => setLocalPartnerType(value as "customer" | "supplier")}>
              <div className="px-1.5 pt-1.5 pb-0.5">
                <CustomTabsList className="w-full h-8">
                  <CustomTabsTrigger value="customer" className="flex-1 text-[11px] py-1">
                    <User className="h-2.5 w-2.5 mr-1" />
                    Müşteriler
                  </CustomTabsTrigger>
                  <CustomTabsTrigger value="supplier" className="flex-1 text-[11px] py-1">
                    <Building2 className="h-2.5 w-2.5 mr-1" />
                    Tedarikçiler
                  </CustomTabsTrigger>
                </CustomTabsList>
              </div>
              
              <CustomTabsContent value="customer" className="p-0 mt-0 focus-visible:outline-none focus-visible:ring-0">
                <ScrollArea className="h-[200px]">
                  {isLoading ? (
                    <div className="p-3 text-center text-muted-foreground text-xs">Yükleniyor...</div>
                  ) : !filteredCustomers || filteredCustomers.length === 0 ? (
                    <div className="p-3 text-center text-muted-foreground text-xs">
                      {searchQuery.trim() ? `"${searchQuery}" ile eşleşen müşteri bulunamadı` : "Müşteri bulunamadı"}
                    </div>
                  ) : (
                    <div className="grid gap-0.5 p-1">
                      {filteredCustomers?.map((customer) => (
                        <div
                          key={customer.id}
                          className={`flex items-start py-1 px-1.5 cursor-pointer rounded-md hover:bg-muted/50 min-w-0 ${
                            customer.id === customerId ? "bg-muted" : ""
                          }`}
                          onClick={() => handleSelectPartner(customer.id, "customer")}
                        >
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-1.5 mt-0.5 text-[10px] font-medium shrink-0">
                            {(customer.company || customer.name || 'M').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex justify-between items-center gap-2 min-w-0">
                              <p className="font-medium truncate text-xs min-w-0 flex-1">{customer.company || customer.name || 'İsimsiz Müşteri'}</p>
                              {customer.status && (
                                <span className={`text-[9px] px-1 py-0.5 rounded shrink-0 ${
                                  customer.status === "aktif" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                }`}>
                                  {customer.status === "aktif" ? "Aktif" : "Pasif"}
                                </span>
                              )}
                            </div>
                            {customer.company && customer.name && customer.company !== customer.name && (
                              <p className="text-[11px] text-muted-foreground truncate">{customer.name}</p>
                            )}
                            {customer.email && (
                              <div className="flex items-center text-[10px] text-muted-foreground mt-0.5 min-w-0">
                                <Mail className="h-2 w-2 mr-0.5 shrink-0" />
                                <span className="truncate min-w-0">{customer.email}</span>
                              </div>
                            )}
                            {customer.mobile_phone && (
                              <div className="flex items-center text-[10px] text-muted-foreground mt-0.5">
                                <Phone className="h-2 w-2 mr-0.5 shrink-0" />
                                <span className="truncate">{customer.mobile_phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {hasMoreCustomers && (
                    <div className="p-1.5 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={handleLoadMore}
                      >
                        Daha Fazla Yükle ({remainingCustomers} kaldı)
                      </Button>
                    </div>
                  )}
                  <div className="p-1.5 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => handleCreateNew("customer")}
                    >
                      <Plus className="h-3 w-3 mr-1.5" />
                      Yeni Müşteri Ekle
                    </Button>
                  </div>
                </ScrollArea>
              </CustomTabsContent>
              
              <CustomTabsContent value="supplier" className="p-0 mt-0 focus-visible:outline-none focus-visible:ring-0">
                <ScrollArea className="h-[200px]">
                  {isLoading ? (
                    <div className="p-3 text-center text-muted-foreground text-xs">Yükleniyor...</div>
                  ) : !filteredSuppliers || filteredSuppliers.length === 0 ? (
                    <div className="p-3 text-center text-muted-foreground text-xs">
                      {searchQuery.trim() ? `"${searchQuery}" ile eşleşen tedarikçi bulunamadı` : "Tedarikçi bulunamadı"}
                    </div>
                  ) : (
                    <div className="grid gap-0.5 p-1">
                      {filteredSuppliers?.map((supplier) => (
                        <div
                          key={supplier.id}
                          className={`flex items-start py-1 px-1.5 cursor-pointer rounded-md hover:bg-muted/50 min-w-0 ${
                            supplier.id === supplierId ? "bg-muted" : ""
                          }`}
                          onClick={() => handleSelectPartner(supplier.id, "supplier")}
                        >
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-1.5 mt-0.5 shrink-0">
                            <Building2 className="h-2.5 w-2.5" />
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex justify-between items-center gap-2 min-w-0">
                              <p className="font-medium truncate text-xs min-w-0 flex-1">{supplier.name}</p>
                              {supplier.status && (
                                <span className={`text-[9px] px-1 py-0.5 rounded shrink-0 ${
                                  supplier.status === "aktif" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                }`}>
                                  {supplier.status === "aktif" ? "Aktif" : "Pasif"}
                                </span>
                              )}
                            </div>
                            {supplier.company && (
                              <p className="text-[11px] text-muted-foreground truncate">{supplier.company}</p>
                            )}
                            {supplier.email && (
                              <div className="flex items-center text-[10px] text-muted-foreground mt-0.5 min-w-0">
                                <Mail className="h-2 w-2 mr-0.5 shrink-0" />
                                <span className="truncate min-w-0">{supplier.email}</span>
                              </div>
                            )}
                            {supplier.mobile_phone && (
                              <div className="flex items-center text-[10px] text-muted-foreground mt-0.5">
                                <Phone className="h-2 w-2 mr-0.5 shrink-0" />
                                <span className="truncate">{supplier.mobile_phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {hasMoreSuppliers && (
                    <div className="p-1.5 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={handleLoadMore}
                      >
                        Daha Fazla Yükle ({remainingSuppliers} kaldı)
                      </Button>
                    </div>
                  )}
                  <div className="p-1.5 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => handleCreateNew("supplier")}
                    >
                      <Plus className="h-3 w-3 mr-1.5" />
                      Yeni Tedarikçi Ekle
                    </Button>
                  </div>
                </ScrollArea>
              </CustomTabsContent>
            </CustomTabs>
          </PopoverContent>
        </Popover>
    </div>
  );
};

export default ProposalPartnerSelect;
