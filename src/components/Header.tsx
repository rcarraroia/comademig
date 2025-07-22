
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navLinks = [
    { to: "/", label: "Início" },
    { to: "/sobre", label: "Sobre" },
    { to: "/lideranca", label: "Liderança" },
    { to: "/noticias", label: "Notícias" },
    { to: "/eventos", label: "Eventos" },
    { to: "/multimidia", label: "Multimídia" },
    { to: "/contato", label: "Contato" },
  ];

  return (
    <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-comademig-blue rounded-full flex items-center justify-center">
              <span className="text-white font-montserrat font-bold text-lg">C</span>
            </div>
            <div className="flex flex-col">
              <span className="font-montserrat font-bold text-comademig-blue text-xl">
                COMADEMIG
              </span>
              <span className="font-inter text-sm text-gray-600 -mt-1">
                Convenção Mineira das Assembleias de Deus
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="font-inter text-gray-700 hover:text-comademig-blue transition-colors duration-200 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-comademig-blue transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <User size={16} />
                    <span className="max-w-32 truncate">
                      {profile?.nome_completo || user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <Settings size={16} className="mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dashboard/perfil")}>
                    <User size={16} className="mr-2" />
                    Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut size={16} className="mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="font-inter border-comademig-blue text-comademig-blue hover:bg-comademig-blue hover:text-white"
                  onClick={() => navigate("/auth")}
                >
                  Entrar
                </Button>
                <Button 
                  className="font-inter bg-comademig-gold hover:bg-comademig-gold/90 text-white"
                  onClick={() => navigate("/filiacao")}
                >
                  Filiar-se
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="font-inter text-gray-700 hover:text-comademig-blue transition-colors duration-200 px-4 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <div className="px-4 py-2 space-y-2">
                  <p className="font-inter text-sm text-gray-600 mb-2">
                    {profile?.nome_completo || user.email}
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full mb-2"
                    onClick={() => {
                      navigate("/dashboard");
                      setIsMenuOpen(false);
                    }}
                  >
                    Dashboard
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full text-red-600 border-red-600"
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                  >
                    Sair
                  </Button>
                </div>
              ) : (
                <div className="px-4 py-2 space-y-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full border-comademig-blue text-comademig-blue"
                    onClick={() => {
                      navigate("/auth");
                      setIsMenuOpen(false);
                    }}
                  >
                    Entrar
                  </Button>
                  <Button 
                    size="sm"
                    className="w-full bg-comademig-gold hover:bg-comademig-gold/90 text-white"
                    onClick={() => {
                      navigate("/filiacao");
                      setIsMenuOpen(false);
                    }}
                  >
                    Filiar-se
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
