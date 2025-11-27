import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Calendar, User, Tag, CreditCard, Building2, Repeat } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ExpenseItem } from "../ExpensesManager";
import { cn } from "@/lib/utils";

interface ExpenseCardProps {
  expense: ExpenseItem;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getAccountName: (type: string, id: string) => string;
}

const ExpenseCard = memo(({ 
  expense, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete,
  getAccountName 
}: ExpenseCardProps) => {
  const isCompany = expense.expense_type === 'company';
  const isPaid = expense.is_paid;

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden bg-white border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer",
        isSelected && "ring-2 ring-red-500 border-red-500"
      )}
      onClick={onEdit}
    >
      {/* Selection checkbox */}
      <div 
        className="absolute top-3 left-3 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          className="bg-white"
        />
      </div>

      {/* Recurring indicator */}
      {expense.is_recurring && (
        <div className="absolute top-3 right-3 z-10">
          <div className="p-1.5 bg-purple-100 rounded-full">
            <Repeat className="h-3 w-3 text-purple-600" />
          </div>
        </div>
      )}

      <CardContent className="p-4 pt-10">
        {/* Header: Amount and Date */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              ₺{expense.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(expense.date), 'dd MMM yyyy', { locale: tr })}</span>
            </div>
          </div>
          <Badge 
            className={cn(
              "text-xs",
              isPaid 
                ? "bg-green-100 text-green-700 hover:bg-green-100" 
                : "bg-amber-100 text-amber-700 hover:bg-amber-100"
            )}
          >
            {isPaid ? 'Ödendi' : 'Bekliyor'}
          </Badge>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2 mb-3">
          <div className={cn(
            "p-1.5 rounded-lg",
            isCompany ? "bg-blue-100" : "bg-purple-100"
          )}>
            {isCompany ? (
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
            ) : (
              <User className="h-3.5 w-3.5 text-purple-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-medium truncate max-w-[120px]">
                {expense.category?.name || 'Kategori Yok'}
              </Badge>
              {expense.subcategory && expense.subcategory.trim() !== '' && (
                <>
                  <span className="text-gray-300">/</span>
                  <span className="text-xs text-gray-600 truncate max-w-[100px]">
                    {expense.subcategory}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {isCompany ? 'Şirket Masrafı' : expense.employee ? 
                `${expense.employee.first_name} ${expense.employee.last_name}` : 
                'Çalışan Masrafı'
              }
            </p>
          </div>
        </div>

        {/* Payment Info */}
        {isPaid && expense.payment_account_type && expense.payment_account_id && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
            <CreditCard className="h-3.5 w-3.5 text-gray-500" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-600">
                {expense.payment_account_type === 'cash' ? 'Kasa' :
                 expense.payment_account_type === 'bank' ? 'Banka' :
                 expense.payment_account_type === 'credit_card' ? 'Kredi Kartı' :
                 expense.payment_account_type === 'partner' ? 'Ortak' : ''}
              </span>
              <span className="text-gray-400">•</span>
              <span className="font-medium text-gray-700 truncate max-w-[100px]">
                {getAccountName(expense.payment_account_type, expense.payment_account_id)}
              </span>
            </div>
          </div>
        )}

        {/* Description */}
        {expense.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {expense.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
          >
            <Edit className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Düzenle</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-gray-600 hover:text-red-600 hover:bg-red-50"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Sil</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

ExpenseCard.displayName = 'ExpenseCard';

export default ExpenseCard;

