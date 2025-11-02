import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, Clock, XCircle, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import StatusBadge from "@/components/common/StatusBadge";

interface ApprovalStep {
  id: string;
  step: number;
  approver: {
    id: string;
    name: string;
    email?: string;
  };
  status: "pending" | "approved" | "rejected" | "skipped";
  decided_at?: string;
  comment?: string;
}

interface ApprovalTimelineProps {
  approvals: ApprovalStep[];
  currentStatus: string;
  documentType?: string;
  documentNumber?: string;
}

const ApprovalTimeline: React.FC<ApprovalTimelineProps> = ({
  approvals,
  currentStatus,
  documentType = "Doküman",
  documentNumber,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "skipped":
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 border-green-300";
      case "rejected":
        return "bg-red-100 border-red-300";
      case "pending":
        return "bg-yellow-100 border-yellow-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const sortedApprovals = [...approvals].sort((a, b) => a.step - b.step);

  return (
    <Card>
      <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            Onay Süreci
          </CardTitle>
          <div className="flex items-center gap-2">
            {documentNumber && (
              <Badge variant="outline" className="font-mono">
                {documentNumber}
              </Badge>
            )}
            <StatusBadge status={currentStatus} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {sortedApprovals.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-muted-foreground">
              Bu doküman için henüz onay süreci başlatılmamış
            </p>
          </div>
        ) : (
          <div className="relative space-y-6">
            {/* Timeline Line */}
            <div className="absolute left-[23px] top-8 bottom-8 w-0.5 bg-gray-200"></div>

            {sortedApprovals.map((approval, index) => {
              const isLast = index === sortedApprovals.length - 1;
              const isPending = approval.status === "pending";
              const isApproved = approval.status === "approved";
              const isRejected = approval.status === "rejected";

              return (
                <div key={approval.id} className="relative flex gap-4">
                  {/* Timeline Icon */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${getStatusColor(
                        approval.status
                      )}`}
                    >
                      {getStatusIcon(approval.status)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isPending
                          ? "border-yellow-300 bg-yellow-50 shadow-lg"
                          : isApproved
                          ? "border-green-300 bg-green-50"
                          : isRejected
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      {/* Step Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-xs font-semibold">
                              {getInitials(approval.approver.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-sm">
                              {approval.approver.name}
                            </div>
                            {approval.approver.email && (
                              <div className="text-xs text-muted-foreground">
                                {approval.approver.email}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            isPending
                              ? "bg-yellow-100 text-yellow-800"
                              : isApproved
                              ? "bg-green-100 text-green-800"
                              : isRejected
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100"
                          }`}
                        >
                          {approval.step}. Seviye
                        </Badge>
                      </div>

                      {/* Status Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          {isApproved && (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-700">Onaylandı</span>
                              {approval.decided_at && (
                                <span className="text-muted-foreground text-xs">
                                  • {format(new Date(approval.decided_at), "dd MMM yyyy, HH:mm", { locale: tr })}
                                </span>
                              )}
                            </>
                          )}
                          {isRejected && (
                            <>
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="font-medium text-red-700">Reddedildi</span>
                              {approval.decided_at && (
                                <span className="text-muted-foreground text-xs">
                                  • {format(new Date(approval.decided_at), "dd MMM yyyy, HH:mm", { locale: tr })}
                                </span>
                              )}
                            </>
                          )}
                          {isPending && (
                            <>
                              <Clock className="h-4 w-4 text-yellow-600 animate-pulse" />
                              <span className="font-medium text-yellow-700">Onay bekleniyor</span>
                            </>
                          )}
                          {approval.status === "skipped" && (
                            <>
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-600">Atlandı</span>
                            </>
                          )}
                        </div>

                        {/* Comment */}
                        {approval.comment && (
                          <div className="mt-2 p-2 bg-white rounded border text-sm">
                            <div className="text-xs text-muted-foreground mb-1">Yorum:</div>
                            <div className="text-gray-700">{approval.comment}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {sortedApprovals.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-700">
                  {sortedApprovals.length}
                </div>
                <div className="text-xs text-muted-foreground">Toplam Seviye</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {sortedApprovals.filter((a) => a.status === "approved").length}
                </div>
                <div className="text-xs text-muted-foreground">Onaylanan</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {sortedApprovals.filter((a) => a.status === "pending").length}
                </div>
                <div className="text-xs text-muted-foreground">Bekleyen</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {sortedApprovals.filter((a) => a.status === "rejected").length}
                </div>
                <div className="text-xs text-muted-foreground">Reddedilen</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApprovalTimeline;
