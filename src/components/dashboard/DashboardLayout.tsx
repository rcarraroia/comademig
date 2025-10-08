
import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  // Redirecionar admin para painel administrativo
  useEffect(() => {
    console.log('🏠 DashboardLayout - Verificando tipo de usuário:', {
      hasProfile: !!profile,
      loading,
      tipoMembro: profile?.tipo_membro,
      nome: profile?.nome_completo
    });

    if (!loading && profile && profile.tipo_membro === 'admin') {
      console.log('🔐 Admin detectado no DashboardLayout! Redirecionando para /admin/users');
      navigate('/admin/users', { replace: true });
    }
  }, [profile, loading, navigate]);

  return (
    <div className="min-h-screen bg-comademig-gray flex">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader onMenuToggle={() => setSidebarOpen(true)} />
        
        <main className="flex-1 p-4 lg:p-6 xl:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
