import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ProposalStatus } from "@/types/proposal";
import { ProposalItem } from "@/types/proposal";

interface LineItem extends ProposalItem {
  row_number: number;
}

interface ProposalFormData {
  contact_name: string;
  contact_title: string;
  offer_date: Date | undefined;
  offer_number: string;
  revision_number: number | null;
  validity_date: Date | undefined;
  prepared_by: string;
  notes: string;
  subject: string;
  currency: string;
  exchange_rate: number | undefined;
  discount_percentage: number;
  vat_percentage: number;
  payment_terms: string;
  delivery_terms: string;
  warranty_terms: string;
  price_terms: string;
  other_terms: string;
  title: string;
  customer_id: string;
  employee_id: string;
  description: string;
  status: ProposalStatus;
}

export const useProposalForm = (proposal: any) => {
  const form = useForm({
    defaultValues: {
      customer_id: '',
      contact_name: '',
      prepared_by: '',
      employee_id: '',
    }
  });

  const [proposalLoaded, setProposalLoaded] = useState(false);
  const [formData, setFormData] = useState<ProposalFormData>({
    contact_name: "",
    contact_title: "",
    offer_date: undefined,
    offer_number: "",
    revision_number: 0,
    validity_date: undefined,
    prepared_by: "",
    notes: "",
    subject: "",
    currency: "TRY",
    exchange_rate: undefined,
    discount_percentage: 0,
    vat_percentage: 20,
    payment_terms: "",
    delivery_terms: "",
    warranty_terms: "",
    price_terms: "",
    other_terms: "",
    title: "",
    customer_id: "",
    employee_id: "",
    description: "",
    status: "draft" as ProposalStatus
  });

  const [items, setItems] = useState<LineItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);

  // Watch form context values and sync with formData (only when user changes, not on initial load)
  const watchCustomerId = form.watch("customer_id");
  const watchContactName = form.watch("contact_name");
  const watchPreparedBy = form.watch("prepared_by");
  const watchEmployeeId = form.watch("employee_id");

  // Sync form context changes to formData (only after proposal is loaded)
  useEffect(() => {
    if (proposalLoaded && watchCustomerId !== undefined && watchCustomerId !== formData.customer_id) {
      setFormData(prev => ({ ...prev, customer_id: watchCustomerId }));
      setHasChanges(true);
    }
  }, [watchCustomerId, proposalLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (proposalLoaded && watchContactName !== undefined && watchContactName !== formData.contact_name) {
      setFormData(prev => ({ ...prev, contact_name: watchContactName }));
      setHasChanges(true);
    }
  }, [watchContactName, proposalLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (proposalLoaded && watchPreparedBy !== undefined && watchPreparedBy !== formData.prepared_by) {
      setFormData(prev => ({ ...prev, prepared_by: watchPreparedBy }));
      setHasChanges(true);
    }
  }, [watchPreparedBy, proposalLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (proposalLoaded && watchEmployeeId !== undefined && watchEmployeeId !== formData.employee_id) {
      setFormData(prev => ({ ...prev, employee_id: watchEmployeeId }));
      setHasChanges(true);
    }
  }, [watchEmployeeId, proposalLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize form data when proposal loads
  useEffect(() => {
    if (proposal) {
      const initialCustomerId = proposal.customer_id || "";
      const initialContactName = String(proposal.contact_name || "");
      const initialPreparedBy = proposal.employee_id || "";
      const initialEmployeeId = proposal.employee_id || "";

      // Update formData first
      setFormData({
        contact_name: initialContactName,
        contact_title: "",
        offer_date: proposal.offer_date ? new Date(proposal.offer_date) : (proposal.created_at ? new Date(proposal.created_at) : new Date()),
        offer_number: proposal.number || "",
        revision_number: proposal.revision_number ?? 0,
        validity_date: proposal.valid_until ? new Date(proposal.valid_until) : undefined,
        prepared_by: initialPreparedBy,
        notes: proposal.notes || "",
        subject: proposal.subject || "",
        currency: proposal.currency || "TRY",
        exchange_rate: proposal.exchange_rate || undefined,
        discount_percentage: 0,
        vat_percentage: 20,
        payment_terms: proposal.payment_terms || "Siparişle birlikte %50 avans, teslimde kalan tutar ödenecektir.",
        delivery_terms: proposal.delivery_terms || "Teslimat süresi: Sipariş tarihinden itibaren 15-20 iş günü",
        warranty_terms: proposal.warranty_terms || "Ürünlerimiz 2 yıl garantilidir.",
        price_terms: proposal.price_terms || "",
        other_terms: proposal.other_terms || "",
        title: proposal.title || "",
        customer_id: initialCustomerId,
        employee_id: initialEmployeeId,
        description: proposal.description || "",
        status: proposal.status as ProposalStatus
      });

      // Update form context immediately so ProposalPartnerSelect can display the customer
      form.reset({
        customer_id: initialCustomerId,
        contact_name: initialContactName,
        prepared_by: initialPreparedBy,
        employee_id: initialEmployeeId,
      });
      setProposalLoaded(true);

      // Initialize global discount from proposal
      if (proposal.total_discount !== undefined && proposal.total_discount > 0) {
        if (proposal.subtotal && proposal.subtotal > 0) {
          const discountPercentage = (proposal.total_discount / proposal.subtotal) * 100;
          setGlobalDiscountType('percentage');
          setGlobalDiscountValue(discountPercentage);
        } else {
          setGlobalDiscountType('amount');
          setGlobalDiscountValue(proposal.total_discount);
        }
      } else {
        setGlobalDiscountType('percentage');
        setGlobalDiscountValue(0);
      }

      // Initialize items from proposal
      if (proposal.items && proposal.items.length > 0) {
        const initialItems = proposal.items.map((item, index) => ({
          ...item,
          id: item.id || crypto.randomUUID(),
          row_number: index + 1,
          name: item.name || item.description || '',
          description: item.description || item.name || '',
        }));
        setItems(initialItems);
      } else {
        setItems([{
          id: "1",
          row_number: 1,
          name: "",
          description: "",
          quantity: 1,
          unit: "adet",
          unit_price: 0,
          total_price: 0,
          currency: proposal.currency || "TRY"
        }]);
      }
    }
  }, [proposal, form]);

  return {
    form,
    formData,
    setFormData,
    items,
    setItems,
    hasChanges,
    setHasChanges,
    globalDiscountType,
    setGlobalDiscountType,
    globalDiscountValue,
    setGlobalDiscountValue,
    proposalLoaded
  };
};

