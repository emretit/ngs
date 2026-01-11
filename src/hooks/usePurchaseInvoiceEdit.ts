import { useState } from "react";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface InvoiceItem {
  id: string;
  product_id: string | null;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  line_total: number;
}

interface UpdateInvoiceParams {
  invoiceId: string;
  category_id: string;
  notes: string;
  lineItems: InvoiceItem[];
  originalLineItems: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  originalTotal: number;
  currency: string;
}

export const usePurchaseInvoiceEdit = () => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const updatePurchaseInvoice = async (params: UpdateInvoiceParams) => {
    const {
      invoiceId,
      category_id,
      notes,
      lineItems,
      originalLineItems,
      subtotal,
      taxTotal,
      total,
      originalTotal,
      currency
    } = params;

    setSaving(true);

    try {
      logger.debug("🔄 Starting purchase invoice update...");

      // Get current user and company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Şirket bilgisi bulunamadı");

      // 1. Load current invoice data
      logger.debug("📥 Loading current invoice data...");
      const { data: currentInvoice, error: invoiceError } = await supabase
        .from("purchase_invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (invoiceError) throw invoiceError;
      if (!currentInvoice) throw new Error("Fatura bulunamadı");

      // 2. Calculate differences
      logger.debug("🔍 Calculating differences...");
      const addedItems = lineItems.filter(item =>
        item.id.startsWith('temp-') // New items have temp IDs
      );
      const removedItems = originalLineItems.filter(orig =>
        !lineItems.some(item => item.id === orig.id)
      );
      const modifiedItems = lineItems.filter(item => {
        if (item.id.startsWith('temp-')) return false; // Skip new items
        const original = originalLineItems.find(orig => orig.id === item.id);
        if (!original) return false;
        return original.quantity !== item.quantity ||
               original.unit_price !== item.unit_price ||
               original.tax_rate !== item.tax_rate ||
               original.discount_rate !== item.discount_rate;
      });

      logger.debug(`✅ Changes detected: ${addedItems.length} added, ${removedItems.length} removed, ${modifiedItems.length} modified`);

      // 3. Update purchase invoice
      logger.debug("💾 Updating purchase invoice...");
      const { error: updateError } = await supabase
        .from("purchase_invoices")
        .update({
          category_id: category_id || null,
          notes: notes || null,
          subtotal,
          tax_amount: taxTotal,
          total_amount: total,
          updated_at: new Date().toISOString()
        })
        .eq("id", invoiceId);

      if (updateError) throw updateError;

      // 4. Update supplier balance
      if (currentInvoice.supplier_id && Math.abs(total - originalTotal) > 0.01) {
        logger.debug("💰 Updating supplier balance...");
        const balanceDelta = total - originalTotal;

        const { data: supplier, error: supplierFetchError } = await supabase
          .from("suppliers")
          .select("balance")
          .eq("id", currentInvoice.supplier_id)
          .single();

        if (supplierFetchError) {
          logger.error("❌ Error fetching supplier balance:", supplierFetchError);
        } else if (supplier) {
          const newBalance = (supplier.balance || 0) - balanceDelta;
          const { error: supplierUpdateError } = await supabase
            .from("suppliers")
            .update({ balance: newBalance })
            .eq("id", currentInvoice.supplier_id);

          if (supplierUpdateError) {
            logger.error("❌ Error updating supplier balance:", supplierUpdateError);
          } else {
            logger.debug(`✅ Supplier balance updated: ${newBalance}`);
          }
        }
      }

      // 5. Get inventory transaction for this invoice
      logger.debug("🔍 Finding inventory transaction...");
      const { data: transactions, error: transactionError } = await supabase
        .from("inventory_transactions")
        .select("id, warehouse_id")
        .eq("reference_number", currentInvoice.invoice_number)
        .eq("company_id", profile.company_id)
        .eq("transaction_type", "giris");

      if (transactionError) {
        logger.error("❌ Error finding inventory transaction:", transactionError);
        throw transactionError;
      }

      const inventoryTransaction = transactions && transactions.length > 0 ? transactions[0] : null;

      if (!inventoryTransaction) {
        logger.warn("⚠️ No inventory transaction found for this invoice");
        if (addedItems.length > 0 || removedItems.length > 0 || modifiedItems.some(item => {
          const original = originalLineItems.find(o => o.id === item.id);
          return original && original.quantity !== item.quantity;
        })) {
          toast.warning("Stok hareketi bulunamadı. Fatura güncellenecek ancak stok değişiklikler uygulanamayacak.");
        }
      }

      // 6. Process removed items
      for (const removedItem of removedItems) {
        logger.debug(`🗑️ Processing removed item: ${removedItem.product_name}`);

        // Delete from purchase_invoice_items
        await supabase
          .from("purchase_invoice_items")
          .delete()
          .eq("id", removedItem.id);

        if (inventoryTransaction && removedItem.product_id) {
          // Delete from inventory_transaction_items
          await supabase
            .from("inventory_transaction_items")
            .delete()
            .eq("transaction_id", inventoryTransaction.id)
            .eq("product_id", removedItem.product_id);

          // Update warehouse stock
          const { data: existingStock } = await supabase
            .from("warehouse_stock")
            .select("id, quantity")
            .eq("product_id", removedItem.product_id)
            .eq("warehouse_id", inventoryTransaction.warehouse_id)
            .eq("company_id", profile.company_id)
            .maybeSingle();

          if (existingStock) {
            const newQuantity = Math.max(0, (existingStock.quantity || 0) - removedItem.quantity);
            await supabase
              .from("warehouse_stock")
              .update({
                quantity: newQuantity,
                last_transaction_date: new Date().toISOString()
              })
              .eq("id", existingStock.id);

            logger.debug(`✅ Stock updated for ${removedItem.product_name}: -${removedItem.quantity}`);
          }
        }
      }

      // 7. Process added items
      for (const addedItem of addedItems) {
        logger.debug(`➕ Processing added item: ${addedItem.product_name}`);

        if (!addedItem.product_id) {
          logger.warn(`⚠️ Skipping item without product_id: ${addedItem.product_name}`);
          continue;
        }

        // Insert into purchase_invoice_items
        const { data: newItem, error: insertError } = await supabase
          .from("purchase_invoice_items")
          .insert({
            purchase_invoice_id: invoiceId,
            product_id: addedItem.product_id,
            product_name: addedItem.product_name,
            sku: addedItem.sku,
            quantity: addedItem.quantity,
            unit: addedItem.unit,
            unit_price: addedItem.unit_price,
            tax_rate: addedItem.tax_rate,
            discount_rate: addedItem.discount_rate,
            line_total: addedItem.line_total,
            company_id: profile.company_id
          })
          .select()
          .single();

        if (insertError) {
          logger.error(`❌ Error inserting item:`, insertError);
          continue;
        }

        if (inventoryTransaction) {
          // Insert into inventory_transaction_items
          await supabase
            .from("inventory_transaction_items")
            .insert({
              transaction_id: inventoryTransaction.id,
              product_id: addedItem.product_id,
              product_name: addedItem.product_name,
              quantity: addedItem.quantity,
              unit: addedItem.unit,
              unit_cost: addedItem.unit_price,
              notes: `Faturaya eklendi: ${currentInvoice.invoice_number}`
            });

          // Update warehouse stock
          const { data: existingStock } = await supabase
            .from("warehouse_stock")
            .select("id, quantity")
            .eq("product_id", addedItem.product_id)
            .eq("warehouse_id", inventoryTransaction.warehouse_id)
            .eq("company_id", profile.company_id)
            .maybeSingle();

          if (existingStock) {
            await supabase
              .from("warehouse_stock")
              .update({
                quantity: (existingStock.quantity || 0) + addedItem.quantity,
                last_transaction_date: new Date().toISOString()
              })
              .eq("id", existingStock.id);
          } else {
            await supabase
              .from("warehouse_stock")
              .insert({
                product_id: addedItem.product_id,
                warehouse_id: inventoryTransaction.warehouse_id,
                quantity: addedItem.quantity,
                reserved_quantity: 0,
                last_transaction_date: new Date().toISOString(),
                company_id: profile.company_id
              });
          }

          logger.debug(`✅ Stock updated for ${addedItem.product_name}: +${addedItem.quantity}`);
        }
      }

      // 8. Process modified items
      for (const modifiedItem of modifiedItems) {
        logger.debug(`✏️ Processing modified item: ${modifiedItem.product_name}`);

        const original = originalLineItems.find(o => o.id === modifiedItem.id);
        if (!original) continue;

        // Update purchase_invoice_items
        await supabase
          .from("purchase_invoice_items")
          .update({
            quantity: modifiedItem.quantity,
            unit_price: modifiedItem.unit_price,
            tax_rate: modifiedItem.tax_rate,
            discount_rate: modifiedItem.discount_rate,
            line_total: modifiedItem.line_total
          })
          .eq("id", modifiedItem.id);

        // If quantity changed, update inventory
        if (original.quantity !== modifiedItem.quantity && inventoryTransaction && modifiedItem.product_id) {
          const quantityDelta = modifiedItem.quantity - original.quantity;

          // Update inventory_transaction_items
          await supabase
            .from("inventory_transaction_items")
            .update({
              quantity: modifiedItem.quantity,
              unit_cost: modifiedItem.unit_price
            })
            .eq("transaction_id", inventoryTransaction.id)
            .eq("product_id", modifiedItem.product_id);

          // Update warehouse stock
          const { data: existingStock } = await supabase
            .from("warehouse_stock")
            .select("id, quantity")
            .eq("product_id", modifiedItem.product_id)
            .eq("warehouse_id", inventoryTransaction.warehouse_id)
            .eq("company_id", profile.company_id)
            .maybeSingle();

          if (existingStock) {
            await supabase
              .from("warehouse_stock")
              .update({
                quantity: Math.max(0, (existingStock.quantity || 0) + quantityDelta),
                last_transaction_date: new Date().toISOString()
              })
              .eq("id", existingStock.id);

            logger.debug(`✅ Stock updated for ${modifiedItem.product_name}: ${quantityDelta > 0 ? '+' : ''}${quantityDelta}`);
          }
        }
      }

      // 9. Invalidate caches
      logger.debug("🔄 Invalidating caches...");
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['product-stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-stocks'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-stocks-proposal'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });

      logger.debug("✅ Purchase invoice updated successfully!");
      toast.success("Fatura başarıyla güncellendi");

      return { success: true };

    } catch (error: any) {
      logger.error("❌ Error updating purchase invoice:", error);
      toast.error(error.message || "Fatura güncellenirken hata oluştu");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    updatePurchaseInvoice,
    saving
  };
};
