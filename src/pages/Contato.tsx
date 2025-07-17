
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Youtube } from "lucide-react";

const Contato = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui seria implementada a lógica de envio do formulário
    console.log("Formulário enviado");
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-comademig-blue to-comademig-blue/90 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="font-montserrat font-bold text-4xl md:text-6xl leading-tight">
              Contato
            </h1>
            <p className="font-inter text-xl md:text-2xl text-gray-200">
              Entre em contato conosco. Estamos aqui para ajudar.
            </p>
          </div>
        </div>
      </section>

      {/* Informações de Contato */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
              Informações de Contato
            </h2>
            <p className="font-inter text-gray-600 text-lg max-w-2xl mx-auto">
              Várias formas de entrar em contato conosco
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center mb-4">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="font-montserrat text-comademig-blue">
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-inter text-gray-700">
                  Rua das Assembleias, 123<br />
                  Bairro Centro<br />
                  Belo Horizonte - MG<br />
                  CEP: 30000-000
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center mb-4">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="font-montserrat text-comademig-blue">
                  Telefone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-inter text-gray-700">
                  (31) 3333-4444<br />
                  (31) 99999-8888<br />
                  WhatsApp disponível
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="font-montserrat text-comademig-blue">
                  E-mail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-inter text-gray-700">
                  contato@comademig.org.br<br />
                  secretaria@comademig.org.br<br />
                  presidencia@comademig.org.br
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="font-montserrat text-comademig-blue">
                  Funcionamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-inter text-gray-700">
                  Segunda a Sexta<br />
                  8:00 às 17:00<br />
                  Sábados: 8:00 às 12:00
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Formulário de Contato */}
      <section className="py-16 bg-comademig-light">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
                Envie uma Mensagem
              </h2>
              <p className="font-inter text-gray-600 text-lg">
                Preencha o formulário abaixo e entraremos em contato em breve
              </p>
            </div>

            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="nome" className="block font-inter font-medium text-gray-700 mb-2">
                        Nome Completo *
                      </label>
                      <Input 
                        id="nome"
                        type="text"
                        placeholder="Seu nome completo"
                        required
                        className="font-inter"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block font-inter font-medium text-gray-700 mb-2">
                        E-mail *
                      </label>
                      <Input 
                        id="email"
                        type="email"
                        placeholder="seu.email@exemplo.com"
                        required
                        className="font-inter"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="telefone" className="block font-inter font-medium text-gray-700 mb-2">
                        Telefone
                      </label>
                      <Input 
                        id="telefone"
                        type="tel"
                        placeholder="(31) 99999-9999"
                        className="font-inter"
                      />
                    </div>
                    <div>
                      <label htmlFor="assunto" className="block font-inter font-medium text-gray-700 mb-2">
                        Assunto *
                      </label>
                      <Input 
                        id="assunto"
                        type="text"
                        placeholder="Assunto da mensagem"
                        required
                        className="font-inter"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="mensagem" className="block font-inter font-medium text-gray-700 mb-2">
                      Mensagem *
                    </label>
                    <Textarea 
                      id="mensagem"
                      placeholder="Escreva sua mensagem aqui..."
                      rows={6}
                      required
                      className="font-inter"
                    />
                  </div>

                  <div className="text-center">
                    <Button 
                      type="submit"
                      size="lg"
                      className="bg-comademig-gold hover:bg-comademig-gold/90 text-white font-montserrat font-semibold px-8"
                    >
                      Enviar Mensagem
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mapa */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
              Localização
            </h2>
            <p className="font-inter text-gray-600 text-lg">
              Visite nossa sede em Belo Horizonte
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <span className="text-gray-500 font-inter">
                      Mapa da localização da COMADEMIG
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Redes Sociais */}
      <section className="py-16 bg-comademig-blue text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-montserrat font-bold text-3xl md:text-4xl mb-4">
            Siga-nos nas Redes Sociais
          </h2>
          <p className="font-inter text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Mantenha-se conectado e acompanhe todas as novidades
          </p>
          
          <div className="flex justify-center space-x-6 mb-8">
            <a 
              href="#" 
              className="w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center hover:bg-comademig-gold/90 transition-colors"
            >
              <Facebook className="w-8 h-8 text-white" />
            </a>
            <a 
              href="#" 
              className="w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center hover:bg-comademig-gold/90 transition-colors"
            >
              <Instagram className="w-8 h-8 text-white" />
            </a>
            <a 
              href="#" 
              className="w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center hover:bg-comademig-gold/90 transition-colors"
            >
              <Youtube className="w-8 h-8 text-white" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-comademig-gold hover:bg-comademig-gold/90 text-white font-montserrat font-semibold"
            >
              <Phone className="w-5 h-5 mr-2" />
              Ligar Agora
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-comademig-blue font-montserrat font-semibold"
            >
              <Mail className="w-5 h-5 mr-2" />
              Enviar E-mail
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contato;
