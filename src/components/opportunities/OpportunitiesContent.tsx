
import React from "react";
import { useToast } from "@/components/ui/use-toast";
import { Opportunity } from "@/types/crm";
import OpportunitiesTable from "./OpportunitiesTable";

interface OpportunitiesContentProps {
  opportunities: Opportunity[];
  isLoading: boolean;
  error: any;
  onSelectOpportunity: (opportunity: Opportunity) => void;
  searchQuery?: string;
  statusFilter?: string;
  priorityFilter?: string;
}

const OpportunitiesContent = ({
  opportunities,
  isLoading,
  error,
  onSelectOpportunity,
  searchQuery,
  statusFilter,
  priorityFilter
}: OpportunitiesContentProps) => {
  const { toast } = useToast();

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">Fırsatlar yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-background to-muted/30 rounded-xl border border-border/50 shadow-xl backdrop-blur-sm">
      <div className="p-10 bg-gradient-to-br from-card via-muted/20 to-background rounded-2xl shadow-2xl border border-border/10 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-50"></div>
        <div className="relative z-10">
          <OpportunitiesTable
            opportunities={opportunities}
            isLoading={isLoading}
            onSelectOpportunity={onSelectOpportunity}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
          />
        </div>
      </div>
    </div>
  );
};

export default OpportunitiesContent;
