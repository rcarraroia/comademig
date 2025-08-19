import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Heart, Play, Building } from "lucide-react";

const Home = () => {
  return <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-comademig-blue to-comademig-blue/90 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="font-montserrat font-bold text-4xl md:text-6xl leading-tight">
              Fortalecendo o Reino de Deus
            </h1>
            <p className="font-inter text-xl md:text-2xl text-gray-200">
              Convenção de Ministros das Assembleias de Deus em Minas Gerais
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button asChild size="lg" className="bg-comademig-gold hover:bg-comademig-gold/90 text-white font-montserrat font-semibold">
                <Link to="/sobre">Conheça a COMADEMIG</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-comademig-blue font-montserrat font-semibold">
                <Link to="/eventos">Ver Eventos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Chamadas Rápidas */}
      <section className="py-16 bg-comademig-light">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-white">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="font-montserrat text-comademig-blue">
                  Inscreva-se
                </CardTitle>
                <CardDescription className="font-inter">
                  Participe dos nossos eventos e congressos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="bg-comademig-blue hover:bg-comademig-blue/90 text-white font-montserrat">
                  <Link to="/eventos">Inscrever-se</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-white">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="font-montserrat text-comademig-blue">Filie-se</CardTitle>
                <CardDescription className="font-inter">Faça seu registro hoje mesmo e se credencie pela COMADEMIG</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="bg-comademig-gold hover:bg-comademig-gold/90 text-white font-montserrat">
                  <Link to="/filiacao">Filie-se</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-white">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center mb-4">
                  <Building className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="font-montserrat text-comademig-blue">
                  Regularização de Igrejas
                </CardTitle>
                <CardDescription className="font-inter">
                  Serviços completos para legalização e documentação de igrejas evangélicas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild size="sm" className="bg-comademig-blue hover:bg-comademig-blue/90 text-white font-montserrat w-full">
                  <Link to="/auth">Fazer Login</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-comademig-gold text-comademig-gold hover:bg-comademig-gold hover:text-white font-montserrat w-full">
                  <Link to="/filiacao">Não sou filiado</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow border-0 bg-white">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center mb-4">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="font-montserrat text-comademig-blue">
                  Assista ao Vivo
                </CardTitle>
                <CardDescription className="font-inter">
                  Acompanhe nossos cultos e eventos online
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="bg-comademig-blue hover:bg-comademig-blue/90 text-white font-montserrat">
                  <Link to="/multimidia">Assistir</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Destaques da Convenção */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
              Destaques da Convenção
            </h2>
            <p className="font-inter text-gray-600 text-lg max-w-2xl mx-auto">
              Acompanhe os principais eventos e realizações da COMADEMIG
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-500 font-inter">Imagem do Evento</span>
                </div>
                <CardTitle className="font-montserrat text-comademig-blue">
                  Congresso Estadual 2024
                </CardTitle>
                <CardDescription className="font-inter">
                  15 a 17 de Novembro • Belo Horizonte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-inter text-gray-600 mb-4">
                  O maior evento do ano reunindo pastores e líderes de todo o estado de Minas Gerais.
                </p>
                <Button asChild size="sm" className="bg-comademig-gold hover:bg-comademig-gold/90 text-white font-montserrat">
                  <Link to="/eventos">Saiba Mais</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-500 font-inter">Imagem do Evento</span>
                </div>
                <CardTitle className="font-montserrat text-comademig-blue">
                  Encontro de Jovens
                </CardTitle>
                <CardDescription className="font-inter">
                  22 a 24 de Setembro • Uberlândia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-inter text-gray-600 mb-4">
                  Três dias de adoração, pregação e comunhão com jovens de todo o estado.
                </p>
                <Button asChild size="sm" className="bg-comademig-gold hover:bg-comademig-gold/90 text-white font-montserrat">
                  <Link to="/eventos">Saiba Mais</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-500 font-inter">Imagem do Evento</span>
                </div>
                <CardTitle className="font-montserrat text-comademig-blue">
                  Seminário de Liderança
                </CardTitle>
                <CardDescription className="font-inter">
                  5 a 7 de Outubro • Juiz de Fora
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-inter text-gray-600 mb-4">
                  Capacitação e treinamento para líderes e obreiros das igrejas locais.
                </p>
                <Button asChild size="sm" className="bg-comademig-gold hover:bg-comademig-gold/90 text-white font-montserrat">
                  <Link to="/eventos">Saiba Mais</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Notícias Recentes */}
      <section className="py-16 bg-comademig-light">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
                Notícias Recentes
              </h2>
              <p className="font-inter text-gray-600 text-lg">
                Fique por dentro das últimas novidades
              </p>
            </div>
            <Button asChild variant="outline" className="hidden md:flex border-comademig-blue text-comademig-blue hover:bg-comademig-blue hover:text-white font-montserrat">
              <Link to="/noticias">Ver Todas</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow bg-white">
              <CardHeader>
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-500 font-inter">Imagem da Notícia</span>
                </div>
                <CardTitle className="font-montserrat text-comademig-blue line-clamp-2">
                  Nova Diretoria da COMADEMIG é Empossada
                </CardTitle>
                <CardDescription className="font-inter text-sm text-gray-500">
                  Por Pastor João Silva • 2 de Dezembro de 2024
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-inter text-gray-600 mb-4 line-clamp-3">
                  Cerimônia de posse da nova diretoria aconteceu na sede da convenção com a presença de pastores de todo o estado...
                </p>
                <Button asChild size="sm" variant="outline" className="border-comademig-gold text-comademig-gold hover:bg-comademig-gold hover:text-white font-montserrat">
                  <Link to="/noticias">Ler Mais</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow bg-white">
              <CardHeader>
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-500 font-inter">Imagem da Notícia</span>
                </div>
                <CardTitle className="font-montserrat text-comademig-blue line-clamp-2">
                  Campanha de Arrecadação para Obras Sociais
                </CardTitle>
                <CardDescription className="font-inter text-sm text-gray-500">
                  Por Pastor Maria Santos • 28 de Novembro de 2024
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-inter text-gray-600 mb-4 line-clamp-3">
                  A COMADEMIG lança campanha para arrecadação de fundos destinados a obras sociais em comunidades carentes...
                </p>
                <Button asChild size="sm" variant="outline" className="border-comademig-gold text-comademig-gold hover:bg-comademig-gold hover:text-white font-montserrat">
                  <Link to="/noticias">Ler Mais</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow bg-white">
              <CardHeader>
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-500 font-inter">Imagem da Notícia</span>
                </div>
                <CardTitle className="font-montserrat text-comademig-blue line-clamp-2">
                  Parceria com Seminário Teológico
                </CardTitle>
                <CardDescription className="font-inter text-sm text-gray-500">
                  Por Pastor Carlos Oliveira • 25 de Novembro de 2024
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-inter text-gray-600 mb-4 line-clamp-3">
                  Firmada parceria entre a COMADEMIG e o Seminário Teológico das Assembleias de Deus para capacitação ministerial...
                </p>
                <Button asChild size="sm" variant="outline" className="border-comademig-gold text-comademig-gold hover:bg-comademig-gold hover:text-white font-montserrat">
                  <Link to="/noticias">Ler Mais</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8 md:hidden">
            <Button asChild variant="outline" className="border-comademig-blue text-comademig-blue hover:bg-comademig-blue hover:text-white font-montserrat">
              <Link to="/noticias">Ver Todas as Notícias</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-comademig-blue text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-montserrat font-bold text-3xl md:text-4xl mb-4">
            Junte-se à Nossa Missão
          </h2>
          <p className="font-inter text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Seja parte da obra de Deus em Minas Gerais. Conecte-se conosco e fortaleça o Reino.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-comademig-gold hover:bg-comademig-gold/90 text-white font-montserrat font-semibold">
              <Link to="/contato">Entre em Contato</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-comademig-blue font-montserrat font-semibold">
              <Link to="/sobre">Saiba Mais</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>;
};

export default Home;
