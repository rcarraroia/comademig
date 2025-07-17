
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { path: "/", label: "Home" },
    { path: "/sobre", label: "Sobre a COMADEMIG" },
    { path: "/lideranca", label: "Liderança" },
    { path: "/eventos", label: "Eventos" },
    { path: "/noticias", label: "Notícias" },
    { path: "/multimidia", label: "Multimídia" },
    { path: "/contato", label: "Contato" }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/f2b96d9c-c99b-46b0-b500-eb38e23058fe.png" 
              alt="COMADEMIG Logo" 
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`font-inter font-medium transition-colors duration-200 ${
                  isActive(item.path)
                    ? "text-comademig-blue border-b-2 border-comademig-gold"
                    : "text-gray-700 hover:text-comademig-blue"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <Button className="bg-comademig-gold hover:bg-comademig-gold/90 text-white font-montserrat font-semibold">
              Doe Agora
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4 pt-4">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`font-inter font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? "text-comademig-blue"
                      : "text-gray-700 hover:text-comademig-blue"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Button className="bg-comademig-gold hover:bg-comademig-gold/90 text-white font-montserrat font-semibold w-full">
                Doe Agora
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
