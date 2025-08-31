
import { Link, useLocation } from "react-router-dom";
import { X, Home, User, CreditCard, FileText, Calendar, MessageSquare, HelpCircle, Settings, Globe, Building, Users, Bell, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const DashboardSidebar = ({ isOpen, onClose }: DashboardSidebarProps) => {
  const location = useLocation();
  const { isAdmin, loading } = useAuth();

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/dashboard/perfil-completo", label: "Meu Perfil", icon: User },
    { path: "/dashboard/carteira-digital", label: "Identificação Eclesiástica", icon: CreditCard },
    { path: "/dashboard/financeiro", label: "Financeiro", icon: FileText },
    { path: "/dashboard/certidoes", label: "Certidões", icon: FileText },
    { path: "/dashboard/regularizacao", label: "Regularização", icon: Building },
    { path: "/dashboard/eventos", label: "Eventos", icon: Calendar },
    { path: "/dashboard/afiliados", label: "Afiliados", icon: Users },
    { path: "/dashboard/comunicacao", label: "Comunicação", icon: MessageSquare },
    { path: "/dashboard/notifications", label: "Notificações", icon: Bell },
    { path: "/dashboard/suporte", label: "Suporte", icon: HelpCircle },
  ];

  const adminMenuItems = [
    { path: "/dashboard/admin/usuarios", label: "Gerenciar Usuários", icon: Users },
    { path: "/dashboard/admin/member-types", label: "Tipos de Membro", icon: Settings },
    { path: "/dashboard/admin/subscriptions", label: "Assinaturas", icon: CreditCard },
    { path: "/dashboard/admin/diagnostics", label: "Diagnóstico do Sistema", icon: Activity },
    { path: "/dashboard/admin/suporte", label: "Atendimento ao Membro", icon: MessageSquare },
    { path: "/dashboard/admin/content", label: "Gerenciar Conteúdo", icon: FileText },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-comademig-blue shadow-lg z-50 transform transition-transform duration-300 flex flex-col
        lg:relative lg:translate-x-0 lg:z-auto lg:flex lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-blue-600 flex items-center justify-between flex-shrink-0">
          <img 
            src="/lovable-uploads/3b224a34-6b1d-42ce-9831-77c118c82d27.png" 
            alt="COMADEMIG" 
            className="h-8 w-auto"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-white hover:bg-blue-600"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Menu Items - Scrollable area */}
        <nav className="flex-1 p-3 lg:p-4 space-y-1 lg:space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`
                flex items-center space-x-3 p-2 lg:p-3 rounded-lg transition-colors duration-200 text-sm font-medium
                ${isActive(item.path) 
                  ? 'bg-comademig-gold text-comademig-blue' 
                  : 'text-white hover:bg-blue-600'
                }
              `}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}

          {/* Admin Section - Visível apenas para administradores */}
          {!loading && isAdmin() && (
            <div className="mt-6 pt-4 border-t border-blue-600">
              <div className="text-xs font-semibold text-blue-200 mb-2 px-3">
                ADMINISTRAÇÃO
              </div>
              {adminMenuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center space-x-3 p-2 lg:p-3 rounded-lg transition-colors duration-200 text-sm font-medium
                    ${isActive(item.path) 
                      ? 'bg-comademig-gold text-comademig-blue' 
                      : 'text-white hover:bg-blue-600'
                    }
                  `}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* Bottom Section - Fixed at bottom */}
        <div className="p-3 lg:p-4 space-y-2 lg:space-y-3 border-t border-blue-600 flex-shrink-0">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center space-x-3 p-2 lg:p-3 text-white hover:bg-blue-600 rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            <Globe size={18} />
            <span>Voltar ao Site</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default DashboardSidebar;
