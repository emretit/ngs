import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ExpenseRequest } from "@/types/expense";
import { logger } from "@/utils/logger";

/**
 * Expense Request API
 *
 * Consolidated API layer for expense requests following purchase API pattern
 *
 * @see Phase 2.3 of PAFTA Refactoring Plan
 */

/**
 * Fetches all expense requests for a company
 *
 * @param companyId - The company ID to filter expenses
 * @returns Promise<ExpenseRequest[]> Array of expense requests
 */
export const fetchExpenseRequests = async (companyId: string): Promise<ExpenseRequest[]> => {
  logger.debug("Fetching expense requests", { companyId });

  try {
    const { data, error } = await supabase
      .from("expense_requests")
      .select("*")
      
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching expense requests", error, { companyId });
      toast.error("Harcama talepleri yüklenirken hata oluştu");
      throw error;
    }

    logger.info(`Successfully fetched ${data?.length || 0} expense requests`, { companyId });
    return data as ExpenseRequest[];
  } catch (error) {
    logger.error("Exception in fetchExpenseRequests", error, { companyId });
    toast.error("Harcama talepleri yüklenirken beklenmeyen bir hata oluştu");
    throw error;
  }
};

/**
 * Fetches a single expense request by ID
 *
 * @param id - The expense request ID
 * @returns Promise<ExpenseRequest> The expense request
 */
export const fetchExpenseRequestById = async (id: string): Promise<ExpenseRequest> => {
  logger.debug(`Fetching expense request with ID: ${id}`);

  try {
    const { data, error } = await supabase
      .from("expense_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      logger.error(`Error fetching expense request ID ${id}`, error);
      toast.error("Harcama talebi yüklenirken hata oluştu");
      throw error;
    }

    logger.info(`Successfully fetched expense request ID ${id}`);
    return data as ExpenseRequest;
  } catch (error) {
    logger.error(`Exception in fetchExpenseRequestById for ID ${id}`, error);
    toast.error("Harcama talebi yüklenirken beklenmeyen bir hata oluştu");
    throw error;
  }
};

/**
 * Creates a new expense request
 *
 * @param expense - Partial expense request data
 * @param companyId - The company ID
 * @returns Promise<ExpenseRequest> The created expense request
 */
export const createExpenseRequest = async (
  expense: Partial<ExpenseRequest>,
  companyId: string
): Promise<ExpenseRequest> => {
  logger.debug("Creating expense request", { companyId });

  try {
    const { data, error } = await supabase
      .from("expense_requests")
      .insert({ ...expense, company_id: companyId })
      .select()
      .single();

    if (error) {
      logger.error("Error creating expense request", error, { companyId });
      toast.error("Harcama talebi oluşturulurken hata oluştu");
      throw error;
    }

    logger.info("Successfully created expense request", { id: data.id, companyId });
    toast.success("Harcama talebi oluşturuldu");
    return data as ExpenseRequest;
  } catch (error) {
    logger.error("Exception in createExpenseRequest", error, { companyId });
    toast.error("Harcama talebi oluşturulurken beklenmeyen bir hata oluştu");
    throw error;
  }
};

/**
 * Submits an expense request for approval
 *
 * @param expenseId - The expense request ID
 * @returns Promise<ExpenseRequest> The updated expense request
 */
export const submitExpenseRequest = async (expenseId: string): Promise<ExpenseRequest> => {
  logger.debug(`Submitting expense request ID: ${expenseId}`);

  try {
    const { data, error } = await supabase
      .from("expense_requests")
      .update({ status: "submitted" })
      .eq("id", expenseId)
      .select()
      .single();

    if (error) {
      logger.error(`Error submitting expense request ID ${expenseId}`, error);
      toast.error("Harcama talebi gönderilirken hata oluştu");
      throw error;
    }

    logger.info(`Successfully submitted expense request ID ${expenseId}`);
    toast.success("Harcama talebi onaya gönderildi");
    return data as ExpenseRequest;
  } catch (error) {
    logger.error(`Exception in submitExpenseRequest for ID ${expenseId}`, error);
    toast.error("Harcama talebi gönderilirken beklenmeyen bir hata oluştu");
    throw error;
  }
};

/**
 * Updates an expense request
 *
 * @param id - The expense request ID
 * @param updates - Partial expense request data to update
 * @returns Promise<ExpenseRequest> The updated expense request
 */
export const updateExpenseRequest = async (
  id: string,
  updates: Partial<ExpenseRequest>
): Promise<ExpenseRequest> => {
  logger.debug(`Updating expense request ID: ${id}`);

  try {
    const { data, error } = await supabase
      .from("expense_requests")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error(`Error updating expense request ID ${id}`, error);
      toast.error("Harcama talebi güncellenirken hata oluştu");
      throw error;
    }

    logger.info(`Successfully updated expense request ID ${id}`);
    toast.success("Harcama talebi güncellendi");
    return data as ExpenseRequest;
  } catch (error) {
    logger.error(`Exception in updateExpenseRequest for ID ${id}`, error);
    toast.error("Harcama talebi güncellenirken beklenmeyen bir hata oluştu");
    throw error;
  }
};

/**
 * Deletes an expense request
 *
 * @param id - The expense request ID
 * @returns Promise<void>
 */
export const deleteExpenseRequest = async (id: string): Promise<void> => {
  logger.debug(`Deleting expense request ID: ${id}`);

  try {
    const { error } = await supabase
      .from("expense_requests")
      .delete()
      .eq("id", id);

    if (error) {
      logger.error(`Error deleting expense request ID ${id}`, error);
      toast.error("Harcama talebi silinirken hata oluştu");
      throw error;
    }

    logger.info(`Successfully deleted expense request ID ${id}`);
    toast.success("Harcama talebi silindi");
  } catch (error) {
    logger.error(`Exception in deleteExpenseRequest for ID ${id}`, error);
    toast.error("Harcama talebi silinirken beklenmeyen bir hata oluştu");
    throw error;
  }
};
