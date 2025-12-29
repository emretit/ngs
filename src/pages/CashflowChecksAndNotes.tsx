import React, { useState } from "react";
import CashflowChecks from "./CashflowChecks";
import CashflowNotes from "./CashflowNotes";
import { ChecksNotesTabs } from "@/components/cashflow/ChecksNotesTabs";

const CashflowChecksAndNotes = () => {
  const [activeTab, setActiveTab] = useState("checks");

  return (
    <ChecksNotesTabs
      activeTab={activeTab}
      onTabChange={setActiveTab}
      checksContent={<CashflowChecks />}
      notesContent={<CashflowNotes />}
    />
  );
};

export default CashflowChecksAndNotes;
