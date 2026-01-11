
import { zodResolver } from "@hookform/resolvers/zod";
import { logger } from '@/utils/logger';
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toastUtils";
import { BankAccountFormFields } from "./BankAccountFormFields";

type BankAccount = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number?: string;
  branch_name?: string;
  iban?: string;
  swift_code?: string;
  account_type: "vadesiz" | "vadeli" | "kredi" | "pos";
  currency: "TRY" | "USD" | "EUR" | "GBP";
  current_balance: number;
  credit_limit: number;
  interest_rate?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

type BankAccountInsert = Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>;

export const formSchema = z.object({
  bank_name: z.string().min(1, "Banka adı zorunludur"),
  account_name: z.string().min(1, "Hesap adı zorunludur"),
  account_number: z.string().optional(),
  branch_name: z.string().optional(),
  iban: z.string().optional(),
  swift_code: z.string().optional(),
  account_type: z.enum(["vadesiz", "vadeli", "kredi", "pos"]),
  currency: z.enum(["TRY", "USD", "EUR", "GBP"]),
  current_balance: z.number().default(0),
  credit_limit: z.number().default(0),
  interest_rate: z.number().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewBankAccountFormProps {
  onSuccess: () => void;
}

export function NewBankAccountForm({ onSuccess }: NewBankAccountFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      current_balance: 0,
      credit_limit: 0,
      account_type: "vadesiz",
      currency: "TRY",
      bank_name: "",
      account_name: "",
    },
  });

  const { mutate: createAccount, isPending } = useMutation<BankAccount, Error, BankAccountInsert>({
    mutationFn: async (values: BankAccountInsert) => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert(values)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      showSuccess("Banka hesabı başarıyla oluşturuldu.", { duration: 1000 });
      onSuccess();
    },
    onError: (error) => {
      showError("Banka hesabı oluşturulurken bir hata oluştu.");
      logger.error('Error creating bank account:', error);
    },
  });

  function onSubmit(values: FormValues) {
    const submitData: BankAccountInsert = {
      bank_name: values.bank_name,
      account_name: values.account_name,
      account_type: values.account_type,
      currency: values.currency,
      current_balance: values.current_balance,
      credit_limit: values.credit_limit,
      ...(values.account_number && { account_number: values.account_number }),
      ...(values.branch_name && { branch_name: values.branch_name }),
      ...(values.iban && { iban: values.iban }),
      ...(values.swift_code && { swift_code: values.swift_code }),
      ...(values.interest_rate && { interest_rate: values.interest_rate }),
      ...(values.notes && { notes: values.notes }),
    };
    createAccount(submitData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
        <BankAccountFormFields form={form} />
        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => onSuccess()}>
            İptal
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
