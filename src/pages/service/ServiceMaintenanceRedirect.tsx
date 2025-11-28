import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ServiceMaintenanceRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/service/management?view=maintenance', { replace: true });
  }, [navigate]);

  return null;
}
