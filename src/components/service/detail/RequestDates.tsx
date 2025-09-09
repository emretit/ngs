
import React from "react";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface RequestDatesProps {
  createdAt?: string;
  dueDate?: string;
}

export const RequestDates: React.FC<RequestDatesProps> = ({ createdAt, dueDate }) => {
  return (
    <div className="bg-muted/20 p-3 rounded-lg space-y-2">
      <div className="flex items-center space-x-2 text-muted-foreground text-sm">
        <Calendar className="h-3 w-3" />
        <span>Oluşturulma Tarihi: {createdAt && format(new Date(createdAt), 'dd MMM yyyy', { locale: tr })}</span>
      </div>
      {dueDate && (
        <div className="flex items-center space-x-2 text-muted-foreground text-sm">
          <Calendar className="h-3 w-3" />
          <span>Tercih Edilen Tarih: {format(new Date(dueDate), 'dd MMM yyyy', { locale: tr })}</span>
        </div>
      )}
    </div>
  );
};
