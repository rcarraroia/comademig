import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Heart, Play, Building, Loader2 } from "lucide-react";
import { useHomeContent } from "@/hooks/useContent";

const Home = () => {
  const { content, isLoading, error, hasCustomContent } = useHomeContent();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-comademig-blue" />
      </div>
    );
  }

  if (error) {
    console.error('Erro ao carregar conteúdo da home:', error);
    // Continua com conteúdo padrão em caso de erro
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-comademig-blue to-comademig-blue/90 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="font-montserrat font-bold text-4xl md:text-6xl leading-tight">
              {content.banner_principal.titulo_principal}
            </h1>
            <p className="font-inter text-xl md:text-2xl text-gray-200">
              {content.banner_principal.subtitulo}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button asChild size="lg" className="bg-comademig-gold hover:bg-comademig-gold/90 text-white font-montserrat font-semibold">
                <Link to={content.banner_principal.link_botao}>{content.banner_principal.texto_botao}</Link>
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
            {content.cards_acao.map((card: any, index: number) => {
              const icons = [Users, Heart, Building, Play];
              const IconComponent = icons[index] || Users;
              
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow border-0 bg-white">
                  <CardHeader>
                    <div className="mx-auto w-16 h-16 bg-comademig-gold rounded-full flex items-center justify-center mb-4">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="font-montserrat text-comademig-blue">
                      {card.titulo}
                    </CardTitle>
                    <CardDescription className="font-inter">
                      {card.descricao}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="bg-comademig-blue hover:bg-comademig-blue/90 text-white font-montserrat">
                      <Link to={card.link_botao}>Acessar</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Destaques da Convenção */}
      {content.destaques_convencao && content.destaques_convencao.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
                Destaques da Convenção
              </h2>
              <p className="font-inter text-lg text-gray-600 max-w-2xl mx-auto">
                Acompanhe as principais atividades e eventos da COMADEMIG
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {content.destaques_convencao.map((destaque: any, index: number) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  {destaque.imagem && (
                    <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                      <img 
                        src={destaque.imagem} 
                        alt={destaque.titulo}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="font-montserrat text-comademig-blue">
                      {destaque.titulo}
                    </CardTitle>
                    <CardDescription className="font-inter">
                      {destaque.descricao}
                    </CardDescription>
                  </CardHeader>
                  {destaque.link && (
                    <CardContent>
                      <Button asChild variant="outline" className="w-full">
                        <Link to={destaque.link}>Saiba Mais</Link>
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Notícias Recentes */}
      {content.noticias_recentes && content.noticias_recentes.length > 0 && (
        <section className="py-16 bg-comademig-light">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-montserrat font-bold text-3xl md:text-4xl text-comademig-blue mb-4">
                Notícias Recentes
              </h2>
              <p className="font-inter text-lg text-gray-600 max-w-2xl mx-auto">
                Fique por dentro das últimas novidades da COMADEMIG
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {content.noticias_recentes.slice(0, 3).map((noticia: any, index: number) => (
                <Card key={index} className="hover:shadow-lg transition-shadow bg-white">
                  {noticia.imagem && (
                    <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                      <img 
                        src={noticia.imagem} 
                        alt={noticia.titulo}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Calendar className="w-4 h-4" />
                      {noticia.data && new Date(noticia.data).toLocaleDateString('pt-BR')}
                    </div>
                    <CardTitle className="font-montserrat text-comademig-blue">
                      {noticia.titulo}
                    </CardTitle>
                    <CardDescription className="font-inter">
                      {noticia.resumo}
                    </CardDescription>
                  </CardHeader>
                  {noticia.link && (
                    <CardContent>
                      <Button asChild variant="outline" className="w-full">
                        <Link to={noticia.link}>Ler Mais</Link>
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button asChild variant="outline" size="lg">
                <Link to="/noticias">Ver Todas as Notícias</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Call to Action Final */}
      <section className="py-20 bg-gradient-to-r from-comademig-blue to-comademig-blue/90 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="font-montserrat font-bold text-3xl md:text-5xl">
              {content.junte_se_missao.titulo_principal}
            </h2>
            <p className="font-inter text-xl md:text-2xl text-gray-200">
              {content.junte_se_missao.subtitulo}
            </p>
            <div className="pt-8">
              <Button asChild size="lg" className="bg-comademig-gold hover:bg-comademig-gold/90 text-white font-montserrat font-semibold">
                <Link to={content.junte_se_missao.link_botao}>{content.junte_se_missao.texto_botao}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Indicador de conteúdo personalizado (apenas para admins) */}
      {hasCustomContent && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            Conteúdo Personalizado
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;