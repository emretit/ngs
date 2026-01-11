import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SupplierFormData } from "@/types/supplier";
import { logger } from "@/utils/logger";
import { useSupplierData } from './suppliers/useSupplierData';
import { useSupplierMutation } from './suppliers/useSupplierMutation';
import { useLocationResolver } from './suppliers/useLocationResolver';

/**
 * Supplier Form Hook (Facade)
 * 
 * Tedarikçi form işlemlerini tek interface'de toplar:
 * - useSupplierData: Data fetching
 * - useSupplierMutation: Create/Update operations
 * - useLocationResolver: City/District çözümleme
 * 
 * @example
 * const { formData, setFormData, handleSubmit, isLoadingSupplier } = useSupplierForm();
 */
export const useSupplierForm = () => {
  const navigate = useNavigate();
  const { id, supplier, isLoadingSupplier, supplierError } = useSupplierData();
  const mutation = useSupplierMutation(id);
  const { resolveCityName, resolveDistrictName } = useLocationResolver();

  const [formData, setFormData] = useState<SupplierFormData>({
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
    country: "",
    postal_code: "",
    apartment_number: "",
    unit_number: "",
    fax: "",
    website: "",
    is_active: true,
    payee_financial_account_id: "",
    payment_means_channel_code: "",
    payment_means_code: "",
    aliases: [],
    einvoice_alias_name: "",
    second_contact_name: "",
    second_contact_email: "",
    second_contact_phone: "",
    second_contact_position: "",
    second_address: "",
    second_city: "",
    second_district: "",
    second_country: "",
    second_postal_code: "",
    bank_name: "",
    iban: "",
    account_number: "",
    payment_terms: "",
    trade_registry_number: "",
    mersis_number: "",
    establishment_date: "",
    sector: "",
    supplier_segment: "",
    supplier_source: "",
    notes: "",
    first_contact_position: "",
    einvoice_document_type: "",
  });

  useEffect(() => {
    if (supplier) {
      logger.debug('📝 Setting form data with supplier:', supplier);
      
      const loadFormData = async () => {
        // İl/İlçe çözümleme
        let cityName = "";
        if (supplier.city_id) {
          cityName = await resolveCityName(supplier.city_id);
        } else {
          cityName = supplier.city || "";
        }
        
        let districtName = "";
        if (supplier.district_id) {
          districtName = await resolveDistrictName(supplier.district_id, supplier.city_id);
        } else {
          districtName = supplier.district || "";
        }
        
        // İkinci adres çözümleme
        let secondCityName = "";
        if (supplier.second_city_id) {
          secondCityName = await resolveCityName(supplier.second_city_id);
        } else {
          secondCityName = supplier.second_city || "";
        }
        
        let secondDistrictName = "";
        if (supplier.second_district_id) {
          secondDistrictName = await resolveDistrictName(supplier.second_district_id, supplier.second_city_id);
        } else {
          secondDistrictName = supplier.second_district || "";
        }

        const newFormData: SupplierFormData = {
          name: supplier.name ?? "",
          email: supplier.email ?? "",
          mobile_phone: supplier.mobile_phone ?? "",
          office_phone: supplier.office_phone ?? "",
          company: supplier.company ?? "",
          type: supplier.type ?? "bireysel",
          status: supplier.status ?? "potansiyel",
          representative: supplier.representative ?? "",
          balance: supplier.balance ?? 0,
          address: supplier.address ?? "",
          tax_number: supplier.tax_number ?? "",
          tax_office: supplier.tax_office ?? "",
          city: cityName,
          district: districtName,
          country: supplier.country ?? "",
          postal_code: supplier.postal_code ?? "",
          apartment_number: supplier.apartment_number ?? "",
          unit_number: supplier.unit_number ?? "",
          fax: supplier.fax ?? "",
          website: supplier.website ?? "",
          is_active: supplier.is_active ?? true,
          payee_financial_account_id: supplier.payee_financial_account_id ?? "",
          payment_means_channel_code: supplier.payment_means_channel_code ?? "",
          payment_means_code: supplier.payment_means_code ?? "",
          aliases: supplier.aliases ?? [],
          einvoice_alias_name: supplier.einvoice_alias_name ?? "",
          second_contact_name: supplier.second_contact_name ?? "",
          second_contact_email: supplier.second_contact_email ?? "",
          second_contact_phone: supplier.second_contact_phone ?? "",
          second_contact_position: supplier.second_contact_position ?? "",
          second_address: supplier.second_address ?? "",
          second_city: secondCityName,
          second_district: secondDistrictName,
          second_country: supplier.second_country ?? "",
          second_postal_code: supplier.second_postal_code ?? "",
          bank_name: supplier.bank_name ?? "",
          iban: supplier.iban ?? "",
          account_number: supplier.account_number ?? "",
          payment_terms: supplier.payment_terms ?? "",
          trade_registry_number: supplier.trade_registry_number ?? "",
          mersis_number: supplier.mersis_number ?? "",
          establishment_date: supplier.establishment_date ?? "",
          sector: supplier.sector ?? "",
          supplier_segment: supplier.supplier_segment ?? "",
          supplier_source: supplier.supplier_source ?? "",
          notes: supplier.notes ?? "",
          first_contact_position: supplier.first_contact_position ?? "",
          einvoice_document_type: supplier.einvoice_document_type ?? "",
        };

        logger.debug('✅ Form data set successfully');
        setFormData(newFormData);
      };

      loadFormData();
    }
  }, [supplier, resolveCityName, resolveDistrictName]);

  useEffect(() => {
    if (supplierError) {
      toast.error("Tedarikçi bilgileri yüklenemedi. Lütfen tekrar deneyin.");
      navigate('/suppliers');
    }
  }, [supplierError, navigate]);

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
    isLoadingSupplier,
    supplierError,
    mutation,
    handleSubmit,
    navigate
  };
};
