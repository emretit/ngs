import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ServiceContractsRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Eski /service/contracts linkini yeni /contracts/service'e yönlendir
    navigate('/contracts/service', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

