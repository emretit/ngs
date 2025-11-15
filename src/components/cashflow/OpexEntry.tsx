import OpexMatrix from "./OpexMatrix";
import { Card } from "@/components/ui/card";

const OpexEntry = () => {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50 overflow-hidden">
        <OpexMatrix />
      </Card>
    </div>
  );
};

export default OpexEntry;