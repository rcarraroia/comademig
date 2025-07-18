
import { Menu, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

const DashboardHeader = ({ onMenuClick }: DashboardHeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center justify-between shadow-sm">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu size={20} />
        </Button>
        
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-comademig-blue">
            Portal COMADEMIG
          </h1>
          <p className="text-sm text-gray-600 hidden sm:block">
            Bem-vindo, Pastor João Silva
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-3 lg:space-x-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            3
          </span>
        </Button>

        {/* User Profile */}
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
            <AvatarImage src="/placeholder-avatar.jpg" />
            <AvatarFallback className="bg-comademig-blue text-white text-sm">JS</AvatarFallback>
          </Avatar>
          
          <Button variant="ghost" size="icon">
            <LogOut size={20} />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
