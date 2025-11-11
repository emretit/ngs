import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BudgetFiltersState } from "@/pages/BudgetManagement";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RevisionRequest {
  id: string;
  requester: string;
  item: string;
  oldBudget: number;
  newRequestedAmount: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  approvalLevel: number;
  maxApprovalLevel: number;
  approvers: { name: string; level: number; status: "pending" | "approved" | "rejected" }[];
}

interface RevisionRequestsTabProps {
  filters: BudgetFiltersState;
}

const RevisionRequestsTab = ({ filters }: RevisionRequestsTabProps) => {
  // Mock data
  const revisionData: RevisionRequest[] = [
    {
      id: "1",
      requester: "Ahmet Yılmaz",
      item: "Pazarlama Masrafları",
      oldBudget: 800000,
      newRequestedAmount: 1000000,
      reason: "Yeni kampanya için ek bütçe gerekiyor",
      status: "Pending",
      approvalLevel: 1,
      maxApprovalLevel: 3,
      approvers: [
        { name: "Mehmet Özkan", level: 1, status: "approved" },
        { name: "Ayşe Yıldız", level: 2, status: "pending" },
        { name: "Fatma Demir", level: 3, status: "pending" },
      ],
    },
    {
      id: "2",
      requester: "Ayşe Demir",
      item: "Personel Masrafları",
      oldBudget: 2000000,
      newRequestedAmount: 2200000,
      reason: "Yeni personel alımı için bütçe artışı",
      status: "Approved",
      approvalLevel: 3,
      maxApprovalLevel: 3,
      approvers: [
        { name: "Mehmet Özkan", level: 1, status: "approved" },
        { name: "Ayşe Yıldız", level: 2, status: "approved" },
        { name: "Fatma Demir", level: 3, status: "approved" },
      ],
    },
    {
      id: "3",
      requester: "Mehmet Kaya",
      item: "Ulaşım Masrafları",
      oldBudget: 400000,
      newRequestedAmount: 500000,
      reason: "Yakıt fiyat artışı nedeniyle",
      status: "Rejected",
      approvalLevel: 1,
      maxApprovalLevel: 3,
      approvers: [
        { name: "Mehmet Özkan", level: 1, status: "rejected" },
        { name: "Ayşe Yıldız", level: 2, status: "pending" },
        { name: "Fatma Demir", level: 3, status: "pending" },
      ],
    },
  ];

  const getCurrencySymbol = () => {
    switch (filters.currency) {
      case "USD":
        return "$";
      case "EUR":
        return "€";
      default:
        return "₺";
    }
  };

  const formatAmount = (amount: number) => {
    const symbol = getCurrencySymbol();
    return `${symbol}${amount.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Approved":
        return "bg-green-100 text-green-700";
      case "Rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Pending":
        return "Beklemede";
      case "Approved":
        return "Onaylandı";
      case "Rejected":
        return "Reddedildi";
      default:
        return status;
    }
  };

  const getApprovalStatus = (item: RevisionRequest) => {
    return `${item.approvalLevel}/${item.maxApprovalLevel} Onay`;
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="h-8">
              <TableHead className="text-xs font-semibold h-8 py-2">İsteyen</TableHead>
              <TableHead className="text-xs font-semibold h-8 py-2">Kalem</TableHead>
              <TableHead className="text-xs font-semibold text-right h-8 py-2">Eski Bütçe</TableHead>
              <TableHead className="text-xs font-semibold text-right h-8 py-2">Yeni İstenen Tutar</TableHead>
              <TableHead className="text-xs font-semibold h-8 py-2">Gerekçe</TableHead>
              <TableHead className="text-xs font-semibold h-8 py-2">Onay Durumu</TableHead>
              <TableHead className="text-xs font-semibold h-8 py-2">Durum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revisionData.map((item) => (
              <TableRow key={item.id} className="h-8">
                <TableCell className="text-sm py-2">{item.requester}</TableCell>
                <TableCell className="font-medium text-sm py-2">{item.item}</TableCell>
                <TableCell className="text-right text-sm py-2">{formatAmount(item.oldBudget)}</TableCell>
                <TableCell className="text-right text-sm font-medium py-2">
                  {formatAmount(item.newRequestedAmount)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground line-clamp-1 py-2">
                  {item.reason}
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{getApprovalStatus(item)}</span>
                    <div className="flex gap-1">
                      {item.approvers.map((approver, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "h-2 w-2 rounded-full",
                            approver.status === "approved"
                              ? "bg-green-500"
                              : approver.status === "rejected"
                              ? "bg-red-500"
                              : "bg-gray-300"
                          )}
                          title={`${approver.name} - Seviye ${approver.level}`}
                        />
                      ))}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Onay İş Akışı Detayları */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Onay İş Akışı Detayları</h3>
        {revisionData.map((item) => (
          <div key={item.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.item}</span>
              <span className={`text-xs px-2 py-1 rounded ${getStatusColor(item.status)}`}>
                {getStatusLabel(item.status)}
              </span>
            </div>
            <div className="space-y-1">
              {item.approvers.map((approver, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  {approver.status === "approved" ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : approver.status === "rejected" ? (
                    <XCircle className="h-3 w-3 text-red-600" />
                  ) : (
                    <Clock className="h-3 w-3 text-gray-400" />
                  )}
                  <span className="text-muted-foreground">Seviye {approver.level}:</span>
                  <span className="font-medium">{approver.name}</span>
                  <span className={cn(
                    "ml-auto text-xs",
                    approver.status === "approved" ? "text-green-600" : 
                    approver.status === "rejected" ? "text-red-600" : 
                    "text-gray-500"
                  )}>
                    {approver.status === "approved" ? "Onaylandı" : 
                     approver.status === "rejected" ? "Reddedildi" : 
                     "Bekliyor"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevisionRequestsTab;

