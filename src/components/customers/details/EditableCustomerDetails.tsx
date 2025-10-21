
import { useState } from "react";
import { Customer, CustomerFormData } from "@/types/customer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CustomerFormFields from "../CustomerFormFields";
import { useCustomerEdit } from "@/hooks/useCustomerEdit";

interface EditableCustomerDetailsProps {
  customer: Customer;
  onCancel: () => void;
  onSuccess: () => void;
}

export const EditableCustomerDetails = ({
  customer,
  onCancel,
  onSuccess
}: EditableCustomerDetailsProps) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: customer.name || "",
    email: customer.email || "",
    mobile_phone: customer.mobile_phone || "",
    office_phone: customer.office_phone || "",
    company: customer.company || "",
    type: customer.type,
    status: customer.status,
    representative: customer.representative || "",
    balance: customer.balance || 0,
    address: customer.address || "",
    tax_number: customer.tax_number || "",
    tax_office: customer.tax_office || "",
    city: customer.city || "",
    district: customer.district || "",
    einvoice_alias_name: customer.einvoice_alias_name || "",
    website: customer.website || "",
    country: customer.country || "",
    postal_code: customer.postal_code || "",
    fax: customer.fax || "",
    bank_name: customer.bank_name || "",
    iban: customer.iban || "",
    account_number: customer.account_number || "",
    trade_registry_number: customer.trade_registry_number || "",
    mersis_number: customer.mersis_number || "",
    establishment_date: customer.establishment_date || "",
    sector: customer.sector || "",
    customer_segment: customer.customer_segment || "",
    customer_source: customer.customer_source || "",
    notes: customer.notes || "",
    first_contact_position: customer.first_contact_position || "",
    second_contact_name: customer.second_contact_name || "",
    second_contact_email: customer.second_contact_email || "",
    second_contact_phone: customer.second_contact_phone || "",
    second_contact_position: customer.second_contact_position || "",
    second_address: customer.second_address || "",
    second_city: customer.second_city || "",
    second_district: customer.second_district || "",
    second_country: customer.second_country || "",
    second_postal_code: customer.second_postal_code || ""
  });

  const { mutation } = useCustomerEdit(customer.id, onSuccess);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutation.mutateAsync(formData);
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Müşteri Bilgilerini Düzenle</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={mutation.isPending}
            >
              İptal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <CustomerFormFields 
            formData={formData} 
            setFormData={setFormData} 
          />
        </form>
      </div>
    </Card>
  );
};
