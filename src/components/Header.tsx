
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img 
              src="/lovable-uploads/efd9af7f-fef5-4cd0-b54d-d9f55a002a3b.png" 
              alt="COMADEMIG" 
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-comademig-blue font-medium transition-colors">
              Home
            </Link>
            <Link to="/sobre" className="text-gray-700 hover:text-comademig-blue font-medium transition-colors">
              Sobre
            </Link>
            <Link to="/lideranca" className="text-gray-700 hover:text-comademig-blue font-medium transition-colors">
              Liderança
            </Link>
            <Link to="/eventos" className="text-gray-700 hover:text-comademig-blue font-medium transition-colors">
              Eventos
            </Link>
            <Link to="/noticias" className="text-gray-700 hover:text-comademig-blue font-medium transition-colors">
              Notícias
            </Link>
            <Link to="/multimidia" className="text-gray-700 hover:text-comademig-blue font-medium transition-colors">
              Multimídia
            </Link>
            <Link to="/contato" className="text-gray-700 hover:text-comademig-blue font-medium transition-colors">
              Contato
            </Link>
            <Link to="/filiacao" className="text-gray-700 hover:text-comademig-blue font-medium transition-colors">
              Filie-se
            </Link>
            <Button asChild className="bg-comademig-blue hover:bg-comademig-blue/90 text-white">
              <Link to="/dashboard">
                <User size={16} className="mr-2" />
                Portal
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 rounded-md text-gray-700 hover:text-comademig-blue hover:bg-gray-100"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4 pt-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-comademig-blue font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/sobre"
                className="text-gray-700 hover:text-comademig-blue font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Sobre
              </Link>
              <Link
                to="/lideranca"
                className="text-gray-700 hover:text-comademig-blue font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Liderança
              </Link>
              <Link
                to="/eventos"
                className="text-gray-700 hover:text-comademig-blue font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Eventos
              </Link>
              <Link
                to="/noticias"
                className="text-gray-700 hover:text-comademig-blue font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Notícias
              </Link>
              <Link
                to="/multimidia"
                className="text-gray-700 hover:text-comademig-blue font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Multimídia
              </Link>
              <Link
                to="/contato"
                className="text-gray-700 hover:text-comademig-blue font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contato
              </Link>
              <Link
                to="/filiacao"
                className="text-gray-700 hover:text-comademig-blue font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Filie-se
              </Link>
              <Button asChild className="bg-comademig-blue hover:bg-comademig-blue/90 text-white w-fit">
                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                  <User size={16} className="mr-2" />
                  Portal
                </Link>
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
