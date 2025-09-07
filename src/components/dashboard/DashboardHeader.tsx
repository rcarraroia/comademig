
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/common/UserAvatar";
import { NotificationDropdown } from "@/components/communication/NotificationDropdown";

interface DashboardHeaderProps {
  onMenuToggle: () => void;
}

export default function DashboardHeader({ onMenuToggle }: DashboardHeaderProps) {
  const { profile } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="lg:hidden"
        >
          <Menu size={20} />
        </Button>
        <h2 className="text-xl font-semibold text-comademig-blue">
          Dashboard
        </h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <NotificationDropdown />
        
        <div className="flex items-center space-x-2">
          <UserAvatar size="md" />
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              {profile?.nome_completo || "Usuário"}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {profile?.status || "Pendente"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
