
import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/utils/logger';

const insertSampleBankAccount = async () => {
  const { data, error } = await supabase
    .from('bank_accounts')
    .insert([
      {
        account_name: "Ana Vadesiz Hesap",
        bank_name: "Garanti BBVA",
        branch_name: "Levent Şubesi",
        account_number: "1234567890",
        iban: "TR330006100519786457841326",
        swift_code: "TGBATRISXXX",
        account_type: "vadesiz",
        currency: "TRY",
        current_balance: 150000,
        available_balance: 150000,
        credit_limit: 0,
        interest_rate: null,
        is_active: true,
        notes: "Ana operasyonel hesap"
      }
    ])
    .select();

  if (error) {
    logger.error("Error inserting sample bank account:", error);
  } else {
    logger.debug("Sample bank account inserted successfully:", data);
  }
};

// Execute the insertion
insertSampleBankAccount();
