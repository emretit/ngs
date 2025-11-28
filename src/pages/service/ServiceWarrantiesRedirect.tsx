import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ServiceWarrantiesRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/service/asset-management', { replace: true });
  }, [navigate]);

  return null;
}
