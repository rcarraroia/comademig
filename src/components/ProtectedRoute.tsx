
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRedirect } from '@/hooks/useRedirect';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const { canAccessRoute } = useRedirect();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-comademig-blue"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Usar serviço centralizado para verificar acesso
  // O redirecionamento será feito pelo useRedirect hook automaticamente
  if (!canAccessRoute(location.pathname)) {
    // Se não pode acessar, o useRedirect já fará o redirecionamento
    // Retornar loading enquanto redireciona
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-comademig-blue"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
};

export default ProtectedRoute;
