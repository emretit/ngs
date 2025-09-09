
import { TableCell, TableRow } from "@/components/ui/table";
import { Phone, Mail, Edit2, Trash2, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CustomerTableRowProps {
  customer: {
    id: string;
    name: string;
    email: string | null;
    mobile_phone: string | null;
    office_phone: string | null;
    company: string | null;
    type: "bireysel" | "kurumsal";
    status: "aktif" | "pasif" | "potansiyel";
    representative: string | null;
    balance: number;
    address: string | null;
  };
}

const CustomerTableRow = ({ customer }: CustomerTableRowProps) => {
  const navigate = useNavigate();

  return (
    <TableRow 
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => navigate(`/contacts/${customer.id}`)}
    >
      <TableCell className="px-4 py-3 font-medium">
        {customer.company || customer.name}
      </TableCell>
      <TableCell className="px-4 py-3 text-gray-600">
        {customer.name}
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex flex-col gap-1">
          {customer.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-gray-400" />
              <span className="text-sm text-gray-600">{customer.email}</span>
            </div>
          )}
          {customer.mobile_phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3 text-gray-400" />
              <span className="text-sm text-gray-600">{customer.mobile_phone}</span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className="text-sm text-gray-600 capitalize">{customer.type}</span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            customer.status === "aktif"
              ? "bg-green-100 text-green-800"
              : customer.status === "pasif"
              ? "bg-gray-100 text-gray-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {customer.status}
        </span>
      </TableCell>
      <TableCell className="px-4 py-3 text-gray-600">
        {customer.representative || '-'}
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className={`font-semibold ${customer.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {customer.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
        </span>
      </TableCell>
      <TableCell className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button 
            className="p-1 hover:bg-gray-100 rounded"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/contacts/${customer.id}/edit`);
            }}
          >
            <Edit2 className="h-4 w-4 text-gray-500" />
          </button>
          <button 
            className="p-1 hover:bg-gray-100 rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-4 w-4 text-gray-500" />
          </button>
          <button 
            className="p-1 hover:bg-gray-100 rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default CustomerTableRow;
