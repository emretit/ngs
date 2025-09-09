
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CustomerFormHeaderProps {
  id?: string;
}

const CustomerFormHeader = ({ id }: CustomerFormHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4 mb-8">
      <button
        onClick={() => navigate('/contacts')}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div>
        <h1 className="text-3xl font-bold">{id ? "Müşteriyi Düzenle" : "Yeni Müşteri"}</h1>
        <p className="text-gray-600 mt-1">
          {id ? "Müşteri bilgilerini güncelleyin" : "Yeni müşteri ekleyin"}
        </p>
      </div>
    </div>
  );
};

export default CustomerFormHeader;
