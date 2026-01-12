import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SalesInvoice } from "./useSalesInvoices";

export const useSalesInvoiceEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch invoice with items
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchInvoice = async () => {
      try {
        setLoading(true);
        
        // Fetch invoice
        const { data: invoiceData, error: invoiceError } = await supabase
          .from("sales_invoices")
          .select(`
            *,
            customer:customers!sales_invoices_customer_id_fkey (
              id,
              name,
              company,
              tax_number,
              tax_office,
              email,
              mobile_phone,
              address,
              city,
              district,
              einvoice_alias_name
            ),
            supplier:suppliers!sales_invoices_supplier_id_fkey (
              id,
              name,
              company,
              tax_number
            )
          `)
          .eq("id", id)
          .single();

        if (invoiceError) throw invoiceError;

        // Fetch invoice items
        const { data: itemsData, error: itemsError } = await supabase
          .from("sales_invoice_items")
          .select("*")
          .eq("sales_invoice_id", id)
          .order("sira_no", { ascending: true });

        if (itemsError) throw itemsError;

        setInvoice({
          ...invoiceData,
          items: itemsData || [],
        } as any);
        
      } catch (error: any) {
        logger.error("Error fetching invoice:", error);
        toast.error("Fatura yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handleBack = () => {
    navigate("/sales-invoices");
  };

  const handleSave = async (formData: any) => {
    if (!id) return;

    try {
      setSaving(true);

      // Determine fatura_tipi2 based on invoice_profile
      const faturaTipi2 = formData.invoice_profile === 'EARSIVFATURA' ? 'e-arşiv' : 'e-fatura';

      // Update invoice
      const { error: invoiceError } = await supabase
        .from("sales_invoices")
        .update({
          customer_id: formData.customer_id,
          fatura_tarihi: formData.fatura_tarihi,
          vade_tarihi: formData.vade_tarihi,
          aciklama: formData.aciklama,
          notlar: formData.notlar,
          para_birimi: formData.para_birimi,
          ara_toplam: formData.ara_toplam,
          kdv_tutari: formData.kdv_tutari,
          indirim_tutari: formData.indirim_tutari,
          toplam_tutar: formData.toplam_tutar,
          odeme_sekli: formData.odeme_sekli,
          banka_bilgileri: formData.banka_bilgileri,
          durum: formData.durum,
          document_type: formData.document_type,
          invoice_type: formData.invoice_type,
          invoice_profile: formData.invoice_profile,
          fatura_tipi2: faturaTipi2,
          send_type: formData.send_type,
          sales_platform: formData.sales_platform,
          is_despatch: formData.is_despatch,
          issue_time: formData.issue_time,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (invoiceError) throw invoiceError;

      // Delete old items
      const { error: deleteError } = await supabase
        .from("sales_invoice_items")
        .delete()
        .eq("sales_invoice_id", id);

      if (deleteError) throw deleteError;

      // Insert new items
      if (formData.items && formData.items.length > 0) {
        const itemsToInsert = formData.items.map((item: any, index: number) => ({
          sales_invoice_id: id,
          product_id: item.product_id,
          urun_adi: item.urun_adi,
          aciklama: item.aciklama,
          miktar: item.miktar,
          birim: item.birim,
          birim_fiyat: item.birim_fiyat,
          kdv_orani: item.kdv_orani,
          indirim_orani: item.indirim_orani || 0,
          satir_toplami: item.satir_toplami,
          kdv_tutari: item.kdv_tutari,
          para_birimi: item.para_birimi,
          sira_no: index + 1,
        }));

        const { error: itemsError } = await supabase
          .from("sales_invoice_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["sales-invoice", id] });

      toast.success("Fatura başarıyla güncellendi");
      navigate("/sales-invoices");
      
    } catch (error: any) {
      logger.error("Error saving invoice:", error);
      toast.error("Fatura kaydedilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const refetchInvoice = async () => {
    if (!id) return;
    
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("sales_invoices")
        .select(`
          *,
          customer:customers!sales_invoices_customer_id_fkey (
            id,
            name,
            company,
            tax_number
          )
        `)
        .eq("id", id)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: itemsData, error: itemsError } = await supabase
        .from("sales_invoice_items")
        .select("*")
        .eq("sales_invoice_id", id)
        .order("sira_no", { ascending: true });

      if (itemsError) throw itemsError;

      setInvoice({
        ...invoiceData,
        items: itemsData || [],
      } as any);
      
    } catch (error: any) {
      logger.error("Error refetching invoice:", error);
      toast.error("Fatura yenilenirken bir hata oluştu");
    }
  };

  return {
    invoice,
    loading,
    saving,
    handleBack,
    handleSave,
    refetchInvoice,
  };
};
