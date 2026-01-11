import React, { useEffect, useMemo, useState, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PhoneInput } from "@/components/ui/phone-input";
import { UserCircle, Plus, Check, ChevronsUpDown, Search, User } from "lucide-react";
import { toast } from "sonner";
import { formatPhoneNumber, getDigitsOnly } from "@/utils/phoneFormatter";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ContactPersonInputProps {
  value: string;
  onChange: (value: string) => void;
  customerId?: string;
  supplierId?: string;
  error?: string;
  required?: boolean;
  onContactChange?: (contactInfo: { phone?: string; email?: string }) => void;
}

interface Customer {
  id: string;
  name: string;
  second_contact_name?: string | null;
  representative?: string | null;
  email?: string | null;
  mobile_phone?: string | null;
  office_phone?: string | null;
  second_contact_email?: string | null;
  second_contact_phone?: string | null;
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
}

interface ContactPersonInfo {
  name: string;
  type: "primary" | "secondary" | "employee" | "custom";
  canDelete: boolean;
}

const ContactPersonInput: React.FC<ContactPersonInputProps> = ({
  value,
  onChange,
  customerId,
  supplierId,
  error,
  required,
  onContactChange
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const queryClient = useQueryClient();
  
  // onChange ve onContactChange'i useRef ile sabit tutuyoruz sonsuz döngüyü önlemek için
  const onChangeRef = useRef(onChange);
  const onContactChangeRef = useRef(onContactChange);
  
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  useEffect(() => {
    onContactChangeRef.current = onContactChange;
  }, [onContactChange]);

  // Fetch customer's contact persons when customer is selected
  const { data: customerData, refetch: refetchCustomer } = useQuery({
    queryKey: ["customer-contacts", customerId],
    queryFn: async () => {
      if (!customerId) return null;
      
      const { data, error } = await supabase
        .from("customers")
        .select(`
          id,
          name,
          second_contact_name,
          representative,
          email,
          mobile_phone,
          office_phone,
          second_contact_email,
          second_contact_phone,
          employees:representative(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq("id", customerId)
        .single();
        
      if (error) throw error;
      return data as Customer;
    },
    enabled: !!customerId,
  });

  // Fetch supplier's contact persons when supplier is selected
  const { data: supplierData, refetch: refetchSupplier } = useQuery({
    queryKey: ["supplier-contacts", supplierId],
    queryFn: async () => {
      if (!supplierId) return null;
      
      const { data, error } = await supabase
        .from("suppliers")
        .select(`
          id,
          name,
          second_contact_name,
          representative,
          email,
          mobile_phone,
          office_phone,
          second_contact_email,
          second_contact_phone,
          employees:representative(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq("id", supplierId)
        .single();
        
      if (error) throw error;
      return data as Customer;
    },
    enabled: !!supplierId,
  });

  // Build contact persons list from customer or supplier data
  // name alanı: Müşteri/Tedarikçi tablosunda şirket için yetkili kişi bilgisini içerir
  const contactPersons = useMemo(() => {
    const contacts: ContactPersonInfo[] = [];
    const partnerData = customerData || supplierData;
    
    if (!partnerData) return contacts;
    
    // Birinci yetkili kişi (name alanı - müşteri/tedarikçi tablosunda yetkili kişi kolonu)
    if (partnerData.name) {
      contacts.push({
        name: partnerData.name,
        type: "primary",
        canDelete: false
      });
    }
    
    // İkinci yetkili kişi (silinebilir)
    if (partnerData.second_contact_name) {
      contacts.push({
        name: partnerData.second_contact_name,
        type: "secondary",
        canDelete: true
      });
    }
    
    // Temsilci çalışan (representative employee)
    if (partnerData.employees) {
      const fullName = `${partnerData.employees.first_name} ${partnerData.employees.last_name}`;
      if (!contacts.some(c => c.name === fullName)) {
        contacts.push({
          name: fullName,
          type: "employee",
          canDelete: false
        });
      }
    }
    
    return contacts;
  }, [customerData, supplierData]);

  // Müşteri/tedarikçi değiştiğinde, eğer mevcut iletişim kişisi yeni müşterinin listesinde yoksa temizle
  useEffect(() => {
    const partnerId = customerId || supplierId;
    if (partnerId && value && contactPersons.length > 0) {
      // Eğer mevcut değer yeni müşterinin iletişim kişileri listesinde yoksa temizle
      if (!contactPersons.some(c => c.name === value)) {
        onChangeRef.current("");
        if (onContactChangeRef.current) {
          onContactChangeRef.current({ phone: undefined, email: undefined });
        }
      }
    } else if (partnerId && value && contactPersons.length === 0) {
      // Yeni müşterinin hiç iletişim kişisi yoksa temizle
      onChangeRef.current("");
      if (onContactChangeRef.current) {
        onContactChangeRef.current({ phone: undefined, email: undefined });
      }
    }
  }, [customerId, supplierId, contactPersons, value]);

  // Auto-fill contact person when customer/supplier data is available and no value is set
  useEffect(() => {
    const partnerData = customerData || supplierData;
    if (contactPersons.length > 0 && !value && partnerData) {
      // Birinci yetkili kişiyi varsayılan olarak seç (name alanı)
      onChangeRef.current(partnerData.name);
      // İletişim bilgilerini de doldur
      if (onContactChangeRef.current && partnerData) {
        onContactChangeRef.current({
          phone: partnerData.mobile_phone || partnerData.office_phone || undefined,
          email: partnerData.email || undefined
        });
      }
    }
  }, [contactPersons, value, customerData, supplierData]);

  // İletişim kişisi değiştiğinde telefon ve e-postayı güncelle
  useEffect(() => {
    if (!value || !onContactChangeRef.current) return;
    
    const partnerData = customerData || supplierData;
    if (!partnerData) return;

    let phone: string | undefined;
    let email: string | undefined;

    // Seçilen kişi birinci yetkili kişi (name) ise
    if (value === partnerData.name) {
      phone = partnerData.mobile_phone || partnerData.office_phone || undefined;
      email = partnerData.email || undefined;
    }
    // Seçilen kişi ikinci yetkili kişi (second_contact_name) ise
    else if (value === partnerData.second_contact_name) {
      phone = partnerData.second_contact_phone || undefined;
      email = partnerData.second_contact_email || undefined;
    }
    // Seçilen kişi temsilci çalışan (employees) ise
    else if (partnerData.employees && value === `${partnerData.employees.first_name} ${partnerData.employees.last_name}`) {
      phone = partnerData.employees.phone || undefined;
      email = partnerData.employees.email || undefined;
    }

    // Eğer telefon veya e-posta bulunduysa güncelle
    if (phone || email) {
      onContactChangeRef.current({ phone, email });
    }
  }, [value, customerData, supplierData]);

  // Create new contact person mutation
  const createContactMutation = useMutation({
    mutationFn: async (data: { name: string; phone?: string; email?: string }) => {
      const tableName = customerId ? 'customers' : 'suppliers';
      const partnerId = customerId || supplierId;
      
      if (!partnerId) {
        throw new Error("Müşteri veya tedarikçi seçilmedi");
      }

      // Önce mevcut müşteri/tedarikçi bilgilerini çek
      const { data: partnerData, error: fetchError } = await supabase
        .from(tableName)
        .select('name')
        .eq('id', partnerId)
        .single();

      if (fetchError) throw fetchError;

      // Eğer name alanı boşsa, name'e ekle; doluysa second_contact_name'e ekle
      const updateData: any = {};
      
      if (!partnerData.name) {
        // name boşsa, name alanına ekle
        updateData.name = data.name;
        if (data.phone) {
          updateData.mobile_phone = data.phone;
        }
        if (data.email) {
          updateData.email = data.email;
        }
      } else {
        // name doluysa, second_contact_name'e ekle
        updateData.second_contact_name = data.name;
        if (data.phone) {
          updateData.second_contact_phone = data.phone;
        }
        if (data.email) {
          updateData.second_contact_email = data.email;
        }
      }

      const { data: result, error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq("id", partnerId)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customer-contacts", customerId] });
      queryClient.invalidateQueries({ queryKey: ["supplier-contacts", supplierId] });
      if (customerId) {
        refetchCustomer();
      } else if (supplierId) {
        refetchSupplier();
      }
      onChangeRef.current(variables.name);
      if (onContactChangeRef.current) {
        onContactChangeRef.current({
          phone: variables.phone || undefined,
          email: variables.email || undefined,
        });
      }
      const addedName = variables.name;
      setNewContactName("");
      setNewContactPhone("");
      setNewContactEmail("");
      setIsDialogOpen(false);
      toast.success(`"${addedName}" iletişim kişisi eklendi`);
    },
    onError: (error: any) => {
      console.error("İletişim kişisi ekleme hatası:", error);
      toast.error(`İletişim kişisi eklenirken hata oluştu: ${error?.message || 'Bilinmeyen hata'}`);
    },
  });

  const handleAddContact = async () => {
    if (!newContactName.trim()) {
      toast.error("İletişim kişisi adı gereklidir");
      return;
    }

    if (!customerId && !supplierId) {
      toast.error("Önce müşteri veya tedarikçi seçmelisiniz");
      return;
    }

    // Eğer name boşsa name'e, doluysa second_contact_name'e ekleyeceğiz
    // Eğer second_contact_name zaten varsa uyarı ver
    const partnerData = customerData || supplierData;
    if (partnerData?.name && partnerData?.second_contact_name) {
      if (!confirm(`"${partnerData.second_contact_name}" adlı ikinci iletişim kişisi zaten mevcut. Üzerine yazmak istediğinizden emin misiniz?`)) {
        return;
      }
    }

    createContactMutation.mutate({
      name: newContactName.trim(),
      phone: newContactPhone.trim() || undefined,
      email: newContactEmail.trim() || undefined,
    });
  };

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === "__add_new__") {
      setIsDialogOpen(true);
    } else {
      onChangeRef.current(selectedValue);
    }
  };

  // Manuel girilen değeri de seçenekler listesine ekle
  const allContacts = useMemo(() => {
    const contacts: ContactPersonInfo[] = [...contactPersons];
    if (value && !contactPersons.some(c => c.name === value) && value.trim() !== "") {
      contacts.push({
        name: value,
        type: "custom",
        canDelete: false
      });
    }
    return contacts;
  }, [contactPersons, value]);

  // If no customer/supplier selected or no contacts available, allow manual input
  const hasContacts = contactPersons.length > 0;
  const isCustomInput = value && !contactPersons.some(c => c.name === value);
  const partnerId = customerId || supplierId;
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return allContacts;
    const query = searchQuery.toLowerCase();
    return allContacts.filter(contact => 
      contact.name.toLowerCase().includes(query)
    );
  }, [allContacts, searchQuery]);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-gray-700">
        İletişim Kişisi {required && <span className="text-red-500">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between mt-0.5 h-8 text-xs",
              error && "border-red-500",
              !value && "text-muted-foreground"
            )}
          >
            <div className="flex items-center min-w-0 flex-1">
              <User className="mr-1.5 h-3 w-3 shrink-0 opacity-50" />
              <span className="truncate min-w-0">
                {value || "İletişim kişisi seçin veya yazın..."}
              </span>
            </div>
            <Search className="ml-1.5 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="İletişim kişisi ara veya yazın..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                {searchQuery.trim() ? (
                  <div className="py-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={async () => {
                        const contactName = searchQuery.trim();
                        // Eğer müşteri/tedarikçi seçiliyse, bu iletişim kişisini müşteri tablosuna kaydet
                        if ((customerId || supplierId) && contactName) {
                          try {
                            const tableName = customerId ? 'customers' : 'suppliers';
                            const partnerId = customerId || supplierId;
                            
                            // Müşteri/tedarikçi bilgilerini çek
                            const { data: partnerData, error: partnerError } = await supabase
                              .from(tableName)
                              .select('name, second_contact_name, representative, employees:representative(first_name, last_name)')
                              .eq('id', partnerId)
                              .single();
                            
                            if (!partnerError && partnerData) {
                              // Mevcut iletişim kişilerini kontrol et
                              const existingContacts: string[] = [];
                              
                              if (partnerData.name) {
                                existingContacts.push(partnerData.name);
                              }
                              if (partnerData.second_contact_name) {
                                existingContacts.push(partnerData.second_contact_name);
                              }
                              if (partnerData.employees) {
                                const employeeName = `${partnerData.employees.first_name} ${partnerData.employees.last_name}`;
                                existingContacts.push(employeeName);
                              }
                              
                              // Eğer iletişim kişisi mevcut listede yoksa, müşteri tablosuna kaydet
                              if (!existingContacts.includes(contactName)) {
                                // Eğer name alanı boşsa, name'e ekle; doluysa second_contact_name'e ekle
                                const updateData: any = {};
                                
                                if (!partnerData.name) {
                                  // name boşsa, name alanına ekle
                                  updateData.name = contactName;
                                } else {
                                  // name doluysa, second_contact_name'e ekle
                                  updateData.second_contact_name = contactName;
                                }
                                
                                const { error: updateError } = await supabase
                                  .from(tableName)
                                  .update(updateData)
                                  .eq('id', partnerId);
                                
                                if (updateError) {
                                  console.error('Error saving contact to partner:', updateError);
                                  toast.error('İletişim kişisi kaydedilirken hata oluştu');
                                } else {
                                  // Müşteri/tedarikçi verilerini yeniden yükle
                                  if (customerId) {
                                    refetchCustomer();
                                  } else if (supplierId) {
                                    refetchSupplier();
                                  }
                                  toast.success('İletişim kişisi müşteri bilgilerine eklendi');
                                }
                              }
                            }
                          } catch (error) {
                            console.error('Error saving contact to partner:', error);
                            toast.error('İletişim kişisi kaydedilirken hata oluştu');
                          }
                        }
                        
                        onChangeRef.current(contactName);
                        setOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      "{searchQuery}" olarak ekle
                    </Button>
                  </div>
                ) : (
                  "İletişim kişisi bulunamadı"
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredContacts.map((contact, index) => (
                  <CommandItem
                    key={index}
                    value={contact.name}
                    onSelect={() => {
                      onChangeRef.current(contact.name);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    className="flex items-center"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value === contact.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <UserCircle className="mr-2 h-4 w-4 opacity-50 shrink-0" />
                    <span className="truncate">{contact.name}</span>
                  </CommandItem>
                ))}
                <CommandItem
                  value="__add_new__"
                  onSelect={() => {
                    setOpen(false);
                    setIsDialogOpen(true);
                  }}
                  className="text-primary font-medium"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni İletişim Kişisi Ekle
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

      {/* Add Contact Person Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni İletişim Kişisi Ekle</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">İletişim Kişisi Adı *</label>
              <Input
                placeholder="İletişim kişisi adını giriniz"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Telefon</label>
              <PhoneInput
                value={newContactPhone ? formatPhoneNumber(newContactPhone) : ""}
                onChange={(value) => setNewContactPhone(getDigitsOnly(value))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">E-posta</label>
              <Input
                type="email"
                placeholder="email@ornek.com"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setNewContactName("");
                  setNewContactPhone("");
                  setNewContactEmail("");
                }}
                disabled={createContactMutation.isPending}
              >
                İptal
              </Button>
              <Button 
                onClick={handleAddContact}
                disabled={createContactMutation.isPending || !newContactName.trim()}
              >
                {createContactMutation.isPending ? "Ekleniyor..." : "Ekle"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactPersonInput;