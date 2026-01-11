import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CustomerFormData } from "@/types/customer";
import { logger } from "@/utils/logger";
import { useCustomerData } from './customers/useCustomerData';
import { useCustomerMutation } from './customers/useCustomerMutation';
import { useLocationResolver } from './suppliers/useLocationResolver';

/**
 * Customer Form Hook (Facade)
 * 
 * Müşteri form işlemlerini tek interface'de toplar:
 * - useCustomerData: Data fetching
 * - useCustomerMutation: Create/Update operations
 * - useLocationResolver: City/District çözümleme
 * 
 * @param einvoiceMukellefData - E-fatura mükellef verisi (opsiyonel)
 * 
 * @example
 * const { formData, setFormData, handleSubmit, isLoadingCustomer } = useCustomerForm();
 */
export const useCustomerForm = (einvoiceMukellefData?: any) => {
  const navigate = useNavigate();
  const { id, customer, isLoadingCustomer, customerError } = useCustomerData();
  const mutation = useCustomerMutation(id);
  const { resolveCityName, resolveDistrictName } = useLocationResolver();

  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    email: "",
    mobile_phone: "",
    office_phone: "",
    company: "",
    type: "bireysel",
    status: "potansiyel",
    representative: "",
    balance: 0,
    address: "",
    tax_number: "",
    tax_office: "",
    city: "",
    district: "",
    einvoice_alias_name: "",
    website: "",
    country: "",
    postal_code: "",
    apartment_number: "",
    unit_number: "",
    fax: "",
    bank_name: "",
    iban: "",
    account_number: "",
    trade_registry_number: "",
    mersis_number: "",
    establishment_date: "",
    sector: "",
    customer_segment: "",
    customer_source: "",
    notes: "",
    first_contact_position: "",
    second_contact_name: "",
    second_contact_email: "",
    second_contact_phone: "",
    second_contact_position: "",
    second_address: "",
    second_city: "",
    second_district: "",
    second_country: "",
    second_postal_code: "",
    payment_terms: "",
    is_einvoice_mukellef: false,
  });

  // E-fatura mükellef data ile form doldurma
  useEffect(() => {
    if (einvoiceMukellefData) {
      setFormData(prev => ({
        ...prev,
        name: einvoiceMukellefData.unvan || prev.name,
        tax_number: einvoiceMukellefData.vkn || prev.tax_number,
        einvoice_alias_name: einvoiceMukellefData.alias || prev.einvoice_alias_name,
        is_einvoice_mukellef: true,
      }));
    }
  }, [einvoiceMukellefData]);

  useEffect(() => {
    if (customer) {
      const loadFormData = async () => {
        // İl/İlçe çözümleme
        let cityName = "";
        if ((customer as any).city_id) {
          cityName = await resolveCityName((customer as any).city_id);
        } else {
          cityName = customer.city || customer.einvoice_city || "";
        }
        
        let districtName = "";
        if ((customer as any).district_id) {
          districtName = await resolveDistrictName((customer as any).district_id, (customer as any).city_id);
        } else {
          districtName = customer.district || customer.einvoice_district || "";
        }
        
        // İkinci adres çözümleme
        let secondCityName = "";
        if ((customer as any).second_city_id) {
          secondCityName = await resolveCityName((customer as any).second_city_id);
        } else {
          secondCityName = customer.second_city || "";
        }
        
        let secondDistrictName = "";
        if ((customer as any).second_district_id) {
          secondDistrictName = await resolveDistrictName((customer as any).second_district_id, (customer as any).second_city_id);
        } else {
          secondDistrictName = customer.second_district || "";
        }

        const newFormData: CustomerFormData = {
          name: customer.name ?? "",
          email: customer.email ?? "",
          mobile_phone: customer.mobile_phone ?? "",
          office_phone: customer.office_phone ?? "",
          company: customer.company ?? "",
          type: customer.type ?? "bireysel",
          status: customer.status ?? "potansiyel",
          representative: customer.representative ?? "",
          balance: customer.balance ?? 0,
          address: customer.address ?? "",
          tax_number: customer.tax_number ?? "",
          tax_office: customer.tax_office ?? "",
          city: cityName,
          district: districtName,
          einvoice_alias_name: customer.einvoice_alias_name ?? "",
          website: customer.website ?? "",
          country: customer.country ?? "",
          postal_code: customer.postal_code ?? "",
          apartment_number: customer.apartment_number ?? "",
          unit_number: customer.unit_number ?? "",
          fax: customer.fax ?? "",
          bank_name: customer.bank_name ?? "",
          iban: customer.iban ?? "",
          account_number: customer.account_number ?? "",
          trade_registry_number: customer.trade_registry_number ?? "",
          mersis_number: customer.mersis_number ?? "",
          establishment_date: customer.establishment_date ?? "",
          sector: customer.sector ?? "",
          customer_segment: customer.customer_segment ?? "",
          customer_source: customer.customer_source ?? "",
          notes: customer.notes ?? "",
          first_contact_position: customer.first_contact_position ?? "",
          second_contact_name: customer.second_contact_name ?? "",
          second_contact_email: customer.second_contact_email ?? "",
          second_contact_phone: customer.second_contact_phone ?? "",
          second_contact_position: customer.second_contact_position ?? "",
          second_address: customer.second_address ?? "",
          second_city: secondCityName,
          second_district: secondDistrictName,
          second_country: customer.second_country ?? "",
          second_postal_code: customer.second_postal_code ?? "",
          payment_terms: customer.payment_terms ?? "",
          is_einvoice_mukellef: customer.is_einvoice_mukellef ?? false,
        };

        setFormData(newFormData);
      };

      loadFormData();
    }
  }, [customer, resolveCityName, resolveDistrictName]);

  useEffect(() => {
    if (customerError) {
      toast.error("Müşteri bilgileri yüklenemedi. Lütfen tekrar deneyin.");
      navigate('/customers');
    }
  }, [customerError, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.debug('Form gönderiliyor:', formData);
    try {
      await mutation.mutateAsync(formData);
    } catch (error) {
      logger.error('Form submission error:', error);
    }
  };

  return {
    id,
    formData,
    setFormData,
    isLoadingCustomer,
    customerError,
    mutation,
    handleSubmit,
    navigate
  };
};
