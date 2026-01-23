
import { ReactNode, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRedirect } from '@/hooks/useRedirect';
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, loading } = useAuth();
  
  // O useRedirect hook gerencia automaticamente os redirecionamentos
  // Não precisamos mais de lógica manual aqui
  useRedirect();

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
