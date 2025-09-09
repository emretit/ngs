
import { supabase } from "@/integrations/supabase/client";

/**
 * Generates a unique proposal number with date prefix and padded sequential number
 */
export async function generateProposalNumber(): Promise<string> {
  // Get the count of existing proposals
  const { count } = await supabase
    .from('proposals')
    .select('id', { count: 'exact' });
  
  // Generate a proposal number with date prefix and padded number
  const date = new Date();
  const year = date.getFullYear().toString().substring(2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  const nextNumber = (count || 0) + 1;
  const paddedNumber = nextNumber.toString().padStart(4, '0');
  
  return `TEK-${year}${month}-${paddedNumber}`;
}
