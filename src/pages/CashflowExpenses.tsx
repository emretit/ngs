import { memo, useState, useMemo, useCallback } from "react";
import ExpensesManager from "@/components/cashflow/ExpensesManager";

const CashflowExpenses = memo(() => {
  const [triggerAddDialog, setTriggerAddDialog] = useState(0);
  const [startDate, setStartDate] = useState<Date>(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(() => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  const [totalAmount, setTotalAmount] = useState(0);

  const handleStartDateChange = useCallback((date: Date) => {
    setStartDate(date);
  }, []);

  const handleEndDateChange = useCallback((date: Date) => {
    setEndDate(date);
  }, []);

  const handleTotalAmountChange = useCallback((amount: number) => {
    setTotalAmount(amount);
  }, []);

  return (
    <div className="w-full space-y-2">
      <ExpensesManager 
        triggerAddDialog={triggerAddDialog}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onTotalAmountChange={handleTotalAmountChange}
      />
    </div>
  );
});

CashflowExpenses.displayName = 'CashflowExpenses';

export default CashflowExpenses;
