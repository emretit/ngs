import React, { useState } from "react";
import { useExpenseRequests } from "@/hooks/useExpenseRequests";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, Download } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ExpenseStatus, ExpenseCategory } from "@/types/expense";
import { HierarchicalApprovalTimeline } from "@/components/approvals/HierarchicalApprovalTimeline";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const ExpenseRequestList: React.FC = () => {
  const { expenses, isLoading } = useExpenseRequests();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | "all">("all");
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null);

  const getStatusBadge = (status: ExpenseStatus) => {
    const variants: Record<ExpenseStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "outline", label: "Taslak" },
      submitted: { variant: "secondary", label: "Onay Bekliyor" },
      approved: { variant: "default", label: "Onaylandı" },
      rejected: { variant: "destructive", label: "Reddedildi" },
      paid: { variant: "default", label: "Ödendi" },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryLabel = (category: ExpenseCategory) => {
    const labels: Record<ExpenseCategory, string> = {
      travel: "Seyahat",
      meals: "Yemek",
      supplies: "Malzeme",
      other: "Diğer",
    };
    return labels[category];
  };

  const filteredExpenses = expenses?.filter((expense) => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.request_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || expense.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return <div className="text-center py-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Açıklama veya numara ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="draft">Taslak</SelectItem>
            <SelectItem value="submitted">Onay Bekliyor</SelectItem>
            <SelectItem value="approved">Onaylandı</SelectItem>
            <SelectItem value="rejected">Reddedildi</SelectItem>
            <SelectItem value="paid">Ödendi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numara</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Harcama talebi bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-mono text-xs">
                    {expense.request_number}
                  </TableCell>
                  <TableCell>
                    {format(new Date(expense.expense_date), "dd MMM yyyy", { locale: tr })}
                  </TableCell>
                  <TableCell>{getCategoryLabel(expense.category)}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {expense.description}
                  </TableCell>
                  <TableCell>
                    {expense.amount.toLocaleString("tr-TR", {
                      style: "currency",
                      currency: expense.currency,
                    })}
                  </TableCell>
                  <TableCell>{getStatusBadge(expense.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedExpense(expense.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {expense.receipt_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(expense.receipt_url!, "_blank")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedExpense} onOpenChange={(open) => !open && setSelectedExpense(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Harcama Talebi Detayı</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              {(() => {
                const expense = expenses?.find((e) => e.id === selectedExpense);
                if (!expense) return null;

                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Numara</label>
                        <p className="font-mono">{expense.request_number}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Tarih</label>
                        <p>{format(new Date(expense.expense_date), "dd MMM yyyy", { locale: tr })}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Kategori</label>
                        <p>{getCategoryLabel(expense.category)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Tutar</label>
                        <p className="font-semibold">
                          {expense.amount.toLocaleString("tr-TR", {
                            style: "currency",
                            currency: expense.currency,
                          })}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">Açıklama</label>
                        <p>{expense.description}</p>
                      </div>
                      {expense.notes && (
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-muted-foreground">Notlar</label>
                          <p>{expense.notes}</p>
                        </div>
                      )}
                    </div>

                    <HierarchicalApprovalTimeline
                      objectType="expense_request"
                      objectId={expense.id}
                    />
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

