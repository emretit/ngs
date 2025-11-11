import { BudgetFiltersState } from "@/pages/BudgetManagement";
import OpexMatrix from "@/components/cashflow/OpexMatrix";

interface OpexTabProps {
  filters: BudgetFiltersState;
}

const OpexTab = ({ filters }: OpexTabProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <OpexMatrix />
    </div>
  );
};

export default OpexTab;
