import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, CheckCircle2, XCircle, Clock } from "lucide-react";
import BudgetFilters from "@/components/budget/BudgetFilters";
import RevisionForm from "@/components/budget/approval/RevisionForm";
import ApprovalList from "@/components/budget/approval/ApprovalList";
import { BudgetFiltersState } from "@/pages/budget/BudgetDashboard";

const BudgetApprovals = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [filters, setFilters] = useState<BudgetFiltersState>({
    year: currentYear,
    periodView: "yearly",
    company: "all",
    department: "all",
    project: "all",
    currency: "TRY",
  });

  const [showRevisionForm, setShowRevisionForm] = useState(false);

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/budget")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri
          </Button>
          <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white shadow-lg">
            <FileText className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Bütçe Onayları
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Revizyon talepleri ve çok seviyeli onay süreci
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowRevisionForm(true)}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Yeni Revizyon Talebi
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <BudgetFilters filters={filters} onFiltersChange={setFilters} />
      </Card>

      {/* Approval List */}
      <Card className="p-0 overflow-hidden">
        <ApprovalList filters={filters} />
      </Card>

      {/* Revision Form Modal */}
      {showRevisionForm && (
        <RevisionForm
          open={showRevisionForm}
          onOpenChange={setShowRevisionForm}
          filters={filters}
        />
      )}
    </div>
  );
};

export default BudgetApprovals;

