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
import { UserCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatPhoneNumber, getDigitsOnly } from "@/utils/phoneFormatter";
import { cn } from "@/lib/utils";

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
    const contacts: string[] = [];
    const partnerData = customerData || supplierData;
    
    if (!partnerData) return contacts;
    
    // Birinci yetkili kişi (name alanı - müşteri/tedarikçi tablosunda yetkili kişi kolonu)
    if (partnerData.name) {
      contacts.push(partnerData.name);
    }
    
    // İkinci yetkili kişi
    if (partnerData.second_contact_name) {
      contacts.push(partnerData.second_contact_name);
    }
    
    // Temsilci çalışan (representative employee)
    if (partnerData.employees) {
      const fullName = `${partnerData.employees.first_name} ${partnerData.employees.last_name}`;
      if (!contacts.includes(fullName)) {
        contacts.push(fullName);
      }
    }
    
    return contacts;
  }, [customerData, supplierData]);

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
      if (customerId) {
        const { data: result, error } = await supabase
          .from("customers")
          .update({
            second_contact_name: data.name,
            second_contact_phone: data.phone || null,
            second_contact_email: data.email || null,
          })
          .eq("id", customerId)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else if (supplierId) {
        const { data: result, error } = await supabase
          .from("suppliers")
          .update({
            second_contact_name: data.name,
            second_contact_phone: data.phone || null,
            second_contact_email: data.email || null,
          })
          .eq("id", supplierId)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        throw new Error("Müşteri veya tedarikçi seçilmedi");
      }
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

    // Eğer ikinci iletişim kişisi zaten varsa uyarı ver
    const partnerData = customerData || supplierData;
    if (partnerData?.second_contact_name) {
      if (!confirm(`"${partnerData.second_contact_name}" adlı iletişim kişisi zaten mevcut. Üzerine yazmak istediğinizden emin misiniz?`)) {
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

  // If no customer/supplier selected or no contacts available, allow manual input
  const hasContacts = contactPersons.length > 0;
  const isCustomInput = value && !contactPersons.includes(value);
  const partnerId = customerId || supplierId;

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-gray-700">
        İletişim Kişisi {required && <span className="text-red-500">*</span>}
      </Label>
      {hasContacts && !isCustomInput ? (
        <Select
          value={value}
          onValueChange={handleSelectChange}
        >
          <SelectTrigger className={cn(error ? "border-red-500" : "", "h-8")}>
            <SelectValue placeholder="İletişim kişisi seçin..." />
          </SelectTrigger>
          <SelectContent>
            {contactPersons.map((contact, index) => (
              <SelectItem key={index} value={contact}>
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4 opacity-50" />
                  <span>{contact}</span>
                </div>
              </SelectItem>
            ))}
            <SelectItem value="__add_new__" className="text-primary font-medium">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Yeni İletişim Kişisi Ekle
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <Input
          value={value}
          onChange={(e) => onChangeRef.current(e.target.value)}
          placeholder={hasContacts ? "İletişim kişisi adını girin" : "Önce müşteri/tedarikçi seçin"}
          className={cn(error ? "border-red-500" : "", "h-8")}
          disabled={!partnerId}
        />
      )}
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