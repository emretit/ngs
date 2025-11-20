import React, { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { UserCircle } from "lucide-react";

interface ContactPersonInputProps {
  value: string;
  onChange: (value: string) => void;
  customerId?: string;
  error?: string;
  required?: boolean;
}

interface Customer {
  id: string;
  name: string;
  second_contact_name?: string | null;
  representative?: string | null;
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

const ContactPersonInput: React.FC<ContactPersonInputProps> = ({
  value,
  onChange,
  customerId,
  error,
  required
}) => {
  // Fetch customer's contact persons when customer is selected
  const { data: customerData } = useQuery({
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
          employees:representative(
            id,
            first_name,
            last_name
          )
        `)
        .eq("id", customerId)
        .single();
        
      if (error) throw error;
      return data as Customer;
    },
    enabled: !!customerId,
  });

  // Build contact persons list from customer data
  // name alanı: Müşteri tablosunda şirket için yetkili kişi bilgisini içerir
  const contactPersons = useMemo(() => {
    const contacts: string[] = [];
    
    if (!customerData) return contacts;
    
    // Birinci yetkili kişi (name alanı - müşteri tablosunda yetkili kişi kolonu)
    if (customerData.name) {
      contacts.push(customerData.name);
    }
    
    // İkinci yetkili kişi
    if (customerData.second_contact_name) {
      contacts.push(customerData.second_contact_name);
    }
    
    // Temsilci çalışan (representative employee)
    if (customerData.employees) {
      const fullName = `${customerData.employees.first_name} ${customerData.employees.last_name}`;
      if (!contacts.includes(fullName)) {
        contacts.push(fullName);
      }
    }
    
    return contacts;
  }, [customerData]);

  // Auto-fill contact person when customer data is available and no value is set
  useEffect(() => {
    if (contactPersons.length > 0 && !value && customerData) {
      // Birinci yetkili kişiyi varsayılan olarak seç (name alanı)
      onChange(customerData.name);
    }
  }, [contactPersons, value, customerData, onChange]);

  // If no customer selected or no contacts available, allow manual input
  const hasContacts = contactPersons.length > 0;
  const isCustomInput = value && !contactPersons.includes(value);

  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-gray-700">
        İletişim Kişisi {required && <span className="text-red-500">*</span>}
      </Label>
      {hasContacts && !isCustomInput ? (
        <Select
          value={value}
          onValueChange={(selectedValue) => {
            if (selectedValue === "__custom__") {
              onChange("");
            } else {
              onChange(selectedValue);
            }
          }}
        >
          <SelectTrigger className={error ? "border-red-500" : ""}>
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 opacity-50" />
              <SelectValue placeholder="İletişim kişisi seçin..." />
            </div>
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
            <SelectItem value="__custom__">
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 opacity-50" />
                <span>Özel (Manuel Giriş)</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={hasContacts ? "İletişim kişisi adını girin" : "Önce müşteri seçin"}
          className={error ? "border-red-500" : ""}
          disabled={!customerId}
        />
      )}
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default ContactPersonInput;