
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SupplierFormHeaderProps {
  id?: string;
}

const SupplierFormHeader = ({ id }: SupplierFormHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4 mb-8">
      <button
        onClick={() => navigate('/suppliers')}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div>
        <h1 className="text-3xl font-bold">{id ? "Tedarikçiyi Düzenle" : "Yeni Tedarikçi"}</h1>
        <p className="text-gray-600 mt-1">
          {id ? "Tedarikçi bilgilerini güncelleyin" : "Yeni tedarikçi ekleyin"}
        </p>
      </div>
    </div>
  );
};

export default SupplierFormHeader;
