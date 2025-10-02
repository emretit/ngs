import { Suspense } from "react";
import FinancialOverview from "@/components/dashboard/FinancialOverview";
interface FinancialOverviewPageProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}
const FinancialOverviewPage: React.FC<FinancialOverviewPageProps> = ({ isCollapsed, setIsCollapsed }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
        <FinancialOverview />
      </Suspense>
  );
};
export default FinancialOverviewPage;