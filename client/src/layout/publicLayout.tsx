import { Outlet, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/authContext';

const PublicLayout = () => {
  const { token } = useAuth();

  // 🔓 LOGIC: If user HAS a token, send them to Dashboard. 
  // Otherwise, let them see the Login page (Outlet).
  return token ? <Navigate to="/dashboard" replace /> : <Outlet />;

};

export default PublicLayout;