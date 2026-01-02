import { formatCurrency } from "@/utils/formatters";

interface Check {
  id: string;
  amount: number;
  status: string;
}

interface ChecksStatusCardsProps {
  checks: Check[];
  statusConfig: {
    key: string;
    label: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    textColorDark: string;
  }[];
}

export const ChecksStatusCards = ({ checks, statusConfig }: ChecksStatusCardsProps) => {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {statusConfig.map((status) => {
        const filteredChecks = checks.filter((check) => check.status === status.key);
        const totalAmount = filteredChecks.reduce((sum, check) => sum + check.amount, 0);

        return (
          <div
            key={status.key}
            className={`${status.bgColor} border ${status.borderColor} rounded-md p-2 text-center`}
          >
            <div className={`text-xs ${status.textColor} font-medium mb-1`}>
              {status.label}
            </div>
            <div className={`text-sm font-bold ${status.textColorDark}`}>
              {filteredChecks.length}
            </div>
            <div className={`text-xs ${status.textColor} truncate`}>
              {formatCurrency(totalAmount)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

