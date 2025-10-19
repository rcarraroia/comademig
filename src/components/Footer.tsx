import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, MapPin, Phone, Mail } from "lucide-react";
import { useContactContent } from "@/hooks/useContent";

const Footer = () => {
  const { content: contactContent } = useContactContent();
  
  // Conteúdo padrão inline para garantir que o Footer sempre renderize
  const defaultContactContent = {
    endereco: {
      rua: 'Rua das Assembleias, 123',
      cidade: 'Belo Horizonte',
      estado: 'MG',
      cep: '30000-000',
      complemento: ''
    },
    telefones: [{ id: '1', tipo: 'Principal', numero: '(31) 3333-4444', ordem: 1 }],
    emails: [{ id: '1', tipo: 'Geral', email: 'contato@comademig.org.br', ordem: 1 }],
    redes_sociais: {
      facebook: 'https://facebook.com/comademig',
      instagram: 'https://instagram.com/comademig',
      youtube: 'https://youtube.com/comademig'
    }
  };
  
  // Usar conteúdo carregado ou padrão
  const safeContactContent = contactContent || defaultContactContent;
  
  return (
    <footer className="bg-comademig-blue text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo e Descrição */}
          <div className="space-y-4">
            <img 
              src="/lovable-uploads/cc23f58f-2f47-4114-9910-081739a7ea69.png" 
              alt="COMADEMIG Logo" 
              className="h-16 w-auto" 
            />
            <p className="font-inter leading-relaxed text-sm text-slate-100">
              Convenção de Ministros das Assembleias de Deus em Minas Gerais.
              <br />
              Fortalecendo o Reino de Deus através da unidade ministerial.
            </p>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="font-montserrat font-semibold text-comademig-gold mb-4">
              Links Rápidos
            </h3>
            <ul className="space-y-2 font-inter text-sm">
              <li>
                <Link 
                  to="/sobre" 
                  className="text-gray-300 hover:text-comademig-gold transition-colors flex items-center"
                >
                  Sobre a COMADEMIG
                </Link>
              </li>
              <li>
                <Link 
                  to="/lideranca" 
                  className="text-gray-300 hover:text-comademig-gold transition-colors flex items-center"
                >
                  Liderança
                </Link>
              </li>

              <li>
                <Link 
                  to="/noticias" 
                  className="text-gray-300 hover:text-comademig-gold transition-colors flex items-center"
                >
                  Notícias
                </Link>
              </li>
              <li>
                <Link 
                  to="/multimidia" 
                  className="text-gray-300 hover:text-comademig-gold transition-colors flex items-center"
                >
                  Multimídia
                </Link>
              </li>
              <li>
                <Link 
                  to="/filiacao" 
                  className="text-gray-300 hover:text-comademig-gold transition-colors flex items-center"
                >
                  Filiação
                </Link>
              </li>
            </ul>
          </div>

          {/* Serviços */}
          <div>
            <h3 className="font-montserrat font-semibold text-comademig-gold mb-4">
              Serviços
            </h3>
            <ul className="space-y-2 font-inter text-sm">
              <li>
                <Link 
                  to="/auth" 
                  className="text-gray-300 hover:text-comademig-gold transition-colors flex items-center"
                >
                  Portal do Membro
                </Link>
              </li>
              <li>
                <span className="text-gray-300">Carteira Digital</span>
              </li>
              <li>
                <span className="text-gray-300">Certidões</span>
              </li>
              <li>
                <span className="text-gray-300">Eventos e Congressos</span>
              </li>
              <li>
                <Link 
                  to="/contato" 
                  className="text-gray-300 hover:text-comademig-gold transition-colors flex items-center"
                >
                  Suporte
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato e Redes Sociais */}
          <div>
            <h3 className="font-montserrat font-semibold text-comademig-gold mb-4">
              Contato
            </h3>
            <div className="space-y-3 font-inter text-sm mb-6">
              <div className="flex items-start space-x-2 text-gray-300">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                <span>
                  {safeContactContent.endereco.rua}
                  {safeContactContent.endereco.complemento && `, ${safeContactContent.endereco.complemento}`}
                  <br />
                  {safeContactContent.endereco.cidade} - {safeContactContent.endereco.estado}
                  <br />
                  CEP: {safeContactContent.endereco.cep}
                </span>
              </div>
              {safeContactContent.telefones && safeContactContent.telefones.length > 0 && (
                <div className="flex items-center space-x-2 text-gray-300">
                  <Phone size={16} />
                  <a 
                    href={`tel:${safeContactContent.telefones[0].numero.replace(/\D/g, '')}`} 
                    className="hover:text-comademig-gold transition-colors"
                  >
                    {safeContactContent.telefones[0].numero}
                  </a>
                </div>
              )}
              {safeContactContent.emails && safeContactContent.emails.length > 0 && (
                <div className="flex items-center space-x-2 text-gray-300">
                  <Mail size={16} />
                  <a 
                    href={`mailto:${safeContactContent.emails[0].email}`} 
                    className="hover:text-comademig-gold transition-colors"
                  >
                    {safeContactContent.emails[0].email}
                  </a>
                </div>
              )}
            </div>

            {/* Redes Sociais */}
            <div>
              <h4 className="font-montserrat font-semibold text-comademig-gold mb-3 text-sm">
                Redes Sociais
              </h4>
              <div className="flex space-x-3">
                {safeContactContent.redes_sociais?.facebook && (
                  <a 
                    href={safeContactContent.redes_sociais.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-comademig-gold transition-colors p-2 rounded-full hover:bg-white/10"
                    aria-label="Facebook"
                  >
                    <Facebook size={20} />
                  </a>
                )}
                {safeContactContent.redes_sociais?.instagram && (
                  <a 
                    href={safeContactContent.redes_sociais.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-comademig-gold transition-colors p-2 rounded-full hover:bg-white/10"
                    aria-label="Instagram"
                  >
                    <Instagram size={20} />
                  </a>
                )}
                {safeContactContent.redes_sociais?.youtube && (
                  <a 
                    href={safeContactContent.redes_sociais.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-comademig-gold transition-colors p-2 rounded-full hover:bg-white/10"
                    aria-label="YouTube"
                  >
                    <Youtube size={20} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Linha divisória e copyright */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="font-inter text-gray-300 text-sm">
              © 2024 COMADEMIG. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link to="/privacidade" className="text-gray-300 hover:text-comademig-gold transition-colors">
                Política de Privacidade
              </Link>
              <Link to="/termos" className="text-gray-300 hover:text-comademig-gold transition-colors">
                Termos de Uso
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Flutuante */}
      <a 
        href="https://wa.me/5531999999999?text=Olá! Gostaria de mais informações sobre a COMADEMIG." 
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-50 hover:scale-110"
        aria-label="Falar no WhatsApp"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.89 3.488" />
        </svg>
      </a>
    </footer>
  );
};
export default Footer;