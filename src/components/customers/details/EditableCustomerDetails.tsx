
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
    address_line: customer.address || "",
    payee_financial_account_id: "",
    payment_means_code: "",
    payment_means_channel_code: "",
    company_id: "",
    aliases: "",
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
