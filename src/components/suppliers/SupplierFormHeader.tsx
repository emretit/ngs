
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SupplierFormHeaderProps {
  id?: string;
}

const SupplierFormHeader = ({ id }: SupplierFormHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 mb-4">
      <button
        onClick={() => navigate('/suppliers')}
        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div>
        <h1 className="text-xl font-semibold">{id ? "Tedarikçiyi Düzenle" : "Yeni Tedarikçi"}</h1>
        <p className="text-sm text-gray-600">
          {id ? "Tedarikçi bilgilerini güncelleyin" : "Yeni tedarikçi ekleyin"}
        </p>
      </div>
    </div>
  );
};

export default SupplierFormHeader;
