
import { Link, useLocation } from "react-router-dom";
import { X, Home, User, CreditCard, FileText, Calendar, MessageSquare, HelpCircle, Settings, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const DashboardSidebar = ({ isOpen, onClose }: DashboardSidebarProps) => {
  const location = useLocation();

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/dashboard/meus-dados", label: "Meus Dados", icon: User },
    { path: "/dashboard/carteira-digital", label: "Carteira Digital", icon: CreditCard },
    { path: "/dashboard/financeiro", label: "Financeiro", icon: FileText },
    { path: "/dashboard/certidoes", label: "Certidões", icon: FileText },
    { path: "/dashboard/eventos", label: "Eventos", icon: Calendar },
    { path: "/dashboard/comunicacao", label: "Comunicação", icon: MessageSquare },
    { path: "/dashboard/suporte", label: "Suporte", icon: HelpCircle },
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
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-blue-600 flex items-center justify-between flex-shrink-0">
          <img 
            src="/lovable-uploads/efd9af7f-fef5-4cd0-b54d-d9f55a002a3b.png" 
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
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`
                flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 text-sm font-medium
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
        </nav>

        {/* Bottom Section - Fixed at bottom */}
        <div className="p-4 space-y-3 border-t border-blue-600 flex-shrink-0">
          <Link
            to="/dashboard/perfil"
            onClick={onClose}
            className={`
              flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 text-sm font-medium
              ${isActive("/dashboard/perfil") 
                ? 'bg-comademig-gold text-comademig-blue' 
                : 'text-white hover:bg-blue-600'
              }
            `}
          >
            <Settings size={18} />
            <span>Perfil</span>
          </Link>
          
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center space-x-3 p-3 text-white hover:bg-blue-600 rounded-lg transition-colors duration-200 text-sm font-medium"
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
