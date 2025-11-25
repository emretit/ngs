import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ServiceRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Eski route'ları yeni route'a yönlendir
    const pathMap: { [key: string]: string } = {
      '/service/list': '/service/management',
      '/service/kanban': '/service/management',
      '/service/map': '/service/map',
      '/service/scheduling': '/service/management',
      '/service/calendar': '/service/management',
    };

    const newPath = pathMap[location.pathname];
    if (newPath) {
      navigate(newPath, { replace: true });
    } else {
      // Eğer eşleşme yoksa varsayılan olarak management sayfasına yönlendir
      navigate('/service/management', { replace: true });
    }
  }, [navigate, location.pathname]);

  return null;
}

