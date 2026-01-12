import { useState, useMemo } from "react";
import ModuleDashboardHeader, { MONTHS } from "./ModuleDashboardHeader";
import QuickLinkCard from "./QuickLinkCard";
import { ModuleDashboardConfig } from "./types";

interface ModuleDashboardProps {
  config: ModuleDashboardConfig;
  isLoading?: boolean;
  gridCols?: 2 | 3 | 4 | 5 | 6;
}

const ModuleDashboard = ({ config, isLoading = false, gridCols = 4 }: ModuleDashboardProps) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth.toString());

  const dateLabel = useMemo(() => {
    const monthName = selectedMonth === "all"
      ? "Tüm Aylar"
      : MONTHS.find(m => m.value === selectedMonth)?.label || "";
    return `${selectedYear} - ${monthName}`;
  }, [selectedYear, selectedMonth]);

  const gridColsClass = {
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6",
  }[gridCols];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ModuleDashboardHeader
        config={config.header}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
      />

      <div className="space-y-6">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-4`}>
          {config.cards.map((cardConfig) => (
            <QuickLinkCard
              key={cardConfig.id}
              config={cardConfig}
              dateLabel={dateLabel}
            />
          ))}
        </div>

        {config.additionalContent}
      </div>
    </>
  );
};

export default ModuleDashboard;
