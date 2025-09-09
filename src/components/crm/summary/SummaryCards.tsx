
import { PieChart, List, FileText } from "lucide-react";
import SummaryCard from "./SummaryCard";
import OpportunitiesSummary from "../OpportunitiesSummary";
import TasksSummary from "../TasksSummary";
import ProposalsSummary from "../ProposalsSummary";

const SummaryCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
      {/* Opportunities Summary */}
      <SummaryCard
        title="Fırsatlar"
        description="Aktif fırsatlar ve durumları"
        icon={<PieChart />}
        viewAllPath="/opportunities"
        createPath="/opportunities"
        iconBgColor="bg-blue-100"
        iconTextColor="text-blue-600"
      >
        <OpportunitiesSummary />
      </SummaryCard>

      {/* Tasks Summary */}
      <SummaryCard
        title="Görevler"
        description="Görevler ve durumları"
        icon={<List />}
        viewAllPath="/activities"
        createPath="/activities/new"
        iconBgColor="bg-green-100"
        iconTextColor="text-green-600"
      >
        <TasksSummary />
      </SummaryCard>

      {/* Proposals Summary */}
      <SummaryCard
        title="Teklifler"
        description="Teklifler ve durumları"
        icon={<FileText />}
        viewAllPath="/proposals"
        createPath="/proposals/create"
        iconBgColor="bg-purple-100"
        iconTextColor="text-purple-600"
      >
        <ProposalsSummary />
      </SummaryCard>
    </div>
  );
};

export default SummaryCards;
