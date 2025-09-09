import { Suspense } from "react";
import FinancialOverview from "@/components/dashboard/FinancialOverview";
import DefaultLayout from "@/components/layouts/DefaultLayout";

interface FinancialOverviewPageProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const FinancialOverviewPage: React.FC<FinancialOverviewPageProps> = ({ isCollapsed, setIsCollapsed }) => {
  return (
    <DefaultLayout title="Finansal Genel Bakış" isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
      <Suspense fallback={<div>Loading...</div>}>
        <FinancialOverview />
      </Suspense>
    </DefaultLayout>
  );
};

export default FinancialOverviewPage;