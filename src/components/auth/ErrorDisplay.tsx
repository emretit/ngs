
import { AlertTriangle } from "lucide-react";

interface ErrorDisplayProps {
  error: string | null;
}

export const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  if (!error) return null;
  
  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-red-800">
      <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="text-sm">{error}</div>
    </div>
  );
};
