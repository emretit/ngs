
import { TableCell, TableRow } from "@/components/ui/table";
import { Phone, Mail, Edit2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Supplier } from "@/types/supplier";
import { formatCurrency } from "@/utils/formatters";

interface SupplierTableRowProps {
  supplier: Supplier;
}

const SupplierTableRow = ({ supplier }: SupplierTableRowProps) => {
  const navigate = useNavigate();

  return (
    <TableRow 
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => navigate(`/suppliers/${supplier.id}`)}
    >
      <TableCell className="px-4 py-3 font-medium">
        {supplier.company || supplier.name}
      </TableCell>
      <TableCell className="px-4 py-3 text-gray-600">
        {supplier.name}
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex flex-col gap-1">
          {supplier.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-gray-400" />
              <span className="text-sm text-gray-600">{supplier.email}</span>
            </div>
          )}
          {supplier.mobile_phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3 text-gray-400" />
              <span className="text-sm text-gray-600">{supplier.mobile_phone}</span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className="text-sm text-gray-600 capitalize">{supplier.type}</span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            supplier.status === "aktif"
              ? "bg-green-100 text-green-800"
              : supplier.status === "pasif"
              ? "bg-gray-100 text-gray-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {supplier.status}
        </span>
      </TableCell>
      <TableCell className="px-4 py-3 text-gray-600">
        {supplier.employees 
          ? `${supplier.employees.first_name} ${supplier.employees.last_name}` 
          : '-'}
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className={`font-semibold ${supplier.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(supplier.balance)}
        </span>
      </TableCell>
      <TableCell className="px-4 py-3 text-center">
        <div className="flex items-center justify-center space-x-2">
          <button 
            className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/suppliers/${supplier.id}/edit`);
            }}
          >
            <Edit2 className="h-4 w-4 text-gray-500" />
          </button>
          <button 
            className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default SupplierTableRow;
